"use client";

// Interrupteur FR | EN de l'en-tête, présent sur toutes les pages publiques.
// La langue en cours est marquée active ; l'autre mène à la même page dans cette langue.
// Sur une page dont l'adresse n'est connue qu'à la demande (lien personnel), le layout
// l'affiche sous Suspense, avec LanguageToggle vers l'accueil comme repli.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getOtherLanguage, LOCALES } from "@/i18n/locales";
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
 * Affiche l'interrupteur FR | EN : la langue en cours, puis un lien vers l'autre.
 * @param {{ lang: string, otherHref: string, label: string, otherLanguageName: string }} props
 * @returns {React.ReactElement} L'interrupteur.
 */
export function LanguageToggle({ lang, otherHref, label, otherLanguageName }) {
  const otherLang = getOtherLanguage(lang);
  return (
    <nav aria-label={label} className={styles.toggle}>
      {LOCALES.map((locale) =>
        locale === lang ? (
          <span key={locale} className={styles.current} aria-current="true" lang={locale}>
            {locale.toUpperCase()}
          </span>
        ) : (
          <Link
            key={locale}
            href={otherHref}
            hrefLang={otherLang}
            lang={otherLang}
            aria-label={otherLanguageName}
            className={styles.option}
          >
            {locale.toUpperCase()}
          </Link>
        ),
      )}
    </nav>
  );
}

/**
 * Propose la page courante dans l'autre langue.
 * @param {{ lang: string, label: string, otherLanguageName: string }} props
 * @returns {React.ReactElement} L'interrupteur de langue.
 */
export default function LanguageSwitcher({ lang, label, otherLanguageName }) {
  const pathname = usePathname() ?? `/${lang}`;
  return (
    <LanguageToggle
      lang={lang}
      otherHref={switchPathLanguage(pathname, getOtherLanguage(lang))}
      label={label}
      otherLanguageName={otherLanguageName}
    />
  );
}
