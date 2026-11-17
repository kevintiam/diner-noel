import { translate } from "@/i18n/translate";
import { formatMoney } from "@/lib/format";
import styles from "./ReservationStatusNotice.module.css";

/**
 * Affiche l'accusé de dépôt sans exposer l'image ni les coordonnées du participant.
 * @param {{reservation: import("@/validation/reservation.schema").ReservationForPayment, lang: string, dictionary: import("@/i18n/translate").Dictionary}} props
 * @returns {React.ReactElement} La preuve reçue.
 */
export default function ProofReceived({ reservation, lang, dictionary }) {
  const t = (key, values) => translate(dictionary, key, values);
  return (
    <section className={styles.page}>
      <h1>{t("received.title")}</h1>
      <p>{t("received.greeting", { firstName: reservation.firstName })}</p>
      <p role="status" className={styles.notice}>
        {t("status.toVerify")}
      </p>
      <dl className={styles.facts}>
        <dt>{t("payment.codeLabel")}</dt>
        <dd>{reservation.code}</dd>
        <dt>{t("received.seats")}</dt>
        <dd>{reservation.seats}</dd>
        <dt>{t("received.amount")}</dt>
        <dd>{formatMoney(reservation.amountCents, lang)}</dd>
      </dl>
      <h2>{t("received.nextTitle")}</h2>
      <p>{t("received.next")}</p>
      <p>{t("received.keepLink")}</p>
    </section>
  );
}
