// Mise en page commune des courriels au participant (maquette 9) : accusé de réception,
// confirmation et avis de refus. Bandeau vert, récapitulatif, lien éventuel et signature.
// Chaque valeur est échappée ; le texte brut reprend le même contenu.
import { getDictionary } from "../../../i18n/get-dictionary.js";
import { translate } from "../../../i18n/translate.js";

// Couleurs du site (src/app/globals.css), écrites en dur : un courriel n'a pas de feuille de style.
const COLORS = {
  page: "#f4efe6",
  surface: "#ffffff",
  fir: "#1a382b",
  cream: "#fdfbf7",
  gold: "#c29b38",
  goldLight: "#ecdcae",
  burgundy: "#7a1c28",
  ink: "#16231c",
  muted: "#424844",
  border: "#d9d8cd",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

/**
 * Une ligne du récapitulatif ; une valeur peut tenir sur plusieurs lignes (date et heure, lieu et adresse).
 * @typedef {object} SummaryRow
 * @property {string} label
 * @property {string[]} lines
 * @property {boolean} [highlight] Met la valeur en avant, comme le code de réservation.
 */

/**
 * Contenu d'un courriel au participant, déjà traduit.
 * @typedef {object} ParticipantEmailContent
 * @property {"fr" | "en"} lang
 * @property {string} to
 * @property {string} subject
 * @property {string} title
 * @property {string} eventYear Année du dîner, affichée sous le titre.
 * @property {string} greeting
 * @property {string[]} intro
 * @property {SummaryRow[]} rows
 * @property {string[]} outro
 * @property {{ label: string, url: string }} [link]
 * @property {string} [blessing]
 */

/**
 * Remplace les caractères spéciaux du HTML pour qu'une valeur s'affiche telle quelle.
 * @param {string} value Le texte à insérer dans le HTML.
 * @returns {string} Le texte échappé.
 */
export function escapeHtml(value) {
  /** @type {Record<string, string>} */
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

/**
 * Donne la langue d'un courriel à partir de celle enregistrée sur la réservation (AD-3).
 * @param {string} language `FR` ou `EN`.
 * @returns {"fr" | "en"} La langue du dictionnaire.
 */
export function toEmailLang(language) {
  return language === "EN" ? "en" : "fr";
}

/**
 * Reconstruit le lien personnel depuis l'origine configurée, jamais depuis la requête (AD-7).
 * @param {"fr" | "en"} lang La langue de la réservation.
 * @param {string} token Le jeton du lien personnel.
 * @param {string} siteUrl L'origine vérifiée dans la configuration serveur.
 * @returns {string} L'adresse complète de la page de la réservation.
 */
export function buildPersonalUrl(lang, token, siteUrl) {
  return new URL(`/${lang}/r/${encodeURIComponent(token)}`, siteUrl).href;
}

/**
 * @param {SummaryRow} row
 * @param {number} index La première ligne n'a pas de trait au-dessus.
 * @returns {string}
 */
function renderRow(row, index) {
  const border = index === 0 ? "" : `border-top:1px solid ${COLORS.border};`;
  const valueStyle = row.highlight
    ? `color:${COLORS.burgundy};font-weight:700;letter-spacing:0.08em`
    : `color:${COLORS.ink}`;
  const value = row.lines.map(escapeHtml).join("<br>");
  return `<tr><td style="padding:12px 0;${border}color:${COLORS.muted};vertical-align:top">${escapeHtml(row.label)}</td><td style="padding:12px 0 12px 16px;${border}text-align:right;${valueStyle}">${value}</td></tr>`;
}

/** @param {string} text @returns {string} */
function paragraph(text) {
  return `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`;
}

/**
 * @param {ParticipantEmailContent} content
 * @param {string} subtitle
 * @param {string} signature
 * @param {string} footer
 * @returns {string} Le corps HTML complet.
 */
function renderHtml(content, subtitle, signature, footer) {
  const rows = content.rows.map(renderRow).join("");
  const link = content.link
    ? `<p style="margin:24px 0"><a href="${escapeHtml(content.link.url)}" style="display:inline-block;padding:12px 24px;border-radius:6px;background:${COLORS.fir};color:${COLORS.cream};font-weight:700;text-decoration:none">${escapeHtml(content.link.label)}</a></p>`
    : "";
  const blessing = content.blessing
    ? `<p style="margin:24px 0 16px;color:${COLORS.fir};font-family:${SERIF};font-size:20px;font-style:italic">${escapeHtml(content.blessing)}</p>`
    : "";
  return [
    `<!doctype html><html lang="${content.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(content.subject)}</title></head>`,
    `<body style="margin:0;padding:24px 12px;background:${COLORS.page}">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border:1px solid ${COLORS.border};border-radius:8px;border-collapse:separate;background:${COLORS.surface};font-family:${SANS};font-size:16px;line-height:1.6;color:${COLORS.ink}">`,
    `<tr><td style="padding:32px 24px;border-radius:8px 8px 0 0;background:${COLORS.fir};text-align:center">`,
    `<p aria-hidden="true" style="margin:0;color:${COLORS.gold};font-size:28px;line-height:1">&#9734;</p>`,
    `<h1 style="margin:12px 0 0;color:${COLORS.cream};font-family:${SERIF};font-size:30px;font-weight:normal;line-height:1.2">${escapeHtml(content.title)}</h1>`,
    `<p style="margin:8px 0 0;color:${COLORS.goldLight}">${escapeHtml(subtitle)}</p></td></tr>`,
    `<tr><td style="padding:32px 24px">`,
    paragraph(content.greeting),
    content.intro.map(paragraph).join(""),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;padding:4px 16px;border:1px solid ${COLORS.border};border-radius:6px;border-collapse:separate">${rows}</table>`,
    content.outro.map(paragraph).join(""),
    link,
    blessing,
    `<p style="margin:0">${escapeHtml(signature)}</p></td></tr>`,
    `<tr><td style="padding:16px 24px;border-top:1px solid ${COLORS.border};color:${COLORS.muted};font-size:13px">${escapeHtml(footer)}</td></tr>`,
    `</table></body></html>`,
  ].join("");
}

/**
 * Assemble un courriel au participant : objet, texte brut et HTML dans sa langue.
 * @param {ParticipantEmailContent} content Le contenu traduit.
 * @returns {import("../../../validation/email.schema.js").EmailMessage} Le message prêt à envoyer.
 */
export function buildParticipantEmail(content) {
  const dictionary = getDictionary(content.lang);
  const subtitle = translate(dictionary, "emailCommon.eventName", { year: content.eventYear });
  const signature = translate(dictionary, "emailCommon.signature");
  const footer = translate(dictionary, "emailCommon.footer");
  /** @param {string} label @param {string} value */
  const textRow = (label, value) => translate(dictionary, "emailCommon.row", { label, value });
  const textBlocks = [
    `${content.title} — ${subtitle}`,
    content.greeting,
    ...content.intro,
    content.rows.map((row) => textRow(row.label, row.lines.join(", "))).join("\n"),
    ...content.outro,
    ...(content.link ? [textRow(content.link.label, content.link.url)] : []),
    ...(content.blessing ? [content.blessing] : []),
    signature,
    `--\n${footer}`,
  ];
  return {
    to: content.to,
    subject: content.subject,
    text: textBlocks.join("\n\n"),
    html: renderHtml(content, subtitle, signature, footer),
  };
}
