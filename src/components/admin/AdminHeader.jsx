// En-tête flottant du tableau de bord : une barre vert sapin arrondie, détachée du haut.
// Le titre est fixe ; les onglets et le compte lisent la session, donc sous <Suspense> (AD-15).
import { Star } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import AdminAccount from "./AdminAccount";
import styles from "./AdminHeader.module.css";

/**
 * Affiche le bandeau du tableau de bord.
 * @returns {React.ReactElement} L'en-tête.
 */
export default function AdminHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Star className={styles.brandIcon} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Dîner de Noël</span>
            <span className={styles.brandSection}>Espace organisateurs</span>
          </span>
        </Link>
        <Suspense fallback={null}>
          <AdminAccount />
        </Suspense>
      </div>
    </header>
  );
}
