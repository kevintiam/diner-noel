import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findOpenEmailFailures,
  insertEmailFailure,
  resolveOpenEmailFailures,
} from "../db/email-failure.repository.js";
import {
  listOpenEmailFailures,
  recordEmailFailure,
  resolveEmailFailures,
} from "./email-failure.service.js";

vi.mock("../db/email-failure.repository.js", () => ({
  findOpenEmailFailures: vi.fn(),
  insertEmailFailure: vi.fn(),
  resolveOpenEmailFailures: vi.fn(),
}));

const NOW = new Date("2026-11-20T15:00:00.000Z");

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("recordEmailFailure", () => {
  it("enregistre le type de courriel et l'instant de l'échec", async () => {
    await recordEmailFailure({ reservationId: "res_1", kind: "CONFIRMATION", now: NOW });

    expect(insertEmailFailure).toHaveBeenCalledExactlyOnceWith({
      reservationId: "res_1",
      kind: "CONFIRMATION",
      createdAt: NOW,
    });
  });

  it("ne lance jamais d'erreur et journalise sans le message de la base", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(insertEmailFailure).mockRejectedValue(new Error("fictif@example.test refusé"));

    await expect(
      recordEmailFailure({ reservationId: "res_1", kind: "RECEIPT", now: NOW }),
    ).resolves.toBeUndefined();

    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      level: "error",
      message: "email_failure_record_failed",
      reservationId: "res_1",
      kind: "RECEIPT",
      errorName: "Error",
      time: expect.any(String),
    });
    expect(log.mock.calls[0][0]).not.toContain("fictif@example.test");
  });
});

describe("listOpenEmailFailures", () => {
  it("renvoie les échecs encore ouverts lus par le dépôt", async () => {
    const failures = [{ id: "f1" }];
    vi.mocked(findOpenEmailFailures).mockResolvedValue(/** @type {never} */ (failures));

    await expect(listOpenEmailFailures()).resolves.toBe(failures);
  });
});

describe("resolveEmailFailures", () => {
  it("note l'organisateur et l'instant, puis renvoie le nombre d'échecs traités", async () => {
    vi.mocked(resolveOpenEmailFailures).mockResolvedValue(2);

    const result = await resolveEmailFailures(
      { reservationId: " res_1 " },
      { organizerId: "orga_1", now: NOW },
    );

    expect(result).toEqual({ reservationId: "res_1", resolvedCount: 2 });
    expect(resolveOpenEmailFailures).toHaveBeenCalledExactlyOnceWith({
      reservationId: "res_1",
      organizerId: "orga_1",
      resolvedAt: NOW,
    });
  });

  it.each([{}, { reservationId: "" }, { reservationId: "x".repeat(65) }])(
    "répond 400 sans rien écrire pour %j",
    async (input) => {
      await expect(
        resolveEmailFailures(input, { organizerId: "orga_1", now: NOW }),
      ).rejects.toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
      expect(resolveOpenEmailFailures).not.toHaveBeenCalled();
    },
  );
});
