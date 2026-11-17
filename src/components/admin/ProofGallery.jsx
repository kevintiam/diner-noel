"use client";

// Vignettes des captures de paiement ; un clic ouvre la capture en grand, avant de décider.
// Les images passent par la route réservée aux organisateurs (architecture AD-8) : `unoptimized`
// les sert telles quelles, sans l'optimiseur de Next, qui les lirait sans la session et les garderait en cache.
import { Expand, ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./ProofGallery.module.css";

/**
 * Capture prête à afficher, avec des textes déjà mis en forme par le serveur.
 * @typedef {object} GalleryProof
 * @property {string} id
 * @property {string} src L'adresse protégée de l'image.
 * @property {string} name Ex. « Capture 2 ».
 * @property {string} meta Ex. « reçue le 17 nov. 2026, 10 h 05 · 245 Ko ».
 */

/**
 * Affiche les captures en vignettes et la capture choisie en grand.
 * @param {{ proofs: GalleryProof[] }} props
 * @returns {React.ReactElement} La galerie.
 */
export default function ProofGallery({ proofs }) {
  /** @type {React.RefObject<HTMLDialogElement | null>} */
  const dialogRef = useRef(null);
  const [openProof, setOpenProof] = useState(/** @type {GalleryProof | null} */ (null));

  /** @param {GalleryProof} proof */
  function open(proof) {
    setOpenProof(proof);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  /**
   * Un clic sur le fond sombre, hors du cadre, ferme aussi la capture.
   * @param {React.MouseEvent<HTMLDialogElement>} event
   */
  function closeOnBackdrop(event) {
    if (event.target === dialogRef.current) {
      close();
    }
  }

  return (
    <>
      <ul className={styles.proofs}>
        {proofs.map((proof) => (
          <li key={proof.id}>
            <button
              type="button"
              className={styles.proofButton}
              aria-haspopup="dialog"
              onClick={() => open(proof)}
            >
              <span className={styles.thumb}>
                <Image
                  src={proof.src}
                  alt=""
                  fill
                  unoptimized
                  sizes="5rem"
                  className={styles.thumbImage}
                />
              </span>
              <span className={styles.proofText}>
                <span className={styles.proofName}>{proof.name}</span>
                <span className={styles.proofMeta}>{proof.meta}</span>
                <span className={styles.proofAction}>
                  <Expand aria-hidden="true" className={styles.actionIcon} />
                  Voir en grand
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {/* Fenêtre native : Échap la ferme et le focus revient sur la vignette. */}
      <dialog
        ref={dialogRef}
        className={styles.viewer}
        aria-labelledby="proof-viewer-title"
        onClose={() => setOpenProof(null)}
        onClick={closeOnBackdrop}
      >
        {openProof ? (
          <div className={styles.viewerBody}>
            <div className={styles.viewerHeader}>
              <h3 id="proof-viewer-title" className={styles.viewerTitle}>
                {openProof.name}
                <span className={styles.viewerMeta}>{openProof.meta}</span>
              </h3>
              <button type="button" className={styles.closeButton} onClick={close}>
                <X aria-hidden="true" className={styles.actionIcon} />
                Fermer
              </button>
            </div>
            <div className={styles.viewerFrame}>
              <Image
                src={openProof.src}
                alt={`${openProof.name} : capture du virement envoyée par le participant`}
                fill
                unoptimized
                sizes="100vw"
                className={styles.viewerImage}
              />
            </div>
            <a
              href={openProof.src}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.newTabLink}
            >
              <ExternalLink aria-hidden="true" className={styles.actionIcon} />
              Ouvrir dans un nouvel onglet pour zoomer
            </a>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
