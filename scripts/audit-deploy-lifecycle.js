// Deployment handoff lifecycle audit — enforces docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md.
// FAILS the build when:
//   • a release manifest has no/invalid lifecycle.status,
//   • a `retired` status is left in the ACTIVE area (retired releases live in docs/deploy/_archive/),
//   • a `signed-off` release is missing any SIGN-OFF GATE evidence:
//       - verify/{figma,storybook,app}.png (triangulation),
//       - signoff.audit_passed_commit (a recorded passing health run),
//       - app.import_proof + app.no_fork (consumer imports the shipped component, not a fork),
//   • an ARCHIVED release is missing its kept evidence (final manifest + the 3 screenshots),
//   • a project has more than one active release.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/audit-core.js";

// Deploy handoffs are CONSUMER-OWNED and live in the consumer's workspace, not this repo. This audit
// is a reusable deploy-run TOOL: point it at a consumer's handoff root with DEPLOY_DIR to verify a
// release there. With no override it scans the (now normally empty) local docs/deploy for back-compat.
const deployDir = process.env.DEPLOY_DIR ? path.resolve(process.env.DEPLOY_DIR) : path.join(ROOT, "docs/deploy");
const archiveDir = path.join(deployDir, "_archive");
const VALID = ["draft", "assembled", "verified", "handed-off", "deployed", "signed-off", "reopened", "retired"];
const SHOTS = ["figma.png", "storybook.png", "app.png"];
const failures = [];

// --- tiny structural reader: a field nested under a top-level front-block key ---
function blockText(src, parent) {
  const m = src.match(new RegExp(`^${parent}:\\s*$`, "m"));
  if (!m) return "";
  const lines = src.slice(m.index + m[0].length).split("\n").slice(1);
  const out = [];
  for (const ln of lines) {
    if (/^\S/.test(ln) && ln.trim() !== "") break; // next column-0 key/comment ends the block
    out.push(ln);
  }
  return out.join("\n");
}
function field(src, parent, key) {
  const b = blockText(src, parent);
  const m = b.match(new RegExp(`^\\s+${key}:\\s*(.+?)\\s*(?:#.*)?$`, "m"));
  if (!m) return null;
  const v = m[1].trim().replace(/^["']|["']$/g, "");
  return v === "" || v === "null" ? null : v;
}

function findManifests(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith("_")) continue; // skip _archive (scanned separately) + legacy underscore dirs
      out.push(...findManifests(full));
    } else if ((e.name === "deploy.md" || e.name.endsWith(".deploy.md")) && e.name !== "_TEMPLATE.deploy.md") {
      out.push(full);
    }
  }
  return out;
}
function findArchiveManifests(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findArchiveManifests(full));
    else if ((e.name === "deploy.md" || e.name.endsWith(".deploy.md")) && e.name !== "_TEMPLATE.deploy.md") out.push(full);
  }
  return out;
}
const shotsPresent = (manifestFile) =>
  SHOTS.filter((s) => !fs.existsSync(path.join(path.dirname(manifestFile), "verify", s)));

// ── ACTIVE area ──
const active = findManifests(deployDir);
const byProject = {};
for (const file of active) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf-8");
  const status = field(src, "lifecycle", "status");
  const signedOff = status === "signed-off" || field(src, "signoff", "complete") === "true";
  const project = rel.split("/")[2] || "(root)";
  (byProject[project] ||= []).push({ rel, status });

  if (!status) { failures.push(`${rel}: no lifecycle.status (add a lifecycle block per _TEMPLATE.deploy.md)`); continue; }
  if (!VALID.includes(status)) { failures.push(`${rel}: invalid lifecycle.status "${status}" (one of ${VALID.join(" | ")})`); continue; }
  if (status === "retired") { failures.push(`${rel}: status "retired" in the ACTIVE area — retired releases move to docs/deploy/_archive/`); continue; }

  if (signedOff) {
    const missing = shotsPresent(file);
    if (missing.length) failures.push(`${rel}: signed off but missing triangulation evidence verify/{${missing.join(",")}}`);
    if (!field(src, "signoff", "audit_passed_commit")) failures.push(`${rel}: signed off but signoff.audit_passed_commit not recorded (sign-off gate)`);
    if (!field(src, "app", "import_proof")) failures.push(`${rel}: signed off but app.import_proof not recorded (prove the consumer imports the shipped component)`);
    if (field(src, "app", "no_fork") !== "true") failures.push(`${rel}: signed off but app.no_fork is not true (prove the consumer has no local fork — Golden Rule #5)`);
  }
}
for (const [project, releases] of Object.entries(byProject)) {
  if (releases.length > 1) failures.push(`project "${project}": ${releases.length} active releases (one active per project): ${releases.map((r) => r.rel).join(", ")}`);
}

// ── ARCHIVE area: retirement must have KEPT the evidence ──
const archived = findArchiveManifests(archiveDir);
for (const file of archived) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf-8");
  const signedOff = field(src, "lifecycle", "status") === "signed-off" || field(src, "signoff", "complete") === "true";
  if (!signedOff) failures.push(`${rel}: archived release is not marked signed off (only signed-off releases are archived)`);
  const missing = shotsPresent(file);
  if (missing.length) failures.push(`${rel}: archived release missing kept evidence verify/{${missing.join(",")}}`);
  if (!field(src, "signoff", "audit_passed_commit")) failures.push(`${rel}: archived release missing signoff.audit_passed_commit`);
}

console.log(`\n[audit:deploy:lifecycle] ${active.length} active + ${archived.length} archived manifest(s)`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} lifecycle violation(s):`);
  failures.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log("✓ valid statuses; sign-off gate evidence present; no retired-in-active; archives intact.\n");
