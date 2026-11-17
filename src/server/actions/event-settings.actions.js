"use server";

// Server Action de l'écran Paramètres de l'événement (maquette 8). Elle vérifie elle-même
// l'organisateur (architecture AD-9) ; le tableau de bord est en français (AD-3).
import { redirect } from "next/navigation";
import { requireOrganizer } from "../auth/require-organizer.js";
import { handleApiError } from "../errors/handle-api-error.js";
import { updateEventSettings } from "../services/event-settings.service.js";

const ADMIN_LANG = "fr";
const SETTINGS_PATH = "/admin/parametres";
const TEXT_FIELDS = /** @type {const} */ ([
  "startsAtDate",
  "startsAtTime",
  "bookingDeadlineDate",
  "venueName",
  "venueAddress",
  "capacity",
  "unitPrice",
  "interacEmail",
]);

/** @typedef {import("../../validation/event-settings.schema.js").EventSettingsFormValues} EventSettingsFormValues */

/**
 * État renvoyé au formulaire quand l'enregistrement échoue : l'erreur et les valeurs saisies.
 * @typedef {import("../errors/handle-api-error.js").ErrorBody & { values: EventSettingsFormValues }} EventSettingsActionState
 */

/**
 * Lit les champs texte du formulaire.
 * @param {FormData} formData
 * @returns {EventSettingsFormValues}
 */
function readSettingsForm(formData) {
  /** @type {Record<string, string>} */
  const values = {};
  for (const name of TEXT_FIELDS) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value : "";
  }
  return /** @type {EventSettingsFormValues} */ (values);
}

/**
 * Enregistre les paramètres de l'événement, puis recharge l'écran avec un message de succès.
 * @param {EventSettingsActionState | null} previousState L'état précédent (inutilisé).
 * @param {FormData} formData Les valeurs du formulaire.
 * @returns {Promise<EventSettingsActionState>} L'erreur et les valeurs saisies ; en cas de succès, redirige.
 */
export async function updateEventSettingsAction(previousState, formData) {
  const organizer = await requireOrganizer();
  const values = readSettingsForm(formData);
  try {
    await updateEventSettings({
      ...values,
      autoDepositConfirmed: formData.get("autoDepositConfirmed") === "on",
    });
  } catch (error) {
    const { body } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: SETTINGS_PATH, method: "POST", organizerId: organizer.id },
    });
    return { ...body, values };
  }
  // En dehors du try : redirect() lance une exception que Next doit recevoir.
  redirect(`${SETTINGS_PATH}?enregistre=1`);
}
