import { describe, expect, it } from "vitest";
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";
import { getDictionary } from "./get-dictionary.js";
import { translate } from "./translate.js";

/**
 * Liste toutes les clés d'un dictionnaire, avec des points (ex. `home.title`).
 * @param {object} dictionary
 * @param {string} [prefix]
 * @returns {string[]}
 */
function listKeys(dictionary, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(dictionary)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object") {
      keys.push(...listKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("dictionnaires", () => {
  it("le français et l'anglais ont exactement les mêmes clés", () => {
    expect(listKeys(en)).toEqual(listKeys(fr));
  });

  it("aucun texte n'est vide", () => {
    for (const dictionary of [fr, en]) {
      for (const key of listKeys(dictionary)) {
        const value = translate(dictionary, key);
        expect(value, key).not.toBe("");
      }
    }
  });
});

describe("getDictionary", () => {
  it("renvoie le dictionnaire de la langue demandée", () => {
    expect(getDictionary("en")).toBe(en);
  });

  it("revient au français pour une langue inconnue", () => {
    expect(getDictionary("de")).toBe(fr);
  });

  it.each(["constructor", "__proto__"])("revient au français pour %s", (lang) => {
    expect(getDictionary(lang)).toBe(fr);
  });
});
