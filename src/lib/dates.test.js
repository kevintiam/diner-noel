import { describe, expect, it } from "vitest";
import { addDaysToLocalDate, localDateTimeToUtc, utcToLocalDateTime } from "./dates.js";

describe("localDateTimeToUtc", () => {
  it("convertit 18 h à Ottawa en hiver (UTC−5)", () => {
    const instant = localDateTimeToUtc("2026-12-19", "18:00");

    expect(instant.toISOString()).toBe("2026-12-19T23:00:00.000Z");
  });

  it("passe au jour suivant en UTC pour 23 h 59 à Ottawa", () => {
    const instant = localDateTimeToUtc("2026-12-12", "23:59");

    expect(instant.toISOString()).toBe("2026-12-13T04:59:00.000Z");
  });

  it("tient compte de l'heure d'été (UTC−4)", () => {
    const instant = localDateTimeToUtc("2026-07-01", "12:00");

    expect(instant.toISOString()).toBe("2026-07-01T16:00:00.000Z");
  });

  it("refuse une date mal formée", () => {
    expect(() => localDateTimeToUtc("19/12/2026", "18:00")).toThrow(/invalide/);
  });

  it("refuse une heure mal formée", () => {
    expect(() => localDateTimeToUtc("2026-12-19", "6pm")).toThrow(/invalide/);
  });
});

describe("utcToLocalDateTime", () => {
  it("redonne la date et l'heure d'Ottawa, même quand le jour UTC a changé", () => {
    expect(utcToLocalDateTime(new Date("2026-12-13T04:59:00.000Z"))).toEqual({
      date: "2026-12-12",
      time: "23:59",
    });
  });

  it("tient compte de l'heure d'été et fait l'aller-retour avec localDateTimeToUtc", () => {
    const instant = localDateTimeToUtc("2026-07-01", "09:05");

    expect(utcToLocalDateTime(instant)).toEqual({ date: "2026-07-01", time: "09:05" });
  });
});

describe("addDaysToLocalDate", () => {
  it("passe au jour suivant, y compris d'un mois et d'une année à l'autre", () => {
    expect(addDaysToLocalDate("2026-12-03", 1)).toBe("2026-12-04");
    expect(addDaysToLocalDate("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysToLocalDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("recule d'un jour et ignore le changement d'heure de novembre", () => {
    expect(addDaysToLocalDate("2026-11-02", -1)).toBe("2026-11-01");
    expect(addDaysToLocalDate("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("refuse une date mal formée", () => {
    expect(() => addDaysToLocalDate("03/12/2026", 1)).toThrow(/invalide/);
  });
});
