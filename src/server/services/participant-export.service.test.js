import { beforeEach, describe, expect, it, vi } from "vitest";
import { findConfirmedParticipants } from "../db/reservation-admin.repository.js";
import { buildConfirmedParticipantsExport } from "./participant-export.service.js";

vi.mock("../db/reservation-admin.repository.js", () => ({ findConfirmedParticipants: vi.fn() }));

// 23 h 30 le 18 décembre à Ottawa : déjà le 19 en UTC.
const NOW = new Date("2026-12-19T04:30:00.000Z");
/** @type {import("../db/reservation-admin.repository.js").ConfirmedParticipant} */
const PARTICIPANT = {
  code: "NOEL-0001",
  firstName: "Zoé",
  lastName: "Martin",
  email: "fictif@example.test",
  phone: "613 555-0100",
  seats: 3,
  childSeats: 1,
  language: "FR",
  amountCents: 6000,
  confirmedAt: new Date("2026-11-20T15:05:00.000Z"),
  note: null,
};

/** @param {string} content */
function readLines(content) {
  return content.replace(/^﻿/, "").trimEnd().split("\r\n");
}

beforeEach(() => {
  vi.mocked(findConfirmedParticipants).mockReset();
});

describe("buildConfirmedParticipantsExport", () => {
  it("écrit l'en-tête et une ligne par réservation confirmée", async () => {
    vi.mocked(findConfirmedParticipants).mockResolvedValue([PARTICIPANT]);

    const result = await buildConfirmedParticipantsExport({ now: NOW });

    expect(result.filename).toBe("participants-confirmes-2026-12-18.csv");
    expect(result.count).toBe(1);
    expect(result.content.startsWith("﻿")).toBe(true);
    expect(readLines(result.content)).toEqual([
      '"Nom";"Prénom";"Code";"Places";"15 ans et plus";"Enfants (0 à 14 ans)";"Courriel";"Téléphone";"Langue";"Montant payé ($)";"Confirmée le";"Remarque"',
      '"Martin";"Zoé";"NOEL-0001";"3";"2";"1";"fictif@example.test";"613 555-0100";"Français";"60,00";"2026-11-20 10:05";""',
    ]);
  });

  it("range par nom puis par prénom, accents compris", async () => {
    vi.mocked(findConfirmedParticipants).mockResolvedValue([
      { ...PARTICIPANT, lastName: "Fortin", firstName: "Luc" },
      { ...PARTICIPANT, lastName: "Émond", firstName: "Anne" },
      { ...PARTICIPANT, lastName: "Fortin", firstName: "Ève" },
      { ...PARTICIPANT, lastName: "Dubé", firstName: "Paul" },
    ]);

    const { content } = await buildConfirmedParticipantsExport({ now: NOW });

    const names = readLines(content)
      .slice(1)
      .map((line) => line.split(";").slice(0, 2).join(" "));
    expect(names).toEqual(['"Dubé" "Paul"', '"Émond" "Anne"', '"Fortin" "Ève"', '"Fortin" "Luc"']);
  });

  it("garde la remarque sur une seule cellule et neutralise une formule", async () => {
    vi.mocked(findConfirmedParticipants).mockResolvedValue([
      {
        ...PARTICIPANT,
        firstName: "=HYPERLINK(1)",
        language: "EN",
        amountCents: 3505,
        note: 'Allergie ; "arachides"\nmerci',
      },
    ]);

    const { content } = await buildConfirmedParticipantsExport({ now: NOW });

    expect(content).toContain(`"'=HYPERLINK(1)"`);
    expect(content).toContain('"Anglais";"35,05"');
    expect(content).toContain('"Allergie ; ""arachides""\nmerci"');
  });

  it("produit seulement l'en-tête quand personne n'est encore confirmé", async () => {
    vi.mocked(findConfirmedParticipants).mockResolvedValue([]);

    const result = await buildConfirmedParticipantsExport({ now: NOW });

    expect(result.count).toBe(0);
    expect(readLines(result.content)).toHaveLength(1);
  });
});
