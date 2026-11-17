import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { sendEmail } from "./send-email.js";

vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));
const sendMail = vi.fn();
const close = vi.fn();
const MESSAGE = {
  to: "fictif@example.test",
  subject: "Accusé",
  text: "Bonjour",
  html: "<p>Bonjour</p>",
};
const CONFIGURATION = {
  SITE_URL: "https://diner.example.test",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  SMTP_USER: "fictif",
  SMTP_PASSWORD: "secret-fictif",
  EMAIL_FROM: "expediteur@example.test",
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries(CONFIGURATION)) vi.stubEnv(key, value);
  const transport = { sendMail, close };
  vi.mocked(nodemailer.createTransport).mockReturnValue(
    /** @type {ReturnType<typeof nodemailer.createTransport>} */ (
      /** @type {unknown} */ (transport)
    ),
  );
  sendMail.mockResolvedValue({ accepted: [MESSAGE.to] });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("sendEmail", () => {
  it("envoie les deux corps avec STARTTLS obligatoire et des délais explicites", async () => {
    await sendEmail(MESSAGE);

    expect(nodemailer.createTransport).toHaveBeenCalledExactlyOnceWith({
      host: "smtp.example.test",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "fictif", pass: "secret-fictif" },
      connectionTimeout: 5000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      dnsTimeout: 3000,
      logger: false,
      debug: false,
      transactionLog: false,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    expect(sendMail).toHaveBeenCalledExactlyOnceWith({
      from: { name: "Dîner de Noël", address: CONFIGURATION.EMAIL_FROM },
      ...MESSAGE,
      signal: expect.any(AbortSignal),
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("garde le nom d'expéditeur donné dans EMAIL_FROM", async () => {
    vi.stubEnv("EMAIL_FROM", "Équipe fictive <expediteur@example.test>");

    await sendEmail(MESSAGE);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: "Équipe fictive", address: "expediteur@example.test" },
      }),
    );
  });

  it("utilise TLS immédiat sur le port 465", async () => {
    vi.stubEnv("SMTP_PORT", "465");
    await sendEmail(MESSAGE);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true, requireTLS: false }),
    );
  });

  it("propage un refus sans réessayer et ferme la connexion", async () => {
    sendMail.mockRejectedValue(new Error("refus fictif"));
    await expect(sendEmail(MESSAGE)).rejects.toThrow("refus fictif");
    expect(sendMail).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("borne la durée totale même si SMTP ne résout jamais", async () => {
    vi.useFakeTimers();
    sendMail.mockImplementation(() => new Promise(() => {}));
    const result = expect(sendEmail(MESSAGE)).rejects.toThrow("Délai d'envoi dépassé.");
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(sendMail.mock.calls[0][0].signal.aborted).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refuse une configuration absente avant toute connexion", async () => {
    vi.stubEnv("SMTP_PASSWORD", "");
    await expect(sendEmail(MESSAGE)).rejects.toThrow("SMTP_PASSWORD");
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("refuse un destinataire invalide avant toute connexion", async () => {
    await expect(sendEmail({ ...MESSAGE, to: "invalide" })).rejects.toThrow(
      "Message de courriel invalide.",
    );
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
