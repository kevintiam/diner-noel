"use client";

// Boutons de décision d'une fiche (maquette 7). Seules les décisions permises par le statut
// affiché sont proposées (architecture AD-4) ; le serveur garde le dernier mot, et son refus
// (réservation changée entre-temps, motif manquant) s'affiche dans le panneau.
import { Ban, Check, CircleCheck, CircleCheckBig, Hourglass, ListChecks, X } from "lucide-react";
import { useActionState } from "react";
import { formatMoney } from "@/lib/format";
import { updateReservationStatusAction } from "@/server/actions/organizer.actions";
import { REFUSAL_REASON_LABELS } from "./reservation-labels";
import panelStyles from "./ReservationDetail.module.css";
import styles from "./DecisionPanel.module.css";

// Statuts depuis lesquels un organisateur peut annuler (AD-4) : une réservation confirmée
// est définitive, son bouton « Annuler » disparaît.
const CANCELLABLE_STATUSES = new Set(["PENDING_PAYMENT", "TO_VERIFY"]);

/**
 * Valeurs de la réservation dont le panneau a besoin.
 * @typedef {object} DecisionReservation
 * @property {string} id
 * @property {string} code
 * @property {string} status
 * @property {string} firstName
 * @property {string} lastName
 * @property {number} amountCents
 */

/**
 * Titre commun du panneau de décision.
 * @returns {React.ReactElement}
 */
function DecisionTitle() {
  return (
    <h2 id="decision-title" className={panelStyles.panelTitle}>
      <span className={panelStyles.panelIcon} aria-hidden="true">
        <ListChecks />
      </span>
      Décision
    </h2>
  );
}

/**
 * Rappelle ce qu'il faut retrouver dans le compte bancaire avant de confirmer.
 * @param {{ reservation: DecisionReservation }} props
 * @returns {React.ReactElement}
 */
function BankChecklist({ reservation }) {
  return (
    <div className={styles.checklist}>
      <p className={styles.checkTitle}>Vérifiez dans le compte bancaire :</p>
      <ul className={styles.checks}>
        <li>
          <CircleCheck aria-hidden="true" className={styles.checkIcon} />
          <span>
            un virement de <strong>{formatMoney(reservation.amountCents, "fr")}</strong> a bien été
            reçu ;
          </span>
        </li>
        <li>
          <CircleCheck aria-hidden="true" className={styles.checkIcon} />
          <span>
            l’expéditeur correspond à{" "}
            <strong>
              {reservation.firstName} {reservation.lastName}
            </strong>{" "}
            ;
          </span>
        </li>
        <li>
          <CircleCheck aria-hidden="true" className={styles.checkIcon} />
          <span>
            le message contient le code <strong>{reservation.code}</strong>.
          </span>
        </li>
      </ul>
    </div>
  );
}

/**
 * Confirmer ou refuser : seulement quand une preuve attend d'être vérifiée.
 * @param {{ reservation: DecisionReservation, formAction: (formData: FormData) => void, isPending: boolean }} props
 * @returns {React.ReactElement}
 */
function PaymentDecision({ reservation, formAction, isPending }) {
  return (
    <>
      <BankChecklist reservation={reservation} />
      <form action={formAction} className={styles.confirmForm}>
        <input type="hidden" name="reservationId" value={reservation.id} />
        <button
          type="submit"
          name="decision"
          value="confirm"
          disabled={isPending}
          className={`${styles.button} ${styles.confirmButton}`}
        >
          <Check aria-hidden="true" className={styles.buttonIcon} />
          Confirmer le paiement
        </button>
        <p className={styles.hint}>La personne reçoit son courriel de confirmation.</p>
      </form>
      <p className={styles.separator} aria-hidden="true">
        ou
      </p>
      <form action={formAction} className={styles.refuseForm}>
        <input type="hidden" name="reservationId" value={reservation.id} />
        <label htmlFor="reasonCode" className={styles.fieldLabel}>
          Motif du refus
        </label>
        <select
          id="reasonCode"
          name="reasonCode"
          required
          defaultValue=""
          className={styles.select}
        >
          <option value="" disabled>
            Choisissez un motif
          </option>
          {Object.entries(REFUSAL_REASON_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          name="decision"
          value="refuse"
          disabled={isPending}
          className={`${styles.button} ${styles.refuseButton}`}
        >
          Refuser le paiement
        </button>
        <p className={styles.hint}>
          La personne reçoit le motif par courriel et garde ses places : elle peut envoyer une
          nouvelle preuve.
        </p>
      </form>
    </>
  );
}

/**
 * Affiche les décisions possibles sur une réservation.
 * @param {{ reservation: DecisionReservation }} props
 * @returns {React.ReactElement} Le panneau de décision.
 */
export default function DecisionPanel({ reservation }) {
  const [state, formAction, isPending] = useActionState(updateReservationStatusAction, null);
  if (reservation.status === "CANCELLED") {
    return (
      <section aria-labelledby="decision-title" className={panelStyles.panel}>
        <DecisionTitle />
        <p className={`${styles.state} ${styles.stateCancelled}`}>
          <Ban aria-hidden="true" className={styles.stateIcon} />
          Cette réservation est annulée : aucune action n’est possible.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="decision-title" className={panelStyles.panel}>
      <DecisionTitle />
      {state?.error ? (
        <p role="alert" className={styles.formError}>
          {state.error.message}
        </p>
      ) : null}
      {reservation.status === "TO_VERIFY" ? (
        <PaymentDecision reservation={reservation} formAction={formAction} isPending={isPending} />
      ) : null}
      {reservation.status === "PENDING_PAYMENT" ? (
        <p className={`${styles.state} ${styles.stateWaiting}`}>
          <Hourglass aria-hidden="true" className={styles.stateIcon} />
          En attente du virement et de sa preuve : rien à confirmer pour l’instant.
        </p>
      ) : null}
      {reservation.status === "CONFIRMED" ? (
        <p className={`${styles.state} ${styles.stateConfirmed}`}>
          <CircleCheckBig aria-hidden="true" className={styles.stateIcon} />
          Le paiement est confirmé : la réservation est définitive.
        </p>
      ) : null}
      {CANCELLABLE_STATUSES.has(reservation.status) ? (
        <form action={formAction} className={styles.cancelForm}>
          <input type="hidden" name="reservationId" value={reservation.id} />
          <p className={styles.cancelHelp}>
            L’annulation libère les places de cette réservation. Aucun courriel n’est envoyé.
          </p>
          <button
            type="submit"
            name="decision"
            value="cancel"
            disabled={isPending}
            className={`${styles.button} ${styles.cancelButton}`}
          >
            <X aria-hidden="true" className={styles.buttonIcon} />
            Annuler la réservation
          </button>
        </form>
      ) : null}
    </section>
  );
}
