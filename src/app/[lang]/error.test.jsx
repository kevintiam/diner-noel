import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = { lang: "fr" };
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: navigation.lang }),
  useRouter: () => ({ refresh }),
}));

const { default: ErrorPage } = await import("./error");

afterEach(() => {
  navigation.lang = "fr";
  vi.clearAllMocks();
});

describe("page d'erreur", () => {
  it("affiche un message générique en français, sans détail technique", () => {
    render(<ErrorPage reset={() => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Une erreur est survenue/);
  });

  it("affiche le message en anglais sur /en", () => {
    navigation.lang = "en";

    render(<ErrorPage reset={() => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Something went wrong/);
  });

  it("relance l'affichage quand on clique sur Réessayer", () => {
    const reset = vi.fn();
    render(<ErrorPage reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
