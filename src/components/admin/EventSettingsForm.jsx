"use client";

// Formulaire de l'écran Paramètres de l'événement (maquette 8). Le serveur vérifie les règles
// (date limite, places prises, dépôt automatique) et ses erreurs s'affichent sous chaque champ.
import { CalendarDays, Landmark, Save, Users } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import FormField from "@/components/ui/FormField";
import { formatMoney, formatShortDateTime } from "@/lib/format";
import { updateEventSettingsAction } from "@/server/actions/event-settings.actions";
import styles from "./EventSettingsForm.module.css";

/** @typedef {import("@/server/services/event-settings.service").EventSettingsView} EventSettingsView */
/** @typedef {import("@/server/actions/event-settings.actions").EventSettingsActionState} EventSettingsActionState */

/**
 * Trouve le message d'erreur d'un champ dans la réponse du serveur.
 * @param {EventSettingsActionState | null} state
 * @param {string} field
 * @returns {string | undefined}
 */
function findFieldError(state, field) {
  return state?.error.details?.find((detail) => detail.field === field)?.message;
}

/**
 * Rappelle que les réservations déjà faites gardent leur prix (AD-6).
 * @param {number} count Les réservations non annulées.
 * @returns {string}
 */
function describeKeptPrices(count) {
  if (count === 0) {
    return "Aucune réservation n’est encore faite.";
  }
  if (count === 1) {
    return "La réservation déjà faite garde son prix.";
  }
  return `Les ${count} réservations déjà faites gardent leur prix.`;
}

/**
 * Décrit le prix gardé par les réservations déjà faites, et la promotion éventuelle.
 * @param {EventSettingsView} settings
 * @returns {string}
 */
function describePriceHelp(settings) {
  const kept = describeKeptPrices(settings.activeReservations);
  if (!settings.promotion) {
    return `${kept} Les enfants de 0 à 14 ans restent gratuits.`;
  }
  const promotionPrice = formatMoney(settings.promotion.unitPriceCents, "fr");
  const promotionEnd = formatShortDateTime(settings.promotion.endsAt, "fr");
  return `${kept} Jusqu’au ${promotionEnd}, le tarif promotionnel de ${promotionPrice} s’applique à la place de ce prix. Les enfants de 0 à 14 ans restent gratuits.`;
}

/**
 * Affiche les paramètres modifiables de l'événement.
 * @param {{ settings: EventSettingsView }} props
 * @returns {React.ReactElement} Le formulaire.
 */
export default function EventSettingsForm({ settings }) {
  const [state, formAction, isPending] = useActionState(updateEventSettingsAction, null);
  // Après un refus, le formulaire garde ce que l'organisateur a saisi.
  const values = state?.values ?? settings.values;
  /** @param {string} field */
  const errorOf = (field) => findFieldError(state, field);
  return (
    <form action={formAction} className={styles.form} aria-busy={isPending}>
      {state?.error ? (
        <p role="alert" className={styles.alert}>
          {state.error.message}
        </p>
      ) : null}

      <section aria-labelledby="settings-date" className={styles.card}>
        <h2 id="settings-date" className={styles.cardTitle}>
          <CalendarDays aria-hidden="true" className={styles.cardIcon} />
          Date et lieu
        </h2>
        <div className={styles.threeColumns}>
          <FormField id="startsAtDate" label="Date du dîner" error={errorOf("startsAtDate")}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="startsAtDate"
                type="date"
                required
                defaultValue={values.startsAtDate}
              />
            )}
          </FormField>
          <FormField id="startsAtTime" label="Heure d’accueil" error={errorOf("startsAtTime")}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="startsAtTime"
                type="time"
                required
                defaultValue={values.startsAtTime}
              />
            )}
          </FormField>
          <FormField
            id="bookingDeadlineDate"
            label="Date limite de réservation"
            help="Toujours avant la date du dîner. Les réservations ferment à 23 h 59 ce jour-là."
            error={errorOf("bookingDeadlineDate")}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="bookingDeadlineDate"
                type="date"
                required
                defaultValue={values.bookingDeadlineDate}
              />
            )}
          </FormField>
        </div>
        <div className={styles.venueColumns}>
          <FormField id="venueName" label="Nom du lieu" error={errorOf("venueName")}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="venueName"
                required
                maxLength={120}
                defaultValue={values.venueName}
              />
            )}
          </FormField>
          <FormField id="venueAddress" label="Adresse" error={errorOf("venueAddress")}>
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="venueAddress"
                required
                maxLength={200}
                autoComplete="street-address"
                defaultValue={values.venueAddress}
              />
            )}
          </FormField>
        </div>
      </section>

      <section aria-labelledby="settings-seats" className={styles.card}>
        <h2 id="settings-seats" className={styles.cardTitle}>
          <Users aria-hidden="true" className={styles.cardIcon} />
          Places et prix
        </h2>
        <div className={styles.twoColumns}>
          <FormField
            id="capacity"
            label="Nombre de places"
            help={`Minimum ${settings.takenSeats} : places déjà prises (confirmées, à vérifier ou en attente de paiement).`}
            error={errorOf("capacity")}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="capacity"
                type="number"
                inputMode="numeric"
                min={Math.max(settings.takenSeats, 1)}
                step={1}
                required
                defaultValue={values.capacity}
              />
            )}
          </FormField>
          <FormField
            id="unitPrice"
            label="Prix d’une place, 15 ans et plus ($)"
            help={describePriceHelp(settings)}
            error={errorOf("unitPrice")}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="unitPrice"
                inputMode="decimal"
                required
                defaultValue={values.unitPrice}
              />
            )}
          </FormField>
        </div>
      </section>

      <section aria-labelledby="settings-interac" className={styles.card}>
        <h2 id="settings-interac" className={styles.cardTitle}>
          <Landmark aria-hidden="true" className={styles.cardIcon} />
          Paiement Interac
        </h2>
        <FormField
          id="interacEmail"
          label="Courriel qui reçoit les virements"
          help="Les réservations déjà faites gardent l’adresse qui leur a été donnée : continuez à surveiller l’ancienne."
          error={errorOf("interacEmail")}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="interacEmail"
              type="email"
              required
              defaultValue={values.interacEmail}
            />
          )}
        </FormField>
        <div className={styles.checkboxField}>
          <input
            id="autoDepositConfirmed"
            name="autoDepositConfirmed"
            type="checkbox"
            className={styles.checkbox}
            aria-invalid={Boolean(errorOf("autoDepositConfirmed"))}
            aria-describedby={
              errorOf("autoDepositConfirmed") ? "autoDepositConfirmed-error" : undefined
            }
          />
          <label htmlFor="autoDepositConfirmed" className={styles.checkboxLabel}>
            Le dépôt automatique est activé sur cette adresse : aucune question de sécurité n’est
            demandée aux participants. À cocher pour changer d’adresse.
          </label>
          {errorOf("autoDepositConfirmed") ? (
            <p id="autoDepositConfirmed-error" className={styles.fieldError}>
              {errorOf("autoDepositConfirmed")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={isPending}>
          <Save aria-hidden="true" className={styles.buttonIcon} />
          {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        {/* Annuler quitte l'écran sans rien enregistrer. */}
        <Link href="/admin" className={styles.reset}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
