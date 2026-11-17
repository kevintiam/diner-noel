import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import ProofReceived from "./ProofReceived";
import ReservationStatusNotice from "./ReservationStatusNotice";

const reservation = {
  firstName: "Marie",
  code: "NOEL-1234",
  status: "TO_VERIFY",
  seats: 2,
  childSeats: 0,
  unitPriceCents: 3000,
  amountCents: 6000,
  interacEmail: "prive@example.test",
  lastName: "Secret",
  email: "secret@example.test",
};

describe("états du lien personnel", () => {
  it("accuse le dépôt avec le prénom, le code, les places et le montant seulement", () => {
    const { container } = render(
      <ProofReceived reservation={reservation} lang="fr" dictionary={getDictionary("fr")} />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Preuve de paiement reçue");
    expect(screen.getByText(/Merci Marie/)).toBeVisible();
    expect(screen.getByText("NOEL-1234")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText(/60,00/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Et maintenant ?" })).toBeVisible();
    expect(container.textContent).not.toContain("Secret");
    expect(container.textContent).not.toContain("@example.test");
    expect(container.querySelector("img, form, a[href*='proof']")).toBeNull();
  });
  it.each(["CONFIRMED", "CANCELLED"])("affiche %s sans formulaire", (status) => {
    const { container } = render(
      <ReservationStatusNotice
        reservation={{ ...reservation, status }}
        lang="en"
        dictionary={getDictionary("en")}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      status === "CONFIRMED" ? "Your reservation is confirmed" : "Your reservation is cancelled",
    );
    expect(container.querySelector("form, img")).toBeNull();
  });
});
