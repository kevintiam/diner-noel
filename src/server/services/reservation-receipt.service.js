import { getEmailEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { sendEmail } from "../email/send-email.js";
import { buildReservationReceipt } from "../email/templates/reservation-receipt.js";

/**
 * Notifie après commit sans jamais annuler une réservation ni exposer un message externe.
 * @param {import("../../validation/reservation.schema.js").ReservationForReceipt} reservation L'instantané enregistré.
 * @returns {Promise<void>} Termine même si la configuration ou le SMTP échoue.
 */
export async function sendReservationReceipt(reservation) {
  try {
    const { SITE_URL } = getEmailEnv();
    await sendEmail(buildReservationReceipt(reservation, SITE_URL));
  } catch {
    logger.error("reservation_receipt_failed", { reservationId: reservation.id });
  }
}
