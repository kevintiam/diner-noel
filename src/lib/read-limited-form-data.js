import { AppError } from "../server/errors/app-error.js";
import { MULTIPART_TIMEOUT_MS } from "../config/upload-limits.js";

/**
 * Lit le multipart avec un plafond réel, y compris sans taille annoncée.
 * Le décodage ne commence qu'une fois le corps borné entièrement reçu.
 * @param {Request} request La requête entrante.
 * @param {number} maxBytes Le plafond, enveloppe multipart comprise.
 * @param {number} [timeoutMs] Le budget total, décodage compris.
 * @returns {Promise<FormData>} Les champs décodés.
 */
export async function readLimitedFormData(request, maxBytes, timeoutMs = MULTIPART_TIMEOUT_MS) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > maxBytes) {
    throw new AppError(413, "PROOF_TOO_LARGE", "errors.proofTooLarge");
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation");
  }
  const reader = request.body.getReader();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let byteSize = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const timeoutError = new AppError(408, "UPLOAD_TIMEOUT", "errors.uploadTimeout");
  /** @type {Promise<never>} */
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(timeoutError), timeoutMs);
  });
  async function read() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteSize += value.byteLength;
      if (byteSize > maxBytes) {
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
  }
  try {
    return await Promise.race([read(), deadline]);
  } catch (error) {
    const failure =
      error instanceof AppError
        ? error
        : new AppError(400, "VALIDATION_ERROR", "errors.validation");
    // L'annulation d'un flux distant peut ne jamais finir : ne jamais l'attendre.
    void reader.cancel().catch((cause) => {
      failure.cause = cause;
    });
    throw failure;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
