import { describe, expect, it } from "vitest";
import { AppError } from "./app-error.js";

describe("AppError", () => {
  it("conserve le statut, le code et la clé de traduction", () => {
    const error = new AppError(404, "EVENT_NOT_FOUND", "errors.internal");

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "AppError",
      statusCode: 404,
      code: "EVENT_NOT_FOUND",
      messageKey: "errors.internal",
    });
    expect(error.details).toBeUndefined();
  });

  it("conserve les détails structurés d'une erreur de validation", () => {
    const details = [{ field: "email", messageKey: "errors.internal" }];

    const error = new AppError(400, "VALIDATION_ERROR", "errors.internal", details);

    expect(error.details).toEqual(details);
  });
});
