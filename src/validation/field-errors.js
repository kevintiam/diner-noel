// Mise en forme commune des erreurs Zod : une clé de dictionnaire par champ (architecture AD-3).
import { z } from "zod";

/**
 * @typedef {{ field: string, messageKey: string }} FieldError
 */

/**
 * Valide des valeurs avec un schéma et garde la première erreur de chaque champ.
 * @template T
 * @param {z.ZodType<T>} schema Le schéma à appliquer.
 * @param {unknown} raw Les valeurs reçues.
 * @returns {{ success: true, data: T } | { success: false, fieldErrors: FieldError[] }}
 *   Les données validées, ou une erreur par champ fautif.
 */
export function validateWith(schema, raw) {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  /** @type {FieldError[]} */
  const fieldErrors = [];
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!fieldErrors.some((fieldError) => fieldError.field === field)) {
      fieldErrors.push({ field, messageKey: issue.message });
    }
  }
  return { success: false, fieldErrors };
}
