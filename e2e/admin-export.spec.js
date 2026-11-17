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
  await page.goto("/admin/login");
  await page.getByLabel("Courriel").fill(ACCOUNT.email);
  await page.getByLabel("Mot de passe").fill(ACCOUNT.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("link", { name: "Réservations", exact: true }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exporter les confirmés (CSV)" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^participants-confirmes-\d{4}-\d{2}-\d{2}\.csv$/);
  const content = await readFile(await download.path(), "utf8");
  expect(content.startsWith("\uFEFF")).toBe(true);
  expect(content).toContain('"Bélanger";"Noël";"NOEL-9001";"2";"1";"1"');
  expect(content).not.toContain("NOEL-9002");
});
