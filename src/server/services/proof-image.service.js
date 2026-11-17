import sharp from "sharp";
import { detectImageType } from "../../lib/image-signature.js";
import { AppError } from "../errors/app-error.js";

/**
 * Vérifie la signature puis décode et réencode sans métadonnées privées.
 * @param {Uint8Array} bytes L'image originale.
 * @returns {Promise<{data: Buffer, mimeType: string, byteSize: number}>} L'image WebP privée.
 */
export async function normalizeProofImage(bytes) {
  if (!detectImageType(bytes)) {
    throw new AppError(415, "PROOF_INVALID_TYPE", "errors.proofInvalidType");
  }
  try {
    const data = await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { data, mimeType: "image/webp", byteSize: data.byteLength };
  } catch {
    throw new AppError(415, "PROOF_INVALID_TYPE", "errors.proofInvalidType");
  }
}
