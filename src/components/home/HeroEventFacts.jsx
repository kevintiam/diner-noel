// Les informations dynamiques occupent les zones de la grille du bandeau.
import { CalendarDays, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import BookingCallToAction from "@/components/event/BookingCallToAction";
import { translate } from "@/i18n/translate";
import {
  formatEventDate,
  formatEventDateTime,
  formatEventTime,
  getAddressCity,
} from "@/lib/format";
import EventCountdown from "./EventCountdown";
import EventPricingDetails from "@/components/event/EventPricingDetails";
import styles from "./HeroEventFacts.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */
/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */

/**
 * Affiche les informations clés du bandeau et le bouton de réservation.
 * @param {{ overview: EventOverview, lang: string, dictionary: Dictionary, initialNow: number }} props
 * @returns {React.ReactElement} Les informations clés.
 */
export default function HeroEventFacts({ overview, lang, dictionary, initialNow }) {
  const time = formatEventTime(overview.startsAt, lang);
  return (
    <>
      <ul className={styles.facts} aria-label={translate(dictionary, "hero.factsLabel")}>
        <li>
          <CalendarDays aria-hidden="true" className={styles.icon} />
          {formatEventDate(overview.startsAt, lang)}
        </li>
        <li>
          <Clock aria-hidden="true" className={styles.icon} />
          {translate(dictionary, "hero.doorsOpen", { time })}
        </li>
        <li>
          <MapPin aria-hidden="true" className={styles.icon} />
          {`${overview.venueName}, ${getAddressCity(overview.venueAddress)}`}
        </li>
      </ul>
      <section className={styles.bookingPanel} aria-labelledby="availability-title">
        <h2 id="availability-title" className={styles.availabilityTitle}>
          {translate(dictionary, "hero.availabilityTitle")}
        </h2>
        <div className={styles.pricing}>
          <EventPricingDetails overview={overview} lang={lang} dictionary={dictionary} isCompact />
        </div>
        <BookingCallToAction overview={overview} lang={lang} dictionary={dictionary} />
      </section>
      <div className={styles.photo}>
        <Image
          src="/images/christmas-table.webp"
          alt={translate(dictionary, "hero.photoAlt")}
          fill
          preload
          sizes="(max-width: 1023px) 100vw, 560px"
          className={styles.image}
        />
      </div>
      <div className={styles.countdown}>
        <EventCountdown
          startsAt={overview.startsAt.toISOString()}
          initialNow={initialNow}
          dictionary={dictionary}
        />
        <p className={styles.deadline}>
          {translate(dictionary, "countdown.deadline", {
            date: formatEventDateTime(overview.bookingDeadline, lang),
          })}
        </p>
      </div>
    </>
  );
}
