// Vérifie les maquettes hors ligne et produit leurs aperçus sur ordinateur et téléphone.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const outputDirectory = dirname(fileURLToPath(import.meta.url));
const requestedDirections = process.argv.slice(2);
const directions = requestedDirections.length > 0
  ? requestedDirections
  : ["grande-tablee", "veillee", "invitation"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const direction of directions) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      const networkRequests = [];
      page.on("request", (request) => {
        if (/^https?:/.test(request.url())) networkRequests.push(request.url());
      });
      await page.goto(pathToFileURL(join(outputDirectory, `direction-${direction}.html`)).href);
      await page.screenshot({
        path: join(outputDirectory, `${direction}-${viewport.name}.png`),
        fullPage: true,
      });
      await page.screenshot({
        path: join(outputDirectory, `${direction}-${viewport.name}-first-screen.png`),
      });
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        content: document.documentElement.scrollWidth,
        headings: document.querySelectorAll("h1").length,
        title: document.title,
        controls: Array.from(document.querySelectorAll("a, button"))
          .filter((element) => /réserver|^(FR|EN)$/i.test(element.textContent.trim()))
          .map((element) => ({
            label: element.textContent.trim(),
            height: element.getBoundingClientRect().height,
            top: element.getBoundingClientRect().top,
            bottom: element.getBoundingClientRect().bottom,
          })),
      }));
      results.push({ direction, viewport: viewport.name, ...dimensions, networkRequests });
      await page.close();
    }
  }
  if (existsSync(join(outputDirectory, "directions.html"))) {
    const gallery = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await gallery.goto(pathToFileURL(join(outputDirectory, "directions.html")).href);
    await gallery.screenshot({ path: join(outputDirectory, "directions-overview.png"), fullPage: true });
    await gallery.close();
  }
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}
