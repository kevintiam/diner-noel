import { z } from "zod";

export const MAX_PROOF_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const proofInputSchema = z.object({
  proof: z
    .file({ error: "proof.fileRequired" })
    .min(1, { error: "proof.fileRequired" })
    .max(MAX_PROOF_BYTES, { error: "errors.proofTooLarge" }),
  confirmTransfer: z.literal("on", { error: "proof.confirmRequired" }),
  lang: z.enum(["fr", "en"], { error: "proof.langInvalid" }),
});
