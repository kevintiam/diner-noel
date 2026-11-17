// Paramètres de l'événement modifiés par les organisateurs (architecture AD-14, maquette 8).
// C'est le seul service qui change la ligne Event ; les réservations existantes gardent
// leur prix et leur adresse Interac figés (AD-6). Les heures saisies sont celles d'Ottawa (AD-12).
import { addDaysToLocalDate, localDateTimeToUtc, utcToLocalDateTime } from "../../lib/dates.js";
import {
  BOOKING_DEADLINE_LOCAL_TIME,
  centsToPriceInput,
  validateEventSettings,
} from "../../validation/event-settings.schema.js";
import { findEventById, getEvent, lockEvent, updateEvent } from "../db/event.repository.js";
import { countActiveReservations } from "../db/reservation-admin.repository.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { runInTransaction } from "../db/transaction.js";
import { AppError } from "../errors/app-error.js";

/** @typedef {import("../../validation/event-settings.schema.js").EventSettingsFormValues} EventSettingsFormValues */
/** @typedef {import("../../validation/event-settings.schema.js").PromotionInput} PromotionInput */
/** @typedef {import("../../validation/field-errors.js").FieldError} FieldError */

/**
 * Ce que l'écran Paramètres affiche.
 * @typedef {object} EventSettingsView
 * @property {EventSettingsFormValues} values Les valeurs actuelles, au format des champs.
 * @property {number} takenSeats Places déjà prises : le minimum du nombre de places.
 * @property {number} activeReservations Réservations non annulées, qui gardent leur prix.
 */

// Une journée de promo commence à minuit, heure d'Ottawa.
const DAY_START_LOCAL_TIME = "00:00";
const ONE_MILLISECOND = 1;

/**
 * Écrit la promo stockée au format des champs : prix, premier jour et dernier jour inclus.
 * La base garde une fin exclue (minuit du lendemain) : le dernier jour est la veille de cette fin.
 * @param {{ promotionalUnitPriceCents?: number | null, promotionStartsAt?: Date | null, promotionEndsAt?: Date | null }} event
 * @returns {Pick<EventSettingsFormValues, "hasPromotion" | "promotionalUnitPrice" | "promotionStartDate" | "promotionEndDate">}
 */
function toPromotionValues(event) {
  const { promotionalUnitPriceCents, promotionStartsAt, promotionEndsAt } = event;
  if (
    typeof promotionalUnitPriceCents !== "number" ||
    !(promotionStartsAt instanceof Date) ||
    !(promotionEndsAt instanceof Date)
  ) {
    return {
      hasPromotion: false,
      promotionalUnitPrice: "",
      promotionStartDate: "",
      promotionEndDate: "",
    };
  }
  return {
    hasPromotion: true,
    promotionalUnitPrice: centsToPriceInput(promotionalUnitPriceCents),
    promotionStartDate: utcToLocalDateTime(promotionStartsAt).date,
    promotionEndDate: utcToLocalDateTime(new Date(promotionEndsAt.getTime() - ONE_MILLISECOND))
      .date,
  };
}

/**
 * Prépare la promo pour la base : début inclus à minuit du premier jour, fin exclue à minuit
 * du lendemain du dernier jour (heure d'Ottawa). Sans promo, les trois valeurs sont effacées.
 * @param {PromotionInput | null} promotion
 * @returns {{ promotionalUnitPriceCents: number | null, promotionStartsAt: Date | null, promotionEndsAt: Date | null }}
 */
function toStoredPromotion(promotion) {
  if (!promotion) {
    return { promotionalUnitPriceCents: null, promotionStartsAt: null, promotionEndsAt: null };
  }
  return {
    promotionalUnitPriceCents: promotion.unitPriceCents,
    promotionStartsAt: localDateTimeToUtc(promotion.startDate, DAY_START_LOCAL_TIME),
    promotionEndsAt: localDateTimeToUtc(
      addDaysToLocalDate(promotion.endDate, 1),
      DAY_START_LOCAL_TIME,
    ),
  };
}

/** @returns {AppError} */
function eventNotConfigured() {
  return new AppError(500, "EVENT_NOT_CONFIGURED", "errors.internal");
}

/**
 * @param {FieldError[]} fieldErrors
 * @returns {AppError}
 */
function invalidSettings(fieldErrors) {
  return new AppError(400, "VALIDATION_ERROR", "errors.validation", fieldErrors);
}

/**
 * Lit les paramètres actuels pour remplir l'écran Paramètres.
 * @returns {Promise<EventSettingsView>} Les valeurs et les repères affichés sous les champs.
 * @throws {AppError} 500 `EVENT_NOT_CONFIGURED` si l'événement n'existe pas encore.
 */
export async function getEventSettings() {
  const event = await getEvent();
  if (!event) {
    throw eventNotConfigured();
  }
  const [takenSeats, activeReservations] = await Promise.all([
    sumTakenSeats(),
    countActiveReservations(),
  ]);
  const startsAt = utcToLocalDateTime(event.startsAt);
  return {
    values: {
      startsAtDate: startsAt.date,
      startsAtTime: startsAt.time,
      bookingDeadlineDate: utcToLocalDateTime(event.bookingDeadline).date,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      capacity: String(event.capacity),
      unitPrice: centsToPriceInput(event.unitPriceCents),
      ...toPromotionValues(event),
      interacEmail: event.interacEmail,
    },
    takenSeats,
    activeReservations,
  };
}

/**
 * Enregistre les paramètres de l'événement, prix normal et promo compris (la promo est
 * effacée si la case est décochée), après avoir vérifié les règles de l'AD-14 :
 * la date limite tombe avant le dîner, et le nombre de places ne descend pas sous les places
 * prises (vérifié sous le verrou de l'événement, AD-5). Changer l'adresse Interac exige de
 * confirmer son dépôt automatique ; changer la date du dîner relance l'alerte (AD-13).
 * @param {unknown} raw Les valeurs du formulaire, validées ici.
 * @returns {Promise<void>}
 * @throws {AppError} 400 `VALIDATION_ERROR` avec le champ fautif ; 500 `EVENT_NOT_CONFIGURED`.
 */
export async function updateEventSettings(raw) {
  const validation = validateEventSettings(raw);
  if (!validation.success) {
    throw invalidSettings(validation.fieldErrors);
  }
  const settings = validation.data;
  const startsAt = localDateTimeToUtc(settings.startsAtDate, settings.startsAtTime);
  const bookingDeadline = localDateTimeToUtc(
    settings.bookingDeadlineDate,
    BOOKING_DEADLINE_LOCAL_TIME,
  );
  if (bookingDeadline >= startsAt) {
    throw invalidSettings([
      { field: "bookingDeadlineDate", messageKey: "validation.deadlineAfterEvent" },
    ]);
  }

  await runInTransaction(async (transaction) => {
    const locked = await lockEvent(transaction);
    const current = locked ? await findEventById(transaction, locked.id) : null;
    if (!current) {
      throw eventNotConfigured();
    }
    const takenSeats = await sumTakenSeats(transaction);
    /** @type {FieldError[]} */
    const fieldErrors = [];
    if (settings.capacity < takenSeats) {
      fieldErrors.push({ field: "capacity", messageKey: "validation.capacityBelowTaken" });
    }
    const isNewInteracEmail = settings.interacEmail !== current.interacEmail.toLowerCase();
    if (isNewInteracEmail && !settings.autoDepositConfirmed) {
      fieldErrors.push({
        field: "autoDepositConfirmed",
        messageKey: "validation.autoDepositRequired",
      });
    }
    if (fieldErrors.length > 0) {
      throw invalidSettings(fieldErrors);
    }
    const isNewDate = startsAt.getTime() !== current.startsAt.getTime();
    await updateEvent(transaction, current.id, {
      startsAt,
      bookingDeadline,
      capacity: settings.capacity,
      unitPriceCents: settings.unitPriceCents,
      ...toStoredPromotion(settings.promotion),
      venueName: settings.venueName,
      venueAddress: settings.venueAddress,
      interacEmail: settings.interacEmail,
      ...(isNewDate ? { alertSentAt: null } : {}),
    });
  });
}
