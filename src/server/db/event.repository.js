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
