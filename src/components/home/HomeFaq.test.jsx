import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import HomeFaq from "./HomeFaq";

describe("HomeFaq", () => {
  it("permet de consulter les trois règles existantes sans adresse de paiement fictive", () => {
    const { container } = render(<HomeFaq dictionary={fr} />);
    const section = screen.getByRole("region", { name: "Questions fréquentes" });
    const summary = within(section).getByText("Comment régler ma réservation ?");
    fireEvent.click(summary);
    const paymentQuestion = summary.closest("details");
    expect(paymentQuestion).toHaveAttribute("open");
    expect(paymentQuestion).toHaveTextContent("virement Interac");
    expect(container.querySelectorAll("details")).toHaveLength(3);
    expect(section).toHaveTextContent("lien personnel");
    expect(section).toHaveTextContent("Aucun remboursement après le virement.");
    expect(section.textContent).not.toMatch(/48 heures|finances@|Emmanuel/);
  });

  it("présente les mêmes règles en anglais", () => {
    render(<HomeFaq dictionary={en} />);
    const section = screen.getByRole("region", { name: "Frequently asked questions" });
    expect(section).toHaveTextContent("Interac e-Transfer");
    expect(section).toHaveTextContent("personal booking link");
    expect(section).toHaveTextContent("No refunds once the transfer is sent.");
  });
});
