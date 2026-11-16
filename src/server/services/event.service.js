// Règles métier de l'événement vu par le public.
import { getEvent } from "../db/event.repository.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { AppError } from "../errors/app-error.js";

/** @typedef {import("../../validation/event.schema.js").EventOverview} EventOverview */

/**
 * Rassemble ce que l'accueil affiche : l'événement et ses places restantes.
 * @returns {Promise<EventOverview>} L'aperçu de l'événement.
 * @throws {AppError} 500 `EVENT_NOT_CONFIGURED` si aucun événement n'existe en base.
 */
export async function getEventOverview() {
  const event = await getEvent();
  if (!event) {
    throw new AppError(500, "EVENT_NOT_CONFIGURED", "errors.internal");
  }
  const takenSeats = await sumTakenSeats();
  return {
    startsAt: event.startsAt,
    bookingDeadline: event.bookingDeadline,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    unitPriceCents: event.unitPriceCents,
    capacity: event.capacity,
    // Jamais négatif, même si la capacité a été baissée par erreur sous les places prises.
    seatsLeft: Math.max(event.capacity - takenSeats, 0),
  };
}
