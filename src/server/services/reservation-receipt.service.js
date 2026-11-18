import { getEmailEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { getEvent } from "../db/event.repository.js";
import { sendEmail } from "../email/send-email.js";
import { buildReservationReceipt } from "../email/templates/reservation-receipt.js";
import { recordEmailFailure } from "./email-failure.service.js";

/**
 * Notifie après commit sans jamais annuler une réservation ni exposer un message externe.
 * L'accusé reprend la date et le lieu du dîner, lus dans l'événement.
 * Un échec est journalisé puis enregistré, pour que les organisateurs le voient (AD-10).
 * @param {import("../../validation/reservation.schema.js").ReservationForReceipt} reservation L'instantané enregistré.
 * @returns {Promise<void>} Termine même si la configuration, l'événement ou le SMTP manque.
 */
export async function sendReservationReceipt(reservation) {
  try {
    const { SITE_URL } = getEmailEnv();
    const event = await getEvent();
    if (!event) {
      throw new Error("Événement introuvable.");
    }
    await sendEmail(buildReservationReceipt(reservation, event, SITE_URL));
  } catch {
    logger.error("reservation_receipt_failed", { reservationId: reservation.id });
    await recordEmailFailure({ reservationId: reservation.id, kind: "RECEIPT" });
  }
}
