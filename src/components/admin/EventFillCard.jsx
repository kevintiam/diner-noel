// Bandeau « Le dîner » de la vue d'ensemble : date, remplissage de la salle et argent reçu,
// sur une seule bande. Les places prises viennent du seul calcul du serveur (AD-4).
import { CalendarClock, CalendarDays } from "lucide-react";
import { formatEventDate, formatEventTime, formatMoney, formatShortDateTime } from "@/lib/format";
import { describeDinnerCountdown, getFillPercent } from "./event-fill";
import { formatCount } from "./reservation-labels";
import styles from "./EventFillCard.module.css";

/**
 * Données de l'événement lues par le bandeau (extrait de `EventOverview`).
 * @typedef {object} EventFillData
 * @property {Date} startsAt
 * @property {Date} bookingDeadline
 * @property {number} capacity
 * @property {number} takenSeats
 * @property {number} seatsLeft
 * @property {boolean} isClosedByDeadline
 */

/**
 * Décrit l'état des réservations : ouvertes jusqu'à une date, complètes ou fermées.
 * @param {EventFillData} event
 * @returns {string}
 */
function describeBooking(event) {
  if (event.isClosedByDeadline) {
    return "Réservations fermées";
  }
  if (event.seatsLeft === 0) {
    return "Complet : plus aucune place libre";
  }
  return `Réservations jusqu’au ${formatShortDateTime(event.bookingDeadline, "fr")}`;
}

/**
 * Affiche la date du dîner, son remplissage et les montants reçus et attendus.
 * @param {{ event: EventFillData, now: Date, collectedCents: number, expectedCents: number }} props
 * @returns {React.ReactElement} Le bandeau.
 */
export default function EventFillCard({ event, now, collectedCents, expectedCents }) {
  const percent = getFillPercent(event.takenSeats, event.capacity);
  return (
    <section aria-labelledby="event-fill-title" className={styles.card}>
      <div className={styles.when}>
        <div className={styles.top}>
          <h2 id="event-fill-title" className={styles.eyebrow}>
            Le dîner
          </h2>
          <span className={styles.countdown}>{describeDinnerCountdown(event.startsAt, now)}</span>
        </div>
        <ul className={styles.facts}>
          <li>
            <CalendarDays aria-hidden="true" className={styles.factIcon} />
            {formatEventDate(event.startsAt, "fr")} · {formatEventTime(event.startsAt, "fr")}
          </li>
          <li>
            <CalendarClock aria-hidden="true" className={styles.factIcon} />
            {describeBooking(event)}
          </li>
        </ul>
      </div>
      <div className={styles.fill}>
        <p className={styles.seats}>
          <span className={styles.taken}>{event.takenSeats}</span>
          <span className={styles.capacity}>
            {" "}
            / {formatCount(event.capacity, "place", "places")}
          </span>
        </p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Places réservées"
          aria-valuemin={0}
          aria-valuemax={event.capacity}
          aria-valuenow={Math.min(event.takenSeats, event.capacity)}
          aria-valuetext={`${percent} % des places réservées`}
        >
          <div className={styles.bar} style={{ width: `${percent}%` }} />
        </div>
        <p className={styles.left}>
          {percent} % réservé ·{" "}
          {formatCount(event.seatsLeft, "place encore libre", "places encore libres")}
        </p>
      </div>
      <dl className={styles.money}>
        <div>
          <dt>Encaissé</dt>
          <dd>{formatMoney(collectedCents, "fr", { omitZeroCents: true })}</dd>
        </div>
        <div>
          <dt>À recevoir</dt>
          <dd>{formatMoney(expectedCents, "fr", { omitZeroCents: true })}</dd>
        </div>
      </dl>
    </section>
  );
}
