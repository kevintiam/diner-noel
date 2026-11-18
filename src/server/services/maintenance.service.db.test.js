import { afterAll, beforeEach, expect, it } from "vitest";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { maintainTechnicalData } from "./maintenance.service.js";

beforeEach(resetTestDatabase);
afterAll(disconnectPrisma);

it("purge les bornes expirées et conserve les sessions actives et données métier", async () => {
  const db = getPrisma();
  const now = new Date("2026-11-20T12:00:00Z");
  const cutoff = new Date("2026-11-19T11:45:00Z");
  const organizer = await db.organizer.create({
    data: {
      email: "maintenance@example.test",
      name: "Organisateur fictif",
      passwordHash: "fictif",
    },
  });
  await db.session.createMany({
    data: [
      { organizerId: organizer.id, tokenHash: "expirée", expiresAt: now },
      { organizerId: organizer.id, tokenHash: "ancienne", expiresAt: new Date(now.getTime() - 1) },
      { organizerId: organizer.id, tokenHash: "active", expiresAt: new Date(now.getTime() + 1) },
    ],
  });
  await db.rateLimit.createMany({
    data: [
      { key: "ancienne", windowStart: cutoff, count: 20 },
      { key: "récente", windowStart: new Date(cutoff.getTime() + 1), count: 20 },
      { key: "active", windowStart: now, count: 20 },
    ],
  });
  const reservation = await db.reservation.create({
    data: {
      code: "NOEL-9090",
      token: "m".repeat(43),
      firstName: "Fictif",
      lastName: "Exemple",
      email: "maintenance-participant@example.test",
      phone: "6135550100",
      seats: 1,
      language: "FR",
      unitPriceCents: 3000,
      amountCents: 3000,
      interacEmail: "paiement@example.test",
      proofs: { create: { data: new Uint8Array([1, 2, 3]), mimeType: "image/webp", byteSize: 3 } },
      decisions: {
        create: { type: "REFUSE", reasonCode: "INCOMPLETE_AMOUNT", organizerId: organizer.id },
      },
    },
  });
  await expect(maintainTechnicalData(now)).resolves.toEqual({ sessions: 2, rateLimits: 1 });
  expect((await db.session.findMany()).map((row) => row.tokenHash)).toEqual(["active"]);
  expect((await db.rateLimit.findMany()).map((row) => row.key).sort()).toEqual([
    "active",
    "récente",
  ]);
  expect(await db.reservation.findUnique({ where: { id: reservation.id } })).not.toBeNull();
  expect(await db.proof.count()).toBe(1);
  expect(await db.reservationDecision.count()).toBe(1);
  await expect(maintainTechnicalData(now)).resolves.toEqual({ sessions: 0, rateLimits: 0 });
});
