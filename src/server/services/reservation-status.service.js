import { updateReservationStatus } from "../db/reservation.repository.js";
import { AppError } from "../errors/app-error.js";

// Les seules transitions de l'AD-4. Les décisions organisateurs restent hors de ce dépôt.
export const RESERVATION_TRANSITIONS = Object.freeze({
  PENDING_PAYMENT: Object.freeze(["TO_VERIFY", "CANCELLED"]),
  TO_VERIFY: Object.freeze(["CONFIRMED", "PENDING_PAYMENT", "CANCELLED"]),
  CONFIRMED: Object.freeze(["CANCELLED"]),
  CANCELLED: Object.freeze([]),
});

/**
 * Change le statut seulement si l'état attendu est encore en base.
 * @param {import("../db/transaction.js").TransactionClient} tx La transaction.
 * @param {{ reservationId: string, from: string, to: string }} transition La transition attendue.
 * @returns {Promise<void>} La transition appliquée.
 */
export async function transitionReservationStatus(tx, { reservationId, from, to }) {
  if (!RESERVATION_TRANSITIONS[from]?.includes(to)) {
    throw new AppError(409, "RESERVATION_STATUS_CHANGED", "errors.reservationStatusChanged");
  }
  if ((await updateReservationStatus(tx, reservationId, from, to)) !== 1) {
    throw new AppError(409, "RESERVATION_STATUS_CHANGED", "errors.reservationStatusChanged");
  }
}
