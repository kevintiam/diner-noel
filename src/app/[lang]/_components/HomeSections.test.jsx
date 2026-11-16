import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/server/services/event.service", () => ({ getEventOverview: vi.fn() }));

const { connection } = await import("next/server");
const { getEventOverview } = await import("@/server/services/event.service");
const { logger } = await import("@/lib/logger");
const { default: FinalCallToAction } = await import("@/components/home/FinalCallToAction");
const { default: HeroEventFacts } = await import("@/components/home/HeroEventFacts");
const { default: PracticalInfoCards } = await import("@/components/home/PracticalInfoCards");
const { FinalCallToActionSection, HeroEventDetails, PracticalInfoSection } =
  await import("./HomeSections");
const { loadEventOverview } = await import("./load-event-overview");

const OVERVIEW = { venueName: "Salle fictive", venueAddress: "1 rue Exemple, Nepean" };

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("sections dynamiques de l'accueil", () => {
  it.each([
    ["HeroEventDetails", HeroEventDetails, HeroEventFacts],
    ["PracticalInfoSection", PracticalInfoSection, PracticalInfoCards],
    ["FinalCallToActionSection", FinalCallToActionSection, FinalCallToAction],
  ])("%s se déclare dynamique puis transmet l'aperçu", async (_, Section, Display) => {
    vi.mocked(getEventOverview).mockResolvedValue(/** @type {any} */ (OVERVIEW));

    const element = await Section({ lang: "en" });

    expect(connection).toHaveBeenCalledTimes(1);
    expect(element.type).toBe(Display);
    expect(element.props).toMatchObject({ overview: OVERVIEW, lang: "en" });
  });

  it("initialise le compte à rebours avec l'instant utilisé pour lire l'événement", async () => {
    const requestTime = new Date("2026-11-16T17:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(requestTime);
    vi.mocked(getEventOverview).mockImplementation(async () => {
      // La lecture peut finir plus tard : le premier rendu garde l'instant de la requête.
      vi.setSystemTime(new Date("2026-11-16T17:00:02Z"));
      return /** @type {any} */ (OVERVIEW);
    });

    const element = await HeroEventDetails({ lang: "fr" });

    expect(getEventOverview).toHaveBeenCalledWith(requestTime);
    expect(element.props.initialNow).toBe(requestTime.getTime());
  });
});

describe("loadEventOverview", () => {
  it("lit l'aperçu à l'instant de la requête", async () => {
    vi.mocked(getEventOverview).mockResolvedValue(/** @type {any} */ (OVERVIEW));

    expect(await loadEventOverview("/fr")).toMatchObject(OVERVIEW);
    expect(getEventOverview).toHaveBeenCalledWith(expect.any(Date));
  });

  it("journalise la panne sans donnée personnelle, puis lance une erreur générique", async () => {
    vi.mocked(getEventOverview).mockRejectedValue(new Error("postgresql://secret"));
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    await expect(loadEventOverview("/en")).rejects.toMatchObject({
      message: "EVENT_OVERVIEW_FAILED",
    });
    expect(errorSpy).toHaveBeenCalledWith("event_overview_failed", {
      route: "/en",
      method: "GET",
      errorName: "Error",
    });
  });
});
