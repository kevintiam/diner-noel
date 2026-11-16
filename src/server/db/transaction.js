// Transaction interactive Prisma, pour les écritures qui doivent se faire d'un
// bloc (architecture AD-5). Les délais laissent passer une file de réservations
// simultanées qui attendent le verrou de l'événement l'une après l'autre.
import { getPrisma } from "./prisma-client.js";

const TRANSACTION_MAX_WAIT_MS = 10_000;
const TRANSACTION_TIMEOUT_MS = 10_000;

/** @typedef {Parameters<Parameters<ReturnType<typeof getPrisma>["$transaction"]>[0]>[0]} TransactionClient */

/**
 * Exécute un travail dans une transaction : tout est écrit, ou rien.
 * @template T
 * @param {(transaction: TransactionClient) => Promise<T>} work Le travail, qui reçoit le client de la transaction.
 * @returns {Promise<T>} Le résultat du travail.
 */
export function runInTransaction(work) {
  return getPrisma().$transaction(work, {
    maxWait: TRANSACTION_MAX_WAIT_MS,
    timeout: TRANSACTION_TIMEOUT_MS,
  });
}
