"use client";

// Partie « Prix des places » de l'écran Paramètres : le prix normal (avant promo), le prix promo
// (après réduction) et sa période, puis le calendrier des prix qui suit la saisie en direct.
import { Info, Tag } from "lucide-react";
import { useState } from "react";
import FormField from "@/components/ui/FormField";
import { formatMoney } from "@/lib/format";
import { describePriceSchedule } from "./price-schedule";
import SettingsSection from "./SettingsSection";
import sectionStyles from "./SettingsSection.module.css";
import styles from "./PriceFields.module.css";

/** @typedef {import("@/validation/event-settings.schema").EventSettingsFormValues} EventSettingsFormValues */

/**
 * Rappelle que les réservations déjà faites gardent leur prix (AD-6).
 * @param {number} count Les réservations non annulées.
 * @returns {string}
 */
export function describeKeptPrices(count) {
  if (count === 0) {
    return "Aucune réservation n’est encore faite.";
  }
  if (count === 1) {
    return "La réservation déjà faite garde son prix.";
  }
  return `Les ${count} réservations déjà faites gardent leur prix.`;
}

/**
 * Champ de prix en dollars, avec le symbole $ affiché dans le champ.
 * @param {{ id: string, label: string, help: string, value: string, error?: string, isRequired: boolean, onChange: React.ChangeEventHandler<HTMLInputElement> }} props
 * @returns {React.ReactElement}
 */
function MoneyField({ id, label, help, value, error, isRequired, onChange }) {
  return (
    <FormField id={id} label={label} help={help} error={error}>
      {(fieldProps) => (
        <span className={styles.money}>
          <input
            {...fieldProps}
            name={id}
            inputMode="decimal"
            autoComplete="off"
            required={isRequired}
            value={value}
            onChange={onChange}
            className={styles.moneyInput}
          />
          <span className={styles.currency} aria-hidden="true">
            $
          </span>
        </span>
      )}
    </FormField>
  );
}

/**
 * Affiche le prix normal, la promo et le calendrier des prix.
 * @param {{ values: EventSettingsFormValues, errorOf: (field: string) => string | undefined, activeReservations: number }} props
 * @returns {React.ReactElement} La carte « Prix des places ».
 */
export default function PriceFields({ values, errorOf, activeReservations }) {
  const [prices, setPrices] = useState({
    unitPrice: values.unitPrice,
    hasPromotion: values.hasPromotion,
    promotionalUnitPrice: values.promotionalUnitPrice,
    promotionStartDate: values.promotionStartDate,
    promotionEndDate: values.promotionEndDate,
  });
  const schedule = describePriceSchedule(prices);

  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  function handleTextChange(event) {
    const { name, value } = event.target;
    setPrices((current) => ({ ...current, [name]: value }));
  }

  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  function handlePromotionToggle(event) {
    const { checked } = event.target;
    setPrices((current) => ({ ...current, hasPromotion: checked }));
  }

  return (
    <SettingsSection
      id="settings-prices"
      title="Prix des places"
      description="Pour les 15 ans et plus. Les enfants de 0 à 14 ans restent gratuits."
      Icon={Tag}
    >
      <MoneyField
        id="unitPrice"
        label="Prix normal (avant promo)"
        help="En dollars. Il s’applique en dehors de la période de promo."
        value={prices.unitPrice}
        error={errorOf("unitPrice")}
        isRequired
        onChange={handleTextChange}
      />

      <div className={sectionStyles.checkboxField}>
        <input
          id="hasPromotion"
          name="hasPromotion"
          type="checkbox"
          className={sectionStyles.checkbox}
          checked={prices.hasPromotion}
          onChange={handlePromotionToggle}
          aria-controls="promotion-fields"
        />
        <label htmlFor="hasPromotion" className={styles.toggleLabel}>
          Proposer un prix promo pendant une période
        </label>
      </div>

      {/* Masquée sans promo : ses champs ne sont alors ni exigés ni lus par le serveur.
          Le groupe donne le contexte aux lecteurs d'écran : « Premier jour » de la promo. */}
      <fieldset id="promotion-fields" className={styles.promotion} hidden={!prices.hasPromotion}>
        <legend className={styles.srOnly}>Prix promo et période</legend>
        <MoneyField
          id="promotionalUnitPrice"
          label="Prix promo (après réduction)"
          help="En dollars, plus bas que le prix normal."
          value={prices.promotionalUnitPrice}
          error={errorOf("promotionalUnitPrice")}
          isRequired={prices.hasPromotion}
          onChange={handleTextChange}
        />
        <div className={sectionStyles.columns2}>
          <FormField
            id="promotionStartDate"
            label="Premier jour"
            error={errorOf("promotionStartDate")}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="promotionStartDate"
                type="date"
                required={prices.hasPromotion}
                value={prices.promotionStartDate}
                onChange={handleTextChange}
              />
            )}
          </FormField>
          <FormField
            id="promotionEndDate"
            label="Dernier jour (inclus)"
            error={errorOf("promotionEndDate")}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                name="promotionEndDate"
                type="date"
                required={prices.hasPromotion}
                min={prices.promotionStartDate || undefined}
                value={prices.promotionEndDate}
                onChange={handleTextChange}
              />
            )}
          </FormField>
        </div>
      </fieldset>

      <div className={styles.schedule}>
        <p className={styles.scheduleTitle}>Ce que paie une personne de 15 ans et plus</p>
        {schedule ? (
          <ol className={styles.steps} aria-label="Calendrier des prix">
            {schedule.steps.map((step) => (
              <li
                key={step.period}
                className={
                  step.isPromotion ? `${styles.step} ${styles.promotionStep}` : styles.step
                }
              >
                <span className={styles.stepPeriod}>{step.period}</span>{" "}
                <span className={styles.stepPrice}>
                  {formatMoney(step.priceCents, "fr", { omitZeroCents: true })}
                </span>
                {step.isPromotion ? (
                  <span className={styles.saving}>
                    {" "}
                    Promo : −{formatMoney(schedule.savingCents, "fr", { omitZeroCents: true })} (
                    {schedule.savingPercent} %)
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.scheduleEmpty}>
            Entrez un prix normal valide pour voir le calendrier.
          </p>
        )}
        <p className={sectionStyles.note}>
          <Info aria-hidden="true" className={sectionStyles.noteIcon} />
          {describeKeptPrices(activeReservations)}
        </p>
      </div>
    </SettingsSection>
  );
}
