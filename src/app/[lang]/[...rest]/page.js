// Toute adresse inconnue sous /fr ou /en affiche la page 404 de la langue.
import { notFound } from "next/navigation";

/**
 * Déclenche la page introuvable pour toute adresse publique non définie.
 * @returns {never}
 */
export default function UnknownPage() {
  notFound();
}
