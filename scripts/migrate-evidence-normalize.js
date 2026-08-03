// Phase-A migration — adopt the verified-flip decoupling on ALREADY-SEALED bundles.
//
// B (scripts/lib/evidence.js normalizeSpecForHash) changed the hash BASIS for a
// component spec: verification-metadata field values (status, lastVerifiedCycle,
// verify.lastVision/lastPixelDiff, checklist pass:) no longer contribute to the seal
// hash. Bundles sealed BEFORE B stored the raw (un-normalized) spec hash, so the gate
// now reads them STALE. This migration re-hashes each bundle's SOURCES under B and
// re-signs — nothing else.
//
// MECHANICAL ONLY: it does NOT re-render the story, re-capture Figma, or re-review the
// verdict. The PNGs, figma.json and verdict.md are untouched (their artifact hashes do
// not change). It is a pure change of hash basis + re-signature, and it is FAIL-CLOSED:
// a bundle is migrated ONLY if it is byte-identical to its sealed state (verdict passes,
// every artifact matches its recorded hash, every source matches its recorded RAW hash,
// and the only hash that moves is the spec's, purely from normalization). Anything else
// is REFUSED as genuinely stale — it needs a real re-seal (capture + review), not this.
//
// Usage:
//   node scripts/migrate-evidence-normalize.js --check [slug...]           # dry-run: no writes, no token
//   EVIDENCE_CHECK_TOKEN=... node scripts/migrate-evidence-normalize.js [slug...]   # apply
// With no slugs: every sealed bundle (docs/evidence/<slug>/ with manifest.json + signature.json).

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";
import {
  REQUIRED_ARTIFACTS,
  EVIDENCE_ROOT,
  evidenceDirFor,
  sourcesForSlug,
  workingContent,
  isComponentSpec,
  sha256,
  hashSource,
  bundleDigest,
  hmac,
  computeVerdict,
  loadManifest,
  slugFor,
} from "./lib/evidence.js";

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const slugs = argv.filter((a) => !a.startsWith("--")).map(slugFor);

// The RAW (pre-B) hash of a source: reproduces exactly how bundles were sealed before B
// (old workingContent was a plain fs.readFileSync fed to hashSource). Used to PROVE a
// source is byte-identical to its sealed state before we change its hash basis.
function rawHash(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? hashSource(fs.readFileSync(full)) : hashSource(Buffer.from(""));
}

function sealedSlugs() {
  const root = path.join(ROOT, EVIDENCE_ROOT);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((s) => fs.existsSync(path.join(root, s, "manifest.json")) && fs.existsSync(path.join(root, s, "signature.json")));
}

function migrateOne(slug, token) {
  const absDir = path.join(ROOT, evidenceDirFor(slug));
  const manifest = loadManifest(slug);
  if (!manifest) return { slug, status: "skip", reason: "no manifest (not sealed)" };
  if (!fs.existsSync(path.join(absDir, "signature.json"))) return { slug, status: "skip", reason: "no signature (not sealed)" };

  // 1. Verdict must still be a computed pass — never migrate a non-passing bundle.
  const vFile = path.join(absDir, "verdict.md");
  if (!fs.existsSync(vFile) || !computeVerdict(fs.readFileSync(vFile, "utf-8")).pass) {
    return { slug, status: "refuse", reason: "verdict.md is not a computed pass" };
  }

  // 2. Artifacts must be byte-identical to what was sealed (else the bundle changed →
  //    real re-seal, not a mechanical re-hash). Also all REQUIRED artifacts present.
  for (const art of REQUIRED_ARTIFACTS) {
    const full = path.join(absDir, art);
    if (!fs.existsSync(full) || fs.statSync(full).size === 0) return { slug, status: "refuse", reason: `missing/empty artifact ${art}` };
  }
  for (const [art, recorded] of Object.entries(manifest.artifacts ?? {})) {
    const full = path.join(absDir, art);
    if (!fs.existsSync(full)) return { slug, status: "refuse", reason: `artifact ${art} missing — needs a real re-seal` };
    // PNGs are binary (byte-exact sha256); text artifacts (json/md) are hashed line-ending
    // normalized so a working tree checked out CRLF matches the LF bytes recorded at seal.
    const buf = fs.readFileSync(full);
    const got = art.endsWith(".png") ? sha256(buf) : hashSource(buf);
    if (got !== recorded) {
      return { slug, status: "refuse", reason: `artifact ${art} changed since seal — needs a real re-seal` };
    }
  }

  // 3. Source SET must match the manifest (no source added/removed) …
  const liveSources = sourcesForSlug(slug);
  const manifestKeys = Object.keys(manifest.sources ?? {}).sort();
  if (JSON.stringify(liveSources.slice().sort()) !== JSON.stringify(manifestKeys)) {
    return { slug, status: "refuse", reason: `source set changed (manifest [${manifestKeys.join(", ")}] vs live [${liveSources.join(", ")}]) — real re-seal` };
  }

  // 4. … and every source must be byte-identical to its sealed state (RAW hash == recorded).
  //    This is what makes the re-hash purely a change of BASIS, not a content change.
  for (const src of liveSources) {
    if (rawHash(src) !== manifest.sources[src]) {
      return { slug, status: "refuse", reason: `${src} changed since seal (raw hash moved) — needs a real re-seal` };
    }
  }

  // 5. New hashes under B. Invariant: only the spec's hash may move; code (.tsx) is identity.
  const newSources = {};
  let specMoved = false;
  for (const src of liveSources) {
    newSources[src] = hashSource(workingContent(src));
    if (newSources[src] !== manifest.sources[src]) {
      if (!isComponentSpec(src)) {
        return { slug, status: "refuse", reason: `non-spec source ${src} hash moved under normalization — unexpected, refusing` };
      }
      specMoved = true;
    }
  }

  if (!specMoved) return { slug, status: "fresh", reason: "already consistent under B (no spec-hash change)" };

  const oldSpecHash = liveSources.filter(isComponentSpec).map((s) => manifest.sources[s].slice(0, 10)).join(",");
  const newSpecHash = liveSources.filter(isComponentSpec).map((s) => newSources[s].slice(0, 10)).join(",");

  if (check) {
    return { slug, status: "would-migrate", reason: `spec hash ${oldSpecHash}… → ${newSpecHash}… (artifacts + code unchanged)` };
  }

  // 6. Apply — mechanical: rewrite source hashes in capture-stamp + manifest, re-sign.
  //    The capture-stamp embeds source hashes, so rewriting it changes its file bytes →
  //    its manifest.artifacts entry must be recomputed too, then the whole digest re-signed.
  if (!token) return { slug, status: "refuse", reason: "EVIDENCE_CHECK_TOKEN not set — cannot re-sign" };

  // 6a. Rewrite the capture-stamp's embedded source hashes and persist it first.
  const stampPath = path.join(absDir, "capture-stamp.json");
  const stamp = JSON.parse(fs.readFileSync(stampPath, "utf-8"));
  stamp.sources = { ...stamp.sources, ...newSources };
  fs.writeFileSync(stampPath, JSON.stringify(stamp, null, 2) + "\n");

  // 6b. Manifest: new source hashes + the capture-stamp's NEW artifact hash (sha256, matching
  //     the recorder + gate). Every other artifact hash is preserved untouched.
  const nextManifest = {
    ...manifest,
    sources: newSources,
    artifacts: { ...manifest.artifacts, "capture-stamp.json": sha256(fs.readFileSync(stampPath)) },
  };
  fs.writeFileSync(path.join(absDir, "manifest.json"), JSON.stringify(nextManifest, null, 2) + "\n");

  const digest = bundleDigest(nextManifest);
  const signature = {
    alg: "HMAC-SHA256",
    digest,
    sig: hmac(token, digest),
    signedAt: new Date().toISOString(),
    note: "Independent checker signature over {slug, figmaNode, sources, artifacts}. Verified by the gate when EVIDENCE_CHECK_TOKEN is present.",
  };
  fs.writeFileSync(path.join(absDir, "signature.json"), JSON.stringify(signature, null, 2) + "\n");

  return { slug, status: "migrated", reason: `spec hash ${oldSpecHash}… → ${newSpecHash}…; re-signed ${digest.slice(0, 12)}…` };
}

const token = process.env.EVIDENCE_CHECK_TOKEN;
const targets = slugs.length ? slugs : sealedSlugs();
if (!check && !token) {
  console.error("✗ EVIDENCE_CHECK_TOKEN is required to re-sign (or pass --check for a dry run).");
  process.exit(2);
}

console.log(`[migrate-evidence-normalize] ${check ? "DRY-RUN" : "APPLY"} over ${targets.length} bundle(s)\n`);
const results = targets.map((s) => migrateOne(s, token));
const by = (st) => results.filter((r) => r.status === st);
for (const r of results) {
  const tag = { migrated: "✓", "would-migrate": "◦", fresh: "·", skip: "–", refuse: "✗" }[r.status] ?? "?";
  console.log(`  ${tag} ${r.slug.padEnd(22)} ${r.status.padEnd(14)} ${r.reason}`);
}
console.log(
  `\nsummary: ${by("migrated").length} migrated · ${by("would-migrate").length} would-migrate · ` +
    `${by("fresh").length} already-fresh · ${by("skip").length} skipped · ${by("refuse").length} refused`,
);
if (by("refuse").length) {
  console.log("\n⚠ REFUSED bundles are genuinely stale (source/artifact changed since seal) — they need a real");
  console.log("  re-seal (capture + independent review), NOT this mechanical migration. Listed above.");
  process.exit(check ? 0 : 1);
}
