// Courriels envoyés au participant après la décision d'un organisateur (architecture AD-10) :
// toujours après le commit, et un échec ne défait jamais la décision.
import { getEmailEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { getEvent } from "../db/event.repository.js";
import { sendEmail } from "../email/send-email.js";
import { buildReservationConfirmation } from "../email/templates/reservation-confirmation.js";
import { buildReservationRefusal } from "../email/templates/reservation-refusal.js";

/** @typedef {import("../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} ReservationForDecisionEmail */

/**
 * Lit l'événement dont le courriel reprend la date et le lieu.
 * @returns {Promise<import("../../validation/reservation-decision.schema.js").EventForEmail>}
 * @throws {Error} Si l'événement n'existe pas encore.
 */
async function readEventForEmail() {
  const event = await getEvent();
  if (!event) {
    throw new Error("Événement introuvable.");
  }
  return event;
}

/**
 * Envoie la confirmation de paiement dans la langue de la réservation.
 * @param {ReservationForDecisionEmail} reservation La réservation confirmée.
 * @returns {Promise<boolean>} Vrai si le serveur SMTP a accepté le message ; faux sinon, sans lancer d'erreur.
 */
export async function sendReservationConfirmation(reservation) {
  try {
    getEmailEnv();
    const event = await readEventForEmail();
    await sendEmail(buildReservationConfirmation(reservation, event));
    return true;
  } catch {
    logger.error("reservation_confirmation_failed", { reservationId: reservation.id });
    return false;
  }
}

/**
 * Envoie l'avis de refus, avec son motif et le lien personnel, dans la langue de la réservation.
 * @param {ReservationForDecisionEmail} reservation La réservation revenue en attente de paiement.
 * @param {"NO_TRANSFER" | "INCOMPLETE_AMOUNT" | "UNREADABLE_PROOF"} reasonCode Le motif du refus.
 * @returns {Promise<boolean>} Vrai si le serveur SMTP a accepté le message ; faux sinon, sans lancer d'erreur.
 */
export async function sendReservationRefusal(reservation, reasonCode) {
  try {
    const { SITE_URL } = getEmailEnv();
    const event = await readEventForEmail();
    await sendEmail(buildReservationRefusal(reservation, reasonCode, event, SITE_URL));
    return true;
  } catch {
    logger.error("reservation_refusal_failed", { reservationId: reservation.id });
    return false;
  }
}
