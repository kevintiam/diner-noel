// Invitation finale avec l’état réel des réservations.
import BookingCallToAction from "@/components/event/BookingCallToAction";
import { translate } from "@/i18n/translate";
import styles from "./FinalCallToAction.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */

/**
 * Affiche l’invitation finale et le bouton de réservation.
 * @param {{ overview: EventOverview, lang: string, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} La section du rappel final.
 */
export default function FinalCallToAction({ overview, lang, dictionary }) {
  return (
    <section className={styles.section} id="reservation" aria-labelledby="final-title">
      <div className={styles.inner}>
        <h2 id="final-title" className={styles.title}>
          {translate(dictionary, "final.title")}
        </h2>
        <p className={styles.intro}>{translate(dictionary, "final.intro")}</p>
        <BookingCallToAction
          overview={overview}
          lang={lang}
          dictionary={dictionary}
          variant="onDark"
        />
      </div>
    </section>
  );
}
