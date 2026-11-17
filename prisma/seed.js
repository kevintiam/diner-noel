// Jeu de données de départ : `npm run db:seed` (relançable sans doublon).
import { describeError, logger } from "../src/lib/logger.js";
import { disconnectPrisma } from "../src/server/db/prisma-client.js";
import { seedDefaultEvent } from "./default-event.js";

try {
  await seedDefaultEvent();
  logger.info("seed_completed");
} catch (error) {
  logger.error("seed_failed", describeError(error));
  process.exitCode = 1;
} finally {
  await disconnectPrisma();
}
