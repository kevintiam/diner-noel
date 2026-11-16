// Configuration Playwright. Les parcours tournent sur la base Neon `test` :
// Les connexions et le drapeau hérités sont remplacés exclusivement depuis
// .env.test avant que Next ne démarre ; un fichier absent ou incomplet est refusé.
import { defineConfig, devices } from "@playwright/test";
import { loadTestEnv } from "./src/config/load-test-env.js";

const TEST_ENV_FILE = ".env.test";
const PORT = 3100;
const SERVER_START_TIMEOUT_MS = 240_000;

loadTestEnv(TEST_ENV_FILE);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.js",
  // Sorties rangées dans node_modules, déjà ignoré par git.
  outputDir: "node_modules/.cache/playwright/test-results",
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  // Le site est pensé d'abord pour le téléphone.
  projects: [{ name: "telephone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    // Fichier fixe : le serveur est prêt même si la base est encore vide.
    url: `http://localhost:${PORT}/favicon.ico`,
    reuseExistingServer: false,
    timeout: SERVER_START_TIMEOUT_MS,
  },
});
