// Vérification sur la seule base dédiée aux tests, avec des données fictives.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { createReservation, getReservationForPayment } from "./reservation.service.js";
import { getEventOverview } from "./event.service.js";

const INPUT = {
  firstName: "Prénom",
  lastName: "Fictif",
  email: "fictif@example.test",
  phone: "613 555-0100",
  adultSeats: 2,
  childSeats: 2,
};
const PROMOTION_NOW = new Date("2026-11-20T05:00:00Z");
beforeEach(async () => {
  await resetTestDatabase();
  await seedDefaultEvent();
});
afterAll(disconnectPrisma);

describe("tarifs et effectifs dans la transaction", () => {
  it.each([
    ["2026-11-20T04:59:59.999Z", 3500, 7000],
    ["2026-11-20T05:00:00Z", 3000, 6000],
    ["2026-12-04T05:00:00Z", 3500, 7000],
  ])("facture seulement les personnes payantes à %s", async (date, price, amount) => {
    const now = new Date(date);
    const { token } = await createReservation(INPUT, { lang: "fr", now });
    expect(await getReservationForPayment(token)).toMatchObject({
      seats: 4,
      childSeats: 2,
      unitPriceCents: price,
      amountCents: amount,
      status: "PENDING_PAYMENT",
    });
    expect((await getEventOverview(now)).unitPriceCents).toBe(price);
    expect(await sumTakenSeats()).toBe(4);
  });

  it("confirme immédiatement deux enfants gratuits et les décompte", async () => {
    const { token } = await createReservation(
      { ...INPUT, adultSeats: 0 },
      { lang: "en", now: PROMOTION_NOW },
    );
    expect(await getPrisma().reservation.findUniqueOrThrow({ where: { token } })).toMatchObject({
      amountCents: 0,
      seats: 2,
      childSeats: 2,
      status: "CONFIRMED",
      confirmedAt: PROMOTION_NOW,
    });
    expect(await sumTakenSeats()).toBe(2);
  });

  it("conserve le montant et le prix après la fin de promotion", async () => {
    const { token } = await createReservation(INPUT, { lang: "fr", now: PROMOTION_NOW });
    await getPrisma().event.updateMany({
      data: {
        unitPriceCents: 9900,
        promotionalUnitPriceCents: null,
        promotionStartsAt: null,
        promotionEndsAt: null,
      },
    });
    expect(await getReservationForPayment(token)).toMatchObject({
      unitPriceCents: 3000,
      amountCents: 6000,
    });
  });

  it.each([
    { adultSeats: 0, childSeats: 0 },
    { adultSeats: -1 },
    { childSeats: 0.5 },
    { childSeats: null },
    { adultSeats: 9, childSeats: 2 },
  ])("refuse les effectifs invalides sans insertion : %s", async (counts) => {
    await expect(
      createReservation({ ...INPUT, ...counts }, { lang: "fr", now: PROMOTION_NOW }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(await getPrisma().reservation.count()).toBe(0);
  });

  it("refuse une réservation mixte si le total dépasse la capacité", async () => {
    await getPrisma().event.updateMany({ data: { capacity: 3 } });
    await expect(
      createReservation(INPUT, { lang: "fr", now: PROMOTION_NOW }),
    ).rejects.toMatchObject({ code: "NOT_ENOUGH_SEATS" });
    expect(await getPrisma().reservation.count()).toBe(0);
  });

  it("ne dépasse pas la capacité lors de réservations gratuites concurrentes", async () => {
    await getPrisma().event.updateMany({ data: { capacity: 3 } });
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        createReservation(
          { ...INPUT, adultSeats: 0, childSeats: 1 },
          { lang: "fr", now: PROMOTION_NOW },
        ),
      ),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    expect(await sumTakenSeats()).toBe(3);
  }, 60000);
});
