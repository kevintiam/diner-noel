import { describe, expect, it } from "vitest";
import { validateLoginInput, validateOrganizerAccountInput } from "./organizer.schema.js";

const VALID_PASSWORD = "Sapin-Fictif-2026";

describe("validateLoginInput", () => {
  it("nettoie le courriel et garde le mot de passe tel quel", () => {
    const result = validateLoginInput({ email: "  Orga@Example.TEST ", password: " secret " });

    expect(result).toEqual({
      success: true,
      data: { email: "orga@example.test", password: " secret " },
    });
  });

  it("refuse un mot de passe vide", () => {
    const result = validateLoginInput({ email: "orga@example.test", password: "" });

    expect(result).toEqual({
      success: false,
      fieldErrors: [{ field: "password", messageKey: "validation.passwordRequired" }],
    });
  });

  it("refuse un mot de passe démesuré", () => {
    const result = validateLoginInput({ email: "orga@example.test", password: "a".repeat(257) });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: [{ field: "password", messageKey: "validation.passwordTooLong" }],
    });
  });

  it("refuse un courriel sans @", () => {
    const result = validateLoginInput({ email: "orga.example.test", password: "secret" });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: [{ field: "email", messageKey: "validation.emailInvalid" }],
    });
  });

  it("refuse les entrées de mauvais type", () => {
    expect(validateLoginInput({ email: null, password: 1234 })).toEqual({
      success: false,
      fieldErrors: [
        { field: "email", messageKey: "validation.emailInvalid" },
        { field: "password", messageKey: "validation.passwordRequired" },
      ],
    });
    expect(validateLoginInput(null)).toMatchObject({ success: false });
  });
});

describe("validateOrganizerAccountInput", () => {
  it("accepte un compte complet", () => {
    const result = validateOrganizerAccountInput({
      email: "Orga@Example.test",
      name: "  Organisateur fictif ",
      password: VALID_PASSWORD,
    });

    expect(result).toEqual({
      success: true,
      data: { email: "orga@example.test", name: "Organisateur fictif", password: VALID_PASSWORD },
    });
  });

  it("accepte un mot de passe de 12 caractères exactement", () => {
    const result = validateOrganizerAccountInput({
      email: "orga@example.test",
      name: "Orga",
      password: "a".repeat(12),
    });

    expect(result.success).toBe(true);
  });

  it("refuse un mot de passe de 11 caractères", () => {
    const result = validateOrganizerAccountInput({
      email: "orga@example.test",
      name: "Orga",
      password: "a".repeat(11),
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: [{ field: "password", messageKey: "validation.passwordTooShort" }],
    });
  });

  it("refuse un mot de passe de plus de 72 octets", () => {
    // 37 « é » font 74 octets en UTF-8 : bcrypt en ignorerait la fin.
    const result = validateOrganizerAccountInput({
      email: "orga@example.test",
      name: "Orga",
      password: "é".repeat(37),
    });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: [{ field: "password", messageKey: "validation.passwordTooLong" }],
    });
  });

  it("refuse un nom vide ou trop long", () => {
    const base = { email: "orga@example.test", password: VALID_PASSWORD };

    expect(validateOrganizerAccountInput({ ...base, name: "   " })).toMatchObject({
      fieldErrors: [{ field: "name", messageKey: "validation.lastNameRequired" }],
    });
    expect(validateOrganizerAccountInput({ ...base, name: "a".repeat(61) })).toMatchObject({
      fieldErrors: [{ field: "name", messageKey: "validation.lastNameTooLong" }],
    });
  });

  it("refuse les entrées de mauvais type", () => {
    const result = validateOrganizerAccountInput({ email: 42, name: null, password: undefined });

    expect(result).toEqual({
      success: false,
      fieldErrors: [
        { field: "email", messageKey: "validation.emailInvalid" },
        { field: "name", messageKey: "validation.lastNameRequired" },
        { field: "password", messageKey: "validation.passwordTooShort" },
      ],
    });
  });
});
