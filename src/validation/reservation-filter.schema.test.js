import { describe, expect, it } from "vitest";
import { parseReservationListFilter, SEARCH_MAX_LENGTH } from "./reservation-filter.schema.js";

describe("parseReservationListFilter", () => {
  it("garde un statut connu et le texte recherché sans espaces autour", () => {
    expect(parseReservationListFilter({ status: "TO_VERIFY", q: "  noel-4821 " })).toEqual({
      status: "TO_VERIFY",
      query: "noel-4821",
    });
  });

  it("renvoie aucun filtre quand l'adresse n'en a pas", () => {
    expect(parseReservationListFilter({})).toEqual({ status: null, query: "" });
    expect(parseReservationListFilter(undefined)).toEqual({ status: null, query: "" });
  });

  it("coupe une recherche trop longue au lieu de la refuser", () => {
    const { query } = parseReservationListFilter({ q: "a".repeat(SEARCH_MAX_LENGTH + 20) });

    expect(query).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it("ignore un statut inconnu mais garde la recherche", () => {
    expect(parseReservationListFilter({ status: "PAID", q: "fictif" })).toEqual({
      status: null,
      query: "fictif",
    });
  });

  it("ignore les valeurs de mauvais type", () => {
    expect(parseReservationListFilter({ status: ["TO_VERIFY", "CONFIRMED"], q: 42 })).toEqual({
      status: null,
      query: "",
    });
    expect(parseReservationListFilter({ status: null, q: null })).toEqual({
      status: null,
      query: "",
    });
    expect(parseReservationListFilter("status=TO_VERIFY")).toEqual({ status: null, query: "" });
  });
});
