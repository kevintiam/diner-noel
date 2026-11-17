// Filtre de la liste des réservations déjà lue : par statut et par texte libre.
// La recherche ignore les majuscules et les accents (« helene » trouve « Hélène »).

/** @typedef {import("@/validation/reservation-filter.schema").ReservationListFilter} ReservationListFilter */

/**
 * Met un texte en minuscules et sans accents, pour comparer sans se soucier de la saisie.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  // NFD sépare « é » en « e » + accent ; la plage U+0300–U+036F retire les accents seuls.
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Indique si une réservation contient le texte cherché dans son nom, son courriel ou son code.
 * @param {{ firstName: string, lastName: string, code: string, email?: string }} reservation
 * @param {string} normalizedQuery Le texte cherché, déjà normalisé.
 * @returns {boolean}
 */
function matchesQuery(reservation, normalizedQuery) {
  const searchable = `${reservation.firstName} ${reservation.lastName} ${reservation.email ?? ""} ${reservation.code}`;
  return normalizeText(searchable).includes(normalizedQuery);
}

/**
 * Garde les réservations qui ont le statut demandé et contiennent le texte cherché.
 * @template {{ status: string, firstName: string, lastName: string, code: string, email?: string }} T
 * @param {T[]} reservations Les réservations lues, dans l'ordre d'affichage.
 * @param {ReservationListFilter} filter Le statut (null pour tous) et le texte cherché ("" pour aucun).
 * @returns {T[]} Les réservations retenues, dans le même ordre.
 */
export function filterReservations(reservations, { status, query }) {
  const normalizedQuery = normalizeText(query.trim());
  /** @type {T[]} */
  const matches = [];
  for (const reservation of reservations) {
    if (status !== null && reservation.status !== status) {
      continue;
    }
    if (normalizedQuery !== "" && !matchesQuery(reservation, normalizedQuery)) {
      continue;
    }
    matches.push(reservation);
  }
  return matches;
}
