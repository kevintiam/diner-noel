// Compteurs affichés en haut du tableau de bord, calculés à partir de la liste déjà lue.

/** @typedef {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} ReservationStatus */
/** @typedef {{ count: number, seats: number, amountCents: number }} StatusTotals */

/**
 * Compte les réservations, leurs places et leurs montants pour chaque statut.
 * Un statut inconnu est ignoré plutôt que de fausser un compteur.
 * @param {Array<{ status: string, seats: number, amountCents: number }>} reservations Les réservations lues.
 * @returns {Record<ReservationStatus, StatusTotals>} Les totaux par statut.
 */
export function summarizeReservations(reservations) {
  /** @type {Record<string, StatusTotals>} */
  const summary = {
    PENDING_PAYMENT: { count: 0, seats: 0, amountCents: 0 },
    TO_VERIFY: { count: 0, seats: 0, amountCents: 0 },
    CONFIRMED: { count: 0, seats: 0, amountCents: 0 },
    CANCELLED: { count: 0, seats: 0, amountCents: 0 },
  };
  for (const reservation of reservations) {
    if (!Object.hasOwn(summary, reservation.status)) {
      continue;
    }
    summary[reservation.status].count += 1;
    summary[reservation.status].seats += reservation.seats;
    summary[reservation.status].amountCents += reservation.amountCents;
  }
  return /** @type {Record<ReservationStatus, StatusTotals>} */ (summary);
}
