import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/server/services/event.service", () => ({ getEventOverview: vi.fn() }));

const { connection } = await import("next/server");
const { getEventOverview } = await import("@/server/services/event.service");
const { logger } = await import("@/lib/logger");
const { default: EventDetails } = await import("./EventDetails");

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("EventDetails", () => {
  it("se déclare dynamique avant de lire la base, puis transmet l'aperçu", async () => {
    // Préparer
    const overview = { seatsLeft: 3 };
    vi.mocked(getEventOverview).mockResolvedValue(/** @type {any} */ (overview));

    // Agir
    const element = await EventDetails({ lang: "en" });

    // Vérifier
    expect(connection).toHaveBeenCalledTimes(1);
    expect(element.props.overview).toBe(overview);
    expect(element.props.lang).toBe("en");
  });

  it("journalise l'échec avec la route, sans donnée personnelle, puis relance l'erreur", async () => {
    const secret = "postgresql://user:secret@example.test/db";
    const failure = new Error(secret);
    vi.mocked(getEventOverview).mockRejectedValue(failure);
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = EventDetails({ lang: "fr" });
    await expect(result).rejects.not.toBe(failure);
    await expect(result).rejects.toMatchObject({ message: "EVENT_OVERVIEW_FAILED" });
    await expect(result).rejects.not.toHaveProperty("cause");
    await expect(result).rejects.not.toHaveProperty("stack", expect.stringContaining(secret));
    expect(errorSpy).toHaveBeenCalledWith("event_overview_failed", {
      route: "/fr",
      method: "GET",
      errorName: "Error",
    });
  });
});
