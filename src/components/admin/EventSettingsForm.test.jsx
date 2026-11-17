import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { updateEventSettingsAction } from "@/server/actions/event-settings.actions";
import EventSettingsForm from "./EventSettingsForm";

vi.mock("@/server/actions/event-settings.actions", () => ({
  updateEventSettingsAction: vi.fn(async () => null),
}));

const SETTINGS = {
  values: {
    startsAtDate: "2026-12-19",
    startsAtTime: "18:00",
    bookingDeadlineDate: "2026-12-12",
    venueName: "Salle fictive",
    venueAddress: "1 rue Exemple, Ottawa",
    capacity: "120",
    unitPrice: "35",
    interacEmail: "paiements@example.test",
  },
  takenSeats: 82,
  activeReservations: 34,
  promotion: { unitPriceCents: 3000, endsAt: new Date("2026-12-04T05:00:00.000Z") },
};

describe("EventSettingsForm", () => {
  it("présente les valeurs actuelles et les repères de la maquette", () => {
    render(<EventSettingsForm settings={SETTINGS} />);

    expect(screen.getByLabelText("Date du dîner")).toHaveValue("2026-12-19");
    expect(screen.getByLabelText("Heure d’accueil")).toHaveValue("18:00");
    expect(screen.getByLabelText("Date limite de réservation")).toHaveValue("2026-12-12");
    expect(screen.getByLabelText("Nombre de places")).toHaveValue(120);
    expect(screen.getByLabelText("Nombre de places")).toHaveAttribute("min", "82");
    expect(screen.getByText(/Minimum 82 : places déjà prises/)).toBeInTheDocument();
    expect(screen.getByText(/Les 34 réservations déjà faites gardent leur prix/)).toHaveTextContent(
      /tarif promotionnel de 30,00/,
    );
    expect(screen.getByLabelText("Courriel qui reçoit les virements")).toHaveValue(
      "paiements@example.test",
    );
    expect(
      screen.getByRole("checkbox", { name: /dépôt automatique est activé/ }),
    ).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Annuler" })).toHaveAttribute("href", "/admin");
  });

  it("accorde le rappel du prix quand une seule réservation existe", () => {
    render(
      <EventSettingsForm settings={{ ...SETTINGS, activeReservations: 1, promotion: null }} />,
    );

    expect(screen.getByText(/La réservation déjà faite garde son prix\./)).toBeInTheDocument();
  });

  it("affiche les erreurs du serveur sous les champs et garde la saisie", async () => {
    vi.mocked(updateEventSettingsAction).mockResolvedValueOnce({
      error: {
        code: "VALIDATION_ERROR",
        message: "Certains champs sont à corriger.",
        details: [
          { field: "capacity", message: "Le nombre de places ne peut pas descendre." },
          { field: "autoDepositConfirmed", message: "Confirmez le dépôt automatique." },
        ],
      },
      values: { ...SETTINGS.values, capacity: "50", interacEmail: "nouvelle@example.test" },
    });
    render(<EventSettingsForm settings={SETTINGS} />);

    await act(async () => {
      const form = screen.getByRole("button", { name: /Enregistrer/ }).closest("form");
      if (!form) throw new Error("Formulaire introuvable");
      fireEvent.submit(form);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Certains champs sont à corriger.");
    expect(screen.getByLabelText("Nombre de places")).toHaveValue(50);
    expect(screen.getByLabelText("Nombre de places")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Le nombre de places ne peut pas descendre.")).toBeInTheDocument();
    expect(screen.getByLabelText("Courriel qui reçoit les virements")).toHaveValue(
      "nouvelle@example.test",
    );
    expect(screen.getByRole("checkbox", { name: /dépôt automatique/ })).toHaveAccessibleDescription(
      "Confirmez le dépôt automatique.",
    );
  });
});
