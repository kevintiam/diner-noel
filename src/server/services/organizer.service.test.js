import bcrypt from "bcrypt";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as organizerRepository from "../db/organizer.repository.js";
import { AppError } from "../errors/app-error.js";
import {
  createOrganizerAccount,
  getOrganizerBySessionToken,
  hashSessionToken,
  loginOrganizer,
  logoutOrganizer,
  SESSION_DURATION_MS,
} from "./organizer.service.js";

vi.mock("bcrypt", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("../db/organizer.repository.js", () => ({
  createOrganizer: vi.fn(),
  createSession: vi.fn(),
  deleteSessionByHash: vi.fn(),
  findOrganizerByEmail: vi.fn(),
  findOrganizerBySessionHash: vi.fn(),
  updateOrganizerCredentials: vi.fn(),
}));

const NOW = new Date("2026-11-16T15:00:00.000Z");
const ACCOUNT = {
  id: "org_1",
  email: "orga@example.test",
  name: "Organisateur fictif",
  passwordHash: "empreinte-fictive",
};
const VALID_PASSWORD = "Sapin-Fictif-2026";

afterEach(() => {
  vi.clearAllMocks();
});

describe("hashSessionToken", () => {
  it("donne toujours la même empreinte hexadécimale pour un jeton", () => {
    expect(hashSessionToken("abc")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken("abc")).toBe(hashSessionToken("abc"));
    expect(hashSessionToken("abc")).not.toBe(hashSessionToken("abd"));
  });
});

describe("loginOrganizer", () => {
  it("ouvre une session d'une semaine et ne stocke que l'empreinte du jeton", async () => {
    vi.mocked(organizerRepository.findOrganizerByEmail).mockResolvedValue(ACCOUNT);
    vi.mocked(bcrypt.compare).mockResolvedValue(/** @type {never} */ (true));

    const result = await loginOrganizer(
      { email: " Orga@Example.test ", password: VALID_PASSWORD },
      { now: NOW },
    );

    expect(organizerRepository.findOrganizerByEmail).toHaveBeenCalledWith("orga@example.test");
    expect(result.organizer).toEqual({
      id: "org_1",
      email: "orga@example.test",
      name: "Organisateur fictif",
    });
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.expiresAt).toEqual(new Date(NOW.getTime() + SESSION_DURATION_MS));
    expect(organizerRepository.createSession).toHaveBeenCalledWith({
      organizerId: "org_1",
      tokenHash: hashSessionToken(result.token),
      expiresAt: result.expiresAt,
    });
  });

  it("refuse un courriel inconnu sans créer de compte, après une vérification aussi lente", async () => {
    vi.mocked(organizerRepository.findOrganizerByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.compare).mockResolvedValue(/** @type {never} */ (false));

    await expect(
      loginOrganizer({ email: "admin@dinner.test", password: "ChangeMe123!" }, { now: NOW }),
    ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "ChangeMe123!",
      expect.stringMatching(/^\$2b\$12\$/),
    );
    expect(organizerRepository.createOrganizer).not.toHaveBeenCalled();
    expect(organizerRepository.createSession).not.toHaveBeenCalled();
  });

  it("refuse un mauvais mot de passe", async () => {
    vi.mocked(organizerRepository.findOrganizerByEmail).mockResolvedValue(ACCOUNT);
    vi.mocked(bcrypt.compare).mockResolvedValue(/** @type {never} */ (false));

    const attempt = loginOrganizer({ email: ACCOUNT.email, password: "faux" }, { now: NOW });

    await expect(attempt).rejects.toBeInstanceOf(AppError);
    await expect(attempt).rejects.toMatchObject({ messageKey: "errors.invalidCredentials" });
    expect(organizerRepository.createSession).not.toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans interroger la base", async () => {
    await expect(loginOrganizer({ email: null, password: "" }, { now: NOW })).rejects.toMatchObject(
      { statusCode: 400, code: "VALIDATION_ERROR" },
    );
    expect(organizerRepository.findOrganizerByEmail).not.toHaveBeenCalled();
  });
});

describe("getOrganizerBySessionToken", () => {
  it("retrouve l'organisateur par l'empreinte du jeton", async () => {
    const profile = { id: "org_1", email: ACCOUNT.email, name: ACCOUNT.name };
    vi.mocked(organizerRepository.findOrganizerBySessionHash).mockResolvedValue(profile);

    await expect(getOrganizerBySessionToken("jeton", { now: NOW })).resolves.toEqual(profile);
    expect(organizerRepository.findOrganizerBySessionHash).toHaveBeenCalledWith(
      hashSessionToken("jeton"),
      NOW,
    );
  });

  it("renvoie null sans jeton, ou avec un jeton qui n'est pas du texte, sans lire la base", async () => {
    await expect(getOrganizerBySessionToken(undefined, { now: NOW })).resolves.toBeNull();
    await expect(getOrganizerBySessionToken("", { now: NOW })).resolves.toBeNull();
    await expect(getOrganizerBySessionToken(42, { now: NOW })).resolves.toBeNull();
    expect(organizerRepository.findOrganizerBySessionHash).not.toHaveBeenCalled();
  });

  it("renvoie null quand la session est expirée ou inconnue", async () => {
    vi.mocked(organizerRepository.findOrganizerBySessionHash).mockResolvedValue(null);

    await expect(getOrganizerBySessionToken("jeton", { now: NOW })).resolves.toBeNull();
  });
});

describe("logoutOrganizer", () => {
  it("supprime la session du jeton", async () => {
    await logoutOrganizer("jeton");

    expect(organizerRepository.deleteSessionByHash).toHaveBeenCalledWith(hashSessionToken("jeton"));
  });

  it("ne fait rien sans jeton", async () => {
    await logoutOrganizer(undefined);

    expect(organizerRepository.deleteSessionByHash).not.toHaveBeenCalled();
  });
});

describe("createOrganizerAccount", () => {
  it("crée un compte avec un mot de passe haché au coût 12", async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue(/** @type {never} */ ("empreinte"));
    vi.mocked(organizerRepository.findOrganizerByEmail).mockResolvedValue(null);
    vi.mocked(organizerRepository.createOrganizer).mockResolvedValue({
      id: "org_2",
      email: "nouveau@example.test",
      name: "Nouvel orga",
    });

    const result = await createOrganizerAccount({
      email: "Nouveau@Example.test",
      name: "Nouvel orga",
      password: VALID_PASSWORD,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith(VALID_PASSWORD, 12);
    expect(organizerRepository.createOrganizer).toHaveBeenCalledWith({
      email: "nouveau@example.test",
      name: "Nouvel orga",
      passwordHash: "empreinte",
    });
    expect(result.isNew).toBe(true);
  });

  it("change le mot de passe d'un compte existant", async () => {
    vi.mocked(bcrypt.hash).mockResolvedValue(/** @type {never} */ ("nouvelle-empreinte"));
    vi.mocked(organizerRepository.findOrganizerByEmail).mockResolvedValue(ACCOUNT);
    vi.mocked(organizerRepository.updateOrganizerCredentials).mockResolvedValue({
      id: "org_1",
      email: ACCOUNT.email,
      name: "Nom changé",
    });

    const result = await createOrganizerAccount({
      email: ACCOUNT.email,
      name: "Nom changé",
      password: VALID_PASSWORD,
    });

    expect(organizerRepository.updateOrganizerCredentials).toHaveBeenCalledWith("org_1", {
      name: "Nom changé",
      passwordHash: "nouvelle-empreinte",
    });
    expect(organizerRepository.createOrganizer).not.toHaveBeenCalled();
    expect(result.isNew).toBe(false);
  });

  it("refuse un mot de passe trop court sans rien hacher ni écrire", async () => {
    await expect(
      createOrganizerAccount({ email: ACCOUNT.email, name: "Orga", password: "court" }),
    ).rejects.toMatchObject({
      statusCode: 400,
      details: [{ field: "password", messageKey: "validation.passwordTooShort" }],
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(organizerRepository.createOrganizer).not.toHaveBeenCalled();
  });
});
