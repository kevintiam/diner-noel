import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteExpiredTechnicalData } from "../db/maintenance.repository.js";
import { logger } from "../../lib/logger.js";
import { maintainTechnicalData } from "./maintenance.service.js";

vi.mock("../db/maintenance.repository.js", () => ({ deleteExpiredTechnicalData: vi.fn() }));
vi.mock("../../lib/logger.js", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
  describeError: () => ({ errorName: "Error" }),
}));
afterEach(() => vi.clearAllMocks());

describe("maintenance technique", () => {
  it("garde une marge de 15 min au-delà des 24 h d'inactivité", async () => {
    vi.mocked(deleteExpiredTechnicalData).mockResolvedValue({ sessions: 2, rateLimits: 1 });
    const now = new Date("2026-11-20T12:00:00Z");
    await expect(maintainTechnicalData(now)).resolves.toEqual({ sessions: 2, rateLimits: 1 });
    expect(deleteExpiredTechnicalData).toHaveBeenCalledWith(now, new Date("2026-11-19T11:45:00Z"));
  });
  it("journalise un échec sans son message ni ses secrets", async () => {
    vi.mocked(deleteExpiredTechnicalData).mockRejectedValue(new Error("secret-db"));
    await expect(maintainTechnicalData()).rejects.toThrow("secret-db");
    expect(logger.error).toHaveBeenCalledWith("technical_maintenance_failed", {
      errorName: "Error",
    });
  });
  it("refuse une date invalide avant tout accès au dépôt", async () => {
    await expect(maintainTechnicalData(new Date("invalide"))).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(deleteExpiredTechnicalData).not.toHaveBeenCalled();
  });
});
