// Bouton « Réserver ma place » de l'accueil, ou la raison pour laquelle on ne
// peut plus réserver (complet, ou date limite passée).
import Link from "next/link";
import { translate } from "@/i18n/translate";
import styles from "./BookingCallToAction.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */
/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */

/**
 * Affiche le bouton de réservation, ou la raison pour laquelle on ne peut plus réserver.
 * @param {{ overview: EventOverview, lang: string, dictionary: Dictionary }} props
 * @returns {React.ReactElement} Le bouton, ou le message de fermeture.
 */
export default function BookingCallToAction({ overview, lang, dictionary }) {
  if (overview.isBookingOpen) {
    return (
      <Link href={`/${lang}/reservation`} className={styles.cta}>
        {translate(dictionary, "booking.cta")}
      </Link>
    );
  }
  const messageKey = overview.isClosedByDeadline ? "booking.closed" : "booking.soldOut";
  return (
    <p role="status" className={styles.notice}>
      {translate(dictionary, messageKey)}
    </p>
  );
}
