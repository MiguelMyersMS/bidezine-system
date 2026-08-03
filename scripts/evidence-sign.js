// Independent verdict signing — mechanism C (doer != checker).
//
// The CHECKER (a process that holds EVIDENCE_CHECK_TOKEN, which the doer must NOT have)
// reviews the bundle and, if it passes, signs a digest of the whole verified state.
// The gate then requires a valid signature, so a doer without the token cannot mark its
// own work verified. The separation is REAL only when the token is isolated from the
// doer (a CI secret / a separate trusted runner) — see docs/evidence/README.md.
//
// Usage:  EVIDENCE_CHECK_TOKEN=... node scripts/evidence-sign.js <slug>

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";
import { evidenceDirFor, loadManifest, bundleDigest, hmac, computeVerdict, slugFor } from "./lib/evidence.js";

const slug = slugFor(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "");
const fail = (msg) => {
  console.error(`✗ evidence:sign ${slug || "?"} — ${msg}`);
  process.exit(1);
};

if (!slug) fail("usage: EVIDENCE_CHECK_TOKEN=... node scripts/evidence-sign.js <slug>");
const token = process.env.EVIDENCE_CHECK_TOKEN;
if (!token) fail("EVIDENCE_CHECK_TOKEN is not set — only the independent checker (who holds it) may sign.");

const dir = path.join(ROOT, evidenceDirFor(slug));
const manifest = loadManifest(slug);
if (!manifest) fail("no manifest — the doer must evidence:record first.");

// The checker is signing off that the independent comparison passed — computed from
// the resolved checklist, never a typed line.
const v = computeVerdict(fs.readFileSync(path.join(dir, "verdict.md"), "utf-8"));
if (!v.pass) {
  const why = [v.missing.length ? `missing: ${v.missing.join(",")}` : "", v.unchecked.length ? `unchecked: ${v.unchecked.join(",")}` : "", v.forbidden.length ? `markers: ${v.forbidden.length}` : ""].filter(Boolean).join("; ");
  fail(`verdict checklist not satisfied (${why}) — do not sign.`);
}

const digest = bundleDigest(manifest);
const signature = {
  alg: "HMAC-SHA256",
  digest,
  sig: hmac(token, digest),
  signedAt: new Date().toISOString(),
  note: "Independent checker signature over {slug, figmaNode, sources, artifacts}. Verified by the gate when EVIDENCE_CHECK_TOKEN is present.",
};
fs.writeFileSync(path.join(dir, "signature.json"), JSON.stringify(signature, null, 2) + "\n");
console.log(`✓ evidence:sign ${slug} — signed bundle digest ${digest.slice(0, 12)}…`);
console.log("  (commit signature.json; the gate will reject any later change to the bundle as a digest mismatch.)");
