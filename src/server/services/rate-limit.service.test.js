import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRateLimitKey } from "./rate-limit.service.js";

afterEach(() => vi.unstubAllEnvs());
const SECRET = "secret-fictif-pour-test-hmac-uniquement";

describe("empreinte IP HMAC", () => {
  it("reste stable avec le même secret et change avec un autre secret", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", SECRET);
    const key = buildRateLimitKey("reserve", "203.0.113.7");
    expect(key).toBe(
      `reserve:${createHmac("sha256", SECRET).update("203.0.113.7").digest("base64url")}`,
    );
    expect(buildRateLimitKey("reserve", "203.0.113.7")).toBe(key);
    expect(buildRateLimitKey("proof", "203.0.113.7")).not.toBe(key);
    vi.stubEnv("RATE_LIMIT_SECRET", `${SECRET}-autre`);
    expect(buildRateLimitKey("reserve", "203.0.113.7")).not.toBe(key);
    expect(key).not.toContain("203.0.113.7");
  });
  it.each(["", "trop-court", " ".repeat(40)])("refuse un secret invalide tardivement", (secret) => {
    vi.stubEnv("RATE_LIMIT_SECRET", secret);
    expect(() => buildRateLimitKey("reserve", "203.0.113.7")).toThrow(
      "Variable RATE_LIMIT_SECRET manquante ou invalide",
    );
  });
});
