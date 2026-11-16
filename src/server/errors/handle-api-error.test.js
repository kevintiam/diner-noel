import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { AppError } from "./app-error.js";
import { handleApiError } from "./handle-api-error.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleApiError", () => {
  it("transforme une AppError en réponse traduite dans la langue demandée", () => {
    // Préparer
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    const error = new AppError(500, "EVENT_NOT_CONFIGURED", "errors.internal");

    // Agir
    const { status, body } = handleApiError(error, { lang: "en" });

    // Vérifier
    expect(status).toBe(500);
    expect(body.error.code).toBe("EVENT_NOT_CONFIGURED");
    expect(body.error.message).toMatch(/^Something went wrong/);
    expect(errorSpy).toHaveBeenCalledWith("application_error", {
      errorCode: "EVENT_NOT_CONFIGURED",
    });
  });

  it("traduit le détail de chaque champ pour une erreur de validation", () => {
    const error = new AppError(400, "VALIDATION_ERROR", "errors.internal", [
      { field: "email", messageKey: "errors.retry" },
    ]);

    const { body } = handleApiError(error, { lang: "fr" });

    expect(body.error.details).toEqual([{ field: "email", message: "Réessayer" }]);
  });

  it("cache une erreur imprévue derrière un message générique et la journalise", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    const { status, body } = handleApiError(new Error("SELECT secret FROM table"), {
      lang: "fr",
      context: { route: "/fr", method: "GET" },
    });

    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).not.toContain("SELECT");
    expect(errorSpy).toHaveBeenCalledWith(
      "unexpected_error",
      expect.objectContaining({ route: "/fr", method: "GET" }),
    );
  });

  it("accepte une valeur lancée qui n'est pas une erreur", () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});

    const { status } = handleApiError("texte lancé", { lang: "fr" });

    expect(status).toBe(500);
  });
});
