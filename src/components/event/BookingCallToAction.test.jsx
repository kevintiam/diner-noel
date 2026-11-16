import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import BookingCallToAction from "./BookingCallToAction";

/** @param {Partial<import("@/validation/event.schema").EventOverview>} overrides */
function buildOverview(overrides) {
  return /** @type {any} */ ({
    seatsLeft: 10,
    isBookingOpen: true,
    isClosedByDeadline: false,
    ...overrides,
  });
}

describe("BookingCallToAction", () => {
  it("mène au formulaire de la même langue quand les réservations sont ouvertes", () => {
    render(<BookingCallToAction overview={buildOverview({})} lang="en" dictionary={en} />);

    expect(screen.getByRole("link", { name: "Book my seat" })).toHaveAttribute(
      "href",
      "/en/reservation",
    );
  });

  it("annonce que le dîner est complet, sans bouton", () => {
    render(
      <BookingCallToAction
        overview={buildOverview({ seatsLeft: 0, isBookingOpen: false })}
        lang="fr"
        dictionary={fr}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Le dîner est complet");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("annonce la fermeture une fois la date limite passée", () => {
    render(
      <BookingCallToAction
        overview={buildOverview({ isBookingOpen: false, isClosedByDeadline: true })}
        lang="fr"
        dictionary={fr}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Les réservations sont fermées.");
  });
});
