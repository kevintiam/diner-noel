// Décisions des organisateurs sur la base Neon `test` (fichier .env.test). Données fictives.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { sendEmail } from "../email/send-email.js";
import { decideReservation } from "./reservation-decision.service.js";

vi.mock("../email/send-email.js", () => ({ sendEmail: vi.fn() }));
const NOW = new Date("2026-11-20T15:00:00.000Z");
const CONFIGURATION = {
  SITE_URL: "https://diner.example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "fictif",
  SMTP_PASSWORD: "secret-fictif",
  EMAIL_FROM: "expediteur@example.test",
};

/** @type {string} */
let organizerId;

/**
 * Crée une réservation fictive dans un statut donné.
 * @param {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 * @param {{ language?: "FR" | "EN", confirmedAt?: Date }} [options]
 */
async function createReservation(status, { language = "FR", confirmedAt } = {}) {
  return getPrisma().reservation.create({
    data: {
      code: "NOEL-4821",
      token: "jeton-fictif".padEnd(43, "x"),
      status,
      firstName: "Fictif",
      lastName: "Exemple",
      email: "fictif@example.test",
      phone: "6135550100",
      seats: 3,
      childSeats: 1,
      language,
      unitPriceCents: 3000,
      amountCents: 6000,
      interacEmail: "paiements@example.test",
      confirmedAt,
    },
  });
}

/** @param {string} reservationId */
function readDecisions(reservationId) {
  return getPrisma().reservationDecision.findMany({ where: { reservationId } });
}

beforeEach(async () => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries(CONFIGURATION)) vi.stubEnv(key, value);
  vi.mocked(sendEmail).mockResolvedValue(undefined);
  await resetTestDatabase();
  await seedDefaultEvent();
  const organizer = await getPrisma().organizer.create({
    data: { email: "orga@example.test", name: "Organisateur fictif", passwordHash: "empreinte" },
  });
  organizerId = organizer.id;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(async () => disconnectPrisma());

describe("decideReservation sur la base", () => {
  it("confirme, enregistre la décision, puis envoie la confirmation après le commit", async () => {
    const reservation = await createReservation("TO_VERIFY");
    vi.mocked(sendEmail).mockImplementation(async (message) => {
      // Une autre connexion voit déjà la décision : le courriel part après le commit.
      const stored = await getPrisma().reservation.findUniqueOrThrow({
        where: { id: reservation.id },
      });
      expect(stored.status).toBe("CONFIRMED");
      expect(message.to).toBe("fictif@example.test");
      expect(message.subject).toBe("Votre place au dîner de Noël est confirmée");
    });

    const result = await decideReservation(
      { reservationId: reservation.id, decision: "confirm" },
      { organizerId, now: NOW },
    );

    expect(result).toEqual({ id: reservation.id, status: "CONFIRMED", emailSent: true });
    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(stored.confirmedAt).toEqual(NOW);
    expect(await readDecisions(reservation.id)).toEqual([
      expect.objectContaining({ type: "CONFIRM", organizerId, reasonCode: null, createdAt: NOW }),
    ]);
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("refuse sans libérer les places et envoie l'avis dans la langue de la réservation", async () => {
    const reservation = await createReservation("TO_VERIFY", { language: "EN" });
    const seatsBefore = await sumTakenSeats();

    const result = await decideReservation(
      { reservationId: reservation.id, decision: "refuse", reasonCode: "INCOMPLETE_AMOUNT" },
      { organizerId, now: NOW },
    );

    expect(result).toEqual({ id: reservation.id, status: "PENDING_PAYMENT", emailSent: true });
    expect(await sumTakenSeats()).toBe(seatsBefore);
    expect(await readDecisions(reservation.id)).toEqual([
      expect.objectContaining({ type: "REFUSE", reasonCode: "INCOMPLETE_AMOUNT" }),
    ]);
    const [message] = vi.mocked(sendEmail).mock.calls[0];
    expect(message.text).toContain("Incomplete amount");
    expect(message.text).toContain(`https://diner.example.test/en/r/${reservation.token}`);
  });

  it("annule une réservation à vérifier sans courriel et libère ses places", async () => {
    const reservation = await createReservation("TO_VERIFY");

    const result = await decideReservation(
      { reservationId: reservation.id, decision: "cancel", reasonCode: "NO_TRANSFER" },
      { organizerId, now: NOW },
    );

    expect(result).toEqual({ id: reservation.id, status: "CANCELLED", emailSent: null });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await sumTakenSeats()).toBe(0);
    expect(await readDecisions(reservation.id)).toEqual([
      expect.objectContaining({ type: "CANCEL", reasonCode: null }),
    ]);
  });

  it.each([
    ["confirm", "PENDING_PAYMENT"],
    ["confirm", "CANCELLED"],
    ["refuse", "CONFIRMED"],
    ["refuse", "PENDING_PAYMENT"],
    ["cancel", "CONFIRMED"],
    ["cancel", "CANCELLED"],
  ])("refuse « %s » depuis %s avec une 409, sans rien écrire", async (decision, status) => {
    const reservation = await createReservation(
      /** @type {"PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED"} */ (status),
    );

    await expect(
      decideReservation(
        { reservationId: reservation.id, decision, reasonCode: "NO_TRANSFER" },
        { organizerId, now: NOW },
      ),
    ).rejects.toMatchObject({ statusCode: 409, code: "RESERVATION_STATUS_CHANGED" });
    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(stored.status).toBe(status);
    expect(await readDecisions(reservation.id)).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("n'applique qu'une seule de deux confirmations simultanées", async () => {
    const reservation = await createReservation("TO_VERIFY");
    const decide = () =>
      decideReservation(
        { reservationId: reservation.id, decision: "confirm" },
        { organizerId, now: NOW },
      );

    const results = await Promise.allSettled([decide(), decide()]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const [rejected] = results.filter((result) => result.status === "rejected");
    expect(rejected).toMatchObject({ reason: { statusCode: 409 } });
    expect(await readDecisions(reservation.id)).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("garde la décision quand SMTP refuse, et ne journalise que l'identifiant", async () => {
    const reservation = await createReservation("TO_VERIFY");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendEmail).mockRejectedValue(new Error(`panne ${reservation.token}`));

    const result = await decideReservation(
      { reservationId: reservation.id, decision: "confirm" },
      { organizerId, now: NOW },
    );

    expect(result.emailSent).toBe(false);
    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(stored.status).toBe("CONFIRMED");
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      level: "error",
      message: "reservation_confirmation_failed",
      reservationId: reservation.id,
      time: expect.any(String),
    });
    // L'échec est gardé en base : la fiche le signale tant qu'il n'est pas traité.
    expect(await getPrisma().emailFailure.findMany()).toEqual([
      expect.objectContaining({
        reservationId: reservation.id,
        kind: "CONFIRMATION",
        resolvedAt: null,
      }),
    ]);
  });

  it("répond 404 pour une réservation inconnue et 400 pour un refus sans motif", async () => {
    await expect(
      decideReservation(
        { reservationId: "inconnue", decision: "confirm" },
        { organizerId, now: NOW },
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: "RESERVATION_NOT_FOUND" });

    const reservation = await createReservation("TO_VERIFY");
    await expect(
      decideReservation(
        { reservationId: reservation.id, decision: "refuse" },
        { organizerId, now: NOW },
      ),
    ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
    expect(await readDecisions(reservation.id)).toEqual([]);
  });
});
