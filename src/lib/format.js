// Mise en forme des montants et des dates pour l'affichage, selon la langue.
// L'argent arrive toujours en cents (architecture AD-6).
import { EVENT_TIME_ZONE } from "./dates.js";

/** @type {Record<string, string>} */
const INTL_LOCALE_BY_LANG = { fr: "fr-CA", en: "en-CA" };
const CENTS_PER_DOLLAR = 100;

/**
 * @param {string} lang `fr` ou `en`.
 * @returns {string} La locale Intl correspondante.
 */
function toIntlLocale(lang) {
  return INTL_LOCALE_BY_LANG[lang] ?? INTL_LOCALE_BY_LANG.fr;
}

/**
 * Formate un montant en dollars canadiens (ex. « 25,00 $ » ou « $25.00 »).
 * @param {number} cents Le montant en cents.
 * @param {string} lang `fr` ou `en`.
 * @returns {string} Le montant formaté.
 */
export function formatMoney(cents, lang) {
  const formatter = new Intl.NumberFormat(toIntlLocale(lang), {
    style: "currency",
    currency: "CAD",
  });
  return formatter.format(cents / CENTS_PER_DOLLAR);
}

/**
 * Formate une date et son heure à l'heure d'Ottawa
 * (ex. « samedi 19 décembre 2026 à 18 h 00 »).
 * @param {Date} date L'instant à afficher.
 * @param {string} lang `fr` ou `en`.
 * @returns {string} La date formatée.
 */
export function formatEventDateTime(date, lang) {
  const formatter = new Intl.DateTimeFormat(toIntlLocale(lang), {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: EVENT_TIME_ZONE,
  });
  return formatter.format(date);
}
