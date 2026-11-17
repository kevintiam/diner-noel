import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr" }));

describe("SiteHeader", () => {
  it("mène à l'accueil, propose l'anglais et mène au formulaire", () => {
    render(<SiteHeader lang="fr" dictionary={fr} />);

    expect(
      screen.getByRole("link", { name: "Dîner de Noël 2026, retour à l'accueil" }),
    ).toHaveAttribute("href", "/fr");
    expect(screen.getByRole("link", { name: "Informations" })).toHaveAttribute(
      "href",
      "/fr#informations",
    );
    expect(screen.getByRole("link", { name: "Réservation" })).toHaveAttribute(
      "href",
      "/fr#reservation",
    );
    const navigation = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/fr#faq");
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: "Réserver" })).toHaveAttribute(
      "href",
      "/fr/reservation",
    );
  });
});

describe("SiteFooter", () => {
  it("donne l'adresse de contact et la mention, en anglais", () => {
    render(<SiteFooter dictionary={en} />);

    expect(screen.getByRole("link", { name: "contact@example.org" })).toHaveAttribute(
      "href",
      "mailto:contact@example.org",
    );
    expect(screen.getByText("© 2026 ICC Ottawa")).toBeInTheDocument();
  });
});
