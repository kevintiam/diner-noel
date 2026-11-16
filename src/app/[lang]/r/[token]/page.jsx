// Étape 2 sur 2 : la page de paiement, dont l'adresse est le lien personnel
// (architecture AD-7). Le jeton n'est connu qu'à la demande : tout est lu sous
// Suspense (AD-15). La page n'est jamais indexée par les moteurs de recherche.
import { Suspense } from "react";
import PaymentDetails from "./_components/PaymentDetails";
import styles from "./page.module.css";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Affiche la page de paiement du lien personnel, lue sous Suspense.
 * @param {{ params: Promise<{ lang: string, token: string }> }} props
 * @returns {React.ReactElement} La page de paiement.
 */
export default function PaymentPage({ params }) {
  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <PaymentDetails params={params} />
      </Suspense>
    </main>
  );
}
