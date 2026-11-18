// Instructions de paiement Interac (maquette 3, sans le dépôt de la preuve,
// qui arrive avec la story 1.4). Composant d'affichage pur.
import CopyButton from "@/components/ui/CopyButton";
import { translate } from "@/i18n/translate";
import { formatMoney } from "@/lib/format";
import StepIndicator from "./StepIndicator";
import styles from "./PaymentInstructions.module.css";

/** @typedef {import("@/validation/reservation.schema").ReservationForPayment} ReservationForPayment */

/**
 * Affiche une adresse courriel qui, faute de place, se coupe juste après le « @ »
 * plutôt qu'au milieu d'un mot.
 * @param {{ email: string }} props
 * @returns {React.ReactElement} L'adresse, avec un point de coupure permis.
 */
function BreakableEmail({ email }) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex < 0) {
    return <>{email}</>;
  }
  return (
    <>
      {email.slice(0, atIndex + 1)}
      <wbr />
      {email.slice(atIndex + 1)}
    </>
  );
}

const PAYMENT_STEP_KEYS = [
  "payment.stepOne",
  "payment.stepTwo",
  "payment.stepThree",
  "payment.stepFour",
];

/**
 * Affiche le montant à envoyer, l'adresse Interac, le code et les étapes du virement.
 * @param {{ reservation: ReservationForPayment, lang: string, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} Les instructions.
 */
export default function PaymentInstructions({ reservation, lang, dictionary }) {
  /** @param {string} key @param {Record<string, string | number>} [replacements] */
  const getText = (key, replacements) => translate(dictionary, key, replacements);
  const unitPrice = formatMoney(reservation.unitPriceCents, lang);
  const adultSeats = reservation.seats - reservation.childSeats;
  const lineItem =
    adultSeats === 1
      ? getText("reservation.lineItemOne", { price: unitPrice })
      : getText("reservation.lineItem", { seats: adultSeats, price: unitPrice });

  return (
    <div className={styles.page}>
      <StepIndicator current={2} total={2} dictionary={dictionary} />
      <h1 className={styles.title}>{getText("payment.title")}</h1>
      <p className={styles.intro}>{getText("payment.intro")}</p>
      <p role="status" className={styles.saved}>
        {getText("payment.saved")}
      </p>

      <section className={styles.card}>
        <p className={styles.label}>{getText("payment.amountLabel")}</p>
        <p className={styles.amount}>{formatMoney(reservation.amountCents, lang)}</p>
        <p className={styles.muted}>{lineItem}</p>
        <p className={styles.muted}>
          {getText("reservation.childrenLine", { seats: reservation.childSeats })}
        </p>

        <div className={styles.copyRow}>
          <div className={styles.copyText}>
            <p className={styles.label}>{getText("payment.sendTo")}</p>
            <p id="interac-email" className={styles.value}>
              <BreakableEmail email={reservation.interacEmail} />
            </p>
          </div>
          <CopyButton
            value={reservation.interacEmail}
            label={getText("payment.copy")}
            copiedLabel={getText("payment.copied")}
            describedBy="interac-email"
          />
        </div>

        <div className={styles.copyRow}>
          <div className={styles.copyText}>
            <p className={styles.label}>{getText("payment.messageLabel")}</p>
            <p id="reservation-code" className={styles.code}>
              {reservation.code}
            </p>
          </div>
          <CopyButton
            value={reservation.code}
            label={getText("payment.copy")}
            copiedLabel={getText("payment.copied")}
            describedBy="reservation-code"
          />
        </div>

        <p className={styles.note}>{getText("payment.autoDeposit")}</p>
        <ol className={styles.steps} aria-label={getText("payment.stepsLabel")}>
          {PAYMENT_STEP_KEYS.map((key) => (
            <li key={key}>{getText(key)}</li>
          ))}
        </ol>
      </section>

      <p className={styles.noRefund}>{getText("payment.noRefund")}</p>
      <p className={styles.muted}>{getText("payment.keepLink")}</p>
    </div>
  );
}
