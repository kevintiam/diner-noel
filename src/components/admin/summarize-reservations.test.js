import { describe, expect, it } from "vitest";
import { formatCount, getInitials, getLabel, STATUS_LABELS } from "./reservation-labels.js";
import { summarizeReservations } from "./summarize-reservations.js";

describe("summarizeReservations", () => {
  it("compte les réservations, les places et les montants de chaque statut", () => {
    const summary = summarizeReservations([
      { status: "TO_VERIFY", seats: 2, amountCents: 6000 },
      { status: "TO_VERIFY", seats: 3, amountCents: 9000 },
      { status: "CONFIRMED", seats: 4, amountCents: 12000 },
      { status: "CANCELLED", seats: 1, amountCents: 3000 },
    ]);

    expect(summary).toEqual({
      PENDING_PAYMENT: { count: 0, seats: 0, amountCents: 0 },
      TO_VERIFY: { count: 2, seats: 5, amountCents: 15000 },
      CONFIRMED: { count: 1, seats: 4, amountCents: 12000 },
      CANCELLED: { count: 1, seats: 1, amountCents: 3000 },
    });
  });

  it("renvoie des zéros pour une liste vide", () => {
    expect(summarizeReservations([]).TO_VERIFY).toEqual({ count: 0, seats: 0, amountCents: 0 });
  });

  it("ignore un statut inconnu au lieu de fausser un compteur", () => {
    const summary = summarizeReservations([{ status: "INCONNU", seats: 9, amountCents: 100 }]);

    expect(Object.values(summary).every((totals) => totals.count === 0)).toBe(true);
  });
});

describe("libellés du tableau de bord", () => {
  it("traduit un statut et garde un code inconnu tel quel", () => {
    expect(getLabel(STATUS_LABELS, "TO_VERIFY")).toBe("À vérifier");
    expect(getLabel(STATUS_LABELS, "INCONNU")).toBe("INCONNU");
    expect(getLabel(STATUS_LABELS, "toString")).toBe("toString");
  });

  it("accorde au singulier pour 0 et 1, au pluriel au-delà", () => {
    expect(formatCount(0, "place", "places")).toBe("0 place");
    expect(formatCount(1, "place", "places")).toBe("1 place");
    expect(formatCount(2, "place", "places")).toBe("2 places");
  });
});

describe("getInitials", () => {
  it("prend la première lettre des deux premiers mots, en majuscules", () => {
    expect(getInitials("prénom fictif")).toBe("PF");
    expect(getInitials("Élise Marie Fictive")).toBe("ÉM");
  });

  it("garde une seule lettre pour un nom d'un mot et ignore les espaces en trop", () => {
    expect(getInitials("  Organisateur  ")).toBe("O");
  });

  it("renvoie « ? » pour un nom vide", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
