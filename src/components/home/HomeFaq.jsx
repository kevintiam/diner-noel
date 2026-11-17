import { ChevronDown } from "lucide-react";
import { translate } from "@/i18n/translate";
import styles from "./HomeFaq.module.css";

const QUESTIONS = ["payment", "proof", "refund"];

/**
 * Présente les réponses aux questions sur le parcours de réservation existant.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} La foire aux questions bilingue.
 */
export default function HomeFaq({ dictionary }) {
  return (
    <section className={styles.section} id="faq" aria-labelledby="faq-title">
      <div className={styles.inner}>
        <h2 id="faq-title" className={styles.title}>
          {translate(dictionary, "faq.title")}
        </h2>
        <div className={styles.questions}>
          {QUESTIONS.map((question) => (
            <details className={styles.question} key={question}>
              <summary>
                <span>{translate(dictionary, `faq.${question}Question`)}</span>
                <ChevronDown aria-hidden="true" className={styles.icon} />
              </summary>
              <p>{translate(dictionary, `faq.${question}Answer`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
