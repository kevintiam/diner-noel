// Mise en forme des montants et des dates pour l'affichage, selon la langue.
// L'argent arrive toujours en cents (architecture AD-6) ; les heures sont celles d'Ottawa (AD-12).
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
 * Met la première lettre d'un texte en majuscule (« samedi » → « Samedi »).
 * @param {string} text
 * @returns {string}
 */
function capitalizeFirstLetter(text) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/**
 * Formate un montant en dollars canadiens (ex. « 25,00 $ » ou « $25.00 »).
 * Avec `omitZeroCents`, un montant rond s'écrit sans cents (« 25 $ », « $25 »).
 * @param {number} cents Le montant en cents.
 * @param {string} lang `fr` ou `en`.
 * @param {{ omitZeroCents?: boolean }} [options]
 * @returns {string} Le montant formaté.
 */
export function formatMoney(cents, lang, { omitZeroCents = false } = {}) {
  const isWholeAmount = cents % CENTS_PER_DOLLAR === 0;
  const fractionDigits = omitZeroCents && isWholeAmount ? 0 : 2;
  const formatter = new Intl.NumberFormat(toIntlLocale(lang), {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
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

/**
 * Formate la date seule, à l'heure d'Ottawa, avec une majuscule
 * (ex. « Samedi 19 décembre 2026 » ou « Saturday, December 19, 2026 »).
 * @param {Date} date L'instant à afficher.
 * @param {string} lang `fr` ou `en`.
 * @returns {string} La date formatée.
 */
export function formatEventDate(date, lang) {
  const formatter = new Intl.DateTimeFormat(toIntlLocale(lang), {
    dateStyle: "full",
    timeZone: EVENT_TIME_ZONE,
  });
  return capitalizeFirstLetter(formatter.format(date));
}

/**
 * Formate l'heure seule, à l'heure d'Ottawa ; une heure pile s'écrit sans minutes
 * (ex. « 18 h », « 18 h 30 », « 6 p.m. », « 6:30 p.m. »).
 * @param {Date} date L'instant à afficher.
 * @param {string} lang `fr` ou `en`.
 * @returns {string} L'heure formatée.
 */
export function formatEventTime(date, lang) {
  const locale = toIntlLocale(lang);
  const minuteFormatter = new Intl.DateTimeFormat(locale, {
    minute: "numeric",
    timeZone: EVENT_TIME_ZONE,
  });
  const isOnTheHour = Number(minuteFormatter.format(date)) === 0;
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: isOnTheHour ? undefined : "2-digit",
    timeZone: EVENT_TIME_ZONE,
  });
  return formatter.format(date);
}

/**
 * Extrait la ville d'une adresse : la dernière partie après la virgule
 * (« 75 Auriga Drive, Nepean » → « Nepean »).
 * @param {string} address L'adresse du lieu.
 * @returns {string} La ville, ou l'adresse entière s'il n'y a pas de virgule.
 */
export function getAddressCity(address) {
  const parts = address.split(",");
  return parts[parts.length - 1].trim();
}
