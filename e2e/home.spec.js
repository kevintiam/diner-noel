import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { formatEventDateTime } from "../src/lib/format.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";

test.use({ locale: "fr-CA" });

/** @type {Date} */
let eventStartsAt;

test.beforeAll(async () => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
  eventStartsAt = (await getPrisma().event.findFirstOrThrow()).startsAt;
});

test.afterAll(async () => {
  await disconnectPrisma();
});

test.describe("accueil", () => {
  test("affiche le dîner en français avec les données de la base", async ({ page }) => {
    await page.goto("/fr");

    await expect(page.getByRole("heading", { level: 1, name: "Dîner de Noël 2026" })).toBeVisible();
    await expect(page.getByText(formatEventDateTime(eventStartsAt, "fr"))).toBeVisible();
    await expect(page.getByText(/25,00\s\$/)).toBeVisible();
    await expect(page.getByText("120 places restantes")).toBeVisible();
    await expect(page.getByText("ICC Ottawa", { exact: false }).last()).toBeVisible();
    await expect(page.getByText("75 Auriga Drive, Nepean")).toBeVisible();
    await expect(page.getByRole("link", { name: "Réserver ma place" })).toHaveAttribute(
      "href",
      "/fr/reservation",
    );
  });

  test("affiche le dîner en anglais", async ({ page }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { level: 1, name: "Christmas Dinner 2026" }),
    ).toBeVisible();
    await expect(page.getByText("$25.00")).toBeVisible();
    await expect(page.getByText(formatEventDateTime(eventStartsAt, "en"))).toBeVisible();
    await expect(page.getByText("120 seats left")).toBeVisible();
  });

  test("passe à l'anglais par le choix de langue", async ({ page }) => {
    await page.goto("/fr");

    await page.getByRole("link", { name: "English" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText("120 seats left")).toBeVisible();
  });
});

test.describe("données à jour et reprise", () => {
  test("relit les places après une modification de la base et un rechargement", async ({
    page,
  }) => {
    const prisma = getPrisma();
    const originalEvent = await prisma.event.findFirstOrThrow();
    try {
      await page.goto("/fr");
      await expect(page.getByText("120 places restantes")).toBeVisible();

      await prisma.event.update({ where: { id: originalEvent.id }, data: { capacity: 119 } });
      await page.reload();

      await expect(page.getByText("119 places restantes")).toBeVisible();
      await expect(page.getByText("120 places restantes")).toHaveCount(0);
    } finally {
      await prisma.event.update({
        where: { id: originalEvent.id },
        data: { capacity: originalEvent.capacity },
      });
    }
  });

  for (const scenario of [
    {
      lang: "fr",
      message: "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      retry: "Réessayer",
      seats: "120 places restantes",
    },
    {
      lang: "en",
      message: "Something went wrong. Please try again in a few moments.",
      retry: "Try again",
      seats: "120 seats left",
    },
  ]) {
    test(`reprend après une erreur contrôlée en ${scenario.lang}`, async ({ page }) => {
      const prisma = getPrisma();
      const originalEvent = await prisma.event.findFirstOrThrow();
      try {
        // L'événement manque sur la base de test ; aucune panne réseau ni modification de dev.
        await prisma.event.delete({ where: { id: originalEvent.id } });
        await page.goto(`/${scenario.lang}`);
        await expect(page.getByRole("alert").filter({ hasText: scenario.message })).toBeVisible();

        await prisma.event.create({ data: originalEvent });
        await page.getByRole("button", { name: scenario.retry }).click();

        await expect(page.getByText(scenario.seats)).toBeVisible();
        await expect(page.getByRole("button", { name: scenario.retry })).toHaveCount(0);
      } finally {
        await prisma.event.upsert({
          where: { id: originalEvent.id },
          create: originalEvent,
          update: originalEvent,
        });
      }
    });
  }
});

test.describe("choix de la langue à l'arrivée", () => {
  test("utilise le français sans en-tête de langue", async ({ request }) => {
    const response = await request.get("/", {
      headers: { "accept-language": "" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/fr");
  });
  test("envoie un navigateur anglais vers /en", async ({ browser }) => {
    const context = await browser.newContext({
      locale: "en-CA",
      extraHTTPHeaders: { "accept-language": "en-CA,en;q=0.9" },
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await context.close();
  });

  test("envoie un navigateur allemand vers /fr", async ({ browser }) => {
    const context = await browser.newContext({
      locale: "de-DE",
      extraHTTPHeaders: { "accept-language": "de-DE,de;q=0.9" },
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/fr$/);
    await context.close();
  });

  test("répond 404 pour une langue inconnue", async ({ page }) => {
    const response = await page.goto("/de");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });
});
