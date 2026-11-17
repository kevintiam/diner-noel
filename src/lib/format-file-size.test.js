import { describe, expect, it } from "vitest";
import { formatFileSize } from "./format.js";

describe("formatFileSize", () => {
  it("affiche les unités et décimales dans la langue", () => {
    expect(formatFileSize(1258291, "fr")).toBe("1,2 Mo");
    expect(formatFileSize(1258291, "en")).toBe("1.2 MB");
    expect(formatFileSize(4 * 1024 * 1024, "fr")).toBe("4 Mo");
  });
});
