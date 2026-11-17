import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeProofImage } from "./proof-image.service.js";
import { MAX_PROOF_BYTES } from "../../validation/proof.schema.js";

describe("normalizeProofImage", () => {
  it("refuse une image de moins de 4 Mio dépassant 40 millions de pixels", async () => {
    const input = await sharp({
      create: { width: 8000, height: 5001, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    expect(input.byteLength).toBeLessThan(MAX_PROOF_BYTES);
    await expect(normalizeProofImage(input)).rejects.toMatchObject({
      statusCode: 415,
      code: "PROOF_INVALID_TYPE",
    });
  });
  it("applique l'orientation EXIF 6 et supprime les EXIF", async () => {
    const input = await sharp({ create: { width: 60, height: 30, channels: 3, background: "red" } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    expect((await sharp(input).metadata()).orientation).toBe(6);
    const output = await normalizeProofImage(input);
    const metadata = await sharp(output.data).metadata();
    expect(metadata).toMatchObject({ width: 30, height: 60 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });
  it.each(["png", "jpeg", "webp"])("réencode le %s en WebP privé sans agrandir", async (format) => {
    const input = await sharp({ create: { width: 30, height: 20, channels: 3, background: "red" } })
      .toFormat(format)
      .toBuffer();
    const image = await normalizeProofImage(input);
    const metadata = await sharp(image.data).metadata();
    expect(image.mimeType).toBe("image/webp");
    expect(image.byteSize).toBe(image.data.byteLength);
    expect(metadata).toMatchObject({ format: "webp", width: 30, height: 20 });
    expect(metadata.exif).toBeUndefined();
  });
  it("réduit une grande image et retire les EXIF", async () => {
    const input = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: "blue" },
    })
      .withExif({ IFD0: { Artist: "Fictif" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const output = await normalizeProofImage(input);
    const metadata = await sharp(output.data).metadata();
    expect(metadata).toMatchObject({ width: 2000, height: 1500 });
    expect(metadata.exif).toBeUndefined();
  });
  it.each([
    Buffer.from("capture.png"),
    Buffer.from("<svg/>"),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from("GIF89a"),
    Buffer.from("0000ftypheic"),
  ])("refuse un format interdit ou corrompu", async (input) => {
    await expect(normalizeProofImage(input)).rejects.toMatchObject({
      statusCode: 415,
      code: "PROOF_INVALID_TYPE",
    });
  });
});
