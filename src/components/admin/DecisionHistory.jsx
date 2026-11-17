// Historique des décisions d'une réservation, en frise : qui, quand et, pour un refus, pourquoi.
import { History } from "lucide-react";
import { formatShortDateTime } from "@/lib/format";
import { DECISION_LABELS, getLabel, REFUSAL_REASON_LABELS } from "./reservation-labels";
import styles from "./ReservationDetail.module.css";

// Couleur du point de chaque décision : vert pour confirmer, bordeaux pour refuser ou annuler.
/** @type {Record<string, string>} */
const TONE_BY_DECISION = {
  CONFIRM: styles.toneConfirm,
  REFUSE: styles.toneRefuse,
  CANCEL: styles.toneRefuse,
  AUTO_CANCEL: styles.toneNeutral,
};

/**
 * @typedef {object} DecisionEntry
 * @property {string} id
 * @property {string} type
 * @property {string | null} reasonCode
 * @property {Date} createdAt
 * @property {{ name: string } | null} organizer
 */

/**
 * Affiche les décisions, de la plus récente à la plus ancienne.
 * @param {{ decisions: DecisionEntry[] }} props
 * @returns {React.ReactElement} Le panneau d'historique.
 */
export default function DecisionHistory({ decisions }) {
  return (
    <section aria-labelledby="history-title" className={styles.panel}>
      <h2 id="history-title" className={styles.panelTitle}>
        <span className={styles.panelIcon} aria-hidden="true">
          <History />
        </span>
        Historique
      </h2>
      {decisions.length === 0 ? (
        <p className={styles.empty}>Aucune décision pour l’instant.</p>
      ) : (
        <ol className={styles.history}>
          {decisions.map((decision) => (
            <li
              key={decision.id}
              className={`${styles.historyItem} ${TONE_BY_DECISION[decision.type] ?? styles.toneNeutral}`}
            >
              <p className={styles.historyLabel}>
                {getLabel(DECISION_LABELS, decision.type)}
                {decision.reasonCode
                  ? ` · ${getLabel(REFUSAL_REASON_LABELS, decision.reasonCode)}`
                  : null}
              </p>
              <p className={styles.historyMeta}>
                {formatShortDateTime(decision.createdAt, "fr")} ·{" "}
                {decision.organizer?.name ?? "Automatique"}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
