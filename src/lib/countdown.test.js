import { describe, expect, it } from "vitest";
import { getCountdownParts } from "./countdown.js";

const DINNER_TIME = Date.parse("2026-12-19T23:00:00Z");

describe("getCountdownParts", () => {
  it("sépare les jours, heures, minutes et secondes jusqu'au dîner", () => {
    const now = Date.parse("2026-12-17T19:55:55Z");

    expect(getCountdownParts(DINNER_TIME, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      isFinished: false,
    });
  });

  it("garde la dernière seconde avant l'instant exact", () => {
    expect(getCountdownParts(DINNER_TIME, DINNER_TIME - 1)).toMatchObject({
      seconds: 1,
      isFinished: false,
    });
  });

  it.each([0, 1000, 86_400_000])("reste à zéro à partir du début du dîner (%s ms)", (elapsed) => {
    expect(getCountdownParts(DINNER_TIME, DINNER_TIME + elapsed)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isFinished: true,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, null, "date"])(
    "refuse un instant invalide : %s",
    (now) => {
      expect(() => getCountdownParts(DINNER_TIME, /** @type {any} */ (now))).toThrow(RangeError);
    },
  );
});
