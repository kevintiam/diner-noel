import { translate } from "@/i18n/translate";
import { formatMoney } from "@/lib/format";
import styles from "./ReservationStatusNotice.module.css";

/**
 * Affiche la confirmation payante ou l'annulation, sans formulaire de dépôt.
 * @param {{reservation: import("@/validation/reservation.schema").ReservationForPayment, lang: string, dictionary: import("@/i18n/translate").Dictionary}} props
 * @returns {React.ReactElement} L'état de la réservation.
 */
export default function ReservationStatusNotice({ reservation, lang, dictionary }) {
  const t = (key) => translate(dictionary, key);
  const cancelled = reservation.status === "CANCELLED";
  return (
    <section className={styles.page}>
      <h1>{t(cancelled ? "status.cancelledTitle" : "status.confirmedTitle")}</h1>
      <p role="status" className={styles.notice}>
        {t(cancelled ? "status.cancelled" : "status.confirmed")}
      </p>
      <dl className={styles.facts}>
        <dt>{t("payment.codeLabel")}</dt>
        <dd>{reservation.code}</dd>
        <dt>{t("received.seats")}</dt>
        <dd>{reservation.seats}</dd>
        <dt>{t("received.amount")}</dt>
        <dd>{formatMoney(reservation.amountCents, lang)}</dd>
      </dl>
    </section>
  );
}
