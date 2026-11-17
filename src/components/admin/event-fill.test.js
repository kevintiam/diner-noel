import { describe, expect, it } from "vitest";
import { describeDinnerCountdown, getFillPercent } from "./event-fill.js";

// Dîner fictif : samedi 19 décembre 2026 à 18 h, heure d'Ottawa (23 h UTC).
const DINNER = new Date("2026-12-19T23:00:00Z");

describe("getFillPercent", () => {
  it("arrondit la part des places prises", () => {
    expect(getFillPercent(86, 120)).toBe(72);
  });

  it("reste entre 0 et 100 même si les nombres débordent", () => {
    expect(getFillPercent(130, 120)).toBe(100);
    expect(getFillPercent(-4, 120)).toBe(0);
  });

  it("renvoie 0 pour une capacité nulle au lieu de diviser par zéro", () => {
    expect(getFillPercent(10, 0)).toBe(0);
  });
});

describe("describeDinnerCountdown", () => {
  it("compte les jours restants", () => {
    expect(describeDinnerCountdown(DINNER, new Date("2026-11-16T15:00:00Z"))).toBe("Dans 33 jours");
  });

  it("compte en jours du calendrier d'Ottawa, pas en tranches de 24 heures", () => {
    // Le 18 à 23 h 30 à Ottawa (le 19 en UTC) : le dîner est bien « demain ».
    expect(describeDinnerCountdown(DINNER, new Date("2026-12-19T04:30:00Z"))).toBe("Demain");
    // Le 19 à 9 h à Ottawa : moins de 24 heures, et c'est aujourd'hui.
    expect(describeDinnerCountdown(DINNER, new Date("2026-12-19T14:00:00Z"))).toBe("Aujourd’hui");
  });

  it("signale un dîner déjà commencé", () => {
    expect(describeDinnerCountdown(DINNER, new Date("2026-12-20T01:00:00Z"))).toBe("Dîner passé");
  });
});
