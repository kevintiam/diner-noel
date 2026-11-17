// Bouton « Réserver ma place », ou la raison pour laquelle on ne peut plus réserver
// (complet, ou date limite passée). La variante `onDark` sert sur le bandeau vert.
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { translate } from "@/i18n/translate";
import styles from "./BookingCallToAction.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */
/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */

/**
 * Affiche le bouton de réservation, ou la raison pour laquelle on ne peut plus réserver.
 * @param {{ overview: EventOverview, lang: string, dictionary: Dictionary, variant?: "default" | "onDark" }} props
 * @returns {React.ReactElement} Le bouton, ou le message de fermeture.
 */
export default function BookingCallToAction({ overview, lang, dictionary, variant = "default" }) {
  const isOnDark = variant === "onDark";
  if (overview.isBookingOpen) {
    return (
      <Link
        href={`/${lang}/reservation`}
        className={isOnDark ? `${styles.cta} ${styles.ctaOnDark}` : styles.cta}
      >
        {translate(dictionary, "booking.cta")}
        <ArrowRight aria-hidden="true" className={styles.icon} />
      </Link>
    );
  }
  const messageKey = overview.isClosedByDeadline ? "booking.closed" : "booking.soldOut";
  return (
    <p
      role="status"
      className={isOnDark ? `${styles.notice} ${styles.noticeOnDark}` : styles.notice}
    >
      {translate(dictionary, messageKey)}
    </p>
  );
}
