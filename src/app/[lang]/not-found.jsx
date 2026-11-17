"use client";

// Page 404 bilingue. Composant client pour lire la langue dans l'adresse.
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/locales";
import { translate } from "@/i18n/translate";
import styles from "./status-page.module.css";

/**
 * Affiche la page introuvable dans la langue de l'adresse.
 * @returns {React.ReactElement} La page 404 traduite.
 */
export default function NotFoundPage() {
  const params = useParams();
  const lang = isLocale(params.lang) ? String(params.lang) : DEFAULT_LOCALE;
  const dictionary = getDictionary(lang);
  return (
    <main className={styles.main}>
      <h1>{translate(dictionary, "errors.notFoundTitle")}</h1>
      <p className={styles.text}>{translate(dictionary, "errors.notFoundText")}</p>
      <Link href={`/${lang}`} className={styles.button}>
        {translate(dictionary, "errors.backHome")}
      </Link>
    </main>
  );
}
