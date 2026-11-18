// Courriel de confirmation envoyé quand un organisateur valide le paiement (maquette 9, brief §6).
import { getDictionary } from "../../../i18n/get-dictionary.js";
import { translate } from "../../../i18n/translate.js";
import {
  formatEventDate,
  formatEventTime,
  formatEventYear,
  formatMoney,
} from "../../../lib/format.js";
import { buildParticipantEmail, toEmailLang } from "./email-layout.js";

/** @typedef {import("../../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} ReservationForDecisionEmail */
/** @typedef {import("../../../validation/reservation-decision.schema.js").EventForEmail} EventForEmail */

/**
 * Construit la confirmation dans la langue de la réservation, avec son récapitulatif.
 * Le montant vient de la réservation, figé à sa création (AD-6) ; date et lieu viennent de l'événement.
 * @param {ReservationForDecisionEmail} reservation La réservation confirmée.
 * @param {EventForEmail} event L'événement.
 * @returns {import("../../../validation/email.schema.js").EmailMessage} Versions texte et HTML.
 */
export function buildReservationConfirmation(reservation, event) {
  const lang = toEmailLang(reservation.language);
  const dictionary = getDictionary(lang);
  /** @param {string} key @param {Record<string, string | number>} [values] */
  const t = (key, values) => translate(dictionary, key, values);
  const seats =
    reservation.childSeats > 0
      ? t("confirmation.seatsWithChildren", {
          seats: reservation.seats,
          children: reservation.childSeats,
        })
      : String(reservation.seats);
  return buildParticipantEmail({
    lang,
    to: reservation.email,
    subject: t("confirmation.subject"),
    title: t("confirmation.title"),
    eventYear: formatEventYear(event.startsAt),
    greeting: t("receipt.greeting", { firstName: reservation.firstName }),
    intro: [t("confirmation.intro")],
    rows: [
      { label: t("emailCommon.codeLabel"), lines: [reservation.code], highlight: true },
      { label: t("confirmation.seatsLabel"), lines: [seats] },
      { label: t("confirmation.amountLabel"), lines: [formatMoney(reservation.amountCents, lang)] },
      {
        label: t("confirmation.dateLabel"),
        lines: [
          formatEventDate(event.startsAt, lang),
          t("confirmation.arrival", { time: formatEventTime(event.startsAt, lang) }),
        ],
      },
      { label: t("confirmation.venueLabel"), lines: [event.venueName, event.venueAddress] },
    ],
    outro: [t("confirmation.showCode", { code: reservation.code })],
    blessing: t("confirmation.blessing"),
  });
}
