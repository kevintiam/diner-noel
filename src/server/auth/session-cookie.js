// Cookie de session des organisateurs (architecture AD-9) : le seul fichier qui le lit ou l'écrit.
// Il ne contient qu'un jeton aléatoire ; la base n'en garde que l'empreinte.
import { cookies } from "next/headers";
import { isProduction } from "../../config/env.js";

export const SESSION_COOKIE_NAME = "organizer_session";

/**
 * Lit le jeton de session envoyé par le navigateur.
 * @returns {Promise<string | undefined>} Le jeton, ou undefined sans cookie.
 */
export async function readSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Dépose le jeton dans un cookie inaccessible au JavaScript de la page.
 * À appeler seulement depuis une Server Action ou un Route Handler.
 * @param {string} token Le jeton brut.
 * @param {Date} expiresAt La fin de la session.
 * @returns {Promise<void>}
 */
export async function writeSessionCookie(token, expiresAt) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Efface le cookie de session (déconnexion).
 * @returns {Promise<void>}
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
