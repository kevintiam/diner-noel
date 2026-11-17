// Calculs de la carte « Le dîner » du tableau de bord : remplissage et jours restants.
import { EVENT_TIME_ZONE } from "@/lib/dates";

const PERCENT = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Jour du calendrier à l'heure d'Ottawa : le dîner « demain » se compte en dates, pas en heures.
const DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/**
 * Calcule la part des places prises, bornée entre 0 et 100.
 * @param {number} takenSeats Les places déjà prises.
 * @param {number} capacity Le nombre total de places.
 * @returns {number} Le pourcentage arrondi (0 si la capacité est nulle).
 */
export function getFillPercent(takenSeats, capacity) {
  if (capacity <= 0) {
    return 0;
  }
  const safeTaken = Math.min(Math.max(takenSeats, 0), capacity);
  return Math.round((safeTaken / capacity) * PERCENT);
}

/**
 * Renvoie le jour du calendrier d'Ottawa d'un instant, en millisecondes UTC à minuit.
 * @param {Date} date
 * @returns {number}
 */
function toCalendarDay(date) {
  /** @type {Record<string, number>} */
  const parts = {};
  for (const part of DAY_FORMATTER.formatToParts(date)) {
    parts[part.type] = Number(part.value);
  }
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/**
 * Dit, en mots, dans combien de jours a lieu le dîner.
 * @param {Date} startsAt Le début du dîner.
 * @param {Date} now L'instant de la requête.
 * @returns {string} « Dans 33 jours », « Demain », « Aujourd’hui » ou « Dîner passé ».
 */
export function describeDinnerCountdown(startsAt, now) {
  if (startsAt.getTime() < now.getTime()) {
    return "Dîner passé";
  }
  const daysLeft = Math.round((toCalendarDay(startsAt) - toCalendarDay(now)) / MS_PER_DAY);
  if (daysLeft === 0) {
    return "Aujourd’hui";
  }
  if (daysLeft === 1) {
    return "Demain";
  }
  return `Dans ${daysLeft} jours`;
}
