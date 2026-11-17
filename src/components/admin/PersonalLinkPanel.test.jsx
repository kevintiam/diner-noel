import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PersonalLinkPanel from "./PersonalLinkPanel";

const LINK = `https://diner.example.test/fr/r/${"A".repeat(43)}`;

/** @param {(text: string) => Promise<void>} writeText */
function stubClipboard(writeText) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("PersonalLinkPanel", () => {
  it("affiche l'adresse et la copie exactement dans le presse-papiers", async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<PersonalLinkPanel url={LINK} />);

    expect(screen.getByRole("heading", { name: "Lien personnel" })).toBeInTheDocument();
    const address = screen.getByText(LINK);
    const button = screen.getByRole("button", { name: "Copier le lien" });
    // Le bouton annonce l'adresse qu'il copie.
    expect(button).toHaveAttribute("aria-describedby", address.id);

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith(LINK);
    expect(screen.getByRole("button", { name: "Lien copié" })).toBeInTheDocument();
  });

  it("garde l'adresse lisible quand le navigateur refuse la copie", async () => {
    stubClipboard(vi.fn(async () => Promise.reject(new Error("refusé"))));
    render(<PersonalLinkPanel url={LINK} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copier le lien" }));
    });

    expect(screen.getByText(LINK)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeInTheDocument();
  });

  it("explique l'absence de SITE_URL, sans bouton ni adresse", () => {
    render(<PersonalLinkPanel url={null} />);

    expect(screen.getByRole("heading", { name: "Lien personnel" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Lien indisponible : l’adresse publique du site (SITE_URL) n’est pas configurée.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/\/r\//)).not.toBeInTheDocument();
  });
});
