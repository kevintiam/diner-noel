"use client";

// Bouton « Copier » : met une valeur dans le presse-papiers et le confirme
// quelques secondes. Si le navigateur refuse, la valeur reste affichée à côté.
import { useEffect, useState } from "react";
import styles from "./CopyButton.module.css";

const COPIED_FEEDBACK_MS = 2000;

/**
 * Affiche un bouton qui copie une valeur dans le presse-papiers et confirme la copie.
 * `shape="pill"` l'arrondit comme les autres boutons du tableau de bord ; le site public
 * garde la forme par défaut.
 * @param {{ value: string, label: string, copiedLabel: string, describedBy?: string, shape?: "default" | "pill" }} props
 * @returns {React.ReactElement} Le bouton.
 */
export default function CopyButton({ value, label, copiedLabel, describedBy, shape = "default" }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }
    const timer = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch {
      // Presse-papiers refusé (navigateur ancien, permission) : on n'affiche pas « Copié »,
      // la valeur reste lisible à côté du bouton pour être recopiée à la main.
      setIsCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={shape === "pill" ? `${styles.button} ${styles.pill}` : styles.button}
      onClick={handleCopy}
      aria-describedby={describedBy}
    >
      <span aria-live="polite">{isCopied ? copiedLabel : label}</span>
    </button>
  );
}
