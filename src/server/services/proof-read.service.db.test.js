// Lecture d'une capture sur la base Neon `test` (.env.test). Image synthétique, données fictives.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import { getProofImage } from "./proof.service.js";

const BYTES = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);

beforeEach(async () => {
  await resetTestDatabase();
});
afterAll(async () => disconnectPrisma());

describe("getProofImage sur la base", () => {
  it("relit exactement les octets enregistrés, et 404 pour une capture inconnue", async () => {
    const reservation = await getPrisma().reservation.create({
      data: {
        code: "NOEL-0001",
        token: "jeton-capture".padEnd(43, "x"),
        status: "TO_VERIFY",
        firstName: "Fictif",
        lastName: "Exemple",
        email: "fictif@example.test",
        phone: "6135550100",
        seats: 2,
        language: "FR",
        unitPriceCents: 3000,
        amountCents: 6000,
        interacEmail: "paiements@example.test",
      },
    });
    const proof = await getPrisma().proof.create({
      data: {
        reservationId: reservation.id,
        data: BYTES,
        mimeType: "image/webp",
        byteSize: BYTES.byteLength,
      },
    });

    const image = await getProofImage(proof.id);

    expect(image.mimeType).toBe("image/webp");
    expect(Array.from(image.data)).toEqual(Array.from(BYTES));
    await expect(getProofImage("inconnue")).rejects.toMatchObject({ statusCode: 404 });
  });
});
