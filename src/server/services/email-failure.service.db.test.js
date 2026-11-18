// Échecs de courriel sur la base Neon `test` (fichier .env.test). Données fictives.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import {
  listOpenEmailFailures,
  recordEmailFailure,
  resolveEmailFailures,
} from "./email-failure.service.js";

const EARLIER = new Date("2026-11-20T15:00:00.000Z");
const LATER = new Date("2026-11-20T16:00:00.000Z");
const RESOLVED_AT = new Date("2026-11-21T09:00:00.000Z");

/**
 * Crée une réservation fictive.
 * @param {string} code
 */
async function createReservation(code) {
  return getPrisma().reservation.create({
    data: {
      code,
      token: `jeton-${code}`.padEnd(43, "x"),
      firstName: "Fictif",
      lastName: code,
      email: "fictif@example.test",
      phone: "6135550100",
      seats: 2,
      language: "FR",
      unitPriceCents: 3000,
      amountCents: 6000,
      interacEmail: "paiements@example.test",
    },
  });
}

/** @type {string} */
let organizerId;

beforeEach(async () => {
  await resetTestDatabase();
  await seedDefaultEvent();
  const organizer = await getPrisma().organizer.create({
    data: { email: "orga@example.test", name: "Organisateur fictif", passwordHash: "empreinte" },
  });
  organizerId = organizer.id;
});
afterAll(async () => disconnectPrisma());

describe("échecs de courriel sur la base", () => {
  it("liste les échecs ouverts, du plus récent, avec leur réservation", async () => {
    const first = await createReservation("NOEL-0001");
    const second = await createReservation("NOEL-0002");
    await recordEmailFailure({ reservationId: first.id, kind: "RECEIPT", now: EARLIER });
    await recordEmailFailure({ reservationId: second.id, kind: "REFUSAL", now: LATER });

    const failures = await listOpenEmailFailures();

    expect(failures).toEqual([
      {
        id: expect.any(String),
        kind: "REFUSAL",
        createdAt: LATER,
        reservation: {
          id: second.id,
          code: "NOEL-0002",
          firstName: "Fictif",
          lastName: "NOEL-0002",
        },
      },
      {
        id: expect.any(String),
        kind: "RECEIPT",
        createdAt: EARLIER,
        reservation: {
          id: first.id,
          code: "NOEL-0001",
          firstName: "Fictif",
          lastName: "NOEL-0001",
        },
      },
    ]);
  });

  it("traite les seuls échecs de la réservation, sans les effacer", async () => {
    const reservation = await createReservation("NOEL-0001");
    const other = await createReservation("NOEL-0002");
    await recordEmailFailure({ reservationId: reservation.id, kind: "RECEIPT", now: EARLIER });
    await recordEmailFailure({ reservationId: reservation.id, kind: "CONFIRMATION", now: LATER });
    await recordEmailFailure({ reservationId: other.id, kind: "RECEIPT", now: LATER });

    const result = await resolveEmailFailures(
      { reservationId: reservation.id },
      { organizerId, now: RESOLVED_AT },
    );

    expect(result).toEqual({ reservationId: reservation.id, resolvedCount: 2 });
    const open = await listOpenEmailFailures();
    expect(open.map((failure) => failure.reservation.code)).toEqual(["NOEL-0002"]);
    const stored = await getPrisma().emailFailure.findMany({
      where: { reservationId: reservation.id },
    });
    expect(stored).toHaveLength(2);
    for (const failure of stored) {
      expect(failure).toMatchObject({ resolvedAt: RESOLVED_AT, resolvedById: organizerId });
    }
  });

  it("ne traite rien une seconde fois et garde le premier organisateur", async () => {
    const reservation = await createReservation("NOEL-0001");
    await recordEmailFailure({ reservationId: reservation.id, kind: "RECEIPT", now: EARLIER });
    await resolveEmailFailures(
      { reservationId: reservation.id },
      { organizerId, now: RESOLVED_AT },
    );

    const again = await resolveEmailFailures(
      { reservationId: reservation.id },
      { organizerId, now: LATER },
    );

    expect(again.resolvedCount).toBe(0);
    const [stored] = await getPrisma().emailFailure.findMany();
    expect(stored.resolvedAt).toEqual(RESOLVED_AT);
  });

  it("disparaît avec sa réservation, sans bloquer sa suppression", async () => {
    const reservation = await createReservation("NOEL-0001");
    await recordEmailFailure({ reservationId: reservation.id, kind: "RECEIPT", now: EARLIER });

    await getPrisma().reservation.delete({ where: { id: reservation.id } });

    expect(await getPrisma().emailFailure.count()).toBe(0);
  });
});
