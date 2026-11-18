import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { updateReservationStatusAction } from "@/server/actions/organizer.actions";
import DecisionHistory from "./DecisionHistory";
import DecisionPanel from "./DecisionPanel";
import ProofList from "./ProofList";
import ReservationFacts, { describeSeats } from "./ReservationFacts";

vi.mock("@/server/actions/organizer.actions", () => ({
  updateReservationStatusAction: vi.fn(),
}));

const RESERVATION = {
  id: "res_1",
  code: "NOEL-4821",
  status: "TO_VERIFY",
  firstName: "Prénom",
  lastName: "Fictif",
  email: "fictif@example.test",
  phone: "613 555-0100",
  language: "FR",
  seats: 3,
  childSeats: 1,
  amountCents: 6000,
  note: null,
  createdAt: new Date("2026-11-15T18:42:00.000Z"),
  confirmedAt: null,
};

describe("ReservationFacts", () => {
  it("affiche les coordonnées avec des liens d'appel et de courriel", () => {
    render(<ReservationFacts reservation={RESERVATION} />);

    expect(screen.getByRole("link", { name: "fictif@example.test" })).toHaveAttribute(
      "href",
      "mailto:fictif@example.test",
    );
    expect(screen.getByRole("link", { name: "613 555-0100" })).toHaveAttribute(
      "href",
      "tel:6135550100",
    );
    expect(screen.getByText("3 places dont 1 enfant")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.queryByText("Remarque du participant")).not.toBeInTheDocument();
  });

  it("accorde les places et omet les enfants quand il n'y en a pas", () => {
    expect(describeSeats(1, 0)).toBe("1 place");
    expect(describeSeats(4, 2)).toBe("4 places dont 2 enfants");
  });
});

describe("DecisionPanel", () => {
  it("propose confirmer, refuser avec un motif à choisir et annuler pour un paiement à vérifier", () => {
    render(<DecisionPanel reservation={RESERVATION} />);

    expect(screen.getByRole("button", { name: "Confirmer le paiement" })).toHaveAttribute(
      "value",
      "confirm",
    );
    const reason = screen.getByRole("combobox", { name: "Motif du refus" });
    expect(reason).toHaveValue("");
    expect(reason).toBeRequired();
    expect(screen.getByRole("button", { name: "Refuser le paiement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler la réservation" })).toBeInTheDocument();
    expect(screen.getByText(/le message contient le code/)).toHaveTextContent(
      "le message contient le code NOEL-4821.",
    );
  });

  it("ne propose ni confirmer ni refuser tant qu'aucune preuve n'est arrivée", () => {
    render(<DecisionPanel reservation={{ ...RESERVATION, status: "PENDING_PAYMENT" }} />);

    expect(screen.queryByRole("button", { name: "Confirmer le paiement" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refuser le paiement" })).not.toBeInTheDocument();
    expect(screen.getByText(/rien à confirmer pour l’instant/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler la réservation" })).toBeInTheDocument();
  });

  it("ne propose plus aucune action, ni l'annulation, une fois le paiement confirmé", () => {
    render(<DecisionPanel reservation={{ ...RESERVATION, status: "CONFIRMED" }} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/la réservation est définitive/)).toBeInTheDocument();
  });

  it("ne propose aucune action sur une réservation annulée", () => {
    render(<DecisionPanel reservation={{ ...RESERVATION, status: "CANCELLED" }} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/aucune action n’est possible/)).toBeInTheDocument();
  });

  it("affiche le refus du serveur quand la réservation a changé entre-temps", async () => {
    vi.mocked(updateReservationStatusAction).mockResolvedValueOnce({
      error: {
        code: "RESERVATION_STATUS_CHANGED",
        message: "Cette réservation a changé entre-temps.",
      },
    });
    render(<DecisionPanel reservation={RESERVATION} />);

    await act(async () => {
      const form = screen.getByRole("button", { name: "Confirmer le paiement" }).closest("form");
      if (!form) throw new Error("Formulaire introuvable");
      fireEvent.submit(form);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Cette réservation a changé entre-temps.");
  });
});

describe("ProofList et DecisionHistory", () => {
  it("annoncent l'absence de capture et de décision", () => {
    render(
      <>
        <ProofList proofs={[]} />
        <DecisionHistory decisions={[]} />
      </>,
    );

    expect(screen.getByText("Aucune capture reçue pour l’instant.")).toBeInTheDocument();
    expect(screen.getByText("Aucune décision pour l’instant.")).toBeInTheDocument();
  });

  it("décrivent une capture et une décision de refus", () => {
    render(
      <>
        <ProofList
          proofs={[{ id: "p1", byteSize: 2048, createdAt: new Date("2026-11-15T19:00:00Z") }]}
        />
        <DecisionHistory
          decisions={[
            {
              id: "d1",
              type: "REFUSE",
              reasonCode: "INCOMPLETE_AMOUNT",
              createdAt: new Date("2026-11-16T14:00:00Z"),
              organizer: { name: "Organisateur fictif" },
            },
          ]}
        />
      </>,
    );

    expect(screen.getByText("Capture 1")).toBeInTheDocument();
    expect(screen.getByText(/^reçue le .* · 2 Ko$/)).toBeInTheDocument();
    expect(screen.getByText("Preuve refusée · Montant incomplet")).toBeInTheDocument();
    expect(screen.getByText(/Organisateur fictif/)).toBeInTheDocument();
  });
});
