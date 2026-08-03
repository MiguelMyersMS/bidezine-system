// Story capture — the rendered half of mechanism A.
//
// Renders a Storybook story with Playwright and writes storybook.png PLUS a
// capture-stamp.json that binds the screenshot to the sha256 of the source files it
// was rendered from. evidence-record.js then refuses to seal unless the stamp matches
// the code being sealed — so "edit then re-record" can't reuse a stale screenshot
// (the red-team's "re-record re-seals against stale artifacts" hole). See README.
//
// Usage:
//   node scripts/evidence-capture-story.js <slug> --story <storyId> [--theme light|dark] [--port 6006] [--wait <selector>]
//
// Requires a running Storybook (defaults to the dev server on :6006).

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { ROOT } from "./lib/audit-core.js";
import { evidenceDirFor, renderSourcesForSlug, workingContent, validatePng, hashSource, hashArtifact, loadManifest, slugFor } from "./lib/evidence.js";

const args = process.argv.slice(2);
const slug = slugFor(args.find((a) => !a.startsWith("--")) ?? "");
const arg = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const storyId = arg("--story");
const theme = arg("--theme", "light");
const surface = arg("--surface", "atom"); // atom | darkAtom — dark-surface components render on darkAtom
const port = arg("--port", "6006");
const waitSel = arg("--wait", "#storybook-root > *:not(style)");
// --target <selector>: crop to THIS element instead of descending from #storybook-root.
// Required for PORTAL/overlay components (menus, dropdowns, dialogs) that render to
// document.body outside #storybook-root — the default descent would clip to the empty
// trigger. Additive: when unset, behaviour is unchanged.
const target = arg("--target", "");

const fail = (msg) => {
  console.error(`✗ evidence:capture:story ${slug || "?"} — ${msg}`);
  process.exit(1);
};

if (!slug) fail("usage: node scripts/evidence-capture-story.js <slug> --story <storyId> [--theme] [--port] [--wait]");
if (!storyId) fail("--story <storyId> is required (e.g. gallery-badge--default).");

const dir = path.join(ROOT, evidenceDirFor(slug));
fs.mkdirSync(dir, { recursive: true });
const url = `http://localhost:${port}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story&globals=theme:${theme};atomSurface:${surface}`;

const browser = await chromium.launch().catch((e) => fail(`could not launch chromium: ${e.message}`));
try {
  // 2x device scale matches Figma's scale=2 export, so the capture is dimensionally
  // comparable to figma.png. A roomy viewport avoids clipping before we crop.
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
  if (!resp || !resp.ok()) fail(`could not load story at ${url} (is Storybook running on :${port}? status ${resp?.status()}).`);
  await page.waitForSelector(waitSel, { timeout: 30000 });
  await page.waitForTimeout(600);
  // Hide the preview's fixed SurfaceSwitch overlay so it is never captured or overlaid
  // (the surface is already applied via the atomSurface global, not this control).
  await page.evaluate(() => document.querySelectorAll('[aria-label="Surface family"]').forEach((el) => { el.style.display = "none"; }));

  // Find the COMPONENT's box by descending past full-bleed story decorators (dark-atom
  // wallpapers, padding wrappers) — the first element notably smaller than the viewport
  // is the component. This is what makes the crop tight and the dimensions comparable.
  const box = await page.evaluate((targetSel) => {
    const va = window.innerWidth * window.innerHeight;
    // Portal/overlay path: crop directly to the targeted element (e.g. the menu
    // that renders to document.body), NOT the #storybook-root descent.
    if (targetSel) {
      const t = document.querySelector(targetSel);
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }
    let el = document.querySelector("#storybook-root");
    if (!el) return null;
    for (let i = 0; i < 8; i++) {
      const r = el.getBoundingClientRect();
      if (r.width * r.height < va * 0.85) break; // smaller than the canvas -> the component
      const kids = [...el.children].filter((c) => c.nodeType === 1 && getComputedStyle(c).display !== "none");
      if (!kids.length) break;
      kids.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
      el = kids[0];
    }
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }, target);

  const pngPath = path.join(dir, "storybook.png");
  // Clip to the component box so storybook.png frames the component the way figma.png
  // frames the node — a clean, comparable pair. Fall back progressively if needed.
  try {
    if (box && box.w > 0 && box.h > 0) {
      await page.screenshot({ path: pngPath, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
    } else {
      await page.locator(waitSel).first().screenshot({ path: pngPath });
    }
  } catch {
    await page.screenshot({ path: pngPath });
  }
  const v = validatePng(fs.readFileSync(pngPath));
  if (!v.ok) fail(`captured PNG failed validation: ${v.reason} (story may not have rendered).`);

  // Pull the Figma node's own dimensions from the captured dump so the checker can
  // compare numbers, not eyeball mismatched screenshot framings.
  let figmaDims = null;
  try {
    const bb = JSON.parse(fs.readFileSync(path.join(dir, "figma.json"), "utf-8")).fetchedNode?.document?.absoluteBoundingBox;
    if (bb) figmaDims = { w: Math.round(bb.width), h: Math.round(bb.height) };
  } catch { /* figma.json not captured yet */ }

  // The stamp: bind storybook.png to the exact source it was rendered from, plus the
  // measured component box vs the Figma node box (both in CSS px) for the dimensions check.
  const sources = {};
  for (const src of renderSourcesForSlug(slug)) sources[src] = hashSource(workingContent(src));
  const stamp = {
    storyId,
    theme,
    surface,
    capturedAt: new Date().toISOString(),
    rendered: box ? { w: box.w, h: box.h } : null,
    figma: figmaDims,
    sources,
  };
  const stampBytes = JSON.stringify(stamp, null, 2) + "\n";
  fs.writeFileSync(path.join(dir, "capture-stamp.json"), stampBytes);

  // R1 (LESSONS L32) — catch a PARTIAL re-seal at the MOMENT it is created. Writing a fresh
  // stamp over an EXISTING manifest whose recorded `sources` no longer equal this stamp's, OR
  // whose recorded capture-stamp.json hash no longer equals this fresh stamp, means the bundle is
  // now internally inconsistent: a fresh stamp/PNG bound to a STALE manifest+verdict+signature.
  // That is the L22/L23/L32 dead-end — invisible today until adjudication ~250k tokens later.
  // Detect-only + LOUD, at the source: it changes NO value and blocks NOTHING (exit stays 0).
  // Reuses the record-time hashArtifact helper so record-time and this check agree.
  try {
    const man = loadManifest(slug);
    if (man) {
      const sourcesEqual = (a, b) => {
        const ak = Object.keys(a ?? {}).sort();
        const bk = Object.keys(b ?? {}).sort();
        return ak.length === bk.length && ak.every((k, i) => k === bk[i] && a[k] === b[k]);
      };
      const freshStampHash = hashArtifact("capture-stamp.json", Buffer.from(stampBytes));
      const recordedStampHash = man.artifacts?.["capture-stamp.json"];
      if (!sourcesEqual(man.sources, sources) || recordedStampHash !== freshStampHash) {
        console.warn("");
        console.warn(`⚠ PARTIAL RE-SEAL: ${evidenceDirFor(slug)}/manifest.json, verdict.md and signature.json are now`);
        console.warn("  STALE vs this fresh capture. You MUST re-run evidence:record + evidence:sign before the gate,");
        console.warn(`  or \`git checkout -- ${evidenceDirFor(slug)}/\` to restore the honest stale bundle.`);
        console.warn("  Leaving a fresh stamp over a stale manifest is the L22/L23/L32 dead-end.");
        console.warn("");
        try {
          fs.writeFileSync(
            path.join(dir, ".reseal-needed"),
            `re-run: node scripts/evidence-record.js ${slug} && node scripts/evidence-sign.js ${slug}\n` +
              `written by evidence:capture:story at ${stamp.capturedAt} (LESSONS L32)\n`,
          );
        } catch { /* marker is best-effort; never let it break a capture */ }
      }
    }
  } catch { /* advisory guard only — never let it break a capture */ }

  if (box && figmaDims) console.log(`  dimensions         rendered ${box.w}x${box.h} vs Figma ${figmaDims.w}x${figmaDims.h}`);

  console.log(`  storybook.png      ✓ ${v.width}x${v.height}, story ${storyId} [${theme}]`);
  console.log(`  capture-stamp.json ✓ bound to ${Object.keys(sources).length} source file(s)`);
  console.log(`✓ evidence:capture:story ${slug} — story half captured to ${evidenceDirFor(slug)}/`);
} finally {
  await browser.close();
}
