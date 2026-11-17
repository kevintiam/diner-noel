// Recherche et filtres de la liste des réservations. Tout passe par l'adresse
// (`?status=…&q=…`) : une liste filtrée se partage ou se recharge telle quelle.
import { ArrowRight, Search, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { SEARCH_MAX_LENGTH } from "@/validation/reservation-filter.schema";
import styles from "./ReservationFilters.module.css";

/** @typedef {import("@/validation/reservation-filter.schema").ReservationListFilter} ReservationListFilter */
/** @typedef {import("@/validation/reservation-filter.schema").ReservationStatus} ReservationStatus */

const LIST_PATH = "/admin/reservations";

/** @type {Array<{ status: ReservationStatus | null, label: string }>} */
const STATUS_FILTERS = [
  { status: null, label: "Toutes" },
  { status: "TO_VERIFY", label: "À vérifier" },
  { status: "PENDING_PAYMENT", label: "En attente" },
  { status: "CONFIRMED", label: "Confirmées" },
  { status: "CANCELLED", label: "Annulées" },
];

/**
 * Construit l'adresse de la liste pour un statut et une recherche.
 * @param {ReservationStatus | null} status Le statut, ou null pour tous.
 * @param {string} query Le texte cherché, ou "" pour aucun.
 * @returns {string} L'adresse, sans paramètre vide.
 */
export function buildListHref(status, query) {
  const params = new URLSearchParams();
  if (status !== null) {
    params.set("status", status);
  }
  if (query !== "") {
    params.set("q", query);
  }
  const search = params.toString();
  return search === "" ? LIST_PATH : `${LIST_PATH}?${search}`;
}

/**
 * Affiche le champ de recherche et une pastille par statut, avec son nombre de réservations.
 * @param {{ filter: ReservationListFilter, counts: Record<ReservationStatus | "ALL", number> }} props
 * @returns {React.ReactElement} La barre de filtres.
 */
export default function ReservationFilters({ filter, counts }) {
  return (
    <div className={styles.filters}>
      <Form action={LIST_PATH} role="search" className={styles.search}>
        <label htmlFor="reservation-search" className={styles.srOnly}>
          Rechercher une réservation
        </label>
        <div className={styles.field}>
          <Search aria-hidden="true" className={styles.searchIcon} />
          {/* La clé remet le champ à jour quand la recherche change par un lien (« Effacer »). */}
          <input
            key={filter.query}
            id="reservation-search"
            type="search"
            name="q"
            defaultValue={filter.query}
            placeholder="Nom, courriel ou code"
            maxLength={SEARCH_MAX_LENGTH}
            className={styles.input}
          />
          {filter.query !== "" ? (
            <Link href={buildListHref(filter.status, "")} className={styles.clear}>
              <X aria-hidden="true" className={styles.clearIcon} />
              <span className={styles.srOnly}>Effacer la recherche</span>
            </Link>
          ) : null}
        </div>
        {filter.status !== null ? (
          <input type="hidden" name="status" value={filter.status} />
        ) : null}
        <button type="submit" className={styles.submit}>
          <ArrowRight aria-hidden="true" className={styles.submitIcon} />
          <span className={styles.submitText}>Rechercher</span>
        </button>
      </Form>
      <nav aria-label="Filtrer par statut">
        <ul className={styles.chips}>
          {STATUS_FILTERS.map(({ status, label }) => (
            <li key={label}>
              <Link
                href={buildListHref(status, filter.query)}
                className={styles.chip}
                aria-current={status === filter.status ? "page" : undefined}
              >
                {label} <span className={styles.chipCount}>{counts[status ?? "ALL"]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
