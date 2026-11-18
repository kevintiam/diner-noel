// Captures reçues pour une réservation (story 2.2). Les images passent par la route
// protégée des organisateurs (architecture AD-8) ; un clic les ouvre en grand.
import { FileImage, ImageOff } from "lucide-react";
import { formatShortDateTime } from "@/lib/format";
import ProofGallery from "./ProofGallery";
import styles from "./ReservationDetail.module.css";

const BYTES_PER_KILOBYTE = 1024;
const PROOF_IMAGE_PATH = "/api/admin/proofs";

/**
 * Avec `featured`, la capture la plus récente est montrée en grand (paiement à vérifier).
 * @param {{ proofs: Array<{ id: string, byteSize: number, createdAt: Date }>, featured?: boolean }} props
 * @returns {React.ReactElement} La liste des captures reçues.
 */
export default function ProofList({ proofs, featured = false }) {
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
        // Textes mis en forme ici, côté serveur : la galerie les affiche tels quels.
        <ProofGallery
          featured={featured}
          proofs={proofs.map((proof, index) => ({
            id: proof.id,
            src: `${PROOF_IMAGE_PATH}/${encodeURIComponent(proof.id)}`,
            name: `Capture ${proofs.length - index}`,
            meta: `reçue le ${formatShortDateTime(proof.createdAt, "fr")} · ${Math.ceil(proof.byteSize / BYTES_PER_KILOBYTE)} Ko`,
          }))}
        />
      )}
    </section>
  );
}
