import { expect } from "@playwright/test";
import fr from "../../src/i18n/dictionaries/fr.json" with { type: "json" };
import en from "../../src/i18n/dictionaries/en.json" with { type: "json" };

/**
 * Lit les textes des tests sans dépendre du chargeur JSON de Next.js.
 * @param {string} lang La langue publique.
 * @returns {typeof fr} Les textes du parcours.
 */
export function getTestDictionary(lang) {
  return lang === "en" ? en : fr;
}

/**
 * Saisit les coordonnées fictives dans la langue du parcours.
 * @param {import('@playwright/test').Page} page La page du participant.
 * @param {string} lang La langue publique.
 * @param {string} email L'adresse fictive propre au test.
 * @returns {Promise<void>} La fin de la saisie.
 */
export async function fillReservation(page, lang, email) {
  const { reservation } = getTestDictionary(lang);
  await page.getByLabel(reservation.firstName, { exact: true }).fill("Marie");
  await page.getByLabel(reservation.lastName, { exact: true }).fill("Fictif");
  await page.getByLabel(reservation.email, { exact: true }).fill(email);
  await page.getByLabel(reservation.phone, { exact: true }).fill("6135550100");
}

/**
 * Dépose une image synthétique par le formulaire public.
 * @param {import('@playwright/test').Page} page La page du participant.
 * @param {string} lang La langue publique.
 * @param {Buffer} image Le PNG synthétique.
 * @returns {Promise<void>} Le statut reçu visible.
 */
export async function uploadProof(page, lang, image) {
  const dictionary = getTestDictionary(lang);
  await expect(page.locator('input[type="file"]')).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({
    name: "capture.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page.getByRole("checkbox").check();
  await expect(page.getByText("capture.png", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: dictionary.proof.submit }).click();
  await expect(page.getByRole("heading", { name: dictionary.received.title })).toBeVisible();
}
