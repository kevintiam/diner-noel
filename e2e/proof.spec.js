// Images synthétiques uniquement ; aucun virement réel ni capture privée.
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";

test.afterEach(async () => {
  await getPrisma().proof.deleteMany();
  await getPrisma().reservation.deleteMany();
});
test.afterAll(disconnectPrisma);

async function reserve(page, lang = "fr") {
  await page.goto(`/${lang}/reservation`);
  const english = lang === "en";
  await page.getByLabel(english ? "First name" : "Prénom", { exact: true }).fill("Marie");
  await page.getByLabel(english ? "Last name" : "Nom", { exact: true }).fill("Fictif");
  await page
    .getByLabel(english ? "Email" : "Courriel", { exact: true })
    .fill("preuve@example.test");
  await page.getByLabel(english ? "Phone" : "Téléphone", { exact: true }).fill("6135550100");
  await page
    .getByRole("button", { name: english ? "Continue to payment" : "Continuer vers le paiement" })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/r/[A-Za-z0-9_-]{43}$`));
  return page.url().split("/").at(-1);
}

async function png() {
  return sharp({ create: { width: 30, height: 20, channels: 3, background: "blue" } })
    .png()
    .toBuffer();
}

for (const lang of ["fr", "en"]) {
  test(`réserve et dépose un PNG en ${lang}, sans exposer la capture`, async ({
    page,
    request,
  }) => {
    const token = await reserve(page, lang);
    const image = await png();
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "capture.png", mimeType: "image/png", buffer: image });
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Envoyer ma preuve de paiement" : "Send my payment proof",
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: lang === "fr" ? "Preuve de paiement reçue" : "Payment proof received",
      }),
    ).toBeVisible();
    await expect(page.getByText(/Marie/)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.getByText("Fictif", { exact: true })).toHaveCount(0);
    await expect(page.getByText("preuve@example.test", { exact: true })).toHaveCount(0);
    const stored = await getPrisma().proof.findFirstOrThrow();
    const metadata = await sharp(stored.data).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(Math.max(metadata.width, metadata.height)).toBeLessThanOrEqual(2000);
    expect(await page.content()).not.toContain(stored.id);
    await expect(page.locator('img, [src*="proof"], a[href*="/proof"]')).toHaveCount(0);

    const second = await request.post(`/api/reservations/${token}/proofs`, {
      multipart: {
        proof: { name: "autre.png", mimeType: "image/png", buffer: image },
        confirmTransfer: "on",
        lang,
      },
    });
    expect(second.status()).toBe(409);
    expect(await getPrisma().proof.count()).toBe(1);
  });
}

test("refuse un faux PNG sur le serveur sans changer la réservation", async ({ page }) => {
  await reserve(page);
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "capture.png", mimeType: "image/png", buffer: Buffer.from("faux PNG") });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma preuve de paiement" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Choisissez une image JPG, PNG ou WEBP valide." }),
  ).toBeVisible();
  expect(await getPrisma().proof.count()).toBe(0);
  expect((await getPrisma().reservation.findFirstOrThrow()).status).toBe("PENDING_PAYMENT");
});

test("refuse 5 Mio avant l'envoi et aussi par accès direct à l'API", async ({ page, request }) => {
  const token = await reserve(page);
  const buffer = Buffer.alloc(5 * 1024 * 1024);
  let uploads = 0;
  page.on("request", (incoming) => {
    if (incoming.url().endsWith("/proofs")) uploads++;
  });
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "trop.png", mimeType: "image/png", buffer });
  await expect(
    page.getByText("La capture dépasse 4 Mo. Choisissez un fichier plus petit."),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma preuve de paiement" }).click();
  expect(uploads).toBe(0);
  const response = await request.post(`/api/reservations/${token}/proofs`, {
    multipart: {
      proof: { name: "trop.png", mimeType: "image/png", buffer },
      confirmTransfer: "on",
      lang: "fr",
    },
  });
  expect(response.status()).toBe(413);
  expect(await getPrisma().proof.count()).toBe(0);
});
