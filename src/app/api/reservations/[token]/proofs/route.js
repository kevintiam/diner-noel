import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { readLimitedFormData } from "@/lib/read-limited-form-data";
import { AppError } from "@/server/errors/app-error";
import { handleApiError } from "@/server/errors/handle-api-error";
import { buildRateLimitKey, checkRateLimit } from "@/server/services/rate-limit.service";
import { submitProof } from "@/server/services/proof.service";
import { MAX_PROOF_BYTES, proofInputSchema } from "@/validation/proof.schema";
import { isValidPersonalToken } from "@/validation/reservation.schema";

const MAX_MULTIPART_BYTES = MAX_PROOF_BYTES + 64 * 1024;
const ERROR_CONTEXT = { route: "/api/reservations/[token]/proofs", method: "POST" };

/**
 * Reçoit une image privée par multipart, avec lecture et validation bornées.
 * @param {Request} request La requête.
 * @param {{params: Promise<{token: string}>}} context Le jeton de la route.
 * @returns {Promise<NextResponse>} L'enveloppe traduite, sans capture ni coordonnées.
 */
export async function POST(request, { params }) {
  // La langue doit être disponible avant la lecture, même si le flux ne se termine pas.
  let lang = request.headers.get("accept-language")?.startsWith("en") ? "en" : "fr";
  try {
    await checkRateLimit({
      key: buildRateLimitKey("proof", getClientIp(request.headers)),
      limit: 20,
      windowSeconds: 15 * 60,
      now: new Date(),
    });
    const formData = await readLimitedFormData(request, MAX_MULTIPART_BYTES);
    lang = formData.get("lang") === "en" ? "en" : "fr";
    const { token } = await params;
    if (!isValidPersonalToken(token)) {
      throw new AppError(404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound");
    }
    const parsed = proofInputSchema.safeParse({
      proof: formData.get("proof"),
      confirmTransfer: formData.get("confirmTransfer"),
      lang: formData.get("lang"),
    });
    if (!parsed.success) {
      if (parsed.error.issues.some((issue) => issue.message === "errors.proofTooLarge")) {
        throw new AppError(413, "PROOF_TOO_LARGE", "errors.proofTooLarge");
      }
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "errors.validation",
        parsed.error.issues.map((issue) => ({
          field: String(issue.path[0]),
          messageKey: issue.message,
        })),
      );
    }
    const imageBytes = new Uint8Array(await parsed.data.proof.arrayBuffer());
    const data = await submitProof({ token, imageBytes });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error, { lang, context: ERROR_CONTEXT });
    return NextResponse.json(body, { status });
  }
}
