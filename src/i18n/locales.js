// Langues du site public (architecture AD-3).

export const LOCALES = ["fr", "en"];
export const DEFAULT_LOCALE = "fr";

/**
 * Indique si une valeur est une langue du site.
 * @param {unknown} value La valeur à tester (ex. le premier segment de l'adresse).
 * @returns {boolean} Vrai pour `fr` ou `en`.
 */
export function isLocale(value) {
  return typeof value === "string" && LOCALES.includes(value);
}
