// Client Prisma partagé, créé au premier usage (pas à l'import), pour que le
// build et les tests sans base n'aient besoin d'aucune variable d'environnement.
// Les imports sont relatifs, avec extension : `prisma/seed.js` charge ce
// module directement avec Node, qui ne connaît pas l'alias `@/`.
import { PrismaPg } from "@prisma/adapter-pg";
import { getEnv } from "../../config/env.js";
import { PrismaClient } from "../../generated/prisma/client.ts";

/** @type {{ prismaClient?: PrismaClient }} */
const globalStore = /** @type {any} */ (globalThis);

const CONNECTION_TIMEOUT_MS = 5_000;
const QUERY_TIMEOUT_MS = 8_000;

/**
 * Renvoie le client Prisma, créé une seule fois par processus
 * (globalThis évite d'en recréer un à chaque rechargement en développement).
 * Les variantes SSR/API peuvent exporter des classes différentes pour le même schéma :
 * leur identité ne doit jamais fermer une connexion utilisée par une autre requête.
 * Après `prisma generate`, redémarrer le serveur pour charger le nouveau schéma.
 * @returns {PrismaClient} Le client.
 * @throws {Error} Si DATABASE_URL manque ou est invalide.
 */
export function getPrisma() {
  if (!globalStore.prismaClient) {
    const adapter = new PrismaPg({
      connectionString: getEnv().DATABASE_URL,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
      statement_timeout: QUERY_TIMEOUT_MS,
    });
    globalStore.prismaClient = new PrismaClient({ adapter });
  }
  return globalStore.prismaClient;
}

/**
 * Ferme la connexion (scripts et tests uniquement).
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
  if (globalStore.prismaClient) {
    await globalStore.prismaClient.$disconnect();
    globalStore.prismaClient = undefined;
  }
}
