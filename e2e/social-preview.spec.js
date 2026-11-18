import { expect, test } from "@playwright/test";
import { getTestDictionary } from "./helpers/reservation-flow.js";

for (const lang of ["fr", "en"]) {
  test(`sert un aperçu public aux robots de partage en ${lang}`, async ({ request }) => {
    const response = await request.get(`/${lang}`, {
      headers: { "user-agent": "facebookexternalhit/1.1" },
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const head = html.slice(0, html.indexOf("</head>"));
    const { meta } = getTestDictionary(lang);
    expect(head).toContain(`property="og:title" content="${meta.title}"`);
    expect(head).toContain(`property="og:locale" content="${lang === "en" ? "en_CA" : "fr_CA"}"`);
    expect(head).toContain(`property="og:url" content="http://localhost:3100/${lang}"`);
    expect(head).toContain(
      'property="og:image" content="http://localhost:3100/images/christmas-banquet.jpg"',
    );
    expect(head).not.toContain("/r/");
    const image = await request.get("/images/christmas-banquet.jpg");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
  });
}
