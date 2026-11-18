// Accès aux captures de paiement, privées (architecture AD-8).
import { getPrisma } from "./prisma-client.js";

/**
 * Ajoute une capture immuable dans la transaction qui change le statut.
 * @param {import("./transaction.js").TransactionClient} tx La transaction.
 * @param {{ reservationId: string, data: Uint8Array, mimeType: string, byteSize: number }} image Les octets privés.
 * @returns {Promise<void>} L'insertion terminée.
 */
export async function insertProof(tx, image) {
  await tx.proof.create({
    data: { ...image, data: new Uint8Array(image.data) },
    select: { id: true },
  });
}

/**
 * Lit les octets d'une capture pour un organisateur connecté (architecture AD-8).
 * @param {string} proofId
 * @returns {Promise<{ data: Uint8Array, mimeType: string } | null>} L'image, ou null si elle n'existe pas.
 */
export async function findProofImage(proofId) {
  return getPrisma().proof.findUnique({
    where: { id: proofId },
    select: { data: true, mimeType: true },
  });
}
