// Layout racine du site public : une version par langue (architecture AD-3).
import { notFound } from "next/navigation";
import { getSiteUrl } from "@/config/env";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale, LOCALES } from "@/i18n/locales";
import { translate } from "@/i18n/translate";
import { textFont, titleFont } from "../fonts";
import "../globals.css";
import styles from "./layout.module.css";

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
  const title = translate(dictionary, "meta.title");
  const description = translate(dictionary, "meta.description");
  const origin = getSiteUrl();
  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: new URL(`/${lang}`, origin).href,
      locale: lang === "en" ? "en_CA" : "fr_CA",
      images: [{ url: new URL("/images/christmas-banquet.jpg", origin).href, alt: title }],
    },
  };
}

/**
 * Affiche le document, l'en-tête et le pied de page de toutes les pages publiques.
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
      <body className={styles.body}>
        <SiteHeader lang={lang} dictionary={dictionary} />
        <div className={styles.content}>{children}</div>
        <SiteFooter dictionary={dictionary} />
      </body>
    </html>
  );
}
