import { beforeEach, describe, expect, it, vi } from "vitest";
import { findEventById, getEvent, lockEvent, updateEvent } from "../db/event.repository.js";
import { countActiveReservations } from "../db/reservation-admin.repository.js";
import { sumTakenSeats } from "../db/reservation.repository.js";
import { getEventSettings, updateEventSettings } from "./event-settings.service.js";

vi.mock("../db/event.repository.js", () => ({
  findEventById: vi.fn(),
  getEvent: vi.fn(),
  lockEvent: vi.fn(),
  updateEvent: vi.fn(),
}));
vi.mock("../db/reservation-admin.repository.js", () => ({ countActiveReservations: vi.fn() }));
vi.mock("../db/reservation.repository.js", () => ({ sumTakenSeats: vi.fn() }));
// La transaction simulée exécute le travail directement, avec un client factice.
const TRANSACTION = { name: "transaction-fictive" };
vi.mock("../db/transaction.js", () => ({
  runInTransaction: vi.fn(async (work) => work(TRANSACTION)),
}));

// 18 h le 19 décembre 2026 et 23 h 59 le 12 décembre, à Ottawa.
const EVENT = {
  id: "event-fictif",
  startsAt: new Date("2026-12-19T23:00:00.000Z"),
  bookingDeadline: new Date("2026-12-13T04:59:00.000Z"),
  capacity: 120,
  unitPriceCents: 3500,
  promotionalUnitPriceCents: 3000,
  promotionStartsAt: new Date("2026-11-20T05:00:00.000Z"),
  promotionEndsAt: new Date("2026-12-04T05:00:00.000Z"),
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
  interacEmail: "Paiements@example.test",
  alertSentAt: new Date("2026-12-16T05:00:00.000Z"),
};
const FORM = {
  startsAtDate: "2026-12-19",
  startsAtTime: "18:00",
  bookingDeadlineDate: "2026-12-12",
  venueName: "Salle fictive",
  venueAddress: "1 rue Exemple, Ottawa",
  capacity: "130",
  unitPrice: "40",
  interacEmail: "paiements@example.test",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getEvent).mockResolvedValue(/** @type {never} */ (EVENT));
  vi.mocked(lockEvent).mockResolvedValue(/** @type {never} */ ({ id: EVENT.id }));
  vi.mocked(findEventById).mockResolvedValue(/** @type {never} */ (EVENT));
  vi.mocked(sumTakenSeats).mockResolvedValue(82);
  vi.mocked(countActiveReservations).mockResolvedValue(34);
});

describe("getEventSettings", () => {
  it("présente les valeurs à l'heure d'Ottawa, avec les repères de la maquette", async () => {
    await expect(getEventSettings()).resolves.toEqual({
      values: {
        startsAtDate: "2026-12-19",
        startsAtTime: "18:00",
        bookingDeadlineDate: "2026-12-12",
        venueName: "Salle fictive",
        venueAddress: "1 rue Exemple, Ottawa",
        capacity: "120",
        unitPrice: "35",
        interacEmail: "Paiements@example.test",
      },
      takenSeats: 82,
      activeReservations: 34,
      promotion: { unitPriceCents: 3000, endsAt: EVENT.promotionEndsAt },
    });
  });

  it("répond 500 tant que l'événement n'existe pas", async () => {
    vi.mocked(getEvent).mockResolvedValue(null);
    await expect(getEventSettings()).rejects.toMatchObject({ statusCode: 500 });
  });
});

describe("updateEventSettings", () => {
  it("enregistre les nouvelles valeurs sous le verrou, sans toucher à l'alerte", async () => {
    await updateEventSettings(FORM);

    expect(lockEvent).toHaveBeenCalledWith(TRANSACTION);
    expect(sumTakenSeats).toHaveBeenCalledWith(TRANSACTION);
    expect(updateEvent).toHaveBeenCalledExactlyOnceWith(TRANSACTION, EVENT.id, {
      startsAt: EVENT.startsAt,
      bookingDeadline: EVENT.bookingDeadline,
      capacity: 130,
      unitPriceCents: 4000,
      venueName: "Salle fictive",
      venueAddress: "1 rue Exemple, Ottawa",
      interacEmail: "paiements@example.test",
    });
  });

  it("relance l'alerte quand la date du dîner change", async () => {
    await updateEventSettings({ ...FORM, startsAtDate: "2026-12-20" });

    expect(vi.mocked(updateEvent).mock.calls[0][2]).toMatchObject({
      startsAt: new Date("2026-12-20T23:00:00.000Z"),
      alertSentAt: null,
    });
  });

  it.each([
    ["2026-12-19", "18:00"],
    ["2026-12-20", "18:00"],
  ])("refuse une date limite le %s ou après le dîner", async (bookingDeadlineDate) => {
    await expect(updateEventSettings({ ...FORM, bookingDeadlineDate })).rejects.toMatchObject({
      statusCode: 400,
      details: [{ field: "bookingDeadlineDate", messageKey: "validation.deadlineAfterEvent" }],
    });
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("refuse moins de places que celles déjà prises", async () => {
    await expect(updateEventSettings({ ...FORM, capacity: "81" })).rejects.toMatchObject({
      statusCode: 400,
      details: [{ field: "capacity", messageKey: "validation.capacityBelowTaken" }],
    });
    expect(updateEvent).not.toHaveBeenCalled();
  });

  it("accepte exactement le nombre de places déjà prises", async () => {
    await updateEventSettings({ ...FORM, capacity: "82" });
    expect(vi.mocked(updateEvent).mock.calls[0][2]).toMatchObject({ capacity: 82 });
  });

  it("exige le dépôt automatique pour une nouvelle adresse Interac", async () => {
    const changed = { ...FORM, interacEmail: "nouvelle@example.test" };

    await expect(updateEventSettings(changed)).rejects.toMatchObject({
      details: [{ field: "autoDepositConfirmed", messageKey: "validation.autoDepositRequired" }],
    });
    await updateEventSettings({ ...changed, autoDepositConfirmed: true });
    expect(vi.mocked(updateEvent).mock.calls[0][2]).toMatchObject({
      interacEmail: "nouvelle@example.test",
    });
  });

  it("refuse des valeurs invalides avant d'ouvrir la transaction", async () => {
    await expect(updateEventSettings({ ...FORM, unitPrice: "abc" })).rejects.toMatchObject({
      statusCode: 400,
      details: [{ field: "unitPrice", messageKey: "validation.priceInvalid" }],
    });
    expect(lockEvent).not.toHaveBeenCalled();
  });
});
