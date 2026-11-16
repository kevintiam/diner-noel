// Variables d'environnement de l'application, vérifiées par Zod.
// La validation se fait au premier appel de getEnv() (pas à l'import) :
// le build et les tests sans base n'ont ainsi besoin d'aucune variable.
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_IS_TEST: z.enum(["true", "false"]).optional(),
});

const migrationEnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
  DIRECT_URL: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
});

/**
 * @typedef {z.infer<typeof envSchema>} AppEnv
 */

/** @type {AppEnv | undefined} */
let cachedEnv;

/**
 * Valide un ensemble de variables d'environnement.
 * @param {Record<string, string | undefined>} source Les variables à valider.
 * @returns {AppEnv} Les variables validées.
 * @throws {Error} Si une variable manque ou est invalide ; le message nomme chaque variable fautive.
 */
export function parseEnv(source) {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const invalidNames = result.error.issues.map((issue) => issue.path.join("."));
  throw new Error(`Variables d'environnement manquantes ou invalides : ${invalidNames.join(", ")}`);
}

/**
 * Renvoie les variables d'environnement validées, en les vérifiant une seule fois.
 * @returns {AppEnv} Les variables validées.
 * @throws {Error} Si une variable manque ou est invalide.
 */
export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

/**
 * Choisit la connexion directe des migrations ; aucune n'est requise pour générer le client.
 * @param {Record<string, string | undefined>} source Les variables déjà chargées.
 * @returns {string | undefined} La connexion directe, ou undefined sans configuration.
 * @throws {Error} Si une connexion fournie est invalide, sans en exposer la valeur.
 */
export function getMigrationDatabaseUrl(source) {
  const result = migrationEnvSchema.safeParse(source);
  if (!result.success) {
    const invalidNames = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Variables de migration invalides : ${invalidNames.join(", ")}`);
  }
  return result.data.DATABASE_URL_UNPOOLED ?? result.data.DIRECT_URL;
}
