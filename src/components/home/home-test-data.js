// Données fictives communes aux tests des sections de l'accueil.

/**
 * Construit un aperçu d'événement fictif.
 * @param {Partial<import("@/validation/event.schema").EventOverview>} [overrides]
 * @returns {import("@/validation/event.schema").EventOverview}
 */
export function buildOverview(overrides = {}) {
  return {
    startsAt: new Date("2026-12-19T23:00:00.000Z"),
    bookingDeadline: new Date("2026-12-13T04:59:00.000Z"),
    venueName: "Salle fictive",
    venueAddress: "1 rue Exemple, Nepean",
    unitPriceCents: 3500,
    normalUnitPriceCents: 3500,
    promotionalUnitPriceCents: 3000,
    promotionStartsAt: new Date("2026-11-20T05:00:00Z"),
    promotionEndsAt: new Date("2026-12-04T05:00:00Z"),
    takenSeats: 0,
    capacity: 120,
    seatsLeft: 120,
    isClosedByDeadline: false,
    isBookingOpen: true,
    ...overrides,
  };
}

/**
 * Accepte les espaces insécables d'Intl comme des espaces ordinaires.
 * @param {string} text
 * @returns {RegExp}
 */
export function loose(text) {
  return new RegExp(text.replace(/[$.()]/g, "\\$&").replace(/ /g, "\\s"));
}
