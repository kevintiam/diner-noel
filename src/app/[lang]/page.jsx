// Accueil simple (story 1.1) : le texte fixe est rendu à l'avance, les
// informations de la base arrivent dans un composant dynamique (AD-15).
import { Suspense } from "react";
import { getDictionary } from "@/i18n/get-dictionary";
import { translate } from "@/i18n/translate";
import EventDetails from "./_components/EventDetails";
import styles from "./page.module.css";

/**
 * Présente l'accueil et attend les données à jour sous Suspense.
 * @param {{ params: Promise<{ lang: string }> }} props
 * @returns {Promise<React.ReactElement>} L'accueil bilingue.
 */
export default async function HomePage({ params }) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{translate(dictionary, "home.title")}</h1>
      <p className={styles.intro}>{translate(dictionary, "home.intro")}</p>
      <Suspense
        fallback={<p className={styles.loading}>{translate(dictionary, "home.loading")}</p>}
      >
        <EventDetails lang={lang} />
      </Suspense>
    </main>
  );
}
