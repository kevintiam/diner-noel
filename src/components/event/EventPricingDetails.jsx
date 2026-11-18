import { translate } from "@/i18n/translate";
import { formatMoney, formatEventDateTime } from "@/lib/format";

/**
 * Présente le tarif actif et le calendrier distinct de la promotion.
 * @param {{ overview: import("@/validation/event.schema").EventOverview, lang: string, dictionary: import("@/i18n/translate").Dictionary, isCompact?: boolean }} props
 * @returns {React.ReactElement} Les informations tarifaires par âge.
 */
export default function EventPricingDetails({ overview, lang, dictionary, isCompact = false }) {
  /** @param {number} price */
  const formatPrice = (price) => formatMoney(price, lang, { omitZeroCents: true });
  const { promotionStartsAt, promotionEndsAt, promotionalUnitPriceCents } = overview;
  const promotionDetails =
    promotionStartsAt && promotionEndsAt && promotionalUnitPriceCents !== null ? (
      <>
        <p>
          {translate(dictionary, "pricing.promotion", {
            price: formatPrice(promotionalUnitPriceCents),
            start: formatEventDateTime(promotionStartsAt, lang),
            end: formatEventDateTime(promotionEndsAt, lang),
          })}
        </p>
        <p>
          {translate(dictionary, "pricing.regular", {
            price: formatPrice(overview.normalUnitPriceCents),
          })}
        </p>
      </>
    ) : null;
  return (
    <div>
      <p>
        {translate(dictionary, "pricing.current", { price: formatPrice(overview.unitPriceCents) })}
      </p>
      <p>{translate(dictionary, "pricing.children")}</p>
      {isCompact && promotionDetails ? (
        <details>
          <summary>{translate(dictionary, "pricing.details")}</summary>
          {promotionDetails}
        </details>
      ) : (
        promotionDetails
      )}
    </div>
  );
}
