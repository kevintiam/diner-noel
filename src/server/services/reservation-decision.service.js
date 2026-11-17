// Décisions des organisateurs sur une réservation : confirmer, refuser ou annuler (architecture AD-4).
// Le statut change par le seul service des transitions, l'historique s'écrit dans la même
// transaction (AD-5), puis le participant reçoit son courriel après le commit (AD-10).
import { validateReservationDecision } from "../../validation/reservation-decision.schema.js";
import {
  findReservationForDecisionEmail,
  findReservationStatus,
  markReservationConfirmed,
  recordDecision,
} from "../db/reservation-admin.repository.js";
import { runInTransaction } from "../db/transaction.js";
import { AppError } from "../errors/app-error.js";
import {
  sendReservationConfirmation,
  sendReservationRefusal,
} from "./reservation-decision-email.service.js";
import { transitionReservationStatus } from "./reservation-status.service.js";

/** @typedef {import("../../validation/reservation-decision.schema.js").DecisionResult} DecisionResult */

/**
 * Statut visé et type enregistré pour chaque décision. Les statuts de départ permis
 * sont ceux de la table de l'AD-4 : confirmer et refuser ne partent que de « À vérifier ».
 * @type {Record<"confirm" | "refuse" | "cancel", { to: "CONFIRMED" | "PENDING_PAYMENT" | "CANCELLED", type: "CONFIRM" | "REFUSE" | "CANCEL" }>}
 */
const DECISION_EFFECTS = {
  confirm: { to: "CONFIRMED", type: "CONFIRM" },
  refuse: { to: "PENDING_PAYMENT", type: "REFUSE" },
  cancel: { to: "CANCELLED", type: "CANCEL" },
};

/**
 * Applique la décision d'un organisateur, puis prévient le participant.
 * Un refus remet la réservation en attente de paiement sans libérer ses places ;
 * une annulation libère les places sans aucun courriel (brief §6).
 * @param {unknown} input La décision reçue du formulaire, validée ici.
 * @param {{ organizerId: string, now: Date }} context L'organisateur connecté et l'instant de la décision.
 * @returns {Promise<DecisionResult>} Le nouveau statut, et si le courriel est parti (null s'il n'y en a pas).
 * @throws {AppError} 400 `VALIDATION_ERROR` ; 404 `RESERVATION_NOT_FOUND` ;
 *   409 `RESERVATION_STATUS_CHANGED` si la réservation a changé ou si la décision n'a plus de sens.
 */
export async function decideReservation(input, { organizerId, now }) {
  const validation = validateReservationDecision(input);
  if (!validation.success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
  }
  const { reservationId, decision, reasonCode } = validation.data;
  const effect = DECISION_EFFECTS[decision];

  const reservation = await runInTransaction(async (transaction) => {
    const current = await findReservationStatus(transaction, reservationId);
    if (!current) {
      throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
    }
    await transitionReservationStatus(transaction, {
      reservationId,
      from: current.status,
      to: effect.to,
    });
    if (decision === "confirm") {
      await markReservationConfirmed(transaction, reservationId, now);
    }
    await recordDecision(transaction, {
      reservationId,
      type: effect.type,
      organizerId,
      reasonCode,
      createdAt: now,
    });
    return findReservationForDecisionEmail(transaction, reservationId);
  });

  /** @type {boolean | null} */
  let emailSent = null;
  if (decision === "confirm") {
    emailSent = await sendReservationConfirmation(reservation);
  } else if (decision === "refuse" && reasonCode) {
    emailSent = await sendReservationRefusal(reservation, reasonCode);
  }
  return { id: reservationId, status: effect.to, emailSent };
}
