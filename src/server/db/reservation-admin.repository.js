// Accès aux réservations pour le tableau de bord : lectures, changements de statut
// et historique des décisions (architecture AD-4 et AD-5).
import { getPrisma } from "./prisma-client.js";

/** @typedef {import("./transaction.js").TransactionClient} TransactionClient */
/** @typedef {"PENDING_PAYMENT" | "TO_VERIFY" | "CONFIRMED" | "CANCELLED"} ReservationStatusCode */
/** @typedef {import("../../validation/reservation-decision.schema.js").ReservationForDecisionEmail} ReservationForDecisionEmail */

/**
 * Liste les réservations, de la plus récente à la plus ancienne.
 * @returns {Promise<Array<{ id: string, code: string, status: ReservationStatusCode, firstName: string, lastName: string, email: string, amountCents: number, seats: number, childSeats: number, createdAt: Date }>>}
 *   Les réservations du tableau de bord.
 */
export async function findDashboardReservations() {
  return getPrisma().reservation.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      status: true,
      firstName: true,
      lastName: true,
      email: true,
      amountCents: true,
      seats: true,
      childSeats: true,
      createdAt: true,
    },
  });
}

/**
 * Lit la fiche d'une réservation, ses captures (sans leurs octets) et ses décisions.
 * @param {string} reservationId
 */
export async function findReservationDetail(reservationId) {
  return getPrisma().reservation.findUnique({
    where: { id: reservationId },
    include: {
      proofs: {
        orderBy: { createdAt: "desc" },
        select: { id: true, mimeType: true, byteSize: true, createdAt: true },
      },
      decisions: {
        orderBy: { createdAt: "desc" },
        include: { organizer: { select: { name: true } } },
      },
    },
  });
}

/**
 * Lit le statut actuel d'une réservation.
 * @param {TransactionClient} transaction La transaction en cours.
 * @param {string} reservationId
 * @returns {Promise<{ status: ReservationStatusCode } | null>} Le statut, ou null si la réservation n'existe pas.
 */
export async function findReservationStatus(transaction, reservationId) {
  return transaction.reservation.findUnique({
    where: { id: reservationId },
    select: { status: true },
  });
}

/**
 * Note la date de la première confirmation ; elle n'est jamais remplacée ni effacée (AD-6).
 * @param {TransactionClient} transaction La transaction en cours.
 * @param {string} reservationId
 * @param {Date} confirmedAt L'instant de la confirmation.
 * @returns {Promise<void>}
 */
export async function markReservationConfirmed(transaction, reservationId, confirmedAt) {
  await transaction.reservation.updateMany({
    where: { id: reservationId, confirmedAt: null },
    data: { confirmedAt },
  });
}

/**
 * Enregistre une décision dans l'historique, dans la transaction du changement de statut (AD-4).
 * @param {TransactionClient} transaction La transaction en cours.
 * @param {{ reservationId: string, type: "CONFIRM" | "REFUSE" | "CANCEL", organizerId: string, reasonCode: "NO_TRANSFER" | "INCOMPLETE_AMOUNT" | "UNREADABLE_PROOF" | null, createdAt: Date }} decision
 * @returns {Promise<void>}
 */
export async function recordDecision(transaction, decision) {
  await transaction.reservationDecision.create({ data: decision });
}

/**
 * Lit les valeurs figées dont le courriel de décision a besoin.
 * @param {TransactionClient} transaction La transaction en cours.
 * @param {string} reservationId
 * @returns {Promise<ReservationForDecisionEmail>} La réservation, qui existe forcément ici.
 */
export async function findReservationForDecisionEmail(transaction, reservationId) {
  return transaction.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    select: {
      id: true,
      code: true,
      token: true,
      firstName: true,
      email: true,
      language: true,
      seats: true,
      childSeats: true,
      amountCents: true,
      interacEmail: true,
    },
  });
}

/**
 * Compte les réservations non annulées : elles gardent leur prix si le tarif change (AD-6).
 * @returns {Promise<number>}
 */
export async function countActiveReservations() {
  return getPrisma().reservation.count({ where: { status: { not: "CANCELLED" } } });
}

/**
 * Participant confirmé, tel que l'export CSV le lit.
 * @typedef {object} ConfirmedParticipant
 * @property {string} code
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {number} seats
 * @property {number} childSeats
 * @property {"FR" | "EN"} language
 * @property {number} amountCents
 * @property {Date | null} confirmedAt
 * @property {string | null} note
 */

/**
 * Lit les réservations confirmées, au moment de la requête (architecture AD-15).
 * @returns {Promise<ConfirmedParticipant[]>} Les participants confirmés, sans ordre garanti.
 */
export async function findConfirmedParticipants() {
  return getPrisma().reservation.findMany({
    where: { status: "CONFIRMED" },
    select: {
      code: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      seats: true,
      childSeats: true,
      language: true,
      amountCents: true,
      confirmedAt: true,
      note: true,
    },
  });
}
