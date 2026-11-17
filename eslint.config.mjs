import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";

// Aucun fichier écrit à la main ne dépasse cette taille (AGENTS.md).
const MAX_LINES_PER_FILE = 300;

const eslintConfig = defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      "max-lines": ["error", { max: MAX_LINES_PER_FILE }],
      "no-console": "error",
    },
  },
  {
    // Le journal est le seul module autorisé à écrire dans la console.
    files: ["src/lib/logger.js"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Code généré par Prisma : ni lu ni compté par ESLint.
    "src/generated/**",
    // Workflows générés et script personnel non suivi, hors du code du projet.
    "_bmad/render/**",
    "verifier-bmad.mjs",
  ]),
]);

export default eslintConfig;
