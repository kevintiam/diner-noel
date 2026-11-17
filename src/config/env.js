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

// Nom affiché à côté de l'adresse d'expédition quand EMAIL_FROM n'en donne pas.
export const DEFAULT_SENDER_NAME = "Dîner de Noël";
const SENDER_NAME_MAX_LENGTH = 64;
// « Nom <adresse> ». Le nom n'a ni chevron, ni guillemet, ni retour à la ligne :
// un retour à la ligne permettrait d'ajouter un en-tête au courriel.
const NAMED_SENDER_PATTERN = /^([^<>"\r\n]+)<([^<>\s]+)>$/;

/**
 * Expéditeur des courriels : EMAIL_FROM vaut une adresse seule ou « Nom <adresse> ».
 * Sans nom, le courriel s'affiche au nom du dîner.
 */
const senderSchema = z
  .string()
  .trim()
  .transform((value) => {
    const match = NAMED_SENDER_PATTERN.exec(value);
    if (!match) {
      return { name: DEFAULT_SENDER_NAME, address: value };
    }
    return { name: match[1].trim(), address: match[2] };
  })
  .pipe(
    z.object({
      name: z.string().min(1).max(SENDER_NAME_MAX_LENGTH),
      address: z.email(),
    }),
  );

const emailEnvSchema = z.object({
  SITE_URL: z.url({ protocol: /^https?$/ }).refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return (
      (url.protocol === "https:" || isLocal) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
    );
  }),
  SMTP_HOST: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-zA-Z0-9.-]+$/),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  SMTP_USER: z.string().trim().min(1),
  SMTP_PASSWORD: z.string().min(1),
  EMAIL_FROM: senderSchema,
});

/** @typedef {z.infer<typeof emailEnvSchema>} EmailEnv */

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
 * Valide le courriel indépendamment de la base, sans divulguer les valeurs fautives.
 * @param {Record<string, unknown>} source Les variables à vérifier.
 * @returns {EmailEnv} La configuration validée.
 * @throws {Error} Si une variable est absente ou invalide (noms uniquement).
 */
export function parseEmailEnv(source) {
  const result = emailEnvSchema.safeParse(source);
  if (result.success) return result.data;
  const names = result.error.issues.map((issue) => issue.path.join("."));
  throw new Error(`Variables de courriel manquantes ou invalides : ${names.join(", ")}`);
}

/**
 * Valide la configuration seulement quand un courriel est demandé, jamais au build.
 * @returns {EmailEnv} Les variables du processus validées.
 * @throws {Error} Si la configuration du courriel est incomplète.
 */
export function getEmailEnv() {
  return parseEmailEnv(process.env);
}

/**
 * Indique si l'application tourne en production : le cookie de session y exige HTTPS.
 * @param {Record<string, string | undefined>} [source] Les variables à lire.
 * @returns {boolean} Vrai seulement quand NODE_ENV vaut « production ».
 */
export function isProduction(source = process.env) {
  return source.NODE_ENV === "production";
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
