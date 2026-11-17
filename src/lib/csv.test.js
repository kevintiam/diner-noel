import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "./csv.js";

describe("escapeCsvCell", () => {
  it("entoure chaque cellule de guillemets et double les siens", () => {
    expect(escapeCsvCell("Élise")).toBe('"Élise"');
    expect(escapeCsvCell('Dit "Lili"')).toBe('"Dit ""Lili"""');
    expect(escapeCsvCell(3)).toBe('"3"');
  });

  it("garde un séparateur ou un retour à la ligne à l'intérieur de la cellule", () => {
    expect(escapeCsvCell("Allergie ; arachides\nPas de porc")).toBe(
      '"Allergie ; arachides\nPas de porc"',
    );
  });

  it.each(["=SOMME(A1:A9)", "+1 613 555-0100", "-2", "@cmd", "\tcaché"])(
    "neutralise une formule possible : %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value}"`);
    },
  );
});

describe("toCsv", () => {
  it("commence par la marque UTF-8 et termine chaque ligne par CRLF", () => {
    const content = toCsv(
      [
        ["Nom", "Prénom"],
        ["Bélanger", "Noël"],
      ],
      { separator: ";" },
    );

    expect(content).toBe('﻿"Nom";"Prénom"\r\n"Bélanger";"Noël"\r\n');
  });
});
