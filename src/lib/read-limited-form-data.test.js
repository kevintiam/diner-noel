import { describe, expect, it, vi } from "vitest";
import { readLimitedFormData } from "./read-limited-form-data.js";

describe("readLimitedFormData", () => {
  it("décode un multipart sans content-length", async () => {
    const body = new FormData();
    body.set("lang", "en");
    const request = new Request("https://example.test", { method: "POST", body });
    expect((await readLimitedFormData(request, 1000)).get("lang")).toBe("en");
  });
  it("refuse la taille annoncée avant de lire le flux", async () => {
    const getReader = vi.fn();
    const request = { headers: new Headers({ "content-length": "101" }), body: { getReader } };
    await expect(readLimitedFormData(request, 100)).rejects.toMatchObject({ statusCode: 413 });
    expect(getReader).not.toHaveBeenCalled();
  });
  it.each([undefined, "1"])("annule le flux trop grand avec une taille %s", async (length) => {
    const cancel = vi.fn();
    const headers = { "content-type": "multipart/form-data; boundary=limite" };
    if (length) headers["content-length"] = length;
    let pulls = 0;
    const body = new ReadableStream(
      {
        pull(controller) {
          pulls++;
          controller.enqueue(new Uint8Array(60));
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    const request = new Request("https://example.test", {
      method: "POST",
      headers,
      body,
      duplex: "half",
    });
    await expect(readLimitedFormData(request, 100)).rejects.toMatchObject({
      code: "PROOF_TOO_LARGE",
    });
    expect(cancel).toHaveBeenCalledOnce();
    expect(pulls).toBe(2);
  });
  it.each(["multipart/form-data; boundary=absente", "text/plain", "multipart/form-data"])(
    "refuse un corps malformé (%s)",
    async (contentType) => {
      const request = new Request("https://example.test", {
        method: "POST",
        headers: { "content-type": contentType },
        body: "incomplet",
      });
      await expect(readLimitedFormData(request, 100)).rejects.toMatchObject({
        statusCode: 400,
        code: "VALIDATION_ERROR",
      });
    },
  );
});
