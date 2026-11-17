import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminTabs, { isTabActive } from "./AdminTabs";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/admin/reservations/res_1") }));

describe("AdminTabs", () => {
  it("garde l'onglet « Réservations » actif sur une fiche", () => {
    render(<AdminTabs />);

    expect(screen.getByRole("link", { name: "Réservations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Vue d’ensemble" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("n'active la vue d'ensemble que sur /admin exactement", () => {
    expect(isTabActive("/admin", "/admin")).toBe(true);
    expect(isTabActive("/admin/reservations", "/admin")).toBe(false);
    expect(isTabActive("/admin/reservations-archive", "/admin/reservations")).toBe(false);
  });

  it("propose l'onglet « Paramètres »", () => {
    render(<AdminTabs />);

    expect(screen.getByRole("link", { name: "Paramètres" })).toHaveAttribute(
      "href",
      "/admin/parametres",
    );
    expect(isTabActive("/admin/parametres", "/admin/parametres")).toBe(true);
  });
});
