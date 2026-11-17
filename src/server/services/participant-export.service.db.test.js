// Export CSV sur la base Neon `test` (.env.test). Données fictives.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { buildConfirmedParticipantsExport } from "./participant-export.service.js";

/**
 * @param {string} code
 * @param {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 * @param {Date | null} [confirmedAt]
 */
function createReservation(code, status, confirmedAt = null) {
  return getPrisma().reservation.create({
    data: {
      code,
      token: `jeton-${code}`.padEnd(43, "x"),
      status,
      firstName: "Fictif",
      lastName: code,
      email: "fictif@example.test",
      phone: "6135550100",
      seats: 2,
      language: "FR",
      unitPriceCents: 3000,
      amountCents: 6000,
      interacEmail: "paiements@example.test",
      confirmedAt,
    },
  });
}

beforeEach(async () => {
  await resetTestDatabase();
});
afterAll(async () => disconnectPrisma());

describe("export des confirmés sur la base", () => {
  it("ne contient que les réservations confirmées, pas celles annulées après confirmation", async () => {
    const confirmedAt = new Date("2026-11-20T15:00:00.000Z");
    await createReservation("NOEL-0001", "CONFIRMED", confirmedAt);
    await createReservation("NOEL-0002", "CANCELLED", confirmedAt);
    await createReservation("NOEL-0003", "TO_VERIFY");
    await createReservation("NOEL-0004", "PENDING_PAYMENT");

    const result = await buildConfirmedParticipantsExport({ now: new Date() });

    expect(result.count).toBe(1);
    expect(result.content).toContain('"NOEL-0001"');
    expect(result.content).not.toMatch(/NOEL-0002|NOEL-0003|NOEL-0004/);
  });
});
