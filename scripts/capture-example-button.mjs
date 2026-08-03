// One-off capture for the button Example wave (build:button:r1).
// Renders atoms-button--example in all 4 surface×theme combos and writes:
//   docs/examples/button/views/{atom-light,atom-dark,darkAtom-light,darkAtom-dark}.png
//   docs/examples/button/views/capture-stamps.json {"<view>":{surface,theme,storyId,sha256}}
// Requires Storybook running on :6006.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]):/, "$1:"), "..");
const OUT = path.join(ROOT, "docs", "examples", "button", "views");
const STORY_ID = "atoms-button--example";
const PORT = 6006;

const VIEWS = [
  { view: "atom-light", surface: "atom", theme: "light" },
  { view: "atom-dark", surface: "atom", theme: "dark" },
  { view: "darkAtom-light", surface: "darkAtom", theme: "light" },
  { view: "darkAtom-dark", surface: "darkAtom", theme: "dark" },
];

fs.mkdirSync(OUT, { recursive: true });
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

const browser = await chromium.launch();
const stamps = {};
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  for (const { view, surface, theme } of VIEWS) {
    const url = `http://localhost:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story&globals=theme:${theme};atomSurface:${surface}`;
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp || !resp.ok()) throw new Error(`load failed for ${view}: ${resp && resp.status()}`);
    await page.waitForSelector("#storybook-root > *:not(style)", { timeout: 30000 });
    await page.waitForTimeout(700);
    // Hide the fixed SurfaceSwitch overlay so it is not captured.
    await page.evaluate(() => document.querySelectorAll('[aria-label="Surface family"]').forEach((el) => { el.style.display = "none"; }));
    // The example renders TWO stacked cards (the Figma-grounded card + the doc-grounded loading replica).
    // Frame BOTH by taking the tight bounding box that unions every elevated card (the elements carrying a
    // boxShadow) so the crop shows the Figma card AND the loading replica beneath it.
    const box = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("#storybook-root *")].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.boxShadow && cs.boxShadow !== "none" && el.getBoundingClientRect().height > 40;
      });
      if (!cards.length) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of cards) {
        const r = el.getBoundingClientRect();
        minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
      }
      const pad = 24;
      return {
        x: Math.max(0, Math.round(minX - pad)),
        y: Math.max(0, Math.round(minY - pad)),
        w: Math.round(maxX - minX + pad * 2),
        h: Math.round(maxY - minY + pad * 2),
      };
    });
    const pngPath = path.join(OUT, `${view}.png`);
    if (box && box.w > 0 && box.h > 0) {
      await page.screenshot({ path: pngPath, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
    } else {
      await page.screenshot({ path: pngPath });
    }
    const buf = fs.readFileSync(pngPath);
    const h = sha256(buf);
    stamps[view] = { surface, theme, storyId: STORY_ID, sha256: h };
    console.log(`  ${view.padEnd(16)} ${buf.length} bytes  sha256 ${h.slice(0, 12)}…  box ${box ? `${box.w}x${box.h}` : "full"}`);
  }
  fs.writeFileSync(path.join(OUT, "capture-stamps.json"), JSON.stringify(stamps, null, 2) + "\n");
  console.log("✓ 4 views + capture-stamps.json written to docs/examples/button/views/");
} finally {
  await browser.close();
}
