import { describe, expect, it } from "vitest";
import { formatEventDateTime, formatMoney } from "./format.js";

// Intl utilise des espaces insécables : on les remplace pour comparer.
/** @param {string} text */
const normalizeSpaces = (text) => text.replace(/[  ]/g, " ");
const DINNER_START = new Date("2026-12-19T23:00:00.000Z");

describe("formatMoney", () => {
  it("formate un montant à la française", () => {
    expect(normalizeSpaces(formatMoney(2500, "fr"))).toBe("25,00 $");
  });

  it("formate un montant à l'anglaise", () => {
    expect(formatMoney(2500, "en")).toBe("$25.00");
  });

  it("formate zéro", () => {
    expect(normalizeSpaces(formatMoney(0, "fr"))).toBe("0,00 $");
  });

  it("revient au français pour une langue inconnue", () => {
    expect(normalizeSpaces(formatMoney(2500, "de"))).toBe("25,00 $");
  });
});

describe("formatEventDateTime", () => {
  it("affiche la date et l'heure d'Ottawa en français", () => {
    expect(normalizeSpaces(formatEventDateTime(DINNER_START, "fr"))).toBe(
      "samedi 19 décembre 2026 à 18 h 00",
    );
  });

  it("affiche la date et l'heure d'Ottawa en anglais", () => {
    expect(normalizeSpaces(formatEventDateTime(DINNER_START, "en"))).toBe(
      "Saturday, December 19, 2026 at 6:00 p.m.",
    );
  });

  it("refuse une date invalide", () => {
    expect(() => formatEventDateTime(new Date("pas une date"), "fr")).toThrow(RangeError);
  });
});
