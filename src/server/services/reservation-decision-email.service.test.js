import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEvent } from "../db/event.repository.js";
import { sendEmail } from "../email/send-email.js";
import { recordEmailFailure } from "./email-failure.service.js";
import {
  sendReservationConfirmation,
  sendReservationRefusal,
} from "./reservation-decision-email.service.js";

vi.mock("../email/send-email.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../db/event.repository.js", () => ({ getEvent: vi.fn() }));
vi.mock("./email-failure.service.js", () => ({ recordEmailFailure: vi.fn() }));

/** @type {import("../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} */
const RESERVATION = {
  id: "internal-fake",
  code: "NOEL-1234",
  token: "C".repeat(43),
  firstName: "Fictif",
  email: "fictif@example.test",
  language: "EN",
  seats: 2,
  childSeats: 0,
  amountCents: 6000,
  interacEmail: "paiements@example.test",
};
const EVENT = {
  id: "event-fake",
  startsAt: new Date("2026-12-19T23:00:00.000Z"),
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
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

describe("courriels de décision", () => {
  it("envoie la confirmation et l'avis de refus dans la langue enregistrée", async () => {
    await expect(sendReservationConfirmation(RESERVATION)).resolves.toBe(true);
    await expect(sendReservationRefusal(RESERVATION, "NO_TRANSFER")).resolves.toBe(true);

    const [[confirmation], [refusal]] = vi.mocked(sendEmail).mock.calls;
    expect(confirmation.subject).toBe("Your seat at the Christmas Dinner is confirmed");
    expect(refusal.subject).toBe("Your proof of payment was not accepted — NOEL-1234");
    expect(refusal.text).toContain(`https://diner.example.test/en/r/${RESERVATION.token}`);
    expect(recordEmailFailure).not.toHaveBeenCalled();
  });

  it.each([
    ["confirmation", "CONFIRMATION", () => sendReservationConfirmation(RESERVATION)],
    ["refus", "REFUSAL", () => sendReservationRefusal(RESERVATION, "NO_TRANSFER")],
  ])(
    "absorbe une panne SMTP de %s, ne journalise que l'identifiant et garde l'échec",
    async (_, kind, send) => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(sendEmail).mockRejectedValue(new Error(`secret-fictif ${RESERVATION.email}`));

      await expect(send()).resolves.toBe(false);

      const recorded = JSON.parse(log.mock.calls[0][0]);
      expect(Object.keys(recorded).sort()).toEqual(["level", "message", "reservationId", "time"]);
      expect(recorded.reservationId).toBe("internal-fake");
      expect(log.mock.calls[0][0]).not.toMatch(/secret-fictif|fictif@example/);
      expect(recordEmailFailure).toHaveBeenCalledExactlyOnceWith({
        reservationId: "internal-fake",
        kind,
      });
    },
  );

  it("n'essaie pas SMTP quand la configuration manque", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SMTP_PASSWORD", "");

    await expect(sendReservationConfirmation(RESERVATION)).resolves.toBe(false);
    await expect(sendReservationRefusal(RESERVATION, "NO_TRANSFER")).resolves.toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(getEvent).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(2);
  });

  it("signale l'échec quand l'événement n'existe pas", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getEvent).mockResolvedValue(null);

    await expect(sendReservationConfirmation(RESERVATION)).resolves.toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
