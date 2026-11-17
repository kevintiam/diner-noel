import FormField from "@/components/ui/FormField";
import { translate } from "@/i18n/translate";
import styles from "./ReservationForm.module.css";

/**
 * Regroupe les coordonnées du contact avec les aides et erreurs associées.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary, state: import("@/server/actions/reservation.actions").ReservationActionState | null, isPending: boolean }} props
 * @returns {React.ReactElement} Les champs du contact.
 */
export default function ReservationContactFields({ dictionary, state, isPending }) {
  const values = state?.values;
  /** @param {string} key */
  const getText = (key) => translate(dictionary, key);
  /** @param {string} field */
  const getFieldError = (field) =>
    state?.error.details?.find((detail) => detail.field === field)?.message;

  return (
    <div className={styles.contactFields}>
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
    </div>
  );
}
