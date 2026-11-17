// Captures reçues pour une réservation. Les images elles-mêmes s'afficheront par la route
// protégée des organisateurs (architecture AD-8, story 2.2) : la fiche ne les intègre pas.
import { FileImage, ImageOff } from "lucide-react";
import { formatShortDateTime } from "@/lib/format";
import styles from "./ReservationDetail.module.css";

const BYTES_PER_KILOBYTE = 1024;

/**
 * @param {{ proofs: Array<{ id: string, byteSize: number, createdAt: Date }> }} props
 * @returns {React.ReactElement} La liste des captures reçues.
 */
export default function ProofList({ proofs }) {
  return (
    <section aria-labelledby="proofs-title" className={styles.panel}>
      <h2 id="proofs-title" className={styles.panelTitle}>
        <span className={styles.panelIcon} aria-hidden="true">
          <FileImage />
        </span>
        Preuves de paiement
      </h2>
      {proofs.length === 0 ? (
        <p className={styles.empty}>
          <ImageOff aria-hidden="true" className={styles.emptyIcon} />
          Aucune capture reçue pour l’instant.
        </p>
      ) : (
        <ul className={styles.proofs}>
          {proofs.map((proof, index) => (
            <li key={proof.id} className={styles.proof}>
              <span className={styles.proofTile} aria-hidden="true">
                <FileImage className={styles.proofIcon} />
              </span>
              <span className={styles.proofText}>
                <span className={styles.proofName}>Capture {proofs.length - index}</span>
                <span className={styles.proofMeta}>
                  reçue le {formatShortDateTime(proof.createdAt, "fr")} ·{" "}
                  {Math.ceil(proof.byteSize / BYTES_PER_KILOBYTE)} Ko
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
