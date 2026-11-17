"use client";

// Formulaire de connexion des organisateurs. Les erreurs viennent du serveur
// (identifiants, champs, trop de tentatives) et s'affichent sans recharger la page.
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import FormField from "@/components/ui/FormField";
import { loginOrganizerAction } from "@/server/actions/organizer.actions";
import styles from "./login.module.css";

/** @typedef {import("@/server/actions/organizer.actions").LoginActionState} LoginActionState */

/**
 * Trouve le message d'erreur d'un champ dans la réponse du serveur.
 * @param {LoginActionState | null} state
 * @param {string} field
 * @returns {string | undefined}
 */
function findFieldError(state, field) {
  return state?.error.details?.find((detail) => detail.field === field)?.message;
}

/**
 * Affiche le courriel, le mot de passe et le bouton de connexion.
 * @returns {React.ReactElement} Le formulaire.
 */
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginOrganizerAction, null);
  return (
    <form action={formAction} className={styles.form} aria-busy={isPending} noValidate>
      {state?.error ? (
        <p role="alert" className={styles.alert}>
          {state.error.message}
        </p>
      ) : null}
      <FormField id="email" label="Courriel" error={findFieldError(state, "email")}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={state?.email ?? ""}
            disabled={isPending}
          />
        )}
      </FormField>
      <FormField id="password" label="Mot de passe" error={findFieldError(state, "password")}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
          />
        )}
      </FormField>
      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "Connexion…" : "Se connecter"}
        <LogIn aria-hidden="true" className={styles.submitIcon} />
      </button>
    </form>
  );
}
