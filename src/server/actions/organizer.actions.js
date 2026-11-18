"use server";

// Server Actions du tableau de bord : connexion, déconnexion, décision sur une réservation
// et suivi des courriels non envoyés. Chaque action vérifie elle-même ses droits
// (architecture AD-9) ; le tableau de bord est en français (AD-3).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIp } from "../../lib/client-ip.js";
import { LOGIN_PATH, requireOrganizer } from "../auth/require-organizer.js";
import {
  clearSessionCookie,
  readSessionToken,
  writeSessionCookie,
} from "../auth/session-cookie.js";
import { handleApiError } from "../errors/handle-api-error.js";
import { resolveEmailFailures } from "../services/email-failure.service.js";
import { loginOrganizer, logoutOrganizer } from "../services/organizer.service.js";
import {
  buildRateLimitKey,
  checkRateLimit,
  LOGIN_RATE_LIMIT,
} from "../services/rate-limit.service.js";
import { decideReservation } from "../services/reservation-decision.service.js";

const ADMIN_LANG = "fr";
const DASHBOARD_PATH = "/admin";
const RESERVATIONS_PATH = "/admin/reservations";
const RESERVATION_ROUTE = "/admin/reservations/[id]";
const VALIDATION_ERROR_STATUS = 400;

/**
 * Adresse de la fiche d'une réservation.
 * @param {string} reservationId
 * @returns {string}
 */
function reservationPath(reservationId) {
  return `${RESERVATIONS_PATH}/${encodeURIComponent(reservationId)}`;
}

/**
 * État renvoyé au formulaire de connexion en cas d'échec. Le mot de passe n'y figure jamais.
 * @typedef {import("../errors/handle-api-error.js").ErrorBody & { email: string }} LoginActionState
 */

/**
 * Lit un champ de formulaire en texte.
 * @param {FormData} formData
 * @param {string} name
 * @returns {string}
 */
function readText(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Connecte un organisateur, puis mène au tableau de bord.
 * Ne renvoie quelque chose qu'en cas d'échec : l'erreur traduite et le courriel saisi.
 * @param {LoginActionState | null} previousState L'état précédent (inutilisé).
 * @param {FormData} formData Le courriel et le mot de passe.
 * @returns {Promise<LoginActionState>} L'erreur à afficher ; en cas de succès, redirige.
 */
export async function loginOrganizerAction(previousState, formData) {
  const email = readText(formData, "email");
  try {
    const now = new Date();
    const clientIp = getClientIp(await headers());
    // Chaque essai compte, même réussi : la limite freine qui devine des mots de passe.
    await checkRateLimit({ key: buildRateLimitKey("login", clientIp), ...LOGIN_RATE_LIMIT, now });
    const session = await loginOrganizer(
      { email, password: readText(formData, "password") },
      { now },
    );
    await writeSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    const { body } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: LOGIN_PATH, method: "POST" },
    });
    return { ...body, email };
  }
  // En dehors du try : redirect() lance une exception que Next doit recevoir.
  redirect(DASHBOARD_PATH);
}

/**
 * Ferme la session en base et efface le cookie, puis revient à la connexion.
 * @returns {Promise<never>}
 */
export async function logoutOrganizerAction() {
  await logoutOrganizer(await readSessionToken());
  await clearSessionCookie();
  redirect(LOGIN_PATH);
}

/**
 * État renvoyé au panneau de décision quand la décision échoue.
 * @typedef {import("../errors/handle-api-error.js").ErrorBody} DecisionActionState
 */

/**
 * Applique la décision d'un organisateur (confirmer, refuser, annuler), puis revient à la fiche.
 * Un courriel qui n'a pas pu partir est enregistré en base : la fiche le signale tant
 * qu'un organisateur n'a pas indiqué avoir prévenu la personne.
 * @param {DecisionActionState | null} previousState L'état précédent (inutilisé).
 * @param {FormData} formData La réservation, la décision et, pour un refus, le motif.
 * @returns {Promise<DecisionActionState>} L'erreur à afficher ; en cas de succès, redirige.
 */
export async function updateReservationStatusAction(previousState, formData) {
  const organizer = await requireOrganizer();
  const reasonCode = readText(formData, "reasonCode");
  let result;
  try {
    result = await decideReservation(
      {
        reservationId: readText(formData, "reservationId"),
        decision: readText(formData, "decision"),
        reasonCode: reasonCode === "" ? undefined : reasonCode,
      },
      { organizerId: organizer.id, now: new Date() },
    );
  } catch (error) {
    const { body } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: RESERVATION_ROUTE, method: "POST", organizerId: organizer.id },
    });
    return body;
  }
  // En dehors du try : redirect() lance une exception que Next doit recevoir.
  redirect(reservationPath(result.id));
}

/**
 * Note qu'un organisateur a prévenu la personne d'un courriel non envoyé, puis recharge la fiche.
 * Un identifiant invalide ne désigne aucune fiche : retour à la liste des réservations.
 * Toute autre panne est journalisée puis remonte à Next, plutôt que de faire croire au succès.
 * @param {FormData} formData La réservation concernée.
 * @returns {Promise<never>} Redirige, ou lance l'erreur imprévue.
 */
export async function resolveEmailFailuresAction(formData) {
  const organizer = await requireOrganizer();
  let reservationId;
  try {
    ({ reservationId } = await resolveEmailFailures(
      { reservationId: readText(formData, "reservationId") },
      { organizerId: organizer.id, now: new Date() },
    ));
  } catch (error) {
    const { status } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: RESERVATION_ROUTE, method: "POST", organizerId: organizer.id },
    });
    if (status !== VALIDATION_ERROR_STATUS) {
      throw error;
    }
  }
  // En dehors du try : redirect() lance une exception que Next doit recevoir.
  redirect(reservationId ? reservationPath(reservationId) : RESERVATIONS_PATH);
}
