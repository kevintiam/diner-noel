// Compteurs du tableau de bord. « À vérifier » n'y figure pas : le bandeau « À faire »
// l'annonce déjà, avec son bouton. Chaque carte ouvre la liste filtrée sur son statut.
import { CircleCheck, CircleX, Clock } from "lucide-react";
import Link from "next/link";
import { formatCount } from "./reservation-labels";
import { summarizeReservations } from "./summarize-reservations";
import styles from "./DashboardStats.module.css";

/** @typedef {import("./summarize-reservations").ReservationStatus} ReservationStatus */

/**
 * Une carte par statut. Le libellé court remplace le long sur téléphone, où les trois
 * cartes tiennent sur une ligne.
 * @type {Array<{ status: ReservationStatus, label: string, shortLabel: string, Icon: import("lucide-react").LucideIcon, tone: string }>}
 */
const CARDS = [
  {
    status: "PENDING_PAYMENT",
    label: "En attente de paiement",
    shortLabel: "En attente",
    Icon: Clock,
    tone: styles.pending,
  },
  {
    status: "CONFIRMED",
    label: "Confirmées",
    shortLabel: "Confirmées",
    Icon: CircleCheck,
    tone: styles.confirmed,
  },
  {
    status: "CANCELLED",
    label: "Annulées",
    shortLabel: "Annulées",
    Icon: CircleX,
    tone: styles.cancelled,
  },
];

/**
 * Affiche le nombre de réservations et de places des statuts autres que « À vérifier ».
 * @param {{ reservations: Array<{ status: string, seats: number, amountCents: number }> }} props
 * @returns {React.ReactElement} Les trois cartes.
 */
export default function DashboardStats({ reservations }) {
  const summary = summarizeReservations(reservations);
  return (
    <ul className={styles.stats} aria-label="Résumé des réservations">
      {CARDS.map(({ status, label, shortLabel, Icon, tone }) => {
        const { count, seats } = summary[status];
        return (
          <li key={status} className={`${styles.item} ${tone}`}>
            <Link href={`/admin/reservations?status=${status}`} className={styles.card}>
              <span className={styles.header}>
                <span className={styles.iconCircle} aria-hidden="true">
                  <Icon className={styles.icon} />
                </span>
                <span className={styles.label}>
                  <span className={styles.labelLong}>{label}</span>
                  <span className={styles.labelShort}>{shortLabel}</span>
                </span>
              </span>{" "}
              <span className={styles.value}>
                {count}
                <span className={styles.unit}>{count > 1 ? " réservations" : " réservation"}</span>
              </span>{" "}
              <span className={styles.detail}>{formatCount(seats, "place", "places")}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
