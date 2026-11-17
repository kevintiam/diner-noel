// Données de l'événement échangées entre les couches.
// Le schéma Zod des paramètres modifiables arrivera avec l'écran Paramètres (épopée 3).
import { z } from "zod";

export const pricingInstantSchema = z.date();

export const eventPricingSchema = z
  .object({
    unitPriceCents: z.number().int().nonnegative(),
    promotionalUnitPriceCents: z.number().int().nonnegative().nullish(),
    promotionStartsAt: z.date().nullish(),
    promotionEndsAt: z.date().nullish(),
  })
  .superRefine((pricing, context) => {
    const values = [
      pricing.promotionalUnitPriceCents,
      pricing.promotionStartsAt,
      pricing.promotionEndsAt,
    ];
    if (values.every((value) => value === null || value === undefined)) return;
    if (
      values.some((value) => value === null || value === undefined) ||
      pricing.promotionStartsAt >= pricing.promotionEndsAt
    ) {
      context.addIssue({ code: "custom", message: "Calendrier promotionnel invalide." });
    }
  });

/** @typedef {z.infer<typeof eventPricingSchema>} EventPricing */

/**
 * Valeurs de l'unique événement, telles que stockées (heures en UTC, argent en cents).
 * @typedef {object} EventValues
 * @property {Date} startsAt Début du dîner.
 * @property {Date} bookingDeadline Fin des réservations, toujours avant le dîner.
 * @property {number} capacity Nombre total de places.
 * @property {number} unitPriceCents Prix d'une place, en cents.
 * @property {number | null} [promotionalUnitPriceCents] Tarif promotionnel.
 * @property {Date | null} [promotionStartsAt] Début inclus de la promotion.
 * @property {Date | null} [promotionEndsAt] Fin exclue de la promotion.
 * @property {string} venueName Nom du lieu.
 * @property {string} venueAddress Adresse du lieu.
 * @property {string} interacEmail Courriel qui reçoit les virements Interac.
 */

/**
 * Ce que la réservation lit de l'événement, verrouillé dans la transaction (architecture AD-5).
 * @typedef {object} LockedEvent
 * @property {string} id
 * @property {number} capacity Nombre total de places.
 * @property {number} unitPriceCents Prix d'une place, en cents.
 * @property {number | null} [promotionalUnitPriceCents]
 * @property {Date | null} [promotionStartsAt]
 * @property {Date | null} [promotionEndsAt]
 * @property {string} interacEmail Courriel qui reçoit les virements Interac.
 * @property {Date} bookingDeadline Fin des réservations.
 */

/**
 * Ce que l'accueil affiche de l'événement.
 * @typedef {object} EventOverview
 * @property {Date} startsAt Début du dîner.
 * @property {Date} bookingDeadline Fin des réservations.
 * @property {string} venueName Nom du lieu.
 * @property {string} venueAddress Adresse du lieu.
 * @property {number} unitPriceCents Prix d'une place, en cents.
 * @property {number} normalUnitPriceCents Tarif normal.
 * @property {number | null} promotionalUnitPriceCents Tarif promotionnel.
 * @property {Date | null} promotionStartsAt Début inclus.
 * @property {Date | null} promotionEndsAt Fin exclue.
 * @property {number} capacity Nombre total de places.
 * @property {number} takenSeats Places déjà prises (réservations non annulées, AD-4).
 * @property {number} seatsLeft Places encore libres (jamais négatif).
 * @property {boolean} isClosedByDeadline Vrai une fois la date limite passée.
 * @property {boolean} isBookingOpen Vrai avant la date limite s'il reste au moins une place.
 */

export {};
