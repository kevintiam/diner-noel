// Layout racine du tableau de bord, en français seulement (architecture AD-3).
// Il ne lit ni la session ni la base : ces lectures se font plus bas, sous <Suspense> (AD-15).
import AdminHeader from "@/components/admin/AdminHeader";
import { textFont, titleFont } from "../fonts";
import "../globals.css";
import styles from "./layout.module.css";

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Tableau de bord · Dîner de Noël",
  robots: { index: false, follow: false },
};

/**
 * Affiche le document, le bandeau et le contenu de toutes les pages du tableau de bord.
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactElement} Le document du tableau de bord.
 */
export default function AdminLayout({ children }) {
  return (
    <html lang="fr" className={`${titleFont.variable} ${textFont.variable} ${styles.root}`}>
      <body className={styles.body}>
        <AdminHeader />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
