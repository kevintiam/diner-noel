// Accusé de réception envoyé après la réservation, dans la même mise en page que la confirmation
// et l'avis de refus : récapitulatif, instructions de virement et lien personnel.
import { getDictionary } from "../../../i18n/get-dictionary.js";
import { translate } from "../../../i18n/translate.js";
import {
  formatEventDate,
  formatEventTime,
  formatEventYear,
  formatMoney,
} from "../../../lib/format.js";
import { buildParticipantEmail, buildPersonalUrl, toEmailLang } from "./email-layout.js";

/** @typedef {import("../../../validation/reservation-decision.schema.js").EventForEmail} EventForEmail */

/**
 * Construit l'accusé depuis les seules valeurs figées de la réservation (AD-6) ;
 * la date et le lieu viennent de l'événement.
 * @param {import("../../../validation/reservation.schema.js").ReservationForReceipt} reservation L'instantané enregistré.
 * @param {EventForEmail} event L'événement.
 * @param {string} siteUrl L'origine vérifiée dans la configuration serveur.
 * @returns {import("../../../validation/email.schema.js").EmailMessage} Versions texte et HTML.
 */
export function buildReservationReceipt(reservation, event, siteUrl) {
  const lang = toEmailLang(reservation.language);
  const dictionary = getDictionary(lang);
  /** @param {string} key @param {Record<string, string | number>} [values] */
  const t = (key, values) => translate(dictionary, key, values);
  const isFree = reservation.amountCents === 0;
  const codeRow = { label: t("emailCommon.codeLabel"), lines: [reservation.code], highlight: true };
  const guestsRow = {
    label: t("receipt.guestsLabel"),
    lines: [
      t("receipt.guests", {
        adults: reservation.seats - reservation.childSeats,
        children: reservation.childSeats,
      }),
    ],
  };
  const eventRows = [
    {
      label: t("confirmation.dateLabel"),
      lines: [
        formatEventDate(event.startsAt, lang),
        t("confirmation.arrival", { time: formatEventTime(event.startsAt, lang) }),
      ],
    },
    { label: t("confirmation.venueLabel"), lines: [event.venueName, event.venueAddress] },
  ];
  // Une inscription gratuite ne parle ni de virement, ni de preuve, ni de remboursement.
  const paymentRows = isFree
    ? []
    : [
        { label: t("receipt.amountLabel"), lines: [formatMoney(reservation.amountCents, lang)] },
        { label: t("receipt.transferLabel"), lines: [reservation.interacEmail] },
        { label: t("receipt.priceLabel"), lines: [formatMoney(reservation.unitPriceCents, lang)] },
      ];
  const paymentSteps = isFree
    ? []
    : [
        t("payment.autoDeposit"),
        t("receipt.transferCode", { code: reservation.code }),
        t("payment.noRefund"),
      ];
  return buildParticipantEmail({
    lang,
    to: reservation.email,
    subject: t(isFree ? "receipt.freeSubject" : "receipt.paidSubject", { code: reservation.code }),
    title: t(isFree ? "receipt.freeTitle" : "receipt.paidTitle"),
    eventYear: formatEventYear(event.startsAt),
    greeting: t("receipt.greeting", { firstName: reservation.firstName }),
    intro: [t(isFree ? "receipt.freeIntro" : "receipt.paidIntro")],
    rows: [codeRow, ...paymentRows, guestsRow, ...eventRows],
    outro: [...paymentSteps, t("receipt.keepLink")],
    link: {
      label: t("receipt.openLink"),
      url: buildPersonalUrl(lang, reservation.token, siteUrl),
    },
  });
}
