// Crée le compte d'un organisateur, ou change son mot de passe (architecture AD-9).
// Le site n'a ni inscription ni compte par défaut : seul ce script ouvre un accès.
//
// Utilisation (base de `.env`) :
//   npm run organizer:create -- --email orga@example.org --name "Prénom Nom"
// Le mot de passe est demandé deux fois, sans s'afficher à l'écran.
// Relancé avec le même courriel, le script change le nom et le mot de passe,
// et ferme les sessions ouvertes de ce compte.
import { parseArgs } from "node:util";
import fr from "../src/i18n/dictionaries/fr.json" with { type: "json" };
import { translate } from "../src/i18n/translate.js";
import { describeError, logger } from "../src/lib/logger.js";
import { disconnectPrisma } from "../src/server/db/prisma-client.js";
import { AppError } from "../src/server/errors/app-error.js";
import { createOrganizerAccount } from "../src/server/services/organizer.service.js";

const USAGE =
  'Utilisation : npm run organizer:create -- --email orga@example.org --name "Prénom Nom"\n';
const ENTER_KEYS = new Set(["\r", "\n"]);
const ERASE_KEYS = new Set(["\u007f", "\b"]);
const CTRL_C = "\u0003";

// Erreur de saisie à montrer telle quelle ; les autres erreurs passent par le journal.
class PromptError extends Error {}

/**
 * Pose une question dont la réponse ne s'affiche pas (mot de passe).
 * @param {string} question Le texte affiché avant la saisie.
 * @returns {Promise<string>} La réponse tapée.
 * @throws {Error} Hors d'un terminal interactif, ou si la saisie est annulée par Ctrl+C.
 */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(
        new PromptError("Lancez ce script dans un terminal interactif (PowerShell ou Terminal)."),
      );
      return;
    }
    let answer = "";

    /** @param {() => void} settle */
    function stopListening(settle) {
      stdin.off("data", handleKeys);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      settle();
    }

    /** @param {string} keys */
    function handleKeys(keys) {
      for (const key of keys) {
        if (key === CTRL_C) {
          stopListening(() => reject(new PromptError("Saisie annulée.")));
          return;
        }
        if (ENTER_KEYS.has(key)) {
          stopListening(() => resolve(answer));
          return;
        }
        if (ERASE_KEYS.has(key)) {
          answer = Array.from(answer).slice(0, -1).join("");
          continue;
        }
        answer += key;
      }
    }

    stdout.write(question);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", handleKeys);
  });
}

/**
 * Affiche chaque champ refusé avec son message en français.
 * @param {AppError} error L'erreur de validation.
 */
function printFieldErrors(error) {
  process.stderr.write("Le compte n'a pas été enregistré :\n");
  for (const detail of error.details ?? []) {
    process.stderr.write(`- ${detail.field} : ${translate(fr, detail.messageKey)}\n`);
  }
}

/**
 * Lit les options, demande le mot de passe et enregistre le compte.
 * @returns {Promise<void>}
 */
async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
  });
  if (!values.email || !values.name) {
    process.stderr.write(USAGE);
    process.exitCode = 1;
    return;
  }
  const password = await askHidden("Mot de passe (12 caractères au moins) : ");
  const confirmation = await askHidden("Retapez le mot de passe : ");
  if (password !== confirmation) {
    process.stderr.write("Les deux mots de passe sont différents. Rien n'a été enregistré.\n");
    process.exitCode = 1;
    return;
  }
  const { organizer, isNew } = await createOrganizerAccount({
    email: values.email,
    name: values.name,
    password,
  });
  process.stdout.write(
    isNew
      ? `Compte créé pour ${organizer.name}. Il peut se connecter sur /admin/login.\n`
      : `Nom et mot de passe de ${organizer.name} changés ; ses sessions ouvertes sont fermées.\n`,
  );
}

try {
  await main();
} catch (error) {
  process.exitCode = 1;
  if (error instanceof AppError && error.details) {
    printFieldErrors(error);
  } else if (error instanceof PromptError) {
    process.stderr.write(`${error.message}\n`);
  } else {
    logger.error("create_organizer_failed", describeError(error));
  }
} finally {
  await disconnectPrisma();
}
