import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EmailFailureNotice from "./EmailFailureNotice";

vi.mock("@/server/actions/organizer.actions", () => ({
  resolveEmailFailuresAction: vi.fn(),
}));

const FAILURE = {
  id: "f1",
  kind: /** @type {const} */ ("CONFIRMATION"),
  createdAt: new Date("2026-11-17T22:25:00.000Z"),
};

describe("EmailFailureNotice", () => {
  it("n'affiche rien quand tous les courriels sont partis", () => {
    const { container } = render(<EmailFailureNotice reservationId="res_1" failures={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("nomme le courriel manqué, sa date, et propose de noter que la personne est prévenue", () => {
    render(<EmailFailureNotice reservationId="res_1" failures={[FAILURE]} />);

    expect(
      screen.getByRole("heading", { name: "Un courriel n’a pas pu partir" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent(
      /^Confirmation du paiement · 17 nov\. 2026, 17 h 25$/,
    );
    const button = screen.getByRole("button", { name: "J’ai prévenu la personne" });
    const form = button.closest("form");
    expect(form?.querySelector('input[name="reservationId"]')).toHaveValue("res_1");
  });

  it("passe au pluriel et liste chaque courriel manqué", () => {
    render(
      <EmailFailureNotice
        reservationId="res_1"
        failures={[FAILURE, { ...FAILURE, id: "f2", kind: "RECEIPT" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Des courriels n’ont pas pu partir" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Confirmation du paiement"),
      expect.stringContaining("Accusé de réception"),
    ]);
  });
});
