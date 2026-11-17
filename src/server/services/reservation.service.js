// Règles métier de la réservation : places, fermeture, code, montant figé
// (architecture AD-4, AD-5, AD-6, AD-7).
import { lockEvent } from "../db/event.repository.js";
import {
  findReservationByToken,
  insertReservation,
  isCodeTaken,
  sumTakenSeats,
} from "../db/reservation.repository.js";
import { runInTransaction } from "../db/transaction.js";
import {
  isValidPersonalToken,
  validateReservationInput,
} from "../../validation/reservation.schema.js";
import { AppError } from "../errors/app-error.js";
import { generatePersonalToken, generateReservationCode } from "./reservation-identifiers.js";
import { getEffectiveUnitPrice } from "./event-pricing.service.js";
import { sendReservationReceipt } from "./reservation-receipt.service.js";

// 9 000 codes possibles pour une centaine de réservations : 20 essais suffisent largement.
const MAX_CODE_ATTEMPTS = 20;

/** @typedef {import("../../validation/reservation.schema.js").ReservationInput} ReservationInput */
/** @typedef {import("../../validation/reservation.schema.js").ReservationForPayment} ReservationForPayment */
/** @typedef {import("../db/transaction.js").TransactionClient} TransactionClient */

/**
 * Tire un code de réservation libre. Sans risque de doublon : toutes les créations
 * passent l'une après l'autre grâce au verrou de l'événement.
 * @param {TransactionClient} transaction La transaction en cours.
 * @returns {Promise<string>} Un code libre.
 * @throws {AppError} 500 `RESERVATION_CODE_EXHAUSTED` si aucun code libre n'est trouvé.
 */
async function pickFreeCode(transaction) {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateReservationCode();
    if (!(await isCodeTaken(transaction, code))) {
      return code;
    }
  }
  throw new AppError(500, "RESERVATION_CODE_EXHAUSTED", "errors.internal");
}

/**
 * Crée une réservation en attente de paiement, sans jamais dépasser les places.
 * @param {ReservationInput} input La demande validée.
 * @param {{ lang: string, now: Date }} options La langue de la page et l'instant de la demande.
 * @returns {Promise<{ code: string, token: string }>} Le code et le jeton du lien personnel.
 * @throws {AppError} 409 `BOOKING_CLOSED`, `SOLD_OUT` ou `NOT_ENOUGH_SEATS` ; 500 sans événement.
 */
export async function createReservation(input, { lang, now }) {
  const validation = validateReservationInput(input);
  if (!validation.success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
  }
  input = validation.data;
  const seats = input.adultSeats + input.childSeats;
  const reservation = await runInTransaction(async (transaction) => {
    const event = await lockEvent(transaction);
    if (!event) {
      throw new AppError(500, "EVENT_NOT_CONFIGURED", "errors.internal");
    }
    if (now >= event.bookingDeadline) {
      throw new AppError(409, "BOOKING_CLOSED", "errors.bookingClosed");
    }
    const seatsLeft = event.capacity - (await sumTakenSeats(transaction));
    if (seatsLeft <= 0) {
      throw new AppError(409, "SOLD_OUT", "errors.soldOut");
    }
    if (seats > seatsLeft) {
      throw new AppError(409, "NOT_ENOUGH_SEATS", "errors.notEnoughSeats");
    }
    const unitPriceCents = getEffectiveUnitPrice(event, now);
    const amountCents = input.adultSeats * unitPriceCents;
    return insertReservation(transaction, {
      code: await pickFreeCode(transaction),
      token: generatePersonalToken(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      seats,
      childSeats: input.childSeats,
      status: amountCents === 0 ? "CONFIRMED" : "PENDING_PAYMENT",
      confirmedAt: amountCents === 0 ? now : null,
      note: input.note,
      language: lang,
      // Prix et courriel Interac copiés : un changement de paramètre ne touche pas cette réservation.
      unitPriceCents,
      amountCents,
      interacEmail: event.interacEmail,
    });
  });
  // La résolution confirme le commit : aucun verrou n'est retenu pendant le SMTP.
  await sendReservationReceipt(reservation);
  return { code: reservation.code, token: reservation.token };
}

/**
 * Lit ce que la page de paiement affiche, à partir du lien personnel.
 * Un jeton qui n'a pas la forme attendue (validée par Zod) ne touche jamais la base.
 * @param {unknown} token Le jeton lu dans l'adresse.
 * @returns {Promise<ReservationForPayment | null>} La réservation, ou null si le lien est invalide ou inconnu.
 */
export async function getReservationForPayment(token) {
  if (!isValidPersonalToken(token)) {
    return null;
  }
  return findReservationByToken(/** @type {string} */ (token));
}
