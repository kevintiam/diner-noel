import { afterEach, describe, expect, it, vi } from "vitest";
import { readLimitedFormData } from "./read-limited-form-data.js";

afterEach(() => vi.useRealTimers());

describe("readLimitedFormData", () => {
  it.each(["normal", "bloqué", "rejeté"])(
    "termine un flux suspendu même si son annulation est %s",
    async (mode) => {
      vi.useFakeTimers();
      const cancel = vi.fn(() => {
        if (mode === "bloqué") return new Promise(() => {});
        if (mode === "rejeté") return Promise.reject(new Error("annulation impossible"));
      });
      const body = new ReadableStream({ cancel });
      const init = {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=test" },
        body,
        duplex: "half",
      };
      const request = new Request("https://example.test", init);
      const result = expect(readLimitedFormData(request, 1000, 100)).rejects.toMatchObject({
        statusCode: 408,
        code: "UPLOAD_TIMEOUT",
        messageKey: "errors.uploadTimeout",
      });
      await vi.advanceTimersByTimeAsync(100);
      await result;
      expect(cancel).toHaveBeenCalledOnce();
      expect(body.locked).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it("borne la durée totale même si des fragments continuent d’arriver", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const body = new ReadableStream(
      {
        async pull(controller) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          controller.enqueue(new Uint8Array([1]));
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    const init = {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=test" },
      body,
      duplex: "half",
    };
    const result = expect(
      readLimitedFormData(new Request("https://example.test", init), 1000, 100),
    ).rejects.toMatchObject({ statusCode: 408 });
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(cancel).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(30);
  });
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
  it("préserve la 413 même si l'annulation du flux rejette", async () => {
    const cancellationError = new Error("annulation impossible");
    const cancel = vi.fn(() => Promise.reject(cancellationError));
    const body = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(101));
      },
      cancel,
    });
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=limite" },
      body,
      duplex: "half",
    });
    const failure = await readLimitedFormData(request, 100).catch((error) => error);
    expect(failure).toMatchObject({
      statusCode: 413,
      code: "PROOF_TOO_LARGE",
    });
    // L’annulation reste asynchrone pour ne pas bloquer sur un flux distant.
    await vi.waitFor(() => expect(failure.cause).toBe(cancellationError));
    expect(cancel).toHaveBeenCalledOnce();
  });
});
