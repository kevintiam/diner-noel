// Entrées dynamiques de l'accueil : chacune attend une requête, puis lit l'aperçu
// partagé de l'événement (architecture AD-15) et le passe à un composant d'affichage.
import { connection } from "next/server";
import FinalCallToAction from "@/components/home/FinalCallToAction";
import HeroEventFacts from "@/components/home/HeroEventFacts";
import PracticalInfoCards from "@/components/home/PracticalInfoCards";
import { getDictionary } from "@/i18n/get-dictionary";
import { loadEventOverview } from "./load-event-overview";

/**
 * Lit l'aperçu de l'événement pour la langue de la page.
 * @param {string} lang
 */
async function readOverview(lang) {
  await connection();
  return loadEventOverview(`/${lang}`);
}

/**
 * Affiche les informations clés du bandeau et le bouton de réservation, à jour.
 * @param {{ lang: string }} props
 * @returns {Promise<React.ReactElement>}
 */
export async function HeroEventDetails({ lang }) {
  const overview = await readOverview(lang);
  return (
    <HeroEventFacts
      overview={overview}
      lang={lang}
      dictionary={getDictionary(lang)}
      initialNow={overview.observedAt}
    />
  );
}

/**
 * Affiche les 4 cartes d'informations pratiques, à jour.
 * @param {{ lang: string }} props
 * @returns {Promise<React.ReactElement>}
 */
export async function PracticalInfoSection({ lang }) {
  const overview = await readOverview(lang);
  return <PracticalInfoCards overview={overview} lang={lang} dictionary={getDictionary(lang)} />;
}

/**
 * Affiche le rappel final avec les places restantes, à jour.
 * @param {{ lang: string }} props
 * @returns {Promise<React.ReactElement>}
 */
export async function FinalCallToActionSection({ lang }) {
  const overview = await readOverview(lang);
  return <FinalCallToAction overview={overview} lang={lang} dictionary={getDictionary(lang)} />;
}
