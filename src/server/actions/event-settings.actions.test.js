import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/app-error.js";

const NEXT_REDIRECT = new Error("NEXT_REDIRECT");

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw NEXT_REDIRECT;
  }),
}));
vi.mock("../auth/require-organizer.js", () => ({ requireOrganizer: vi.fn() }));
vi.mock("../services/event-settings.service.js", () => ({ updateEventSettings: vi.fn() }));

const { redirect } = await import("next/navigation");
const { requireOrganizer } = await import("../auth/require-organizer.js");
const { updateEventSettings } = await import("../services/event-settings.service.js");
const { updateEventSettingsAction } = await import("./event-settings.actions.js");

const VALUES = {
  startsAtDate: "2026-12-19",
  startsAtTime: "18:00",
  bookingDeadlineDate: "2026-12-12",
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
  capacity: "120",
  unitPrice: "35",
  interacEmail: "paiements@example.test",
};

/** @param {Record<string, string>} values */
function buildFormData(values) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(values)) formData.set(name, value);
  return formData;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateEventSettingsAction", () => {
  it("refuse d'agir sans organisateur connecté", async () => {
    vi.mocked(requireOrganizer).mockRejectedValue(NEXT_REDIRECT);

    await expect(updateEventSettingsAction(null, buildFormData(VALUES))).rejects.toBe(
      NEXT_REDIRECT,
    );
    expect(updateEventSettings).not.toHaveBeenCalled();
  });

  it("enregistre les valeurs avec la case cochée, puis recharge l'écran", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue({
      id: "org_1",
      email: "o@example.test",
      name: "O",
    });

    await expect(
      updateEventSettingsAction(null, buildFormData({ ...VALUES, autoDepositConfirmed: "on" })),
    ).rejects.toBe(NEXT_REDIRECT);
    expect(updateEventSettings).toHaveBeenCalledWith({ ...VALUES, autoDepositConfirmed: true });
    expect(redirect).toHaveBeenCalledWith("/admin/parametres?enregistre=1");
  });

  it("renvoie les erreurs traduites et garde les valeurs saisies", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue({
      id: "org_1",
      email: "o@example.test",
      name: "O",
    });
    vi.mocked(updateEventSettings).mockRejectedValue(
      new AppError(400, "VALIDATION_ERROR", "errors.validation", [
        { field: "capacity", messageKey: "validation.capacityBelowTaken" },
      ]),
    );

    const state = await updateEventSettingsAction(
      null,
      buildFormData({ ...VALUES, capacity: "2" }),
    );

    expect(state).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Certains champs sont à corriger.",
        details: [
          {
            field: "capacity",
            message: "Le nombre de places ne peut pas descendre sous les places déjà prises.",
          },
        ],
      },
      values: { ...VALUES, capacity: "2" },
    });
    expect(vi.mocked(updateEventSettings).mock.calls[0][0]).toMatchObject({
      autoDepositConfirmed: false,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
