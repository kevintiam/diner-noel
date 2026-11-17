import { describe, expect, it } from "vitest";
import { centsToPriceInput, validateEventSettings } from "./event-settings.schema.js";

const VALID = {
  startsAtDate: "2026-12-19",
  startsAtTime: "18:00",
  bookingDeadlineDate: "2026-12-12",
  venueName: " Salle fictive ",
  venueAddress: "1 rue Exemple, Ottawa",
  capacity: "120",
  unitPrice: "35",
  interacEmail: " Paiements@Example.TEST ",
  autoDepositConfirmed: true,
};

/** @param {Record<string, unknown>} changes */
function firstErrorOf(changes) {
  const result = validateEventSettings({ ...VALID, ...changes });
  return result.success ? null : result.fieldErrors[0];
}

describe("validateEventSettings", () => {
  it("nettoie les valeurs et convertit le prix en cents", () => {
    expect(validateEventSettings(VALID)).toEqual({
      success: true,
      data: {
        startsAtDate: "2026-12-19",
        startsAtTime: "18:00",
        bookingDeadlineDate: "2026-12-12",
        venueName: "Salle fictive",
        venueAddress: "1 rue Exemple, Ottawa",
        capacity: 120,
        unitPriceCents: 3500,
        interacEmail: "paiements@example.test",
        autoDepositConfirmed: true,
      },
    });
  });

  it.each([
    ["35,5", 3550],
    ["35.50", 3550],
    ["0", 0],
    ["35,05", 3505],
  ])("lit le prix « %s » en %i cents sans arrondi", (unitPrice, cents) => {
    const result = validateEventSettings({ ...VALID, unitPrice });
    expect(result).toMatchObject({ success: true, data: { unitPriceCents: cents } });
  });

  it("considère la case du dépôt automatique décochée par défaut", () => {
    const { autoDepositConfirmed, ...withoutCheckbox } = VALID;
    expect(autoDepositConfirmed).toBe(true);
    expect(validateEventSettings(withoutCheckbox)).toMatchObject({
      success: true,
      data: { autoDepositConfirmed: false },
    });
  });

  it.each([
    [{ startsAtDate: "2026-02-30" }, "startsAtDate", "validation.dateInvalid"],
    [{ bookingDeadlineDate: "12/12/2026" }, "bookingDeadlineDate", "validation.dateInvalid"],
    [{ startsAtTime: "24:00" }, "startsAtTime", "validation.timeInvalid"],
    [{ venueName: "  " }, "venueName", "validation.venueNameInvalid"],
    [{ venueAddress: "x".repeat(201) }, "venueAddress", "validation.venueAddressInvalid"],
    [{ capacity: "0" }, "capacity", "validation.capacityInvalid"],
    [{ capacity: "12.5" }, "capacity", "validation.capacityInvalid"],
    [{ capacity: "2001" }, "capacity", "validation.capacityInvalid"],
    [{ unitPrice: "35,555" }, "unitPrice", "validation.priceInvalid"],
    [{ unitPrice: "-5" }, "unitPrice", "validation.priceInvalid"],
    [{ unitPrice: "trente" }, "unitPrice", "validation.priceInvalid"],
    [{ interacEmail: "pas-un-courriel" }, "interacEmail", "validation.emailInvalid"],
  ])("refuse %o", (changes, field, messageKey) => {
    expect(firstErrorOf(changes)).toEqual({ field, messageKey });
  });
});

describe("centsToPriceInput", () => {
  it("écrit un prix rond sans décimales et sinon avec une virgule", () => {
    expect(centsToPriceInput(3500)).toBe("35");
    expect(centsToPriceInput(3550)).toBe("35,50");
    expect(centsToPriceInput(3505)).toBe("35,05");
    expect(centsToPriceInput(0)).toBe("0");
  });
});
