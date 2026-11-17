import FormField from "@/components/ui/FormField";
import styles from "./ReservationForm.module.css";

const MAX_SEAT_COUNT_DIGITS = 2;

/**
 * Affiche un effectif par tranche d'âge, avec zéro autorisé.
 * @param {{ name: string, label: string, help: string, error?: string, value: string, max: number, isPending: boolean, decreaseLabel: string, increaseLabel: string, onChange: (value: string) => void }} props
 * @returns {React.ReactElement} Le champ et ses boutons.
 */
export default function AgeSeatCounter({
  name,
  label,
  help,
  error,
  value,
  max,
  isPending,
  decreaseLabel,
  increaseLabel,
  onChange,
}) {
  const count = Math.min(Math.max(Number(value) || 0, 0), max);
  return (
    <FormField id={name} label={label} help={help} error={error}>
      {(fieldProps) => (
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepButton}
            aria-label={decreaseLabel}
            aria-controls={name}
            disabled={isPending || count <= 0}
            onClick={() => onChange(String(count - 1))}
          >
            −
          </button>
          <input
            {...fieldProps}
            name={name}
            required
            disabled={isPending}
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            value={value}
            onChange={(event) =>
              onChange(event.target.value.replace(/\D/g, "").slice(0, MAX_SEAT_COUNT_DIGITS))
            }
            onBlur={() => onChange(String(count))}
            className={styles.seatsInput}
          />
          <button
            type="button"
            className={styles.stepButton}
            aria-label={increaseLabel}
            aria-controls={name}
            disabled={isPending || count >= max}
            onClick={() => onChange(String(count + 1))}
          >
            +
          </button>
        </div>
      )}
    </FormField>
  );
}
