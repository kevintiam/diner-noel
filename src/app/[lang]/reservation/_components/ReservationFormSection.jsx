// Entrée dynamique du formulaire : vérifie à chaque requête qu'on peut encore
// réserver, et combien de places on peut demander (architecture AD-15).
import { connection } from "next/server";
import BookingCallToAction from "@/components/event/BookingCallToAction";
import ReservationForm from "@/components/reservations/ReservationForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { describeError, logger } from "@/lib/logger";
import { getEventOverview } from "@/server/services/event.service";
import { MAX_SEATS_PER_RESERVATION } from "@/validation/reservation-limits";

/**
 * Lit l'état des réservations à la demande, puis affiche le formulaire ou la raison
 * pour laquelle on ne peut plus réserver.
 * @param {{ lang: string }} props
 * @returns {Promise<React.ReactElement>} Le formulaire, ou le message « complet » / « fermé ».
 * @throws {Error} Si la base est inaccessible ou l'événement absent.
 */
export default async function ReservationFormSection({ lang }) {
  await connection();
  let overview;
  try {
    overview = await getEventOverview(new Date());
  } catch (error) {
    logger.error("reservation_form_failed", {
      route: `/${lang}/reservation`,
      method: "GET",
      ...describeError(error),
    });
    throw new Error("RESERVATION_FORM_FAILED");
  }
  const dictionary = getDictionary(lang);
  if (!overview.isBookingOpen) {
    return <BookingCallToAction overview={overview} lang={lang} dictionary={dictionary} />;
  }
  return (
    <ReservationForm
      lang={lang}
      dictionary={dictionary}
      unitPriceCents={overview.unitPriceCents}
      maxSeats={Math.min(MAX_SEATS_PER_RESERVATION, overview.seatsLeft)}
      maxSeatsPerReservation={MAX_SEATS_PER_RESERVATION}
      eventDetails={{
        startsAt: overview.startsAt.toISOString(),
        venueName: overview.venueName,
        venueAddress: overview.venueAddress,
      }}
    />
  );
}
