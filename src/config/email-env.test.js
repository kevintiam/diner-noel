import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailEnv, getSiteUrl, parseEmailEnv, parseEnv } from "./env.js";

const CONFIGURATION = {
  SITE_URL: "https://diner.example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "fictif",
  SMTP_PASSWORD: "secret-fictif",
  EMAIL_FROM: "reservations@example.test",
};

afterEach(() => vi.unstubAllEnvs());

describe("configuration courriel", () => {
  it("valide les variables, convertit le port et nomme l'expéditeur par défaut", () => {
    expect(parseEmailEnv(CONFIGURATION)).toEqual({
      ...CONFIGURATION,
      SMTP_PORT: 587,
      EMAIL_FROM: { name: "Dîner de Noël", address: "reservations@example.test" },
    });
  });

  it("accepte un nom d'expéditeur sous la forme « Nom <adresse> »", () => {
    const env = parseEmailEnv({
      ...CONFIGURATION,
      EMAIL_FROM: "  Équipe du dîner fictif <reservations@example.test> ",
    });

    expect(env.EMAIL_FROM).toEqual({
      name: "Équipe du dîner fictif",
      address: "reservations@example.test",
    });
  });

  it("refuse un nom d'expéditeur trop long", () => {
    const longName = "N".repeat(65);
    const attempt = () =>
      parseEmailEnv({ ...CONFIGURATION, EMAIL_FROM: `${longName} <reservations@example.test>` });

    expect(attempt).toThrow("EMAIL_FROM");
    expect(attempt).not.toThrow(longName);
  });

  it.each(["1", "465", "65535"])("accepte le port limite %s", (port) => {
    expect(parseEmailEnv({ ...CONFIGURATION, SMTP_PORT: port }).SMTP_PORT).toBe(Number(port));
  });

  it.each(["http://localhost:3100", "http://127.0.0.1:3000", "http://[::1]:3000"])(
    "autorise l'adresse locale %s",
    (url) => expect(parseEmailEnv({ ...CONFIGURATION, SITE_URL: url }).SITE_URL).toBe(url),
  );

  it.each([
    ["SITE_URL", "http://externe.example.test"],
    ["SITE_URL", "javascript:secret-fictif"],
    ["SITE_URL", "https://user:secret-fictif@example.test"],
    ["SITE_URL", "https://example.test/chemin"],
    ["SITE_URL", "https://example.test/?token=secret-fictif"],
    ["SITE_URL", "https://example.test/#secret-fictif"],
    ["SMTP_PORT", "0"],
    ["SMTP_PORT", "65536"],
    ["SMTP_PORT", "587.5"],
    ["SMTP_HOST", "smtp.example.test\r\nsecret-fictif"],
    ["EMAIL_FROM", "courriel-fictif-malforme"],
    ["EMAIL_FROM", "Nom fictif <courriel-fictif-malforme>"],
    ["EMAIL_FROM", "Nom fictif <reservations@example.test"],
    ["EMAIL_FROM", " <reservations@example.test>"],
    // Un retour à la ligne dans le nom pourrait ajouter un en-tête au courriel.
    ["EMAIL_FROM", "Nom\r\nBcc: secret-fictif@example.test <reservations@example.test>"],
    ["EMAIL_FROM", '"Nom fictif" <reservations@example.test>'],
  ])("refuse %s invalide sans divulguer sa valeur", (key, value) => {
    const attempt = () => parseEmailEnv({ ...CONFIGURATION, [key]: value });
    expect(attempt).toThrow(key);
    expect(attempt).not.toThrow(value);
    expect(attempt).not.toThrow("secret-fictif");
  });

  it.each(Object.keys(CONFIGURATION))("refuse %s absent, vide, null ou numérique", (key) => {
    for (const value of [undefined, "", null, 42]) {
      expect(() => parseEmailEnv({ ...CONFIGURATION, [key]: value })).toThrow(key);
    }
  });

  it("garde la configuration de base indépendante du courriel", () => {
    expect(parseEnv({ DATABASE_URL: "postgresql://fake:fake@localhost/test" })).toBeDefined();
  });

  it("lit l'environnement seulement à l'appel", () => {
    for (const [key, value] of Object.entries(CONFIGURATION)) vi.stubEnv(key, value);
    expect(getEmailEnv().SMTP_PORT).toBe(587);
    vi.stubEnv("SMTP_PASSWORD", "");
    expect(() => getEmailEnv()).toThrow("SMTP_PASSWORD");
  });
});

describe("adresse publique du site", () => {
  const MESSAGE = "Variable SITE_URL manquante ou invalide";

  it("renvoie l'origine valide sans exiger les variables SMTP", () => {
    expect(getSiteUrl({ SITE_URL: "https://diner.example.test/" })).toBe(
      "https://diner.example.test/",
    );
    expect(getSiteUrl({ SITE_URL: "http://localhost:3100" })).toBe("http://localhost:3100");
  });

  it.each([undefined, "", null, 42])("refuse SITE_URL absente ou vide (%s)", (value) => {
    expect(() => getSiteUrl({ SITE_URL: value })).toThrow(MESSAGE);
  });

  it.each([
    "http://externe.example.test",
    "javascript:secret-fictif",
    "https://user:secret-fictif@example.test",
    "https://example.test/chemin",
    "https://example.test/?token=secret-fictif",
    "https://example.test/#secret-fictif",
  ])("refuse l'adresse invalide %s sans divulguer sa valeur", (value) => {
    const attempt = () => getSiteUrl({ SITE_URL: value });
    expect(attempt).toThrow(MESSAGE);
    expect(attempt).not.toThrow(value);
    expect(attempt).not.toThrow("secret-fictif");
  });

  it("lit SITE_URL dans l'environnement par défaut", () => {
    vi.stubEnv("SITE_URL", "https://diner.example.test");
    vi.stubEnv("SMTP_HOST", "");
    expect(getSiteUrl()).toBe("https://diner.example.test");
    vi.stubEnv("SITE_URL", "");
    expect(() => getSiteUrl()).toThrow(MESSAGE);
  });
});
