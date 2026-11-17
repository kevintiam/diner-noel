import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { AppError } from "@/server/errors/app-error";
vi.mock("@/server/services/proof.service", () => ({ submitProof: vi.fn() }));
vi.mock("@/server/services/rate-limit.service", () => ({
  checkRateLimit: vi.fn(),
  buildRateLimitKey: vi.fn(() => "proof:empreinte"),
}));
import { submitProof } from "@/server/services/proof.service";
import { buildRateLimitKey, checkRateLimit } from "@/server/services/rate-limit.service";
import { MAX_PROOF_BYTES } from "@/validation/proof.schema";
import { POST } from "./route.js";

const TOKEN = "A".repeat(43);
const context = (token = TOKEN) => ({ params: Promise.resolve({ token }) });

function request({ proof = new File(["image"], "capture.png"), lang = "fr", confirm = "on" } = {}) {
  const body = new FormData();
  if (proof !== null) body.set("proof", proof);
  if (confirm !== null) body.set("confirmTransfer", confirm);
  body.set("lang", lang);
  return new Request("https://example.test", {
    method: "POST",
    body,
    headers: { "x-nf-client-connection-ip": "192.0.2.1" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitProof).mockResolvedValue({ status: "TO_VERIFY" });
  vi.mocked(checkRateLimit).mockResolvedValue(undefined);
});

describe("POST preuve", () => {
  it("répond 201 avec le seul statut et limite les envois par empreinte", async () => {
    const image = await sharp({ create: { width: 5, height: 5, channels: 3, background: "red" } })
      .png()
      .toBuffer();
    const response = await POST(request({ proof: new File([image], "capture.png") }), context());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { status: "TO_VERIFY" } });
    expect(submitProof).toHaveBeenCalledWith({ token: TOKEN, imageBytes: new Uint8Array(image) });
    expect(buildRateLimitKey).toHaveBeenCalledWith("proof", "192.0.2.1");
    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ key: "proof:empreinte", limit: 20, windowSeconds: 900 }),
    );
  });
  it("refuse un corps annoncé trop grand sans lecture", async () => {
    const incoming = request();
    incoming.headers.set("content-length", String(MAX_PROOF_BYTES + 65537));
    const spy = vi.spyOn(incoming.body, "getReader");
    const response = await POST(incoming, context());
    expect(response.status).toBe(413);
    expect(spy).not.toHaveBeenCalled();
    expect(submitProof).not.toHaveBeenCalled();
  });
  it("refuse un fichier dépassant 4 Mio même sous la limite multipart", async () => {
    const response = await POST(
      request({ proof: new File([new Uint8Array(MAX_PROOF_BYTES + 1)], "trop.png") }),
      context(),
    );
    expect(response.status).toBe(413);
    expect(submitProof).not.toHaveBeenCalled();
  });
  it("traduit les erreurs des champs en anglais", async () => {
    const response = await POST(request({ proof: null, confirm: null, lang: "en" }), context());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        { field: "proof", message: "Choose a non-empty screenshot." },
        { field: "confirmTransfer", message: "Confirm that you have sent the transfer." },
      ]),
    );
  });
  it("choisit le français pour une langue invalide", async () => {
    const response = await POST(request({ lang: "de" }), context());
    expect(response.status).toBe(400);
    expect((await response.json()).error.details[0]).toEqual({
      field: "lang",
      message: "Choisissez une langue valide.",
    });
  });
  it("refuse un jeton malformé sans service", async () => {
    expect((await POST(request(), context("invalide"))).status).toBe(404);
    expect(submitProof).not.toHaveBeenCalled();
  });
  it.each([
    [415, "PROOF_INVALID_TYPE", "errors.proofInvalidType"],
    [409, "RESERVATION_STATUS_CHANGED", "errors.reservationStatusChanged"],
    [404, "RESERVATION_NOT_FOUND", "errors.reservationNotFound"],
  ])("convertit une erreur du service %s", async (status, code, key) => {
    vi.mocked(submitProof).mockRejectedValue(new AppError(status, code, key));
    const response = await POST(request({ lang: "en" }), context());
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });
  it("applique la limite avant de lire le corps", async () => {
    vi.mocked(checkRateLimit).mockRejectedValue(
      new AppError(429, "TOO_MANY_REQUESTS", "errors.tooManyRequests"),
    );
    const incoming = request();
    const spy = vi.spyOn(incoming.body, "getReader");
    expect((await POST(incoming, context())).status).toBe(429);
    expect(spy).not.toHaveBeenCalled();
  });
});
