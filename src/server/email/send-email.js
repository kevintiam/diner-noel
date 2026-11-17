import nodemailer from "nodemailer";
import { getEmailEnv } from "../../config/env.js";
import { validateEmailMessage } from "../../validation/email.schema.js";

const TLS_PORT = 465;
const CONNECTION_TIMEOUT_MS = 5_000;
const GREETING_TIMEOUT_MS = 3_000;
const SOCKET_TIMEOUT_MS = 5_000;
const DNS_TIMEOUT_MS = 3_000;
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Envoie un seul courriel avec TLS, sans file ni relance, en dix secondes au maximum.
 * @param {import("../../validation/email.schema.js").EmailMessage} message Le message final.
 * @returns {Promise<void>} Résout quand le serveur accepte le message.
 * @throws {Error} Si la validation, le SMTP ou le délai échoue ; à gérer sans journal brut.
 */
export async function sendEmail(message) {
  const validated = validateEmailMessage(message);
  const env = getEmailEnv();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === TLS_PORT,
    requireTLS: env.SMTP_PORT !== TLS_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
    dnsTimeout: DNS_TIMEOUT_MS,
    logger: false,
    debug: false,
    transactionLog: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const controller = new AbortController();
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      // close() ne coupe pas le SMTP simple : le signal annule aussi l'envoi en cours.
      controller.abort();
      reject(new Error("Délai d'envoi dépassé."));
    }, DELIVERY_TIMEOUT_MS);
  });
  try {
    // `from` vaut { name, address } : nodemailer encode le nom accentué dans l'en-tête.
    await Promise.race([
      transport.sendMail({ from: env.EMAIL_FROM, ...validated, signal: controller.signal }),
      deadline,
    ]);
  } finally {
    clearTimeout(timeout);
    transport.close();
  }
}
