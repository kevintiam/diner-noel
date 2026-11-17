import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadTestEnv } from "./load-test-env.js";

/** @type {string[]} */
const directories = [];
const TEST_URL = "postgresql://test:fake@localhost/test";

/** @param {string} [contents] */
function createFixture(contents) {
  const directory = mkdtempSync(join(tmpdir(), "dinner-env-"));
  directories.push(directory);
  const path = join(directory, ".env.test");
  if (contents !== undefined) writeFileSync(path, contents);
  return path;
}

/** @returns {Record<string, string | undefined>} */
function createInheritedEnv() {
  return {
    DATABASE_URL: "postgresql://production:fake@localhost/production",
    DIRECT_URL: "postgresql://production:fake@localhost/production-direct",
    DATABASE_URL_UNPOOLED: "postgresql://production:fake@localhost/production-unpooled",
    DATABASE_IS_TEST: "true",
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true });
});

describe("loadTestEnv", () => {
  it("remplace toutes les connexions héritées par celles du fichier fictif", () => {
    const environment = createInheritedEnv();
    const path = createFixture(`DATABASE_URL=${TEST_URL}\nDATABASE_IS_TEST=true\n`);

    loadTestEnv(path, environment);

    expect(environment).toMatchObject({
      DATABASE_URL: TEST_URL,
      DATABASE_IS_TEST: "true",
      DIRECT_URL: "",
      DATABASE_URL_UNPOOLED: "",
    });
  });

  it("charge les deux noms de connexion directe seulement depuis le fichier fictif", () => {
    const environment = createInheritedEnv();
    const path = createFixture(
      `DATABASE_URL=${TEST_URL}\nDATABASE_IS_TEST=true\nDIRECT_URL=${TEST_URL}\nDATABASE_URL_UNPOOLED=${TEST_URL}`,
    );

    loadTestEnv(path, environment);

    expect(environment.DIRECT_URL).toBe(TEST_URL);
    expect(environment.DATABASE_URL_UNPOOLED).toBe(TEST_URL);
  });

  it("neutralise aussi les valeurs PostgreSQL natives héritées", () => {
    const environment = { ...createInheritedEnv(), PGHOST: "production.example.test" };

    loadTestEnv(createFixture(`DATABASE_URL=${TEST_URL}\nDATABASE_IS_TEST=true`), environment);

    expect(environment.PGHOST).toBe("");
  });

  it.each([
    ["absent", undefined],
    ["sans connexion", "DATABASE_IS_TEST=true"],
    ["sans drapeau", `DATABASE_URL=${TEST_URL}`],
    ["avec drapeau faux", `DATABASE_URL=${TEST_URL}\nDATABASE_IS_TEST=false`],
  ])("refuse un fichier %s sans réutiliser les valeurs héritées", (_, contents) => {
    const environment = createInheritedEnv();

    expect(() => loadTestEnv(createFixture(contents), environment)).toThrow();
    for (const key of Object.keys(createInheritedEnv())) expect(environment[key]).toBe("");
  });

  it("neutralise SMTP hérité et déclaré dans le fichier de test", () => {
    const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"];
    const environment = createInheritedEnv();
    for (const key of keys) environment[key] = "valeur-heritee-fictive";
    environment.SITE_URL = "https://production.example.test";
    const contents = `DATABASE_URL=${TEST_URL}\nDATABASE_IS_TEST=true\nSITE_URL=https://test.example.test\n`;
    const smtpContents = keys.map((key) => `${key}=valeur-fictive`).join("\n");

    loadTestEnv(createFixture(contents + smtpContents), environment);

    for (const key of keys) expect(environment[key]).toBe("");
    expect(environment.SITE_URL).toBe("http://localhost:3100");
  });
});
