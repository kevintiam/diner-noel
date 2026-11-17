import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import fr from "@/i18n/dictionaries/fr.json";
import ReservationForm, { clampSeats } from "./ReservationForm";
import { createReservationAction } from "@/server/actions/reservation.actions";

vi.mock("@/server/actions/reservation.actions", () => ({
  createReservationAction: vi.fn(async () => null),
}));

// Les espaces insécables d'Intl sont traités comme des espaces ordinaires.
/** @param {string} text */
const loose = (text) => new RegExp(text.replace(/[$.]/g, "\\$&").replace(/ /g, "\\s"));

/** @param {{ lang?: string, dictionary?: object, maxSeats?: number, seatsLeft?: number }} [props] */
function renderForm({ lang = "fr", dictionary = fr, maxSeats = 10, seatsLeft = 120 } = {}) {
  return render(
    <ReservationForm
      lang={lang}
      dictionary={/** @type {any} */ (dictionary)}
      unitPriceCents={2500}
      seatsLeft={seatsLeft}
      maxSeats={maxSeats}
      maxSeatsPerReservation={10}
      eventDetails={{
        startsAt: "2026-12-19T23:00:00.000Z",
        venueName: "Salle fictive",
        venueAddress: "1 rue Exemple, Nepean",
      }}
    />,
  );
}

describe("clampSeats", () => {
  it("garde le nombre entre 1 et le maximum", () => {
    expect(clampSeats(3, 10)).toBe(3);
    expect(clampSeats(0, 10)).toBe(0);
    expect(clampSeats(12, 10)).toBe(10);
    expect(clampSeats(Number.NaN, 10)).toBe(0);
  });
});

describe("ReservationForm", () => {
  it("affiche les champs de la maquette, chacun avec son étiquette", () => {
    renderForm();

    for (const label of ["Prénom", "Nom", "Courriel", "Téléphone", "Personnes de 15 ans et plus"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    expect(screen.getByLabelText(/Remarque/)).toBeInTheDocument();
    expect(screen.getByText("10 participants maximum par réservation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer vers le paiement" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Vos coordonnées" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Vos convives" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Votre réservation" })).toHaveTextContent(
      "Samedi 19 décembre 2026",
    );
    expect(screen.getByText("Salle fictive")).toBeInTheDocument();
    expect(screen.getByText("1 rue Exemple, Nepean")).toBeInTheDocument();
    expect(screen.getByText(loose("18 h"))).toBeInTheDocument();
    expect(screen.getByText(fr.reservation.paymentHint)).toBeInTheDocument();
  });

  it("recalcule le total quand on ajoute une place", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }));

    expect(screen.getByLabelText("Personnes de 15 ans et plus")).toHaveValue(2);
    expect(screen.getByText(loose("2 personnes de 15 ans et plus × 25,00 $"))).toBeInTheDocument();
    expect(screen.getAllByText(loose("50,00 $"))).toHaveLength(2);
  });

  it("bloque le sélecteur entre 1 et le maximum permis", () => {
    renderForm({ maxSeats: 2 });

    expect(
      screen.getByRole("button", { name: "Retirer une personne de 15 ans et plus" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }));
    expect(
      screen.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Personnes de 15 ans et plus")).toHaveValue(2);
  });

  it("garde ce que l'on tape : effacer puis taper 3 donne 3 places, pas 10", () => {
    renderForm();
    const seatsInput = screen.getByLabelText("Personnes de 15 ans et plus");

    fireEvent.change(seatsInput, { target: { value: "" } });
    fireEvent.change(seatsInput, { target: { value: "3" } });

    expect(seatsInput).toHaveValue(3);
    expect(screen.getByText(loose("3 personnes de 15 ans et plus × 25,00 $"))).toBeInTheDocument();
  });

  it("ramène au maximum en quittant le champ un nombre trop grand", () => {
    renderForm({ maxSeats: 4 });
    const seatsInput = screen.getByLabelText("Personnes de 15 ans et plus");

    fireEvent.change(seatsInput, { target: { value: "9" } });
    expect(screen.getByText(loose("4 personnes de 15 ans et plus × 25,00 $"))).toBeInTheDocument();
    fireEvent.blur(seatsInput);

    expect(seatsInput).toHaveValue(4);
  });

  it("accorde au singulier quand il ne reste qu'une place", () => {
    renderForm({ maxSeats: 1, seatsLeft: 1 });

    expect(screen.getByText("10 participants maximum par réservation")).toBeInTheDocument();
  });

  it("parle anglais sur la page anglaise", () => {
    renderForm({ lang: "en", dictionary: en });

    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByText("1 person aged 15 and over × $25.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to payment" })).toBeInTheDocument();
    expect(screen.getByText(en.reservation.paymentHint)).toBeInTheDocument();
  });

  it("fige les champs et le sélecteur pendant l'envoi, puis les réactive", async () => {
    let finishSubmission = () => {};
    vi.mocked(createReservationAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSubmission = () => resolve(null);
        }),
    );
    renderForm();

    await act(async () => {
      const form = screen
        .getByRole("button", { name: "Continuer vers le paiement" })
        .closest("form");
      if (!form) throw new Error("Formulaire introuvable");
      fireEvent.submit(form);
    });

    for (const label of [
      "Prénom",
      "Nom",
      "Courriel",
      "Téléphone",
      "Personnes de 15 ans et plus",
      "Enfants de 0 à 14 ans",
      /Remarque/,
    ]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    expect(screen.getByLabelText("Prénom").closest("form")).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Retirer une personne de 15 ans et plus" }),
    ).toBeDisabled();

    await act(async () => {
      finishSubmission();
    });

    expect(screen.getByLabelText("Prénom")).toBeEnabled();
    expect(screen.getByLabelText("Prénom").closest("form")).toHaveAttribute("aria-busy", "false");
    expect(
      screen.getByRole("button", { name: "Ajouter une personne de 15 ans et plus" }),
    ).toBeEnabled();
  });
});
