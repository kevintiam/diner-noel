import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { seedDefaultEvent } from "../../../prisma/default-event.js";
import { disconnectPrisma, getPrisma } from "../db/prisma-client.js";
import { resetTestDatabase } from "../db/reset-test-database.js";
import * as proofRepository from "../db/proof.repository.js";
import { createReservation } from "./reservation.service.js";
import { submitProof } from "./proof.service.js";

const now = new Date("2026-11-20T15:00:00.000Z");
let image;

async function reserve() {
  return createReservation(
    {
      firstName: "Prénom",
      lastName: "Fictif",
      email: "preuve@example.test",
      phone: "6135550100",
      adultSeats: 2,
      childSeats: 1,
      note: undefined,
    },
    { lang: "fr", now },
  );
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await resetTestDatabase();
  await seedDefaultEvent();
  image = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "green" } })
    .withExif({ IFD0: { Artist: "Fictif" } })
    .png()
    .toBuffer();
});
afterAll(disconnectPrisma);

describe("submitProof", () => {
  it("stocke le WebP privé normalisé et préserve les places et le montant", async () => {
    const { token } = await reserve();
    const previous = await getPrisma().reservation.findUniqueOrThrow({ where: { token } });
    expect(await submitProof({ token, imageBytes: image })).toEqual({ status: "TO_VERIFY" });
    const stored = await getPrisma().proof.findFirstOrThrow();
    const metadata = await sharp(stored.data).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 2000, height: 1500 });
    expect(metadata.exif).toBeUndefined();
    expect(stored.mimeType).toBe("image/webp");
    expect(stored.byteSize).toBe(stored.data.byteLength);
    const reservation = await getPrisma().reservation.findUniqueOrThrow({ where: { token } });
    expect(reservation).toMatchObject({
      status: "TO_VERIFY",
      seats: previous.seats,
      amountCents: previous.amountCents,
    });
  });
  it("refuse le second dépôt en gardant la capture initiale", async () => {
    const { token } = await reserve();
    await submitProof({ token, imageBytes: image });
    const previous = await getPrisma().proof.findFirstOrThrow();
    await expect(submitProof({ token, imageBytes: image })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(await getPrisma().proof.findMany()).toEqual([previous]);
  });
  it("un seul de deux dépôts simultanés réussit", async () => {
    const { token } = await reserve();
    const results = await Promise.allSettled([
      submitProof({ token, imageBytes: image }),
      submitProof({ token, imageBytes: image }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected").reason).toMatchObject({
      statusCode: 409,
    });
    expect(await getPrisma().proof.count()).toBe(1);
  });
  it("ajoute une nouvelle capture après un retour en attente sans écraser la précédente", async () => {
    const { token } = await reserve();
    await submitProof({ token, imageBytes: image });
    const previous = await getPrisma().proof.findFirstOrThrow();
    await getPrisma().reservation.update({ where: { token }, data: { status: "PENDING_PAYMENT" } });
    await submitProof({ token, imageBytes: image });
    expect(await getPrisma().proof.count()).toBe(2);
    expect(await getPrisma().proof.findUnique({ where: { id: previous.id } })).toEqual(previous);
  });
  it.each(["TO_VERIFY", "CONFIRMED", "CANCELLED"])("refuse le statut %s", async (status) => {
    const { token } = await reserve();
    await getPrisma().reservation.update({ where: { token }, data: { status } });
    await expect(submitProof({ token, imageBytes: image })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(await getPrisma().proof.count()).toBe(0);
  });
  it("refuse aussi une réservation gratuite remise artificiellement en attente", async () => {
    const { token } = await reserve();
    await getPrisma().reservation.update({ where: { token }, data: { amountCents: 0 } });
    await expect(submitProof({ token, imageBytes: image })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(await getPrisma().proof.count()).toBe(0);
  });
  it("annule le changement de statut si l'insertion échoue", async () => {
    const { token } = await reserve();
    vi.spyOn(proofRepository, "insertProof").mockRejectedValue(new Error("échec synthétique"));
    await expect(submitProof({ token, imageBytes: image })).rejects.toThrow("échec synthétique");
    expect((await getPrisma().reservation.findUniqueOrThrow({ where: { token } })).status).toBe(
      "PENDING_PAYMENT",
    );
    expect(await getPrisma().proof.count()).toBe(0);
  });
  it("refuse les liens inconnus et images invalides sans capture", async () => {
    await expect(submitProof({ token: "invalide", imageBytes: image })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(submitProof({ token: "A".repeat(43), imageBytes: image })).rejects.toMatchObject({
      statusCode: 404,
    });
    const { token } = await reserve();
    await expect(
      submitProof({ token, imageBytes: Buffer.from("texte.png") }),
    ).rejects.toMatchObject({ statusCode: 415 });
    expect((await getPrisma().reservation.findUniqueOrThrow({ where: { token } })).status).toBe(
      "PENDING_PAYMENT",
    );
    expect(await getPrisma().proof.count()).toBe(0);
  });
});
