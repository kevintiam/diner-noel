import { getPrisma } from "./prisma-client.js";

/**
 * Purge exclusivement les données techniques expirées, dans une transaction bornée.
 * @param {Date} now L'instant UTC de référence.
 * @param {Date} inactiveBefore La dernière activité maximale des compteurs à supprimer.
 * @returns {Promise<{sessions: number, rateLimits: number}>} Les nombres supprimés.
 */
export async function deleteExpiredTechnicalData(now, inactiveBefore) {
  const [sessions, rateLimits] = await getPrisma().$transaction([
    getPrisma().session.deleteMany({ where: { expiresAt: { lte: now } } }),
    getPrisma().rateLimit.deleteMany({ where: { windowStart: { lte: inactiveBefore } } }),
  ]);
  return { sessions: sessions.count, rateLimits: rateLimits.count };
}
