"use client";

// Lien vers la même page dans l'autre langue, présent sur toutes les pages publiques.
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./LanguageSwitcher.module.css";

/**
 * Remplace la langue en tête de l'adresse (ex. /fr/reservation → /en/reservation).
 * @param {string} pathname L'adresse actuelle.
 * @param {string} targetLang La langue voulue.
 * @returns {string} L'adresse dans la langue voulue.
 */
export function switchPathLanguage(pathname, targetLang) {
  const segments = pathname.split("/");
  segments[1] = targetLang;
  return segments.join("/");
}

/**
 * Propose la page courante dans l'autre langue.
 * @param {{ lang: string, label: string, otherLanguageName: string }} props
 * @returns {React.ReactElement} Le lien de changement de langue.
 */
export default function LanguageSwitcher({ lang, label, otherLanguageName }) {
  const pathname = usePathname() ?? `/${lang}`;
  const otherLang = lang === "fr" ? "en" : "fr";
  return (
    <nav aria-label={label}>
      <Link
        href={switchPathLanguage(pathname, otherLang)}
        hrefLang={otherLang}
        lang={otherLang}
        className={styles.link}
      >
        {otherLanguageName}
      </Link>
    </nav>
  );
}
