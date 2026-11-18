// Prépare uniquement le fichier privé local ; aucun secret n’est affiché.
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { getRateLimitSecret } from "../src/config/env.js";
import { logger } from "../src/lib/logger.js";

/**
 * Ajoute une clé aléatoire dans .env seulement si aucune clé n’y est déjà définie.
 * @returns {void} La configuration locale, ou une erreur sans valeur privée.
 */
function configureLocalSecret() {
  const contents = readFileSync(".env", "utf8");
  const variables = parseEnv(contents);
  if (variables.RATE_LIMIT_SECRET?.trim()) {
    getRateLimitSecret(variables);
    logger.info("rate_limit_secret_already_configured");
    return;
  }
  // Ajouter une dernière définition conserve chaque octet, même dans les valeurs multilignes.
  const secret = randomBytes(32).toString("hex");
  appendFileSync(".env", `${contents.endsWith("\n") ? "" : "\n"}RATE_LIMIT_SECRET="${secret}"\n`);
  logger.info("rate_limit_secret_created");
}

configureLocalSecret();
