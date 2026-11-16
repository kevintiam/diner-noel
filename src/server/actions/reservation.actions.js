"use server";

// Server Action du formulaire de réservation : limite → validation → service,
// puis redirection vers la page de paiement du lien personnel (architecture AD-2).
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "../../i18n/locales.js";
import { getClientIp } from "../../lib/client-ip.js";
import { validateReservationInput } from "../../validation/reservation.schema.js";
import { AppError } from "../errors/app-error.js";
import { handleApiError } from "../errors/handle-api-error.js";
import {
  buildRateLimitKey,
  checkRateLimit,
  RESERVE_RATE_LIMIT,
} from "../services/rate-limit.service.js";
import { createReservation } from "../services/reservation.service.js";

const FORM_FIELDS = ["firstName", "lastName", "email", "phone", "seats", "note"];
// Refus liés aux places : la page est relue pour afficher les places à jour (ou « complet »).
const AVAILABILITY_ERROR_CODES = new Set(["SOLD_OUT", "NOT_ENOUGH_SEATS", "BOOKING_CLOSED"]);

/** @typedef {import("../../validation/reservation.schema.js").ReservationFormValues} ReservationFormValues */
/** @typedef {import("../errors/handle-api-error.js").ErrorBody & { values: ReservationFormValues }} ReservationActionState */

/**
 * Lit les champs du formulaire en texte, pour les valider et les réafficher en cas d'erreur.
 * @param {FormData} formData Les données envoyées.
 * @returns {ReservationFormValues} Les valeurs saisies.
 */
function readFormValues(formData) {
  /** @type {Record<string, string>} */
  const values = {};
  for (const field of FORM_FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return /** @type {ReservationFormValues} */ (values);
}

/**
 * Crée une réservation depuis le formulaire, puis mène à la page de paiement.
 * Ne renvoie quelque chose qu'en cas d'erreur : le corps `{ error }` traduit et la saisie.
 * @param {string} lang La langue de la page (`fr` ou `en`).
 * @param {ReservationActionState | null} previousState L'état précédent (inutilisé).
 * @param {FormData} formData Les données envoyées.
 * @returns {Promise<ReservationActionState>} L'erreur à afficher ; en cas de succès, redirige.
 */
export async function createReservationAction(lang, previousState, formData) {
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const values = readFormValues(formData);
  let token;
  try {
    const now = new Date();
    const clientIp = getClientIp(await headers());
    await checkRateLimit({
      key: buildRateLimitKey("reserve", clientIp),
      ...RESERVE_RATE_LIMIT,
      now,
    });
    const validation = validateReservationInput(values);
    if (!validation.success) {
      throw new AppError(400, "VALIDATION_ERROR", "errors.validation", validation.fieldErrors);
    }
    ({ token } = await createReservation(validation.data, { lang: locale, now }));
  } catch (error) {
    if (error instanceof AppError && AVAILABILITY_ERROR_CODES.has(error.code)) {
      refresh();
    }
    const { body } = handleApiError(error, {
      lang: locale,
      context: { route: `/${locale}/reservation`, method: "POST" },
    });
    return { ...body, values };
  }
  // En dehors du try : redirect() lance une exception que Next doit recevoir.
  redirect(`/${locale}/r/${token}`);
}
