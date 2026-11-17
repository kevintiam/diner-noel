import { describe, expect, it, vi } from "vitest";
vi.mock("../db/transaction.js", () => ({ runInTransaction: vi.fn() }));
vi.mock("./proof-image.service.js", () => ({ normalizeProofImage: vi.fn() }));
import { runInTransaction } from "../db/transaction.js";
import { normalizeProofImage } from "./proof-image.service.js";
import { submitProof } from "./proof.service.js";

describe("submitProof sans accès base", () => {
  it("refuse un jeton malformé avant la base et le décodage", async () => {
    await expect(
      submitProof({ token: "malformé", imageBytes: new Uint8Array() }),
    ).rejects.toMatchObject({ code: "RESERVATION_NOT_FOUND" });
    expect(runInTransaction).not.toHaveBeenCalled();
    expect(normalizeProofImage).not.toHaveBeenCalled();
  });
});
