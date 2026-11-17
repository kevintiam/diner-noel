import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error.js";

const NEXT_REDIRECT = new Error("NEXT_REDIRECT");

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-nf-client-connection-ip": "203.0.113.7" })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw NEXT_REDIRECT;
  }),
}));
vi.mock("../services/rate-limit.service.js", async (importOriginal) => ({
  ...(await importOriginal()),
  checkRateLimit: vi.fn(async () => {}),
}));
vi.mock("../services/reservation.service.js", () => ({ createReservation: vi.fn() }));

const { refresh } = await import("next/cache");
const { redirect } = await import("next/navigation");
const { checkRateLimit } = await import("../services/rate-limit.service.js");
const { createReservation } = await import("../services/reservation.service.js");
const { createReservationAction } = await import("./reservation.actions.js");

/** @param {Record<string, string>} [overrides] */
function buildFormData(overrides = {}) {
  const formData = new FormData();
  const values = {
    firstName: "Prénom",
    lastName: "Fictif",
    email: "fictif@example.test",
    phone: "613 555-0100",
    adultSeats: "2",
    childSeats: "0",
    note: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(values)) formData.set(name, value);
  return formData;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("createReservationAction", () => {
  it("crée la réservation puis redirige vers la page de paiement, hors du try", async () => {
    vi.mocked(createReservation).mockResolvedValue({ code: "NOEL-4821", token: "jeton-fictif" });

    await expect(createReservationAction("en", null, buildFormData())).rejects.toBe(NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith("/en/r/jeton-fictif");
    expect(createReservation).toHaveBeenCalledWith(
      expect.objectContaining({ adultSeats: 2, firstName: "Prénom" }),
      { lang: "en", now: expect.any(Date) },
    );
  });

  it("limite les envois par une clé qui ne contient pas l'adresse IP", async () => {
    vi.mocked(createReservation).mockResolvedValue({ code: "NOEL-4821", token: "jeton-fictif" });

    await expect(createReservationAction("fr", null, buildFormData())).rejects.toBe(NEXT_REDIRECT);

    const [{ key, limit, windowSeconds }] = vi.mocked(checkRateLimit).mock.calls[0];
    expect(key).toMatch(/^reserve:/);
    expect(key).not.toContain("203.0.113.7");
    expect({ limit, windowSeconds }).toEqual({ limit: 20, windowSeconds: 900 });
  });

  it("renvoie les erreurs par champ traduites et la saisie, sans appeler le service", async () => {
    const result = await createReservationAction(
      "fr",
      null,
      buildFormData({ email: "sans-arobase", adultSeats: "11" }),
    );

    expect(createReservation).not.toHaveBeenCalled();
    expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(result.error.details).toEqual([
      { field: "email", message: "Le courriel est invalide." },
      { field: "adultSeats", message: "Choisissez un nombre entier de 0 à 10." },
    ]);
    expect(result.values).toMatchObject({
      firstName: "Prénom",
      email: "sans-arobase",
      adultSeats: "11",
    });
  });

  it("renvoie le refus du service dans la langue de la page", async () => {
    vi.mocked(createReservation).mockRejectedValue(new AppError(409, "SOLD_OUT", "errors.soldOut"));

    const result = await createReservationAction("en", null, buildFormData());

    expect(result.error).toEqual({
      code: "SOLD_OUT",
      message: "The dinner is sold out: no seats are left.",
    });
  });

  it.each(["SOLD_OUT", "NOT_ENOUGH_SEATS", "BOOKING_CLOSED"])(
    "relit la page pour afficher les places à jour après un refus %s",
    async (code) => {
      vi.mocked(createReservation).mockRejectedValue(new AppError(409, code, "errors.soldOut"));

      await createReservationAction("fr", null, buildFormData());

      expect(refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("ne relit pas la page pour une erreur de saisie", async () => {
    await createReservationAction("fr", null, buildFormData({ email: "sans-arobase" }));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuse au-delà de la limite d'envois", async () => {
    vi.mocked(checkRateLimit).mockRejectedValueOnce(
      new AppError(429, "TOO_MANY_REQUESTS", "errors.tooManyRequests"),
    );

    const result = await createReservationAction("fr", null, buildFormData());

    expect(result.error.code).toBe("TOO_MANY_REQUESTS");
    expect(createReservation).not.toHaveBeenCalled();
  });

  it("revient au français pour une langue inconnue et ignore un champ fichier", async () => {
    const formData = buildFormData();
    formData.set("firstName", new File(["x"], "piege.txt"));

    const result = await createReservationAction("de", null, formData);

    expect(result.error.details).toEqual([
      { field: "firstName", message: "Indiquez votre prénom." },
    ]);
  });
});
