// Configuration Vitest. Les tests ne lisent QUE .env.test (base Neon `test`),
// jamais .env (base de développement).
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { loadTestEnv } from "./src/config/load-test-env.js";

const TEST_ENV_FILE = ".env.test";

loadTestEnv(TEST_ENV_FILE);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.js"],
          exclude: ["src/**/*.db.test.js"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.jsx"],
          setupFiles: ["./vitest.setup.js"],
        },
      },
      {
        extends: true,
        test: {
          // Tests sur la base : un fichier à la fois, car chacun vide les tables.
          name: "database",
          environment: "node",
          include: ["src/**/*.db.test.js"],
          fileParallelism: false,
        },
      },
    ],
  },
});
