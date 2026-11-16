import fr from "../src/i18n/dictionaries/fr.json" with { type: "json" };
import { expect, test } from "@playwright/test";
import { getEnv } from "../src/config/env.js";
import { formatEventDate, formatEventTime } from "../src/lib/format.js";
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

    await expect(page.getByRole("heading", { level: 1, name: fr.home.title })).toBeVisible();
    await expect(page.getByText(formatEventDate(eventStartsAt, "fr")).first()).toBeVisible();
    await expect(
      page.getByText(`À ${formatEventTime(eventStartsAt, "fr")}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/35\s\$ par personne de 15 ans et plus/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations pratiques" })).toBeVisible();
    await expect(page.getByText("75 Auriga Drive, Nepean")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comment réserver" })).toBeVisible();
    await expect(page.getByText("Tous aux couleurs de Noël")).toBeVisible();
    await expect(page.getByRole("link", { name: "contact@example.org" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.getByText(/places restantes|capacité maximale/i)).toHaveCount(0);
    const reserveLinks = page.getByRole("link", { name: "Réserver ma place" });
    await expect(reserveLinks).toHaveCount(2);
    await expect(reserveLinks.first()).toHaveAttribute("href", "/fr/reservation");
  });

  test("affiche le dîner en anglais", async ({ page }) => {
    await page.goto("/en");

    await expect(
      page.getByRole("heading", { level: 1, name: "Christmas Dinner 2026" }),
    ).toBeVisible();
    await expect(page.getByText("$35 per person aged 15 and over").first()).toBeVisible();
    await expect(page.getByText(formatEventDate(eventStartsAt, "en")).first()).toBeVisible();
    await expect(page.getByRole("img")).toBeVisible();
    await expect(page.getByText("Everyone in Christmas colours")).toBeVisible();
  });

  test("passe à l'anglais par le choix de langue", async ({ page }) => {
    await page.goto("/fr");

    await page.getByRole("link", { name: "English" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText("Everyone in Christmas colours")).toBeVisible();
  });
});

const HOME_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 640, height: 1000 },
  { width: 1024, height: 1000 },
  { width: 1440, height: 1000 },
];

for (const viewport of HOME_VIEWPORTS) {
  for (const lang of ["fr", "en"]) {
    test(`présente l'accueil en ${lang} sans débordement à ${viewport.width} px`, async ({
      page,
    }, testInfo) => {
      /** @type {string[]} */
      const browserErrors = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      await page.setViewportSize(viewport);
      await page.goto(`/${lang}`);
      const name = lang === "fr" ? "Informations pratiques" : "Practical information";
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(page.getByRole("img")).toBeVisible();
      await expect(page.getByRole("img")).toHaveJSProperty("complete", true);
      await expect
        .poll(() =>
          page
            .getByRole("img")
            .evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0),
        )
        .toBe(true);
      const factsLabel = lang === "fr" ? "Informations clés" : "Key information";
      const facts = page.getByRole("list", { name: factsLabel });
      await facts.scrollIntoViewIfNeeded();
      await expect(facts).toBeInViewport();
      await expect(facts.getByText(formatEventDate(eventStartsAt, lang))).toBeInViewport();
      const timePrefix = lang === "fr" ? "À" : "At";
      await expect(
        facts.getByText(`${timePrefix} ${formatEventTime(eventStartsAt, lang)}`, { exact: true }),
      ).toBeInViewport();
      await expect(facts.getByText("ICC Ottawa, Nepean")).toBeInViewport();
      const hasNoOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(hasNoOverflow).toBe(true);
      const bookingName = lang === "fr" ? "Réserver ma place" : "Book my seat";
      const button = page.getByRole("link", { name: bookingName }).first();
      const factsBounds = await facts.boundingBox();
      const bounds = await button.boundingBox();
      expect(bounds?.height).toBeGreaterThanOrEqual(48);
      expect(factsBounds?.y).toBeLessThan(bounds?.y ?? 0);
      const promotionDetails = page.getByText(
        lang === "fr" ? "Voir les tarifs promotionnels" : "View promotional pricing",
      );
      await expect(promotionDetails).toBeVisible();
      await promotionDetails.click();
      await expect(page.getByText(/^Promotion/)).toBeVisible();
      await promotionDetails.click();
      const faqName = lang === "fr" ? "Questions fréquentes" : "Frequently asked questions";
      await page.getByRole("navigation").getByRole("link", { name: "FAQ", exact: true }).click();
      const faqHeading = page.getByRole("heading", { name: faqName });
      await expect(faqHeading).toBeInViewport();
      await expect
        .poll(async () => {
          const headingBounds = await faqHeading.boundingBox();
          const headerBounds = await page.locator("header").boundingBox();
          return (headingBounds?.y ?? 0) >= (headerBounds?.height ?? 0);
        })
        .toBe(true);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: testInfo.outputPath(`home-${lang}-${viewport.width}.png`),
        fullPage: true,
      });
      expect(browserErrors).toEqual([]);
    });
  }
}

test.describe("données à jour et reprise", () => {
  test("relit les places après une modification de la base et un rechargement", async ({
    page,
  }) => {
    const prisma = getPrisma();
    const originalEvent = await prisma.event.findFirstOrThrow();
    try {
      await page.goto("/fr");
      await expect(page.getByText("Tous aux couleurs de Noël")).toBeVisible();

      await prisma.event.update({ where: { id: originalEvent.id }, data: { capacity: 0 } });
      await page.reload();

      await expect(
        page.getByText("Le dîner est complet : il n'y a plus de place.").first(),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Réserver ma place" })).toHaveCount(0);
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
      seats: "Tous aux couleurs de Noël",
    },
    {
      lang: "en",
      message: "Something went wrong. Please try again in a few moments.",
      retry: "Try again",
      seats: "Everyone in Christmas colours",
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
