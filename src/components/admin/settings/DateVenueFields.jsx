// Partie « Date et lieu » de l'écran Paramètres (maquette 8).
import { CalendarDays, Info } from "lucide-react";
import FormField from "@/components/ui/FormField";
import SettingsSection from "./SettingsSection";
import styles from "./SettingsSection.module.css";

/** @typedef {import("@/validation/event-settings.schema").EventSettingsFormValues} EventSettingsFormValues */

const VENUE_NAME_MAX_LENGTH = 120;
const VENUE_ADDRESS_MAX_LENGTH = 200;

/**
 * Affiche la date du dîner, l'heure d'accueil, la date limite et le lieu.
 * @param {{ values: EventSettingsFormValues, errorOf: (field: string) => string | undefined }} props
 * @returns {React.ReactElement} La carte « Date et lieu ».
 */
export default function DateVenueFields({ values, errorOf }) {
  return (
    <SettingsSection
      id="settings-date"
      title="Date et lieu"
      description="Ce que les visiteurs lisent sur le site pour venir au dîner."
      Icon={CalendarDays}
    >
      <div className={styles.columns3}>
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
              maxLength={VENUE_NAME_MAX_LENGTH}
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
              maxLength={VENUE_ADDRESS_MAX_LENGTH}
              autoComplete="street-address"
              defaultValue={values.venueAddress}
            />
          )}
        </FormField>
      </div>
      <p className={styles.note}>
        <Info aria-hidden="true" className={styles.noteIcon} />
        Les inscrits ne sont pas prévenus automatiquement d’un changement. Pour une nouvelle date ou
        un nouveau lieu, prévenez-les vous-mêmes.
      </p>
    </SettingsSection>
  );
}
