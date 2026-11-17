// Cartes des compteurs du tableau de bord (maquette 7). « À vérifier » ressort :
// c'est le travail qui attend les organisateurs. Chaque carte ouvre la liste filtrée.
import { CircleCheck, CircleX, Clock, Hourglass } from "lucide-react";
import Link from "next/link";
import { formatCount } from "./reservation-labels";
import { summarizeReservations } from "./summarize-reservations";
import styles from "./DashboardStats.module.css";

/** @typedef {import("./summarize-reservations").ReservationStatus} ReservationStatus */

/** @type {Array<{ status: ReservationStatus, label: string, Icon: import("lucide-react").LucideIcon, tone: string }>} */
const CARDS = [
  { status: "TO_VERIFY", label: "À vérifier", Icon: Hourglass, tone: styles.toVerify },
  { status: "PENDING_PAYMENT", label: "En attente de paiement", Icon: Clock, tone: styles.pending },
  { status: "CONFIRMED", label: "Confirmées", Icon: CircleCheck, tone: styles.confirmed },
  { status: "CANCELLED", label: "Annulées", Icon: CircleX, tone: styles.cancelled },
];

/**
 * Affiche le nombre de réservations et de places pour chaque statut.
 * @param {{ reservations: Array<{ status: string, seats: number, amountCents: number }> }} props
 * @returns {React.ReactElement} Les quatre cartes.
 */
export default function DashboardStats({ reservations }) {
  const summary = summarizeReservations(reservations);
  return (
    <ul className={styles.stats} aria-label="Résumé des réservations">
      {CARDS.map(({ status, label, Icon, tone }) => {
        const { count, seats } = summary[status];
        const isUrgent = status === "TO_VERIFY" && count > 0;
        return (
          <li key={status} className={`${styles.item} ${tone}`}>
            <Link
              href={`/admin/reservations?status=${status}`}
              className={isUrgent ? `${styles.card} ${styles.urgent}` : styles.card}
            >
              <span className={styles.header}>
                <span className={styles.iconCircle} aria-hidden="true">
                  <Icon className={styles.icon} />
                </span>
                <span className={styles.label}>{label}</span>
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
