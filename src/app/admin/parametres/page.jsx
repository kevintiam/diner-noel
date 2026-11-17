// Écran Paramètres de l'événement (maquette 8). Le titre est fixe ; la lecture de la session
// et de la base arrive sous <Suspense>, après requireOrganizer() (architecture AD-9, AD-15).
import { CircleCheck } from "lucide-react";
import { Suspense } from "react";
import EventSettingsForm from "@/components/admin/EventSettingsForm";
import LoadingBlocks from "@/components/admin/LoadingBlocks";
import { requireOrganizer } from "@/server/auth/require-organizer";
import { getEventSettings } from "@/server/services/event-settings.service";
import styles from "../admin-page.module.css";

const SAVED_PARAM = "enregistre";

/** @typedef {Promise<Record<string, string | string[] | undefined>>} SearchParams */

/**
 * Affiche les paramètres modifiables de l'événement.
 * @param {{ searchParams: SearchParams }} props
 * @returns {React.ReactElement} L'écran Paramètres.
 */
export default function EventSettingsPage({ searchParams }) {
  return (
    <>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Tableau de bord</p>
        <h1 className={styles.title}>Paramètres de l’événement</h1>
        <p className={styles.subtitle}>
          Date, lieu, places, prix et paiement : ce que vous changez ici s’affiche aussitôt sur le
          site.
        </p>
      </header>
      <Suspense fallback={<LoadingBlocks label="Chargement des paramètres…" />}>
        <EventSettings searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/**
 * Vérifie l'organisateur, puis lit les paramètres et le message d'enregistrement.
 * @param {{ searchParams: SearchParams }} props
 * @returns {Promise<React.ReactElement>}
 */
async function EventSettings({ searchParams }) {
  await requireOrganizer();
  const settings = await getEventSettings();
  const isSaved = (await searchParams)[SAVED_PARAM] === "1";
  return (
    <>
      {isSaved ? (
        <p role="status" className={`${styles.success} ${styles.formWidth}`}>
          <CircleCheck aria-hidden="true" className={styles.noticeIcon} />
          Modifications enregistrées. Elles s’affichent déjà sur le site.
        </p>
      ) : null}
      <EventSettingsForm settings={settings} />
    </>
  );
}
