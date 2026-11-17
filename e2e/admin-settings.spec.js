// Écran Paramètres de l'événement (maquette 8), sur la base Neon `test`. Compte fictif.
import { expect, test } from "@playwright/test";
import { DEFAULT_EVENT, seedDefaultEvent } from "../prisma/default-event.js";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";

const ACCOUNT = {
  email: "parametres@example.test",
  name: "Organisateur paramètres",
  password: "Sapin-Fictif-Parametres",
};

test.beforeAll(async () => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
  await seedDefaultEvent();
  await createOrganizerAccount(ACCOUNT);
});

// Les autres parcours retrouvent l'événement de départ.
test.afterAll(async () => {
  await seedDefaultEvent();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().reservation.deleteMany({ where: { code: "NOEL-8001" } });
  await getPrisma().organizer.deleteMany({ where: { email: ACCOUNT.email } });
  await disconnectPrisma();
});

test("modifie les paramètres en respectant les places prises", async ({ page }) => {
  const event = await getPrisma().event.findFirstOrThrow();
  await getPrisma().reservation.create({
    data: {
      code: "NOEL-8001",
      token: "jeton-fictif-parametres".padEnd(43, "x"),
      status: "TO_VERIFY",
      firstName: "Prénom",
      lastName: "Fictif",
      email: "fictif@example.test",
      phone: "613 555-0100",
      seats: 4,
      childSeats: 0,
      language: "FR",
      unitPriceCents: 3000,
      amountCents: 12000,
      interacEmail: event.interacEmail,
    },
  });
  await page.goto("/admin/login");
  await page.getByLabel("Courriel").fill(ACCOUNT.email);
  await page.getByLabel("Mot de passe").fill(ACCOUNT.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("link", { name: "Paramètres" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Paramètres de l’événement");
  await expect(page.getByLabel("Nombre de places")).toHaveValue(String(DEFAULT_EVENT.capacity));
  await expect(page.getByText("Minimum 4 : places déjà prises", { exact: false })).toBeVisible();

  // Sans la vérification du navigateur, le serveur refuse lui-même.
  const settingsForm = page.locator("form", { hasText: "Date et lieu" });
  await settingsForm.evaluate((form) => {
    if (form instanceof HTMLFormElement) form.noValidate = true;
  });
  await page.getByLabel("Nombre de places").fill("3");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.locator("#capacity-error")).toHaveText(
    "Le nombre de places ne peut pas descendre sous les places déjà prises.",
  );

  await page.getByLabel("Nombre de places").fill("150");
  await page.getByLabel("Prix d’une place, 15 ans et plus ($)").fill("40");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();
  await expect(page.getByLabel("Nombre de places")).toHaveValue("150");

  const saved = await getPrisma().event.findFirstOrThrow();
  expect(saved).toMatchObject({ capacity: 150, unitPriceCents: 4000 });
  const reservation = await getPrisma().reservation.findUniqueOrThrow({
    where: { code: "NOEL-8001" },
  });
  expect(reservation.unitPriceCents).toBe(3000);
});
