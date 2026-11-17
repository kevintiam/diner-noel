// Sommes d'argent des réservations (architecture AD-6). Seul accounting.service.js les utilise :
// « encaissé » et « en attente » n'ont qu'une définition dans tout le projet.
import { getPrisma } from "./prisma-client.js";

/**
 * Additionne les montants des réservations confirmées au moins une fois, même annulées depuis.
 * @returns {Promise<number>} Le montant encaissé, en cents.
 */
export async function sumCollectedCents() {
  const result = await getPrisma().reservation.aggregate({
    _sum: { amountCents: true },
    where: { confirmedAt: { not: null } },
  });
  return result._sum.amountCents ?? 0;
}

/**
 * Additionne les montants des réservations en attente de paiement ou à vérifier.
 * @returns {Promise<number>} Le montant en attente, en cents.
 */
export async function sumPendingCents() {
  const result = await getPrisma().reservation.aggregate({
    _sum: { amountCents: true },
    where: { status: { in: ["PENDING_PAYMENT", "TO_VERIFY"] } },
  });
  return result._sum.amountCents ?? 0;
}
