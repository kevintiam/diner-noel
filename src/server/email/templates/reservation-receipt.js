import { getDictionary } from "../../../i18n/get-dictionary.js";
import { translate } from "../../../i18n/translate.js";
import { formatMoney } from "../../../lib/format.js";
import { buildPersonalUrl, escapeHtml, toEmailLang } from "./email-layout.js";

/**
 * Construit l'accusé depuis les seules valeurs figées de la réservation.
 * @param {import("../../../validation/reservation.schema.js").ReservationForReceipt} reservation L'instantané enregistré.
 * @param {string} siteUrl L'origine vérifiée dans la configuration serveur.
 * @returns {import("../../../validation/email.schema.js").EmailMessage} Versions texte et HTML.
 */
export function buildReservationReceipt(reservation, siteUrl) {
  const lang = toEmailLang(reservation.language);
  const dictionary = getDictionary(lang);
  const isFree = reservation.amountCents === 0;
  const personalUrl = buildPersonalUrl(lang, reservation.token, siteUrl);
  const values = {
    firstName: reservation.firstName,
    code: reservation.code,
    adults: reservation.seats - reservation.childSeats,
    children: reservation.childSeats,
    price: formatMoney(reservation.unitPriceCents, lang),
    amount: formatMoney(reservation.amountCents, lang),
    email: reservation.interacEmail,
  };
  const subjectKey = isFree ? "receipt.freeSubject" : "receipt.paidSubject";
  const lines = [
    translate(dictionary, "receipt.greeting", values),
    translate(dictionary, isFree ? "receipt.freeIntro" : "receipt.paidIntro"),
    translate(dictionary, "receipt.code", values),
    translate(dictionary, "receipt.guests", values),
  ];
  if (!isFree) {
    lines.push(
      translate(dictionary, "receipt.price", values),
      translate(dictionary, "receipt.amount", values),
      translate(dictionary, "receipt.transfer", values),
      translate(dictionary, "payment.autoDeposit"),
      translate(dictionary, "receipt.transferCode", values),
      translate(dictionary, "payment.noRefund"),
    );
  }
  lines.push(translate(dictionary, "receipt.keepLink"));
  const paragraphs = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  return {
    to: reservation.email,
    subject: translate(dictionary, subjectKey, values),
    text: `${lines.join("\n\n")}\n\n${personalUrl}`,
    html: `<!doctype html><html lang="${lang}"><body>${paragraphs}<p><a href="${escapeHtml(personalUrl)}">${escapeHtml(translate(dictionary, "receipt.openLink"))}</a></p></body></html>`,
  };
}
