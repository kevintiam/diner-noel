// Pastille du statut d'une réservation, avec une couleur par statut (maquette 7).
import { getLabel, STATUS_LABELS } from "./reservation-labels";
import styles from "./StatusBadge.module.css";

/** @type {Record<string, string>} */
const TONE_BY_STATUS = {
  PENDING_PAYMENT: styles.pending,
  TO_VERIFY: styles.toVerify,
  CONFIRMED: styles.confirmed,
  CANCELLED: styles.cancelled,
};

/**
 * Affiche le statut en français dans une pastille colorée.
 * @param {{ status: string }} props
 * @returns {React.ReactElement} La pastille.
 */
export default function StatusBadge({ status }) {
  const tone = TONE_BY_STATUS[status] ?? styles.pending;
  return <span className={`${styles.badge} ${tone}`}>{getLabel(STATUS_LABELS, status)}</span>;
}
