import { z } from "zod";
import { describeError, logger } from "../../lib/logger.js";
import { deleteExpiredTechnicalData } from "../db/maintenance.repository.js";
import { AppError } from "../errors/app-error.js";

// Une fenêtre dure au plus 15 min : cette marge garantit 24 h depuis toute activité possible.
const INACTIVITY_MS = (24 * 60 + 15) * 60 * 1000;

/**
 * Nettoie sessions expirées et compteurs inactifs depuis 24 h, sans données métier.
 * @param {Date} [now] L'instant UTC de référence.
 * @returns {Promise<{sessions: number, rateLimits: number}>} Les nombres supprimés.
 */
export async function maintainTechnicalData(now = new Date()) {
  if (!z.date().safeParse(now).success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation");
  }
  try {
    const result = await deleteExpiredTechnicalData(now, new Date(now.getTime() - INACTIVITY_MS));
    logger.info("technical_maintenance_completed", result);
    return result;
  } catch (error) {
    logger.error("technical_maintenance_failed", describeError(error));
    throw error;
  }
}
