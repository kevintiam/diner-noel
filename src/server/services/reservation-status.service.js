import { updateReservationStatus } from "../db/reservation.repository.js";
import { AppError } from "../errors/app-error.js";

// Les seules transitions de l'AD-4. Les décisions organisateurs restent hors de ce dépôt.
// Une réservation confirmée est définitive : elle ne peut plus être annulée (17 novembre 2026).
/** @type {Readonly<Record<import('../db/reservation-admin.repository.js').ReservationStatusCode, readonly import('../db/reservation-admin.repository.js').ReservationStatusCode[]>>} */
export const RESERVATION_TRANSITIONS = Object.freeze({
  PENDING_PAYMENT: Object.freeze(/** @type {const} */ (["TO_VERIFY", "CANCELLED"])),
  TO_VERIFY: Object.freeze(/** @type {const} */ (["CONFIRMED", "PENDING_PAYMENT", "CANCELLED"])),
  CONFIRMED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
});

/**
 * Change le statut seulement si l'état attendu est encore en base.
 * @param {import("../db/transaction.js").TransactionClient} tx La transaction.
 * @param {{ reservationId: string, from: import('../db/reservation-admin.repository.js').ReservationStatusCode, to: import('../db/reservation-admin.repository.js').ReservationStatusCode }} transition La transition attendue.
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
