// Erreur prévue par une règle métier (architecture AD-2). Elle porte une clé
// de dictionnaire, jamais une phrase : le message est traduit au moment de répondre.

/**
 * @typedef {{ field: string, messageKey: string }} ErrorDetail
 */

export class AppError extends Error {
  /**
   * @param {number} statusCode Le code HTTP (400, 404, 409…).
   * @param {string} code Le code stable, en UPPER_SNAKE_CASE (ex. `SOLD_OUT`).
   * @param {string} messageKey La clé du message dans les dictionnaires (ex. `errors.soldOut`).
   * @param {ErrorDetail[]} [details] Les erreurs de champ, pour une validation seulement.
   */
  constructor(statusCode, code, messageKey, details) {
    super(code);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.messageKey = messageKey;
    this.details = details;
  }
}
