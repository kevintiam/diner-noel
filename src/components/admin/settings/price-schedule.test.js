import { describe, expect, it } from "vitest";
import { describePriceSchedule } from "./price-schedule.js";

const PROMOTION = {
  unitPrice: "35",
  hasPromotion: true,
  promotionalUnitPrice: "30",
  promotionStartDate: "2026-11-20",
  promotionEndDate: "2026-12-03",
};

describe("describePriceSchedule", () => {
  it("montre le prix normal avant et après la promo, et le prix promo entre les deux", () => {
    expect(describePriceSchedule(PROMOTION)).toEqual({
      steps: [
        { period: "Jusqu’au 19 nov.", priceCents: 3500, isPromotion: false },
        { period: "Du 20 nov. au 3 déc.", priceCents: 3000, isPromotion: true },
        { period: "Dès le 4 déc.", priceCents: 3500, isPromotion: false },
      ],
      savingCents: 500,
      savingPercent: 14,
    });
  });

  it("parle d'un seul jour quand la promo commence et finit le même jour", () => {
    const oneDay = { ...PROMOTION, promotionEndDate: "2026-11-20" };

    expect(describePriceSchedule(oneDay)?.steps[1].period).toBe("Le 20 nov.");
  });

  it("montre un prix unique sans promo, ou quand la promo saisie est incomplète", () => {
    const single = {
      steps: [{ period: "Toute la période de réservation", priceCents: 3500, isPromotion: false }],
      savingCents: 0,
      savingPercent: 0,
    };

    expect(describePriceSchedule({ ...PROMOTION, hasPromotion: false })).toEqual(single);
    expect(describePriceSchedule({ ...PROMOTION, promotionalUnitPrice: "" })).toEqual(single);
    expect(describePriceSchedule({ ...PROMOTION, promotionalUnitPrice: "40" })).toEqual(single);
    expect(describePriceSchedule({ ...PROMOTION, promotionStartDate: "2026-12-05" })).toEqual(
      single,
    );
  });

  it("ne montre rien tant que le prix normal n'est pas valide", () => {
    expect(describePriceSchedule({ ...PROMOTION, unitPrice: "trente" })).toBeNull();
  });
});
