// Deployment verify-completeness gate — the machine enforcement for the independent /deployment-verify
// pass (Verification Integrity, Cycle 146). Makes "the agent skipped looking / byte-proxied it"
// impossible to ship: a release cannot sit at `handed-off`+ unless it carries a real, itemized
// comparison of every drift-prone element.
//
// FAILS when a release at status handed-off|deployed|signed-off|reopened:
//   • has no verify/comparison.md, or
//   • comparison overall verdict is not PASS, or
//   • a matrix node routed `match`/`gap`/`ruling` (the consumer-controlled, drift-prone set) has no
//     row in comparison.md, or its row's verdict is not `match` (an unresolved diff/missing), or
//   • DOER != CHECKER is not provable: deploy.md has no lifecycle.assembled_by, comparison.md has no
//     `reviewer:`, or assembled_by and reviewer are the SAME named actor (the builder verified their
//     own deployment). This is the deploy-stage analog of the evidence gate's doer!=checker signature:
//     a release can't sit at handed-off+ unless a DIFFERENT actor than the assembler signed the
//     comparison. It is declarative (no crypto token like the evidence stage), so the authority is the
//     orchestration actually using distinct agents + the consumer/owner sign-off gate downstream.
//
// comparison.md row schema (one row per drift-prone element):
//   | <node-id> | <element> | <figma value> | <our render value> | <verdict: match|diff|missing> |
// plus an `overall: PASS|FAIL` line and a `reviewer:` line (the independent checker). (The
// /deployment-verify skill writes this by OPENING the rendered images — never by size/hash. This audit
// checks the artifact is complete + independently reviewed; it cannot check that the reviewer truly
// looked — that is what the doer!=checker separation + the no-proxy rule are for.)
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";

// Reusable deploy-run tool — point at a consumer's handoff root with DEPLOY_DIR (deploy handoffs are
// consumer-owned, not stored in this design-language repo). No override → scans local docs/deploy (back-compat).
const deployDir = process.env.DEPLOY_DIR ? path.resolve(process.env.DEPLOY_DIR) : path.join(ROOT, "docs/deploy");
const GATED = new Set(["handed-off", "deployed", "signed-off", "reopened"]);
const DRIFT_PRONE = new Set(["match", "gap", "ruling"]); // consumer-controlled → must be verified
const NODE_ID = "I?\\d+[:-]\\d+(?:;[I\\d:-]+)*";
const failures = [];

function findManifests(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith("_")) out.push(...findManifests(full)); }
    else if ((e.name === "deploy.md" || e.name.endsWith(".deploy.md")) && e.name !== "_TEMPLATE.deploy.md") out.push(full);
  }
  return out;
}
function lifecycleStatus(src) {
  const m = src.match(/lifecycle:[\s\S]*?\bstatus:\s*([a-z-]+)/);
  return m ? m[1] : null;
}
// raw value of a lifecycle field, comment- and quote-stripped (null when absent/empty/"null")
const clean = (s) => { const v = String(s || "").trim().replace(/^["']|["']$/g, ""); return v === "" || v === "null" ? null : v; };
// the comparable actor identity: leading token before any "(parenthetical)" / "#comment", lowercased
const actorKey = (s) => String(s || "").toLowerCase().replace(/\(.*$/, "").replace(/#.*$/, "").trim();
function assembledBy(src) {
  const m = src.match(/lifecycle:[\s\S]*?\bassembled_by:\s*([^\n#]+)/);
  return m ? clean(m[1]) : null;
}
// node-ids in deploy.md's matrix are QUOTED per _TEMPLATE.deploy.md ("289:4590"); strip quotes so we
// parse them identically to audit-deployment.js (which uses the same unquote). A node-id regex that
// rejected the leading quote silently matched NOTHING, voiding the drift-prone completeness + verdict
// checks for every template-format release — fixed here.
const unquote = (v) => (v == null ? v : String(v).replace(/^["']|["']$/g, "").trim());
// matrix nodes routed in DRIFT_PRONE → [node-id]. Line-walked (not one spanning regex) and unquoted,
// mirroring audit-deployment.js parseMatrix so both audits agree on the node set.
function driftProneNodes(src) {
  const mi = src.indexOf("\nmatrix:");
  const block = mi === -1 ? "" : src.slice(mi);
  const out = [];
  let cur = null;
  const flush = () => { if (cur && DRIFT_PRONE.has(cur.status)) out.push(cur.node); };
  for (const line of block.split("\n")) {
    const start = line.match(/^\s*-\s*node:\s*(.+?)\s*(?:#.*)?$/);
    if (start) { flush(); cur = { node: unquote(start[1]), status: null }; continue; }
    if (!cur) continue;
    const kv = line.match(/^\s+([A-Za-z_]+):\s*(.+?)\s*(?:#.*)?$/);
    if (kv && kv[1] === "status") cur.status = unquote(kv[2]).toLowerCase();
  }
  flush();
  return out;
}
// comparison.md → { overall, verdictByNode }
function parseComparison(src) {
  const overall = (src.match(/overall:\s*\**\s*(PASS|FAIL)/i) || [])[1] || null;
  const reviewer = clean((src.match(/^\s*reviewer:\s*(.+?)\s*$/m) || [])[1]);
  const verdictByNode = new Map();
  // tolerate optional quotes around the table node-id (capture group still yields the bare id)
  const idRe = new RegExp(`^\\s*\\|\\s*["']?(${NODE_ID})["']?\\s*\\|.*\\|\\s*([A-Za-z]+)\\s*\\|\\s*$`);
  for (const line of src.split("\n")) {
    const m = line.match(idRe);
    if (m) verdictByNode.set(m[1].trim(), m[2].trim().toLowerCase());
  }
  return { overall, reviewer, verdictByNode };
}

const manifests = findManifests(deployDir);
let gatedCount = 0;
for (const file of manifests) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf-8");
  const status = lifecycleStatus(src);
  if (!GATED.has(status)) continue;
  gatedCount++;
  const cmpPath = path.join(path.dirname(file), "verify", "comparison.md");
  if (!fs.existsSync(cmpPath)) {
    failures.push(`${rel}: status '${status}' but no verify/comparison.md — the independent /deployment-verify pass has not run (or was skipped)`);
    continue;
  }
  const { overall, reviewer, verdictByNode } = parseComparison(fs.readFileSync(cmpPath, "utf-8"));
  if (overall !== "PASS") failures.push(`${rel}: verify/comparison.md overall verdict is '${overall || "(none)"}', not PASS`);

  // DOER != CHECKER: the assembler (deploy.md) and the reviewer (comparison.md) must be named, distinct actors.
  const builder = assembledBy(src);
  if (!builder) failures.push(`${rel}: status '${status}' but lifecycle.assembled_by is not recorded — the DOER (assembler) must be named so the gate can enforce reviewer != builder`);
  if (!reviewer) failures.push(`${rel}: verify/comparison.md has no 'reviewer:' line — the independent checker who signed the comparison must be named`);
  if (builder && reviewer && actorKey(builder) === actorKey(reviewer)) {
    failures.push(`${rel}: assembled_by '${builder}' is the SAME actor as comparison reviewer '${reviewer}' — the builder verified their own deployment (doer != checker violated). A different actor must review.`);
  }

  for (const node of driftProneNodes(src)) {
    const v = verdictByNode.get(node);
    if (!v) failures.push(`${rel}: drift-prone matrix node ${node} has NO row in verify/comparison.md (every match/gap/ruling element must be itemized)`);
    else if (v !== "match") failures.push(`${rel}: comparison row ${node} verdict='${v}' (unresolved) — must be 'match' before this release can be handed off`);
  }
}

console.log(`\n[audit:deploy:verify] ${gatedCount} gated release(s) (handed-off+)`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} verify-completeness violation(s):`);
  failures.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log("✓ every handed-off+ release has a PASS comparison itemizing each drift-prone element.\n");
