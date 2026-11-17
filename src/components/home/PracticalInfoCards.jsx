// Les tarifs sont présentés près du bouton de réservation dans le bandeau.
import { CalendarDays, Clock, MapPin, Shirt } from "lucide-react";
import { translate } from "@/i18n/translate";
import { formatEventDate, formatEventTime } from "@/lib/format";
import styles from "./PracticalInfoCards.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */

/**
 * Affiche les informations pratiques du dîner.
 * @param {{ overview: EventOverview, lang: string, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} La section des informations pratiques.
 */
export default function PracticalInfoCards({ overview, lang, dictionary }) {
  const time = formatEventTime(overview.startsAt, lang);
  const cards = [
    {
      key: "date",
      Icon: CalendarDays,
      label: translate(dictionary, "practical.dateLabel"),
      lines: [formatEventDate(overview.startsAt, lang)],
    },
    {
      key: "time",
      Icon: Clock,
      label: translate(dictionary, "practical.timeLabel"),
      lines: [translate(dictionary, "practical.timeValue", { time })],
    },
    {
      key: "venue",
      Icon: MapPin,
      label: translate(dictionary, "practical.venueLabel"),
      lines: [overview.venueName, overview.venueAddress],
    },
    {
      key: "dress",
      Icon: Shirt,
      label: translate(dictionary, "practical.dressLabel"),
      lines: [translate(dictionary, "practical.dressValue")],
    },
  ];
  return (
    <section className={styles.section} id="informations" aria-labelledby="practical-title">
      <h2 id="practical-title" className={styles.title}>
        {translate(dictionary, "practical.title")}
      </h2>
      <ul className={styles.cards}>
        {cards.map(({ key, Icon, label, lines }) => (
          <li key={key} className={styles.card}>
            <Icon aria-hidden="true" className={styles.icon} />
            <p className={styles.label}>{label}</p>
            {lines.map((line) => (
              <p key={line} className={styles.value}>
                {line}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
