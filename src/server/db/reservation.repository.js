// Accès aux réservations.
import { ReservationStatus } from "../../generated/prisma/enums.ts";
import { getPrisma } from "./prisma-client.js";

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
