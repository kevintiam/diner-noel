import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import PaymentInstructions from "./PaymentInstructions";

const RESERVATION = {
  code: "NOEL-4821",
  status: "PENDING_PAYMENT",
  seats: 2,
  childSeats: 0,
  unitPriceCents: 2500,
  amountCents: 5000,
  interacEmail: "paiements@example.org",
};

// Les espaces insécables d'Intl sont traités comme des espaces ordinaires.
/** @param {string} text */
const loose = (text) => new RegExp(text.replace(/[$.]/g, "\\$&").replace(/ /g, "\\s"));

describe("PaymentInstructions", () => {
  it("affiche le montant, le détail, l'adresse Interac, le code et l'absence de remboursement", () => {
    render(<PaymentInstructions reservation={RESERVATION} lang="fr" dictionary={fr} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Payez par virement Interac" }),
    ).toBeInTheDocument();
    expect(screen.getByText(loose("50,00 $"))).toBeInTheDocument();
    expect(screen.getByText(loose("2 personnes de 15 ans et plus × 25,00 $"))).toBeInTheDocument();
    expect(screen.getByText("paiements@example.org")).toBeInTheDocument();
    expect(screen.getByText("NOEL-4821")).toBeInTheDocument();
    expect(screen.getByText("Aucun remboursement après le virement.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copier" })).toHaveLength(2);
    expect(screen.getByText("Étape 2 sur 2")).toBeInTheDocument();
  });

  it("accorde au singulier pour une seule place, en anglais", () => {
    render(
      <PaymentInstructions
        reservation={{ ...RESERVATION, seats: 1, amountCents: 2500 }}
        lang="en"
        dictionary={en}
      />,
    );

    expect(screen.getByText("1 person aged 15 and over × $25.00")).toBeInTheDocument();
    expect(screen.getByText("No refunds once the transfer is sent.")).toBeInTheDocument();
  });
});
