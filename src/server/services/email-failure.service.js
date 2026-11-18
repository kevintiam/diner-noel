// Échecs d'envoi des courriels au participant (architecture AD-10). Un échec est journalisé
// par l'envoi, puis enregistré ici pour rester visible des organisateurs jusqu'à ce que
// l'un d'eux indique avoir prévenu la personne.
import { describeError, logger } from "../../lib/logger.js";
import { validateEmailFailureResolution } from "../../validation/email-failure.schema.js";
import {
  findOpenEmailFailures,
  insertEmailFailure,
  resolveOpenEmailFailures,
} from "../db/email-failure.repository.js";
import { AppError } from "../errors/app-error.js";

/** @typedef {import("../../validation/email-failure.schema.js").EmailKind} EmailKind */

/**
 * Enregistre un courriel qui n'a pas pu partir. Ne lance jamais d'erreur : la réservation
 * ou la décision est déjà enregistrée, et une panne de la base ici ne doit pas la défaire.
 * @param {{ reservationId: string, kind: EmailKind, now?: Date }} failure L'échec à garder.
 * @returns {Promise<void>} Termine même si l'écriture échoue (l'échec est alors journalisé).
 */
export async function recordEmailFailure({ reservationId, kind, now = new Date() }) {
  try {
    await insertEmailFailure({ reservationId, kind, createdAt: now });
  } catch (error) {
    logger.error("email_failure_record_failed", { reservationId, kind, ...describeError(error) });
  }
}

/**
 * Liste les courriels non envoyés que les organisateurs n'ont pas encore traités.
 * @returns {ReturnType<typeof findOpenEmailFailures>} Les échecs, du plus récent au plus ancien.
 */
export async function listOpenEmailFailures() {
  return findOpenEmailFailures();
}

/**
 * Note qu'un organisateur a prévenu la personne : les échecs ouverts de la réservation
 * sont traités, avec son identifiant et l'instant.
 * @param {unknown} input Les valeurs du formulaire, validées ici.
 * @param {{ organizerId: string, now: Date }} context L'organisateur connecté et l'instant.
 * @returns {Promise<{ reservationId: string, resolvedCount: number }>} La réservation et le nombre d'échecs traités.
 * @throws {AppError} 400 `VALIDATION_ERROR` si l'identifiant est invalide.
 */
export async function resolveEmailFailures(input, { organizerId, now }) {
  const validation = validateEmailFailureResolution(input);
  if (!validation.success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
  }
  const { reservationId } = validation.data;
  const resolvedCount = await resolveOpenEmailFailures({
    reservationId,
    organizerId,
    resolvedAt: now,
  });
  return { reservationId, resolvedCount };
}
