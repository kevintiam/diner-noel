// Entrée dynamique de l'accueil : lit la base à chaque requête pour que les
// places restantes soient toujours à jour (architecture AD-15).
import { connection } from "next/server";
import BookingCallToAction from "@/components/event/BookingCallToAction";
import EventSummary from "@/components/event/EventSummary";
import { getDictionary } from "@/i18n/get-dictionary";
import { describeError, logger } from "@/lib/logger";
import { getEventOverview } from "@/server/services/event.service";

/**
 * Attend une requête avant de lire les informations du dîner dans la base.
 * @param {{ lang: string }} props
 * @returns {Promise<React.ReactElement>} Les informations pratiques à jour et le bouton de réservation.
 * @throws {Error} Si la base est inaccessible ou l'événement absent.
 */
export default async function EventDetails({ lang }) {
  await connection();
  let overview;
  try {
    overview = await getEventOverview(new Date());
  } catch (error) {
    // Journalisé ici avec la route, puis remplacé par une erreur générique (error.jsx).
    logger.error("event_overview_failed", {
      route: `/${lang}`,
      method: "GET",
      ...describeError(error),
    });
    throw new Error("EVENT_OVERVIEW_FAILED");
  }
  const dictionary = getDictionary(lang);
  return (
    <>
      <EventSummary overview={overview} lang={lang} dictionary={dictionary} />
      <BookingCallToAction overview={overview} lang={lang} dictionary={dictionary} />
    </>
  );
}
