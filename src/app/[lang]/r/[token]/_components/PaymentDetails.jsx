// Entrée dynamique de la page de paiement : lit la réservation du lien personnel.
// Le jeton n'apparaît jamais dans le journal (architecture AD-7).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PaymentInstructions from "@/components/reservations/PaymentInstructions";
import FreeReservationConfirmation from "@/components/reservations/FreeReservationConfirmation";
import { getDictionary } from "@/i18n/get-dictionary";
import { describeError, logger } from "@/lib/logger";
import { getReservationForPayment } from "@/server/services/reservation.service";

/**
 * Lit la réservation du lien personnel à la demande, puis affiche ses instructions de paiement.
 * @param {{ params: Promise<{ lang: string, token: string }> }} props
 * @returns {Promise<React.ReactElement>} Les instructions de paiement.
 * @throws {Error} Si la base est inaccessible ; page 404 si le lien est inconnu.
 */
export default async function PaymentDetails({ params }) {
  const { lang, token } = await params;
  await connection();
  let reservation;
  try {
    reservation = await getReservationForPayment(token);
  } catch (error) {
    logger.error("payment_page_failed", {
      route: `/${lang}/r`,
      method: "GET",
      ...describeError(error),
    });
    throw new Error("PAYMENT_PAGE_FAILED");
  }
  if (!reservation) {
    notFound();
  }
  if (reservation.amountCents === 0) {
    return (
      <FreeReservationConfirmation reservation={reservation} dictionary={getDictionary(lang)} />
    );
  }
  return (
    <PaymentInstructions reservation={reservation} lang={lang} dictionary={getDictionary(lang)} />
  );
}
