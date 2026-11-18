// Accès aux échecs d'envoi des courriels au participant (architecture AD-10).
// Une ligne n'est jamais supprimée : traiter un échec note seulement qui l'a fait, et quand.
import { getPrisma } from "./prisma-client.js";

/** @typedef {import("../../validation/email-failure.schema.js").EmailKind} EmailKind */
/** @typedef {import("../../validation/email-failure.schema.js").OpenEmailFailureWithReservation} OpenEmailFailureWithReservation */

/**
 * Enregistre un courriel qui n'a pas pu partir.
 * @param {{ reservationId: string, kind: EmailKind, createdAt: Date }} failure L'échec.
 * @returns {Promise<void>}
 */
export async function insertEmailFailure(failure) {
  await getPrisma().emailFailure.create({ data: failure, select: { id: true } });
}

/**
 * Liste les échecs encore à traiter, du plus récent au plus ancien, avec leur réservation.
 * @returns {Promise<OpenEmailFailureWithReservation[]>} Les échecs à traiter.
 */
export async function findOpenEmailFailures() {
  return getPrisma().emailFailure.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      createdAt: true,
      reservation: { select: { id: true, code: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Marque comme traités tous les échecs encore ouverts d'une réservation.
 * @param {{ reservationId: string, organizerId: string, resolvedAt: Date }} resolution Qui a prévenu la personne, et quand.
 * @returns {Promise<number>} Le nombre d'échecs traités.
 */
export async function resolveOpenEmailFailures({ reservationId, organizerId, resolvedAt }) {
  const { count } = await getPrisma().emailFailure.updateMany({
    where: { reservationId, resolvedAt: null },
    data: { resolvedAt, resolvedById: organizerId },
  });
  return count;
}
