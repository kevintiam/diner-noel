// Le seul endroit qui transforme une erreur en réponse (architecture AD-2, AGENTS.md).
// Une erreur imprévue devient une 500 au message générique, et elle est journalisée.
import { getDictionary } from "../../i18n/get-dictionary.js";
import { translate } from "../../i18n/translate.js";
import { describeError, logger } from "../../lib/logger.js";
import { AppError } from "./app-error.js";

const INTERNAL_ERROR_STATUS = 500;
const INTERNAL_ERROR_CODE = "INTERNAL_ERROR";
const INTERNAL_ERROR_KEY = "errors.internal";

/**
 * @typedef {{ field: string, message: string }} ErrorResponseDetail
 * @typedef {{ error: { code: string, message: string, details?: ErrorResponseDetail[] } }} ErrorBody
 * @typedef {{ route?: string, method?: string, organizerId?: string }} ErrorContext
 */

/**
 * Transforme une erreur en statut HTTP et en corps `{ error }` traduit.
 * @param {unknown} error L'erreur attrapée.
 * @param {{ lang: string, context?: ErrorContext }} options La langue de la réponse et le contexte à journaliser.
 * @returns {{ status: number, body: ErrorBody }} Le statut et le corps de la réponse.
 */
export function handleApiError(error, { lang, context = {} }) {
  const dictionary = getDictionary(lang);
  if (error instanceof AppError) {
    if (error.statusCode >= INTERNAL_ERROR_STATUS) {
      logger.error("application_error", { ...context, errorCode: error.code });
    }
    /** @type {ErrorBody} */
    const body = { error: { code: error.code, message: translate(dictionary, error.messageKey) } };
    if (error.details) {
      body.error.details = error.details.map((detail) => ({
        field: detail.field,
        message: translate(dictionary, detail.messageKey),
      }));
    }
    return { status: error.statusCode, body };
  }
  logger.error("unexpected_error", { ...context, ...describeError(error) });
  return {
    status: INTERNAL_ERROR_STATUS,
    body: {
      error: { code: INTERNAL_ERROR_CODE, message: translate(dictionary, INTERNAL_ERROR_KEY) },
    },
  };
}
