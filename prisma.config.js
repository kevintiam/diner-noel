// Configuration de la CLI Prisma (génération, migrations, seed).
// Prisma 7 ne lit plus `.env` tout seul : on le charge ici, sauf si la
// variable est déjà fournie (variables Netlify, ou `node --env-file=.env.test`).
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";
import { getMigrationDatabaseUrl } from "./src/config/env.js";

const LOCAL_ENV_FILE = ".env";

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DIRECT_URL && existsSync(LOCAL_ENV_FILE)) {
  process.loadEnvFile(LOCAL_ENV_FILE);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file-if-exists=.env prisma/seed.js",
  },
  datasource: {
    // Lecture directe, sans le helper `env()` qui échoue quand la variable
    // manque : `prisma generate` doit marcher sur un clone neuf et sur Netlify.
    // Les migrations passent par la connexion directe (non poolée) de Neon.
    url: getMigrationDatabaseUrl(process.env),
  },
});
