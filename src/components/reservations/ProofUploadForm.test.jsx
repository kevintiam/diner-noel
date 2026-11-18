import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import { PROOF_REQUEST_TIMEOUT_MS } from "@/config/upload-limits";
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
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ProofUploadForm", () => {
  it.each(["fr", "en"])("débloque un envoi suspendu en %s et garde la capture", async (lang) => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const dictionary = getDictionary(lang);
    show(lang);
    fireEvent.change(screen.getByLabelText(dictionary.proof.choose), {
      target: { files: [new File(["image"], "capture.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: dictionary.proof.submit }));
    expect(screen.getByRole("button", { name: dictionary.proof.submitting })).toBeDisabled();
    const signal = fetchMock.mock.calls[0][1].signal;
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "accept-language": lang });
    await act(() => vi.advanceTimersByTimeAsync(PROOF_REQUEST_TIMEOUT_MS));
    expect(signal.aborted).toBe(true);
    expect(screen.getByRole("alert")).toHaveTextContent(dictionary.errors.uploadUncertain);
    expect(screen.getByRole("button", { name: dictionary.proof.submit })).toBeEnabled();
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText(/capture.png/)).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("borne aussi l’attente du corps JSON de la réponse", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: true, json: () => new Promise(() => {}) });
    show();
    choose();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    await act(() => vi.advanceTimersByTimeAsync(PROOF_REQUEST_TIMEOUT_MS));
    expect(screen.getByRole("alert")).toHaveTextContent(getDictionary("fr").errors.uploadUncertain);
    expect(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" })).toBeEnabled();
  });
  it("invite à vérifier le statut après une coupure réseau", async () => {
    fetchMock.mockRejectedValue(new TypeError("connexion interrompue"));
    show();
    choose();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        getDictionary("fr").errors.uploadUncertain,
      ),
    );
    expect(screen.getByText(/capture.png/)).toBeVisible();
  });
  it("affiche le nom et le poids après un dépôt de fichier", () => {
    show();
    fireEvent.drop(screen.getByLabelText("Choisir une capture ou la déposer ici").parentElement, {
      dataTransfer: {
        files: [new File([new Uint8Array(1258291)], "capture.png", { type: "image/png" })],
      },
    });
    expect(screen.getByText("capture.png · 1,2 Mo")).toBeVisible();
    expect(
      screen.getByLabelText("Choisir une capture ou la déposer ici"),
    ).toHaveAccessibleDescription("JPG, PNG ou WEBP · 4 Mo maximum capture.png · 1,2 Mo");
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
  it.each(["", "application/octet-stream"])(
    "laisse le serveur vérifier un type indéterminé (%s)",
    async (type) => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { status: "TO_VERIFY" } }),
      });
      show();
      choose(new File(["image"], "capture.png", { type }));
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: "Envoyer ma preuve de paiement" }));
      await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
      expect(fetchMock.mock.calls[0][1].body.get("proof").type).toBe(type);
    },
  );
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
