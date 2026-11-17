// Liste des réservations du tableau de bord (maquette 7). Chaque ligne est un lien vers
// la fiche : colonnes alignées sur ordinateur, petite carte sur téléphone, sans
// défilement horizontal. Le lien se lit d'une traite : nom, code, places, date, montant, statut.
import { ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import { formatMoney, formatShortDateTime } from "@/lib/format";
import InitialsAvatar from "./InitialsAvatar";
import StatusBadge from "./StatusBadge";
import { formatCount } from "./reservation-labels";
import styles from "./ReservationTable.module.css";

/**
 * Réservation telle que la liste du tableau de bord la lit.
 * @typedef {object} DashboardReservation
 * @property {string} id
 * @property {string} code
 * @property {string} status
 * @property {string} firstName
 * @property {string} lastName
 * @property {number} seats
 * @property {number} amountCents
 * @property {Date} createdAt
 */

/**
 * Affiche les réservations, avec un lien vers la fiche de chacune.
 * @param {{ reservations: DashboardReservation[], caption: string }} props
 * @returns {React.ReactElement} La liste, ou un message quand elle est vide.
 */
export default function ReservationTable({ reservations, caption }) {
  if (reservations.length === 0) {
    return (
      <div className={styles.empty}>
        <Inbox aria-hidden="true" className={styles.emptyIcon} />
        <p>Aucune réservation pour le moment.</p>
      </div>
    );
  }
  return (
    <div className={styles.frame}>
      {/* Titres des colonnes, visibles sur ordinateur ; chaque lien porte déjà ses informations. */}
      <div className={styles.columns} aria-hidden="true">
        <span className={styles.columnParticipant}>Participant</span>
        <span className={styles.columnSeats}>Places</span>
        <span className={styles.columnAmount}>Montant</span>
        <span className={styles.columnDate}>Reçue le</span>
        <span className={styles.columnStatus}>Statut</span>
      </div>
      <ul className={styles.list} aria-label={caption}>
        {reservations.map((reservation) => {
          const fullName = `${reservation.firstName} ${reservation.lastName}`;
          return (
            <li key={reservation.id}>
              <Link href={`/admin/reservations/${reservation.id}`} className={styles.row}>
                <span className={styles.avatar}>
                  <InitialsAvatar name={fullName} />
                </span>
                <span className={styles.name}>{fullName}</span>{" "}
                <span className={styles.meta}>
                  <span className={styles.code}>{reservation.code}</span>{" "}
                  <span className={styles.seats}>
                    {formatCount(reservation.seats, "place", "places")}
                  </span>{" "}
                  <span className={styles.date}>
                    {formatShortDateTime(reservation.createdAt, "fr")}
                  </span>
                </span>{" "}
                <span className={styles.amount}>
                  {formatMoney(reservation.amountCents, "fr", { omitZeroCents: true })}
                </span>{" "}
                <span className={styles.status}>
                  <StatusBadge status={reservation.status} />
                </span>
                <ChevronRight aria-hidden="true" className={styles.chevron} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
