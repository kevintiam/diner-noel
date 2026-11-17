import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy.js";

/**
 * @param {string} path
 * @param {Record<string, string>} [headers]
 */
function requestTo(path, headers = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("envoie / vers /en pour un navigateur anglais", () => {
    const response = proxy(requestTo("/", { "accept-language": "en-CA,en;q=0.9" }));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/en");
  });

  it("envoie / vers /fr sans en-tête de langue", () => {
    const response = proxy(requestTo("/"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/fr");
  });

  it("garde le reste de l'adresse en ajoutant la langue", () => {
    const response = proxy(requestTo("/de", { "accept-language": "de-DE" }));

    expect(response.headers.get("location")).toBe("http://localhost:3000/fr/de");
  });

  it("laisse passer une adresse qui a déjà sa langue", () => {
    const response = proxy(requestTo("/en"));

    expect(response.headers.get("location")).toBeNull();
  });
});
