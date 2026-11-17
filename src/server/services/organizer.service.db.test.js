// Test sur la base Neon `test` (fichier .env.test), avec le vrai bcrypt. Comptes fictifs.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import {
  createOrganizerAccount,
  getOrganizerBySessionToken,
  loginOrganizer,
  logoutOrganizer,
  SESSION_DURATION_MS,
} from "./organizer.service.js";

const NOW = new Date("2026-11-16T15:00:00.000Z");
const ACCOUNT = {
  email: "orga@example.test",
  name: "Organisateur fictif",
  password: "Sapin-Fictif-2026",
};
// bcrypt au coût 12 prend environ un quart de seconde par opération.
const BCRYPT_TEST_TIMEOUT_MS = 20_000;

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await disconnectPrisma();
});

describe("connexion des organisateurs sur la base", () => {
  it(
    "crée un compte, ouvre une session, la retrouve puis la ferme",
    async () => {
      await createOrganizerAccount(ACCOUNT);

      const { token, organizer } = await loginOrganizer(
        { email: ACCOUNT.email, password: ACCOUNT.password },
        { now: NOW },
      );

      await expect(getOrganizerBySessionToken(token, { now: NOW })).resolves.toEqual(organizer);
      const stored = await getPrisma().organizer.findUniqueOrThrow({
        where: { email: ACCOUNT.email },
      });
      expect(stored.passwordHash).toMatch(/^\$2b\$12\$/);
      expect(stored.passwordHash).not.toContain(ACCOUNT.password);
      const sessions = await getPrisma().session.findMany();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tokenHash).not.toBe(token);

      await logoutOrganizer(token);

      await expect(getOrganizerBySessionToken(token, { now: NOW })).resolves.toBeNull();
    },
    BCRYPT_TEST_TIMEOUT_MS,
  );

  it(
    "ne connaît aucun compte par défaut",
    async () => {
      await expect(
        loginOrganizer({ email: "admin@dinner.test", password: "ChangeMe123!" }, { now: NOW }),
      ).rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
      await expect(getPrisma().organizer.count()).resolves.toBe(0);
    },
    BCRYPT_TEST_TIMEOUT_MS,
  );

  it(
    "n'accepte plus la session une fois sa durée écoulée",
    async () => {
      await createOrganizerAccount(ACCOUNT);
      const { token } = await loginOrganizer(
        { email: ACCOUNT.email, password: ACCOUNT.password },
        { now: NOW },
      );
      const afterExpiry = new Date(NOW.getTime() + SESSION_DURATION_MS);

      await expect(getOrganizerBySessionToken(token, { now: afterExpiry })).resolves.toBeNull();
    },
    BCRYPT_TEST_TIMEOUT_MS,
  );

  it(
    "ferme les sessions ouvertes quand le mot de passe change",
    async () => {
      await createOrganizerAccount(ACCOUNT);
      const { token } = await loginOrganizer(
        { email: ACCOUNT.email, password: ACCOUNT.password },
        { now: NOW },
      );

      const result = await createOrganizerAccount({ ...ACCOUNT, password: "Nouveau-Sapin-2026" });

      expect(result.isNew).toBe(false);
      await expect(getOrganizerBySessionToken(token, { now: NOW })).resolves.toBeNull();
      await expect(
        loginOrganizer({ email: ACCOUNT.email, password: ACCOUNT.password }, { now: NOW }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    },
    BCRYPT_TEST_TIMEOUT_MS,
  );
});
