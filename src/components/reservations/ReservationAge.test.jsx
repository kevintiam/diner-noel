import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import fr from "@/i18n/dictionaries/fr.json";
import en from "@/i18n/dictionaries/en.json";
import { createReservationAction } from "@/server/actions/reservation.actions";
import ReservationForm from "./ReservationForm";
import FreeReservationConfirmation from "./FreeReservationConfirmation";

vi.mock("@/server/actions/reservation.actions", () => ({
  createReservationAction: vi.fn(async () => null),
}));

for (const lang of ["fr", "en"]) {
  const dictionary = lang === "fr" ? fr : en;
  describe(`effectifs du formulaire en ${lang}`, () => {
    it("confirme directement une réservation d’adulte au tarif nul", () => {
      render(
        <ReservationForm
          lang={lang}
          dictionary={dictionary}
          unitPriceCents={0}
          maxSeats={10}
          maxSeatsPerReservation={10}
        />,
      );

      expect(screen.getByRole("button", { name: dictionary.reservation.submitFree })).toBeVisible();
      expect(screen.getByText(dictionary.reservation.freeHint)).toBeVisible();
    });

    it("facture les personnes de 15 ans et plus et garde les enfants gratuits", () => {
      render(
        <ReservationForm
          lang={lang}
          dictionary={dictionary}
          unitPriceCents={3000}
          maxSeats={10}
          maxSeatsPerReservation={10}
        />,
      );
      fireEvent.change(screen.getByLabelText(dictionary.reservation.adultSeats), {
        target: { value: "2" },
      });
      fireEvent.change(screen.getByLabelText(dictionary.reservation.childSeats), {
        target: { value: "2" },
      });
      expect(screen.getAllByText(lang === "fr" ? /60,00\s\$/ : "$60.00")).toHaveLength(2);
      expect(
        screen.queryByText(/places restantes|seats left|capacité|capacity/),
      ).not.toBeInTheDocument();
      expect(screen.getByText(dictionary.reservation.paymentHint)).toBeVisible();
    });

    it("autorise zéro personne payante et propose la confirmation gratuite", () => {
      render(
        <ReservationForm
          lang={lang}
          dictionary={dictionary}
          unitPriceCents={3500}
          maxSeats={10}
          maxSeatsPerReservation={10}
        />,
      );
      fireEvent.change(screen.getByLabelText(dictionary.reservation.adultSeats), {
        target: { value: "0" },
      });
      fireEvent.change(screen.getByLabelText(dictionary.reservation.childSeats), {
        target: { value: "2" },
      });
      expect(
        screen.getByRole("button", { name: dictionary.reservation.submitFree }),
      ).toBeInTheDocument();
      expect(screen.getByText(dictionary.reservation.freeHint)).toBeVisible();
      expect(screen.getAllByText(lang === "fr" ? /0,00\s\$/ : "$0.00")).toHaveLength(2);
    });

    it("confirme les enfants sans afficher de destinataire Interac ni dépôt", () => {
      render(
        <FreeReservationConfirmation
          dictionary={dictionary}
          reservation={{
            code: "NOEL-1234",
            status: "CONFIRMED",
            seats: 2,
            childSeats: 2,
            unitPriceCents: 3500,
            amountCents: 0,
            interacEmail: "fictif@example.test",
          }}
        />,
      );
      expect(
        screen.getByRole("heading", { name: dictionary.payment.freeTitle }),
      ).toBeInTheDocument();
      expect(screen.getByText("NOEL-1234")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(dictionary.payment.freeIntro);
      expect(screen.queryByText("fictif@example.test")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
}

it("garde les deux effectifs après une erreur serveur", async () => {
  vi.mocked(createReservationAction).mockResolvedValueOnce({
    error: {
      code: "VALIDATION_ERROR",
      message: "Erreur",
      details: [{ field: "email", message: "Courriel invalide" }],
    },
    values: {
      firstName: "Prénom",
      lastName: "Fictif",
      email: "invalide",
      phone: "6135550100",
      adultSeats: "2",
      childSeats: "3",
      note: "",
    },
  });
  render(
    <ReservationForm
      lang="fr"
      dictionary={fr}
      unitPriceCents={3000}
      maxSeats={10}
      maxSeatsPerReservation={10}
    />,
  );
  fireEvent.change(screen.getByLabelText(fr.reservation.adultSeats), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText(fr.reservation.childSeats), { target: { value: "3" } });
  await act(async () => {
    fireEvent.submit(screen.getByRole("button", { name: fr.reservation.submit }).closest("form"));
  });
  expect(screen.getByLabelText(fr.reservation.adultSeats)).toHaveValue(2);
  expect(screen.getByLabelText(fr.reservation.childSeats)).toHaveValue(3);
  expect(screen.getByText("Courriel invalide")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveFocus();
});
