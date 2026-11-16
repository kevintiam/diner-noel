import { describe, expect, it } from "vitest";
import { isValidPersonalToken, validateReservationInput } from "./reservation.schema.js";

const VALID_INPUT = {
  firstName: "  Prénom ",
  lastName: "Fictif",
  email: "fictif@example.test",
  phone: "613 555-0100",
  seats: "2",
  note: "",
};

/** @param {Record<string, unknown>} overrides */
function fieldErrorsFor(overrides) {
  const result = validateReservationInput({ ...VALID_INPUT, ...overrides });
  return result.success ? [] : result.fieldErrors;
}

describe("validateReservationInput", () => {
  it("accepte une demande valide, retire les espaces et convertit les places", () => {
    const result = validateReservationInput(VALID_INPUT);

    expect(result).toEqual({
      success: true,
      data: {
        firstName: "Prénom",
        lastName: "Fictif",
        email: "fictif@example.test",
        phone: "613 555-0100",
        seats: 2,
        note: undefined,
      },
    });
  });

  it("garde une remarque non vide", () => {
    const result = validateReservationInput({ ...VALID_INPUT, note: " Allergie aux noix " });

    expect(result.success && result.data.note).toBe("Allergie aux noix");
  });

  it("accepte 1 et 10 places, les deux limites", () => {
    expect(fieldErrorsFor({ seats: "1" })).toEqual([]);
    expect(fieldErrorsFor({ seats: "10" })).toEqual([]);
  });

  it.each([true, [1], { valueOf: () => 1 }])(
    "refuse les places d'un type étranger : %s",
    (seats) => {
      expect(fieldErrorsFor({ seats })).toEqual([
        { field: "seats", messageKey: "validation.seatsInvalid" },
      ]);
    },
  );

  it("accepte aussi un nombre de places déjà numérique", () => {
    expect(fieldErrorsFor({ seats: 2 })).toEqual([]);
  });

  it.each([["0"], ["11"], ["2.5"], ["abc"], [null], [""]])(
    "refuse le nombre de places %s",
    (seats) => {
      expect(fieldErrorsFor({ seats })).toEqual([
        { field: "seats", messageKey: "validation.seatsInvalid" },
      ]);
    },
  );

  it("refuse un courriel sans @", () => {
    expect(fieldErrorsFor({ email: "fictif.example.test" })).toEqual([
      { field: "email", messageKey: "validation.emailInvalid" },
    ]);
  });

  it.each([["613 555"], ["abc 555 0100"], ["1234567890123456"]])(
    "refuse le téléphone %s",
    (phone) => {
      expect(fieldErrorsFor({ phone })).toEqual([
        { field: "phone", messageKey: "validation.phoneInvalid" },
      ]);
    },
  );

  it("refuse un prénom vide et un nom trop long", () => {
    expect(fieldErrorsFor({ firstName: "   ", lastName: "x".repeat(61) })).toEqual([
      { field: "firstName", messageKey: "validation.firstNameRequired" },
      { field: "lastName", messageKey: "validation.lastNameTooLong" },
    ]);
  });

  it("refuse un téléphone allongé par une quantité excessive de séparateurs", () => {
    expect(fieldErrorsFor({ phone: `613${"-".repeat(100)}5550100` })).toEqual([
      { field: "phone", messageKey: "validation.phoneInvalid" },
    ]);
  });

  it("refuse une remarque de plus de 500 caractères", () => {
    expect(fieldErrorsFor({ note: "x".repeat(501) })).toEqual([
      { field: "note", messageKey: "validation.noteTooLong" },
    ]);
  });

  it("refuse des valeurs qui ne sont pas du texte", () => {
    const fields = fieldErrorsFor({ firstName: null, email: 42, phone: {} }).map(
      (fieldError) => fieldError.field,
    );

    expect(fields).toEqual(["firstName", "email", "phone"]);
  });

  it("refuse une entrée qui n'est pas un objet, avec une clé de dictionnaire", () => {
    const result = validateReservationInput(null);

    expect(result).toEqual({
      success: false,
      fieldErrors: [{ field: "form", messageKey: "errors.validation" }],
    });
  });
});

describe("isValidPersonalToken", () => {
  it("accepte un jeton de 43 caractères base64url", () => {
    expect(isValidPersonalToken("A".repeat(42) + "_")).toBe(true);
  });

  it.each([["A".repeat(42)], ["A".repeat(44)], [`${"A".repeat(42)}/`], [""], [null], [42]])(
    "refuse %s",
    (value) => {
      expect(isValidPersonalToken(value)).toBe(false);
    },
  );
});
