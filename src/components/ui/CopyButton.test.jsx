import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyButton from "./CopyButton";

/** @param {(text: string) => Promise<void>} writeText */
function stubClipboard(writeText) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CopyButton", () => {
  it("copie la valeur, confirme, puis revient au libellé", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<CopyButton value="NOEL-4821" label="Copier" copiedLabel="Copié" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copier" }));
    });

    expect(writeText).toHaveBeenCalledWith("NOEL-4821");
    expect(screen.getByRole("button", { name: "Copié" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copier" })).toBeInTheDocument();
  });

  it("n'affiche pas « Copié » quand le navigateur refuse", async () => {
    stubClipboard(vi.fn(async () => Promise.reject(new Error("refusé"))));
    render(<CopyButton value="NOEL-4821" label="Copier" copiedLabel="Copié" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copier" }));
    });

    expect(screen.getByRole("button", { name: "Copier" })).toBeInTheDocument();
  });
});
