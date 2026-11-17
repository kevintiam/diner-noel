import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TodoCallout from "./TodoCallout";

describe("TodoCallout", () => {
  it("annonce les paiements à vérifier avec un accès à la liste filtrée", () => {
    render(<TodoCallout toVerifyCount={3} />);

    expect(screen.getByRole("heading", { name: "3 paiements à vérifier" })).toBeInTheDocument();
    expect(screen.getByText("Comparez-les avec les virements Interac reçus.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vérifier les paiements" })).toHaveAttribute(
      "href",
      "/admin/reservations?status=TO_VERIFY",
    );
  });

  it("accorde au singulier pour un seul paiement", () => {
    render(<TodoCallout toVerifyCount={1} />);

    expect(screen.getByRole("heading", { name: "1 paiement à vérifier" })).toBeInTheDocument();
    expect(screen.getByText("Comparez-le avec le virement Interac reçu.")).toBeInTheDocument();
  });

  it("se réduit à une ligne sans bouton quand tout est à jour", () => {
    render(<TodoCallout toVerifyCount={0} />);

    expect(screen.getByText("Tout est à jour")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
