import { describe, expect, it } from "vitest";
import { getOtherLanguage, isLocale } from "./locales.js";

describe("isLocale", () => {
  it("reconnaît fr et en seulement", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe("getOtherLanguage", () => {
  it("donne l'anglais pour le français, et le français sinon", () => {
    expect(getOtherLanguage("fr")).toBe("en");
    expect(getOtherLanguage("en")).toBe("fr");
    expect(getOtherLanguage("de")).toBe("fr");
  });
});
