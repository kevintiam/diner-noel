import { z } from "zod";

/**
 * Message partagé par tous les services et l'adaptateur de courriel.
 * @typedef {object} EmailMessage
 * @property {string} to Adresse unique du destinataire.
 * @property {string} subject Objet sans retour à la ligne.
 * @property {string} text Corps texte.
 * @property {string} html Corps HTML dont les valeurs sont échappées.
 */
const emailSchema = z
  .object({
    to: z.email().max(254),
    subject: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[^\r\n]+$/),
    text: z.string().min(1),
    html: z.string().min(1),
  })
  .strict();

/**
 * Valide un message sans laisser son contenu apparaître dans une erreur Zod.
 * @param {unknown} value Le message à envoyer.
 * @returns {EmailMessage} Le message validé.
 * @throws {Error} Si le message est invalide, sans en exposer le contenu.
 */
export function validateEmailMessage(value) {
  const result = emailSchema.safeParse(value);
  if (!result.success) throw new Error("Message de courriel invalide.");
  return result.data;
}
