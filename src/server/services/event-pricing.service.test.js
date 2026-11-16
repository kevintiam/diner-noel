import { describe, expect, it } from "vitest";
import { getEffectiveUnitPrice } from "./event-pricing.service.js";

const PRICING = {
  unitPriceCents: 3500,
  promotionalUnitPriceCents: 3000,
  promotionStartsAt: new Date("2026-11-20T05:00:00Z"),
  promotionEndsAt: new Date("2026-12-04T05:00:00Z"),
};

describe("getEffectiveUnitPrice", () => {
  it.each([
    ["2026-11-20T04:59:59.999Z", 3500],
    ["2026-11-20T05:00:00Z", 3000],
    ["2026-12-04T04:59:59.999Z", 3000],
    ["2026-12-04T05:00:00Z", 3500],
  ])("applique la borne d'Ottawa à %s", (date, price) => {
    expect(getEffectiveUnitPrice(PRICING, new Date(date))).toBe(price);
  });

  it("garde le tarif normal sans calendrier promotionnel", () => {
    expect(getEffectiveUnitPrice({ unitPriceCents: 3500 }, new Date())).toBe(3500);
  });

  it("refuse un prix ou un calendrier incohérent", () => {
    expect(() => getEffectiveUnitPrice({ ...PRICING, unitPriceCents: -1 }, new Date())).toThrow();
    expect(() =>
      getEffectiveUnitPrice({ ...PRICING, promotionEndsAt: null }, new Date()),
    ).toThrow();
    expect(() => getEffectiveUnitPrice(PRICING, new Date("invalide"))).toThrow();
  });
});
