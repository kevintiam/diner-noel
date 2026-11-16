// Test sur la base Neon `test` (fichier .env.test). Données fictives uniquement.
import { randomInt } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { AppError } from "../errors/app-error.js";
import { createReservation, getReservationForPayment } from "./reservation.service.js";

vi.mock("node:crypto", async (importOriginal) => {
  const actual = /** @type {typeof import("node:crypto")} */ (await importOriginal());
  return { ...actual, randomInt: vi.fn(actual.randomInt) };
});

const randomInteger = vi.mocked(/** @type {(min: number, max: number) => number} */ (randomInt));

// Avant et après la date limite fictive du seed (12 décembre 2026, 23 h 59 à Ottawa).
const BEFORE_DEADLINE = new Date("2026-11-20T15:00:00.000Z");
const AFTER_DEADLINE = new Date("2026-12-13T05:00:00.000Z");
const CONCURRENT_REQUESTS = 20;

/** @param {Partial<import("../../validation/reservation.schema.js").ReservationInput>} [overrides] */
function buildInput(overrides = {}) {
  return {
    firstName: "Prénom",
    lastName: "Fictif",
    email: "fictif@example.test",
    phone: "613 555-0100",
    seats: 2,
    note: undefined,
    ...overrides,
  };
}

/** @param {number} capacity */
async function setCapacity(capacity) {
  await getPrisma().event.updateMany({ data: { capacity } });
}

beforeEach(async () => {
  randomInteger.mockReset();
  await resetTestDatabase();
  await seedDefaultEvent();
});

afterAll(async () => {
  await disconnectPrisma();
});

describe("createReservation", () => {
  it("crée une réservation en attente de paiement avec un montant et un Interac figés", async () => {
    // Agir
    const { code, token } = await createReservation(buildInput({ note: "Allergie" }), {
      lang: "en",
      now: BEFORE_DEADLINE,
    });

    // Vérifier
    expect(code).toMatch(/^NOEL-\d{4}$/);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const stored = await getPrisma().reservation.findUniqueOrThrow({ where: { token } });
    expect(stored).toMatchObject({
      status: "PENDING_PAYMENT",
      seats: 2,
      unitPriceCents: 2500,
      amountCents: 5000,
      interacEmail: "paiements@example.org",
      language: "EN",
      note: "Allergie",
    });
  });

  it("garde le prix de la création quand le prix de l'événement change ensuite", async () => {
    const { token } = await createReservation(buildInput(), { lang: "fr", now: BEFORE_DEADLINE });

    await getPrisma().event.updateMany({
      data: { unitPriceCents: 4000, interacEmail: "nouveau@example.test" },
    });

    expect(await getReservationForPayment(token)).toMatchObject({
      unitPriceCents: 2500,
      amountCents: 5000,
      interacEmail: "paiements@example.org",
    });
  });

  it("refuse à l'instant exact de la date limite", async () => {
    const deadline = (await getPrisma().event.findFirstOrThrow()).bookingDeadline;

    const attempt = createReservation(buildInput(), { lang: "fr", now: deadline });

    await expect(attempt).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_CLOSED" });
  });

  it("accepte une milliseconde avant la date limite", async () => {
    const deadline = (await getPrisma().event.findFirstOrThrow()).bookingDeadline;

    const created = await createReservation(buildInput(), {
      lang: "fr",
      now: new Date(deadline.getTime() - 1),
    });

    expect(created.code).toMatch(/^NOEL-\d{4}$/);
  });

  it("refuse après la date limite", async () => {
    const attempt = createReservation(buildInput(), { lang: "fr", now: AFTER_DEADLINE });

    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_CLOSED" });
  });

  it("refuse quand il ne reste pas assez de places, sans rien créer", async () => {
    await setCapacity(2);

    const attempt = createReservation(buildInput({ seats: 3 }), {
      lang: "fr",
      now: BEFORE_DEADLINE,
    });

    await expect(attempt).rejects.toMatchObject({ statusCode: 409, code: "NOT_ENOUGH_SEATS" });
    expect(await getPrisma().reservation.count()).toBe(0);
  });

  it("refuse quand le dîner est complet", async () => {
    await setCapacity(2);
    await createReservation(buildInput({ seats: 2 }), { lang: "fr", now: BEFORE_DEADLINE });

    const attempt = createReservation(buildInput({ seats: 1 }), {
      lang: "fr",
      now: BEFORE_DEADLINE,
    });

    await expect(attempt).rejects.toMatchObject({ statusCode: 409, code: "SOLD_OUT" });
  });

  it("ne vend jamais de place en trop quand 20 personnes réservent en même temps", async () => {
    // Préparer : 3 places libres
    await setCapacity(3);

    // Agir : 20 demandes d'une place, lancées ensemble
    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT_REQUESTS }, (_, index) =>
        createReservation(buildInput({ seats: 1, email: `fictif${index}@example.test` }), {
          lang: "fr",
          now: BEFORE_DEADLINE,
        }),
      ),
    );

    // Vérifier
    const accepted = results.filter((result) => result.status === "fulfilled");
    const refused = results.filter((result) => result.status === "rejected");
    expect(accepted).toHaveLength(3);
    for (const result of refused) {
      expect(result.reason).toMatchObject({ code: "SOLD_OUT" });
    }
    expect(await sumTakenSeats()).toBe(3);
    const codes = new Set(accepted.map((result) => result.value.code));
    expect(codes.size).toBe(3);
  }, 60_000);

  it("retire un code quand le premier tirage est déjà utilisé", async () => {
    randomInteger.mockReturnValueOnce(1234);
    await createReservation(buildInput({ seats: 1 }), { lang: "fr", now: BEFORE_DEADLINE });
    randomInteger.mockClear().mockReturnValueOnce(1234).mockReturnValueOnce(5678);

    const created = await createReservation(buildInput({ seats: 1 }), {
      lang: "fr",
      now: BEFORE_DEADLINE,
    });

    expect(created.code).toBe("NOEL-5678");
    expect(randomInteger).toHaveBeenCalledTimes(2);
    expect(await getPrisma().reservation.count()).toBe(2);
  });

  it("refuse vingt collisions sans insérer une réservation partielle", async () => {
    randomInteger.mockReturnValueOnce(1234);
    await createReservation(buildInput({ seats: 1 }), { lang: "fr", now: BEFORE_DEADLINE });
    randomInteger.mockClear().mockReturnValue(1234);

    await expect(
      createReservation(buildInput(), { lang: "fr", now: BEFORE_DEADLINE }),
    ).rejects.toMatchObject({ statusCode: 500, code: "RESERVATION_CODE_EXHAUSTED" });

    expect(randomInteger).toHaveBeenCalledTimes(20);
    expect(await getPrisma().reservation.count()).toBe(1);
    expect(await sumTakenSeats()).toBe(1);
  });
});

describe("getReservationForPayment", () => {
  it("renvoie ce que la page de paiement affiche", async () => {
    const { code, token } = await createReservation(buildInput(), {
      lang: "fr",
      now: BEFORE_DEADLINE,
    });

    expect(await getReservationForPayment(token)).toEqual({
      code,
      status: "PENDING_PAYMENT",
      seats: 2,
      unitPriceCents: 2500,
      amountCents: 5000,
      interacEmail: "paiements@example.org",
    });
  });

  it("renvoie null pour un lien bien formé mais inconnu", async () => {
    expect(await getReservationForPayment("A".repeat(43))).toBeNull();
  });

  it("renvoie null pour un lien mal formé, vide ou d'un mauvais type", async () => {
    expect(await getReservationForPayment("jeton-inconnu")).toBeNull();
    expect(await getReservationForPayment("")).toBeNull();
    expect(await getReservationForPayment(42)).toBeNull();
  });
});
