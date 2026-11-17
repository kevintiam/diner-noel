import { isValidPersonalToken } from "../../validation/reservation.schema.js";
import { MAX_PROOF_BYTES } from "../../validation/proof.schema.js";
import { findProofImage, insertProof } from "../db/proof.repository.js";
import { findReservationStatusByToken } from "../db/reservation.repository.js";
import { runInTransaction } from "../db/transaction.js";
import { AppError } from "../errors/app-error.js";
import { normalizeProofImage } from "./proof-image.service.js";
import { transitionReservationStatus } from "./reservation-status.service.js";

/**
 * Normalise l'image avant la transaction puis écrit statut et capture atomiquement.
 * @param {{ token: string, imageBytes: Uint8Array }} input Le dépôt validé.
 * @returns {Promise<{status: string}>} Le nouvel état, sans donnée personnelle.
 */
export async function submitProof({ token, imageBytes }) {
  if (!isValidPersonalToken(token)) {
    throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
  }
  if (imageBytes.byteLength > MAX_PROOF_BYTES) {
    throw new AppError(413, "PROOF_TOO_LARGE", "errors.proofTooLarge");
  }
  const image = await normalizeProofImage(imageBytes);
  return runInTransaction(async (tx) => {
    const reservation = await findReservationStatusByToken(tx, token);
    if (!reservation) {
      throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
    }
    if (reservation.status !== "PENDING_PAYMENT" || reservation.amountCents === 0) {
      throw new AppError(409, "RESERVATION_STATUS_CHANGED", "errors.reservationStatusChanged");
    }
    await transitionReservationStatus(tx, {
      reservationId: reservation.id,
      from: "PENDING_PAYMENT",
      to: "TO_VERIFY",
    });
    await insertProof(tx, { reservationId: reservation.id, ...image });
    return { status: "TO_VERIFY" };
  });
}

// Les identifiants Prisma (cuid) n'ont que des lettres et des chiffres.
const PROOF_ID_PATTERN = /^[a-z0-9]{1,64}$/i;
// Types écrits par normalizeProofImage ; tout autre type ne part jamais vers le navigateur.
const DISPLAYABLE_TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);

/**
 * Lit une capture pour l'afficher à un organisateur connecté (architecture AD-8, story 2.2).
 * @param {unknown} proofId L'identifiant reçu dans l'adresse.
 * @returns {Promise<{ data: Uint8Array, mimeType: string }>} Les octets et leur type.
 * @throws {AppError} 404 `PROOF_NOT_FOUND` si l'identifiant est invalide ou inconnu.
 */
export async function getProofImage(proofId) {
  if (typeof proofId !== "string" || !PROOF_ID_PATTERN.test(proofId)) {
    throw new AppError(404, "PROOF_NOT_FOUND", "errors.proofNotFound");
  }
  const image = await findProofImage(proofId);
  if (!image || !DISPLAYABLE_TYPES.has(image.mimeType)) {
    throw new AppError(404, "PROOF_NOT_FOUND", "errors.proofNotFound");
  }
  return image;
}
