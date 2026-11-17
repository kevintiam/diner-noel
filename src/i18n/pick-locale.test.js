import { describe, expect, it } from "vitest";
import { pickLocale } from "./pick-locale.js";

describe("pickLocale", () => {
  it("choisit l'anglais pour un navigateur canadien anglais", () => {
    expect(pickLocale("en-CA,en;q=0.9")).toBe("en");
  });

  it("choisit le français pour un navigateur français", () => {
    expect(pickLocale("fr-CA,fr;q=0.9,en;q=0.8")).toBe("fr");
  });

  it("suit la qualité plutôt que l'ordre", () => {
    expect(pickLocale("fr;q=0.5,en;q=0.9")).toBe("en");
  });

  it("ignore une langue non prise en charge et garde la suivante", () => {
    expect(pickLocale("de-DE,en;q=0.7")).toBe("en");
  });

  it("revient au français pour une langue non prise en charge", () => {
    expect(pickLocale("de-DE,de;q=0.9")).toBe("fr");
  });

  it("revient au français sans en-tête", () => {
    expect(pickLocale(null)).toBe("fr");
    expect(pickLocale("")).toBe("fr");
  });

  it("ignore une langue refusée (q=0) ou une qualité illisible", () => {
    expect(pickLocale("en;q=0,fr;q=0.4")).toBe("fr");
    expect(pickLocale("en;q=abc")).toBe("fr");
  });
});
