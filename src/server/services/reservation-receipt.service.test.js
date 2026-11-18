import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEvent } from "../db/event.repository.js";
import { sendEmail } from "../email/send-email.js";
import { recordEmailFailure } from "./email-failure.service.js";
import { sendReservationReceipt } from "./reservation-receipt.service.js";

vi.mock("../email/send-email.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../db/event.repository.js", () => ({ getEvent: vi.fn() }));
vi.mock("./email-failure.service.js", () => ({ recordEmailFailure: vi.fn() }));

const EVENT = {
  id: "event-fake",
  startsAt: new Date("2026-12-19T23:00:00.000Z"),
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
};
/** @type {import("../../validation/reservation.schema.js").ReservationForReceipt} */
const RESERVATION = {
  id: "internal-fake",
  code: "NOEL-1234",
  token: "A".repeat(43),
  firstName: "PrénomFictif",
  email: "fictif@example.test",
  language: "EN",
  seats: 2,
  childSeats: 1,
  unitPriceCents: 3000,
  amountCents: 3000,
  interacEmail: "interac@example.test",
};
const CONFIGURATION = {
  SITE_URL: "https://diner.example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "fictif",
  SMTP_PASSWORD: "secret-fictif",
  EMAIL_FROM: "expediteur@example.test",
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries(CONFIGURATION)) vi.stubEnv(key, value);
  vi.mocked(sendEmail).mockResolvedValue(undefined);
  vi.mocked(getEvent).mockResolvedValue(/** @type {never} */ (EVENT));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendReservationReceipt", () => {
  it("envoie le message à l'adresse enregistrée dans sa langue", async () => {
    await sendReservationReceipt(RESERVATION);
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        to: RESERVATION.email,
        subject: "Your booking NOEL-1234 — Christmas Dinner",
        text: expect.stringContaining(`/en/r/${RESERVATION.token}`),
      }),
    );
    expect(recordEmailFailure).not.toHaveBeenCalled();
  });

  it("confirme une inscription gratuite sans instructions de paiement", async () => {
    await sendReservationReceipt({ ...RESERVATION, amountCents: 0 });
    const [message] = vi.mocked(sendEmail).mock.calls[0];
    expect(message.subject).toContain("Booking confirmed");
    expect(message.text).not.toContain("Interac");
  });

  it("absorbe le refus SMTP et journalise seulement l'identifiant interne", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendEmail).mockRejectedValue(
      new Error(`secret-fictif ${RESERVATION.email} ${RESERVATION.token}`),
    );
    await expect(sendReservationReceipt(RESERVATION)).resolves.toBeUndefined();
    const recorded = JSON.parse(log.mock.calls[0][0]);
    expect(recorded).toEqual({
      level: "error",
      message: "reservation_receipt_failed",
      reservationId: "internal-fake",
      time: expect.any(String),
    });
    expect(log).toHaveBeenCalledOnce();
    // L'échec est aussi gardé en base, pour que les organisateurs le voient.
    expect(recordEmailFailure).toHaveBeenCalledExactlyOnceWith({
      reservationId: "internal-fake",
      kind: "RECEIPT",
    });
  });

  it("garde l'échec sans tenter SMTP quand l'événement manque", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getEvent).mockResolvedValue(null);

    await expect(sendReservationReceipt(RESERVATION)).resolves.toBeUndefined();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(recordEmailFailure).toHaveBeenCalledExactlyOnceWith({
      reservationId: "internal-fake",
      kind: "RECEIPT",
    });
  });

  it("absorbe la configuration absente sans tenter SMTP", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SMTP_PASSWORD", "");
    await expect(sendReservationReceipt(RESERVATION)).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    expect(recordEmailFailure).toHaveBeenCalledOnce();
  });
});
