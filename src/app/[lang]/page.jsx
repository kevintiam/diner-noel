// Accueil (maquette 1). Les parties fixes sont rendues à l'avance ; les parties
// qui lisent la base arrivent sous Suspense (architecture AD-15).
import { Suspense } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeFaq from "@/components/home/HomeFaq";
import HowToBook from "@/components/home/HowToBook";
import { getDictionary } from "@/i18n/get-dictionary";
import { translate } from "@/i18n/translate";
import {
  FinalCallToActionSection,
  HeroEventDetails,
  PracticalInfoSection,
} from "./_components/HomeSections";
import styles from "./page.module.css";

/**
 * Assemble les sections de l'accueil dans l'ordre de la maquette.
 * @param {{ params: Promise<{ lang: string }> }} props
 * @returns {Promise<React.ReactElement>} L'accueil bilingue.
 */
export default async function HomePage({ params }) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  const loading = <p className={styles.loading}>{translate(dictionary, "home.loading")}</p>;
  return (
    <main>
      <HomeHero dictionary={dictionary}>
        <Suspense fallback={loading}>
          <HeroEventDetails lang={lang} />
        </Suspense>
      </HomeHero>
      <div className={styles.sections}>
        <Suspense fallback={loading}>
          <PracticalInfoSection lang={lang} />
        </Suspense>
        <HowToBook dictionary={dictionary} />
      </div>
      <Suspense fallback={null}>
        <FinalCallToActionSection lang={lang} />
      </Suspense>
      <HomeFaq dictionary={dictionary} />
    </main>
  );
}
