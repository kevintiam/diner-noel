import { SITE_CONTACT_EMAIL, SITE_COPYRIGHT_YEAR } from "@/config/site";
import { translate } from "@/i18n/translate";
import styles from "./SiteFooter.module.css";

/**
 * Affiche l'identité de la communauté et le contact existant.
 * @param {{ dictionary: import("@/i18n/translate").Dictionary }} props
 * @returns {React.ReactElement} Le pied de page public.
 */
export default function SiteFooter({ dictionary }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>{translate(dictionary, "header.brand")}</p>
          <p>{translate(dictionary, "footer.copyright", { year: SITE_COPYRIGHT_YEAR })}</p>
        </div>
        <p className={styles.contact}>
          {translate(dictionary, "footer.question")}{" "}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>
        </p>
      </div>
    </footer>
  );
}
