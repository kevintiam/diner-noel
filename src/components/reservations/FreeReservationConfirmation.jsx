import { translate } from "@/i18n/translate";
import styles from "./PaymentInstructions.module.css";

/**
 * Confirme une inscription gratuite sans présenter d'instructions de virement.
 * @param {{ reservation: import("@/validation/reservation.schema").ReservationForPayment, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} La confirmation et les effectifs enregistrés.
 */
export default function FreeReservationConfirmation({ reservation, dictionary }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(dictionary, "payment.freeTitle")}</h1>
      <p role="status" className={styles.saved}>
        {translate(dictionary, "payment.freeIntro")}
      </p>
      <section className={styles.card}>
        <p>{translate(dictionary, "payment.codeLabel")}</p>
        <p className={styles.code}>{reservation.code}</p>
        <p>
          {translate(dictionary, "reservation.adultSeats")}:{" "}
          {reservation.seats - reservation.childSeats}
        </p>
        <p>
          {translate(dictionary, "reservation.childSeats")}: {reservation.childSeats}
        </p>
      </section>
    </div>
  );
}
