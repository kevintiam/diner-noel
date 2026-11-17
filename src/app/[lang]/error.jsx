"use client";

// Page d'erreur générique, bilingue. Aucun détail technique n'est montré :
// l'erreur est déjà journalisée côté serveur (EventDetails).
import { startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { translate } from "@/i18n/translate";
import styles from "./status-page.module.css";

/**
 * Propose un nouvel essai avec un message générique traduit.
 * @param {{ reset: () => void }} props
 * @returns {React.ReactElement} L'état d'erreur public.
 */
export default function ErrorPage({ reset }) {
  const params = useParams();
  const router = useRouter();
  const lang = typeof params.lang === "string" ? params.lang : "fr";
  const dictionary = getDictionary(lang);
  function handleRetry() {
    // Réinitialiser seul réutilise le résultat serveur en erreur déjà reçu.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }
  return (
    <main className={styles.main}>
      <p role="alert" className={styles.text}>
        {translate(dictionary, "errors.internal")}
      </p>
      <button type="button" className={styles.button} onClick={handleRetry}>
        {translate(dictionary, "errors.retry")}
      </button>
    </main>
  );
}
