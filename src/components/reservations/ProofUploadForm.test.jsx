import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import ProofUploadForm from "./ProofUploadForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const fetchMock = vi.fn();

function show(lang = "fr") {
  render(<ProofUploadForm token={"A".repeat(43)} lang={lang} dictionary={getDictionary(lang)} />);
}
function choose(file = new File(["image"], "capture.png", { type: "image/png" })) {
  fireEvent.change(screen.getByLabelText("Choisir une capture ou la déposer ici"), {
    target: { files: [file] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("ProofUploadForm", () => {
  it("affiche le nom et le poids après un dépôt de fichier", () => {
    show();
    fireEvent.drop(screen.getByLabelText("Choisir une capture ou la déposer ici").parentElement, {
      dataTransfer: {
        files: [new File([new Uint8Array(1258291)], "capture.png", { type: "image/png" })],
      },
    });
    expect(screen.getByText("capture.png · 1,2 Mo")).toBeVisible();
  });
  it("vérifie fichier et confirmation avant toute requête", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    expect(screen.getByText("Choisissez une capture d’écran non vide.")).toBeVisible();
    expect(screen.getByText("Confirmez avoir effectué le virement.")).toBeVisible();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    [
      new File([new Uint8Array(5 * 1024 * 1024)], "grosse.png", { type: "image/png" }),
      "La capture dépasse 4 Mo. Choisissez un fichier plus petit.",
    ],
    [
      new File(["svg"], "capture.svg", { type: "image/svg+xml" }),
      "Choisissez une image JPG, PNG ou WEBP valide.",
    ],
  ])("refuse un fichier invalide avant envoi", (file, message) => {
    show();
    choose(file);
    expect(screen.getByText(message)).toBeVisible();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("envoie le multipart puis actualise la page", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { status: "TO_VERIFY" } }),
    });
    show();
    choose();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/reservations/${"A".repeat(43)}/proofs`);
    expect(options.method).toBe("POST");
    expect(options.body.get("proof").name).toBe("capture.png");
    expect(options.body.get("confirmTransfer")).toBe("on");
    expect(options.body.get("lang")).toBe("fr");
  });
  it("annonce une erreur renvoyée par le serveur et garde la sélection", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 415,
      json: async () => ({ error: { message: "Image invalide" } }),
    });
    show();
    choose();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Image invalide"));
    expect(screen.getByText(/capture.png/)).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("permet de reporter sans aucune requête", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Je l’enverrai plus tard" }));
    expect(screen.getByRole("status")).toHaveTextContent("Revenez avec ce lien");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("affiche aussi le formulaire en anglais", () => {
    show("en");
    expect(screen.getByRole("button", { name: "Send my payment proof" })).toBeVisible();
  });
});
