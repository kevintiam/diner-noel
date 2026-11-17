// Découpage d'une durée d'attente ; les dates reçues sont déjà des instants UTC.
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

/**
 * Calcule le temps restant avant le dîner, sans jamais afficher de valeur négative.
 * @param {number} targetTime L'instant du dîner en millisecondes.
 * @param {number} now L'instant courant en millisecondes.
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isFinished: boolean }}
 * @throws {RangeError} Si un instant n'est pas un nombre fini.
 */
export function getCountdownParts(targetTime, now) {
  if (!Number.isFinite(targetTime) || !Number.isFinite(now)) {
    throw new RangeError("Les instants du compte à rebours doivent être valides.");
  }
  const totalSeconds = Math.max(0, Math.ceil((targetTime - now) / MILLISECONDS_PER_SECOND));
  return {
    days: Math.floor(totalSeconds / SECONDS_PER_DAY),
    hours: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
    isFinished: totalSeconds === 0,
  };
}
