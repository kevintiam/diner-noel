// Proxy Next.js (ex-middleware) : envoie toute adresse sans langue vers
// /fr ou /en, selon le navigateur. Il ne fait rien d'autre et ne protège
// aucune page (architecture AD-3 et AD-9).
import { NextResponse } from "next/server";
import { isLocale } from "./i18n/locales.js";
import { pickLocale } from "./i18n/pick-locale.js";

/**
 * Redirige vers la même adresse précédée de la langue choisie.
 * @param {import("next/server").NextRequest} request La requête entrante.
 * @returns {NextResponse} La suite normale, ou une redirection.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];
  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }
  const locale = pickLocale(request.headers.get("accept-language"));
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Laisse passer l'API, le tableau de bord, les fichiers internes de Next et
  // tout fichier avec une extension (favicon, images…).
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
