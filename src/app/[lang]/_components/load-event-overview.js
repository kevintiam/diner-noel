// Chargeur partagé des sections dynamiques de l'accueil. `cache()` de React fait
// qu'il n'y a qu'une lecture de la base par requête, même si le bandeau, les
// cartes et le rappel final s'en servent tous, et qu'une panne n'est journalisée qu'une fois.
import { cache } from "react";
import { describeError, logger } from "@/lib/logger";
import { getEventOverview } from "@/server/services/event.service";

/**
 * Lit l'aperçu de l'événement une seule fois pour la requête en cours.
 * @param {string} route La route affichée, pour le journal (ex. `/fr`).
 * @returns {Promise<import("@/validation/event.schema").EventOverview & { observedAt: number }>} L'aperçu et l'instant de sa lecture.
 * @throws {Error} `EVENT_OVERVIEW_FAILED`, générique, si la base est inaccessible ou l'événement absent.
 */
export const loadEventOverview = cache(async (route) => {
  try {
    // Les disponibilités et le premier compte à rebours partagent le même instant.
    const now = new Date();
    const overview = await getEventOverview(now);
    return { ...overview, observedAt: now.getTime() };
  } catch (error) {
    logger.error("event_overview_failed", { route, method: "GET", ...describeError(error) });
    throw new Error("EVENT_OVERVIEW_FAILED");
  }
});
