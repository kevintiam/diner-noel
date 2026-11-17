// Contrôle d'accès du tableau de bord (architecture AD-9). requireOrganizer() est appelé
// en tête de chaque page, action et route admin ; le proxy ne décide jamais d'un accès.
import { redirect } from "next/navigation";
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
