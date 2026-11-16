// Journal de l'application : une ligne JSON par événement, lisible dans les
// journaux Netlify. Ne jamais y mettre de nom, de courriel, de téléphone,
// de jeton, de mot de passe ni de capture (AGENTS.md).

/**
 * @typedef {Record<string, unknown>} LogContext
 */

/**
 * Écrit une ligne de journal.
 * @param {"info" | "warn" | "error"} level Le niveau.
 * @param {string} message Un identifiant court de l'événement, en anglais (ex. `event_overview_failed`).
 * @param {LogContext} [context] Des informations sans donnée personnelle.
 * @returns {void}
 */
function writeLine(level, message, context = {}) {
  const line = JSON.stringify({ level, message, ...context, time: new Date().toISOString() });
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

/**
 * Décrit une erreur sans son message ni sa pile, qui peuvent contenir des secrets
 * ou des données personnelles provenant d'un pilote externe.
 * @param {unknown} error L'erreur attrapée.
 * @returns {LogContext} Les champs à journaliser.
 */
export function describeError(error) {
  if (error instanceof Error) {
    return { errorName: error.name };
  }
  return { errorName: "UnknownError" };
}

export const logger = {
  /** @param {string} message @param {LogContext} [context] */
  info: (message, context) => writeLine("info", message, context),
  /** @param {string} message @param {LogContext} [context] */
  warn: (message, context) => writeLine("warn", message, context),
  /** @param {string} message @param {LogContext} [context] */
  error: (message, context) => writeLine("error", message, context),
};
