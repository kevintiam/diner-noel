import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-signature.js";

describe("detectImageType", () => {
  it.each([
    [[255, 216, 255], "jpeg"],
    [[137, 80, 78, 71, 13, 10, 26, 10], "png"],
    [[82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80], "webp"],
    [[], null],
    [[137, 80, 78], null],
    [[71, 73, 70, 56], null],
  ])("reconnaît %j comme %s", (bytes, expected) => {
    expect(detectImageType(new Uint8Array(bytes))).toBe(expected);
  });
  it.each(["texte.png", "<svg/>", "ftypheic"])("refuse %s", (text) => {
    expect(detectImageType(new TextEncoder().encode(text))).toBeNull();
  });
});
