// Partie « Paiement Interac » de l'écran Paramètres (maquette 8). Changer d'adresse exige
// de confirmer le dépôt automatique : le serveur le vérifie aussi.
import { Landmark } from "lucide-react";
import FormField from "@/components/ui/FormField";
import SettingsSection from "./SettingsSection";
import styles from "./SettingsSection.module.css";

/** @typedef {import("@/validation/event-settings.schema").EventSettingsFormValues} EventSettingsFormValues */

/**
 * Affiche l'adresse qui reçoit les virements et la confirmation du dépôt automatique.
 * @param {{ values: EventSettingsFormValues, errorOf: (field: string) => string | undefined }} props
 * @returns {React.ReactElement} La carte « Paiement Interac ».
 */
export default function InteracFields({ values, errorOf }) {
  const checkboxError = errorOf("autoDepositConfirmed");
  return (
    <SettingsSection
      id="settings-interac"
      title="Paiement Interac"
      description="L’adresse donnée aux participants pour envoyer leur virement."
      Icon={Landmark}
    >
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
          aria-invalid={Boolean(checkboxError)}
          aria-describedby={checkboxError ? "autoDepositConfirmed-error" : undefined}
        />
        <label htmlFor="autoDepositConfirmed" className={styles.checkboxLabel}>
          Le dépôt automatique est activé sur cette adresse : aucune question de sécurité n’est
          demandée aux participants. À cocher pour changer d’adresse.
        </label>
        {checkboxError ? (
          <p id="autoDepositConfirmed-error" className={styles.fieldError}>
            {checkboxError}
          </p>
        ) : null}
      </div>
    </SettingsSection>
  );
}
