// « Comment réserver » en 3 étapes numérotées (maquette 1). Texte fixe, sans donnée.
import { translate } from "@/i18n/translate";
import styles from "./HowToBook.module.css";

const STEPS = [
  { key: "one", titleKey: "howTo.stepOneTitle", textKey: "howTo.stepOneText" },
  { key: "two", titleKey: "howTo.stepTwoTitle", textKey: "howTo.stepTwoText" },
  { key: "three", titleKey: "howTo.stepThreeTitle", textKey: "howTo.stepThreeText" },
];

/**
 * Affiche les 3 étapes pour réserver.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} La section « Comment réserver ».
 */
export default function HowToBook({ dictionary }) {
  return (
    <section className={styles.section} id="comment-reserver" aria-labelledby="how-to-title">
      <h2 id="how-to-title" className={styles.title}>
        {translate(dictionary, "howTo.title")}
      </h2>
      <ol className={styles.steps}>
        {STEPS.map(({ key, titleKey, textKey }, index) => (
          <li key={key} className={styles.step}>
            <span className={styles.number} aria-hidden="true">
              {index + 1}
            </span>
            <h3 className={styles.stepTitle}>{translate(dictionary, titleKey)}</h3>
            <p className={styles.stepText}>{translate(dictionary, textKey)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
