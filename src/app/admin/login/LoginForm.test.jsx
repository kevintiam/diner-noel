import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { loginOrganizerAction } from "@/server/actions/organizer.actions";
import LoginForm from "./LoginForm";

vi.mock("@/server/actions/organizer.actions", () => ({
  loginOrganizerAction: vi.fn(async () => null),
}));

/** Envoie le formulaire et attend la réponse de l'action simulée. */
async function submitForm() {
  await act(async () => {
    const form = screen.getByRole("button", { name: "Se connecter" }).closest("form");
    if (!form) throw new Error("Formulaire introuvable");
    fireEvent.submit(form);
  });
}

describe("LoginForm", () => {
  it("présente le courriel et le mot de passe avec leurs étiquettes", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Courriel")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche le refus du serveur et garde le courriel saisi", async () => {
    vi.mocked(loginOrganizerAction).mockResolvedValueOnce({
      error: { code: "INVALID_CREDENTIALS", message: "Courriel ou mot de passe invalide." },
      email: "orga@example.test",
    });
    render(<LoginForm />);

    await submitForm();

    expect(screen.getByRole("alert")).toHaveTextContent("Courriel ou mot de passe invalide.");
    expect(screen.getByLabelText("Courriel")).toHaveValue("orga@example.test");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });

  it("relie l'erreur d'un champ à ce champ", async () => {
    vi.mocked(loginOrganizerAction).mockResolvedValueOnce({
      error: {
        code: "VALIDATION_ERROR",
        message: "Certains champs sont à corriger.",
        details: [{ field: "password", message: "Indiquez votre mot de passe." }],
      },
      email: "",
    });
    render(<LoginForm />);

    await submitForm();

    const password = screen.getByLabelText("Mot de passe");
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAccessibleDescription("Indiquez votre mot de passe.");
  });
});
