import { createServer } from "node:net";
import { once } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

/** @type {Set<import("node:net").Socket>} */
const sockets = new Set();
/** @type {import("node:net").Server | undefined} */
let server;
/** @type {typeof import("./prisma-client.js") | undefined} */
let clientModule;

afterEach(async () => {
  for (const socket of sockets) socket.destroy();
  sockets.clear();
  await clientModule?.disconnectPrisma();
  if (server) await new Promise((resolve) => server.close(resolve));
  vi.unstubAllEnvs();
});

describe("délais du client Prisma", () => {
  it.each(["connexion", "requête"])(
    "interrompt une %s qui reste silencieuse sur un serveur local",
    async (phase) => {
      let hasReceivedQuery = false;
      server = createServer((socket) => {
        sockets.add(socket);
        let hasAuthenticated = false;
        socket.on("data", () => {
          if (phase === "connexion") return;
          if (hasAuthenticated) {
            hasReceivedQuery = true;
            return;
          }
          hasAuthenticated = true;
          // Authentification PostgreSQL réussie et prêt, puis panne silencieuse.
          socket.write(Buffer.from([82, 0, 0, 0, 8, 0, 0, 0, 0, 90, 0, 0, 0, 5, 73]));
        });
      });
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Port local indisponible");
      vi.stubEnv(
        "DATABASE_URL",
        `postgresql://fake:fake@127.0.0.1:${address.port}/fake?sslmode=disable`,
      );
      vi.resetModules();
      clientModule = await import("./prisma-client.js");
      const startedAt = performance.now();

      await expect(clientModule.getPrisma().$queryRaw`SELECT 1`).rejects.toBeInstanceOf(Error);

      expect(performance.now() - startedAt).toBeLessThan(15_000);
      if (phase === "requête") expect(hasReceivedQuery).toBe(true);
    },
    20_000,
  );
});
