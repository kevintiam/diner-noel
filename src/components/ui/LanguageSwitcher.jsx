"use client";

// Lien vers la même page dans l'autre langue, présent sur toutes les pages publiques.
// Sur une page dont l'adresse n'est connue qu'à la demande (lien personnel), le
// layout l'affiche sous Suspense, avec LanguageLink vers l'accueil comme repli.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getOtherLanguage } from "@/i18n/locales";
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
 * Lien de changement de langue vers une adresse donnée.
 * @param {{ href: string, otherLang: string, label: string, otherLanguageName: string }} props
 * @returns {React.ReactElement} Le lien.
 */
export function LanguageLink({ href, otherLang, label, otherLanguageName }) {
  return (
    <nav aria-label={label}>
      <Link href={href} hrefLang={otherLang} lang={otherLang} className={styles.link}>
        {otherLanguageName}
      </Link>
    </nav>
  );
}

/**
 * Propose la page courante dans l'autre langue.
 * @param {{ lang: string, label: string, otherLanguageName: string }} props
 * @returns {React.ReactElement} Le lien de changement de langue.
 */
export default function LanguageSwitcher({ lang, label, otherLanguageName }) {
  const pathname = usePathname() ?? `/${lang}`;
  const otherLang = getOtherLanguage(lang);
  return (
    <LanguageLink
      href={switchPathLanguage(pathname, otherLang)}
      otherLang={otherLang}
      label={label}
      otherLanguageName={otherLanguageName}
    />
  );
}
