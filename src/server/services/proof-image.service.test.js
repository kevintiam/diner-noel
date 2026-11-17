import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizeProofImage } from "./proof-image.service.js";

describe("normalizeProofImage", () => {
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
