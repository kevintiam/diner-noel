import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { sendEmail } from "../email/send-email.js";
import { createReservation } from "./reservation.service.js";

vi.mock("../email/send-email.js", () => ({ sendEmail: vi.fn() }));
const NOW = new Date("2026-11-20T15:00:00Z");
const INPUT = {
  firstName: "Fictif",
  lastName: "Exemple",
  email: "fictif@example.test",
  phone: "6135550100",
  adultSeats: 2,
  childSeats: 1,
};
const CONFIGURATION = {
  SITE_URL: "https://diner.example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "fictif",
  SMTP_PASSWORD: "secret-fictif",
  EMAIL_FROM: "expediteur@example.test",
};

beforeEach(async () => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries(CONFIGURATION)) vi.stubEnv(key, value);
  vi.mocked(sendEmail).mockResolvedValue(undefined);
  await resetTestDatabase();
  await seedDefaultEvent();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(async () => disconnectPrisma());

describe("accusé après commit", () => {
  it("lit le commit depuis une autre connexion et attend SMTP avant de retourner", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    let hasReturned = false;
    let hasSent = false;
    vi.mocked(sendEmail).mockImplementation(async (message) => {
      const stored = await getPrisma().reservation.findFirstOrThrow();
      expect(stored.language).toBe("EN");
      expect(message.text).toContain(stored.code);
      expect(message.text).toContain(`/en/r/${stored.token}`);
      expect(hasReturned).toBe(false);
      // Un autre accès peut modifier l'événement : le verrou a été libéré.
      await getPrisma().event.updateMany({
        data: { unitPriceCents: 9999, interacEmail: "modifie@example.test" },
      });
      expect(message.text).toContain("$60.00");
      expect(message.text).toContain("paiements@example.org");
      expect(message.text).not.toContain("modifie@example.test");
      hasSent = true;
    });

    const result = await createReservation(INPUT, { lang: "en", now: NOW });
    hasReturned = true;

    expect(Object.keys(result).sort()).toEqual(["code", "token"]);
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(hasSent).toBe(true);
    expect(log).not.toHaveBeenCalled();
    expect(await getPrisma().emailFailure.count()).toBe(0);
  });

  it("conserve places, montant et retour public quand SMTP refuse", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendEmail).mockRejectedValue(new Error("panne fictive confidentielle"));

    const result = await createReservation(INPUT, { lang: "en", now: NOW });

    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { token: result.token },
    });
    expect(stored).toMatchObject({
      seats: 3,
      childSeats: 1,
      amountCents: 6000,
      status: "PENDING_PAYMENT",
    });
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      message: "reservation_receipt_failed",
      reservationId: stored.id,
    });
    // L'échec reste visible des organisateurs jusqu'à ce que l'un d'eux le traite.
    expect(await getPrisma().emailFailure.findMany()).toEqual([
      expect.objectContaining({ reservationId: stored.id, kind: "RECEIPT", resolvedAt: null }),
    ]);
  });

  it("confirme la gratuité directement et envoie une confirmation sans paiement", async () => {
    const result = await createReservation({ ...INPUT, adultSeats: 0 }, { lang: "fr", now: NOW });
    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { token: result.token },
    });
    expect(stored.status).toBe("CONFIRMED");
    const [message] = vi.mocked(sendEmail).mock.calls[0];
    expect(message.text).toContain("déjà confirmée");
    expect(message.text).not.toMatch(/virement|preuve|Interac/);
  });

  it("n'envoie rien après validation refusée, fermeture ou capacité insuffisante", async () => {
    await expect(
      createReservation({ ...INPUT, adultSeats: 11 }, { lang: "fr", now: NOW }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      createReservation(INPUT, { lang: "fr", now: new Date("2027-01-01") }),
    ).rejects.toMatchObject({ code: "BOOKING_CLOSED" });
    await getPrisma().event.updateMany({ data: { capacity: 1 } });
    await expect(createReservation(INPUT, { lang: "fr", now: NOW })).rejects.toMatchObject({
      code: "NOT_ENOUGH_SEATS",
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await getPrisma().reservation.count()).toBe(0);
  });

  it("n'envoie rien quand la transaction échoue en base", async () => {
    await expect(
      createReservation({ ...INPUT, adultSeats: 0 }, { lang: "fr", now: new Date("invalide") }),
    ).rejects.toThrow();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await getPrisma().reservation.count()).toBe(0);
  });
});
