// Champ de formulaire accessible : étiquette, aide et erreur reliées au champ.
import styles from "./FormField.module.css";

/**
 * Affiche un champ de formulaire avec son étiquette, son aide et son erreur, reliées pour les lecteurs d'écran.
 * @param {{
 *   id: string,
 *   label: string,
 *   optionalLabel?: string,
 *   help?: string,
 *   error?: string,
 *   children: (fieldProps: { id: string, "aria-invalid": boolean, "aria-describedby"?: string }) => React.ReactNode,
 * }} props
 * @returns {React.ReactElement} Le champ complet.
 */
export default function FormField({ id, label, optionalLabel, help, error, children }) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optionalLabel ? <span className={styles.optional}> {optionalLabel}</span> : null}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className={styles.help}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
