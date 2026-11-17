// Liste complète des réservations, avec recherche et filtre par statut dans l'adresse.
// requireOrganizer() passe avant toute lecture (architecture AD-9).
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { filterReservations } from "@/components/admin/filter-reservations";
import LoadingBlocks from "@/components/admin/LoadingBlocks";
import { formatCount, getLabel, STATUS_LABELS } from "@/components/admin/reservation-labels";
import ReservationFilters from "@/components/admin/ReservationFilters";
import ReservationTable from "@/components/admin/ReservationTable";
import { summarizeReservations } from "@/components/admin/summarize-reservations";
import { requireOrganizer } from "@/server/auth/require-organizer";
import { listReservationsForDashboard } from "@/server/services/organizer.service";
import { parseReservationListFilter } from "@/validation/reservation-filter.schema";
import styles from "../admin-page.module.css";

/** @typedef {{ searchParams: Promise<Record<string, string | string[] | undefined>> }} ListPageProps */

/**
 * Affiche toutes les réservations, les plus récentes d'abord.
 * @param {ListPageProps} props
 * @returns {React.ReactElement} La liste.
 */
export default function ReservationListPage({ searchParams }) {
  return (
    <>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Tableau de bord</p>
        <h1 className={styles.title}>Réservations</h1>
        <p className={styles.subtitle}>
          Cherchez une personne ou un code, ou filtrez par statut. Les plus récentes d’abord.
        </p>
      </header>
      <Suspense fallback={<LoadingBlocks label="Chargement des réservations…" />}>
        <AllReservations searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/**
 * Décrit le nombre de réservations affichées, et le total quand un filtre en cache.
 * @param {number} shown
 * @param {number} total
 * @param {string | null} status
 * @returns {string}
 */
function describeCount(shown, total, status) {
  const count = formatCount(shown, "réservation", "réservations");
  const statusPart = status === null ? "" : ` · ${getLabel(STATUS_LABELS, status)}`;
  if (shown === total) {
    return `${count}${statusPart}`;
  }
  return `${count} sur ${total}${statusPart}`;
}

/**
 * Lit les réservations d'un organisateur connecté et applique les filtres de l'adresse.
 * @param {ListPageProps} props
 * @returns {Promise<React.ReactElement>}
 */
async function AllReservations({ searchParams }) {
  await requireOrganizer();
  const filter = parseReservationListFilter(await searchParams);
  const reservations = await listReservationsForDashboard();
  // Les nombres des pastilles suivent la recherche en cours, tous statuts confondus.
  const searched = filterReservations(reservations, { status: null, query: filter.query });
  const summary = summarizeReservations(searched);
  const shown = filterReservations(searched, { status: filter.status, query: "" });
  const counts = {
    ALL: searched.length,
    TO_VERIFY: summary.TO_VERIFY.count,
    PENDING_PAYMENT: summary.PENDING_PAYMENT.count,
    CONFIRMED: summary.CONFIRMED.count,
    CANCELLED: summary.CANCELLED.count,
  };
  const hasFilter = filter.status !== null || filter.query !== "";
  return (
    <>
      <ReservationFilters filter={filter} counts={counts} />
      <p className={styles.count} role="status">
        {describeCount(shown.length, reservations.length, filter.status)}
      </p>
      {shown.length === 0 && hasFilter ? (
        <div className={styles.noMatch}>
          <SearchX aria-hidden="true" className={styles.noMatchIcon} />
          <p>Aucune réservation ne correspond à ces critères.</p>
          <Link href="/admin/reservations" className={styles.textLink}>
            Effacer les filtres
          </Link>
        </div>
      ) : (
        <ReservationTable reservations={shown} caption="Toutes les réservations" />
      )}
    </>
  );
}
