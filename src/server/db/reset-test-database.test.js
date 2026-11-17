import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma-client.js", () => ({ getPrisma: vi.fn() }));

const { getPrisma } = await import("./prisma-client.js");
const { resetTestDatabase } = await import("./reset-test-database.js");

const ORIGINAL_FLAG = process.env.DATABASE_IS_TEST;

afterEach(() => {
  process.env.DATABASE_IS_TEST = ORIGINAL_FLAG;
  vi.clearAllMocks();
});

describe("resetTestDatabase", () => {
  it("refuse de vider une base qui n'est pas déclarée de test, sans s'y connecter", async () => {
    // Préparer
    delete process.env.DATABASE_IS_TEST;

    // Agir et vérifier
    await expect(resetTestDatabase()).rejects.toThrow(/DATABASE_IS_TEST/);
    expect(getPrisma).not.toHaveBeenCalled();
  });

  it("refuse aussi une valeur proche de true", async () => {
    process.env.DATABASE_IS_TEST = "TRUE";

    await expect(resetTestDatabase()).rejects.toThrow(/DATABASE_IS_TEST/);
    expect(getPrisma).not.toHaveBeenCalled();
  });
});
