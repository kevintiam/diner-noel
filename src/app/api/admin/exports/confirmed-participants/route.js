// Téléchargement du CSV des participants confirmés (architecture AD-2, AD-9, AD-15).
// Réservé aux organisateurs ; la base est lue à chaque requête, jamais depuis un cache.
import { NextResponse } from "next/server";
import { requireOrganizer } from "@/server/auth/require-organizer";
import { handleApiError } from "@/server/errors/handle-api-error";
import { buildConfirmedParticipantsExport } from "@/server/services/participant-export.service";

const ROUTE = "/api/admin/exports/confirmed-participants";
const ADMIN_LANG = "fr";

/**
 * Renvoie le fichier CSV ; sans session, renvoie vers la connexion.
 * @returns {Promise<Response>} Le fichier en pièce jointe, ou l'enveloppe d'erreur JSON.
 */
export async function GET() {
  // Hors du try : la redirection vers la connexion est une exception que Next doit recevoir.
  const organizer = await requireOrganizer();
  try {
    const { filename, content } = await buildConfirmedParticipantsExport({ now: new Date() });
    return new Response(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Données personnelles : ni cache partagé, ni copie gardée par le navigateur.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const { status, body } = handleApiError(error, {
      lang: ADMIN_LANG,
      context: { route: ROUTE, method: "GET", organizerId: organizer.id },
    });
    return NextResponse.json(body, { status });
  }
}
