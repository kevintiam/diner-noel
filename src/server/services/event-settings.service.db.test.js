// Paramètres de l'événement et état des comptes sur la base Neon `test` (.env.test). Données fictives.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { getAccountingSummary } from "./accounting.service.js";
import { getEventSettings, updateEventSettings } from "./event-settings.service.js";

/**
 * Crée une réservation fictive.
 * @param {string} code
 * @param {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 * @param {{ seats?: number, amountCents?: number, confirmedAt?: Date }} [values]
 */
async function createReservation(
  code,
  status,
  { seats = 2, amountCents = 6000, confirmedAt } = {},
) {
  return getPrisma().reservation.create({
    data: {
      code,
      token: `jeton-${code}`.padEnd(43, "x"),
      status,
      firstName: "Fictif",
      lastName: "Exemple",
      email: "fictif@example.test",
      phone: "6135550100",
      seats,
      language: "FR",
      unitPriceCents: 3000,
      amountCents,
      interacEmail: "ancienne@example.test",
      confirmedAt,
    },
  });
}

beforeEach(async () => {
  await resetTestDatabase();
  await seedDefaultEvent();
});
afterAll(async () => disconnectPrisma());

describe("paramètres de l'événement sur la base", () => {
  it("modifie l'événement sans toucher aux réservations existantes", async () => {
    const reservation = await createReservation("NOEL-0001", "PENDING_PAYMENT", { seats: 3 });
    const { values } = await getEventSettings();

    await updateEventSettings({
      ...values,
      startsAtDate: "2026-12-20",
      capacity: "3",
      unitPrice: "40",
      interacEmail: "nouvelle@example.test",
      autoDepositConfirmed: true,
    });

    const event = await getPrisma().event.findFirstOrThrow();
    expect(event).toMatchObject({
      startsAt: new Date("2026-12-20T23:00:00.000Z"),
      capacity: 3,
      unitPriceCents: 4000,
      interacEmail: "nouvelle@example.test",
      alertSentAt: null,
    });
    const stored = await getPrisma().reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(stored).toMatchObject({ unitPriceCents: 3000, interacEmail: "ancienne@example.test" });
  });

  it("refuse de descendre sous les places prises, annulations exclues", async () => {
    await createReservation("NOEL-0001", "TO_VERIFY", { seats: 3 });
    await createReservation("NOEL-0002", "CANCELLED", { seats: 5 });
    const { values, takenSeats } = await getEventSettings();
    expect(takenSeats).toBe(3);

    await expect(updateEventSettings({ ...values, capacity: "2" })).rejects.toMatchObject({
      statusCode: 400,
      details: [{ field: "capacity" }],
    });
    expect((await getPrisma().event.findFirstOrThrow()).capacity).toBe(120);
  });
});

describe("état des comptes sur la base", () => {
  it("compte comme encaissées les réservations confirmées, même annulées depuis", async () => {
    const confirmedAt = new Date("2026-11-20T15:00:00.000Z");
    await createReservation("NOEL-0001", "CONFIRMED", { amountCents: 6000, confirmedAt });
    await createReservation("NOEL-0002", "CANCELLED", { amountCents: 3000, confirmedAt });
    await createReservation("NOEL-0003", "CANCELLED", { amountCents: 2000 });
    await createReservation("NOEL-0004", "PENDING_PAYMENT", { amountCents: 1000 });
    await createReservation("NOEL-0005", "TO_VERIFY", { amountCents: 500 });

    await expect(getAccountingSummary()).resolves.toEqual({
      collectedCents: 9000,
      pendingCents: 1500,
    });
  });
});
