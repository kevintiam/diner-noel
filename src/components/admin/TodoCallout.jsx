// Bandeau « À faire » de la vue d'ensemble : une seule ligne. Il ressort en or quand des
// paiements attendent une vérification, et se fait discret quand tout est à jour.
import { ArrowRight, CircleCheckBig, Hourglass } from "lucide-react";
import Link from "next/link";
import { formatCount } from "./reservation-labels";
import styles from "./TodoCallout.module.css";

const TO_VERIFY_LIST_PATH = "/admin/reservations?status=TO_VERIFY";

/**
 * Affiche les paiements à vérifier avec un accès direct, ou une courte ligne rassurante.
 * @param {{ toVerifyCount: number }} props
 * @returns {React.ReactElement} Le bandeau.
 */
export default function TodoCallout({ toVerifyCount }) {
  if (toVerifyCount === 0) {
    return (
      <p className={`${styles.callout} ${styles.done}`}>
        <CircleCheckBig aria-hidden="true" className={styles.doneIcon} />
        <span>
          <strong>Tout est à jour</strong> : aucun paiement n’attend de vérification.
        </span>
      </p>
    );
  }
  return (
    <section aria-labelledby="todo-title" className={`${styles.callout} ${styles.work}`}>
      <span className={styles.iconCircle} aria-hidden="true">
        <Hourglass className={styles.icon} />
      </span>
      <div className={styles.body}>
        <h2 id="todo-title" className={styles.title}>
          {formatCount(toVerifyCount, "paiement à vérifier", "paiements à vérifier")}
        </h2>
        <p className={styles.text}>
          {toVerifyCount > 1
            ? "Comparez-les avec les virements Interac reçus."
            : "Comparez-le avec le virement Interac reçu."}
        </p>
      </div>
      <Link href={TO_VERIFY_LIST_PATH} className={styles.button}>
        Vérifier les paiements
        <ArrowRight aria-hidden="true" className={styles.buttonIcon} />
      </Link>
    </section>
  );
}
