import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import { translate } from "@/i18n/translate";
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format";
import styles from "./ReservationSummary.module.css";

/**
 * Informations publiques nécessaires au récapitulatif.
 * @typedef {object} ReservationEventDetails
 * @property {string} startsAt Date de début au format ISO.
 * @property {string} venueName Nom du lieu.
 * @property {string} venueAddress Adresse du lieu.
 */

/**
 * Présente le dîner, le montant recalculé et l’action de réservation.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary, lang: string, unitPriceCents: number, adultSeats: number, childSeats: number, isPending: boolean, eventDetails?: ReservationEventDetails }} props
 * @returns {React.ReactElement} Le récapitulatif et le bouton d’envoi du formulaire.
 */
export default function ReservationSummary({
  dictionary,
  lang,
  unitPriceCents,
  adultSeats,
  childSeats,
  isPending,
  eventDetails,
}) {
  /** @param {string} key @param {Record<string, string | number>} [replacements] */
  const getText = (key, replacements) => translate(dictionary, key, replacements);
  const unitPrice = formatMoney(unitPriceCents, lang);
  const totalCents = adultSeats * unitPriceCents;
  const total = formatMoney(totalCents, lang);
  const lineItem =
    adultSeats === 1
      ? getText("reservation.lineItemOne", { price: unitPrice })
      : getText("reservation.lineItem", { seats: adultSeats, price: unitPrice });
  const isFreeReservation = adultSeats + childSeats > 0 && totalCents === 0;
  const submitKey = isFreeReservation ? "reservation.submitFree" : "reservation.submit";
  const submitText = isPending ? getText("reservation.submitting") : getText(submitKey);
  const hintKey = isFreeReservation ? "reservation.freeHint" : "reservation.paymentHint";

  return (
    <aside className={styles.panel} aria-labelledby="reservation-summary-title">
      <div className={styles.photo}>
        <Image
          src="/images/christmas-table.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title} id="reservation-summary-title">
          {getText("reservation.summaryTitle")}
        </h2>
        {eventDetails ? (
          <ul className={styles.eventFacts}>
            <li>
              <CalendarDays aria-hidden="true" />
              <span>
                <span>{formatEventDate(new Date(eventDetails.startsAt), lang)}</span>
                <span className={styles.secondary}>
                  {formatEventTime(new Date(eventDetails.startsAt), lang)}
                </span>
              </span>
            </li>
            <li>
              <MapPin aria-hidden="true" />
              <span>
                <span>{eventDetails.venueName}</span>
                <span className={styles.secondary}>{eventDetails.venueAddress}</span>
              </span>
            </li>
          </ul>
        ) : null}
        <div className={styles.charges} aria-live="polite" aria-atomic="true">
          <p className={styles.lineItem}>
            <span>{lineItem}</span>
            <span>{total}</span>
          </p>
          <p className={styles.children}>
            {getText("reservation.childrenLine", { seats: childSeats })}
          </p>
          <p className={styles.total}>
            <span>{getText("reservation.total")}</span>
            <span>{total}</span>
          </p>
        </div>
        <button type="submit" className={styles.submit} disabled={isPending}>
          <span>{submitText}</span>
          <ArrowRight aria-hidden="true" />
        </button>
        <p className={styles.hint}>{getText(hintKey)}</p>
      </div>
    </aside>
  );
}
