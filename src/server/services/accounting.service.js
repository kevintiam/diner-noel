// État des comptes du tableau de bord (architecture AD-6, brief §5.2).
// Encaissé = réservations confirmées, y compris celles annulées après leur confirmation.
// En attente = réservations en attente de paiement ou à vérifier.
import { sumCollectedCents, sumPendingCents } from "../db/accounting.repository.js";

/**
 * Calcule l'argent encaissé et l'argent encore attendu.
 * @returns {Promise<{ collectedCents: number, pendingCents: number }>} Les deux sommes, en cents.
 */
export async function getAccountingSummary() {
  const [collectedCents, pendingCents] = await Promise.all([
    sumCollectedCents(),
    sumPendingCents(),
  ]);
  return { collectedCents, pendingCents };
}
