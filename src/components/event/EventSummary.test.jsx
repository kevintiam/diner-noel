import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import EventSummary from "./EventSummary";

/** @param {Partial<import("@/validation/event.schema").EventOverview>} overrides */
function buildOverview(overrides = {}) {
  return {
    startsAt: new Date("2026-12-19T23:00:00.000Z"),
    bookingDeadline: new Date("2026-12-13T04:59:00.000Z"),
    venueName: "Salle fictive",
    venueAddress: "1 rue Exemple, Ottawa",
    unitPriceCents: 2500,
    capacity: 120,
    seatsLeft: 120,
    ...overrides,
  };
}

// Les espaces insécables d'Intl sont traités comme des espaces ordinaires.
/** @param {string} text */
const loose = (text) => new RegExp(text.replace(/[$.]/g, "\\$&").replace(/ /g, "\\s"));

describe("EventSummary", () => {
  it("affiche la date, le lieu, le prix et les places en français", () => {
    render(<EventSummary overview={buildOverview()} lang="fr" dictionary={fr} />);

    expect(screen.getByText(loose("samedi 19 décembre 2026 à 18 h 00"))).toBeInTheDocument();
    expect(screen.getByText(/Salle fictive/)).toBeInTheDocument();
    expect(screen.getByText(loose("25,00 $"))).toBeInTheDocument();
    expect(screen.getByText("120 places restantes")).toBeInTheDocument();
  });

  it("affiche les mêmes informations en anglais", () => {
    render(<EventSummary overview={buildOverview()} lang="en" dictionary={en} />);

    expect(screen.getByText(loose("Saturday, December 19, 2026 at 6:00 p.m."))).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("120 seats left")).toBeInTheDocument();
  });

  it("accorde au singulier quand il reste une seule place", () => {
    render(<EventSummary overview={buildOverview({ seatsLeft: 1 })} lang="fr" dictionary={fr} />);

    expect(screen.getByText("1 place restante")).toBeInTheDocument();
  });

  it("affiche « Complet » quand il ne reste aucune place", () => {
    render(<EventSummary overview={buildOverview({ seatsLeft: 0 })} lang="fr" dictionary={fr} />);

    expect(screen.getByText("Complet")).toBeInTheDocument();
    expect(screen.queryByText(/places restantes/)).not.toBeInTheDocument();
  });

  it("affiche « Sold out » en anglais", () => {
    render(<EventSummary overview={buildOverview({ seatsLeft: 0 })} lang="en" dictionary={en} />);

    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });
});
