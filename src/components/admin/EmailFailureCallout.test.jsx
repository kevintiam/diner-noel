import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmailFailureCallout from "./EmailFailureCallout";

const FAILURE = {
  id: "f1",
  kind: /** @type {const} */ ("REFUSAL"),
  createdAt: new Date("2026-11-17T22:25:00.000Z"),
  reservation: { id: "res_1", code: "NOEL-4821", firstName: "Prénom", lastName: "Fictif" },
};

describe("EmailFailureCallout", () => {
  it("disparaît quand aucun courriel n'attend d'être traité", () => {
    const { container } = render(<EmailFailureCallout failures={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("mène à la fiche de chaque personne à prévenir", () => {
    render(<EmailFailureCallout failures={[FAILURE]} />);

    expect(screen.getByRole("heading", { name: "1 courriel non envoyé" })).toBeInTheDocument();
    expect(
      screen.getByText("Cette personne n’a pas reçu son courriel : prévenez-la directement."),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /NOEL-4821.*Prénom Fictif.*Avis de refus/ });
    expect(link).toHaveAttribute("href", "/admin/reservations/res_1");
    expect(link).toHaveTextContent("17 nov. 2026, 17 h 25");
  });

  it("accorde au pluriel", () => {
    render(<EmailFailureCallout failures={[FAILURE, { ...FAILURE, id: "f2", kind: "RECEIPT" }]} />);

    expect(screen.getByRole("heading", { name: "2 courriels non envoyés" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
