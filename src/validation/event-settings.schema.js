// Validation de l'écran Paramètres de l'événement (maquette 8, architecture AD-14).
// Les champs arrivent en texte depuis le formulaire ; les heures sont celles d'Ottawa (AD-12).
// Les messages sont des clés de dictionnaire (AD-3).
import { z } from "zod";
import { validateWith } from "./field-errors.js";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
// Dollars avec au plus deux décimales, virgule ou point : « 35 », « 35,5 », « 35.50 ».
const PRICE_PATTERN = /^(\d{1,4})(?:[.,](\d{1,2}))?$/;
const CENTS_PER_DOLLAR = 100;
const VENUE_NAME_MAX_LENGTH = 120;
const VENUE_ADDRESS_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 254;
export const CAPACITY_MAX = 2000;
// Les réservations ferment à la fin du jour choisi, heure d'Ottawa.
export const BOOKING_DEADLINE_LOCAL_TIME = "23:59";

/**
 * Valeurs du formulaire, telles que saisies (texte).
 * @typedef {object} EventSettingsFormValues
 * @property {string} startsAtDate Date du dîner, `AAAA-MM-JJ`.
 * @property {string} startsAtTime Heure d'accueil, `HH:MM`.
 * @property {string} bookingDeadlineDate Dernier jour de réservation, `AAAA-MM-JJ`.
 * @property {string} venueName
 * @property {string} venueAddress
 * @property {string} capacity Nombre de places.
 * @property {string} unitPrice Prix normal d'une place, avant promo, en dollars (« 35 » ou « 35,50 »).
 * @property {boolean} hasPromotion Un prix promo est proposé pendant une période.
 * @property {string} promotionalUnitPrice Prix promo, après réduction, en dollars ("" sans promo).
 * @property {string} promotionStartDate Premier jour de la promo, `AAAA-MM-JJ` ("" sans promo).
 * @property {string} promotionEndDate Dernier jour inclus de la promo, `AAAA-MM-JJ` ("" sans promo).
 * @property {string} interacEmail
 */

/**
 * Promotion validée : prix réduit et période, du premier au dernier jour inclus (heure d'Ottawa).
 * @typedef {object} PromotionInput
 * @property {number} unitPriceCents Prix promo en cents, toujours plus bas que le prix normal.
 * @property {string} startDate Premier jour, `AAAA-MM-JJ`.
 * @property {string} endDate Dernier jour inclus, `AAAA-MM-JJ`, jamais avant le premier.
 */

/**
 * Paramètres validés, prêts pour le service.
 * @typedef {object} EventSettingsInput
 * @property {string} startsAtDate
 * @property {string} startsAtTime
 * @property {string} bookingDeadlineDate
 * @property {string} venueName
 * @property {string} venueAddress
 * @property {number} capacity
 * @property {number} unitPriceCents Prix normal, avant promo.
 * @property {PromotionInput | null} promotion La promo, ou null s'il n'y en a pas.
 * @property {string} interacEmail En minuscules.
 * @property {boolean} autoDepositConfirmed L'organisateur confirme le dépôt automatique de l'adresse.
 */

/**
 * Vérifie qu'une date `AAAA-MM-JJ` existe vraiment (pas de 30 février).
 * @param {string} value
 * @returns {boolean}
 */
function isCalendarDate(value) {
  const parts = LOCAL_DATE_PATTERN.exec(value);
  if (!parts) return false;
  const [year, month, day] = parts.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Convertit un prix saisi en dollars en cents entiers, sans calcul à virgule flottante (AD-6).
 * @param {string} value Le prix validé par PRICE_PATTERN.
 * @returns {number} Le prix en cents.
 */
function priceToCents(value) {
  const [, dollars, decimals = ""] = /** @type {RegExpExecArray} */ (PRICE_PATTERN.exec(value));
  return Number(dollars) * CENTS_PER_DOLLAR + Number(decimals.padEnd(2, "0"));
}

/**
 * Lit un prix tapé dans le formulaire ; sert aussi au calendrier des prix affiché en direct.
 * @param {string} value Le prix saisi (« 35 », « 35,50 »…).
 * @returns {number | null} Le prix en cents, ou null s'il n'est pas valide.
 */
export function parsePriceInput(value) {
  const text = value.trim();
  return PRICE_PATTERN.test(text) ? priceToCents(text) : null;
}

/**
 * Lit un champ facultatif en texte nettoyé ; toute autre valeur compte comme vide.
 * @param {unknown} value
 * @returns {string}
 */
function readOptionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Vérifie la promo quand elle est proposée : un prix plus bas que le prix normal, et une
 * période dont le dernier jour ne précède pas le premier. Sans promo, ses champs sont ignorés.
 * @param {{ hasPromotion: boolean, unitPrice: unknown, promotionalUnitPrice?: unknown, promotionStartDate?: unknown, promotionEndDate?: unknown }} values
 * @param {import("zod").RefinementCtx} context
 */
function checkPromotion(values, context) {
  if (!values.hasPromotion) {
    return;
  }
  /** @param {string} field @param {string} messageKey */
  const fail = (field, messageKey) =>
    context.addIssue({ code: "custom", path: [field], message: messageKey });
  const promotionPrice = parsePriceInput(readOptionalText(values.promotionalUnitPrice));
  const normalPrice = parsePriceInput(readOptionalText(values.unitPrice));
  if (promotionPrice === null) {
    fail("promotionalUnitPrice", "validation.priceInvalid");
  } else if (normalPrice !== null && promotionPrice >= normalPrice) {
    fail("promotionalUnitPrice", "validation.promotionPriceNotLower");
  }
  const startDate = readOptionalText(values.promotionStartDate);
  const endDate = readOptionalText(values.promotionEndDate);
  if (!isCalendarDate(startDate)) {
    fail("promotionStartDate", "validation.dateInvalid");
  }
  if (!isCalendarDate(endDate)) {
    fail("promotionEndDate", "validation.dateInvalid");
  } else if (isCalendarDate(startDate) && endDate < startDate) {
    // Les dates `AAAA-MM-JJ` se comparent dans l'ordre alphabétique.
    fail("promotionEndDate", "validation.promotionEndBeforeStart");
  }
}

/**
 * Écrit un prix en cents comme dans le champ du formulaire (« 35 » ou « 35,50 »).
 * @param {number} cents Le prix en cents.
 * @returns {string} Le prix en dollars, avec une virgule décimale.
 */
export function centsToPriceInput(cents) {
  const dollars = Math.floor(cents / CENTS_PER_DOLLAR);
  const rest = cents % CENTS_PER_DOLLAR;
  return rest === 0 ? String(dollars) : `${dollars},${String(rest).padStart(2, "0")}`;
}

const localDate = z
  .string({ error: "validation.dateInvalid" })
  .trim()
  .refine(isCalendarDate, { error: "validation.dateInvalid" });

const eventSettingsSchema = z
  .object({
    startsAtDate: localDate,
    startsAtTime: z
      .string({ error: "validation.timeInvalid" })
      .trim()
      .regex(LOCAL_TIME_PATTERN, { error: "validation.timeInvalid" }),
    bookingDeadlineDate: localDate,
    venueName: z
      .string({ error: "validation.venueNameInvalid" })
      .trim()
      .min(1, { error: "validation.venueNameInvalid" })
      .max(VENUE_NAME_MAX_LENGTH, { error: "validation.venueNameInvalid" }),
    venueAddress: z
      .string({ error: "validation.venueAddressInvalid" })
      .trim()
      .min(1, { error: "validation.venueAddressInvalid" })
      .max(VENUE_ADDRESS_MAX_LENGTH, { error: "validation.venueAddressInvalid" }),
    capacity: z
      .string({ error: "validation.capacityInvalid" })
      .trim()
      .regex(/^\d{1,4}$/, { error: "validation.capacityInvalid" })
      .transform(Number)
      .pipe(
        z
          .number()
          .int()
          .min(1, { error: "validation.capacityInvalid" })
          .max(CAPACITY_MAX, { error: "validation.capacityInvalid" }),
      ),
    unitPrice: z
      .string({ error: "validation.priceInvalid" })
      .trim()
      .regex(PRICE_PATTERN, { error: "validation.priceInvalid" }),
    interacEmail: z
      .string({ error: "validation.emailInvalid" })
      .trim()
      .toLowerCase()
      .max(EMAIL_MAX_LENGTH, { error: "validation.emailInvalid" })
      .pipe(z.email({ error: "validation.emailInvalid" })),
    autoDepositConfirmed: z.boolean().default(false),
    hasPromotion: z.boolean().default(false),
    // Vérifiés par checkPromotion, seulement quand une promo est proposée.
    promotionalUnitPrice: z.unknown().optional(),
    promotionStartDate: z.unknown().optional(),
    promotionEndDate: z.unknown().optional(),
  })
  .superRefine(checkPromotion)
  .transform(
    ({
      unitPrice,
      hasPromotion,
      promotionalUnitPrice,
      promotionStartDate,
      promotionEndDate,
      ...values
    }) => ({
      ...values,
      unitPriceCents: priceToCents(unitPrice),
      promotion: hasPromotion
        ? {
            unitPriceCents: priceToCents(readOptionalText(promotionalUnitPrice)),
            startDate: readOptionalText(promotionStartDate),
            endDate: readOptionalText(promotionEndDate),
          }
        : null,
    }),
  );

/**
 * Valide les paramètres envoyés par l'écran Paramètres.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: EventSettingsInput } | { success: false, fieldErrors: import("./field-errors.js").FieldError[] }}
 *   Les paramètres nettoyés, ou une erreur par champ fautif.
 */
export function validateEventSettings(raw) {
  return validateWith(eventSettingsSchema, raw);
}
