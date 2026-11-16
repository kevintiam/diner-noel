// Accès à l'unique ligne Event (architecture AD-14).
import { getPrisma } from "./prisma-client.js";

/** @typedef {import("../../validation/event.schema.js").EventValues} EventValues */

/**
 * Lit l'unique événement.
 * @returns {Promise<(EventValues & { id: string }) | null>} L'événement, ou null s'il n'a pas encore été créé.
 */
export async function getEvent() {
  return getPrisma().event.findFirst();
}

/** @typedef {import("../../validation/event.schema.js").LockedEvent} LockedEvent */

/**
 * Verrouille l'unique événement jusqu'à la fin de la transaction (architecture AD-5) :
 * deux réservations simultanées passent ainsi l'une après l'autre.
 * @param {import("./transaction.js").TransactionClient} transaction La transaction en cours.
 * @returns {Promise<LockedEvent | null>} L'événement verrouillé, ou null s'il n'existe pas.
 */
export async function lockEvent(transaction) {
  /** @type {LockedEvent[]} */
  const rows = await transaction.$queryRaw`
    SELECT "id", "capacity", "unitPriceCents", "interacEmail", "bookingDeadline"
    FROM "Event"
    LIMIT 1
    FOR UPDATE`;
  return rows[0] ?? null;
}

/**
 * Crée l'unique événement, ou le met à jour s'il existe déjà.
 * Sert au jeu de données de départ : relancé, il ne crée jamais de second événement.
 * @param {EventValues} values Les valeurs de l'événement.
 * @returns {Promise<EventValues & { id: string }>} L'événement enregistré.
 */
export async function upsertSingleEvent(values) {
  const prisma = getPrisma();
  const existingEvent = await prisma.event.findFirst({ select: { id: true } });
  if (existingEvent) {
    return prisma.event.update({ where: { id: existingEvent.id }, data: values });
  }
  return prisma.event.create({ data: values });
}
