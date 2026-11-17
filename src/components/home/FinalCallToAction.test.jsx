import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import FinalCallToAction from "./FinalCallToAction";
import SeatsProgress from "./SeatsProgress";
import { buildOverview } from "./home-test-data";

describe("FinalCallToAction", () => {
  it("affiche les places restantes sur la capacité, la barre et le bouton", () => {
    render(
      <FinalCallToAction overview={buildOverview({ seatsLeft: 38 })} lang="fr" dictionary={fr} />,
    );

    expect(screen.queryByText(/places restantes/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Réserver ma place" })).toBeInTheDocument();
  });

  it("accorde au singulier en anglais", () => {
    render(
      <FinalCallToAction overview={buildOverview({ seatsLeft: 1 })} lang="en" dictionary={en} />,
    );

    expect(screen.queryByText(/seat left/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book my seat" })).toBeInTheDocument();
  });

  it("annonce « complet » sans nombre de places quand il n'en reste aucune", () => {
    const overview = buildOverview({ seatsLeft: 0, isBookingOpen: false });

    render(<FinalCallToAction overview={overview} lang="fr" dictionary={fr} />);

    expect(screen.queryByText(/places restantes/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Le dîner est complet");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("SeatsProgress", () => {
  it("remplit la barre selon les places prises, sans dépasser 100 %", () => {
    const { container } = render(<SeatsProgress taken={130} capacity={120} label="Places" />);

    expect(container.querySelector("[role=progressbar] > div")).toHaveStyle({ width: "100%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "120");
  });

  it("ne divise jamais par zéro", () => {
    const { container } = render(<SeatsProgress taken={0} capacity={0} label="Places" />);

    expect(container.querySelector("[role=progressbar] > div")).toHaveStyle({ width: "0%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("ramène un nombre négatif de places prises à zéro", () => {
    const { container } = render(<SeatsProgress taken={-1} capacity={120} label="Places" />);

    expect(container.querySelector("[role=progressbar] > div")).toHaveStyle({ width: "0%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
