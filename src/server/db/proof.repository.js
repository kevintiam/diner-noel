/**
 * Ajoute une capture immuable dans la transaction qui change le statut.
 * @param {import("./transaction.js").TransactionClient} tx La transaction.
 * @param {{ reservationId: string, data: Uint8Array, mimeType: string, byteSize: number }} image Les octets privés.
 * @returns {Promise<void>} L'insertion terminée.
 */
export async function insertProof(tx, image) {
  await tx.proof.create({ data: image, select: { id: true } });
}
