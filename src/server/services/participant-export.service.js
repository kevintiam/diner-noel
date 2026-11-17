// Export CSV des participants confirmés pour l'accueil le soir du dîner (brief §6, initiative R21).
// Il sert aussi à prévenir les inscrits d'un changement : courriel et téléphone en font partie.
import { toCsv } from "../../lib/csv.js";
import { utcToLocalDateTime } from "../../lib/dates.js";
import { findConfirmedParticipants } from "../db/reservation-admin.repository.js";

/** @typedef {import("../db/reservation-admin.repository.js").ConfirmedParticipant} ConfirmedParticipant */

// Point-virgule : Excel en français l'attend, et Google Sheets ou LibreOffice le détectent.
export const CSV_SEPARATOR = ";";
const CENTS_PER_DOLLAR = 100;
const LANGUAGE_NAMES = { FR: "Français", EN: "Anglais" };
const HEADER = [
  "Nom",
  "Prénom",
  "Code",
  "Places",
  "15 ans et plus",
  "Enfants (0 à 14 ans)",
  "Courriel",
  "Téléphone",
  "Langue",
  "Montant payé ($)",
  "Confirmée le",
  "Remarque",
];
// Ordre alphabétique français : « Élise » se range avec les « E ».
const NAME_ORDER = new Intl.Collator("fr-CA", { sensitivity: "base" });

/**
 * Écrit un montant pour un tableur en français (« 60,00 »), sans calcul à virgule flottante (AD-6).
 * @param {number} cents
 * @returns {string}
 */
function formatAmount(cents) {
  const dollars = Math.floor(cents / CENTS_PER_DOLLAR);
  const rest = String(cents % CENTS_PER_DOLLAR).padStart(2, "0");
  return `${dollars},${rest}`;
}

/**
 * Écrit un instant à l'heure d'Ottawa, dans une forme qu'un tableur trie (« 2026-11-20 10:05 »).
 * @param {Date | null} instant
 * @returns {string}
 */
function formatInstant(instant) {
  if (!instant) {
    return "";
  }
  const { date, time } = utcToLocalDateTime(instant);
  return `${date} ${time}`;
}

/**
 * Range les participants par nom, puis par prénom.
 * @param {ConfirmedParticipant} first
 * @param {ConfirmedParticipant} second
 * @returns {number}
 */
function compareByName(first, second) {
  return (
    NAME_ORDER.compare(first.lastName, second.lastName) ||
    NAME_ORDER.compare(first.firstName, second.firstName)
  );
}

/**
 * Construit le fichier CSV des participants confirmés, lu dans la base au moment de l'appel.
 * @param {{ now: Date }} context L'instant de l'export, pour le nom du fichier (AD-12).
 * @returns {Promise<{ filename: string, content: string, count: number }>} Le nom, le contenu et le nombre de réservations.
 */
export async function buildConfirmedParticipantsExport({ now }) {
  const participants = (await findConfirmedParticipants()).sort(compareByName);
  const rows = participants.map((participant) => [
    participant.lastName,
    participant.firstName,
    participant.code,
    participant.seats,
    participant.seats - participant.childSeats,
    participant.childSeats,
    participant.email,
    participant.phone,
    LANGUAGE_NAMES[participant.language] ?? participant.language,
    formatAmount(participant.amountCents),
    formatInstant(participant.confirmedAt),
    participant.note ?? "",
  ]);
  return {
    filename: `participants-confirmes-${utcToLocalDateTime(now).date}.csv`,
    content: toCsv([HEADER, ...rows], { separator: CSV_SEPARATOR }),
    count: participants.length,
  };
}
