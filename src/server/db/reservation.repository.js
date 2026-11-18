// Accès aux réservations.
import { Language, ReservationStatus } from "../../generated/prisma/enums.ts";
import { getPrisma } from "./prisma-client.js";

/** @type {Record<string, Language>} */
const LANGUAGE_BY_LOCALE = { fr: Language.FR, en: Language.EN };

/**
 * Additionne les places prises : celles de toutes les réservations non annulées
 * (architecture AD-4). C'est le seul calcul des places prises du projet.
 * @param {Pick<ReturnType<typeof getPrisma>, "reservation">} [client] Le client Prisma, ou la transaction en cours (AD-5).
 * @returns {Promise<number>} Le nombre de places prises.
 */
export async function sumTakenSeats(client = getPrisma()) {
  const result = await client.reservation.aggregate({
    _sum: { seats: true },
    where: { status: { not: ReservationStatus.CANCELLED } },
  });
  return result._sum.seats ?? 0;
}

/**
 * Indique si un code de réservation est déjà utilisé.
 * @param {Pick<ReturnType<typeof getPrisma>, "reservation">} transaction La transaction en cours.
 * @param {string} code Le code à tester (ex. `NOEL-4821`).
 * @returns {Promise<boolean>} Vrai si le code existe déjà.
 */
export async function isCodeTaken(transaction, code) {
  const count = await transaction.reservation.count({ where: { code } });
  return count > 0;
}

/** @typedef {import("../../validation/reservation.schema.js").NewReservation} NewReservation */
/** @typedef {import("../../validation/reservation.schema.js").ReservationForPayment} ReservationForPayment */

/**
 * Enregistre une nouvelle réservation, en attente de paiement.
 * @param {Pick<ReturnType<typeof getPrisma>, "reservation">} transaction La transaction en cours.
 * @param {NewReservation} values Les valeurs de la réservation.
 * @returns {Promise<import("../../validation/reservation.schema.js").ReservationForReceipt>} L'instantané enregistré pour l'accusé.
 */
export async function insertReservation(transaction, values) {
  return transaction.reservation.create({
    data: {
      ...values,
      note: values.note ?? null,
      language: LANGUAGE_BY_LOCALE[values.language] ?? Language.FR,
    },
    select: {
      id: true,
      code: true,
      token: true,
      firstName: true,
      email: true,
      language: true,
      seats: true,
      childSeats: true,
      unitPriceCents: true,
      amountCents: true,
      interacEmail: true,
    },
  });
}

/**
 * Lit une réservation par son lien personnel.
 * @param {string} token Le jeton du lien personnel.
 * @returns {Promise<ReservationForPayment | null>} La réservation, ou null si le jeton est inconnu.
 */
export async function findReservationByToken(token) {
  return getPrisma().reservation.findUnique({
    where: { token },
    select: {
      firstName: true,
      code: true,
      status: true,
      seats: true,
      childSeats: true,
      unitPriceCents: true,
      amountCents: true,
      interacEmail: true,
    },
  });
}

/**
 * Lit uniquement l'état nécessaire au dépôt, dans sa transaction.
 * @param {import("./transaction.js").TransactionClient} tx La transaction.
 * @param {string} token Le jeton personnel.
 * @returns {Promise<{id: string, status: string, amountCents: number} | null>} L'état courant.
 */
export function findReservationStatusByToken(tx, token) {
  return tx.reservation.findUnique({
    where: { token },
    select: { id: true, status: true, amountCents: true },
  });
}

/**
 * Applique une transition conditionnelle, sans décision sur le statut ailleurs.
 * @param {import("./transaction.js").TransactionClient} tx La transaction.
 * @param {string} id La réservation.
 * @param {import('./reservation-admin.repository.js').ReservationStatusCode} from L'état attendu.
 * @param {import('./reservation-admin.repository.js').ReservationStatusCode} to Le nouvel état.
 * @returns {Promise<number>} Le nombre de lignes modifiées.
 */
export async function updateReservationStatus(tx, id, from, to) {
  const result = await tx.reservation.updateMany({
    where: { id, status: from },
    data: { status: to },
  });
  return result.count;
}
