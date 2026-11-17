import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import ProofList from "./ProofList";

// jsdom n'a pas encore la fenêtre modale native : on simule l'ouverture et la fermeture.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const PROOFS = [
  { id: "p2", byteSize: 250_000, createdAt: new Date("2026-11-17T15:05:00.000Z") },
  { id: "p1", byteSize: 2048, createdAt: new Date("2026-11-16T15:00:00.000Z") },
];

describe("ProofList avec captures", () => {
  it("montre une vignette par capture, lue par la route protégée", () => {
    const { container } = render(<ProofList proofs={PROOFS} />);

    const buttons = screen.getAllByRole("button", { name: /Voir en grand/ });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName(/Capture 2.*reçue le 17 nov\. 2026.*245 Ko/);
    const thumbnails = container.querySelectorAll("img");
    expect(thumbnails[0]).toHaveAttribute("src", "/api/admin/proofs/p2");
    expect(thumbnails[1]).toHaveAttribute("src", "/api/admin/proofs/p1");
  });

  it("ouvre la capture choisie en grand, puis la referme", () => {
    render(<ProofList proofs={PROOFS} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Voir en grand/ })[1]);

    const viewer = screen.getByRole("dialog");
    expect(within(viewer).getByRole("heading")).toHaveTextContent(/Capture 1/);
    expect(
      within(viewer).getByRole("img", { name: /Capture 1 : capture du virement/ }),
    ).toHaveAttribute("src", "/api/admin/proofs/p1");
    expect(within(viewer).getByRole("link", { name: /nouvel onglet/ })).toHaveAttribute(
      "href",
      "/api/admin/proofs/p1",
    );

    fireEvent.click(within(viewer).getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
