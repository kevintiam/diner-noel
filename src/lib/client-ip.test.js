import { describe, expect, it } from "vitest";
import { getClientIp } from "./client-ip.js";

describe("getClientIp", () => {
  it("préfère l'en-tête de Netlify", () => {
    const requestHeaders = new Headers({
      "x-nf-client-connection-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1",
    });

    expect(getClientIp(requestHeaders)).toBe("203.0.113.7");
  });

  it("prend la première adresse de x-forwarded-for à défaut", () => {
    const requestHeaders = new Headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" });

    expect(getClientIp(requestHeaders)).toBe("198.51.100.1");
  });

  it("renvoie unknown sans en-tête ou avec un en-tête vide", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
    expect(getClientIp(new Headers({ "x-nf-client-connection-ip": "  " }))).toBe("unknown");
  });
});
