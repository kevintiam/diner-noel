// Parcours de connexion des organisateurs (story 2.1), sur la base Neon `test`. Compte fictif.
import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";

const ACCOUNT = {
  email: "orga@example.test",
  name: "Organisateur fictif",
  password: "Sapin-Fictif-2026",
};
const LOGIN_URL = /\/admin\/login$/;
const DASHBOARD_URL = /\/admin$/;
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 1000 },
];

test.beforeAll(async () => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
  await createOrganizerAccount(ACCOUNT);
});

// Chaque parcours repart avec un compteur de tentatives vide.
test.afterEach(async () => {
  await getPrisma().rateLimit.deleteMany();
});

test.afterAll(async () => {
  await getPrisma().reservationDecision.deleteMany();
  await getPrisma().reservation.deleteMany();
  await getPrisma().organizer.deleteMany();
  await disconnectPrisma();
});

/**
 * Message d'erreur du formulaire (Next ajoute aussi sa propre zone « alert » à la page).
 * @param {import("@playwright/test").Page} page
 */
function formAlert(page) {
  return page.locator("form").getByRole("alert");
}

/**
 * Remplit et envoie le formulaire de connexion.
 * @param {import("@playwright/test").Page} page
 * @param {string} password
 */
async function logIn(page, password) {
  await page.getByLabel("Courriel").fill(ACCOUNT.email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe("tableau de bord des organisateurs", () => {
  test("renvoie vers la connexion sans session", async ({ page }) => {
    await page.goto("/admin/reservations");

    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByRole("heading", { name: "Espace organisateurs" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("refuse un mauvais mot de passe et garde le courriel", async ({ page }) => {
    await page.goto("/admin/login");

    await logIn(page, "mot-de-passe-faux");

    await expect(formAlert(page)).toHaveText("Courriel ou mot de passe invalide.");
    await expect(page.getByLabel("Courriel")).toHaveValue(ACCOUNT.email);
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test("n'accepte aucun identifiant par défaut", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("Courriel").fill("admin@dinner.test");
    await page.getByLabel("Mot de passe").fill("ChangeMe123!");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(formAlert(page)).toHaveText("Courriel ou mot de passe invalide.");
  });

  test("bloque la sixième tentative, même avec le bon mot de passe", async ({ page }) => {
    await page.goto("/admin/login");
    for (let i = 0; i < 5; i += 1) {
      await logIn(page, `faux-${i}`);
      await expect(formAlert(page)).toHaveText("Courriel ou mot de passe invalide.");
    }

    await logIn(page, ACCOUNT.password);

    await expect(formAlert(page)).toHaveText(
      "Trop de tentatives. Réessayez dans quelques minutes.",
    );
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test("connecte, montre les réservations puis déconnecte", async ({ page }) => {
    await page.goto("/admin/login");

    await logIn(page, ACCOUNT.password);

    await expect(page).toHaveURL(DASHBOARD_URL);
    await expect(page.getByRole("heading", { level: 1, name: "Vue d’ensemble" })).toBeVisible();
    await expect(page.getByText(`Connecté : ${ACCOUNT.name}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Vue d’ensemble" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(LOGIN_URL);
    await page.goto("/admin");
    await expect(page).toHaveURL(LOGIN_URL);
  });

  for (const viewport of VIEWPORTS) {
    test(`présente la liste et la fiche à ${viewport.width} px`, async ({ page }, testInfo) => {
      const event = await getPrisma().event.findFirstOrThrow();
      const reservation = await getPrisma().reservation.create({
        data: {
          code: `NOEL-${String(viewport.width).padStart(4, "0").slice(-4)}`,
          token: `jeton-fictif-${viewport.width}`.padEnd(43, "x"),
          status: "TO_VERIFY",
          firstName: "Prénom",
          lastName: "Fictif",
          email: "fictif@example.test",
          phone: "613 555-0100",
          seats: 3,
          childSeats: 1,
          language: "FR",
          unitPriceCents: 3000,
          amountCents: 6000,
          interacEmail: event.interacEmail,
        },
      });
      await page.setViewportSize(viewport);
      await page.goto("/admin/login");
      await logIn(page, ACCOUNT.password);
      await expect(page).toHaveURL(DASHBOARD_URL);
      await page.screenshot({
        path: testInfo.outputPath(`admin-dashboard-${viewport.width}.png`),
        fullPage: true,
      });

      await page.getByRole("link", { name: reservation.code }).click();

      await expect(page.getByRole("heading", { level: 1, name: reservation.code })).toBeVisible();
      await expect(page.getByText("3 places dont 1 enfant")).toBeVisible();
      await expect(page.getByRole("button", { name: "Confirmer le paiement" })).toBeVisible();
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`admin-reservation-${viewport.width}.png`),
        fullPage: true,
      });
      await getPrisma().reservation.delete({ where: { id: reservation.id } });
    });
  }

  test("confirme un paiement, puis refuse une autre preuve avec un motif", async ({ page }) => {
    const event = await getPrisma().event.findFirstOrThrow();
    /** @param {string} code */
    const createToVerify = (code) =>
      getPrisma().reservation.create({
        data: {
          code,
          token: `jeton-fictif-${code}`.padEnd(43, "x"),
          status: "TO_VERIFY",
          firstName: "Prénom",
          lastName: "Fictif",
          email: "fictif@example.test",
          phone: "613 555-0100",
          seats: 2,
          childSeats: 0,
          language: "FR",
          unitPriceCents: 3000,
          amountCents: 6000,
          interacEmail: event.interacEmail,
        },
      });
    const toConfirm = await createToVerify("NOEL-7001");
    const toRefuse = await createToVerify("NOEL-7002");
    await page.goto("/admin/login");
    await logIn(page, ACCOUNT.password);
    await expect(page).toHaveURL(DASHBOARD_URL);

    // Le SMTP est neutralisé dans les tests : la décision reste, la fiche signale le courriel.
    await page.goto(`/admin/reservations/${toConfirm.id}`);
    await page.getByRole("button", { name: "Confirmer le paiement" }).click();
    await expect(page).toHaveURL(/courriel=non-envoye/);
    await expect(page.getByText(/le courriel n’a pas pu être envoyé/)).toBeVisible();
    await expect(page.getByText("Paiement confirmé")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmer le paiement" })).toHaveCount(0);

    await page.goto(`/admin/reservations/${toRefuse.id}`);
    await page.getByLabel("Motif du refus").selectOption("INCOMPLETE_AMOUNT");
    await page.getByRole("button", { name: "Refuser le paiement" }).click();
    await expect(page).toHaveURL(/courriel=non-envoye/);
    await expect(page.getByText(/Montant incomplet/)).toBeVisible();
    await expect(page.getByText(/rien à confirmer pour l’instant/)).toBeVisible();

    const refused = await getPrisma().reservation.findUniqueOrThrow({ where: { id: toRefuse.id } });
    expect(refused.status).toBe("PENDING_PAYMENT");
  });

  test("présente la page de connexion", async ({ page }, testInfo) => {
    await page.goto("/admin/login");

    await expect(page.getByRole("heading", { name: "Espace organisateurs" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("admin-login.png"), fullPage: true });
  });
});
