// Barre des places déjà réservées sur la capacité (maquette 1, rappel final).
import styles from "./SeatsProgress.module.css";

const PERCENT = 100;

/**
 * Affiche la barre de progression des places réservées.
 * @param {{ taken: number, capacity: number, label: string }} props
 * @returns {React.ReactElement} La barre.
 */
export default function SeatsProgress({ taken, capacity, label }) {
  const safeCapacity = Math.max(capacity, 0);
  const safeTaken = Math.max(0, Math.min(taken, safeCapacity));
  const percent = Math.round((safeTaken / Math.max(safeCapacity, 1)) * PERCENT);
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeCapacity}
      aria-valuenow={safeTaken}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
