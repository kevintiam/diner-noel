import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error.js";

const NEXT_REDIRECT = new Error("NEXT_REDIRECT");

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-nf-client-connection-ip": "203.0.113.7" })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw NEXT_REDIRECT;
  }),
}));
vi.mock("../auth/session-cookie.js", () => ({
  clearSessionCookie: vi.fn(),
  readSessionToken: vi.fn(async () => "jeton"),
  writeSessionCookie: vi.fn(),
}));
vi.mock("../auth/require-organizer.js", () => ({
  LOGIN_PATH: "/admin/login",
  requireOrganizer: vi.fn(),
}));
vi.mock("../services/rate-limit.service.js", async (importOriginal) => ({
  ...(await importOriginal()),
  checkRateLimit: vi.fn(async () => {}),
}));
vi.mock("../services/organizer.service.js", () => ({
  loginOrganizer: vi.fn(),
  logoutOrganizer: vi.fn(),
}));
vi.mock("../services/reservation-decision.service.js", () => ({ decideReservation: vi.fn() }));

const { redirect } = await import("next/navigation");
const { clearSessionCookie, writeSessionCookie } = await import("../auth/session-cookie.js");
const { requireOrganizer } = await import("../auth/require-organizer.js");
const { checkRateLimit } = await import("../services/rate-limit.service.js");
const { loginOrganizer, logoutOrganizer } = await import("../services/organizer.service.js");
const { decideReservation } = await import("../services/reservation-decision.service.js");
const { loginOrganizerAction, logoutOrganizerAction, updateReservationStatusAction } =
  await import("./organizer.actions.js");

const EXPIRES_AT = new Date("2026-11-23T15:00:00.000Z");

/** @param {Record<string, string>} values */
function buildFormData(values) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) formData.set(name, value);
  return formData;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("loginOrganizerAction", () => {
  it("compte l'essai, dépose le cookie puis mène au tableau de bord", async () => {
    vi.mocked(loginOrganizer).mockResolvedValue({
      organizer: { id: "org_1", email: "orga@example.test", name: "Orga" },
      token: "jeton",
      expiresAt: EXPIRES_AT,
    });

    await expect(
      loginOrganizerAction(null, buildFormData({ email: "orga@example.test", password: "x" })),
    ).rejects.toBe(NEXT_REDIRECT);

    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ key: expect.stringMatching(/^login:/), limit: 5 }),
    );
    expect(loginOrganizer).toHaveBeenCalledWith(
      { email: "orga@example.test", password: "x" },
      { now: expect.any(Date) },
    );
    expect(writeSessionCookie).toHaveBeenCalledWith("jeton", EXPIRES_AT);
    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("renvoie l'erreur traduite et le courriel, jamais le mot de passe", async () => {
    vi.mocked(loginOrganizer).mockRejectedValue(
      new AppError(401, "INVALID_CREDENTIALS", "errors.invalidCredentials"),
    );

    const state = await loginOrganizerAction(
      null,
      buildFormData({ email: "orga@example.test", password: "mot-de-passe-faux" }),
    );

    expect(state).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Courriel ou mot de passe invalide." },
      email: "orga@example.test",
    });
    expect(JSON.stringify(state)).not.toContain("mot-de-passe-faux");
    expect(writeSessionCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("bloque au-delà de la limite sans vérifier le mot de passe", async () => {
    vi.mocked(checkRateLimit).mockRejectedValueOnce(
      new AppError(429, "TOO_MANY_REQUESTS", "errors.tooManyRequests"),
    );

    const state = await loginOrganizerAction(
      null,
      buildFormData({ email: "orga@example.test", password: "x" }),
    );

    expect(state.error.code).toBe("TOO_MANY_REQUESTS");
    expect(loginOrganizer).not.toHaveBeenCalled();
  });

  it("traite un formulaire vide comme des champs à corriger", async () => {
    vi.mocked(loginOrganizer).mockRejectedValue(
      new AppError(400, "VALIDATION_ERROR", "errors.validation", [
        { field: "password", messageKey: "validation.passwordRequired" },
      ]),
    );

    const state = await loginOrganizerAction(null, new FormData());

    expect(loginOrganizer).toHaveBeenCalledWith(
      { email: "", password: "" },
      { now: expect.any(Date) },
    );
    expect(state.error.details).toEqual([
      { field: "password", message: "Indiquez votre mot de passe." },
    ]);
    expect(state.email).toBe("");
  });
});

describe("logoutOrganizerAction", () => {
  it("ferme la session, efface le cookie et revient à la connexion", async () => {
    await expect(logoutOrganizerAction()).rejects.toBe(NEXT_REDIRECT);

    expect(logoutOrganizer).toHaveBeenCalledWith("jeton");
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});

describe("updateReservationStatusAction", () => {
  const ORGANIZER = { id: "org_1", email: "orga@example.test", name: "Orga" };

  it("refuse d'agir sans organisateur connecté", async () => {
    vi.mocked(requireOrganizer).mockRejectedValue(NEXT_REDIRECT);

    await expect(
      updateReservationStatusAction(
        null,
        buildFormData({ reservationId: "res_1", decision: "confirm" }),
      ),
    ).rejects.toBe(NEXT_REDIRECT);
    expect(decideReservation).not.toHaveBeenCalled();
  });

  it("enregistre la décision au nom de l'organisateur connecté, puis revient à la fiche", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue(ORGANIZER);
    vi.mocked(decideReservation).mockResolvedValue({
      id: "res_1",
      status: "CONFIRMED",
      emailSent: true,
    });

    await expect(
      updateReservationStatusAction(
        null,
        buildFormData({ reservationId: "res_1", decision: "confirm", reasonCode: "" }),
      ),
    ).rejects.toBe(NEXT_REDIRECT);
    expect(decideReservation).toHaveBeenCalledWith(
      { reservationId: "res_1", decision: "confirm", reasonCode: undefined },
      { organizerId: "org_1", now: expect.any(Date) },
    );
    expect(redirect).toHaveBeenCalledWith("/admin/reservations/res_1");
  });

  it("transmet le motif d'un refus et signale un courriel qui n'est pas parti", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue(ORGANIZER);
    vi.mocked(decideReservation).mockResolvedValue({
      id: "res_1",
      status: "PENDING_PAYMENT",
      emailSent: false,
    });

    await expect(
      updateReservationStatusAction(
        null,
        buildFormData({
          reservationId: "res_1",
          decision: "refuse",
          reasonCode: "INCOMPLETE_AMOUNT",
        }),
      ),
    ).rejects.toBe(NEXT_REDIRECT);
    expect(vi.mocked(decideReservation).mock.calls[0][0]).toMatchObject({
      reasonCode: "INCOMPLETE_AMOUNT",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/reservations/res_1?courriel=non-envoye");
  });

  it("renvoie l'erreur traduite quand la réservation a changé entre-temps", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue(ORGANIZER);
    vi.mocked(decideReservation).mockRejectedValue(
      new AppError(409, "RESERVATION_STATUS_CHANGED", "errors.reservationStatusChanged"),
    );

    const state = await updateReservationStatusAction(
      null,
      buildFormData({ reservationId: "res_1", decision: "confirm" }),
    );

    expect(state).toEqual({
      error: {
        code: "RESERVATION_STATUS_CHANGED",
        message:
          "Cette réservation a changé entre-temps. Rechargez la fiche pour voir son statut actuel.",
      },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
