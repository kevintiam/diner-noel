// Bandeau de la vue d'ensemble : courriels au participant qui n'ont pas pu partir (AD-10).
// Absent quand tout est parti ; chaque ligne mène à la fiche, où l'échec se traite.
import { ArrowRight, MailExclamationPoint } from "lucide-react";
import Link from "next/link";
import { formatShortDateTime } from "@/lib/format";
import { EMAIL_KIND_LABELS, formatCount, getLabel } from "./reservation-labels";
import styles from "./EmailFailureCallout.module.css";

/**
 * Liste les courriels non envoyés que personne n'a encore traités, ou rien.
 * @param {{ failures: import("@/validation/email-failure.schema").OpenEmailFailureWithReservation[] }} props
 * @returns {React.ReactElement | null} Le bandeau, ou null.
 */
export default function EmailFailureCallout({ failures }) {
  if (failures.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="email-failures-title" className={styles.callout}>
      <div className={styles.header}>
        <span className={styles.iconCircle} aria-hidden="true">
          <MailExclamationPoint className={styles.icon} />
        </span>
        <div>
          <h2 id="email-failures-title" className={styles.title}>
            {formatCount(failures.length, "courriel non envoyé", "courriels non envoyés")}
          </h2>
          <p className={styles.text}>
            {failures.length > 1
              ? "Ces personnes n’ont pas reçu leur courriel : prévenez-les directement."
              : "Cette personne n’a pas reçu son courriel : prévenez-la directement."}
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {failures.map((failure) => (
          <li key={failure.id}>
            <Link
              href={`/admin/reservations/${encodeURIComponent(failure.reservation.id)}`}
              className={styles.row}
            >
              <span className={styles.who}>
                <span className={styles.code}>{failure.reservation.code}</span>
                <span className={styles.name}>
                  {failure.reservation.firstName} {failure.reservation.lastName}
                </span>
              </span>
              <span className={styles.meta}>
                {getLabel(EMAIL_KIND_LABELS, failure.kind)} ·{" "}
                {formatShortDateTime(failure.createdAt, "fr")}
              </span>
              <ArrowRight aria-hidden="true" className={styles.arrow} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
