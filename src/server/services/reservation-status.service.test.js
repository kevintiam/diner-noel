import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../db/reservation.repository.js", () => ({ updateReservationStatus: vi.fn() }));
import { updateReservationStatus } from "../db/reservation.repository.js";
import {
  RESERVATION_TRANSITIONS,
  transitionReservationStatus,
} from "./reservation-status.service.js";

beforeEach(() => vi.clearAllMocks());

describe("transitionReservationStatus", () => {
  it("définit toutes les transitions de l'AD-4", () => {
    expect(RESERVATION_TRANSITIONS).toEqual({
      PENDING_PAYMENT: ["TO_VERIFY", "CANCELLED"],
      TO_VERIFY: ["CONFIRMED", "PENDING_PAYMENT", "CANCELLED"],
      CONFIRMED: ["CANCELLED"],
      CANCELLED: [],
    });
  });
  it.each(
    Object.entries(RESERVATION_TRANSITIONS).flatMap(([from, values]) =>
      values.map((to) => [from, to]),
    ),
  )("applique %s vers %s", async (from, to) => {
    vi.mocked(updateReservationStatus).mockResolvedValue(1);
    await transitionReservationStatus({}, { reservationId: "id", from, to });
    expect(updateReservationStatus).toHaveBeenCalledWith({}, "id", from, to);
  });
  it("refuse une transition interdite sans écrire", async () => {
    await expect(
      transitionReservationStatus({}, { reservationId: "id", from: "CANCELLED", to: "TO_VERIFY" }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(updateReservationStatus).not.toHaveBeenCalled();
  });
  it("refuse si le statut attendu a déjà changé", async () => {
    vi.mocked(updateReservationStatus).mockResolvedValue(0);
    await expect(
      transitionReservationStatus(
        {},
        { reservationId: "id", from: "PENDING_PAYMENT", to: "TO_VERIFY" },
      ),
    ).rejects.toMatchObject({ code: "RESERVATION_STATUS_CHANGED" });
  });
});
