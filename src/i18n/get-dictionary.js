// Accès aux dictionnaires : la seule source des textes publics (architecture AD-3).
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";
import { DEFAULT_LOCALE } from "./locales.js";

/** @typedef {import("./translate.js").Dictionary} Dictionary */

/** @type {Record<string, Dictionary>} */
const DICTIONARIES = { fr, en };

/**
 * Renvoie le dictionnaire d'une langue, ou le français pour une langue inconnue.
 * @param {string} lang `fr` ou `en`.
 * @returns {Dictionary} Le dictionnaire.
 */
export function getDictionary(lang) {
  return Object.hasOwn(DICTIONARIES, lang) ? DICTIONARIES[lang] : DICTIONARIES[DEFAULT_LOCALE];
}
