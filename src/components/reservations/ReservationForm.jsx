"use client";

// Formulaire de réservation (maquette 2). La validation finale se fait sur le
// serveur ; le formulaire affiche ses erreurs traduites et garde la saisie.
import { useActionState, useEffect, useRef, useState } from "react";
import FormField from "@/components/ui/FormField";
import { translate } from "@/i18n/translate";
import { formatMoney } from "@/lib/format";
import { createReservationAction } from "@/server/actions/reservation.actions";
import AgeSeatCounter from "./AgeSeatCounter";
import ReservationContactFields from "./ReservationContactFields";
import ReservationSummary from "./ReservationSummary";
import styles from "./ReservationForm.module.css";

/** @typedef {import("@/i18n/translate").Dictionary} Dictionary */
/** @typedef {import("@/server/actions/reservation.actions").ReservationActionState} ReservationActionState */

/**
 * Garde un nombre de places entre 0 et le maximum autorisé.
 * @param {number} seats
 * @param {number} maxSeats
 * @returns {number}
 */
export function clampSeats(seats, maxSeats) {
  if (!Number.isInteger(seats) || seats < 0) {
    return 0;
  }
  return Math.min(seats, maxSeats);
}

/**
 * Affiche le formulaire de réservation et envoie la demande à l'action serveur.
 * @param {{
 *   lang: string,
 *   dictionary: Dictionary,
 *   unitPriceCents: number,
 *   maxSeats: number,
 *   maxSeatsPerReservation: number,
 *   eventDetails?: import("./ReservationSummary").ReservationEventDetails,
 * }} props
 * @returns {React.ReactElement} Le formulaire.
 */
export default function ReservationForm({
  lang,
  dictionary,
  unitPriceCents,
  maxSeats,
  maxSeatsPerReservation,
  eventDetails,
}) {
  /** @type {[ReservationActionState | null, (formData: FormData) => void, boolean]} */
  const [state, formAction, isPending] = useActionState(
    createReservationAction.bind(null, lang),
    null,
  );
  const [adultSeatsText, setAdultSeatsText] = useState("1");
  const [childSeatsText, setChildSeatsText] = useState("0");
  /** @type {React.RefObject<HTMLParagraphElement | null>} */
  const formErrorRef = useRef(null);
  useEffect(() => {
    if (state?.error) formErrorRef.current?.focus();
  }, [state]);
  const adultSeats = clampSeats(Number(adultSeatsText), maxSeats);
  const childSeats = clampSeats(Number(childSeatsText), maxSeats - adultSeats);
  const values = state?.values;

  /** @param {string} key @param {Record<string, string | number>} [replacements] */
  const getText = (key, replacements) => translate(dictionary, key, replacements);
  /** @param {string} field */
  const getFieldError = (field) =>
    state?.error.details?.find((detail) => detail.field === field)?.message;
  const unitPrice = formatMoney(unitPriceCents, lang);
  const seatsHelp = getText("reservation.seatsHelp", { max: maxSeatsPerReservation });

  return (
    <form action={formAction} noValidate className={styles.form} aria-busy={isPending}>
      {state?.error ? (
        <p role="alert" className={styles.formError} ref={formErrorRef} tabIndex={-1}>
          {state.error.message}
        </p>
      ) : null}

      <div className={styles.details}>
        <fieldset className={styles.group}>
          <legend className={styles.legend}>{getText("reservation.contactTitle")}</legend>
          <ReservationContactFields dictionary={dictionary} state={state} isPending={isPending} />
        </fieldset>
        <fieldset className={styles.group} aria-describedby="guest-limit">
          <legend className={styles.legend}>{getText("reservation.guestsTitle")}</legend>
          <p className={styles.groupHelp} id="guest-limit">
            {seatsHelp}
          </p>
          <div className={styles.guestCards}>
            <AgeSeatCounter
              name="adultSeats"
              label={getText("reservation.adultSeats")}
              help={getText("reservation.adultPrice", { price: unitPrice })}
              error={getFieldError("adultSeats")}
              value={adultSeatsText}
              max={maxSeats - childSeats}
              isPending={isPending}
              onChange={setAdultSeatsText}
              decreaseLabel={getText("reservation.decreaseAdults")}
              increaseLabel={getText("reservation.increaseAdults")}
            />
            <AgeSeatCounter
              name="childSeats"
              label={getText("reservation.childSeats")}
              help={getText("pricing.children")}
              error={getFieldError("childSeats")}
              value={childSeatsText}
              max={maxSeats - adultSeats}
              isPending={isPending}
              onChange={setChildSeatsText}
              decreaseLabel={getText("reservation.decreaseChildren")}
              increaseLabel={getText("reservation.increaseChildren")}
            />
          </div>
        </fieldset>
        <div className={styles.notes}>
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
        </div>
      </div>
      <ReservationSummary
        dictionary={dictionary}
        lang={lang}
        unitPriceCents={unitPriceCents}
        adultSeats={adultSeats}
        childSeats={childSeats}
        isPending={isPending}
        eventDetails={eventDetails}
      />
    </form>
  );
}
