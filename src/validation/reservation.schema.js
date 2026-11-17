// Validation de la demande de réservation et du lien personnel, côté serveur.
// Les messages sont des clés de dictionnaire, jamais des phrases (architecture AD-3).
// Le formulaire (composant client) n'importe pas ce fichier : Zod reste hors du téléphone.
import { z } from "zod";
import { MAX_SEATS_PER_RESERVATION } from "./reservation-limits.js";

export { MAX_SEATS_PER_RESERVATION };

// Jeton du lien personnel : 32 octets en base64url, soit 43 caractères (architecture AD-7).
const PERSONAL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const NAME_MAX_LENGTH = 60;
const EMAIL_MAX_LENGTH = 254;
const NOTE_MAX_LENGTH = 500;
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;
const PHONE_MAX_LENGTH = 40;
const PHONE_ALLOWED_CHARACTERS = /^[0-9+().\s-]+$/;

/**
 * Compte les chiffres d'un numéro de téléphone saisi librement.
 * @param {string} phone
 * @returns {number}
 */
function countDigits(phone) {
  return phone.replace(/\D/g, "").length;
}

/**
 * Construit un champ de nom : obligatoire, sans espaces autour, 60 caractères au maximum.
 * @param {string} requiredKey
 * @param {string} tooLongKey
 */
function buildNameField(requiredKey, tooLongKey) {
  return z
    .string({ error: requiredKey })
    .trim()
    .min(1, { error: requiredKey })
    .max(NAME_MAX_LENGTH, { error: tooLongKey });
}

/** Construit un effectif entier, sans coercition des types étrangers. */
function buildSeatCount() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value),
    z
      .number({ error: "validation.ageSeatsInvalid" })
      .int({ error: "validation.ageSeatsInvalid" })
      .min(0, { error: "validation.ageSeatsInvalid" })
      .max(MAX_SEATS_PER_RESERVATION, { error: "validation.ageSeatsInvalid" }),
  );
}

export const reservationInputSchema = z
  .object(
    {
      firstName: buildNameField("validation.firstNameRequired", "validation.firstNameTooLong"),
      lastName: buildNameField("validation.lastNameRequired", "validation.lastNameTooLong"),
      email: z
        .string({ error: "validation.emailInvalid" })
        .trim()
        .max(EMAIL_MAX_LENGTH, { error: "validation.emailInvalid" })
        .pipe(z.email({ error: "validation.emailInvalid" })),
      phone: z
        .string({ error: "validation.phoneInvalid" })
        .trim()
        .max(PHONE_MAX_LENGTH, { error: "validation.phoneInvalid" })
        .regex(PHONE_ALLOWED_CHARACTERS, { error: "validation.phoneInvalid" })
        .refine((phone) => countDigits(phone) >= PHONE_MIN_DIGITS, {
          error: "validation.phoneInvalid",
        })
        .refine((phone) => countDigits(phone) <= PHONE_MAX_DIGITS, {
          error: "validation.phoneInvalid",
        }),
      adultSeats: buildSeatCount(),
      childSeats: buildSeatCount(),
      note: z
        .string({ error: "validation.noteTooLong" })
        .trim()
        .max(NOTE_MAX_LENGTH, { error: "validation.noteTooLong" })
        .optional()
        .transform((note) => note || undefined),
    },
    { error: "errors.validation" },
  )
  .superRefine((input, context) => {
    const counts = [input.adultSeats, input.childSeats];
    if (
      counts.some(
        (count) => !Number.isInteger(count) || count < 0 || count > MAX_SEATS_PER_RESERVATION,
      )
    )
      return;
    const total = input.adultSeats + input.childSeats;
    if (total < 1 || total > MAX_SEATS_PER_RESERVATION) {
      for (const field of ["adultSeats", "childSeats"]) {
        context.addIssue({ code: "custom", path: [field], message: "validation.seatsInvalid" });
      }
    }
  });

export const personalTokenSchema = z.string().regex(PERSONAL_TOKEN_PATTERN);

/**
 * Demande de réservation validée, transmise au service.
 * @typedef {object} ReservationInput
 * @property {string} firstName Prénom, sans espaces autour.
 * @property {string} lastName Nom, sans espaces autour.
 * @property {string} email Courriel.
 * @property {string} phone Téléphone, tel que saisi (10 à 15 chiffres).
 * @property {number} adultSeats Personnes de 15 ans et plus.
 * @property {number} childSeats Enfants de 0 à 14 ans.
 * @property {string} [note] Remarque facultative.
 */

/**
 * Valeurs brutes du formulaire, renvoyées telles quelles pour être réaffichées.
 * @typedef {Record<"firstName" | "lastName" | "email" | "phone" | "adultSeats" | "childSeats" | "note", string>} ReservationFormValues
 */

/**
 * Nouvelle réservation, calculée par le service et transmise au repository.
 * @typedef {object} NewReservation
 * @property {string} code Code lisible (ex. `NOEL-4821`).
 * @property {string} token Jeton du lien personnel.
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {number} seats
 * @property {number} childSeats
 * @property {"PENDING_PAYMENT" | "CONFIRMED"} status
 * @property {Date | null} confirmedAt
 * @property {string | undefined} note
 * @property {string} language `fr` ou `en`.
 * @property {number} unitPriceCents Prix d'une place, copié de l'événement.
 * @property {number} amountCents Montant total figé.
 * @property {string} interacEmail Courriel Interac, copié de l'événement.
 */

/**
 * Ce que la page de paiement affiche d'une réservation.
 * @typedef {object} ReservationForPayment
 * @property {string} firstName
 * @property {string} code
 * @property {string} status
 * @property {number} seats
 * @property {number} childSeats
 * @property {number} unitPriceCents
 * @property {number} amountCents
 * @property {string} interacEmail
 */

/**
 * @typedef {{ field: string, messageKey: string }} FieldError
 */

/**
 * Instantané enregistré, réservé à l'accusé : aucune coordonnée superflue.
 * @typedef {object} ReservationForReceipt
 * @property {string} id Identifiant interne destiné au journal confidentiel.
 * @property {string} code
 * @property {string} token
 * @property {string} firstName
 * @property {string} email
 * @property {"FR" | "EN"} language Langue effectivement enregistrée.
 * @property {number} seats
 * @property {number} childSeats
 * @property {number} unitPriceCents
 * @property {number} amountCents
 * @property {string} interacEmail
 */

/**
 * Valide une demande de réservation.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: ReservationInput } | { success: false, fieldErrors: FieldError[] }}
 *   Les données validées, ou une erreur par champ fautif (la première trouvée).
 */
export function validateReservationInput(raw) {
  const result = reservationInputSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  /** @type {FieldError[]} */
  const fieldErrors = [];
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors.some((fieldError) => fieldError.field === field)) {
      fieldErrors.push({ field, messageKey: issue.message });
    }
  }
  return { success: false, fieldErrors };
}

/**
 * Indique si une valeur a la forme d'un jeton de lien personnel.
 * @param {unknown} value La valeur lue dans l'adresse.
 * @returns {boolean} Vrai pour 43 caractères base64url.
 */
export function isValidPersonalToken(value) {
  return personalTokenSchema.safeParse(value).success;
}
