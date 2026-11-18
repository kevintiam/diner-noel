import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";

const script = fileURLToPath(
  new URL("../../scripts/configure-rate-limit-secret.js", import.meta.url),
);
/** @type {string[]} */
const folders = [];
afterEach(() => {
  for (const folder of folders.splice(0)) {
    if (
      !resolve(folder).startsWith(resolve(tmpdir()) + sep) ||
      !basename(folder).startsWith("diner-noel-secret-")
    ) {
      throw new Error("Répertoire temporaire inattendu.");
    }
    rmSync(folder, { recursive: true, force: true });
  }
});

it.each([
  'DATABASE_URL="postgresql://fictif"\nSMTP_PASSWORD="fictif"',
  'DATABASE_URL="postgresql://fictif"\r\nRATE_LIMIT_SECRET=""\r\n',
  'SMTP_PASSWORD="premiere-ligne\nRATE_LIMIT_SECRET=\nfin"\nRATE_LIMIT_SECRET=""\n',
  'RATE_LIMIT_SECRET="secret-fictif-deja-configure-pour-test-uniquement"\r\nAUTRE="fictif"\r\n',
])("préserve la configuration et reste idempotent (%#)", (initial) => {
  const folder = mkdtempSync(join(tmpdir(), "diner-noel-secret-"));
  folders.push(folder);
  const path = join(folder, ".env");
  writeFileSync(path, initial);
  const first = spawnSync(process.execPath, [script], { cwd: folder, encoding: "utf8" });
  expect(first.status).toBe(0);
  const contents = readFileSync(path, "utf8");
  expect(contents.startsWith(initial)).toBe(true);
  const before = parseEnv(initial);
  const after = parseEnv(contents);
  expect(after.RATE_LIMIT_SECRET.length).toBeGreaterThanOrEqual(32);
  for (const [key, value] of Object.entries(before)) {
    if (key !== "RATE_LIMIT_SECRET") expect(after[key]).toBe(value);
  }
  expect(first.stdout + first.stderr).not.toContain(after.RATE_LIMIT_SECRET);
  const second = spawnSync(process.execPath, [script], { cwd: folder, encoding: "utf8" });
  expect(second.status).toBe(0);
  expect(readFileSync(path, "utf8")).toBe(contents);
});
