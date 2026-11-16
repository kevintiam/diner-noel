// Événement de départ. VALEURS FICTIVES (brief §13) : à remplacer par les
// vraies valeurs avant la mise en ligne, puis relancer `npm run db:seed`.
// Ne plus relancer le seed en production une fois l'écran Paramètres en place :
// il écraserait les changements des organisateurs.
import { localDateTimeToUtc } from "../src/lib/dates.js";
import { upsertSingleEvent } from "../src/server/db/event.repository.js";

export const DEFAULT_EVENT = {
  startsAtLocalDate: "2026-12-19",
  startsAtLocalTime: "18:00",
  bookingDeadlineLocalDate: "2026-12-12",
  bookingDeadlineLocalTime: "23:59",
  capacity: 120,
  unitPriceCents: 3500,
  promotionalUnitPriceCents: 3000,
  promotionStartsAt: new Date("2026-11-20T05:00:00Z"),
  promotionEndsAt: new Date("2026-12-04T05:00:00Z"),
  venueName: "ICC Ottawa",
  venueAddress: "75 Auriga Drive, Nepean",
  interacEmail: "paiements@example.org",
};

/**
 * Crée l'événement de départ, ou le remet aux valeurs ci-dessus s'il existe déjà.
 * @returns {Promise<void>}
 */
export async function seedDefaultEvent() {
  await upsertSingleEvent({
    startsAt: localDateTimeToUtc(DEFAULT_EVENT.startsAtLocalDate, DEFAULT_EVENT.startsAtLocalTime),
    bookingDeadline: localDateTimeToUtc(
      DEFAULT_EVENT.bookingDeadlineLocalDate,
      DEFAULT_EVENT.bookingDeadlineLocalTime,
    ),
    capacity: DEFAULT_EVENT.capacity,
    unitPriceCents: DEFAULT_EVENT.unitPriceCents,
    promotionalUnitPriceCents: DEFAULT_EVENT.promotionalUnitPriceCents,
    promotionStartsAt: DEFAULT_EVENT.promotionStartsAt,
    promotionEndsAt: DEFAULT_EVENT.promotionEndsAt,
    venueName: DEFAULT_EVENT.venueName,
    venueAddress: DEFAULT_EVENT.venueAddress,
    interacEmail: DEFAULT_EVENT.interacEmail,
  });
}
