import { afterEach, describe, expect, it, vi } from "vitest";

const NEXT_REDIRECT = new Error("NEXT_REDIRECT");

vi.mock("@/server/auth/require-organizer", () => ({ requireOrganizer: vi.fn() }));
vi.mock("@/server/services/participant-export.service", () => ({
  buildConfirmedParticipantsExport: vi.fn(),
}));

const { requireOrganizer } = await import("@/server/auth/require-organizer");
const { buildConfirmedParticipantsExport } =
  await import("@/server/services/participant-export.service");
const { GET } = await import("./route.js");

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GET /api/admin/exports/confirmed-participants", () => {
  it("renvoie vers la connexion sans lire la base quand personne n'est connecté", async () => {
    vi.mocked(requireOrganizer).mockRejectedValue(NEXT_REDIRECT);

    await expect(GET()).rejects.toBe(NEXT_REDIRECT);
    expect(buildConfirmedParticipantsExport).not.toHaveBeenCalled();
  });

  it("envoie le CSV en pièce jointe, sans cache", async () => {
    vi.mocked(requireOrganizer).mockResolvedValue({
      id: "org_1",
      email: "o@example.test",
      name: "O",
    });
    vi.mocked(buildConfirmedParticipantsExport).mockResolvedValue({
      filename: "participants-confirmes-2026-12-18.csv",
      content: '\uFEFF"Nom"\r\n',
      count: 0,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="participants-confirmes-2026-12-18.csv"',
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    // La marque UTF-8 est gardée telle quelle dans les octets envoyés.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("répond par l'enveloppe d'erreur JSON si la lecture échoue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(requireOrganizer).mockResolvedValue({
      id: "org_1",
      email: "o@example.test",
      name: "O",
    });
    vi.mocked(buildConfirmedParticipantsExport).mockRejectedValue(new Error("base indisponible"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      },
    });
  });
});
