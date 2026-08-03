// Deployment completeness audit — the coverage guard for Phase 7 (DEPLOY).
//
// Governed by docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md. Reads every
// docs/deploy/**/*.deploy.md (except _TEMPLATE) and proves that the deployment's
// coverage matrix accounts for EVERY node in the recorded ground-truth Figma fetch.
//
// The point is NOT to validate design — it is to make INCOMPLETENESS impossible to
// ship. The recurring failure (RailNav 289-4585 → PLG) was an AI fixing the 1-2
// gaps it noticed and declaring done while 7 stayed invisible. A human "sign-off
// that the matrix is complete" cannot prevent that — only a machine set-difference
// against ground truth can. This is that check: a forgotten node is a node present
// in the ground-truth fetch but absent from the matrix → red build.
//
// Lightweight by design: no YAML dependency (the package ships zero build deps).
// We scan the front-block structurally and diff node-id sets.
//
// Exit non-zero on any BLOCKER so `npm run health` fails loudly.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonIfChanged } from "./lib/audit-core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Reusable deploy-run tool — point at a consumer's handoff root with DEPLOY_DIR (deploy handoffs are
// consumer-owned, not stored in this design-language repo). No override → scans local docs/deploy (back-compat).
const DEPLOY_DIR = process.env.DEPLOY_DIR ? path.resolve(process.env.DEPLOY_DIR) : path.join(ROOT, "docs/deploy");
const AUDITS_DIR = path.join(ROOT, "docs/audits");

const LAYERS = ["L1", "L2", "L3", "L4"];
// match    = consumer-controlled aspect correctly deployed (data/prop/asset present & right)
// inherited= component-owned; the app consumes the Storybook-verified component, so its
//            fidelity is inherited, NOT re-claimed here (owned by figma-verify / Phase 5)
// gap      = consumer-controlled gap to remediate   ruling = needs a human decision
// ignore   = internal artifact with no deployment obligation (needs a reason)
const STATUSES = ["match", "inherited", "gap", "ruling", "ignore"];
const SEVERITIES = ["none", "low", "medium", "high", "blocker"];
const MIN_DEPTH = 6;
// A Figma node id as emitted by get_figma_data: "289:4585", "I289:4587;166:4235".
const NODE_ID = "I?\\d+[:-]\\d+(?:;[I\\d:-]+)*";

// ── tiny structural helpers (not a full YAML parser) ─────────────────────────

function yamlBlock(md) {
  const m = md.match(/```ya?ml\s*\n([\s\S]*?)\n```/);
  return m ? m[1] : null;
}

function topValue(block, key) {
  const m = block.match(new RegExp(`^${key}:\\s*(.+?)\\s*(?:#.*)?$`, "m"));
  return m ? m[1].trim() : null;
}

// Value of an indented sub-key under a top-level section (e.g. assembly.nodeId).
function subValue(block, parent, key) {
  const lines = block.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^${parent}:`).test(l));
  if (start === -1) return null;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) break; // next top-level key
    const m = lines[i].match(new RegExp(`^\\s+${key}:\\s*(.+?)\\s*(?:#.*)?$`));
    if (m) return m[1].trim();
  }
  return null;
}

function unquote(v) {
  return v == null ? v : v.replace(/^["']|["']$/g, "").trim();
}

// Parse the `matrix:` list into row objects. Each row begins with `- node:`.
function parseMatrix(block) {
  const lines = block.split("\n");
  const start = lines.findIndex((l) => /^matrix:/.test(l));
  if (start === -1) return null;
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) break; // next top-level key
    body.push(lines[i]);
  }
  const rows = [];
  let cur = null;
  for (const line of body) {
    const startRow = line.match(/^\s*-\s*node:\s*(.+?)\s*(?:#.*)?$/);
    if (startRow) {
      if (cur) rows.push(cur);
      cur = { node: unquote(startRow[1]) };
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^\s+([A-Za-z_]+):\s*(.+?)\s*(?:#.*)?$/);
    if (kv) cur[kv[1]] = unquote(kv[2]);
  }
  if (cur) rows.push(cur);
  return rows;
}

// Extract every node id from the `nodes:` section of a raw get_figma_data dump.
// Scoped to nodes: → next top-level key so component/componentSet/globalVars ids
// are excluded. `componentId:` is intentionally NOT matched (it is a reference,
// not a tree node) — the lowercase `id:` anchor skips the capital-I `Id:`.
function groundTruthNodeIds(raw) {
  const lines = raw.split("\n");
  const start = lines.findIndex((l) => /^nodes:/.test(l));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) { end = i; break; }
  }
  const slice = lines.slice(start + 1, end).join("\n");
  const ids = new Set();
  const re = new RegExp(`(?:^|\\n)\\s*-?\\s*id:\\s*(${NODE_ID})`, "g");
  let m;
  while ((m = re.exec(slice)) !== null) ids.add(m[1].trim());
  return ids;
}

// Map each ground-truth node id → its `visible:` flag (where the dump records it).
// Enforces: a HIDDEN layer (visible:false) is never routed as rendered content — it must be
// `ignore`. Guards the "review the node tree, not the rendering" failure where a hidden placeholder
// (e.g. a default subtitle) is treated as live content.
function groundTruthVisible(raw) {
  const lines = raw.split("\n");
  const start = lines.findIndex((l) => /^nodes:/.test(l));
  if (start === -1) return new Map();
  const vis = new Map();
  let cur = null;
  const idRe = new RegExp(`^\\s*-?\\s*id:\\s*(${NODE_ID})`);
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) break;
    const idM = lines[i].match(idRe);
    if (idM) { cur = idM[1].trim(); if (!vis.has(cur)) vis.set(cur, true); continue; }
    const vM = lines[i].match(/^\s+visible:\s*(true|false)\b/);
    if (vM && cur) vis.set(cur, vM[1] === "true");
  }
  return vis;
}

// ── per-deployment lint ──────────────────────────────────────────────────────

function lintDeployment(file, md) {
  const findings = [];
  const add = (level, msg) => findings.push({ level, msg });

  const block = yamlBlock(md);
  if (!block) { add("blocker", "no ```yaml front-block found"); return findings; }

  const fileKey = subValue(block, "assembly", "fileKey");
  const nodeId = subValue(block, "assembly", "nodeId");
  const groundTruth = unquote(subValue(block, "assembly", "groundTruth"));
  const depth = parseInt(subValue(block, "assembly", "fetchedDepth") || "0", 10);
  if (!fileKey || /^["']?["']?$/.test(unquote(fileKey))) add("blocker", "assembly.fileKey is empty");
  if (!nodeId) add("blocker", "assembly.nodeId is empty");
  if (!groundTruth) add("blocker", "assembly.groundTruth is empty (need the raw Figma fetch for ground truth)");
  if (depth && depth < MIN_DEPTH) add("high", `assembly.fetchedDepth ${depth} < ${MIN_DEPTH} (Deep Figma Audit minimum)`);

  const rows = parseMatrix(block);
  if (!rows || rows.length === 0) { add("blocker", "matrix is empty"); return findings; }

  // Per-row validation + duplicate detection.
  const routed = new Map(); // node id → count
  for (const r of rows) {
    routed.set(r.node, (routed.get(r.node) || 0) + 1);
    if (!LAYERS.includes(r.layer)) add("blocker", `row ${r.node}: invalid/missing layer '${r.layer}' (expected ${LAYERS.join("|")})`);
    if (!STATUSES.includes(r.status)) add("blocker", `row ${r.node}: invalid/missing status '${r.status}' (expected ${STATUSES.join("|")})`);
    if (!SEVERITIES.includes(r.severity)) add("blocker", `row ${r.node}: invalid/missing severity '${r.severity}' (expected ${SEVERITIES.join("|")})`);
    if (r.status === "ignore" && !r.reason) add("blocker", `row ${r.node}: status=ignore requires a reason`);
    if ((r.status === "gap" || r.status === "ruling") && (r.severity === "none" || !r.severity)) {
      add("blocker", `row ${r.node}: status=${r.status} requires severity >= low`);
    }
  }
  for (const [node, n] of routed) if (n > 1) add("blocker", `node ${node} appears ${n} times in matrix (each node exactly once)`);

  // Ground-truth set-difference — the core completeness check.
  if (groundTruth) {
    const gtPath = path.resolve(path.dirname(file), groundTruth);
    if (!fs.existsSync(gtPath)) {
      add("blocker", `ground-truth file not found: ${path.relative(ROOT, gtPath)} (cannot verify completeness without the raw Figma fetch)`);
    } else {
      const raw = fs.readFileSync(gtPath, "utf-8");
      const gtIds = groundTruthNodeIds(raw);
      if (!gtIds) {
        add("blocker", `ground-truth file has no 'nodes:' section: ${path.relative(ROOT, gtPath)}`);
      } else {
        const routedSet = new Set(routed.keys());
        const missed = [...gtIds].filter((id) => !routedSet.has(id));
        const phantom = [...routedSet].filter((id) => !gtIds.has(id));
        for (const id of missed) add("blocker", `Figma node not in matrix (MISSED): ${id}`);
        for (const id of phantom) add("high", `matrix node not in ground truth (phantom/typo/stale): ${id}`);
        if (gtIds.size === 0) add("high", "ground-truth 'nodes:' section yielded 0 node ids (wrong format or empty fetch)");

        // Hidden-as-content guard: a layer hidden in Figma (visible:false) must be routed `ignore`,
        // never as rendered content. Catches inventory taken from the node tree (incl. hidden
        // placeholders) instead of the rendered design.
        const visible = groundTruthVisible(raw);
        const rowByNode = new Map(rows.map((r) => [r.node, r]));
        for (const [id, isVisible] of visible) {
          if (isVisible === false) {
            const r = rowByNode.get(id);
            if (r && r.status !== "ignore") {
              add("blocker", `hidden Figma layer routed as '${r.status}' (must be 'ignore'): ${id} — inventory must use the RENDERED/visible state, not hidden tree nodes`);
            }
          }
        }
      }
    }
  }

  // Sign-off may not claim complete while coverage blockers exist.
  const complete = (topValue(block, "complete") || subValue(block, "signoff", "complete")) === "true";
  if (complete && findings.some((f) => f.level === "blocker")) {
    add("blocker", "signoff.complete: true but coverage is not machine-complete (resolve the blockers above first)");
  }

  // Awareness: remaining unremediated gaps (not a blocker by themselves).
  const openGaps = rows.filter((r) => r.status === "gap").length;
  if (openGaps) add("info", `${openGaps} gap(s) routed and awaiting remediation`);

  return findings;
}

// ── run ────────────────────────────────────────────────────────────────────────

function findDeployments(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findDeployments(p));
    else if (entry.name.endsWith(".deploy.md") && !entry.name.startsWith("_")) out.push(p);
  }
  return out;
}

const deployments = findDeployments(DEPLOY_DIR);
let blockers = 0;
let high = 0;

console.log(`[deployment-audit] linting ${deployments.length} deployment(s) under docs/deploy/`);
for (const file of deployments) {
  const rel = path.relative(ROOT, file);
  const findings = lintDeployment(file, fs.readFileSync(file, "utf-8"));
  const b = findings.filter((f) => f.level === "blocker");
  const h = findings.filter((f) => f.level === "high");
  blockers += b.length;
  high += h.length;
  if (findings.filter((f) => f.level !== "info").length === 0) {
    console.log(`  ✓ ${rel}`);
  } else {
    console.log(`  ${b.length ? "✗" : "⚠"} ${rel}`);
  }
  for (const f of findings) console.log(`      [${f.level}] ${f.msg}`);
}

try {
  fs.mkdirSync(AUDITS_DIR, { recursive: true });
  // Idempotent write (2026-08-02): only rewrite when the RESULT changed. This hand-written artifact
  // previously rewrote LF bytes over a CRLF checkout on every run, which git reports as " M" while
  // `git diff` shows nothing - invisible, non-self-healing dirt. See writeJsonIfChanged in audit-core.
  const __w = writeJsonIfChanged(
    path.join(AUDITS_DIR, "deployment-audit-latest.json"),
    { summary: { blocker: blockers, high, deployments: deployments.length } },
  );
  if (__w.skipped) console.log("[deployment-audit] unchanged - artifact not rewritten");
} catch { /* non-fatal */ }

console.log(
  blockers
    ? `\n✗ deployment-audit: ${blockers} blocker(s), ${high} high`
    : `\n✓ deployment-audit: passed (${deployments.length} deployment(s), ${high} high warning(s))`,
);
process.exit(blockers ? 1 : 0);
