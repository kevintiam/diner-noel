import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import HowToBook from "./HowToBook";
import PracticalInfoCards from "./PracticalInfoCards";
import { buildOverview, loose } from "./home-test-data";

describe("PracticalInfoCards", () => {
  it("affiche la date, l’heure, l’adresse et la tenue dans quatre informations pratiques", () => {
    render(<PracticalInfoCards overview={buildOverview()} lang="fr" dictionary={fr} />);

    expect(screen.getByText("Tous aux couleurs de Noël")).toBeInTheDocument();
    const section = screen.getByRole("region", { name: "Informations pratiques" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(4);
    expect(within(section).getByText("Samedi 19 décembre 2026")).toBeInTheDocument();
    expect(within(section).getByText(loose("Début à 18 h"))).toBeInTheDocument();
    expect(within(section).getByText("Salle fictive")).toBeInTheDocument();
    expect(within(section).getByText("1 rue Exemple, Nepean")).toBeInTheDocument();
  });

  it("parle anglais", () => {
    render(<PracticalInfoCards overview={buildOverview()} lang="en" dictionary={en} />);

    expect(screen.getByText("Everyone in Christmas colours")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practical information" })).toBeInTheDocument();
    expect(screen.getByText(loose("Starts at 6 p.m."))).toBeInTheDocument();
  });
});

describe("HowToBook", () => {
  it("affiche les 3 étapes numérotées dans l'ordre", () => {
    render(<HowToBook dictionary={fr} />);

    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("Remplissez le formulaire");
    expect(steps[1]).toHaveTextContent("Faites le virement Interac");
    expect(steps[2]).toHaveTextContent("Envoyez la capture d'écran");
  });
});
