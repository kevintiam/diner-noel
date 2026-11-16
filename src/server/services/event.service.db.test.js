// Test sur la base Neon `test` (fichier .env.test). Données fictives uniquement.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { AppError } from "../errors/app-error.js";
import { getEventOverview } from "./event.service.js";

/**
 * Crée une réservation fictive.
 * @param {string} code
 * @param {number} seats
 * @param {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 */
async function createReservation(code, seats, status) {
  await getPrisma().reservation.create({
    data: {
      code,
      token: `jeton-${code}`,
      status,
      firstName: "Prénom",
      lastName: "Fictif",
      email: `${code.toLowerCase()}@example.test`,
      phone: "613 555-0100",
      seats,
      language: "EN",
      unitPriceCents: 2500,
      amountCents: seats * 2500,
      interacEmail: "paiements@example.org",
    },
  });
}

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await disconnectPrisma();
});

// Avant et après la date limite fictive du seed (12 décembre 2026, 23 h 59 à Ottawa).
const BEFORE_DEADLINE = new Date("2026-11-20T15:00:00.000Z");
const AFTER_DEADLINE = new Date("2026-12-13T05:00:00.000Z");

describe("getEventOverview", () => {
  it("renvoie l'événement de départ avec toutes ses places libres et les réservations ouvertes", async () => {
    await seedDefaultEvent();

    const overview = await getEventOverview(BEFORE_DEADLINE);

    expect(overview).toMatchObject({
      capacity: 120,
      unitPriceCents: 2500,
      seatsLeft: 120,
      isClosedByDeadline: false,
      isBookingOpen: true,
    });
    expect(overview.startsAt.toISOString()).toBe("2026-12-19T23:00:00.000Z");
  });

  it("ferme les réservations une fois la date limite passée", async () => {
    await seedDefaultEvent();

    const overview = await getEventOverview(AFTER_DEADLINE);

    expect(overview).toMatchObject({ isClosedByDeadline: true, isBookingOpen: false });
  });

  it("ferme les réservations à l'instant exact de la date limite", async () => {
    await seedDefaultEvent();
    const deadline = (await getPrisma().event.findFirstOrThrow()).bookingDeadline;

    const atDeadline = await getEventOverview(deadline);
    const justBefore = await getEventOverview(new Date(deadline.getTime() - 1));

    expect(atDeadline).toMatchObject({ isClosedByDeadline: true, isBookingOpen: false });
    expect(justBefore).toMatchObject({ isClosedByDeadline: false, isBookingOpen: true });
  });

  it("retire les places prises, sauf celles des réservations annulées", async () => {
    await seedDefaultEvent();
    await createReservation("A-1", 2, "PENDING_PAYMENT");
    await createReservation("A-2", 3, "TO_VERIFY");
    await createReservation("A-3", 1, "CONFIRMED");
    await createReservation("A-4", 4, "CANCELLED");

    const overview = await getEventOverview(BEFORE_DEADLINE);

    expect(overview.seatsLeft).toBe(114);
  });

  it("indique zéro place quand l'événement est complet, jamais un nombre négatif", async () => {
    await seedDefaultEvent();
    await getPrisma().event.updateMany({ data: { capacity: 3 } });
    await createReservation("B-1", 3, "CONFIRMED");
    await createReservation("B-2", 2, "PENDING_PAYMENT");

    const overview = await getEventOverview(BEFORE_DEADLINE);

    expect(overview).toMatchObject({
      seatsLeft: 0,
      isBookingOpen: false,
      isClosedByDeadline: false,
    });
  });

  it("échoue avec EVENT_NOT_CONFIGURED quand aucun événement n'existe", async () => {
    const failure = getEventOverview(BEFORE_DEADLINE);

    await expect(failure).rejects.toBeInstanceOf(AppError);
    await expect(failure).rejects.toMatchObject({ statusCode: 500, code: "EVENT_NOT_CONFIGURED" });
  });

  it("ne crée jamais de second événement quand le seed est relancé", async () => {
    await seedDefaultEvent();
    const originalEvent = await getPrisma().event.findFirstOrThrow();
    await getPrisma().event.update({
      where: { id: originalEvent.id },
      data: {
        startsAt: new Date("2027-01-01T00:00:00Z"),
        bookingDeadline: new Date("2026-12-25T00:00:00Z"),
        capacity: 5,
        unitPriceCents: 100,
        venueName: "Autre salle fictive",
        venueAddress: "2 rue Fictive",
        interacEmail: "autre@example.test",
      },
    });

    await seedDefaultEvent();

    expect(await getPrisma().event.count()).toBe(1);
    expect(await getPrisma().event.findFirstOrThrow()).toMatchObject({
      id: originalEvent.id,
      startsAt: new Date("2026-12-19T23:00:00Z"),
      bookingDeadline: new Date("2026-12-13T04:59:00Z"),
      capacity: 120,
      unitPriceCents: 2500,
      venueName: "ICC Ottawa",
      venueAddress: "75 Auriga Drive, Nepean",
      interacEmail: "paiements@example.org",
    });
  });
});
