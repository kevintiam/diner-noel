import { afterEach, describe, expect, it, vi } from "vitest";

const NEXT_REDIRECT = new Error("NEXT_REDIRECT");
const cookieValues = new Map();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: (name) => cookieValues.get(name) })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw NEXT_REDIRECT;
  }),
}));
vi.mock("../services/organizer.service.js", () => ({ getOrganizerBySessionToken: vi.fn() }));

const { redirect } = await import("next/navigation");
const { getOrganizerBySessionToken } = await import("../services/organizer.service.js");
const { getSignedInOrganizer, requireOrganizer, requireOrganizerForApi } =
  await import("./require-organizer.js");
const { SESSION_COOKIE_NAME } = await import("./session-cookie.js");

const PROFILE = { id: "org_1", email: "orga@example.test", name: "Organisateur fictif" };

afterEach(() => {
  cookieValues.clear();
  vi.clearAllMocks();
});

describe("requireOrganizer", () => {
  it("renvoie l'organisateur du cookie de session", async () => {
    cookieValues.set(SESSION_COOKIE_NAME, { value: "jeton" });
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(PROFILE);

    await expect(requireOrganizer()).resolves.toEqual(PROFILE);
    expect(getOrganizerBySessionToken).toHaveBeenCalledWith("jeton", { now: expect.any(Date) });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renvoie vers la connexion sans cookie", async () => {
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(null);

    await expect(requireOrganizer()).rejects.toBe(NEXT_REDIRECT);
    expect(getOrganizerBySessionToken).toHaveBeenCalledWith(undefined, { now: expect.any(Date) });
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("renvoie vers la connexion quand la session a expiré", async () => {
    cookieValues.set(SESSION_COOKIE_NAME, { value: "jeton-expire" });
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(null);

    await expect(requireOrganizer()).rejects.toBe(NEXT_REDIRECT);
  });
});

describe("getSignedInOrganizer", () => {
  it("renvoie null sans rediriger", async () => {
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(null);

    await expect(getSignedInOrganizer()).resolves.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireOrganizerForApi", () => {
  it("renvoie l'organisateur connecté", async () => {
    cookieValues.set(SESSION_COOKIE_NAME, { value: "jeton" });
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(PROFILE);

    await expect(requireOrganizerForApi()).resolves.toEqual(PROFILE);
  });

  it("répond 401 sans rediriger quand la session manque", async () => {
    vi.mocked(getOrganizerBySessionToken).mockResolvedValue(null);

    await expect(requireOrganizerForApi()).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
