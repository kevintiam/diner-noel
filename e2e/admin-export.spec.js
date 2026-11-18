// Export CSV des participants confirmés, sur la base Neon `test`. Compte et données fictifs.
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";

const ACCOUNT = {
  email: "export@example.test",
  name: "Organisateur export",
  password: "Sapin-Fictif-Export",
};
const CODES = ["NOEL-9001", "NOEL-9002"];
const EXPORT_PATH = "/api/admin/exports/confirmed-participants";

/**
 * Attend la session et la navigation avant de demander un export privé.
 * @param {import('@playwright/test').Page} page Le navigateur organisateur.
 * @returns {Promise<void>} La liste prête à être consultée.
 */
async function openReservations(page) {
  await page.goto("/admin/login");
  await page.getByLabel("Courriel").fill(ACCOUNT.email);
  await page.getByLabel("Mot de passe").fill(ACCOUNT.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Réservations", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/reservations$/);
}

test.beforeAll(async () => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
  await createOrganizerAccount(ACCOUNT);
  const event = await getPrisma().event.findFirstOrThrow();
  for (const [index, code] of CODES.entries()) {
    await getPrisma().reservation.create({
      data: {
        code,
        token: `jeton-fictif-export-${index}`.padEnd(43, "x"),
        status: index === 0 ? "CONFIRMED" : "PENDING_PAYMENT",
        firstName: "Noël",
        lastName: index === 0 ? "Bélanger" : "Attente",
        email: "fictif@example.test",
        phone: "613 555-0100",
        seats: 2,
        childSeats: 1,
        language: "FR",
        unitPriceCents: 3000,
        amountCents: 3000,
        interacEmail: event.interacEmail,
        confirmedAt: index === 0 ? new Date() : null,
      },
    });
  }
});

test.afterAll(async () => {
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().reservation.deleteMany({ where: { code: { in: CODES } } });
  await getPrisma().organizer.deleteMany({ where: { email: ACCOUNT.email } });
  await disconnectPrisma();
});

test("refuse l'export sans session", async ({ page }) => {
  await page.goto("/api/admin/exports/confirmed-participants");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("télécharge les confirmés avec les accents", async ({ page }) => {
  await openReservations(page);

  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === EXPORT_PATH && response.request().method() === "GET",
  );
  // Le rejet reste géré si une réponse HTTP en erreur fait échouer l’assertion d’abord.
  const downloadPromise = page.waitForEvent("download").catch(() => null);
  await page.getByRole("link", { name: "Exporter les confirmés (CSV)" }).click();
  const response = await responsePromise;
  expect(response.status(), "L’export doit réussir avant tout téléchargement CSV").toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.headers()["content-disposition"]).toMatch(
    /^attachment; filename="participants-confirmes-\d{4}-\d{2}-\d{2}\.csv"$/,
  );
  const download = await downloadPromise;
  if (!download)
    throw new Error("Le serveur a répondu CSV mais le téléchargement n’a pas démarré.");

  expect(download.suggestedFilename()).toMatch(/^participants-confirmes-\d{4}-\d{2}-\d{2}\.csv$/);
  const content = await readFile(await download.path(), "utf8");
  expect(content.startsWith("\uFEFF")).toBe(true);
  expect(content).toContain('"Bélanger";"Noël";"NOEL-9001";"2";"1";"1"');
  expect(content).not.toContain("NOEL-9002");
});

for (const contentType of ["text/plain", "application/json"]) {
  test(`ne télécharge pas une erreur ${contentType} comme un faux CSV`, async ({ page }) => {
    await openReservations(page);
    const message = "Export indisponible pour ce test";
    await page.route(`**${EXPORT_PATH}`, (route) =>
      route.fulfill({
        status: 503,
        contentType,
        body:
          contentType === "application/json"
            ? JSON.stringify({ error: { code: "INTERNAL_ERROR", message } })
            : message,
      }),
    );
    const downloads = [];
    page.on("download", (download) => downloads.push(download));
    await page.getByRole("link", { name: "Exporter les confirmés (CSV)" }).click();
    await expect(page.locator("body")).toContainText(message);
    expect(downloads).toHaveLength(0);
  });
}

test("revient à la connexion si la session a expiré avant l’export", async ({ page }) => {
  await openReservations(page);
  await getPrisma().session.deleteMany({ where: { organizer: { email: ACCOUNT.email } } });
  const downloads = [];
  page.on("download", (download) => downloads.push(download));
  await page.getByRole("link", { name: "Exporter les confirmés (CSV)" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(downloads).toHaveLength(0);
});
