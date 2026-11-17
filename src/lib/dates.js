// Seul endroit où l'on passe de l'heure d'Ottawa à l'UTC (architecture AD-12).
// La base stocke de l'UTC ; les organisateurs et les participants pensent en heure d'Ottawa.
import { TZDate } from "@date-fns/tz";

export const EVENT_TIME_ZONE = "America/Toronto";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

/**
 * Convertit une date et une heure d'Ottawa en instant UTC.
 * @param {string} localDate La date, au format `AAAA-MM-JJ`.
 * @param {string} localTime L'heure, au format `HH:MM` (24 h).
 * @returns {Date} L'instant correspondant.
 * @throws {Error} Si la date ou l'heure n'a pas le bon format.
 */
export function localDateTimeToUtc(localDate, localTime) {
  const dateParts = LOCAL_DATE_PATTERN.exec(localDate);
  const timeParts = LOCAL_TIME_PATTERN.exec(localTime);
  if (!dateParts || !timeParts) {
    throw new Error(`Date ou heure locale invalide : « ${localDate} ${localTime} »`);
  }
  const [, year, month, day] = dateParts.map(Number);
  const [, hours, minutes] = timeParts.map(Number);
  const zonedDate = new TZDate(year, month - 1, day, hours, minutes, EVENT_TIME_ZONE);
  return new Date(zonedDate.getTime());
}

/**
 * Donne la date et l'heure d'Ottawa d'un instant UTC, au format des champs de formulaire.
 * @param {Date} instant L'instant stocké en base.
 * @returns {{ date: string, time: string }} La date `AAAA-MM-JJ` et l'heure `HH:MM` (24 h).
 */
export function utcToLocalDateTime(instant) {
  const zoned = new TZDate(instant.getTime(), EVENT_TIME_ZONE);
  /** @param {number} value */
  const pad = (value) => String(value).padStart(2, "0");
  return {
    date: `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`,
    time: `${pad(zoned.getHours())}:${pad(zoned.getMinutes())}`,
  };
}
