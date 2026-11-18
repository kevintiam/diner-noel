import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardStats from "./DashboardStats";
import ReservationTable from "./ReservationTable";
import StatusBadge from "./StatusBadge";

const RESERVATIONS = [
  {
    id: "res_1",
    code: "NOEL-4821",
    status: "TO_VERIFY",
    firstName: "Prénom",
    lastName: "Fictif",
    seats: 2,
    amountCents: 6000,
    createdAt: new Date("2026-11-15T18:42:00.000Z"),
  },
  {
    id: "res_2",
    code: "NOEL-4822",
    status: "CONFIRMED",
    firstName: "Autre",
    lastName: "Fictive",
    seats: 3,
    amountCents: 0,
    createdAt: new Date("2026-11-15T19:00:00.000Z"),
  },
];

describe("StatusBadge", () => {
  it("affiche le statut en français", () => {
    render(<StatusBadge status="PENDING_PAYMENT" />);

    expect(screen.getByText("En attente de paiement")).toBeInTheDocument();
  });
});

describe("ReservationTable", () => {
  it("affiche chaque réservation dans un lien vers sa fiche", () => {
    render(<ReservationTable reservations={RESERVATIONS} caption="Réservations récentes" />);

    const list = screen.getByRole("list", { name: "Réservations récentes" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const firstRow = within(list).getByRole("link", { name: /NOEL-4821/ });
    expect(firstRow).toHaveAttribute("href", "/admin/reservations/res_1");
    expect(within(firstRow).getByText("Prénom Fictif")).toBeInTheDocument();
    expect(within(firstRow).getByText("2 places")).toBeInTheDocument();
    expect(within(firstRow).getByText(/^60\s\$$/)).toBeInTheDocument();
    expect(within(firstRow).getByText("À vérifier")).toBeInTheDocument();
    expect(within(firstRow).getByText(/15 nov\. 2026, 13\sh\s42/)).toBeInTheDocument();
  });

  it("annonce une liste vide au lieu d'une liste sans ligne", () => {
    render(<ReservationTable reservations={[]} caption="Toutes les réservations" />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("Aucune réservation pour le moment.")).toBeInTheDocument();
  });
});

describe("DashboardStats", () => {
  it("montre les réservations et les places par statut", () => {
    render(<DashboardStats reservations={RESERVATIONS} />);

    const cards = within(screen.getByRole("list", { name: "Résumé des réservations" }));
    // Libellés long et court sont tous deux dans le document : le CSS choisit selon l'écran.
    const confirmedCard = cards.getAllByText("Confirmées")[0].closest("li");
    if (!confirmedCard) throw new Error("Carte « Confirmées » introuvable");
    expect(confirmedCard).toHaveTextContent("1 réservation");
    expect(confirmedCard).toHaveTextContent("3 places");
    const cancelled = cards.getAllByText("Annulées")[0].closest("li");
    expect(cancelled).toHaveTextContent("0 réservation");
    expect(cancelled).toHaveTextContent("0 place");
  });

  it("laisse « À vérifier » au bandeau « À faire », sans carte en double", () => {
    render(<DashboardStats reservations={RESERVATIONS} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("À vérifier")).not.toBeInTheDocument();
  });

  it("ouvre la liste filtrée sur le statut de chaque carte", () => {
    render(<DashboardStats reservations={RESERVATIONS} />);

    expect(screen.getByRole("link", { name: /En attente/ })).toHaveAttribute(
      "href",
      "/admin/reservations?status=PENDING_PAYMENT",
    );
    expect(screen.getByRole("link", { name: /Confirmées/ })).toHaveAttribute(
      "href",
      "/admin/reservations?status=CONFIRMED",
    );
  });
});
