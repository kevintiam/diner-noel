// Parcours de réservation sur téléphone, sur la base Neon `test`. Données fictives.
import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";

const PAYMENT_URL = /\/(fr|en)\/r\/[A-Za-z0-9_-]{43}$/;

test.use({ locale: "fr-CA" });

test.beforeAll(() => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
});

// Chaque parcours repart sans réservation, pour que l'accueil garde « 120 places restantes ».
test.afterEach(async () => {
  await getPrisma().reservation.deleteMany();
});

test.afterAll(async () => {
  await disconnectPrisma();
});

/**
 * Remplit le formulaire avec des données fictives.
 * @param {import("@playwright/test").Page} page
 * @param {{ firstName: string, lastName: string, email: string, phone: string }} labels
 * @param {{ email?: string }} [overrides]
 */
async function fillForm(page, labels, overrides = {}) {
  await page.getByLabel(labels.firstName, { exact: true }).fill("Prénom");
  await page.getByLabel(labels.lastName, { exact: true }).fill("Fictif");
  await page
    .getByLabel(labels.email, { exact: true })
    .fill(overrides.email ?? "fictif@example.test");
  await page.getByLabel(labels.phone, { exact: true }).fill("613 555-0100");
}

const FRENCH_LABELS = {
  firstName: "Prénom",
  lastName: "Nom",
  email: "Courriel",
  phone: "Téléphone",
};

test("réserve 2 places en français depuis l'accueil jusqu'à la page de paiement", async ({
  page,
}, testInfo) => {
  await page.goto("/fr");
  await page.getByRole("link", { name: "Réserver ma place" }).first().click();
  await expect(page.getByText("Étape 1 sur 2")).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("reservation-mobile.png"), fullPage: true });

  await fillForm(page, FRENCH_LABELS);
  await page.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }).click();
  await page.getByLabel("Enfants de 0 à 14 ans").fill("2");
  await expect(page.getByText(/2 personnes de 15 ans et plus × 35,00\s\$/)).toBeVisible();
  await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

  await expect(page).toHaveURL(PAYMENT_URL);
  await expect(page.getByText("Étape 2 sur 2")).toBeVisible();
  await expect(page.getByText(/^70,00\s\$$/)).toBeVisible();
  await expect(page.getByText("paiements@example.org")).toBeVisible();
  await expect(page.getByText(/^NOEL-\d{4}$/)).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Aucun remboursement après le virement.", { exact: true }),
  ).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("payment-mobile.png"), fullPage: true });

  const stored = await getPrisma().reservation.findFirstOrThrow();
  expect(stored).toMatchObject({ seats: 4, childSeats: 2, amountCents: 7000, language: "FR" });
});

test("réserve en anglais et enregistre la langue de la page", async ({ page }) => {
  await page.goto("/en/reservation");

  await fillForm(page, {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
  });
  await page.getByRole("button", { name: "Continue to payment" }).click();

  await expect(page).toHaveURL(PAYMENT_URL);
  await expect(page.getByRole("heading", { name: "Pay by Interac e-Transfer" })).toBeVisible();
  await expect(page.getByText("$35.00").first()).toBeVisible();
  const stored = await getPrisma().reservation.findFirstOrThrow();
  expect(stored.language).toBe("EN");
});

test("affiche l'erreur d'un champ invalide et garde la saisie", async ({ page }) => {
  await page.goto("/fr/reservation");

  await fillForm(page, FRENCH_LABELS, { email: "fictif-sans-arobase" });
  await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

  await expect(page.getByText("Le courriel est invalide.")).toBeVisible();
  // Next ajoute sa propre zone role="alert" (annonceur de navigation) : on filtre sur le texte.
  await expect(
    page.getByRole("alert").filter({ hasText: "Certains champs sont à corriger." }),
  ).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "Certains champs sont à corriger." }),
  ).toBeFocused();
  await expect(
    page.getByRole("alert").filter({ hasText: "Certains champs sont à corriger." }),
  ).toBeInViewport();
  await expect(page.getByLabel("Prénom", { exact: true })).toHaveValue("Prénom");
  await expect(page.getByLabel("Courriel", { exact: true })).toHaveValue("fictif-sans-arobase");
  expect(await getPrisma().reservation.count()).toBe(0);
});

test("ne propose plus de réserver quand le dîner est complet", async ({ page }) => {
  const prisma = getPrisma();
  const event = await prisma.event.findFirstOrThrow();
  try {
    await prisma.event.update({ where: { id: event.id }, data: { capacity: 0 } });

    await page.goto("/fr");
    await expect(page.getByText("Le dîner est complet : il n'y a plus de place.")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Réserver ma place" })).toHaveCount(0);

    await page.goto("/fr/reservation");
    await expect(page.getByText("Le dîner est complet : il n'y a plus de place.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer vers le paiement" })).toHaveCount(0);
  } finally {
    await prisma.event.update({ where: { id: event.id }, data: { capacity: event.capacity } });
  }
});

test("affiche la page introuvable pour un lien personnel inconnu", async ({ page }) => {
  await page.goto(`/fr/r/${"x".repeat(43)}`);

  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});

test("plafonne le formulaire aux deux places encore libres dans la base", async ({ page }) => {
  const prisma = getPrisma();
  const event = await prisma.event.findFirstOrThrow();
  try {
    await prisma.event.update({ where: { id: event.id }, data: { capacity: 2 } });

    await page.goto("/fr/reservation");
    await page.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }).click();

    await expect(page.getByLabel("Personnes de 15 ans et plus")).toHaveValue("2");
    await expect(
      page.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }),
    ).toBeDisabled();
    await expect(page.getByLabel("Personnes de 15 ans et plus")).toHaveAttribute("max", "2");
  } finally {
    await prisma.event.update({ where: { id: event.id }, data: { capacity: event.capacity } });
  }
});
