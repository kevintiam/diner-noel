// Libellés du tableau de bord. /admin est écrit en français, sans dictionnaire (architecture AD-3).

/** @type {Record<string, string>} */
export const STATUS_LABELS = {
  PENDING_PAYMENT: "En attente de paiement",
  TO_VERIFY: "À vérifier",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};

/** @type {Record<string, string>} */
export const DECISION_LABELS = {
  CONFIRM: "Paiement confirmé",
  REFUSE: "Preuve refusée",
  CANCEL: "Réservation annulée",
  AUTO_CANCEL: "Annulation automatique",
};

/** @type {Record<string, string>} */
export const REFUSAL_REASON_LABELS = {
  NO_TRANSFER: "Aucun virement reçu",
  INCOMPLETE_AMOUNT: "Montant incomplet",
  UNREADABLE_PROOF: "Capture illisible ou incorrecte",
};

/** @type {Record<string, string>} */
export const LANGUAGE_LABELS = { FR: "Français", EN: "Anglais" };

/** Courriels au participant dont l'échec est signalé (architecture AD-10). @type {Record<string, string>} */
export const EMAIL_KIND_LABELS = {
  RECEIPT: "Accusé de réception",
  CONFIRMATION: "Confirmation du paiement",
  REFUSAL: "Avis de refus",
};

/**
 * Renvoie le libellé d'un code, ou le code lui-même s'il est inconnu.
 * @param {Record<string, string>} labels La table de libellés.
 * @param {string} code Le code enregistré en base.
 * @returns {string} Le libellé à afficher.
 */
export function getLabel(labels, code) {
  return Object.hasOwn(labels, code) ? labels[code] : code;
}

/**
 * Tire les initiales d'un nom complet : la première lettre des deux premiers mots.
 * @param {string} fullName Le nom affiché (ex. « Prénom Fictif »).
 * @returns {string} Les initiales en majuscules (ex. « PF »), ou « ? » pour un nom vide.
 */
export function getInitials(fullName) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  let initials = "";
  for (const word of words.slice(0, 2)) {
    initials += word.charAt(0);
  }
  return initials.toLocaleUpperCase("fr-CA");
}

/**
 * Accorde un mot selon un nombre, à la française : 0 et 1 restent au singulier.
 * @param {number} count Le nombre.
 * @param {string} singular Le mot au singulier.
 * @param {string} plural Le mot au pluriel.
 * @returns {string} Le nombre suivi du mot accordé (ex. « 2 places »).
 */
export function formatCount(count, singular, plural) {
  return `${count} ${count > 1 ? plural : singular}`;
}
