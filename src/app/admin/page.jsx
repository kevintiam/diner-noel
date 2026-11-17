// Vue d'ensemble du tableau de bord. Le titre est fixe ; tout ce qui lit la session
// ou la base arrive sous <Suspense>, après requireOrganizer() (architecture AD-9, AD-15).
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import DashboardStats from "@/components/admin/DashboardStats";
import EventFillCard from "@/components/admin/EventFillCard";
import LoadingBlocks from "@/components/admin/LoadingBlocks";
import ReservationTable from "@/components/admin/ReservationTable";
import { summarizeReservations } from "@/components/admin/summarize-reservations";
import TodoCallout from "@/components/admin/TodoCallout";
import { describeError, logger } from "@/lib/logger";
import { requireOrganizer } from "@/server/auth/require-organizer";
import { getAccountingSummary } from "@/server/services/accounting.service";
import { getEventOverview } from "@/server/services/event.service";
import { listReservationsForDashboard } from "@/server/services/organizer.service";
import styles from "./admin-page.module.css";

const RECENT_RESERVATIONS_COUNT = 8;

/**
 * Affiche ce qui attend les organisateurs, le remplissage et les réservations récentes.
 * @returns {React.ReactElement} La vue d'ensemble.
 */
export default function AdminDashboardPage() {
  return (
    <>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Tableau de bord</p>
        <h1 className={styles.title}>Vue d’ensemble</h1>
        <p className={styles.subtitle}>
          Les paiements à vérifier, le remplissage du dîner et les dernières réservations.
        </p>
      </header>
      <Suspense fallback={<LoadingBlocks label="Chargement des réservations…" />}>
        <DashboardOverview />
      </Suspense>
    </>
  );
}

/**
 * Lit l'événement pour la carte « Le dîner ». Une panne n'empêche pas de vérifier
 * les paiements : la carte disparaît et l'erreur est journalisée.
 * @param {Date} now L'instant de la requête.
 * @param {string} organizerId L'organisateur connecté, pour le journal.
 * @returns {Promise<import("@/validation/event.schema").EventOverview | null>}
 */
async function readEventOverview(now, organizerId) {
  try {
    return await getEventOverview(now);
  } catch (error) {
    logger.error("admin_event_overview_failed", {
      route: "/admin",
      method: "GET",
      organizerId,
      ...describeError(error),
    });
    return null;
  }
}

/**
 * Lit les réservations et l'événement pour un organisateur connecté, et les présente.
 * @returns {Promise<React.ReactElement>}
 */
async function DashboardOverview() {
  const organizer = await requireOrganizer();
  const now = new Date();
  const [reservations, event, accounting] = await Promise.all([
    listReservationsForDashboard(),
    readEventOverview(now, organizer.id),
    // Encaissé et en attente n'ont qu'une définition : celle du service des comptes (AD-6).
    getAccountingSummary(),
  ]);
  const summary = summarizeReservations(reservations);
  return (
    <div className={styles.stack}>
      <TodoCallout toVerifyCount={summary.TO_VERIFY.count} />
      <div className={styles.overview}>
        {event ? (
          <EventFillCard
            event={event}
            now={now}
            collectedCents={accounting.collectedCents}
            expectedCents={accounting.pendingCents}
          />
        ) : null}
        <DashboardStats reservations={reservations} />
      </div>
      <section aria-labelledby="recent-title">
        <div className={styles.sectionHeader}>
          <h2 id="recent-title" className={styles.sectionTitle}>
            Réservations récentes
          </h2>
          <Link href="/admin/reservations" className={styles.textLink}>
            Voir toutes les réservations
            <ArrowRight aria-hidden="true" className={styles.linkIcon} />
          </Link>
        </div>
        <ReservationTable
          reservations={reservations.slice(0, RECENT_RESERVATIONS_COUNT)}
          caption="Les réservations les plus récentes"
        />
      </section>
    </div>
  );
}
