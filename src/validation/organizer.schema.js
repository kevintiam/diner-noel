// Validation de la connexion des organisateurs et de la création de leurs comptes (architecture AD-9).
// Les messages sont des clés de dictionnaire, jamais des phrases (architecture AD-3).
import { z } from "zod";
import { validateWith } from "./field-errors.js";

const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 60;
// Borne la saisie de connexion : bcrypt ne lit de toute façon que les 72 premiers octets.
const LOGIN_PASSWORD_MAX_LENGTH = 256;
// Un mot de passe court se devine trop vite.
export const ORGANIZER_PASSWORD_MIN_LENGTH = 12;
// Au-delà de 72 octets, bcrypt ignore la suite : deux mots de passe différents seraient acceptés.
const PASSWORD_MAX_BYTES = 72;

/**
 * Identifiants saisis dans le formulaire de connexion.
 * @typedef {object} LoginInput
 * @property {string} email Courriel en minuscules, sans espaces autour.
 * @property {string} password Mot de passe tel que saisi.
 */

/**
 * Compte d'organisateur à créer ou à remettre à zéro (script `scripts/create-organizer.js`).
 * @typedef {object} OrganizerAccountInput
 * @property {string} email Courriel en minuscules, sans espaces autour.
 * @property {string} name Nom affiché dans le tableau de bord.
 * @property {string} password Mot de passe de 12 caractères au moins.
 */

/**
 * Organisateur connecté, sans son empreinte de mot de passe.
 * @typedef {object} OrganizerProfile
 * @property {string} id
 * @property {string} email
 * @property {string} name
 */

/** @typedef {import("./field-errors.js").FieldError} FieldError */

const emailField = z
  .string({ error: "validation.emailInvalid" })
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, { error: "validation.emailInvalid" })
  .pipe(z.email({ error: "validation.emailInvalid" }));

export const loginInputSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "validation.passwordRequired" })
    .min(1, { error: "validation.passwordRequired" })
    .max(LOGIN_PASSWORD_MAX_LENGTH, { error: "validation.passwordTooLong" }),
});

export const organizerAccountSchema = z.object({
  email: emailField,
  name: z
    .string({ error: "validation.lastNameRequired" })
    .trim()
    .min(1, { error: "validation.lastNameRequired" })
    .max(NAME_MAX_LENGTH, { error: "validation.lastNameTooLong" }),
  password: z
    .string({ error: "validation.passwordTooShort" })
    .min(ORGANIZER_PASSWORD_MIN_LENGTH, { error: "validation.passwordTooShort" })
    .refine((password) => new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES, {
      error: "validation.passwordTooLong",
    }),
});

/**
 * Valide les identifiants du formulaire de connexion.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: LoginInput } | { success: false, fieldErrors: FieldError[] }}
 *   Les identifiants nettoyés, ou une erreur par champ fautif.
 */
export function validateLoginInput(raw) {
  return validateWith(loginInputSchema, raw);
}

/**
 * Valide le compte d'organisateur à créer.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: OrganizerAccountInput } | { success: false, fieldErrors: FieldError[] }}
 *   Le compte nettoyé, ou une erreur par champ fautif.
 */
export function validateOrganizerAccountInput(raw) {
  return validateWith(organizerAccountSchema, raw);
}
