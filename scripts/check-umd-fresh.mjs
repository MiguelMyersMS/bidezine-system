// Freshness gate for the committed browser UMD bundle (wave-mandated).
// A hand-copied bundle in a Node-less consumer can silently ship a stale component. This makes staleness
// LOUD: it fails if src/ changed since the committed dist-browser/ds.umd.js was built (source hash drift),
// so a stale bundle cannot merge. Wire into CI. Regenerate with `npm run build:umd`.
import fs from "node:fs";
import path from "node:path";
import { ROOT, sourceHash } from "./lib/umd-source-hash.mjs";

const manifestPath = path.join(ROOT, "dist-browser", "ds-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("[umd-fresh] FAIL — dist-browser/ds-manifest.json missing. Run `npm run build:umd`.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const current = sourceHash();

if (manifest.sourceHash !== current) {
  console.error(
    "[umd-fresh] FAIL — the committed browser bundle is STALE.\n" +
    `  manifest sourceHash: ${manifest.sourceHash}\n` +
    `  current  sourceHash: ${current}\n` +
    "  src/ changed since the bundle was built. Run `npm run build:umd` and commit dist-browser/.",
  );
  process.exit(1);
}
console.log(`[umd-fresh] PASS — dist-browser/ds.umd.js is current (version ${manifest.version}).`);
