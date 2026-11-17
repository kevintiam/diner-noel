// Contrôle d'accès du tableau de bord (architecture AD-9). requireOrganizer() est appelé
// en tête de chaque page, action et route admin ; le proxy ne décide jamais d'un accès.
import { redirect } from "next/navigation";
import { AppError } from "../errors/app-error.js";
import { getOrganizerBySessionToken } from "../services/organizer.service.js";
import { readSessionToken } from "./session-cookie.js";

export const LOGIN_PATH = "/admin/login";

/** @typedef {import("../../validation/organizer.schema.js").OrganizerProfile} OrganizerProfile */

/**
 * Renvoie l'organisateur connecté, sans rediriger.
 * @returns {Promise<OrganizerProfile | null>} L'organisateur, ou null sans session valide.
 */
export async function getSignedInOrganizer() {
  return getOrganizerBySessionToken(await readSessionToken(), { now: new Date() });
}

/**
 * Exige un organisateur connecté, sinon renvoie vers la page de connexion.
 * À appeler avant toute lecture de données du tableau de bord.
 * @returns {Promise<OrganizerProfile>} L'organisateur connecté.
 */
export async function requireOrganizer() {
  const organizer = await getSignedInOrganizer();
  if (!organizer) {
    redirect(LOGIN_PATH);
  }
  return organizer;
}

/**
 * Exige un organisateur connecté pour une route d'API : sans session, l'erreur 401 remplace
 * la redirection, car une image ou un fichier ne peut pas suivre la page de connexion.
 * @returns {Promise<OrganizerProfile>} L'organisateur connecté.
 * @throws {AppError} 401 `UNAUTHENTICATED` sans session valide.
 */
export async function requireOrganizerForApi() {
  const organizer = await getSignedInOrganizer();
  if (!organizer) {
    throw new AppError(401, "UNAUTHENTICATED", "errors.unauthenticated");
  }
  return organizer;
}
