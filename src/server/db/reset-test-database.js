// Vide toutes les tables, pour les tests seulement.
// Garde-fou : refuse de tourner si la base n'est pas déclarée comme base de
// test (DATABASE_IS_TEST=true, présent uniquement dans .env.test), pour ne
// jamais vider la base de développement ni la production.
import { getPrisma } from "./prisma-client.js";

/**
 * Vide toutes les tables de la base de test.
 * @returns {Promise<void>}
 * @throws {Error} Si DATABASE_IS_TEST ne vaut pas "true".
 */
export async function resetTestDatabase() {
  if (process.env.DATABASE_IS_TEST !== "true") {
    throw new Error(
      'Refus de vider la base : DATABASE_IS_TEST doit valoir "true" (fichier .env.test).',
    );
  }
  await getPrisma()
    .$executeRaw`TRUNCATE TABLE "EmailFailure", "ReservationDecision", "Proof", "Session", "Reservation", "Organizer", "Event", "RateLimit" CASCADE`;
}
