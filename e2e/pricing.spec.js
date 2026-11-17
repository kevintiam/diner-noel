import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";

let originalEvent;
test.beforeAll(() => {
  if (getEnv().DATABASE_IS_TEST !== "true") throw new Error("Base de test obligatoire.");
});
test.beforeEach(async () => {
  originalEvent = await getPrisma().event.findFirstOrThrow();
});
test.afterEach(async () => {
  await getPrisma().reservation.deleteMany();
  await getPrisma().event.update({ where: { id: originalEvent.id }, data: originalEvent });
});
test.afterAll(disconnectPrisma);

/** @param {import("@playwright/test").Page} page */
async function fillContact(page) {
  await page.getByLabel("Prénom", { exact: true }).fill("Prénom");
  await page.getByLabel("Nom", { exact: true }).fill("Fictif");
  await page.getByLabel("Courriel", { exact: true }).fill("fictif@example.test");
  await page.getByLabel("Téléphone", { exact: true }).fill("613 555-0100");
}

for (const scenario of [
  { isPromotion: true, price: 3000, amount: "60,00" },
  { isPromotion: false, price: 3500, amount: "70,00" },
]) {
  test(`réserve deux personnes payantes et deux enfants au tarif ${scenario.price}`, async ({
    page,
  }) => {
    const now = Date.now();
    await getPrisma().event.updateMany({
      data: {
        promotionStartsAt: new Date(now - 60000),
        promotionEndsAt: new Date(now + (scenario.isPromotion ? 60000 : -1)),
      },
    });
    await page.goto("/fr/reservation");
    await fillContact(page);
    await page.getByLabel("Personnes de 15 ans et plus").fill("2");
    await page.getByLabel("Enfants de 0 à 14 ans").fill("2");
    await expect(page.getByText(new RegExp(scenario.amount + "\\s\\$")).first()).toBeVisible();
    await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
    await expect(page).toHaveURL(/\/fr\/r\/[A-Za-z0-9_-]{43}$/);
    await expect(page.getByRole("heading", { name: "Payez par virement Interac" })).toBeVisible();
    await expect(page.getByText(new RegExp(scenario.amount + "\\s\\$"))).toBeVisible();
    expect(await getPrisma().reservation.findFirstOrThrow()).toMatchObject({
      seats: 4,
      childSeats: 2,
      unitPriceCents: scenario.price,
      amountCents: scenario.price * 2,
    });
  });
}

test("confirme une réservation d'enfants sans virement", async ({ page }) => {
  await page.goto("/fr/reservation");
  await fillContact(page);
  await page.getByLabel("Personnes de 15 ans et plus").fill("0");
  await page.getByLabel("Enfants de 0 à 14 ans").fill("2");
  await page.getByRole("button", { name: "Confirmer la réservation gratuite" }).click();
  await expect(
    page.getByRole("heading", { name: "Votre réservation est confirmée" }),
  ).toBeVisible();
  await expect(page.getByText(/^NOEL-\d{4}$/)).toBeVisible();
  await expect(page.getByText("paiements@example.org")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copier" })).toHaveCount(0);
  expect(await getPrisma().reservation.findFirstOrThrow()).toMatchObject({
    seats: 2,
    childSeats: 2,
    status: "CONFIRMED",
    amountCents: 0,
  });
});
