// Seul endroit qui lit l'adresse IP du visiteur (architecture AD-11).
// Netlify garantit l'en-tête x-nf-client-connection-ip ; x-forwarded-for sert en local.

const NETLIFY_CLIENT_IP_HEADER = "x-nf-client-connection-ip";
const FORWARDED_FOR_HEADER = "x-forwarded-for";
const UNKNOWN_CLIENT_IP = "unknown";

/**
 * Lit l'adresse IP du visiteur dans les en-têtes de la requête.
 * @param {{ get: (name: string) => string | null }} requestHeaders Les en-têtes.
 * @returns {string} L'adresse IP, ou `unknown`.
 */
export function getClientIp(requestHeaders) {
  const netlifyIp = requestHeaders.get(NETLIFY_CLIENT_IP_HEADER)?.trim();
  if (netlifyIp) {
    return netlifyIp;
  }
  // x-forwarded-for liste les adresses traversées : la première est celle du visiteur.
  const forwardedFor = requestHeaders.get(FORWARDED_FOR_HEADER) ?? "";
  const [firstForwardedIp] = forwardedFor.split(",");
  return firstForwardedIp.trim() || UNKNOWN_CLIENT_IP;
}
