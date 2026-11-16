// Test sur la base Neon `test` (fichier .env.test). Données fictives uniquement.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "./prisma-client.js";
import { sumTakenSeats } from "./reservation.repository.js";
import { resetTestDatabase } from "./reset-test-database.js";

let reservationNumber = 0;

/**
 * Crée une réservation fictive.
 * @param {number} seats
 * @param {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} status
 */
async function createReservation(seats, status) {
  reservationNumber += 1;
  await getPrisma().reservation.create({
    data: {
      code: `TEST-${reservationNumber}`,
      token: `jeton-fictif-${reservationNumber}`,
      status,
      firstName: "Prénom",
      lastName: "Fictif",
      email: `fictif${reservationNumber}@example.test`,
      phone: "613 555-0100",
      seats,
      language: "FR",
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

describe("sumTakenSeats", () => {
  it("renvoie 0 quand il n'y a aucune réservation", async () => {
    expect(await sumTakenSeats()).toBe(0);
  });

  it("compte les réservations de tous les statuts sauf annulé", async () => {
    // Préparer
    await createReservation(2, "PENDING_PAYMENT");
    await createReservation(3, "TO_VERIFY");
    await createReservation(1, "CONFIRMED");
    await createReservation(4, "CANCELLED");

    // Agir
    const takenSeats = await sumTakenSeats();

    // Vérifier
    expect(takenSeats).toBe(6);
  });

  it("fonctionne aussi dans une transaction", async () => {
    await createReservation(5, "CONFIRMED");

    const takenSeats = await getPrisma().$transaction((transaction) => sumTakenSeats(transaction));

    expect(takenSeats).toBe(5);
  });
});
