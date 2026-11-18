// Même réservation du premier dépôt jusqu'à la confirmation, dans les deux langues.
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";
import {
  fillReservation,
  uploadProof,
  getTestDictionary as getDictionary,
} from "./helpers/reservation-flow.js";

const ACCOUNT = {
  email: "cycle-organisateur@example.test",
  name: "Organisateur fictif cycle",
  password: "Sapin-Fictif-Cycle-2026",
};
const EMAIL = "cycle-participant@example.test";

test.beforeAll(async () => {
  await createOrganizerAccount(ACCOUNT);
});
test.beforeEach(async () => {
  await getPrisma().rateLimit.deleteMany();
});
test.afterEach(async () => {
  const where = { reservation: { email: EMAIL } };
  await getPrisma().reservationDecision.deleteMany({ where });
  await getPrisma().proof.deleteMany({ where });
  await getPrisma().reservation.deleteMany({ where: { email: EMAIL } });
});
test.afterAll(async () => {
  await getPrisma().organizer.deleteMany({ where: { email: ACCOUNT.email } });
  await disconnectPrisma();
});

for (const lang of ["fr", "en"]) {
  test(`refuse, redépose et confirme la même réservation en ${lang}`, async ({
    page,
    browser,
    request,
  }) => {
    const dictionary = getDictionary(lang);
    await page.goto(`/${lang}/reservation`);
    await fillReservation(page, lang, EMAIL);
    await page.getByRole("button", { name: dictionary.reservation.submit }).click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/r/[A-Za-z0-9_-]{43}$`));
    const personalUrl = page.url();
    const initial = await getPrisma().reservation.findFirstOrThrow({ where: { email: EMAIL } });
    const image = await sharp({
      create: { width: 30, height: 20, channels: 3, background: "blue" },
    })
      .png()
      .toBuffer();
    await uploadProof(page, lang, image);
    const firstProof = await getPrisma().proof.findFirstOrThrow({
      where: { reservationId: initial.id },
    });

    const admin = await browser.newPage();
    try {
      await admin.goto("/admin/login");
      await admin.getByLabel("Courriel", { exact: true }).fill(ACCOUNT.email);
      await admin.getByLabel("Mot de passe").fill(ACCOUNT.password);
      await admin.getByRole("button", { name: "Se connecter" }).click();
      await expect(admin).toHaveURL(/\/admin$/);
      await admin.goto(`/admin/reservations/${initial.id}`);
      await expect(
        admin.getByRole("region", { name: "Lien personnel", exact: true }),
      ).toContainText(`http://localhost:3100/${lang}/r/${initial.token}`);
      await admin.getByLabel("Motif du refus").selectOption("INCOMPLETE_AMOUNT");
      await admin.getByRole("button", { name: "Refuser le paiement" }).click();
      await expect(admin.getByText(/rien à confirmer pour l’instant/)).toBeVisible();
      const refused = await getPrisma().reservation.findUniqueOrThrow({
        where: { id: initial.id },
      });
      expect(refused).toMatchObject({
        status: "PENDING_PAYMENT",
        code: initial.code,
        token: initial.token,
        seats: initial.seats,
        amountCents: initial.amountCents,
        language: lang.toUpperCase(),
      });
      await page.goto(personalUrl);
      await uploadProof(page, lang, image);
      const proofs = await getPrisma().proof.findMany({ where: { reservationId: initial.id } });
      expect(proofs).toHaveLength(2);
      expect(proofs.some((proof) => proof.id === firstProof.id)).toBe(true);
      await admin.reload();
      await expect(admin.getByRole("button", { name: /Capture.*Voir en grand/ })).toHaveCount(2);
      await admin.getByRole("button", { name: "Confirmer le paiement" }).click();
      await expect(admin.getByText("Paiement confirmé", { exact: true })).toBeVisible();
      const confirmed = await getPrisma().reservation.findUniqueOrThrow({
        where: { id: initial.id },
      });
      expect(confirmed.status).toBe("CONFIRMED");
      expect(confirmed.confirmedAt).not.toBeNull();
      const decisions = await getPrisma().reservationDecision.findMany({
        where: { reservationId: initial.id },
        orderBy: { createdAt: "asc" },
      });
      expect(decisions.map((decision) => decision.type)).toEqual(["REFUSE", "CONFIRM"]);
      expect(decisions[0].reasonCode).toBe("INCOMPLETE_AMOUNT");
      await page.goto(personalUrl);
      await expect(
        page.getByRole("heading", { name: dictionary.status.confirmedTitle }),
      ).toBeVisible();
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      const extra = await request.post(`/api/reservations/${initial.token}/proofs`, {
        multipart: {
          proof: { name: "extra.png", mimeType: "image/png", buffer: image },
          confirmTransfer: "on",
          lang,
        },
      });
      expect(extra.status()).toBe(409);
      expect(await getPrisma().proof.count({ where: { reservationId: initial.id } })).toBe(2);
    } finally {
      await admin.close();
    }
  });
}
