import { describe, expect, it } from "vitest";
import { validateReservationDecision } from "./reservation-decision.schema.js";

describe("validateReservationDecision", () => {
  it("accepte une confirmation et ignore l'absence de motif", () => {
    expect(validateReservationDecision({ reservationId: " res_1 ", decision: "confirm" })).toEqual({
      success: true,
      data: { reservationId: "res_1", decision: "confirm", reasonCode: null },
    });
  });

  it("garde le motif d'un refus", () => {
    const result = validateReservationDecision({
      reservationId: "res_1",
      decision: "refuse",
      reasonCode: "INCOMPLETE_AMOUNT",
    });
    expect(result).toEqual({
      success: true,
      data: { reservationId: "res_1", decision: "refuse", reasonCode: "INCOMPLETE_AMOUNT" },
    });
  });

  it("n'enregistre jamais de motif pour une annulation", () => {
    const result = validateReservationDecision({
      reservationId: "res_1",
      decision: "cancel",
      reasonCode: "NO_TRANSFER",
    });
    expect(result).toMatchObject({ success: true, data: { reasonCode: null } });
  });

  it("exige un motif de la liste pour refuser", () => {
    expect(validateReservationDecision({ reservationId: "res_1", decision: "refuse" })).toEqual({
      success: false,
      fieldErrors: [{ field: "reasonCode", messageKey: "validation.refusalReasonRequired" }],
    });
    expect(
      validateReservationDecision({ reservationId: "res_1", decision: "refuse", reasonCode: "X" }),
    ).toMatchObject({ success: false, fieldErrors: [{ field: "reasonCode" }] });
  });

  it.each([
    { reservationId: "res_1", decision: "delete" },
    { reservationId: "res_1", decision: "" },
    { reservationId: "", decision: "confirm" },
    { reservationId: "x".repeat(65), decision: "confirm" },
    { decision: "confirm" },
  ])("refuse une décision ou une réservation invalide (%o)", (raw) => {
    const result = validateReservationDecision(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors[0].messageKey).toBe("validation.decisionInvalid");
    }
  });
});
