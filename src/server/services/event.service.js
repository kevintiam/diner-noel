// Règles métier de l'événement vu par le public.
import { getEvent } from "../db/event.repository.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { AppError } from "../errors/app-error.js";
import { getEffectiveUnitPrice } from "./event-pricing.service.js";

/** @typedef {import("../../validation/event.schema.js").EventOverview} EventOverview */

/**
 * Rassemble ce que l'accueil et le formulaire affichent : l'événement, ses places
 * restantes et l'état des réservations (ouvertes, complètes ou fermées).
 * @param {Date} now L'instant de la requête (architecture AD-12).
 * @returns {Promise<EventOverview>} L'aperçu de l'événement.
 * @throws {AppError} 500 `EVENT_NOT_CONFIGURED` si aucun événement n'existe en base.
 */
export async function getEventOverview(now) {
  const event = await getEvent();
  if (!event) {
    throw new AppError(500, "EVENT_NOT_CONFIGURED", "errors.internal");
  }
  const takenSeats = await sumTakenSeats();
  // Jamais négatif, même si la capacité a été baissée par erreur sous les places prises.
  const seatsLeft = Math.max(event.capacity - takenSeats, 0);
  const isClosedByDeadline = now >= event.bookingDeadline;
  return {
    startsAt: event.startsAt,
    bookingDeadline: event.bookingDeadline,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    unitPriceCents: getEffectiveUnitPrice(event, now),
    normalUnitPriceCents: event.unitPriceCents,
    promotionalUnitPriceCents: event.promotionalUnitPriceCents ?? null,
    promotionStartsAt: event.promotionStartsAt ?? null,
    promotionEndsAt: event.promotionEndsAt ?? null,
    capacity: event.capacity,
    // Le seul calcul des places prises (AD-4), transmis tel quel à l'affichage.
    takenSeats,
    seatsLeft,
    isClosedByDeadline,
    isBookingOpen: !isClosedByDeadline && seatsLeft > 0,
  };
}
