import { describe, expect, it } from "vitest";
import { localDateTimeToUtc } from "./dates.js";

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
