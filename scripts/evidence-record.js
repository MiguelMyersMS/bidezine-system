// Evidence recorder — the ONLY honest way to stamp a bundle "verified".
//
// Refuses to write a passing manifest unless the durable artifacts physically
// exist, are non-empty, and an independent verdict.md says `VERDICT: pass`. It
// binds the CURRENT content hash of every source file to the bundle, so the gate
// (scripts/audit-evidence.js) can detect any later edit as stale.
//
// Usage:
//   node scripts/evidence-record.js <slug> [--node <figmaNodeId>] [--component <Name>]
//
// It does NOT capture artifacts for you — capturing Figma data, exporting the PNG,
// rendering the story, and writing the independent verdict are the verification
// work itself. This step only seals what was actually produced.

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";
import {
  REQUIRED_ARTIFACTS,
  evidenceDirFor,
  renderSourcesForSlug,
  workingContent,
  sha256,
  hashSource,
  hashArtifact,
  computeVerdict,
  slugFor,
} from "./lib/evidence.js";

const args = process.argv.slice(2);
const slug = slugFor(args.find((a) => !a.startsWith("--")) ?? "");
if (!slug) {
  console.error("usage: node scripts/evidence-record.js <slug> [--node <id>] [--component <Name>]");
  process.exit(2);
}
const node = args.includes("--node") ? args[args.indexOf("--node") + 1] : undefined;
const component = args.includes("--component") ? args[args.indexOf("--component") + 1] : undefined;

const dir = evidenceDirFor(slug);
const absDir = path.join(ROOT, dir);
const fail = (msg) => {
  console.error(`✗ evidence:record ${slug} — ${msg}`);
  process.exit(1);
};

if (!fs.existsSync(absDir)) fail(`no bundle directory at ${dir}/ — create it and add the artifacts first.`);

// 1. Every required artifact present and non-empty.
const artifactHashes = {};
for (const art of REQUIRED_ARTIFACTS) {
  const full = path.join(absDir, art);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    fail(`missing or empty artifact: ${dir}/${art}. Capture it before recording.`);
  }
  artifactHashes[art] = hashArtifact(art, fs.readFileSync(full));
}

// 1b. Variant-parity artifacts (multi-variant atoms only): if a variant-contract.json exists, seal it AND
// the measured states/states.json into the manifest so the per-cell rendered facts (and the reviewed
// contract) cannot be forged/edited after recording. bundleDigest covers manifest.artifacts, so the
// independent signature binds them too. Atoms without a contract are unaffected. (AI-INTEGRITY Case 7.)
if (fs.existsSync(path.join(absDir, "variant-contract.json"))) {
  for (const art of ["variant-contract.json", "states/states.json"]) {
    const full = path.join(absDir, art);
    if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
      fail(`variant-contract.json present but missing ${dir}/${art} — run evidence:capture:states + capture:variant-parity before recording.`);
    }
    artifactHashes[art] = hashArtifact(art, fs.readFileSync(full));
  }
}

// 2. Verdict must be a COMPLETE checklist (pass is computed, not typed).
const v = computeVerdict(fs.readFileSync(path.join(absDir, "verdict.md"), "utf-8"));
if (!v.pass) {
  const why = [
    v.missing.length ? `missing ids: ${v.missing.join(", ")}` : "",
    v.unchecked.length ? `still unchecked: ${v.unchecked.join(", ")}` : "",
    v.forbidden.length ? `unresolved markers (${v.forbidden.length}): ${v.forbidden[0]}` : "",
  ].filter(Boolean).join("; ");
  fail(`verdict checklist incomplete (${why}). Every required id must be a checked \`- [x] <id>\` line with no TODO/deferred/unverified markers.`);
}

// 2b. Node binding — figma.json must be a real dump bound to a node, and --node
// (if given) must match it. Prevents sealing a manifest against a wrong-node dump.
let boundNode = node;
try {
  const dump = JSON.parse(fs.readFileSync(path.join(absDir, "figma.json"), "utf-8"));
  if (!dump.node || !dump.fetchedNode?.document) {
    fail("figma.json is not a captured dump (missing node/fetchedNode) — run evidence:capture:figma first.");
  }
  if (node && node !== dump.node) fail(`--node ${node} does not match figma.json node ${dump.node}.`);
  boundNode = dump.node;
} catch (e) {
  fail(`figma.json could not be parsed (${e.message}). Run evidence:capture:figma first.`);
}

// 3. Bind the current content of every source file this bundle covers.
const sources = renderSourcesForSlug(slug);
if (sources.length === 0) fail(`found no source files for slug "${slug}" (expected src/gallery/*).`);
const sourceHashes = {};
for (const src of sources) sourceHashes[src] = hashSource(workingContent(src));

// 3b. The story screenshot must have been rendered from THIS code. The capture stamp
// binds storybook.png to the source hashes at capture time; refuse if they have moved
// (defeats "edit then re-record" reusing a stale screenshot).
let stamp;
try {
  stamp = JSON.parse(fs.readFileSync(path.join(absDir, "capture-stamp.json"), "utf-8"));
} catch (e) {
  fail(`capture-stamp.json missing/unreadable (${e.message}) — run evidence:capture:story first.`);
}
const stampKeys = Object.keys(stamp.sources ?? {}).sort();
const liveKeys = Object.keys(sourceHashes).sort();
if (JSON.stringify(stampKeys) !== JSON.stringify(liveKeys)) {
  fail(`capture-stamp covers [${stampKeys.join(", ")}] but the component's sources are [${liveKeys.join(", ")}] — re-capture the story.`);
}
for (const src of liveKeys) {
  if (stamp.sources[src] !== sourceHashes[src]) {
    fail(`${src} changed since the story was captured — the storybook.png is stale. Re-run evidence:capture:story ${slug}.`);
  }
}

const prev = (() => {
  const p = path.join(absDir, "manifest.json");
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return {}; }
})();

const manifest = {
  component: component ?? prev.component ?? slug,
  slug,
  figmaNode: boundNode ?? prev.figmaNode ?? null,
  verdict: "pass",
  capturedAt: new Date().toISOString(),
  sources: sourceHashes,
  artifacts: artifactHashes,
};

fs.writeFileSync(path.join(absDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`✓ evidence:record ${slug} — sealed ${sources.length} source file(s) against passing bundle.`);
for (const s of sources) console.log(`    ${s}`);
if (!manifest.figmaNode) console.log("  note: no --node recorded; add the Figma node id for traceability.");
