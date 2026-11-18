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
  vi.restoreAllMocks();
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

describe("client gardé entre deux rechargements", () => {
  it("termine une requête déjà en cours pendant le chargement d’une autre variante", async () => {
    /** @type {() => void} */
    let queryStarted = () => {};
    /** @type {() => void} */
    let sendReply = () => {};
    /** @type {Promise<void>} */
    const started = new Promise((resolve) => {
      queryStarted = resolve;
    });
    server = createServer((socket) => {
      sockets.add(socket);
      let authenticated = false;
      socket.on("data", (data) => {
        if (!authenticated) {
          authenticated = true;
          socket.write(Buffer.from([82, 0, 0, 0, 8, 0, 0, 0, 0, 90, 0, 0, 0, 5, 73]));
          return;
        }
        if (data[0] !== 81) return; // Message PostgreSQL Query.
        sendReply = () =>
          socket.write(
            Buffer.from(
              // Une colonne int4 « alive », une ligne 1, puis CommandComplete et ReadyForQuery.
              "540000001e0001616c69766500000000000000000000170004ffffffff0000" +
                "440000000b00010000000131" +
                "430000000d53454c454354203100" +
                "5a0000000549",
              "hex",
            ),
          );
        queryStarted();
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
    const first = clientModule.getPrisma();
    const result = first.$queryRaw`SELECT 1 AS alive`.then((rows) => rows);
    await started;
    vi.resetModules();
    clientModule = await import("./prisma-client.js");
    expect(clientModule.getPrisma() === first).toBe(true);
    sendReply();
    await expect(result).resolves.toEqual([{ alive: 1 }]);
  }, 15_000);

  it("réutilise le même client tant que le client généré ne change pas", async () => {
    vi.resetModules();
    clientModule = await import("./prisma-client.js");

    expect(clientModule.getPrisma()).toBe(clientModule.getPrisma());
  });

  it("garde la connexion quand le même client généré est chargé par un autre module", async () => {
    vi.resetModules();
    clientModule = await import("./prisma-client.js");
    const first = clientModule.getPrisma();
    const disconnect = vi.spyOn(first, "$disconnect");
    vi.resetModules();
    clientModule = await import("./prisma-client.js");
    expect(clientModule.getPrisma() === first).toBe(true);
    expect(disconnect).not.toHaveBeenCalled();
  });

  it("crée un nouveau client seulement après une fermeture explicite", async () => {
    vi.resetModules();
    clientModule = await import("./prisma-client.js");
    const first = clientModule.getPrisma();
    await clientModule.disconnectPrisma();
    expect(clientModule.getPrisma() === first).toBe(false);
  });
});
