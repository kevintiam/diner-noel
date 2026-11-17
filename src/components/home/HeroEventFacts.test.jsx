import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import HeroEventFacts from "./HeroEventFacts";
import HomeHero, { HomeHeroPlaceholder } from "./HomeHero";
import { buildOverview, loose } from "./home-test-data";

const INITIAL_NOW = Date.parse("2026-11-15T12:00:00.000Z");

describe("HomeHero", () => {
  it("annonce le chargement des informations dans les emplacements réservés", () => {
    render(<HomeHeroPlaceholder dictionary={fr} />);

    expect(screen.getByRole("status")).toHaveTextContent(fr.home.loading);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("affiche le titre et l'invitation selon le design Noël de Grâce", () => {
    render(<HomeHero dictionary={fr} />);

    expect(screen.getByRole("heading", { level: 1, name: fr.home.title })).toBeInTheDocument();
    expect(screen.getByText(fr.hero.subtitle)).toBeInTheDocument();
  });

  it("affiche l'invitation et le titre en anglais", () => {
    render(<HomeHero dictionary={en} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Christmas Dinner 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.hero.subtitle)).toBeInTheDocument();
  });
});

describe("HeroEventFacts", () => {
  it("regroupe la date, le lieu, les tarifs par âge et la réservation", () => {
    render(
      <HeroEventFacts
        overview={buildOverview()}
        lang="fr"
        dictionary={fr}
        initialNow={INITIAL_NOW}
      />,
    );

    expect(screen.getByText("Samedi 19 décembre 2026")).toBeInTheDocument();
    expect(screen.getByText(loose("À 18 h"))).toBeInTheDocument();
    expect(screen.getByText("Salle fictive, Nepean")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réserver ma place" })).toHaveAttribute(
      "href",
      "/fr/reservation",
    );
    expect(
      screen.getByText(new RegExp("^" + loose("35 $ par personne de 15 ans et plus").source + "$")),
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("christmas-table"),
    );
    expect(screen.getByRole("heading", { name: "Tarifs et réservation" })).toBeInTheDocument();
    expect(screen.getByText("Gratuit pour les enfants de 0 à 14 ans")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/places restantes|capacité maximale/i)).not.toBeInTheDocument();
  });

  it("parle anglais et écrit les minutes d'une heure non ronde", () => {
    const overview = buildOverview({ startsAt: new Date("2026-12-19T23:30:00.000Z") });

    render(
      <HeroEventFacts overview={overview} lang="en" dictionary={en} initialNow={INITIAL_NOW} />,
    );

    expect(screen.getByText("Saturday, December 19, 2026")).toBeInTheDocument();
    expect(screen.getByText(loose("At 6:30 p.m."))).toBeInTheDocument();
    expect(screen.getByText("$35 per person aged 15 and over")).toBeInTheDocument();
  });

  it("accorde au singulier quand il reste une place", () => {
    render(
      <HeroEventFacts
        overview={buildOverview({ seatsLeft: 1 })}
        lang="fr"
        dictionary={fr}
        initialNow={INITIAL_NOW}
      />,
    );

    expect(
      screen.getByText(new RegExp("^" + loose("35 $ par personne de 15 ans et plus").source + "$")),
    ).toBeInTheDocument();
  });

  it("remplace le bouton par « complet » et n'affiche plus que le prix", () => {
    const overview = buildOverview({ seatsLeft: 0, isBookingOpen: false });

    render(
      <HeroEventFacts overview={overview} lang="fr" dictionary={fr} initialNow={INITIAL_NOW} />,
    );

    expect(screen.queryByRole("link", { name: "Réserver ma place" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Le dîner est complet");
    expect(
      screen.getByText(new RegExp("^" + loose("35 $ par personne de 15 ans et plus").source + "$")),
    ).toBeInTheDocument();
  });

  it("annonce la fermeture une fois la date limite passée", () => {
    const overview = buildOverview({ isBookingOpen: false, isClosedByDeadline: true });

    render(
      <HeroEventFacts overview={overview} lang="fr" dictionary={fr} initialNow={INITIAL_NOW} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Les réservations sont fermées.");
  });
});
