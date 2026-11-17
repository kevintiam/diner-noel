// Lien personnel d'une réservation, montré aux organisateurs sur la fiche admin.
// Il part de SITE_URL seul, jamais des en-têtes de la requête (AD-7), et n'exige pas
// le SMTP : une configuration de courriel absente ne doit pas masquer le lien.
import { getSiteUrl } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { buildPersonalUrl, toEmailLang } from "../email/templates/email-layout.js";

/**
 * Réservation telle que le lien personnel la lit.
 * @typedef {object} ReservationForPersonalLink
 * @property {string} id L'identifiant interne, seul élément journalisé.
 * @property {string} token Le jeton du lien personnel, jamais journalisé.
 * @property {string} language `FR` ou `EN`, la langue de la réservation.
 */

/**
 * Construit l'adresse de la page de la réservation, dans sa langue, pour l'organisateur.
 * À n'appeler qu'après requireOrganizer() : le lien donne accès à la réservation.
 * @param {ReservationForPersonalLink} reservation La réservation affichée.
 * @param {Record<string, unknown>} [source] Les variables à lire ; sans elles, getSiteUrl lit l'environnement.
 * @returns {string | null} L'adresse complète, ou null si SITE_URL manque ou est invalide.
 */
export function getPersonalLinkForOrganizer(reservation, source) {
  let siteUrl;
  try {
    siteUrl = getSiteUrl(source);
  } catch {
    logger.warn("personal_link_unavailable", { reservationId: reservation.id });
    return null;
  }
  return buildPersonalUrl(toEmailLang(reservation.language), reservation.token, siteUrl);
}
