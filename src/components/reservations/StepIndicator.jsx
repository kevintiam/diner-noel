// « Étape 1 sur 2 » et sa barre de progression (maquettes 2 et 3).
import { translate } from "@/i18n/translate";
import styles from "./StepIndicator.module.css";

/**
 * Affiche l'étape en cours et sa barre de progression.
 * @param {{ current: number, total: number, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} L'indicateur d'étape.
 */
export default function StepIndicator({ current, total, dictionary }) {
  const steps = Array.from({ length: total }, (_, index) => index < current);
  return (
    <div className={styles.indicator}>
      <p className={styles.label}>
        {translate(dictionary, "reservation.step", { current, total })}
      </p>
      <div className={styles.bars} aria-hidden="true">
        {steps.map((isReached, index) => (
          <span key={index} className={isReached ? styles.barReached : styles.bar} />
        ))}
      </div>
    </div>
  );
}
