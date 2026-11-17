import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
    hasPromotion: true,
    promotionalUnitPrice: "30",
    promotionStartDate: "2026-11-20",
    promotionEndDate: "2026-12-03",
    interacEmail: "paiements@example.test",
  },
  takenSeats: 82,
  activeReservations: 34,
};

/** Les périodes du calendrier des prix, dans l'ordre. */
function readScheduleSteps() {
  const list = screen.getByRole("list", { name: "Calendrier des prix" });
  return within(list).getAllByRole("listitem");
}

/** Envoie le formulaire et attend la réponse de l'action simulée. */
async function submitForm() {
  await act(async () => {
    const form = screen.getByRole("button", { name: /Enregistrer/ }).closest("form");
    if (!form) throw new Error("Formulaire introuvable");
    fireEvent.submit(form);
  });
}

describe("EventSettingsForm", () => {
  it("présente les valeurs actuelles, dont le prix normal et le prix promo", () => {
    render(<EventSettingsForm settings={SETTINGS} />);

    expect(screen.getByLabelText("Date du dîner")).toHaveValue("2026-12-19");
    expect(screen.getByLabelText("Heure d’accueil")).toHaveValue("18:00");
    expect(screen.getByLabelText("Date limite de réservation")).toHaveValue("2026-12-12");
    expect(screen.getByLabelText("Nombre de places")).toHaveValue(120);
    expect(screen.getByLabelText("Nombre de places")).toHaveAttribute("min", "82");
    expect(screen.getByText(/Minimum 82 : places déjà prises/)).toBeInTheDocument();
    expect(screen.getByLabelText("Prix normal (avant promo)")).toHaveValue("35");
    expect(screen.getByRole("checkbox", { name: /Proposer un prix promo/ })).toBeChecked();
    expect(screen.getByLabelText("Prix promo (après réduction)")).toHaveValue("30");
    // Les dates de la promo sont regroupées : « Premier jour » se lit dans ce contexte.
    const promotion = within(screen.getByRole("group", { name: "Prix promo et période" }));
    expect(promotion.getByLabelText("Premier jour")).toHaveValue("2026-11-20");
    expect(promotion.getByLabelText("Dernier jour (inclus)")).toHaveValue("2026-12-03");
    expect(screen.getByText("Les 34 réservations déjà faites gardent leur prix.")).toBeVisible();
    expect(screen.getByLabelText("Courriel qui reçoit les virements")).toHaveValue(
      "paiements@example.test",
    );
    expect(
      screen.getByRole("checkbox", { name: /dépôt automatique est activé/ }),
    ).not.toBeChecked();
    expect(screen.getByRole("link", { name: "Annuler" })).toHaveAttribute("href", "/admin");
  });

  it("montre le prix normal avant et après la promo, et le prix promo entre les deux", () => {
    render(<EventSettingsForm settings={SETTINGS} />);

    const [before, during, after] = readScheduleSteps();
    expect(before).toHaveTextContent(/^Jusqu’au 19 nov\. 35\s\$$/);
    expect(during).toHaveTextContent(/^Du 20 nov\. au 3 déc\. 30\s\$ Promo : −5\s\$ \(14 %\)$/);
    expect(after).toHaveTextContent(/^Dès le 4 déc\. 35\s\$$/);
  });

  it("suit la saisie du prix promo en direct", () => {
    render(<EventSettingsForm settings={SETTINGS} />);

    fireEvent.change(screen.getByLabelText("Prix promo (après réduction)"), {
      target: { value: "28" },
    });

    expect(readScheduleSteps()[1]).toHaveTextContent(/28\s\$ Promo : −7\s\$ \(20 %\)/);
  });

  it("masque la promo quand la case est décochée et revient à un prix unique", () => {
    render(<EventSettingsForm settings={SETTINGS} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /Proposer un prix promo/ }));

    expect(screen.getByLabelText("Prix promo (après réduction)")).not.toBeVisible();
    expect(screen.getByLabelText("Prix promo (après réduction)")).not.toBeRequired();
    expect(readScheduleSteps()).toHaveLength(1);
    expect(readScheduleSteps()[0]).toHaveTextContent(/Toute la période de réservation 35\s\$/);
  });

  it("accorde le rappel du prix quand une seule réservation existe", () => {
    render(
      <EventSettingsForm
        settings={{
          ...SETTINGS,
          activeReservations: 1,
          values: { ...SETTINGS.values, hasPromotion: false },
        }}
      />,
    );

    expect(screen.getByText("La réservation déjà faite garde son prix.")).toBeInTheDocument();
    expect(screen.getByLabelText("Prix promo (après réduction)")).not.toBeVisible();
  });

  it("affiche les erreurs du serveur sous les champs et garde la saisie", async () => {
    vi.mocked(updateEventSettingsAction).mockResolvedValueOnce({
      error: {
        code: "VALIDATION_ERROR",
        message: "Certains champs sont à corriger.",
        details: [
          { field: "capacity", message: "Le nombre de places ne peut pas descendre." },
          {
            field: "promotionalUnitPrice",
            message: "Le prix promo doit être plus bas que le prix normal.",
          },
          { field: "autoDepositConfirmed", message: "Confirmez le dépôt automatique." },
        ],
      },
      values: { ...SETTINGS.values, capacity: "50", interacEmail: "nouvelle@example.test" },
    });
    render(<EventSettingsForm settings={SETTINGS} />);

    await submitForm();

    expect(screen.getByRole("alert")).toHaveTextContent("Certains champs sont à corriger.");
    expect(screen.getByLabelText("Nombre de places")).toHaveValue(50);
    expect(screen.getByLabelText("Nombre de places")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Le nombre de places ne peut pas descendre.")).toBeInTheDocument();
    expect(screen.getByLabelText("Prix promo (après réduction)")).toHaveAccessibleDescription(
      /Le prix promo doit être plus bas que le prix normal\./,
    );
    expect(screen.getByLabelText("Courriel qui reçoit les virements")).toHaveValue(
      "nouvelle@example.test",
    );
    expect(screen.getByRole("checkbox", { name: /dépôt automatique/ })).toHaveAccessibleDescription(
      "Confirmez le dépôt automatique.",
    );
  });
});
