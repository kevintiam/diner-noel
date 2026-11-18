import { maintainTechnicalData } from "../../src/server/services/maintenance.service.js";

// Netlify exécute cette fonction native à 07:00 UTC sur le déploiement publié.
export const config = { schedule: "0 7 * * *" };

/**
 * Lance la maintenance quotidienne ; aucune route applicative de purge n'est exposée.
 * @returns {Promise<void>} La fin du nettoyage, ou un échec visible dans Netlify.
 */
export default async function technicalMaintenance() {
  await maintainTechnicalData();
}
