// Avant les parcours : base de test vidée puis événement de départ créé,
// pour que l'accueil affiche toujours « 120 places restantes ».
import { seedDefaultEvent } from "../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { resetTestDatabase } from "../src/server/db/reset-test-database.js";

const MILLISECONDS_PER_DAY = 86_400_000;
const EVENT_DAYS_AHEAD = 30;
const BOOKING_DAYS_AHEAD = 29;

/**
 * Prépare uniquement la base dédiée aux tests avant les parcours mobiles.
 * @returns {Promise<void>}
 * @throws {Error} Si la base n'est pas explicitement déclarée de test.
 */
export default async function globalSetup() {
  try {
    await resetTestDatabase();
    await seedDefaultEvent();
    // La réservation doit rester testable après décembre 2026, sans toucher au seed dev.
    const now = Date.now();
    await getPrisma().event.updateMany({
      data: {
        startsAt: new Date(now + EVENT_DAYS_AHEAD * MILLISECONDS_PER_DAY),
        bookingDeadline: new Date(now + BOOKING_DAYS_AHEAD * MILLISECONDS_PER_DAY),
      },
    });
  } finally {
    await disconnectPrisma();
  }
}
