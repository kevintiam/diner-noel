// Lien personnel de la réservation sur la fiche admin : l'organisateur peut le donner
// à la personne qui l'a perdu ou dont le courriel n'est jamais arrivé. Si le navigateur
// refuse la copie, l'adresse reste lisible et sélectionnable à côté du bouton.
import { Link2, Link2Off } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import styles from "./PersonalLinkPanel.module.css";
import detailStyles from "./ReservationDetail.module.css";

// Ancre du panneau, que l'avis d'échec de courriel de la fiche peut viser.
export const PERSONAL_LINK_ANCHOR = "personal-link";
const URL_ID = "personal-link-url";

/**
 * Affiche le lien personnel de la réservation avec un bouton « Copier le lien ».
 * @param {{ url: string | null }} props L'adresse complète, ou null si SITE_URL n'est pas configurée.
 * @returns {React.ReactElement} Le panneau « Lien personnel ».
 */
export default function PersonalLinkPanel({ url }) {
  return (
    <section
      id={PERSONAL_LINK_ANCHOR}
      aria-labelledby="personal-link-title"
      className={detailStyles.panel}
    >
      <h2 id="personal-link-title" className={detailStyles.panelTitle}>
        <span className={detailStyles.panelIcon} aria-hidden="true">
          <Link2 />
        </span>
        Lien personnel
      </h2>
      {url ? (
        <>
          <p className={styles.help}>
            Il ouvre la page de la réservation : la personne y retrouve son montant, les
            instructions de paiement et l’état de sa réservation, et y dépose sa preuve tant que le
            paiement est attendu. Donnez-le seulement à elle.
          </p>
          <div className={styles.linkRow}>
            <p id={URL_ID} className={styles.url}>
              {url}
            </p>
            <CopyButton
              value={url}
              label="Copier le lien"
              copiedLabel="Lien copié"
              describedBy={URL_ID}
            />
          </div>
        </>
      ) : (
        <p className={detailStyles.empty}>
          <Link2Off aria-hidden="true" className={detailStyles.emptyIcon} />
          Lien indisponible : l’adresse publique du site (SITE_URL) n’est pas configurée.
        </p>
      )}
    </section>
  );
}
