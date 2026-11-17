"use client";

// Formulaire de l'écran Paramètres de l'événement (maquette 8) : quatre cartes, puis une barre
// d'enregistrement toujours visible. Le serveur vérifie les règles (date limite, places prises,
// promo, dépôt automatique) et ses erreurs s'affichent sous chaque champ.
import { Save, Users } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import FormField from "@/components/ui/FormField";
import { updateEventSettingsAction } from "@/server/actions/event-settings.actions";
import DateVenueFields from "./settings/DateVenueFields";
import InteracFields from "./settings/InteracFields";
import PriceFields from "./settings/PriceFields";
import SettingsSection from "./settings/SettingsSection";
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

      {/* Deux colonnes sur ordinateur : l'événement à gauche, l'argent à droite.
          Sur téléphone, elles s'empilent dans le même ordre. */}
      <div className={styles.columns}>
        <div className={styles.column}>
          <DateVenueFields values={values} errorOf={errorOf} />

          <SettingsSection
            id="settings-seats"
            title="Places"
            description="Le site compte les places restantes à partir de ce nombre."
            Icon={Users}
          >
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
                  className={styles.shortInput}
                />
              )}
            </FormField>
          </SettingsSection>
        </div>

        <div className={styles.column}>
          <PriceFields
            values={values}
            errorOf={errorOf}
            activeReservations={settings.activeReservations}
          />

          <InteracFields values={values} errorOf={errorOf} />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={isPending}>
          <Save aria-hidden="true" className={styles.buttonIcon} />
          {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
        {/* Annuler quitte l'écran sans rien enregistrer. */}
        <Link href="/admin" className={styles.reset}>
          Annuler
        </Link>
        <p className={styles.actionsHint}>Les changements s’affichent aussitôt sur le site.</p>
      </div>
    </form>
  );
}
