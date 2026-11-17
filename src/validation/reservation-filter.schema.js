// Filtres de la liste des réservations du tableau de bord, lus dans l'adresse
// (`/admin/reservations?status=TO_VERIFY&q=noel`). Une valeur invalide est ignorée
// plutôt que de casser la page : la liste s'affiche alors sans ce filtre.
import { z } from "zod";

export const RESERVATION_STATUSES = /** @type {const} */ ([
  "TO_VERIFY",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
]);
// Assez pour un nom complet ou un courriel ; un texte plus long est coupé.
export const SEARCH_MAX_LENGTH = 80;

/** @typedef {typeof RESERVATION_STATUSES[number]} ReservationStatus */

/**
 * Filtres de la liste, une fois validés.
 * @typedef {object} ReservationListFilter
 * @property {ReservationStatus | null} status Le statut demandé, ou null pour tous.
 * @property {string} query Le texte recherché, sans espaces autour ("" pour aucun).
 */

const filterSchema = z.object({
  status: z.enum(RESERVATION_STATUSES).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .transform((text) => text.slice(0, SEARCH_MAX_LENGTH))
    .optional()
    .catch(undefined),
});

/** @type {ReservationListFilter} */
const NO_FILTER = { status: null, query: "" };

/**
 * Valide les paramètres de l'adresse de la liste des réservations.
 * @param {unknown} searchParams Les paramètres reçus par la page (valeurs texte, listes ou absentes).
 * @returns {ReservationListFilter} Les filtres à appliquer ; aucun filtre si rien n'est valide.
 */
export function parseReservationListFilter(searchParams) {
  const result = filterSchema.safeParse(searchParams ?? {});
  if (!result.success) {
    return NO_FILTER;
  }
  return { status: result.data.status ?? null, query: result.data.q ?? "" };
}
