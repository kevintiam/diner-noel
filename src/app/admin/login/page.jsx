// Connexion au tableau de bord. La page est fixe ; seul le renvoi d'un organisateur
// déjà connecté lit la session, sous <Suspense> (architecture AD-15).
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSignedInOrganizer } from "@/server/auth/require-organizer";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

/** @type {import("next").Metadata} */
export const metadata = { title: "Connexion · Tableau de bord" };

/**
 * Affiche le formulaire de connexion des organisateurs.
 * @returns {React.ReactElement} La page de connexion.
 */
export default function AdminLoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.welcome} aria-hidden="true">
          <div className={styles.welcomePhoto}>
            <Image
              src="/images/christmas-table.webp"
              alt=""
              fill
              sizes="(min-width: 960px) 460px, 100vw"
              className={styles.image}
            />
          </div>
        </div>
        <section className={styles.formSide} aria-labelledby="login-title">
          <span className={styles.lock} aria-hidden="true">
            <LockKeyhole className={styles.lockIcon} />
          </span>
          <h1 id="login-title" className={styles.title}>
            Espace organisateurs
          </h1>
          <p className={styles.intro}>
            Connectez-vous pour gérer les réservations et les paiements du dîner.
          </p>
          <LoginForm />
          <p className={styles.note}>Pour obtenir un accès, contactez le responsable du dîner.</p>
        </section>
      </div>
      <Link href="/fr" className={styles.back}>
        <ArrowLeft aria-hidden="true" className={styles.backIcon} />
        Retour au site du dîner
      </Link>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
    </div>
  );
}

/**
 * Envoie au tableau de bord un organisateur déjà connecté.
 * @returns {Promise<null>}
 */
async function RedirectIfSignedIn() {
  if (await getSignedInOrganizer()) {
    redirect("/admin");
  }
  return null;
}
