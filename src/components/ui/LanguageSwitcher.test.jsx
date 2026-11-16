import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LanguageSwitcher, { LanguageLink, switchPathLanguage } from "./LanguageSwitcher";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr" }));

describe("LanguageLink", () => {
  it("affiche le lien de repli vers l'accueil de l'autre langue", () => {
    render(
      <LanguageLink
        href="/fr"
        otherLang="fr"
        label="Change language"
        otherLanguageName="Français"
      />,
    );

    expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr");
  });
});

describe("switchPathLanguage", () => {
  it("remplace la langue de l'accueil", () => {
    expect(switchPathLanguage("/fr", "en")).toBe("/en");
  });

  it("garde le reste de l'adresse", () => {
    expect(switchPathLanguage("/en/r/abc", "fr")).toBe("/fr/r/abc");
  });
});

describe("LanguageSwitcher", () => {
  it("propose l'autre langue avec son nom et sa langue déclarée", () => {
    render(<LanguageSwitcher lang="fr" label="Changer de langue" otherLanguageName="English" />);

    const link = screen.getByRole("link", { name: "English" });
    expect(link).toHaveAttribute("href", "/en");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(screen.getByRole("navigation", { name: "Changer de langue" })).toBeInTheDocument();
  });
});
