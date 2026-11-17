"use client";

// L'instant initial vient du serveur pour garder le premier rendu identique à l'hydratation.
import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { translate } from "@/i18n/translate";
import { getCountdownParts } from "@/lib/countdown";
import styles from "./EventCountdown.module.css";

const UPDATE_INTERVAL_MS = 1000;
/** @type {Array<"days" | "hours" | "minutes" | "seconds">} */
const TIME_UNITS = ["days", "hours", "minutes", "seconds"];

/**
 * Affiche puis actualise le temps restant, sans influencer l'ouverture des réservations.
 * @param {{ startsAt: string, initialNow: number, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} Le compte à rebours ou son état terminé.
 */
export default function EventCountdown({ startsAt, initialNow, dictionary }) {
  const [now, setNow] = useState(initialNow);
  const targetTime = Date.parse(startsAt);
  const remaining = getCountdownParts(targetTime, now);

  useEffect(() => {
    if (initialNow >= targetTime) return undefined;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= targetTime) clearInterval(timer);
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [initialNow, targetTime]);

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>
        <Hourglass aria-hidden="true" />
        {translate(dictionary, "countdown.title")}
      </h2>
      {remaining.isFinished ? (
        <p role="status" className={styles.finished}>
          {translate(dictionary, "countdown.started")}
        </p>
      ) : (
        <dl className={styles.units} aria-label={translate(dictionary, "countdown.title")}>
          {TIME_UNITS.map((unit) => (
            <div key={unit} className={styles.unit}>
              <dt>{translate(dictionary, `countdown.${unit}`)}</dt>
              <dd>{String(remaining[unit]).padStart(2, "0")}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
