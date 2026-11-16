import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LanguageSwitcher, { switchPathLanguage } from "./LanguageSwitcher";

vi.mock("next/navigation", () => ({ usePathname: () => "/fr" }));

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
