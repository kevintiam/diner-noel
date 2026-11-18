// Alerte de la fiche : un courriel au participant n'a pas pu partir (architecture AD-10).
// Elle reste affichée, à chaque visite, jusqu'à ce qu'un organisateur indique avoir
// prévenu la personne ; l'échec est alors noté comme traité, jamais effacé.
import { MailCheck, MailExclamationPoint } from "lucide-react";
import { formatShortDateTime } from "@/lib/format";
import { resolveEmailFailuresAction } from "@/server/actions/organizer.actions";
import { EMAIL_KIND_LABELS, getLabel } from "./reservation-labels";
import styles from "./EmailFailureNotice.module.css";

/**
 * Affiche les courriels non envoyés d'une réservation, ou rien s'il n'y en a pas.
 * @param {{ reservationId: string, failures: import("@/validation/email-failure.schema").OpenEmailFailure[] }} props
 * @returns {React.ReactElement | null} L'alerte, ou null.
 */
export default function EmailFailureNotice({ reservationId, failures }) {
  if (failures.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="email-failure-title" className={styles.notice}>
      <MailExclamationPoint aria-hidden="true" className={styles.icon} />
      <div className={styles.body}>
        <h2 id="email-failure-title" className={styles.title}>
          {failures.length > 1
            ? "Des courriels n’ont pas pu partir"
            : "Un courriel n’a pas pu partir"}
        </h2>
        <ul className={styles.list}>
          {failures.map((failure) => (
            <li key={failure.id}>
              {getLabel(EMAIL_KIND_LABELS, failure.kind)} ·{" "}
              {formatShortDateTime(failure.createdAt, "fr")}
            </li>
          ))}
        </ul>
        <p className={styles.text}>
          {failures.length > 1 ? "La personne ne les a pas reçus." : "La personne ne l’a pas reçu."}{" "}
          Prévenez-la directement, par courriel ou par téléphone, puis indiquez-le ici.
        </p>
        <form action={resolveEmailFailuresAction}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <button type="submit" className={styles.button}>
            <MailCheck aria-hidden="true" className={styles.buttonIcon} />
            J’ai prévenu la personne
          </button>
        </form>
      </div>
    </section>
  );
}
