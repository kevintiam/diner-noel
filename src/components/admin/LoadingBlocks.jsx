// Silhouettes grises affichées pendant la lecture de la base : la page garde sa forme
// au lieu de sauter. Le texte reste annoncé aux lecteurs d'écran.
import styles from "./LoadingBlocks.module.css";

/**
 * Affiche des blocs de chargement animés, avec un message pour les lecteurs d'écran.
 * @param {{ label: string, blocks?: Array<"tall" | "row"> }} props
 * @returns {React.ReactElement} Les silhouettes.
 */
export default function LoadingBlocks({ label, blocks = ["tall", "row", "row", "row"] }) {
  return (
    <div role="status" className={styles.loading}>
      <span className={styles.srOnly}>{label}</span>
      {blocks.map((kind, index) => (
        <span key={index} className={`${styles.block} ${styles[kind]}`} aria-hidden="true" />
      ))}
    </div>
  );
}
