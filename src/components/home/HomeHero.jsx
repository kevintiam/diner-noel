// Le carton d'invitation reste statique ; le lieu et les disponibilités sont lus à la demande.
import { translate } from "@/i18n/translate";
import styles from "./HomeHero.module.css";

/**
 * Affiche le bandeau de l'accueil.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary, children?: React.ReactNode }} props
 * @returns {React.ReactElement} Le bandeau.
 */
export default function HomeHero({ dictionary, children }) {
  return (
    <section className={styles.hero} id="hero" aria-labelledby="home-title">
      <div className={styles.inner}>
        <div className={styles.introduction}>
          <h1 id="home-title" className={styles.title}>
            {translate(dictionary, "home.title")}
          </h1>
          <p className={styles.subtitle}>{translate(dictionary, "hero.subtitle")}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/**
 * Réserve les zones du bandeau pendant la lecture des données de l’événement.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} Les emplacements d’attente du bandeau.
 */
export function HomeHeroPlaceholder({ dictionary }) {
  return (
    <>
      <div className={styles.factsPlaceholder} aria-hidden="true" />
      <p className={styles.bookingPlaceholder} role="status">
        {translate(dictionary, "home.loading")}
      </p>
      <div className={styles.photoPlaceholder} aria-hidden="true" />
      <div className={styles.countdownPlaceholder} aria-hidden="true" />
    </>
  );
}
