import { describe, expect, it } from "vitest";
import {
  formatEventDate,
  formatEventDateTime,
  formatEventYear,
  formatEventTime,
  formatMoney,
  formatShortDateTime,
  getAddressCity,
} from "./format.js";

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

describe("formatShortDateTime", () => {
  it("abrège la date et l'heure d'Ottawa en français et en anglais", () => {
    const receivedAt = new Date("2026-11-15T20:02:00.000Z");

    expect(normalizeSpaces(formatShortDateTime(receivedAt, "fr"))).toBe("15 nov. 2026, 15 h 02");
    expect(normalizeSpaces(formatShortDateTime(receivedAt, "en"))).toBe("Nov 15, 2026, 3:02 p.m.");
  });

  it("garde le jour d'Ottawa juste avant minuit UTC", () => {
    // 4 h 59 UTC le 16 = 23 h 59 le 15 à Ottawa.
    const lateEvening = new Date("2026-11-16T04:59:00.000Z");

    expect(normalizeSpaces(formatShortDateTime(lateEvening, "fr"))).toBe("15 nov. 2026, 23 h 59");
  });

  it("refuse une date invalide", () => {
    expect(() => formatShortDateTime(new Date("pas une date"), "fr")).toThrow(RangeError);
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

describe("formatMoney sans cents nuls", () => {
  it("écrit un montant rond sans cents", () => {
    expect(normalizeSpaces(formatMoney(2500, "fr", { omitZeroCents: true }))).toBe("25 $");
    expect(formatMoney(2500, "en", { omitZeroCents: true })).toBe("$25");
  });

  it("garde les cents quand le montant n'est pas rond", () => {
    expect(normalizeSpaces(formatMoney(2550, "fr", { omitZeroCents: true }))).toBe("25,50 $");
  });
});

describe("formatEventDate", () => {
  it("écrit la date seule avec une majuscule, à l'heure d'Ottawa", () => {
    expect(formatEventDate(DINNER_START, "fr")).toBe("Samedi 19 décembre 2026");
    expect(formatEventDate(DINNER_START, "en")).toBe("Saturday, December 19, 2026");
  });

  it("garde le jour d'Ottawa même quand il est déjà le lendemain en UTC", () => {
    expect(formatEventDate(new Date("2026-12-20T04:30:00.000Z"), "fr")).toBe(
      "Samedi 19 décembre 2026",
    );
  });
});

describe("formatEventTime", () => {
  it("écrit une heure pile sans minutes", () => {
    expect(normalizeSpaces(formatEventTime(DINNER_START, "fr"))).toBe("18 h");
    expect(normalizeSpaces(formatEventTime(DINNER_START, "en"))).toBe("6 p.m.");
  });

  it("écrit les minutes quand il y en a", () => {
    const halfPast = new Date("2026-12-19T23:30:00.000Z");

    expect(normalizeSpaces(formatEventTime(halfPast, "fr"))).toBe("18 h 30");
    expect(normalizeSpaces(formatEventTime(halfPast, "en"))).toBe("6:30 p.m.");
  });

  it("refuse une date invalide", () => {
    expect(() => formatEventTime(new Date("pas une date"), "fr")).toThrow(RangeError);
  });
});

describe("formatEventYear", () => {
  it("donne l'année à Ottawa, même quand l'année UTC a déjà changé", () => {
    expect(formatEventYear(DINNER_START)).toBe("2026");
    expect(formatEventYear(new Date("2027-01-01T03:00:00.000Z"))).toBe("2026");
  });
});

describe("getAddressCity", () => {
  it("prend la dernière partie de l'adresse", () => {
    expect(getAddressCity("75 Auriga Drive, Nepean")).toBe("Nepean");
  });

  it("renvoie l'adresse entière sans virgule", () => {
    expect(getAddressCity("Nepean")).toBe("Nepean");
  });
});
