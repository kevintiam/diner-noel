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
 * @returns {Promise<{ code: string, token: string }>} Le code et le jeton enregistrés.
 */
export async function insertReservation(transaction, values) {
  return transaction.reservation.create({
    data: {
      ...values,
      note: values.note ?? null,
      language: LANGUAGE_BY_LOCALE[values.language] ?? Language.FR,
      status: ReservationStatus.PENDING_PAYMENT,
    },
    select: { code: true, token: true },
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
      code: true,
      status: true,
      seats: true,
      unitPriceCents: true,
      amountCents: true,
      interacEmail: true,
    },
  });
}
