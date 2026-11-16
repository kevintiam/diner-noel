// Limite des envois en masse (architecture AD-11). La clé contient l'empreinte
// SHA-256 de l'adresse IP, pas l'adresse elle-même. C'est une pseudonymisation,
// pas une anonymisation : sans secret, une adresse IPv4 se retrouve en essayant
// toutes les possibilités. Une empreinte à clé secrète (HMAC) est notée dans le travail reporté.
import { createHash } from "node:crypto";
import { incrementRateLimit } from "../db/rate-limit.repository.js";
import { AppError } from "../errors/app-error.js";

const MILLISECONDS_PER_SECOND = 1000;

// Large, car beaucoup de participants réservent depuis le même wifi de l'église.
export const RESERVE_RATE_LIMIT = { limit: 20, windowSeconds: 15 * 60 };

/**
 * Construit la clé d'une action pour une adresse IP, à partir de son empreinte.
 * @param {string} action L'action limitée (ex. `reserve`).
 * @param {string} clientIp L'adresse IP du visiteur.
 * @returns {string} La clé (ex. `reserve:3fa9…`).
 */
export function buildRateLimitKey(action, clientIp) {
  const hash = createHash("sha256");
  hash.update(clientIp);
  return `${action}:${hash.digest("base64url")}`;
}

/**
 * Compte un envoi et refuse au-delà de la limite.
 * @param {{ key: string, limit: number, windowSeconds: number, now: Date }} options
 * @returns {Promise<void>}
 * @throws {AppError} 429 `TOO_MANY_REQUESTS` au-delà de `limit` envois dans la fenêtre.
 */
export async function checkRateLimit({ key, limit, windowSeconds, now }) {
  const windowCutoff = new Date(now.getTime() - windowSeconds * MILLISECONDS_PER_SECOND);
  const count = await incrementRateLimit(key, now, windowCutoff);
  if (count > limit) {
    throw new AppError(429, "TOO_MANY_REQUESTS", "errors.tooManyRequests");
  }
}
