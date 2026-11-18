import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { getMigrationDatabaseUrl, parseEnv as validateEnv } from "./env.js";

const TEST_ENV_KEYS = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "DIRECT_URL", "DATABASE_IS_TEST"];
const EMAIL_ENV_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"];

/**
 * Isole les connexions de test des variables héritées et des fichiers Next locaux.
 * @param {string} path Le fichier de test.
 * @param {Record<string, string | undefined>} environment Les variables cibles.
 * @returns {void}
 * @throws {Error} Si le fichier manque ou ne déclare pas une connexion de test valide.
 */
export function loadTestEnv(path, environment = process.env) {
  // Neutraliser aussi les valeurs présentes dans .env.test : aucun test n'envoie de vrai courriel.
  for (const key of EMAIL_ENV_KEYS) environment[key] = "";
  environment.SITE_URL = "http://localhost:3100";
  // Toujours fictif, même si le processus hérite d'un secret réel.
  environment.RATE_LIMIT_SECRET = "secret-fictif-test-isole-uniquement-2026";
  // Une chaîne vide empêche Next de compléter avec le fichier .env de développement.
  for (const key of TEST_ENV_KEYS) environment[key] = "";
  for (const key of Object.keys(environment)) {
    if (key.startsWith("PG")) environment[key] = "";
  }
  const variables = parseEnv(readFileSync(path, "utf8"));
  validateEnv(variables);
  getMigrationDatabaseUrl(variables);
  if (variables.DATABASE_IS_TEST !== "true") {
    throw new Error(".env.test doit déclarer DATABASE_IS_TEST=true.");
  }
  for (const key of TEST_ENV_KEYS) environment[key] = variables[key] ?? "";
}
