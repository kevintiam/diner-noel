// Voir une capture de paiement avant de décider (story 2.2), sur la base Neon `test`.
// L'image est synthétique (un rectangle gris) ; le compte et la réservation sont fictifs.
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { getEnv } from "../src/config/env.js";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";

const ACCOUNT = {
  email: "captures@example.test",
  name: "Organisateur captures",
  password: "Sapin-Fictif-Captures",
};
const CODE = "NOEL-7101";
/** @type {{ reservationId: string, proofId: string }} */
const created = { reservationId: "", proofId: "" };

test.beforeAll(async () => {
  if (getEnv().DATABASE_IS_TEST !== "true") {
    throw new Error("Ces parcours exigent la base dédiée aux tests.");
  }
  await createOrganizerAccount(ACCOUNT);
  const event = await getPrisma().event.findFirstOrThrow();
  const reservation = await getPrisma().reservation.create({
    data: {
      code: CODE,
      token: "jeton-fictif-captures".padEnd(43, "x"),
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
  const image = await sharp({
    create: { width: 600, height: 900, channels: 3, background: "#d9d8cd" },
  })
    .webp()
    .toBuffer();
  const proof = await getPrisma().proof.create({
    data: {
      reservationId: reservation.id,
      data: new Uint8Array(image),
      mimeType: "image/webp",
      byteSize: image.byteLength,
    },
  });
  created.reservationId = reservation.id;
  created.proofId = proof.id;
});

test.afterAll(async () => {
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().proof.deleteMany({ where: { reservationId: created.reservationId } });
  await getPrisma().reservation.deleteMany({ where: { code: CODE } });
  await getPrisma().organizer.deleteMany({ where: { email: ACCOUNT.email } });
  await disconnectPrisma();
});

test("refuse la capture sans session", async ({ request }) => {
  const response = await request.get(`/api/admin/proofs/${created.proofId}`);

  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
});

test("montre la capture en grand avant de confirmer", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Courriel").fill(ACCOUNT.email);
  await page.getByLabel("Mot de passe").fill(ACCOUNT.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Attendre la session avant d'ouvrir la fiche, sinon elle renvoie vers la connexion.
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/reservations/${created.reservationId}`);

  const thumbnail = page.getByRole("button", { name: /Capture 1.*Voir en grand/ });
  await expect(thumbnail).toBeVisible();
  // La vignette est vraiment chargée par la route protégée, avec la session.
  await expect
    .poll(() => thumbnail.locator("img").evaluate((image) => image.naturalWidth))
    .toBe(600);

  await thumbnail.click();
  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("img", { name: /capture du virement/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();

  await expect(page.getByRole("button", { name: "Confirmer le paiement" })).toBeVisible();
});
