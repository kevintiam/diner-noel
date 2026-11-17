// Accès aux comptes des organisateurs et à leurs sessions (architecture AD-9).
// Seuls des hachages sont stockés : bcrypt pour le mot de passe, SHA-256 pour le jeton.
import { getPrisma } from "./prisma-client.js";

/** @typedef {import("../../validation/organizer.schema.js").OrganizerProfile} OrganizerProfile */

const PROFILE_FIELDS = { id: true, email: true, name: true };

/**
 * Lit un organisateur et l'empreinte de son mot de passe, par courriel.
 * @param {string} email Courriel normalisé (minuscules).
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<(OrganizerProfile & { passwordHash: string }) | null>} L'organisateur, ou null.
 */
export async function findOrganizerByEmail(email, client = getPrisma()) {
  return client.organizer.findUnique({
    where: { email },
    select: { ...PROFILE_FIELDS, passwordHash: true },
  });
}

/**
 * Crée un compte d'organisateur.
 * @param {{ email: string, name: string, passwordHash: string }} values
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<OrganizerProfile>} Le compte créé.
 */
export async function createOrganizer(values, client = getPrisma()) {
  return client.organizer.create({ data: values, select: PROFILE_FIELDS });
}

/**
 * Change le nom et le mot de passe d'un compte, et ferme toutes ses sessions
 * dans la même requête : l'ancien mot de passe ne garde aucun accès ouvert.
 * @param {string} organizerId Identifiant du compte.
 * @param {{ name: string, passwordHash: string }} values
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<OrganizerProfile>} Le compte mis à jour.
 */
export async function updateOrganizerCredentials(organizerId, values, client = getPrisma()) {
  return client.organizer.update({
    where: { id: organizerId },
    data: { ...values, sessions: { deleteMany: {} } },
    select: PROFILE_FIELDS,
  });
}

/**
 * Trouve l'organisateur d'une session encore valide.
 * @param {string} tokenHash Empreinte SHA-256 du jeton.
 * @param {Date} now Instant de la requête.
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<OrganizerProfile | null>} L'organisateur, ou null si la session est absente ou expirée.
 */
export async function findOrganizerBySessionHash(tokenHash, now, client = getPrisma()) {
  const session = await client.session.findFirst({
    where: { tokenHash, expiresAt: { gt: now } },
    select: { organizer: { select: PROFILE_FIELDS } },
  });
  return session?.organizer ?? null;
}

/**
 * Enregistre une session.
 * @param {{ organizerId: string, tokenHash: string, expiresAt: Date }} values
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<void>}
 */
export async function createSession(values, client = getPrisma()) {
  await client.session.create({ data: values });
}

/**
 * Supprime une session (déconnexion).
 * @param {string} tokenHash Empreinte SHA-256 du jeton.
 * @param {ReturnType<typeof getPrisma>} [client] Client Prisma.
 * @returns {Promise<void>}
 */
export async function deleteSessionByHash(tokenHash, client = getPrisma()) {
  await client.session.deleteMany({ where: { tokenHash } });
}
