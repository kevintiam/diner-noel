// Test sur la base Neon `test` (fichier .env.test). Adresses IP fictives (plages de documentation).
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { buildRateLimitKey, checkRateLimit, RESERVE_RATE_LIMIT } from "./rate-limit.service.js";

const START = new Date("2026-11-20T15:00:00.000Z");
const WINDOW_MS = RESERVE_RATE_LIMIT.windowSeconds * 1000;
const FIRST_KEY = buildRateLimitKey("reserve", "203.0.113.7");
const SECOND_KEY = buildRateLimitKey("reserve", "198.51.100.1");

/**
 * @param {string} key
 * @param {Date} now
 */
function check(key, now) {
  return checkRateLimit({ key, ...RESERVE_RATE_LIMIT, now });
}

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await disconnectPrisma();
});

describe("checkRateLimit", () => {
  it("accepte 20 envois puis refuse le 21e dans la même fenêtre", async () => {
    for (let i = 0; i < RESERVE_RATE_LIMIT.limit; i += 1) {
      await check(FIRST_KEY, START);
    }

    await expect(check(FIRST_KEY, START)).rejects.toMatchObject({
      statusCode: 429,
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("repart à zéro une fois la fenêtre échue", async () => {
    for (let i = 0; i < RESERVE_RATE_LIMIT.limit; i += 1) {
      await check(FIRST_KEY, START);
    }
    await expect(check(FIRST_KEY, START)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    await expect(check(FIRST_KEY, new Date(START.getTime() + WINDOW_MS))).resolves.toBeUndefined();
  });

  it("compte chaque adresse séparément", async () => {
    for (let i = 0; i < RESERVE_RATE_LIMIT.limit; i += 1) {
      await check(FIRST_KEY, START);
    }

    await expect(check(SECOND_KEY, START)).resolves.toBeUndefined();
  });

  it("stocke une empreinte de l'adresse IP, pas l'adresse elle-même", async () => {
    await check(FIRST_KEY, START);

    const keys = (await getPrisma().rateLimit.findMany()).map((row) => row.key);
    expect(keys).toEqual([FIRST_KEY]);
    expect(keys[0]).not.toContain("203.0.113.7");
  });

  it("compte juste quand plusieurs envois arrivent en même temps", async () => {
    await Promise.all(Array.from({ length: 10 }, () => check(FIRST_KEY, START)));

    const row = await getPrisma().rateLimit.findUniqueOrThrow({ where: { key: FIRST_KEY } });
    expect(row.count).toBe(10);
  });
});
