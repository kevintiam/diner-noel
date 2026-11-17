// Lecture d'une capture de paiement par un organisateur connecté (architecture AD-8, AD-9).
// La capture n'a jamais d'adresse publique : sans session, la route répond 401.
import { NextResponse } from "next/server";
import { requireOrganizerForApi } from "@/server/auth/require-organizer";
import { handleApiError } from "@/server/errors/handle-api-error";
import { getProofImage } from "@/server/services/proof.service";

const ROUTE = "/api/admin/proofs/[id]";
const ADMIN_LANG = "fr";
// Données personnelles : aucune copie dans un cache, ni partagé ni du navigateur.
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * Renvoie l'image d'une capture, telle qu'elle a été enregistrée.
 * @param {Request} request La requête (inutilisée).
 * @param {{ params: Promise<{ id: string }> }} context L'identifiant de la capture.
 * @returns {Promise<Response>} L'image, ou l'enveloppe d'erreur JSON.
 */
export async function GET(request, { params }) {
  try {
    await requireOrganizerForApi();
    const { id } = await params;
    const image = await getProofImage(id);
    return new Response(image.data, {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": image.mimeType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const { status, body } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: ROUTE, method: "GET" },
    });
    return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
  }
}
