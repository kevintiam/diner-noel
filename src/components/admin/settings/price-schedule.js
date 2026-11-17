// Calendrier des prix affiché sous les champs de prix de l'écran Paramètres : ce que paie
// une personne de 15 ans et plus avant, pendant et après la promo. Calculé à partir de la saisie.
import { addDaysToLocalDate } from "@/lib/dates";
import { parsePriceInput } from "@/validation/event-settings.schema";

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PERCENT = 100;
// Les dates `AAAA-MM-JJ` sont des jours d'Ottawa : on les affiche telles quelles, sans fuseau.
const DAY_FORMATTER = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Une période du calendrier et son prix.
 * @typedef {object} PriceStep
 * @property {string} period La période, en mots (« Jusqu’au 19 nov. »).
 * @property {number} priceCents Le prix d'une place pendant cette période.
 * @property {boolean} isPromotion Vrai pour la période de promo.
 */

/**
 * Saisie lue par le calendrier, telle que tapée dans le formulaire.
 * @typedef {object} PriceScheduleInput
 * @property {string} unitPrice Prix normal, avant promo.
 * @property {boolean} hasPromotion
 * @property {string} promotionalUnitPrice Prix promo, après réduction.
 * @property {string} promotionStartDate Premier jour, `AAAA-MM-JJ`.
 * @property {string} promotionEndDate Dernier jour inclus, `AAAA-MM-JJ`.
 */

/**
 * Écrit un jour `AAAA-MM-JJ` en mots courts (« 20 nov. »).
 * @param {string} localDate
 * @returns {string}
 */
function formatDay(localDate) {
  const [year, month, day] = localDate.split("-").map(Number);
  return DAY_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Lit la promo saisie si elle est complète et cohérente ; sinon, le calendrier l'ignore.
 * @param {PriceScheduleInput} input
 * @param {number} normalCents
 * @returns {{ priceCents: number, startDate: string, endDate: string } | null}
 */
function readPromotion(input, normalCents) {
  if (!input.hasPromotion) {
    return null;
  }
  const priceCents = parsePriceInput(input.promotionalUnitPrice);
  const startDate = input.promotionStartDate;
  const endDate = input.promotionEndDate;
  const hasDates = LOCAL_DATE_PATTERN.test(startDate) && LOCAL_DATE_PATTERN.test(endDate);
  if (priceCents === null || priceCents >= normalCents || !hasDates || endDate < startDate) {
    return null;
  }
  return { priceCents, startDate, endDate };
}

/**
 * Décrit le calendrier des prix : un seul prix sans promo, sinon avant, pendant et après.
 * @param {PriceScheduleInput} input La saisie du formulaire.
 * @returns {{ steps: PriceStep[], savingCents: number, savingPercent: number } | null}
 *   Les périodes et l'économie de la promo (0 sans promo), ou null si le prix normal est invalide.
 */
export function describePriceSchedule(input) {
  const normalCents = parsePriceInput(input.unitPrice);
  if (normalCents === null) {
    return null;
  }
  const promotion = readPromotion(input, normalCents);
  if (!promotion) {
    return {
      steps: [
        { period: "Toute la période de réservation", priceCents: normalCents, isPromotion: false },
      ],
      savingCents: 0,
      savingPercent: 0,
    };
  }
  const { priceCents, startDate, endDate } = promotion;
  const promotionPeriod =
    startDate === endDate
      ? `Le ${formatDay(startDate)}`
      : `Du ${formatDay(startDate)} au ${formatDay(endDate)}`;
  const savingCents = normalCents - priceCents;
  return {
    steps: [
      {
        period: `Jusqu’au ${formatDay(addDaysToLocalDate(startDate, -1))}`,
        priceCents: normalCents,
        isPromotion: false,
      },
      { period: promotionPeriod, priceCents, isPromotion: true },
      {
        period: `Dès le ${formatDay(addDaysToLocalDate(endDate, 1))}`,
        priceCents: normalCents,
        isPromotion: false,
      },
    ],
    savingCents,
    savingPercent: normalCents === 0 ? 0 : Math.round((savingCents / normalCents) * PERCENT),
  };
}
