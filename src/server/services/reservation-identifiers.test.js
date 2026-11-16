import { describe, expect, it } from "vitest";
import { generatePersonalToken, generateReservationCode } from "./reservation-identifiers.js";

const SAMPLE_SIZE = 200;

describe("generateReservationCode", () => {
  it("produit NOEL- suivi de 4 chiffres", () => {
    for (let i = 0; i < SAMPLE_SIZE; i += 1) {
      expect(generateReservationCode()).toMatch(/^NOEL-[1-9]\d{3}$/);
    }
  });
});

describe("generatePersonalToken", () => {
  it("produit 43 caractères utilisables dans une adresse", () => {
    expect(generatePersonalToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("ne produit jamais deux fois le même jeton", () => {
    const tokens = new Set();
    for (let i = 0; i < SAMPLE_SIZE; i += 1) {
      tokens.add(generatePersonalToken());
    }

    expect(tokens.size).toBe(SAMPLE_SIZE);
  });
});
