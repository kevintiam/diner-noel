import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOverview } from "@/components/home/home-test-data";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/server/services/event.service", () => ({ getEventOverview: vi.fn() }));
vi.mock("@/server/actions/reservation.actions", () => ({ createReservationAction: vi.fn() }));

const { connection } = await import("next/server");
const { getEventOverview } = await import("@/server/services/event.service");
const { logger } = await import("@/lib/logger");
const { default: BookingCallToAction } = await import("@/components/event/BookingCallToAction");
const { default: ReservationForm } = await import("@/components/reservations/ReservationForm");
const { default: ReservationFormSection } = await import("./ReservationFormSection");

/** @param {object} overrides */
function mockOverview(overrides) {
  vi.mocked(getEventOverview).mockResolvedValue(
    /** @type {any} */ ({
      ...buildOverview(),
      unitPriceCents: 2500,
      isBookingOpen: true,
      isClosedByDeadline: false,
      ...overrides,
    }),
  );
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("ReservationFormSection", () => {
  it("se déclare dynamique, puis affiche le formulaire plafonné à 10 places", async () => {
    mockOverview({ seatsLeft: 120 });

    const element = await ReservationFormSection({ lang: "fr" });

    expect(connection).toHaveBeenCalledTimes(1);
    expect(getEventOverview).toHaveBeenCalledWith(expect.any(Date));
    expect(element.type).toBe(ReservationForm);
    expect(element.props).toMatchObject({
      maxSeats: 10,
      maxSeatsPerReservation: 10,
      eventDetails: {
        startsAt: "2026-12-19T23:00:00.000Z",
        venueName: "Salle fictive",
        venueAddress: "1 rue Exemple, Nepean",
      },
    });
  });

  it("plafonne le formulaire aux places encore libres", async () => {
    mockOverview({ seatsLeft: 3 });

    const element = await ReservationFormSection({ lang: "en" });

    expect(element.props).toMatchObject({ maxSeats: 3, lang: "en" });
  });

  it("affiche le message de fermeture une fois la date limite passée", async () => {
    mockOverview({ isBookingOpen: false, isClosedByDeadline: true });

    const element = await ReservationFormSection({ lang: "fr" });

    expect(element.type).toBe(BookingCallToAction);
    expect(element.props.overview.isClosedByDeadline).toBe(true);
  });

  it("journalise l'échec sans donnée personnelle, puis lance une erreur générique", async () => {
    const secret = "postgresql://user:secret@example.test/db";
    vi.mocked(getEventOverview).mockRejectedValue(new Error(secret));
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = ReservationFormSection({ lang: "fr" });

    await expect(result).rejects.toMatchObject({ message: "RESERVATION_FORM_FAILED" });
    expect(errorSpy).toHaveBeenCalledWith("reservation_form_failed", {
      route: "/fr/reservation",
      method: "GET",
      errorName: "Error",
    });
  });
});
