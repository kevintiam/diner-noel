import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LanguageSwitcher, { LanguageToggle, switchPathLanguage } from "./LanguageSwitcher";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr/reservation" }));

describe("switchPathLanguage", () => {
  it("remplace la langue de l'accueil", () => {
    expect(switchPathLanguage("/fr", "en")).toBe("/en");
  });

  it("garde le reste de l'adresse", () => {
    expect(switchPathLanguage("/en/r/abc", "fr")).toBe("/fr/r/abc");
  });
});

describe("LanguageToggle", () => {
  it("affiche FR puis EN, la langue en cours marquée active", () => {
    render(
      <LanguageToggle
        lang="en"
        otherHref="/fr"
        label="Change language"
        otherLanguageName="Français"
      />,
    );

    const current = screen.getByText("EN");
    expect(current).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Français" })).toHaveTextContent("FR");
    expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr");
  });
});

describe("LanguageSwitcher", () => {
  it("mène à la même page dans l'autre langue", () => {
    render(<LanguageSwitcher lang="fr" label="Changer de langue" otherLanguageName="English" />);

    const link = screen.getByRole("link", { name: "English" });
    expect(link).toHaveAttribute("href", "/en/reservation");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(screen.getByRole("navigation", { name: "Changer de langue" })).toBeInTheDocument();
  });
});
