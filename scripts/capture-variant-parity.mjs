// capture-variant-parity — measure OUR rendered per-cell facts (background + icon fill) for a
// multi-variant atom's Variants story, and write them into docs/evidence/<slug>/states.json under
// `rendered`. The gate (audit-evidence.js → EV.VARIANT-PARITY) then compares these MEASURED facts to the
// expected contract (bg from figma.json, icon from the reviewed variant-contract.json) — no render at gate
// time. This is the render side of the AI-INTEGRITY-LEDGER Case 7 fix.
//
// Requires Storybook running on --port (default 6006). The Variants story must tag each cell button with
// data-parity-cell="<state>-<size>" (matching states.json stateKey).
//
// Usage: node scripts/capture-variant-parity.mjs <slug> [--port 6006] [--theme light] [--surface atom]

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
if (!slug) {
  console.error("usage: node scripts/capture-variant-parity.mjs <slug> [--port 6006] [--theme light] [--surface atom]");
  process.exit(2);
}
const port = opt("port", "6006");
const theme = opt("theme", "light");
const surface = opt("surface", "atom");

const statesPath = path.join("docs/evidence", slug, "states", "states.json");
if (!fs.existsSync(statesPath)) {
  console.error(`no states.json for ${slug} at ${statesPath} — run evidence:capture:states first`);
  process.exit(2);
}
const states = JSON.parse(fs.readFileSync(statesPath, "utf8"));
const storyId = states.variants?.storyId;
if (!storyId) {
  console.error(`states.json has no variants.storyId for ${slug} (single-state atom?) — nothing to measure`);
  process.exit(0);
}
const wantKeys = new Set(states.states.map((s) => s.stateKey));

// In-page measurement: bg via getComputedStyle; icon fill = opaque coverage of the leading Slot.Icon SVG
// (cloned, forced to solid fill, rasterized to a 100x100 canvas). Bg-independent + size-invariant, so a
// single threshold (~0.40) cleanly splits Fluent regular (~0.28) from filled (~0.52).
async function measureCells(page) {
  return page.evaluate(async () => {
    function iconFill(svg) {
      return new Promise((resolve) => {
        const clone = svg.cloneNode(true);
        clone.querySelectorAll("path").forEach((pt) => pt.setAttribute("fill", "#000"));
        clone.setAttribute("width", "100");
        clone.setAttribute("height", "100");
        const xml = new XMLSerializer().serializeToString(clone);
        const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 100; c.height = 100;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0, 100, 100);
          const d = ctx.getImageData(0, 0, 100, 100).data;
          let ink = 0;
          for (let i = 3; i < d.length; i += 4) if (d[i] > 10) ink++;
          resolve(ink / 10000);
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }
    const out = {};
    for (const cell of document.querySelectorAll("[data-parity-cell]")) {
      const key = cell.getAttribute("data-parity-cell");
      const btn = cell.matches("button") ? cell : cell.querySelector("button");
      if (!btn) continue;
      const bg = getComputedStyle(btn).backgroundColor;
      const svg = btn.querySelector("svg");
      const fill = svg ? await iconFill(svg) : null;
      out[key] = { bg, iconFill: fill == null ? null : +fill.toFixed(3) };
    }
    return out;
  });
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const url = `http://localhost:${port}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme};atomSurface:${surface}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-parity-cell]", { timeout: 15000 });
  await page.waitForTimeout(500);
  const measured = await measureCells(page);

  // keep only cells that exist as Figma variants (drop code-only extras like `loading`)
  const rendered = {};
  for (const [key, val] of Object.entries(measured)) {
    if (wantKeys.has(key)) rendered[key] = val;
  }
  const missing = [...wantKeys].filter((k) => !(k in rendered));

  states.rendered = rendered;
  states.renderedMeta = { storyId, theme, surface, measuredCells: Object.keys(rendered).length, missing };
  fs.writeFileSync(statesPath, JSON.stringify(states, null, 2) + "\n");
  console.log(`variant-parity: measured ${Object.keys(rendered).length}/${wantKeys.size} cells for ${slug}` + (missing.length ? ` (missing: ${missing.join(", ")})` : ""));
} finally {
  await browser.close();
}
