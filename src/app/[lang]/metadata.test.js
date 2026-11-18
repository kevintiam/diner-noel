import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import { generateMetadata } from "./layout.jsx";

vi.mock("../fonts", () => ({ textFont: {}, titleFont: {} }));
afterEach(() => vi.unstubAllEnvs());

describe("aperçu public traduit", () => {
  it.each(["fr", "en"])("partage uniquement des liens publics en %s", async (lang) => {
    vi.stubEnv("SITE_URL", "https://diner.example.test");
    const metadata = await generateMetadata({ params: Promise.resolve({ lang }) });
    const { meta } = getDictionary(lang);
    expect(metadata.title).toBe(meta.title);
    expect(metadata.description).toBe(meta.description);
    expect(metadata.openGraph).toEqual({
      type: "website",
      title: meta.title,
      description: meta.description,
      url: `https://diner.example.test/${lang}`,
      locale: lang === "en" ? "en_CA" : "fr_CA",
      images: [{ url: "https://diner.example.test/images/christmas-banquet.jpg", alt: meta.title }],
    });
    expect(JSON.stringify(metadata)).not.toContain("/r/");
  });
  it("refuse une origine invalide sans en afficher la valeur", async () => {
    vi.stubEnv("SITE_URL", "https://secret:confidentiel@example.test/r/secret");
    await expect(generateMetadata({ params: Promise.resolve({ lang: "fr" }) })).rejects.toThrow(
      "Variable SITE_URL manquante ou invalide",
    );
  });
});
