// Étape 1 sur 2 : vos informations (maquette 2). Le texte fixe est rendu à
// l'avance ; les places et l'état des réservations sont lus à la demande (AD-15).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import StepIndicator from "@/components/reservations/StepIndicator";
import { getDictionary } from "@/i18n/get-dictionary";
import { translate } from "@/i18n/translate";
import ReservationFormSection from "./_components/ReservationFormSection";
import styles from "./page.module.css";

/**
 * Affiche l'étape 1 sur 2 : l'en-tête fixe, puis le formulaire lu à la demande.
 * @param {{ params: Promise<{ lang: string }> }} props
 * @returns {Promise<React.ReactElement>} La page du formulaire.
 */
export default async function ReservationPage({ params }) {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  return (
    <main className={styles.main}>
      <Link href={`/${lang}`} className={styles.back}>
        <ArrowLeft aria-hidden="true" />
        {translate(dictionary, "reservation.backHome")}
      </Link>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>{translate(dictionary, "reservation.title")}</h1>
          <p className={styles.intro}>{translate(dictionary, "reservation.intro")}</p>
        </div>
        <div className={styles.progress}>
          <StepIndicator current={1} total={2} dictionary={dictionary} />
        </div>
      </div>
      <Suspense
        fallback={
          <p className={styles.loading} role="status">
            {translate(dictionary, "reservation.loading")}
          </p>
        }
      >
        <ReservationFormSection lang={lang} />
      </Suspense>
    </main>
  );
}
