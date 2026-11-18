// Fiche d'une réservation. requireOrganizer() passe avant la lecture de l'adresse et de la base
// (architecture AD-9) ; tout ce qui lit la requête est sous <Suspense> (AD-15).
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DecisionHistory from "@/components/admin/DecisionHistory";
import DecisionPanel from "@/components/admin/DecisionPanel";
import EmailFailureNotice from "@/components/admin/EmailFailureNotice";
import InitialsAvatar from "@/components/admin/InitialsAvatar";
import LoadingBlocks from "@/components/admin/LoadingBlocks";
import PersonalLinkPanel from "@/components/admin/PersonalLinkPanel";
import ProofList from "@/components/admin/ProofList";
import ReservationFacts from "@/components/admin/ReservationFacts";
import StatusBadge from "@/components/admin/StatusBadge";
import CopyButton from "@/components/ui/CopyButton";
import { formatShortDateTime } from "@/lib/format";
import { requireOrganizer } from "@/server/auth/require-organizer";
import { AppError } from "@/server/errors/app-error";
import { getReservationDetail } from "@/server/services/organizer.service";
import { getPersonalLinkForOrganizer } from "@/server/services/personal-link.service";
import styles from "../../admin-page.module.css";

const NOT_FOUND_STATUS = 404;

/**
 * Affiche la fiche d'une réservation.
 * @param {{ params: Promise<{ id: string }> }} props
 * @returns {React.ReactElement} La fiche.
 */
export default function ReservationDetailPage({ params }) {
  return (
    <>
      <p className={styles.backLink}>
        <Link href="/admin/reservations" className={styles.textLink}>
          <ArrowLeft aria-hidden="true" className={styles.linkIcon} />
          Toutes les réservations
        </Link>
      </p>
      <Suspense
        fallback={
          <LoadingBlocks label="Chargement de la réservation…" blocks={["row", "tall", "tall"]} />
        }
      >
        <ReservationDetail params={params} />
      </Suspense>
    </>
  );
}

/**
 * Lit une réservation, ou affiche la page introuvable si elle n'existe pas.
 * @param {string} id
 */
async function readReservation(id) {
  try {
    return await getReservationDetail(id);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === NOT_FOUND_STATUS) {
      notFound();
    }
    throw error;
  }
}

/**
 * Vérifie l'organisateur, puis lit et présente la réservation.
 * @param {{ params: Promise<{ id: string }> }} props
 * @returns {Promise<React.ReactElement>}
 */
async function ReservationDetail({ params }) {
  await requireOrganizer();
  const { id } = await params;
  const reservation = await readReservation(id);
  // Après requireOrganizer() : le lien donne accès à la réservation (AD-7).
  const personalLink = getPersonalLinkForOrganizer(reservation);
  const fullName = `${reservation.firstName} ${reservation.lastName}`;
  return (
    <>
      <header className={styles.detailHero}>
        <InitialsAvatar name={fullName} />
        <div className={styles.detailIdentity}>
          <p className={styles.eyebrow}>Réservation</p>
          <div className={styles.detailTitleRow}>
            <h1 className={styles.code}>{reservation.code}</h1>
            <StatusBadge status={reservation.status} />
          </div>
          <p className={styles.detailMeta}>
            {fullName} · reçue le {formatShortDateTime(reservation.createdAt, "fr")}
          </p>
        </div>
        {/* Copier le code aide à le retrouver dans le message des virements reçus. */}
        <div className={styles.detailActions}>
          <CopyButton value={reservation.code} label="Copier le code" copiedLabel="Code copié" />
        </div>
      </header>
      {/* Enregistré en base : l'alerte reste jusqu'à ce qu'un organisateur la traite (AD-10). */}
      <EmailFailureNotice reservationId={reservation.id} failures={reservation.emailFailures} />
      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <ReservationFacts reservation={reservation} />
          <PersonalLinkPanel url={personalLink} />
          <ProofList proofs={reservation.proofs} />
        </div>
        <div className={styles.column}>
          {/* La clé remet le panneau à zéro après chaque décision : une ancienne erreur disparaît.
              Seules les valeurs utiles partent vers le navigateur. */}
          <DecisionPanel
            key={`${reservation.status}-${reservation.decisions.length}`}
            reservation={{
              id: reservation.id,
              code: reservation.code,
              status: reservation.status,
              firstName: reservation.firstName,
              lastName: reservation.lastName,
              amountCents: reservation.amountCents,
            }}
          />
          <DecisionHistory decisions={reservation.decisions} />
        </div>
      </div>
    </>
  );
}
