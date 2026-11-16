"use client";

// Formulaire de réservation (maquette 2). La validation finale se fait sur le
// serveur ; le formulaire affiche ses erreurs traduites et garde la saisie.
import { useActionState, useState } from "react";
import FormField from "@/components/ui/FormField";
import { translate } from "@/i18n/translate";
import { formatMoney } from "@/lib/format";
import { createReservationAction } from "@/server/actions/reservation.actions";
import styles from "./ReservationForm.module.css";

/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */
/** @typedef {import("@/server/actions/reservation.actions").ReservationActionState} ReservationActionState */

// Au plus deux chiffres dans le champ : le maximum par réservation est 10.
const MAX_SEATS_DIGITS = 2;

/**
 * Garde un nombre de places entre 1 et le maximum autorisé.
 * @param {number} seats
 * @param {number} maxSeats
 * @returns {number}
 */
export function clampSeats(seats, maxSeats) {
  if (!Number.isInteger(seats) || seats < 1) {
    return 1;
  }
  return Math.min(seats, maxSeats);
}

/**
 * Affiche le formulaire de réservation et envoie la demande à l'action serveur.
 * @param {{
 *   lang: string,
 *   dictionary: Dictionary,
 *   unitPriceCents: number,
 *   seatsLeft: number,
 *   maxSeats: number,
 *   maxSeatsPerReservation: number,
 * }} props
 * @returns {React.ReactElement} Le formulaire.
 */
export default function ReservationForm({
  lang,
  dictionary,
  unitPriceCents,
  seatsLeft,
  maxSeats,
  maxSeatsPerReservation,
}) {
  /** @type {[ReservationActionState | null, (formData: FormData) => void, boolean]} */
  const [state, formAction, isPending] = useActionState(
    createReservationAction.bind(null, lang),
    null,
  );
  // Le texte tapé est gardé tel quel (on peut l'effacer puis taper « 3 ») ;
  // le nombre utilisé pour le total est toujours ramené entre 1 et le maximum.
  const [seatsText, setSeatsText] = useState("1");
  const seats = clampSeats(Number(seatsText), maxSeats);
  const values = state?.values;

  /** @param {string} key @param {Record<string, string | number>} [replacements] */
  const getText = (key, replacements) => translate(dictionary, key, replacements);
  /** @param {string} field */
  const getFieldError = (field) =>
    state?.error.details?.find((detail) => detail.field === field)?.message;
  const unitPrice = formatMoney(unitPriceCents, lang);
  const lineItem =
    seats === 1
      ? getText("reservation.lineItemOne", { price: unitPrice })
      : getText("reservation.lineItem", { seats, price: unitPrice });
  const seatsHelp =
    seatsLeft === 1
      ? getText("reservation.seatsHelpOne", { max: maxSeatsPerReservation })
      : getText("reservation.seatsHelp", { max: maxSeatsPerReservation, left: seatsLeft });

  return (
    <form action={formAction} noValidate className={styles.form}>
      {state?.error ? (
        <p role="alert" className={styles.formError}>
          {state.error.message}
        </p>
      ) : null}

      <div className={styles.names}>
        <FormField
          id="firstName"
          label={getText("reservation.firstName")}
          error={getFieldError("firstName")}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="firstName"
              required
              disabled={isPending}
              autoComplete="given-name"
              defaultValue={values?.firstName}
            />
          )}
        </FormField>
        <FormField
          id="lastName"
          label={getText("reservation.lastName")}
          error={getFieldError("lastName")}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="lastName"
              required
              disabled={isPending}
              autoComplete="family-name"
              defaultValue={values?.lastName}
            />
          )}
        </FormField>
      </div>

      <FormField
        id="email"
        label={getText("reservation.email")}
        help={getText("reservation.emailHelp")}
        error={getFieldError("email")}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="email"
            required
            disabled={isPending}
            type="email"
            autoComplete="email"
            defaultValue={values?.email}
          />
        )}
      </FormField>

      <FormField
        id="phone"
        label={getText("reservation.phone")}
        help={getText("reservation.phoneHelp")}
        error={getFieldError("phone")}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="phone"
            required
            disabled={isPending}
            type="tel"
            autoComplete="tel"
            defaultValue={values?.phone}
          />
        )}
      </FormField>

      <FormField
        id="seats"
        label={getText("reservation.seats")}
        help={seatsHelp}
        error={getFieldError("seats")}
      >
        {(fieldProps) => (
          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepButton}
              aria-label={getText("reservation.decreaseSeats")}
              aria-controls="seats"
              disabled={isPending || seats <= 1}
              onClick={() => setSeatsText(String(clampSeats(seats - 1, maxSeats)))}
            >
              −
            </button>
            <input
              {...fieldProps}
              name="seats"
              required
              disabled={isPending}
              type="number"
              inputMode="numeric"
              min={1}
              max={maxSeats}
              value={seatsText}
              onChange={(event) =>
                setSeatsText(event.target.value.replace(/\D/g, "").slice(0, MAX_SEATS_DIGITS))
              }
              onBlur={() => setSeatsText(String(seats))}
              className={styles.seatsInput}
            />
            <button
              type="button"
              className={styles.stepButton}
              aria-label={getText("reservation.increaseSeats")}
              aria-controls="seats"
              disabled={isPending || seats >= maxSeats}
              onClick={() => setSeatsText(String(clampSeats(seats + 1, maxSeats)))}
            >
              +
            </button>
          </div>
        )}
      </FormField>

      <FormField
        id="note"
        label={getText("reservation.note")}
        optionalLabel={getText("reservation.optional")}
        error={getFieldError("note")}
      >
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            name="note"
            disabled={isPending}
            placeholder={getText("reservation.notePlaceholder")}
            defaultValue={values?.note}
          />
        )}
      </FormField>

      <div className={styles.summary} aria-live="polite">
        <p className={styles.lineItem}>
          <span>{lineItem}</span>
          <span>{formatMoney(seats * unitPriceCents, lang)}</span>
        </p>
        <p className={styles.total}>
          <span>{getText("reservation.total")}</span>
          <span>{formatMoney(seats * unitPriceCents, lang)}</span>
        </p>
      </div>

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? getText("reservation.submitting") : getText("reservation.submit")}
      </button>
    </form>
  );
}
