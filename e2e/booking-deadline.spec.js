import { expect, test } from "@playwright/test";
import { disconnectPrisma, getPrisma } from "../src/server/db/prisma-client.js";
import { fillReservation, getTestDictionary as getDictionary } from "./helpers/reservation-flow.js";

const EMAIL = "echeance@example.test";
test.afterAll(disconnectPrisma);

for (const lang of ["fr", "en"]) {
  test(`ferme l’accueil et le formulaire après l’échéance en ${lang}`, async ({ page }) => {
    const event = await getPrisma().event.findFirstOrThrow();
    const dictionary = getDictionary(lang);
    try {
      await getPrisma().event.update({
        where: { id: event.id },
        data: { bookingDeadline: new Date(Date.now() - 1000) },
      });
      await page.goto(`/${lang}`);
      await expect(page.getByText(dictionary.booking.closed, { exact: true })).toHaveCount(2);
      await expect(
        page.getByRole("link", { name: dictionary.booking.cta, exact: true }),
      ).toHaveCount(0);
      await page.goto(`/${lang}/reservation`);
      await expect(page.getByText(dictionary.booking.closed, { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: dictionary.reservation.submit })).toHaveCount(
        0,
      );
    } finally {
      await getPrisma().event.update({
        where: { id: event.id },
        data: { bookingDeadline: event.bookingDeadline },
      });
    }
  });
  test(`refuse aussi un formulaire déjà ouvert à l’échéance en ${lang}`, async ({ page }) => {
    const event = await getPrisma().event.findFirstOrThrow();
    const dictionary = getDictionary(lang);
    try {
      await getPrisma().rateLimit.deleteMany();
      await page.goto(`/${lang}/reservation`);
      await fillReservation(page, lang, EMAIL);
      await getPrisma().event.update({
        where: { id: event.id },
        data: { bookingDeadline: new Date(Date.now() - 1000) },
      });
      await page.getByRole("button", { name: dictionary.reservation.submit }).click();
      await expect(
        page.getByText(dictionary.booking.closed, { exact: true }).first(),
      ).toBeVisible();
      expect(await getPrisma().reservation.count({ where: { email: EMAIL } })).toBe(0);
      await expect(page).toHaveURL(new RegExp(`/${lang}/reservation$`));
    } finally {
      await getPrisma().event.update({
        where: { id: event.id },
        data: { bookingDeadline: event.bookingDeadline },
      });
      await getPrisma().reservation.deleteMany({ where: { email: EMAIL } });
    }
  });
}
