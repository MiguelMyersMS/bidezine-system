// Multi-state evidence capture — proves the FULL state matrix, not just one state.
//
// For a component whose spec declares per-state Figma variation nodes (state=default/
// active/disabled), this fetches each state's Figma render AND captures the Variants
// story (which shows all states), writing them into docs/evidence/<slug>/states/ with a
// states.json index. The checker then compares each state's Figma image to its rendered
// counterpart and checks the verdict's `states` row. See docs/evidence/GUIDE.md.
//
// Usage:
//   node scripts/evidence-capture-states.js <slug> [--variants-story <id>] [--port 6006] [--theme light]

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { ROOT } from "./lib/audit-core.js";
import { evidenceDirFor, readSpecStateNodes, validatePng, sha256, slugFor } from "./lib/evidence.js";

const args = process.argv.slice(2);
const slug = slugFor(args.find((a) => !a.startsWith("--")) ?? "");
const arg = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const port = arg("--port", "6006");
const theme = arg("--theme", "light");
const surface = arg("--surface", "atom"); // atom | darkAtom
let variantsStory = arg("--variants-story");

const fail = (msg) => { console.error(`✗ evidence:capture:states ${slug || "?"} — ${msg}`); process.exit(1); };
if (!slug) fail("usage: node scripts/evidence-capture-states.js <slug> [--variants-story <id>]");
const key = process.env.FIGMA_API_KEY;
if (!key) fail("FIGMA_API_KEY is not set.");

// Windows transient EBUSY/EPERM (AV/indexer holding a just-written file): retry the write a
// few times with a short backoff. Does NOT change what is captured — pure robustness.
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
async function writeFileRetry(p, data, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { fs.writeFileSync(p, data); return; }
    catch (e) {
      if (i === tries - 1 || !["EBUSY", "EPERM", "ENOENT", "UNKNOWN"].includes(e.code)) throw e;
      await sleepMs(120 * (i + 1));
    }
  }
}

let { fileKey, states } = readSpecStateNodes(slug);
if (!fileKey) fail("no Figma fileKey in the spec.");

// If the spec nodeMap has no state=* variation nodes, derive per-state variants from the
// already-captured figma.json when the exported node is a COMPONENT_SET (the common atom
// case: states are the set's child COMPONENT variants). Requires evidence:capture:figma first.
if (states.length === 0) {
  try {
    const fj = JSON.parse(fs.readFileSync(path.join(ROOT, evidenceDirFor(slug), "figma.json"), "utf-8"));
    const doc = fj.fetchedNode?.document;
    if (doc?.type === "COMPONENT_SET" && Array.isArray(doc.children)) {
      states = doc.children
        .filter((c) => c.type === "COMPONENT")
        .map((c) => {
          const state = (c.name.match(/state=([a-z0-9]+)/i)?.[1] || c.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const size = (c.name.match(/size=([a-z0-9]+)/i)?.[1] || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return { state, size, nodeId: c.id };
        });
      if (states.length) {
        const labels = states.map((s) => `${s.state}${s.size ? `(${s.size})` : ""}`);
        console.log(`  derived ${states.length} state(s) from the COMPONENT_SET in figma.json: ${labels.join(", ")}`);
      }
    }
  } catch { /* no figma.json yet — fall through */ }
}
if (states.length === 0) console.log("  note: no per-state variation nodes found — capturing the Variants render only.");

const dir = path.join(ROOT, evidenceDirFor(slug), "states");
fs.mkdirSync(dir, { recursive: true });
const figmaGet = async (url) => {
  const r = await fetch(url, { headers: { "X-Figma-Token": key } });
  if (!r.ok) throw new Error(`Figma API ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r;
};

try {
  const stateRecords = [];
  if (states.length) {
    const ids = states.map((s) => s.nodeId);
    // Node JSON (for dimensions) + rendered PNGs, both in one call each.
    const nodesJson = await (await figmaGet(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${ids.map(encodeURIComponent).join(",")}`)).json();
    const imgJson = await (await figmaGet(`https://api.figma.com/v1/images/${fileKey}?ids=${ids.map(encodeURIComponent).join(",")}&format=png&scale=2`)).json();
    for (const s of states) {
    const url = imgJson.images?.[s.nodeId];
    if (!url) fail(`Figma returned no image for state=${s.state} (${s.nodeId}).`);
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    // Lenient per-state: a valid PNG of any size is fine — some states (e.g. a reserved
    // "hidden" slot) are intentionally blank. Flag blank so the checker reads it correctly
    // instead of failing. NB: do NOT flag by the name "empty" — many components use "empty"
    // for a VISIBLE placeholder state (e.g. a Select trigger's "Select..." row), which must be
    // compared. Rely on the actual PNG size for genuinely-blank detection.
    const v = validatePng(buf, { minBytes: 0, minPx: 1 });
    if (!v.ok) { console.log(`  figma  state=${s.state.padEnd(9)} skipped (${v.reason})`); continue; }
    const blank = /^hidden$/i.test(s.state) || buf.length < 200;
    const stateKey = `${s.state}${s.size ? `-${s.size}` : ""}`;
    const file = `${stateKey}.figma.png`;
    await writeFileRetry(path.join(dir, file), buf);
    const bb = nodesJson.nodes?.[s.nodeId]?.document?.absoluteBoundingBox;
    const dims = bb ? { w: Math.round(bb.width), h: Math.round(bb.height) } : null;
    stateRecords.push({ state: s.state, size: s.size || null, stateKey, nodeId: s.nodeId, figmaPng: file, figmaSha: sha256(buf), figmaDims: dims, blank });
    console.log(`  figma  state=${stateKey.padEnd(18)} ✓ ${v.width}x${v.height}${blank ? " (blank/hidden)" : ""}  (${s.nodeId})`);
    }
  }

  // Capture the Variants story (shows all states together).
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
    if (!variantsStory) {
      // Find it from the running Storybook index by slug + "variants".
      const idx = await page.goto(`http://localhost:${port}/index.json`, { waitUntil: "networkidle" }).then((r) => r?.json()).catch(() => null);
      const entries = idx?.entries ? Object.values(idx.entries) : [];
      variantsStory = entries.find((e) => new RegExp(`${slug}--variants$`, "i").test(e.id))?.id;
      if (!variantsStory) {
        // Single-state component: either a lone COMPONENT (no per-state nodes derived) OR a
        // COMPONENT_SET with a SINGLE variant (states.length === 1, e.g. a `default`-only set).
        // Either way there is no multi-state matrix to lay out, and no Variants story exists —
        // the Example render (storybook.png) is the authoritative artifact. Record a marker and
        // succeed instead of hard-failing. (>= 2 states genuinely need a Variants render.)
        if (states.length <= 1) {
          fs.writeFileSync(path.join(dir, "states.json"), JSON.stringify({
            states: stateRecords, variants: null, singleState: true,
            note: "No multi-state matrix (single variant) and no Variants story — single-state component. Example capture is authoritative; the `states` verdict row is N/A.",
            capturedAt: new Date().toISOString(),
          }, null, 2) + "\n");
          console.log(`✓ evidence:capture:states ${slug} — single-state component (${states.length} variant); Example render is authoritative, states row is N/A.`);
          await browser.close();
          process.exit(0);
        }
        // We DID derive multiple per-state Figma nodes but cannot find a render to compare them to.
        fail(`derived ${states.length} state(s) from Figma but found no Variants story for "${slug}" — pass --variants-story <id>.`);
      }
    }
    const url = `http://localhost:${port}/iframe.html?id=${encodeURIComponent(variantsStory)}&viewMode=story&globals=theme:${theme};atomSurface:${surface}`;
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
    if (!resp || !resp.ok()) fail(`could not load Variants story ${variantsStory} on :${port}.`);
    await page.waitForSelector("#storybook-root > *:not(style)", { timeout: 30000 });
    await page.waitForTimeout(600);
    // Hide the preview's fixed SurfaceSwitch overlay (aria-label "Surface family") — it is
    // the FIRST child of #storybook-root, so without this the capture grabs the toggle, not
    // the variants. The surface is already applied via the atomSurface global.
    await page.evaluate(() => document.querySelectorAll('[aria-label="Surface family"]').forEach((el) => { el.style.display = "none"; }));
    // Capture the whole variants layout (all states), skipping the (now hidden) switch.
    const variantsPng = path.join(dir, "variants.storybook.png");
    await page.locator("#storybook-root > *:not(style):not([aria-label='Surface family'])").first().screenshot({ path: variantsPng });
    const vv = validatePng(fs.readFileSync(variantsPng));
    if (!vv.ok) fail(`variants render invalid: ${vv.reason}`);
    console.log(`  story  variants ✓ ${vv.width}x${vv.height}  (${variantsStory})`);

    // Per-cell RENDERED facts for the variant-parity gate (AI-INTEGRITY Case 7). For every
    // data-parity-cell button in the Variants story, measure OUR background (getComputedStyle) and
    // icon fill (leading Slot.Icon cloned, forced to solid fill, rasterized to 100x100 → opaque
    // coverage: regular ≈0.28 / filled ≈0.52). The gate (EV.VARIANT-PARITY) compares these to the
    // expected contract (bg from figma.json, icon from variant-contract.json). Empty for atoms whose
    // Variants story isn't instrumented with data-parity-cell — the gate only runs when a contract exists.
    const wantKeys = new Set(stateRecords.map((s) => s.stateKey));
    const measured = await page.evaluate(async () => {
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
        // data-parity-cell may sit ON the button (components that forward data-*) or on a WRAPPER
        // (components with a fixed prop surface) — resolve to the actual button either way.
        const btn = cell.matches("button") ? cell : cell.querySelector("button");
        if (!btn) continue;
        const bg = getComputedStyle(btn).backgroundColor;
        const svg = btn.querySelector("svg");
        out[key] = { bg, iconFill: svg ? await iconFill(svg) : null };
      }
      return out;
    });
    const rendered = {};
    for (const [k, v] of Object.entries(measured)) {
      if (wantKeys.has(k)) rendered[k] = { bg: v.bg, iconFill: v.iconFill == null ? null : +v.iconFill.toFixed(3) };
    }
    if (Object.keys(rendered).length) console.log(`  parity measured ${Object.keys(rendered).length} rendered cell(s)`);

    fs.writeFileSync(path.join(dir, "states.json"), JSON.stringify({
      states: stateRecords,
      variants: { storyId: variantsStory, png: "variants.storybook.png", sha: sha256(fs.readFileSync(variantsPng)) },
      rendered,
      capturedAt: new Date().toISOString(),
    }, null, 2) + "\n");
  } finally {
    await browser.close();
  }

  console.log(`✓ evidence:capture:states ${slug} — ${stateRecords.length} state(s) + Variants captured to ${evidenceDirFor(slug)}/states/`);
  console.log("  next: the checker compares each states/<state>.figma.png to that state in states/variants.storybook.png, then checks the `states` row.");
} catch (e) {
  fail(e.message);
}
