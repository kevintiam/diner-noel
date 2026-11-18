// Partie du bandeau réservée à un organisateur connecté : son nom, la déconnexion et les onglets.
// Sans session (page de connexion), rien ne s'affiche.
import { LogOut } from "lucide-react";
import { logoutOrganizerAction } from "@/server/actions/organizer.actions";
import { getSignedInOrganizer } from "@/server/auth/require-organizer";
import AdminTabs from "./AdminTabs";
import InitialsAvatar from "./InitialsAvatar";
import styles from "./AdminHeader.module.css";

/**
 * Affiche le compte connecté et la navigation du tableau de bord.
 * @returns {Promise<React.ReactElement | null>} Le compte et les onglets, ou rien sans session.
 */
export default async function AdminAccount() {
  const organizer = await getSignedInOrganizer();
  if (!organizer) {
    return null;
  }
  // Les initiales seules dans la barre : le nom complet reste en infobulle et pour les lecteurs d'écran.
  return (
    <>
      <div className={styles.account} title={`Connecté : ${organizer.name}`}>
        <InitialsAvatar name={organizer.name} tone="gold" />
        <span className={styles.accountText}>
          <span className={styles.accountLabel}>Connecté :</span>{" "}
          <strong className={styles.accountName}>{organizer.name}</strong>
        </span>
      </div>
      <form action={logoutOrganizerAction} className={styles.logoutForm}>
        <button type="submit" className={styles.logout}>
          <LogOut aria-hidden="true" className={styles.logoutIcon} />
          <span className={styles.logoutText}>Se déconnecter</span>
        </button>
      </form>
      <AdminTabs />
    </>
  );
}
