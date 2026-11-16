// Données de l'événement échangées entre les couches.
// Le schéma Zod des paramètres modifiables arrivera avec l'écran Paramètres (épopée 3).

/**
 * Valeurs de l'unique événement, telles que stockées (heures en UTC, argent en cents).
 * @typedef {object} EventValues
 * @property {Date} startsAt Début du dîner.
 * @property {Date} bookingDeadline Fin des réservations, toujours avant le dîner.
 * @property {number} capacity Nombre total de places.
 * @property {number} unitPriceCents Prix d'une place, en cents.
 * @property {string} venueName Nom du lieu.
 * @property {string} venueAddress Adresse du lieu.
 * @property {string} interacEmail Courriel qui reçoit les virements Interac.
 */

/**
 * Ce que l'accueil affiche de l'événement.
 * @typedef {object} EventOverview
 * @property {Date} startsAt Début du dîner.
 * @property {Date} bookingDeadline Fin des réservations.
 * @property {string} venueName Nom du lieu.
 * @property {string} venueAddress Adresse du lieu.
 * @property {number} unitPriceCents Prix d'une place, en cents.
 * @property {number} capacity Nombre total de places.
 * @property {number} seatsLeft Places encore libres (jamais négatif).
 */

export {};
