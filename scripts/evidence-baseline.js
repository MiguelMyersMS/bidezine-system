// Evidence baseline — grandfather the existing back-catalog against MASTER.
//
// Records the master-committed source hash of every existing gallery component /
// spec into docs/evidence/baseline.json. The gate then treats a baselined component
// as grandfathered ONLY while it stays byte-identical to master; the moment it
// changes, real evidence is required (EV.BASELINE-DRIFT). This lets the lock fire on
// the NEXT change without a day-one wall of blockers on untouched components.
//
// STRICT scope (per owner decision 2026-06-23): baseline = MASTER content only.
// In-flight working-tree edits are NOT grandfathered — they must be verified.
//
// Usage:  node scripts/evidence-baseline.js [--ref origin/master]

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { ROOT } from "./lib/audit-core.js";
import { EVIDENCE_ROOT, slugForFile, committedContent, resolveRef, hashSource, loadManifest } from "./lib/evidence.js";

const args = process.argv.slice(2);
const refArg = args.includes("--ref") ? args[args.indexOf("--ref") + 1] : undefined;

const ref = (() => {
  for (const candidate of [refArg, "origin/master", "master"].filter(Boolean)) {
    const resolved = resolveRef(candidate);
    if (resolved && resolved !== candidate) return { name: candidate, sha: resolved };
  }
  console.error("✗ evidence:baseline — cannot resolve a master ref (tried origin/master, master). Pass --ref <ref>.");
  process.exit(1);
})();

// Every gallery component + spec file present on master.
let masterFiles = [];
try {
  masterFiles = execSync(`git ls-tree -r --name-only ${ref.sha} -- src/gallery docs/atomic`, { cwd: ROOT, encoding: "utf-8" })
    .split("\n").map((s) => s.trim()).filter(Boolean);
} catch (e) {
  console.error(`✗ evidence:baseline — git ls-tree failed: ${e.message}`);
  process.exit(1);
}

const slugs = {};
for (const f of masterFiles) {
  const slug = slugForFile(f);
  if (!slug) continue;
  if (loadManifest(slug)) continue; // a real bundle already exists — don't downgrade it to a baseline
  (slugs[slug] ??= { sources: {} }).sources[f] = hashSource(committedContent(f, ref.sha));
}

const baseline = {
  _meta: {
    description: "Grandfather record: master-committed source hashes. A component is exempt from full evidence ONLY while byte-identical to these. Any change -> EV.BASELINE-DRIFT -> real evidence required.",
    baselinedAgainst: `${ref.name} @ ${ref.sha}`,
    baselinedAt: new Date().toISOString(),
  },
  slugs,
};

fs.mkdirSync(path.join(ROOT, EVIDENCE_ROOT), { recursive: true });
fs.writeFileSync(path.join(ROOT, EVIDENCE_ROOT, "baseline.json"), JSON.stringify(baseline, null, 2) + "\n");

const count = Object.keys(slugs).length;
const fileCount = Object.values(slugs).reduce((n, s) => n + Object.keys(s.sources).length, 0);
console.log(`✓ evidence:baseline — grandfathered ${count} component(s) / ${fileCount} file(s) against ${ref.name} (${ref.sha.slice(0, 8)}).`);
console.log(`  Any change to a baselined component now requires real evidence. New components are never baselined.`);
