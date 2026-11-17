import { describe, expect, it } from "vitest";
import { formatMoney } from "../../../lib/format.js";
import { escapeHtml } from "./email-layout.js";
import { buildReservationConfirmation } from "./reservation-confirmation.js";
import { buildReservationRefusal } from "./reservation-refusal.js";

const TOKEN = "B".repeat(43);
const SITE_URL = "https://diner.example.test";
/** @type {import("../../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} */
const RESERVATION = {
  id: "internal-fake",
  code: "NOEL-4821",
  token: TOKEN,
  firstName: "Fictif",
  email: "fictif@example.test",
  language: "FR",
  seats: 3,
  childSeats: 1,
  amountCents: 6000,
  interacEmail: "paiements@example.test",
};
// 18 h à Ottawa le samedi 19 décembre 2026.
const EVENT = {
  startsAt: new Date("2026-12-19T23:00:00.000Z"),
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
};
/** @type {Array<"FR" | "EN">} */
const LANGUAGES = ["FR", "EN"];
/** @param {string} text */
const normalizeSpaces = (text) => text.replace(/[  ]/g, " ");

describe("buildReservationConfirmation", () => {
  it.each(LANGUAGES)("construit la confirmation en %s avec le récapitulatif", (language) => {
    const lang = language === "EN" ? "en" : "fr";
    const message = buildReservationConfirmation({ ...RESERVATION, language }, EVENT);

    expect(message.to).toBe(RESERVATION.email);
    expect(message.subject).toBe(
      language === "EN"
        ? "Your seat at the Christmas Dinner is confirmed"
        : "Votre place au dîner de Noël est confirmée",
    );
    for (const content of [message.text, message.html]) {
      const normalized = normalizeSpaces(content);
      expect(normalized).toContain("NOEL-4821");
      expect(normalized).toContain(normalizeSpaces(formatMoney(6000, lang)));
      expect(normalized).toContain(language === "EN" ? "December 19, 2026" : "19 décembre 2026");
      expect(normalized).toContain(language === "EN" ? "Doors open at 6 p.m." : "Accueil à 18 h");
      expect(normalized).toContain("Salle fictive");
      expect(normalized).toContain(escapeHtml("1 rue Exemple, Ottawa"));
      expect(normalized).toContain(
        language === "EN" ? "3, including 1 child(ren)" : "3, dont 1 enfant(s)",
      );
      expect(normalized).toContain(
        language === "EN" ? "Christmas Dinner 2026" : "Dîner de Noël 2026",
      );
    }
    expect(message.html).toContain(`<html lang="${lang}">`);
    expect(message.text).not.toContain("/r/");
  });

  it("n'écrit que le nombre de places quand il n'y a pas d'enfant", () => {
    const message = buildReservationConfirmation({ ...RESERVATION, childSeats: 0 }, EVENT);
    expect(message.text).toContain("Places : 3\n");
    expect(message.text).not.toContain("enfant");
  });
});

describe("buildReservationRefusal", () => {
  it.each(LANGUAGES)("construit l'avis de refus en %s avec le motif et le lien", (language) => {
    const lang = language === "EN" ? "en" : "fr";
    const message = buildReservationRefusal(
      { ...RESERVATION, language },
      "INCOMPLETE_AMOUNT",
      EVENT,
      SITE_URL,
    );

    expect(message.subject).toBe(
      language === "EN"
        ? "Your proof of payment was not accepted — NOEL-4821"
        : "Votre preuve de paiement n'a pas été validée — NOEL-4821",
    );
    for (const content of [message.text, message.html]) {
      const normalized = normalizeSpaces(content);
      expect(normalized).toContain(language === "EN" ? "Incomplete amount" : "Montant incomplet");
      expect(normalized).toContain(`${SITE_URL}/${lang}/r/${TOKEN}`);
      expect(normalized).toContain(normalizeSpaces(formatMoney(6000, lang)));
      expect(normalized).toContain("paiements@example.test");
      expect(normalized).toContain(
        language === "EN" ? "Your seats remain reserved" : "Vos places restent réservées",
      );
    }
  });

  it.each([
    ["NO_TRANSFER", "Aucun virement reçu"],
    ["UNREADABLE_PROOF", "Capture illisible ou incorrecte"],
  ])("traduit le motif %s", (reasonCode, label) => {
    const message = buildReservationRefusal(
      RESERVATION,
      /** @type {"NO_TRANSFER" | "UNREADABLE_PROOF"} */ (reasonCode),
      EVENT,
      SITE_URL,
    );
    expect(message.text).toContain(`Motif : ${label}`);
  });
});

describe("courriels de décision", () => {
  it("échappent les valeurs HTML en gardant le texte littéral", () => {
    const firstName = `<img src=x onerror="alert('fictif')"> &`;
    const reservation = { ...RESERVATION, firstName };
    for (const message of [
      buildReservationConfirmation(reservation, EVENT),
      buildReservationRefusal(reservation, "NO_TRANSFER", EVENT, SITE_URL),
    ]) {
      expect(message.text).toContain(firstName);
      expect(message.html).not.toContain("<img");
      expect(message.html).toContain(
        "&lt;img src=x onerror=&quot;alert(&#39;fictif&#39;)&quot;&gt;",
      );
    }
  });

  it("ne divulguent ni nom de famille, téléphone, remarque, ni identifiant interne", () => {
    const reservation = {
      ...RESERVATION,
      lastName: "FamilleSecrete",
      phone: "6135550100",
      note: "RemarqueSecrete",
    };
    for (const message of [
      buildReservationConfirmation(reservation, EVENT),
      buildReservationRefusal(reservation, "NO_TRANSFER", EVENT, SITE_URL),
    ]) {
      expect(JSON.stringify(message)).not.toMatch(
        /FamilleSecrete|6135550100|RemarqueSecrete|internal-fake/,
      );
    }
  });
});
