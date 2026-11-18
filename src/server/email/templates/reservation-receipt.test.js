import { describe, expect, it } from "vitest";
import { buildReservationReceipt } from "./reservation-receipt.js";
import { formatMoney } from "../../../lib/format.js";

const TOKEN = "A".repeat(43);
/** @type {import("../../../validation/reservation.schema.js").ReservationForReceipt} */
const RESERVATION = {
  id: "internal-fake",
  code: "NOEL-1234",
  token: TOKEN,
  firstName: "Fictif",
  email: "fictif@example.test",
  language: "FR",
  seats: 5,
  childSeats: 3,
  unitPriceCents: 3000,
  amountCents: 6000,
  interacEmail: "fige@example.test",
};
const SITE_URL = "https://diner.example.test";
const EVENT = {
  startsAt: new Date("2026-12-19T23:00:00.000Z"),
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
};
/** @type {Array<"FR" | "EN">} */
const LANGUAGES = ["FR", "EN"];

describe("buildReservationReceipt", () => {
  it("reprend la mise en page des autres courriels, avec la date et le lieu du dîner", () => {
    const message = buildReservationReceipt(RESERVATION, EVENT, SITE_URL);

    expect(message.html).toContain("Réservation enregistrée");
    expect(message.html).toContain("Dîner de Noël 2026");
    expect(message.html).toContain("#1a382b");
    expect(message.html).toContain(`href="${SITE_URL}/fr/r/${TOKEN}"`);
    for (const content of [message.text, message.html]) {
      expect(content).toContain("Salle fictive");
      expect(content).toContain("1 rue Exemple, Ottawa");
      expect(content).toMatch(/19 décembre 2026/i);
    }
  });

  it.each(LANGUAGES)("construit un accusé payant en %s et son lien", (language) => {
    const lang = language.toLowerCase();
    const message = buildReservationReceipt({ ...RESERVATION, language }, EVENT, SITE_URL);
    expect(message.to).toBe(RESERVATION.email);
    for (const content of [message.text, message.html]) {
      expect(content).toContain("NOEL-1234");
      expect(content).toContain(formatMoney(6000, lang));
      expect(content).toContain(formatMoney(3000, lang));
      expect(content).toContain("fige@example.test");
      expect(content).toContain(`${SITE_URL}/${lang}/r/${TOKEN}`);
      expect(content).toMatch(/2 person|2 personne/);
      expect(content).toMatch(/3 child|3 enfant/);
    }
    expect(message.text).toContain(
      language === "EN" ? "awaiting verification" : "attente de vérification",
    );
    expect(message.text).toContain(language === "EN" ? "No refunds" : "Aucun remboursement");
    expect(message.text).toContain(language === "EN" ? "transfer message" : "message du virement");
    expect(message.subject).toContain(language === "EN" ? "Your booking" : "Votre réservation");
  });

  it.each(LANGUAGES)(
    "confirme une réservation gratuite en %s sans demande de paiement",
    (language) => {
      const message = buildReservationReceipt(
        { ...RESERVATION, language, seats: 3, childSeats: 3, amountCents: 0 },
        EVENT,
        SITE_URL,
      );
      for (const content of [message.text, message.html]) {
        expect(content).toContain(language === "EN" ? "already confirmed" : "déjà confirmée");
        expect(content).not.toMatch(
          /Interac|virement|transfer|preuve|proof|remboursement|refund|fige@example/,
        );
        expect(content).toContain(`/${language.toLowerCase()}/r/${TOKEN}`);
      }
    },
  );

  it("échappe toutes les valeurs HTML en conservant le texte littéral", () => {
    const firstName = `<img src=x onerror="alert('fictif')"> &`;
    const message = buildReservationReceipt({ ...RESERVATION, firstName }, EVENT, SITE_URL);
    expect(message.text).toContain(firstName);
    expect(message.html).not.toContain("<img");
    expect(message.html).toContain(
      "&lt;img src=x onerror=&quot;alert(&#39;fictif&#39;)&quot;&gt; &amp;",
    );
  });

  it("ne divulgue ni nom de famille, téléphone, remarque, ni identifiant interne", () => {
    const privateReservation = {
      ...RESERVATION,
      lastName: "FamilleSecrete",
      phone: "6135550100",
      note: "RemarqueSecrete",
    };
    const message = buildReservationReceipt(privateReservation, EVENT, SITE_URL);
    expect(JSON.stringify(message)).not.toMatch(
      /FamilleSecrete|6135550100|RemarqueSecrete|internal-fake/,
    );
  });

  it("affiche le montant figé sans le recalculer à partir du tarif", () => {
    const message = buildReservationReceipt({ ...RESERVATION, amountCents: 1234 }, EVENT, SITE_URL);
    expect(message.text).toContain(formatMoney(1234, "fr"));
  });
});
