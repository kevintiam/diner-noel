// Validation d'une décision d'organisateur sur une réservation (architecture AD-4).
// Les messages sont des clés de dictionnaire, jamais des phrases (architecture AD-3).
import { z } from "zod";
import { validateWith } from "./field-errors.js";

// Les identifiants Prisma (cuid) font 25 caractères : la borne écarte une saisie abusive.
const RESERVATION_ID_MAX_LENGTH = 64;

export const DECISIONS = /** @type {const} */ (["confirm", "refuse", "cancel"]);
export const REFUSAL_REASONS = /** @type {const} */ ([
  "NO_TRANSFER",
  "INCOMPLETE_AMOUNT",
  "UNREADABLE_PROOF",
]);

/**
 * Décision validée. Le motif n'existe que pour un refus.
 * @typedef {object} ReservationDecisionInput
 * @property {string} reservationId
 * @property {"confirm" | "refuse" | "cancel"} decision
 * @property {"NO_TRANSFER" | "INCOMPLETE_AMOUNT" | "UNREADABLE_PROOF" | null} reasonCode
 */

/**
 * Valeurs d'une réservation dont le courriel de décision a besoin, figées à la création (AD-6).
 * @typedef {object} ReservationForDecisionEmail
 * @property {string} id Identifiant interne, pour le journal confidentiel seulement.
 * @property {string} code
 * @property {string} token
 * @property {string} firstName
 * @property {string} email
 * @property {"FR" | "EN"} language Langue enregistrée à la réservation.
 * @property {number} seats
 * @property {number} childSeats
 * @property {number} amountCents
 * @property {string} interacEmail
 */

/**
 * Valeurs de l'événement reprises dans le courriel de confirmation.
 * @typedef {object} EventForEmail
 * @property {Date} startsAt
 * @property {string} venueName
 * @property {string} venueAddress
 */

/**
 * Résultat d'une décision. `emailSent` vaut null quand la décision n'envoie aucun courriel.
 * @typedef {object} DecisionResult
 * @property {string} id
 * @property {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 * @property {boolean | null} emailSent
 */

const decisionSchema = z
  .object({
    reservationId: z
      .string({ error: "validation.decisionInvalid" })
      .trim()
      .min(1, { error: "validation.decisionInvalid" })
      .max(RESERVATION_ID_MAX_LENGTH, { error: "validation.decisionInvalid" }),
    decision: z.enum(DECISIONS, { error: "validation.decisionInvalid" }),
    reasonCode: z.enum(REFUSAL_REASONS, { error: "validation.refusalReasonRequired" }).optional(),
  })
  .superRefine((input, context) => {
    if (input.decision === "refuse" && !input.reasonCode) {
      context.addIssue({
        code: "custom",
        path: ["reasonCode"],
        message: "validation.refusalReasonRequired",
      });
    }
  })
  .transform(({ reservationId, decision, reasonCode }) => ({
    reservationId,
    decision,
    reasonCode: decision === "refuse" ? (reasonCode ?? null) : null,
  }));

/**
 * Valide une décision reçue du tableau de bord.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: ReservationDecisionInput } | { success: false, fieldErrors: import("./field-errors.js").FieldError[] }}
 *   La décision nettoyée, ou une erreur par champ fautif.
 */
export function validateReservationDecision(raw) {
  return validateWith(decisionSchema, raw);
}
