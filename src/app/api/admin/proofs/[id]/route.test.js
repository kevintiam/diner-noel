import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors/app-error";

vi.mock("@/server/auth/require-organizer", () => ({ requireOrganizerForApi: vi.fn() }));
vi.mock("@/server/services/proof.service", () => ({ getProofImage: vi.fn() }));

const { requireOrganizerForApi } = await import("@/server/auth/require-organizer");
const { getProofImage } = await import("@/server/services/proof.service");
const { GET } = await import("./route.js");

const ORGANIZER = { id: "org_1", email: "o@example.test", name: "O" };
/** @param {string} id */
const context = (id) => ({ params: Promise.resolve({ id }) });

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/proofs/[id]", () => {
  it("répond 401 sans session, sans lire la capture", async () => {
    vi.mocked(requireOrganizerForApi).mockRejectedValue(
      new AppError(401, "UNAUTHENTICATED", "errors.unauthenticated"),
    );

    const response = await GET(new Request("http://localhost/"), context("p1"));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Connectez-vous pour accéder à cette ressource.",
      },
    });
    expect(getProofImage).not.toHaveBeenCalled();
  });

  it("envoie l'image sans cache et sans deviner son type", async () => {
    vi.mocked(requireOrganizerForApi).mockResolvedValue(ORGANIZER);
    vi.mocked(getProofImage).mockResolvedValue({
      data: new Uint8Array([82, 73, 70, 70]),
      mimeType: "image/webp",
    });

    const response = await GET(new Request("http://localhost/"), context("p1"));

    expect(getProofImage).toHaveBeenCalledWith("p1");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([82, 73, 70, 70]);
  });

  it("répond 404 pour une capture inconnue", async () => {
    vi.mocked(requireOrganizerForApi).mockResolvedValue(ORGANIZER);
    vi.mocked(getProofImage).mockRejectedValue(
      new AppError(404, "PROOF_NOT_FOUND", "errors.proofNotFound"),
    );

    const response = await GET(new Request("http://localhost/"), context("inconnue"));

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("PROOF_NOT_FOUND");
  });
});
