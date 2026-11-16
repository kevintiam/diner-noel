import { afterEach, describe, expect, it, vi } from "vitest";

const NOT_FOUND = new Error("NEXT_NOT_FOUND");

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw NOT_FOUND;
  }),
}));
vi.mock("@/server/services/reservation.service", () => ({ getReservationForPayment: vi.fn() }));

const { connection } = await import("next/server");
const { notFound } = await import("next/navigation");
const { getReservationForPayment } = await import("@/server/services/reservation.service");
const { logger } = await import("@/lib/logger");
const { default: PaymentInstructions } =
  await import("@/components/reservations/PaymentInstructions");
const { default: PaymentDetails } = await import("./PaymentDetails");

const TOKEN = "A".repeat(43);

/** @param {string} lang */
function buildParams(lang) {
  return Promise.resolve({ lang, token: TOKEN });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("PaymentDetails", () => {
  it("lit la réservation du lien à la demande et affiche ses instructions", async () => {
    const reservation = { code: "NOEL-4821", amountCents: 5000 };
    vi.mocked(getReservationForPayment).mockResolvedValue(/** @type {any} */ (reservation));

    const element = await PaymentDetails({ params: buildParams("en") });

    expect(connection).toHaveBeenCalledTimes(1);
    expect(getReservationForPayment).toHaveBeenCalledWith(TOKEN);
    expect(element.type).toBe(PaymentInstructions);
    expect(element.props).toMatchObject({ reservation, lang: "en" });
  });

  it("choisit la confirmation gratuite pour un montant nul", async () => {
    const { default: FreeReservationConfirmation } =
      await import("@/components/reservations/FreeReservationConfirmation");
    vi.mocked(getReservationForPayment).mockResolvedValue({
      code: "NOEL-1234",
      status: "CONFIRMED",
      seats: 2,
      childSeats: 2,
      unitPriceCents: 3500,
      amountCents: 0,
      interacEmail: "fictif@example.test",
    });
    const element = await PaymentDetails({ params: buildParams("fr") });
    expect(element.type).toBe(FreeReservationConfirmation);
  });

  it("affiche la page introuvable pour un lien inconnu", async () => {
    vi.mocked(getReservationForPayment).mockResolvedValue(null);

    await expect(PaymentDetails({ params: buildParams("fr") })).rejects.toBe(NOT_FOUND);
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("journalise l'échec sans le jeton ni le message du pilote, puis lance une erreur générique", async () => {
    vi.mocked(getReservationForPayment).mockRejectedValue(new Error("postgresql://secret"));
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const result = PaymentDetails({ params: buildParams("fr") });

    await expect(result).rejects.toMatchObject({ message: "PAYMENT_PAGE_FAILED" });
    expect(errorSpy).toHaveBeenCalledWith("payment_page_failed", {
      route: "/fr/r",
      method: "GET",
      errorName: "Error",
    });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(TOKEN);
  });
});
