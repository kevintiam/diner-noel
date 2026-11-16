// Lecture d'un texte dans un dictionnaire par sa clé (ex. `errors.internal`),
// avec remplacement des valeurs entre accolades (ex. `{count}`).

/**
 * @typedef {{ [key: string]: string | Dictionary }} Dictionary
 */

/**
 * Renvoie le texte d'une clé, ou la clé elle-même si elle n'existe pas.
 * Un test vérifie que les deux dictionnaires ont les mêmes clés : une clé
 * absente est donc une erreur de développement, visible à l'écran.
 * @param {Dictionary} dictionary Le dictionnaire de la langue.
 * @param {string} key La clé, avec des points (ex. `home.soldOut`).
 * @param {Record<string, string | number>} [values] Les valeurs à insérer.
 * @returns {string} Le texte traduit.
 */
export function translate(dictionary, key, values = {}) {
  /** @type {string | Dictionary | undefined} */
  let node = dictionary;
  for (const part of key.split(".")) {
    node = typeof node === "object" ? node[part] : undefined;
  }
  if (typeof node !== "string") {
    return key;
  }
  return node.replace(/\{(\w+)\}/g, (placeholder, name) =>
    name in values ? String(values[name]) : placeholder,
  );
}
