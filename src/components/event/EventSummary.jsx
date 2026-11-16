// Informations pratiques du dîner sur l'accueil. Composant d'affichage pur :
// il reçoit les données déjà lues, ce qui le rend facile à tester.
import { formatEventDateTime, formatMoney } from "@/lib/format";
import { translate } from "@/i18n/translate";
import styles from "./EventSummary.module.css";

/** @typedef {import("@/validation/event.schema").EventOverview} EventOverview */
/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */

/**
 * Texte des places restantes : « Complet », « 1 place restante » ou « N places restantes ».
 * @param {number} seatsLeft Les places libres.
 * @param {Dictionary} dictionary Le dictionnaire de la langue.
 * @returns {string} Le texte à afficher.
 */
function describeSeatsLeft(seatsLeft, dictionary) {
  if (seatsLeft <= 0) {
    return translate(dictionary, "home.soldOut");
  }
  if (seatsLeft === 1) {
    return translate(dictionary, "home.seatsLeftOne");
  }
  return translate(dictionary, "home.seatsLeft", { count: seatsLeft });
}

/**
 * Affiche les informations pratiques et les places libres dans la langue choisie.
 * @param {{ overview: EventOverview, lang: string, dictionary: Dictionary }} props
 * @returns {React.ReactElement} Le récapitulatif du dîner.
 */
export default function EventSummary({ overview, lang, dictionary }) {
  return (
    <dl className={styles.summary}>
      <div className={styles.row}>
        <dt>{translate(dictionary, "home.dateLabel")}</dt>
        <dd>{formatEventDateTime(overview.startsAt, lang)}</dd>
      </div>
      <div className={styles.row}>
        <dt>{translate(dictionary, "home.venueLabel")}</dt>
        <dd>
          {overview.venueName}
          <br />
          {overview.venueAddress}
        </dd>
      </div>
      <div className={styles.row}>
        <dt>{translate(dictionary, "home.priceLabel")}</dt>
        <dd>{formatMoney(overview.unitPriceCents, lang)}</dd>
      </div>
      <div className={styles.row}>
        <dt>{translate(dictionary, "home.seatsLabel")}</dt>
        <dd className={styles.seats}>{describeSeatsLeft(overview.seatsLeft, dictionary)}</dd>
      </div>
    </dl>
  );
}
