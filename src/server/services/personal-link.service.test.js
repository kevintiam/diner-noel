import { afterEach, describe, expect, it, vi } from "vitest";
import { getPersonalLinkForOrganizer } from "./personal-link.service.js";

const TOKEN = "A".repeat(43);
/** @type {import("./personal-link.service.js").ReservationForPersonalLink} */
const RESERVATION = { id: "internal-fake", token: TOKEN, language: "FR" };
// SITE_URL seule : le lien ne dépend d'aucune variable SMTP.
const SOURCE = { SITE_URL: "https://diner.example.test/" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getPersonalLinkForOrganizer", () => {
  it("donne l'adresse française d'une réservation en français", () => {
    expect(getPersonalLinkForOrganizer(RESERVATION, SOURCE)).toBe(
      `https://diner.example.test/fr/r/${TOKEN}`,
    );
  });

  it("donne l'adresse anglaise d'une réservation en anglais", () => {
    expect(getPersonalLinkForOrganizer({ ...RESERVATION, language: "EN" }, SOURCE)).toBe(
      `https://diner.example.test/en/r/${TOKEN}`,
    );
  });

  it("encode le jeton dans l'adresse", () => {
    const link = getPersonalLinkForOrganizer(
      { ...RESERVATION, token: "jeton/fictif?x=1#y" },
      SOURCE,
    );
    expect(link).toBe("https://diner.example.test/fr/r/jeton%2Ffictif%3Fx%3D1%23y");
  });

  it("lit SITE_URL dans l'environnement par défaut, même sans SMTP", () => {
    vi.stubEnv("SITE_URL", "https://diner.example.test");
    vi.stubEnv("SMTP_PASSWORD", "");
    expect(getPersonalLinkForOrganizer(RESERVATION)).toBe(
      `https://diner.example.test/fr/r/${TOKEN}`,
    );
  });

  it.each([
    ["absente", {}],
    ["vide", { SITE_URL: "" }],
    ["en HTTP hors local", { SITE_URL: "http://externe.example.test" }],
  ])(
    "renvoie null quand SITE_URL est %s et journalise seulement l'identifiant",
    (_case, source) => {
      const log = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(getPersonalLinkForOrganizer(RESERVATION, source)).toBeNull();

      expect(log).toHaveBeenCalledOnce();
      const [line] = log.mock.calls[0];
      expect(JSON.parse(line)).toEqual({
        level: "warn",
        message: "personal_link_unavailable",
        reservationId: "internal-fake",
        time: expect.any(String),
      });
      expect(line).not.toContain(TOKEN);
    },
  );
});
