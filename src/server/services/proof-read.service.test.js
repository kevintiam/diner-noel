// Lecture d'une capture par un organisateur (story 2.2) ; la base est simulée.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findProofImage } from "../db/proof.repository.js";
import { getProofImage } from "./proof.service.js";

vi.mock("../db/proof.repository.js", () => ({ findProofImage: vi.fn(), insertProof: vi.fn() }));

const IMAGE = { data: new Uint8Array([1, 2, 3]), mimeType: "image/webp" };

beforeEach(() => {
  vi.mocked(findProofImage).mockReset();
});

describe("getProofImage", () => {
  it("renvoie les octets et le type de la capture", async () => {
    vi.mocked(findProofImage).mockResolvedValue(IMAGE);

    await expect(getProofImage("cmwk1exwc0001jwk563guu68y")).resolves.toEqual(IMAGE);
    expect(findProofImage).toHaveBeenCalledWith("cmwk1exwc0001jwk563guu68y");
  });

  it.each([undefined, "", "../secret", "x".repeat(65), "id avec espace"])(
    "répond 404 sans lire la base pour l'identifiant %o",
    async (proofId) => {
      await expect(getProofImage(proofId)).rejects.toMatchObject({
        statusCode: 404,
        code: "PROOF_NOT_FOUND",
      });
      expect(findProofImage).not.toHaveBeenCalled();
    },
  );

  it("répond 404 pour une capture inconnue ou d'un type non affichable", async () => {
    vi.mocked(findProofImage).mockResolvedValueOnce(null);
    await expect(getProofImage("inconnue")).rejects.toMatchObject({ statusCode: 404 });

    vi.mocked(findProofImage).mockResolvedValueOnce({ ...IMAGE, mimeType: "text/html" });
    await expect(getProofImage("html")).rejects.toMatchObject({ statusCode: 404 });
  });
});
