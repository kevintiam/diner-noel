// Carte d'une partie de l'écran Paramètres : une icône, un titre, une phrase qui dit à quoi
// servent ces réglages, puis les champs.
import styles from "./SettingsSection.module.css";

/**
 * Affiche une partie de l'écran Paramètres.
 * @param {{ id: string, title: string, description: string, Icon: import("lucide-react").LucideIcon, children: React.ReactNode }} props
 * @returns {React.ReactElement} La carte.
 */
export default function SettingsSection({ id, title, description, Icon, children }) {
  return (
    <section id={`${id}-section`} aria-labelledby={id} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h2 id={id} className={styles.title}>
            {title}
          </h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
