-- Évolution additive : les anciennes réservations conservent leurs valeurs figées.
ALTER TABLE "Event"
  ADD COLUMN "promotionalUnitPriceCents" INTEGER,
  ADD COLUMN "promotionStartsAt" TIMESTAMP(3),
  ADD COLUMN "promotionEndsAt" TIMESTAMP(3);

ALTER TABLE "Reservation" ADD COLUMN "childSeats" INTEGER NOT NULL DEFAULT 0;

-- Seule la tarification de l'événement change ; les autres paramètres restent intacts.
UPDATE "Event" SET
  "unitPriceCents" = 3500,
  "promotionalUnitPriceCents" = 3000,
  "promotionStartsAt" = '2026-11-20T05:00:00Z',
  "promotionEndsAt" = '2026-12-04T05:00:00Z';
