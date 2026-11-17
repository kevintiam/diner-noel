import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReservationFilters, { buildListHref } from "./ReservationFilters";

// <Form> de Next a besoin du routeur de l'application ; un formulaire simple suffit ici.
vi.mock("next/form", () => ({
  default: (/** @type {React.ComponentProps<"form">} */ props) => <form {...props} />,
}));

const COUNTS = { ALL: 12, TO_VERIFY: 3, PENDING_PAYMENT: 2, CONFIRMED: 6, CANCELLED: 1 };

/** Lit ce que le formulaire de recherche enverrait. */
function readSearchForm() {
  return new FormData(/** @type {HTMLFormElement} */ (screen.getByRole("search")));
}

describe("buildListHref", () => {
  it("n'ajoute que les paramètres utiles", () => {
    expect(buildListHref(null, "")).toBe("/admin/reservations");
    expect(buildListHref("TO_VERIFY", "")).toBe("/admin/reservations?status=TO_VERIFY");
    expect(buildListHref("CONFIRMED", "noël fictif")).toBe(
      "/admin/reservations?status=CONFIRMED&q=no%C3%ABl+fictif",
    );
  });
});

describe("ReservationFilters", () => {
  it("marque le statut choisi et garde la recherche dans chaque pastille", () => {
    render(
      <ReservationFilters filter={{ status: "TO_VERIFY", query: "fictif" }} counts={COUNTS} />,
    );

    const nav = screen.getByRole("navigation", { name: "Filtrer par statut" });
    const active = within(nav).getByRole("link", { name: "À vérifier 3" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Toutes 12" })).toHaveAttribute(
      "href",
      "/admin/reservations?q=fictif",
    );
    expect(within(nav).getByRole("link", { name: "Toutes 12" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("préremplit la recherche, garde le statut et propose de l'effacer", () => {
    render(
      <ReservationFilters filter={{ status: "CONFIRMED", query: "fictif" }} counts={COUNTS} />,
    );

    expect(screen.getByRole("searchbox", { name: "Rechercher une réservation" })).toHaveValue(
      "fictif",
    );
    expect(readSearchForm().get("status")).toBe("CONFIRMED");
    expect(screen.getByRole("link", { name: "Effacer la recherche" })).toHaveAttribute(
      "href",
      "/admin/reservations?status=CONFIRMED",
    );
  });

  it("n'envoie aucun statut et ne propose pas d'effacer sans filtre", () => {
    render(<ReservationFilters filter={{ status: null, query: "" }} counts={COUNTS} />);

    expect(readSearchForm().get("status")).toBeNull();
    expect(screen.queryByRole("link", { name: "Effacer la recherche" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Toutes 12" })).toHaveAttribute("aria-current", "page");
  });
});
