import { Church } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import LanguageSwitcher, { LanguageToggle } from "@/components/ui/LanguageSwitcher";
import { getOtherLanguage } from "@/i18n/locales";
import { translate } from "@/i18n/translate";
import styles from "./SiteHeader.module.css";

const NAVIGATION = [
  { anchor: "informations", label: "information" },
  { anchor: "reservation", label: "booking" },
  { anchor: "faq", label: "faq" },
];

/**
 * Affiche l'identité du dîner, les sections de l'accueil et les actions publiques.
 * @param {{ lang: string, dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} L'en-tête bilingue.
 */
export default function SiteHeader({ lang, dictionary }) {
  const label = translate(dictionary, "language.switchLabel");
  const otherLanguageName = translate(dictionary, "language.otherLanguageName");
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href={`/${lang}`}
          className={styles.brand}
          aria-label={translate(dictionary, "header.homeLabel")}
        >
          <span className={styles.brandMark}>
            <Church aria-hidden="true" className={styles.brandIcon} />
          </span>
          <span>{translate(dictionary, "header.brand")}</span>
        </Link>
        <nav className={styles.navigation} aria-label={translate(dictionary, "header.navigation")}>
          {NAVIGATION.map(({ anchor, label: navigationLabel }) => (
            <Link key={anchor} href={`/${lang}#${anchor}`}>
              {translate(dictionary, `header.nav.${navigationLabel}`)}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          {/* Le lien personnel n'est connu qu'à la demande. */}
          <Suspense
            fallback={
              <LanguageToggle
                lang={lang}
                otherHref={`/${getOtherLanguage(lang)}`}
                label={label}
                otherLanguageName={otherLanguageName}
              />
            }
          >
            <LanguageSwitcher lang={lang} label={label} otherLanguageName={otherLanguageName} />
          </Suspense>
          <Link href={`/${lang}/reservation`} className={styles.reserve}>
            {translate(dictionary, "header.reserve")}
          </Link>
        </div>
      </div>
    </header>
  );
}
