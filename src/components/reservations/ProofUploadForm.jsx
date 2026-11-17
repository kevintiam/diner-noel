"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { translate } from "@/i18n/translate";
import { formatFileSize } from "@/lib/format";
import { ACCEPTED_PROOF_TYPES, MAX_PROOF_BYTES } from "@/validation/proof.schema";
import styles from "./ProofUploadForm.module.css";

/**
 * Dépose une capture privée et conserve les erreurs accessibles à côté des champs.
 * @param {{token: string, lang: string, dictionary: import("@/i18n/translate").Dictionary}} props
 * @returns {React.ReactElement} Le formulaire de dépôt.
 */
export default function ProofUploadForm({ token, lang, dictionary }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const alertRef = useRef(null);
  const [file, setFile] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [later, setLater] = useState(false);
  const t = (key) => translate(dictionary, key);

  function chooseFile(selected) {
    setFile(selected ?? null);
    setMessage("");
    const error = selected && fileError(selected);
    setErrors(error ? { proof: error } : {});
  }

  function fileError(selected) {
    if (!selected || selected.size === 0) return t("proof.fileRequired");
    if (selected.size > MAX_PROOF_BYTES) return t("errors.proofTooLarge");
    if (!ACCEPTED_PROOF_TYPES.includes(selected.type)) return t("errors.proofInvalidType");
    return "";
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = {};
    const invalidFile = fileError(file);
    if (invalidFile) nextErrors.proof = invalidFile;
    if (!confirmed) nextErrors.confirmTransfer = t("proof.confirmRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage(t("errors.validation"));
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }
    setPending(true);
    setMessage("");
    const body = new FormData();
    body.set("proof", file);
    body.set("confirmTransfer", "on");
    body.set("lang", lang);
    try {
      const response = await fetch(`/api/reservations/${token}/proofs`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error?.message ?? t("errors.internal"));
        setErrors(
          Object.fromEntries(
            (result.error?.details ?? []).map((detail) => [detail.field, detail.message]),
          ),
        );
        requestAnimationFrame(() => alertRef.current?.focus());
        if (response.status === 409) router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setMessage(t("errors.internal"));
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="proof-title">
      <h2 id="proof-title">{t("proof.title")}</h2>
      <p>{t("proof.intro")}</p>
      <form onSubmit={submit} noValidate className={styles.form}>
        {message && (
          <p role="alert" tabIndex={-1} ref={alertRef} className={styles.error}>
            {message}
          </p>
        )}
        <div
          className={styles.dropZone}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!pending) chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload aria-hidden="true" size={28} />
          <label htmlFor="proof-file">{t("proof.choose")}</label>
          <input
            id="proof-file"
            name="proof"
            type="file"
            ref={inputRef}
            accept={ACCEPTED_PROOF_TYPES.join(",")}
            disabled={pending}
            aria-describedby={`proof-help${errors.proof ? " proof-error" : ""}`}
            aria-invalid={Boolean(errors.proof)}
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <p id="proof-help">{t("proof.formats")}</p>
        </div>
        {file && (
          <p className={styles.filename}>
            {file.name} · {formatFileSize(file.size, lang)}
          </p>
        )}
        {errors.proof && (
          <p id="proof-error" className={styles.error}>
            {errors.proof}
          </p>
        )}
        <label className={styles.confirm}>
          <input
            name="confirmTransfer"
            type="checkbox"
            checked={confirmed}
            disabled={pending}
            onChange={(event) => setConfirmed(event.target.checked)}
            aria-invalid={Boolean(errors.confirmTransfer)}
            aria-describedby={errors.confirmTransfer ? "confirm-error" : undefined}
          />
          {t("proof.confirm")}
        </label>
        {errors.confirmTransfer && (
          <p id="confirm-error" className={styles.error}>
            {errors.confirmTransfer}
          </p>
        )}
        <button type="submit" className={styles.submit} disabled={pending}>
          {t(pending ? "proof.submitting" : "proof.submit")}
        </button>
        <button
          type="button"
          className={styles.later}
          disabled={pending}
          onClick={() => setLater(true)}
        >
          {t("proof.later")}
        </button>
        {later && <p role="status">{t("proof.laterMessage")}</p>}
      </form>
      <p className={styles.muted}>{t("proof.privacy")}</p>
    </section>
  );
}
