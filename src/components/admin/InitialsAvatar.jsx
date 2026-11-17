// Pastille ronde aux initiales d'une personne : repère visuel, sans photo ni donnée de plus.
import { getInitials } from "./reservation-labels";
import styles from "./InitialsAvatar.module.css";

/** @type {Record<"light" | "gold", string>} */
const TONE_CLASSES = { light: styles.light, gold: styles.gold };

/**
 * Affiche les initiales d'un nom dans un cercle. Décoratif : le nom est toujours écrit à côté.
 * @param {{ name: string, tone?: "light" | "gold" }} props
 * @returns {React.ReactElement} La pastille.
 */
export default function InitialsAvatar({ name, tone = "light" }) {
  return (
    <span className={`${styles.avatar} ${TONE_CLASSES[tone]}`} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}
