// Règles de la connexion des organisateurs (architecture AD-9) et lectures du tableau de bord.
// Les décisions sur les réservations sont dans reservation-decision.service.js.
// Aucun compte n'existe par défaut : chacun est créé par `scripts/create-organizer.js`.
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import {
  validateLoginInput,
  validateOrganizerAccountInput,
} from "../../validation/organizer.schema.js";
import {
  createOrganizer,
  createSession,
  deleteSessionByHash,
  findOrganizerByEmail,
  findOrganizerBySessionHash,
  updateOrganizerCredentials,
} from "../db/organizer.repository.js";
import {
  findDashboardReservations,
  findReservationDetail,
} from "../db/reservation-admin.repository.js";
import { AppError } from "../errors/app-error.js";

/** @typedef {import("../../validation/organizer.schema.js").OrganizerProfile} OrganizerProfile */

// Coût bcrypt de l'architecture : environ un quart de seconde par vérification.
const BCRYPT_COST = 12;
const SESSION_TOKEN_BYTES = 32;
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// Empreinte d'une valeur aléatoire jetée : aucun mot de passe ne lui correspond.
// Elle est comparée quand le courriel est inconnu, pour que la réponse prenne
// le même temps qu'un mauvais mot de passe et ne révèle pas les comptes existants.
const UNKNOWN_ACCOUNT_HASH = "$2b$12$4tYuNLQ33T25vEwkIBFpcuPSw6FqtsuDSYEG/TfwdAnvw/iMnTGXC";

/**
 * Calcule l'empreinte stockée d'un jeton de session : le jeton lui-même n'est jamais en base.
 * @param {string} token Le jeton brut du cookie.
 * @returns {string} L'empreinte SHA-256 en hexadécimal.
 */
export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Vérifie les identifiants d'un organisateur et ouvre une session.
 * @param {unknown} credentials Les valeurs du formulaire, validées ici.
 * @param {{ now: Date }} options L'instant de la demande.
 * @returns {Promise<{ organizer: OrganizerProfile, token: string, expiresAt: Date }>}
 *   L'organisateur, le jeton à placer dans le cookie et sa date d'expiration.
 * @throws {AppError} 400 `VALIDATION_ERROR` ; 401 `INVALID_CREDENTIALS` si le courriel ou le mot de passe est faux.
 */
export async function loginOrganizer(credentials, { now }) {
  const validation = validateLoginInput(credentials);
  if (!validation.success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
  }
  const { email, password } = validation.data;
  const account = await findOrganizerByEmail(email);
  const isPasswordValid = await bcrypt.compare(
    password,
    account?.passwordHash ?? UNKNOWN_ACCOUNT_HASH,
  );
  if (!account || !isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "errors.invalidCredentials");
  }
  const token = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  await createSession({ organizerId: account.id, tokenHash: hashSessionToken(token), expiresAt });
  return {
    organizer: { id: account.id, email: account.email, name: account.name },
    token,
    expiresAt,
  };
}

/**
 * Retrouve l'organisateur d'un jeton de session encore valide.
 * @param {unknown} token Le jeton lu dans le cookie.
 * @param {{ now: Date }} options L'instant de la requête.
 * @returns {Promise<OrganizerProfile | null>} L'organisateur, ou null sans session valide.
 */
export async function getOrganizerBySessionToken(token, { now }) {
  if (typeof token !== "string" || token === "") {
    return null;
  }
  return findOrganizerBySessionHash(hashSessionToken(token), now);
}

/**
 * Ferme la session d'un jeton. Sans jeton, il n'y a rien à fermer.
 * @param {unknown} token Le jeton lu dans le cookie.
 * @returns {Promise<void>}
 */
export async function logoutOrganizer(token) {
  if (typeof token !== "string" || token === "") {
    return;
  }
  await deleteSessionByHash(hashSessionToken(token));
}

/**
 * Crée un compte d'organisateur, ou change le nom et le mot de passe d'un compte existant.
 * Un changement de mot de passe ferme toutes les sessions ouvertes de ce compte.
 * @param {unknown} account Courriel, nom et mot de passe, validés ici.
 * @returns {Promise<{ organizer: OrganizerProfile, isNew: boolean }>} Le compte, et s'il vient d'être créé.
 * @throws {AppError} 400 `VALIDATION_ERROR` si une valeur est invalide.
 */
export async function createOrganizerAccount(account) {
  const validation = validateOrganizerAccountInput(account);
  if (!validation.success) {
    throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
  }
  const { email, name, password } = validation.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const existing = await findOrganizerByEmail(email);
  if (existing) {
    const organizer = await updateOrganizerCredentials(existing.id, { name, passwordHash });
    return { organizer, isNew: false };
  }
  const organizer = await createOrganizer({ email, name, passwordHash });
  return { organizer, isNew: true };
}

/**
 * Liste les réservations du tableau de bord, de la plus récente à la plus ancienne.
 * @returns {ReturnType<typeof findDashboardReservations>} Les réservations.
 */
export async function listReservationsForDashboard() {
  return findDashboardReservations();
}

/**
 * Lit la fiche d'une réservation, avec ses captures (sans leurs octets) et ses décisions.
 * @param {string} reservationId Identifiant de la réservation.
 * @returns {Promise<NonNullable<Awaited<ReturnType<typeof findReservationDetail>>>>} La fiche.
 * @throws {AppError} 404 `RESERVATION_NOT_FOUND` si la réservation n'existe pas.
 */
export async function getReservationDetail(reservationId) {
  const reservation = await findReservationDetail(reservationId);
  if (!reservation) {
    throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
  }
  return reservation;
}
