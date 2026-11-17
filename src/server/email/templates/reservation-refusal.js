// Avis de refus envoyé quand un organisateur refuse une preuve de paiement (brief §4.11 et §6) :
// le motif, les places gardées et le même lien personnel pour envoyer une nouvelle preuve.
import { getDictionary } from "../../../i18n/get-dictionary.js";
import { translate } from "../../../i18n/translate.js";
import { formatEventYear, formatMoney } from "../../../lib/format.js";
import { buildDecisionEmail, buildPersonalUrl, toEmailLang } from "./email-layout.js";

/** @typedef {import("../../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} ReservationForDecisionEmail */
/** @typedef {import("../../../validation/reservation-decision.schema.js").EventForEmail} EventForEmail */

/**
 * Construit l'avis de refus dans la langue de la réservation.
 * @param {ReservationForDecisionEmail} reservation La réservation revenue en attente de paiement.
 * @param {"NO_TRANSFER" | "INCOMPLETE_AMOUNT" | "UNREADABLE_PROOF"} reasonCode Le motif choisi par l'organisateur.
 * @param {EventForEmail} event L'événement, pour l'année affichée.
 * @param {string} siteUrl L'origine vérifiée dans la configuration serveur.
 * @returns {import("../../../validation/email.schema.js").EmailMessage} Versions texte et HTML.
 */
export function buildReservationRefusal(reservation, reasonCode, event, siteUrl) {
  const lang = toEmailLang(reservation.language);
  const dictionary = getDictionary(lang);
  /** @param {string} key @param {Record<string, string | number>} [values] */
  const t = (key, values) => translate(dictionary, key, values);
  return buildDecisionEmail({
    lang,
    to: reservation.email,
    subject: t("refusal.subject", { code: reservation.code }),
    title: t("refusal.title"),
    eventYear: formatEventYear(event.startsAt),
    greeting: t("receipt.greeting", { firstName: reservation.firstName }),
    intro: [t("refusal.intro")],
    rows: [
      { label: t("emailCommon.codeLabel"), lines: [reservation.code], highlight: true },
      { label: t("refusal.reasonLabel"), lines: [t(`refusal.reasons.${reasonCode}`)] },
      { label: t("refusal.amountLabel"), lines: [formatMoney(reservation.amountCents, lang)] },
      { label: t("refusal.transferLabel"), lines: [reservation.interacEmail] },
    ],
    outro: [
      t("refusal.seatsKept"),
      t("refusal.nextStep"),
      t("receipt.transferCode", { code: reservation.code }),
    ],
    link: {
      label: t("refusal.openLink"),
      url: buildPersonalUrl(lang, reservation.token, siteUrl),
    },
  });
}
