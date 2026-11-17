import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EventFillCard from "./EventFillCard";

// Événement fictif : dîner le 19 décembre à 18 h (heure d'Ottawa).
const EVENT = {
  startsAt: new Date("2026-12-19T23:00:00Z"),
  bookingDeadline: new Date("2026-12-13T04:59:00Z"),
  capacity: 120,
  takenSeats: 30,
  seatsLeft: 90,
  isClosedByDeadline: false,
};
const NOW = new Date("2026-11-16T15:00:00Z");

describe("EventFillCard", () => {
  it("montre le remplissage, le compte à rebours et les montants", () => {
    render(<EventFillCard event={EVENT} now={NOW} collectedCents={21000} expectedCents={3500} />);

    expect(screen.getByRole("progressbar", { name: "Places réservées" })).toHaveAttribute(
      "aria-valuenow",
      "30",
    );
    expect(screen.getByText("25 % réservé · 90 places encore libres")).toBeInTheDocument();
    expect(screen.getByText("Dans 33 jours")).toBeInTheDocument();
    expect(screen.getByText("Encaissé").nextElementSibling).toHaveTextContent(/^210\s\$$/);
    expect(screen.getByText("À recevoir").nextElementSibling).toHaveTextContent(/^35\s\$$/);
  });

  it("dit que c'est complet quand il ne reste aucune place", () => {
    render(
      <EventFillCard
        event={{ ...EVENT, takenSeats: 120, seatsLeft: 0 }}
        now={NOW}
        collectedCents={0}
        expectedCents={0}
      />,
    );

    expect(screen.getByText("Complet : plus aucune place libre")).toBeInTheDocument();
  });

  it("dit que les réservations sont fermées après la date limite", () => {
    render(
      <EventFillCard
        event={{ ...EVENT, isClosedByDeadline: true }}
        now={NOW}
        collectedCents={0}
        expectedCents={0}
      />,
    );

    expect(screen.getByText("Réservations fermées")).toBeInTheDocument();
  });
});
