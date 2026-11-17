// Identifiants d'une réservation : le code lisible que le participant écrit dans
// son virement, et le jeton secret de son lien personnel (architecture AD-7).
import { randomBytes, randomInt } from "node:crypto";

const CODE_PREFIX = "NOEL-";
const CODE_NUMBER_MIN = 1000;
const CODE_NUMBER_MAX_EXCLUSIVE = 10_000;
const TOKEN_BYTES = 32;

/**
 * Tire un code court et lisible (ex. `NOEL-4821`). L'unicité est vérifiée par le service.
 * @returns {string} Le code.
 */
export function generateReservationCode() {
  return `${CODE_PREFIX}${randomInt(CODE_NUMBER_MIN, CODE_NUMBER_MAX_EXCLUSIVE)}`;
}

/**
 * Tire le jeton du lien personnel : 32 octets aléatoires, impossibles à deviner.
 * @returns {string} Le jeton, en base64url (43 caractères).
 */
export function generatePersonalToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}
