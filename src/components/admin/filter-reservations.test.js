import { describe, expect, it } from "vitest";
import { filterReservations } from "./filter-reservations.js";

const RESERVATIONS = [
  {
    code: "NOEL-1001",
    status: "TO_VERIFY",
    firstName: "Hélène",
    lastName: "Fictive",
    email: "helene@example.test",
  },
  {
    code: "NOEL-1002",
    status: "CONFIRMED",
    firstName: "Prénom",
    lastName: "Fictif",
    email: "prenom@example.test",
  },
  {
    code: "NOEL-1003",
    status: "TO_VERIFY",
    firstName: "Autre",
    lastName: "Personne",
    email: "autre@example.test",
  },
];

/** @param {Array<{ code: string }>} reservations */
function codesOf(reservations) {
  return reservations.map((reservation) => reservation.code);
}

describe("filterReservations", () => {
  it("garde seulement le statut demandé, dans le même ordre", () => {
    const result = filterReservations(RESERVATIONS, { status: "TO_VERIFY", query: "" });

    expect(codesOf(result)).toEqual(["NOEL-1001", "NOEL-1003"]);
  });

  it("cherche dans le nom, le courriel et le code, sans tenir compte des accents ni des majuscules", () => {
    expect(codesOf(filterReservations(RESERVATIONS, { status: null, query: "HELENE" }))).toEqual([
      "NOEL-1001",
    ]);
    expect(codesOf(filterReservations(RESERVATIONS, { status: null, query: "noel-1002" }))).toEqual(
      ["NOEL-1002"],
    );
    expect(codesOf(filterReservations(RESERVATIONS, { status: null, query: "autre@" }))).toEqual([
      "NOEL-1003",
    ]);
  });

  it("combine le statut et la recherche", () => {
    const result = filterReservations(RESERVATIONS, { status: "CONFIRMED", query: "hélène" });

    expect(result).toEqual([]);
  });

  it("renvoie toute la liste sans filtre, et une liste vide pour une entrée vide", () => {
    expect(filterReservations(RESERVATIONS, { status: null, query: "   " })).toHaveLength(3);
    expect(filterReservations([], { status: "TO_VERIFY", query: "x" })).toEqual([]);
  });
});
