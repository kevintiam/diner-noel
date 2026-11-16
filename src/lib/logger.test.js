import { afterEach, describe, expect, it, vi } from "vitest";
import { describeError, logger } from "./logger.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("écrit une ligne JSON avec le niveau, le message et le contexte", () => {
    // Préparer
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Agir
    logger.info("seed_completed", { route: "/fr" });

    // Vérifier
    const line = JSON.parse(infoSpy.mock.calls[0][0]);
    expect(line).toMatchObject({ level: "info", message: "seed_completed", route: "/fr" });
    expect(line.time).toEqual(expect.any(String));
  });

  it("envoie les erreurs sur la sortie d'erreur", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("event_overview_failed");

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("describeError", () => {
  it("garde seulement le nom, sans message ni pile contenant des secrets", () => {
    const fields = describeError(new TypeError("postgresql://user:secret@example.test/db"));

    expect(fields).toEqual({ errorName: "TypeError" });
  });

  it("accepte une valeur qui n'est pas une erreur", () => {
    expect(describeError("texte sensible")).toEqual({ errorName: "UnknownError" });
  });
});
