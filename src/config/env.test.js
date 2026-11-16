import { describe, expect, it } from "vitest";
import { getMigrationDatabaseUrl, parseEnv } from "./env.js";

const VALID_DATABASE_URL = "postgresql://user:password@db.example.test:5432/app";

describe("parseEnv", () => {
  it("accepte une adresse PostgreSQL valide", () => {
    // Préparer
    const source = { DATABASE_URL: VALID_DATABASE_URL };

    // Agir
    const env = parseEnv(source);

    // Vérifier
    expect(env.DATABASE_URL).toBe(VALID_DATABASE_URL);
  });

  it("accepte DATABASE_IS_TEST à true pour la base de test", () => {
    const env = parseEnv({ DATABASE_URL: VALID_DATABASE_URL, DATABASE_IS_TEST: "true" });

    expect(env.DATABASE_IS_TEST).toBe("true");
  });

  it("refuse une variable manquante en la nommant", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("refuse une adresse qui n'est pas PostgreSQL", () => {
    expect(() => parseEnv({ DATABASE_URL: "https://example.test" })).toThrow(/DATABASE_URL/);
  });

  it("refuse une valeur qui n'est pas du texte", () => {
    expect(() => parseEnv({ DATABASE_URL: /** @type {any} */ (42) })).toThrow(/DATABASE_URL/);
  });

  it("refuse une valeur inattendue pour DATABASE_IS_TEST", () => {
    expect(() => parseEnv({ DATABASE_URL: VALID_DATABASE_URL, DATABASE_IS_TEST: "oui" })).toThrow(
      /DATABASE_IS_TEST/,
    );
  });
});

describe("getMigrationDatabaseUrl", () => {
  it("accepte DATABASE_URL_UNPOOLED", () => {
    expect(getMigrationDatabaseUrl({ DATABASE_URL_UNPOOLED: VALID_DATABASE_URL })).toBe(
      VALID_DATABASE_URL,
    );
  });

  it("accepte DIRECT_URL pour un environnement existant", () => {
    expect(getMigrationDatabaseUrl({ DIRECT_URL: VALID_DATABASE_URL })).toBe(VALID_DATABASE_URL);
  });

  it("préfère DATABASE_URL_UNPOOLED si les deux noms sont fournis", () => {
    const otherUrl = "postgresql://user:password@other.example.test/app";

    expect(
      getMigrationDatabaseUrl({ DATABASE_URL_UNPOOLED: VALID_DATABASE_URL, DIRECT_URL: otherUrl }),
    ).toBe(VALID_DATABASE_URL);
  });

  it("permet de générer le client sans variable de connexion", () => {
    expect(getMigrationDatabaseUrl({})).toBeUndefined();
  });

  it("refuse une connexion invalide sans exposer la valeur", () => {
    expect(() => getMigrationDatabaseUrl({ DIRECT_URL: "secret-invalide" })).toThrow(
      "Variables de migration invalides : DIRECT_URL",
    );
  });

  it("refuse une connexion de mauvais type", () => {
    expect(() => getMigrationDatabaseUrl({ DIRECT_URL: /** @type {any} */ (42) })).toThrow(
      /DIRECT_URL/,
    );
  });
});
