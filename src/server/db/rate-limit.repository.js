// Compteur de la limite de requêtes, stocké dans Postgres (architecture AD-11).
import { getPrisma } from "./prisma-client.js";

/**
 * Compte un envoi de plus pour une clé, en une seule instruction atomique :
 * la fenêtre repart à zéro quand elle a commencé avant `windowCutoff`.
 * @param {string} key La clé (ex. `reserve:<empreinte de l'adresse IP>`).
 * @param {Date} now L'instant de l'envoi.
 * @param {Date} windowCutoff Une fenêtre commencée à cet instant ou avant est échue.
 * @returns {Promise<number>} Le nombre d'envois dans la fenêtre en cours, celui-ci compris.
 */
export async function incrementRateLimit(key, now, windowCutoff) {
  /** @type {{ count: number }[]} */
  const rows = await getPrisma().$queryRaw`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= ${windowCutoff} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= ${windowCutoff} THEN ${now}
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count"`;
  return Number(rows[0].count);
}
