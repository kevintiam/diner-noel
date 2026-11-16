import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import fr from "@/i18n/dictionaries/fr.json";
import en from "@/i18n/dictionaries/en.json";
import { buildOverview } from "@/components/home/home-test-data";
import EventPricingDetails from "./EventPricingDetails";

for (const lang of ["fr", "en"]) {
  const dictionary = lang === "fr" ? fr : en;
  describe(`informations tarifaires en ${lang}`, () => {
    it("déplie les détails promotionnels à la demande dans la présentation compacte", () => {
      render(
        <EventPricingDetails
          overview={buildOverview()}
          lang={lang}
          dictionary={dictionary}
          isCompact
        />,
      );
      const promotion = screen.getByText(/^Promotion/);
      expect(promotion).not.toBeVisible();
      expect(screen.getByText(dictionary.pricing.children)).toBeVisible();

      fireEvent.click(screen.getByText(dictionary.pricing.details));

      expect(promotion).toBeVisible();
    });

    it("omet le dépliant lorsqu’aucune promotion n’est configurée", () => {
      const overview = buildOverview({ promotionStartsAt: null, promotionEndsAt: null });
      render(
        <EventPricingDetails overview={overview} lang={lang} dictionary={dictionary} isCompact />,
      );

      expect(screen.queryByText(dictionary.pricing.details)).not.toBeInTheDocument();
      expect(screen.getByText(dictionary.pricing.children)).toBeVisible();
    });

    it.each([3000, 3500])(
      "présente le tarif actif %s et la période promotionnelle distincte",
      (unitPriceCents) => {
        render(
          <EventPricingDetails
            overview={buildOverview({ unitPriceCents })}
            lang={lang}
            dictionary={dictionary}
          />,
        );
        expect(screen.getByText(dictionary.pricing.children)).toBeInTheDocument();
        const promotion = screen.getByText(/Promotion/);
        expect(promotion).toHaveTextContent(lang === "fr" ? /30\s\$/ : "$30");
        expect(promotion).toHaveTextContent(lang === "fr" ? "20 novembre" : "November 20");
        expect(promotion).toHaveTextContent(lang === "fr" ? "4 décembre" : "December 4");
        expect(promotion).toHaveTextContent(lang === "fr" ? "00 h 00" : "12:00 a.m.");
        expect(promotion).toHaveTextContent("Ottawa");
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      },
    );
  });
}
