// Connexion au tableau de bord. La page est fixe ; seul le renvoi d'un organisateur
// déjà connecté lit la session, sous <Suspense> (architecture AD-15).
import { ArrowLeft, History, LockKeyhole, ShieldCheck, Star, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSignedInOrganizer } from "@/server/auth/require-organizer";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

/** @type {import("next").Metadata} */
export const metadata = { title: "Connexion · Tableau de bord" };

const FEATURES = [
  { Icon: ShieldCheck, text: "Vérifiez les virements Interac, réservation par réservation." },
  { Icon: Users, text: "Suivez le remplissage du dîner et les places encore libres." },
  { Icon: History, text: "Retrouvez qui a confirmé, refusé ou annulé, et quand." },
];

/**
 * Affiche le formulaire de connexion des organisateurs.
 * @returns {React.ReactElement} La page de connexion.
 */
export default function AdminLoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.welcome}>
          <span className={styles.mark} aria-hidden="true">
            <Star className={styles.markIcon} />
          </span>
          <p className={styles.welcomeEyebrow}>Dîner de Noël</p>
          <p className={styles.welcomeTitle}>Les coulisses du dîner, au même endroit.</p>
          <ul className={styles.features}>
            {FEATURES.map(({ Icon, text }) => (
              <li key={text}>
                <Icon aria-hidden="true" className={styles.featureIcon} />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <section className={styles.formSide} aria-labelledby="login-title">
          <span className={styles.lock} aria-hidden="true">
            <LockKeyhole className={styles.lockIcon} />
          </span>
          <h1 id="login-title" className={styles.title}>
            Espace organisateurs
          </h1>
          <p className={styles.intro}>
            Connectez-vous pour vérifier les paiements et suivre les réservations du dîner.
          </p>
          <LoginForm />
          <p className={styles.note}>
            Pas encore de compte ? Demandez-le au responsable du site : les comptes ne se créent pas
            en ligne.
          </p>
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
