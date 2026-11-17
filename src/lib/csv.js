// Écriture d'un fichier CSV lisible par les tableurs (architecture AD-2 : seule exception à l'enveloppe JSON).

// La marque d'ordre des octets fait reconnaître l'UTF-8, donc les accents, par Excel.
const UTF8_BOM = "﻿";
// Retour à la ligne de la norme CSV (RFC 4180).
const LINE_BREAK = "\r\n";
// Une cellule qui commence par l'un de ces caractères serait lue comme une formule par le tableur.
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Prépare une cellule : neutralise une formule, puis l'entoure de guillemets en doublant les siens.
 * @param {string | number} value La valeur de la cellule.
 * @returns {string} La cellule prête à écrire.
 */
export function escapeCsvCell(value) {
  const text = String(value);
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/**
 * Assemble les lignes d'un fichier CSV, en-tête compris.
 * @param {Array<Array<string | number>>} rows Les lignes, la première étant l'en-tête.
 * @param {{ separator: string }} options Le séparateur des colonnes.
 * @returns {string} Le contenu du fichier, avec la marque UTF-8 au début.
 */
export function toCsv(rows, { separator }) {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(separator));
  return `${UTF8_BOM}${lines.join(LINE_BREAK)}${LINE_BREAK}`;
}
