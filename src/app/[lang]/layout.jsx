// Layout racine du site public : une version par langue (architecture AD-3).
import { EB_Garamond, Source_Sans_3 } from "next/font/google";
import { notFound } from "next/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, LOCALES } from "@/i18n/locales";
import { translate } from "@/i18n/translate";
import "../globals.css";
import styles from "./layout.module.css";

const titleFont = EB_Garamond({ subsets: ["latin"], variable: "--font-title" });
const textFont = Source_Sans_3({ subsets: ["latin"], variable: "--font-text" });

/**
 * Les deux langues sont construites à l'avance.
 * @returns {{ lang: string }[]}
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * Titre et description de la page, dans la langue de l'adresse.
 * @param {{ params: Promise<{ lang: string }> }} props
 * @returns {Promise<import("next").Metadata>} Les métadonnées traduites.
 */
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  return {
    title: translate(dictionary, "meta.title"),
    description: translate(dictionary, "meta.description"),
  };
}

/**
 * Affiche le document et le choix de langue de toutes les pages publiques.
 * @param {{ children: React.ReactNode, params: Promise<{ lang: string }> }} props
 * @returns {Promise<React.ReactElement>} Le document de la langue choisie.
 */
export default async function PublicLayout({ children, params }) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const dictionary = getDictionary(lang);
  return (
    <html lang={lang} className={`${titleFont.variable} ${textFont.variable}`}>
      <body>
        <header className={styles.header}>
          <LanguageSwitcher
            lang={lang}
            label={translate(dictionary, "language.switchLabel")}
            otherLanguageName={translate(dictionary, "language.otherLanguageName")}
          />
        </header>
        {children}
      </body>
    </html>
  );
}
