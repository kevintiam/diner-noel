import { describe, expect, it } from "vitest";
import { validateReservationInput } from "./reservation.schema.js";

const INPUT = {
  firstName: "Prénom",
  lastName: "Fictif",
  email: "fictif@example.test",
  phone: "613 555-0100",
  adultSeats: "2",
  childSeats: "2",
};

describe("effectifs par âge", () => {
  it("accepte une réservation mixte et une réservation de dix enfants", () => {
    expect(validateReservationInput(INPUT)).toMatchObject({
      success: true,
      data: { adultSeats: 2, childSeats: 2 },
    });
    expect(validateReservationInput({ ...INPUT, adultSeats: "0", childSeats: "10" }).success).toBe(
      true,
    );
  });

  it.each([-1, 0.5, "texte", null, true, [], ""])("refuse un effectif invalide : %s", (value) => {
    for (const field of ["adultSeats", "childSeats"]) {
      const result = validateReservationInput({ ...INPUT, [field]: value });
      expect(result).toMatchObject({ success: false, fieldErrors: [{ field }] });
    }
  });

  it.each([
    [0, 0],
    [6, 5],
  ])("refuse un total hors limites : %s et %s", (adultSeats, childSeats) => {
    expect(validateReservationInput({ ...INPUT, adultSeats, childSeats })).toMatchObject({
      success: false,
    });
  });
});
