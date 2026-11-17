import { describe, expect, it } from "vitest";
import { validateEmailMessage } from "./email.schema.js";

const MESSAGE = {
  to: "fictif@example.test",
  subject: "Accusé",
  text: "Bonjour",
  html: "<p>Bonjour</p>",
};

describe("validateEmailMessage", () => {
  it("accepte un message texte et HTML pour un seul destinataire", () => {
    expect(validateEmailMessage(MESSAGE)).toEqual(MESSAGE);
  });

  it("accepte un objet de 200 caractères", () => {
    expect(validateEmailMessage({ ...MESSAGE, subject: "x".repeat(200) }).subject).toHaveLength(
      200,
    );
  });

  it.each([
    null,
    42,
    [],
    {},
    { ...MESSAGE, to: "a@example.test,b@example.test" },
    { ...MESSAGE, subject: "x\r\nBcc: secret@example.test" },
    { ...MESSAGE, subject: "x".repeat(201) },
    { ...MESSAGE, html: "" },
    { ...MESSAGE, text: null },
    { ...MESSAGE, to: 42 },
    { ...MESSAGE, subject: false },
    { ...MESSAGE, extra: "secret-fictif" },
  ])("refuse un message invalide sans exposer de contenu (%j)", (value) => {
    expect(() => validateEmailMessage(value)).toThrow("Message de courriel invalide.");
  });
});
