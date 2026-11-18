// Échecs d'envoi des courriels au participant (architecture AD-10) : types et validation
// de la demande « J'ai prévenu la personne ». Les messages sont des clés de dictionnaire (AD-3).
import { z } from "zod";
import { validateWith } from "./field-errors.js";

// Les identifiants Prisma (cuid) font 25 caractères : la borne écarte une saisie abusive.
const RESERVATION_ID_MAX_LENGTH = 64;

export const EMAIL_KINDS = /** @type {const} */ (["RECEIPT", "CONFIRMATION", "REFUSAL"]);

/** @typedef {"RECEIPT" | "CONFIRMATION" | "REFUSAL"} EmailKind */

/**
 * Échec encore à traiter, tel que la fiche d'une réservation l'affiche.
 * @typedef {object} OpenEmailFailure
 * @property {string} id
 * @property {EmailKind} kind
 * @property {Date} createdAt
 */

/**
 * Réservation concernée par un échec, telle que la vue d'ensemble la présente.
 * @typedef {object} EmailFailureReservation
 * @property {string} id
 * @property {string} code
 * @property {string} firstName
 * @property {string} lastName
 */

/**
 * Échec encore à traiter, avec sa réservation, pour la vue d'ensemble.
 * @typedef {OpenEmailFailure & { reservation: EmailFailureReservation }} OpenEmailFailureWithReservation
 */

const resolutionSchema = z.object({
  reservationId: z
    .string({ error: "validation.decisionInvalid" })
    .trim()
    .min(1, { error: "validation.decisionInvalid" })
    .max(RESERVATION_ID_MAX_LENGTH, { error: "validation.decisionInvalid" }),
});

/**
 * Valide la réservation dont un organisateur a prévenu le participant.
 * @param {unknown} raw Les valeurs reçues du formulaire.
 * @returns {{ success: true, data: { reservationId: string } } | { success: false, fieldErrors: import("./field-errors.js").FieldError[] }}
 *   L'identifiant nettoyé, ou une erreur par champ fautif.
 */
export function validateEmailFailureResolution(raw) {
  return validateWith(resolutionSchema, raw);
}
