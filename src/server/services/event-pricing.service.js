import { eventPricingSchema, pricingInstantSchema } from "../../validation/event.schema.js";

/**
 * Choisit le tarif pour un instant précis, avec une fin de promotion exclue.
 * @param {import("../../validation/event.schema.js").EventPricing} pricing Tarifs et calendrier UTC.
 * @param {Date} now Instant de la demande.
 * @returns {number} Prix par personne de 15 ans et plus, en cents.
 * @throws {Error} Si le calendrier, le prix ou l'instant est invalide.
 */
export function getEffectiveUnitPrice(pricing, now) {
  const values = eventPricingSchema.parse(pricing);
  pricingInstantSchema.parse(now);
  if (
    values.promotionalUnitPriceCents != null &&
    values.promotionStartsAt &&
    values.promotionEndsAt &&
    now >= values.promotionStartsAt &&
    now < values.promotionEndsAt
  ) {
    return values.promotionalUnitPriceCents;
  }
  return values.unitPriceCents;
}
