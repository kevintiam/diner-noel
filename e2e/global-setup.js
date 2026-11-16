// Avant les parcours : base de test vidée puis événement de départ créé,
// pour que l'accueil affiche toujours « 120 places restantes ».
import { seedDefaultEvent } from "../prisma/default-event.js";
import { disconnectPrisma } from "../src/server/db/prisma-client.js";
import { resetTestDatabase } from "../src/server/db/reset-test-database.js";

/**
 * Prépare uniquement la base dédiée aux tests avant les parcours mobiles.
 * @returns {Promise<void>}
 * @throws {Error} Si la base n'est pas explicitement déclarée de test.
 */
export default async function globalSetup() {
  try {
    await resetTestDatabase();
    await seedDefaultEvent();
  } finally {
    await disconnectPrisma();
  }
}
