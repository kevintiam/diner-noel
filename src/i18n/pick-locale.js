// Choix de la langue d'un visiteur qui arrive sans langue dans l'adresse,
// d'après l'en-tête Accept-Language de son navigateur.
import { DEFAULT_LOCALE, isLocale } from "./locales.js";

const QUALITY_PREFIX = "q=";

/**
 * Lit la qualité (`q=0.8`) d'une langue de l'en-tête ; 1 par défaut.
 * @param {string[]} parameters Les paramètres qui suivent la langue.
 * @returns {number} La qualité, entre 0 et 1.
 */
function readQuality(parameters) {
  const qualityParameter = parameters.find((parameter) => parameter.startsWith(QUALITY_PREFIX));
  if (!qualityParameter) {
    return 1;
  }
  const quality = Number(qualityParameter.slice(QUALITY_PREFIX.length));
  return Number.isNaN(quality) ? 0 : quality;
}

/**
 * Choisit `fr` ou `en` selon les préférences du navigateur ; `fr` par défaut.
 * @param {string | null | undefined} acceptLanguage La valeur de l'en-tête Accept-Language.
 * @returns {string} `fr` ou `en`.
 */
export function pickLocale(acceptLanguage) {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }
  const candidates = [];
  for (const entry of acceptLanguage.split(",")) {
    const [tag, ...parameters] = entry.split(";").map((part) => part.trim());
    const baseLanguage = tag.toLowerCase().split("-")[0];
    const quality = readQuality(parameters);
    if (isLocale(baseLanguage) && quality > 0) {
      candidates.push({ baseLanguage, quality });
    }
  }
  if (candidates.length === 0) {
    return DEFAULT_LOCALE;
  }
  // Tri stable : à qualité égale, l'ordre du navigateur est gardé.
  candidates.sort((first, second) => second.quality - first.quality);
  return candidates[0].baseLanguage;
}
