// Informations du participant sur la fiche d'une réservation (maquette 7, panneau de droite).
import {
  Banknote,
  CalendarDays,
  CircleCheck,
  Languages,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import { formatMoney, formatShortDateTime } from "@/lib/format";
import { formatCount, getLabel, LANGUAGE_LABELS } from "./reservation-labels";
import styles from "./ReservationDetail.module.css";

/**
 * Réservation telle que la fiche la lit.
 * @typedef {object} ReservationFactsData
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {string} language
 * @property {number} seats
 * @property {number} childSeats
 * @property {number} amountCents
 * @property {string | null} note
 * @property {Date} createdAt
 * @property {Date | null} confirmedAt
 */

/**
 * Décrit les places, avec les enfants gratuits quand il y en a (ex. « 3 places dont 1 enfant »).
 * @param {number} seats Le total des places.
 * @param {number} childSeats Les places d'enfants.
 * @returns {string}
 */
export function describeSeats(seats, childSeats) {
  const total = formatCount(seats, "place", "places");
  if (childSeats === 0) {
    return total;
  }
  return `${total} dont ${formatCount(childSeats, "enfant", "enfants")}`;
}

/**
 * Une ligne de la liste d'informations : icône, intitulé et valeur.
 * @param {{ Icon: import("lucide-react").LucideIcon, label: string, children: React.ReactNode, isHighlighted?: boolean }} props
 * @returns {React.ReactElement}
 */
function Fact({ Icon, label, children, isHighlighted = false }) {
  return (
    <div className={styles.fact}>
      <dt>
        <Icon aria-hidden="true" className={styles.factIcon} />
        {label}
      </dt>
      <dd className={isHighlighted ? styles.amount : undefined}>{children}</dd>
    </div>
  );
}

/**
 * Affiche les coordonnées et les montants d'une réservation.
 * @param {{ reservation: ReservationFactsData }} props
 * @returns {React.ReactElement} Le panneau d'informations.
 */
export default function ReservationFacts({ reservation }) {
  const phoneLink = `tel:${reservation.phone.replace(/[^\d+]/g, "")}`;
  return (
    <section aria-labelledby="facts-title" className={styles.panel}>
      <h2 id="facts-title" className={styles.panelTitle}>
        <span className={styles.panelIcon} aria-hidden="true">
          <UserRound />
        </span>
        Participant
      </h2>
      <dl className={styles.facts}>
        <Fact Icon={UserRound} label="Nom">
          {reservation.firstName} {reservation.lastName}
        </Fact>
        <Fact Icon={Mail} label="Courriel">
          <a href={`mailto:${reservation.email}`}>{reservation.email}</a>
        </Fact>
        <Fact Icon={Phone} label="Téléphone">
          <a href={phoneLink}>{reservation.phone}</a>
        </Fact>
        <Fact Icon={Languages} label="Langue">
          {getLabel(LANGUAGE_LABELS, reservation.language)}
        </Fact>
        <Fact Icon={Users} label="Places">
          {describeSeats(reservation.seats, reservation.childSeats)}
        </Fact>
        <Fact Icon={Banknote} label="Montant attendu" isHighlighted>
          {formatMoney(reservation.amountCents, "fr")}
        </Fact>
        <Fact Icon={CalendarDays} label="Réservée le">
          {formatShortDateTime(reservation.createdAt, "fr")}
        </Fact>
        {reservation.confirmedAt ? (
          <Fact Icon={CircleCheck} label="Confirmée le">
            {formatShortDateTime(reservation.confirmedAt, "fr")}
          </Fact>
        ) : null}
      </dl>
      {reservation.note ? (
        <div className={styles.note}>
          <p className={styles.noteLabel}>
            <MessageSquareText aria-hidden="true" className={styles.factIcon} />
            Remarque du participant
          </p>
          <p>{reservation.note}</p>
        </div>
      ) : null}
    </section>
  );
}
