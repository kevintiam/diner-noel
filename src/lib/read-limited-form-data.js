import { AppError } from "../server/errors/app-error.js";

/**
 * Lit le multipart avec un plafond réel, y compris sans taille annoncée.
 * Le décodage ne commence qu'une fois le corps borné entièrement reçu.
 * @param {Request} request La requête entrante.
 * @param {number} maxBytes Le plafond, enveloppe multipart comprise.
 * @returns {Promise<FormData>} Les champs décodés.
 */
export async function readLimitedFormData(request, maxBytes) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > maxBytes) {
    throw new AppError(413, "PROOF_TOO_LARGE", "errors.proofTooLarge");
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation");
  }
  const reader = request.body.getReader();
  const chunks = [];
  let byteSize = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteSize += value.byteLength;
      if (byteSize > maxBytes) {
        await reader.cancel();
        throw new AppError(413, "PROOF_TOO_LARGE", "errors.proofTooLarge");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(byteSize);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return await new Response(bytes, { headers: { "content-type": contentType } }).formData();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation");
  } finally {
    reader.releaseLock();
  }
}
