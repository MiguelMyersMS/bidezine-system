// Consumer sync — discover sibling projects using @miguel/design-system, report usage.
// REPORT ONLY — does not modify consumer projects.
import fs from "node:fs";
import path from "node:path";
import { ROOT, writeJsonIfChanged } from "./lib/audit-core.js";
import { loadRegistry, getSemanticKeys } from "./lib/token-graph.js";

// Consumers live in Workspaces/apps/* (the 2026-05 reorg moved them out of systems/). We report paths
// relative to the Workspaces ROOT and scan apps/ (primary) + the sibling systems/ (for any DS-consuming
// system), each up to a nested level deep — never this design-system package itself.
const workspaceDir = path.resolve(ROOT, "../..");
const SCAN_ROOTS = ["apps", "systems"]
  .map((d) => path.join(workspaceDir, d))
  .filter((d) => fs.existsSync(d));
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "app", "storybook-static"]);

/** Read own package.json version */
function getDesignSystemVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
    return pkg.version ?? "unknown";
  } catch { return "unknown"; }
}

// Waivers are OWNED BY THE CONSUMER and live in the consumer's own workspace docs —
// the DS repo stores only the design language, never per-project data. Each consumer keeps
// docs/design-system-waivers.json; consumer-sync reads it from that consumer during the scan.
const CONSUMER_WAIVER_REL = "docs/design-system-waivers.json";

/** Load a single consumer's waivers from <consumerDir>/docs/design-system-waivers.json */
function loadConsumerWaivers(projectDir, projectName) {
  const waiverPath = path.join(projectDir, CONSUMER_WAIVER_REL);
  if (!fs.existsSync(waiverPath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(waiverPath, "utf-8"));
    if (!Array.isArray(raw)) return [];
    // Stamp the owning project so the shared summary/expiry reporting can label each entry
    // (the file is inherently this consumer's, so `project` in the file is optional).
    return raw.map((w) => ({ ...w, project: w.project ?? projectName }));
  } catch { return []; }
}

/** Check if a waiver matches a finding for a given project */
function matchWaiver(waivers, projectName, finding) {
  return waivers.find((w) =>
    w.status === "active" &&
    (!w.project || w.project === projectName) &&
    w.finding_id === finding.primary_id &&
    finding.file.startsWith(w.file.replace(/\*/g, ""))
  ) ?? null;
}

/** Check if a waiver has expired */
function isExpired(waiver) {
  if (!waiver.expires) return false;
  return new Date(waiver.expires) < new Date();
}

/** Recursively find files with a given extension, skipping irrelevant dirs */
function findFiles(dir, ext, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(full, ext, results);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Determine dependency range from all dep sections + peerDeps */
function findDepRange(pkg) {
  for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
    const range = pkg[section]?.["@miguel/design-system"];
    if (range) return range;
  }
  return null;
}

/** Derive status from findings summary (unwaived only) */
function deriveStatus(summary, scanned) {
  if (!scanned) return "unknown";
  if (summary.blocker > 0) return "blocked";
  if (summary.high > 0) return "needs-review";
  if (summary.medium > 0 || summary.low > 0) return "warning";
  return "clean";
}

// ── 1. Auto-discover consumers ──
console.log("Consumer sync — report only\n");
console.log(`Scanning: ${SCAN_ROOTS.map((d) => path.relative(workspaceDir, d)).join(", ") || "(no scan roots found)"}\n`);

// Waivers are gathered per-consumer during the scan (each consumer owns its own file).
const allWaivers = [];

const candidateDirs = [];
const seen = new Set();
const addCandidate = (dir, name) => {
  const resolved = path.resolve(dir);
  if (resolved === ROOT) return;                     // never scan this design-system package itself
  if (seen.has(resolved)) return;
  if (!fs.existsSync(path.join(dir, "package.json"))) return;
  seen.add(resolved);
  candidateDirs.push({ dir, name });
};

for (const root of SCAN_ROOTS) {
  let children;
  try {
    children = fs.readdirSync(root, { withFileTypes: true });
  } catch { continue; }
  for (const child of children) {
    if (!child.isDirectory() || SKIP_DIRS.has(child.name) || child.name.startsWith(".")) continue;
    const childDir = path.join(root, child.name);
    addCandidate(childDir, child.name);              // e.g. apps/PLG-dashboard
    // Also scan one level deeper for nested consumers (e.g., apps/lyra-app/my-lyra-app-v2)
    try {
      for (const sub of fs.readdirSync(childDir, { withFileTypes: true })) {
        if (!sub.isDirectory() || SKIP_DIRS.has(sub.name) || sub.name.startsWith(".")) continue;
        addCandidate(path.join(childDir, sub.name), sub.name);
      }
    } catch { /* skip unreadable dirs */ }
  }
}

const projects = [];

for (const { dir: projectDir, name: dirName } of candidateDirs) {
  const pkgPath = path.join(projectDir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    projects.push({
      name: dirName,
      path: path.relative(workspaceDir, projectDir).replace(/\\/g, "/"),
      dependency_range: null,
      package_version: null,
      status: "unknown",
      source_files: 0,
      imports: {},
      findings: [],
      waived_findings: [],
      summary: { blocker: 0, high: 0, medium: 0, low: 0, total: 0 },
      waived_summary: { blocker: 0, high: 0, medium: 0, low: 0, total: 0 },
    });
    continue;
  }

  const depRange = findDepRange(pkg);
  if (!depRange) {
    // Project exists but doesn't use design-system
    projects.push({
      name: pkg.name || dirName,
      path: path.relative(workspaceDir, projectDir).replace(/\\/g, "/"),
      dependency_range: null,
      package_version: null,
      status: "not-installed",
      source_files: 0,
      imports: {},
      findings: [],
      waived_findings: [],
      summary: { blocker: 0, high: 0, medium: 0, low: 0, total: 0 },
      waived_summary: { blocker: 0, high: 0, medium: 0, low: 0, total: 0 },
    });
    continue;
  }

  projects.push({
    name: pkg.name || dirName,
    path: path.relative(workspaceDir, projectDir).replace(/\\/g, "/"),
    dependency_range: depRange,
    package_version: pkg.version ?? null,
    status: "pending", // resolved after scan
    _fullPath: projectDir,
  });
}

// Load token registry for validity checks
const registry = loadRegistry();
const semanticKeys = registry ? new Set(getSemanticKeys(registry)) : new Set();
const dsVersion = getDesignSystemVersion();

// Primitive color patterns
const PRIMITIVE_PATTERNS = [
  /\b(slate|iris|red|amber|green|slateDark|irisDark|redDark|amberDark|greenDark)\s*[.[]\s*["']?\d{1,2}/,
];

// ── 2. Scan each consumer ──
const scannedProjects = [];

for (const project of projects) {
  // Skip projects that are already resolved (not-installed, unknown)
  if (project.status !== "pending") {
    scannedProjects.push(project);
    continue;
  }

  const projectDir = project._fullPath;
  delete project._fullPath;

  // This consumer owns its waivers (in its own workspace docs) — load them here.
  const consumerWaivers = loadConsumerWaivers(projectDir, project.name);
  const consumerActiveWaivers = consumerWaivers.filter((w) => w.status === "active" && !isExpired(w));
  allWaivers.push(...consumerWaivers);

  console.log(`── ${project.name} (${project.dependency_range}) ──`);

  const sourceFiles = [
    ...findFiles(path.join(projectDir, "src"), ".tsx"),
    ...findFiles(path.join(projectDir, "src"), ".ts"),
  ];

  const findings = [];
  const importCounts = { tokens: 0, layout: 0, theme: 0, status: 0, icons: 0, gallery: 0, barrel: 0 };

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relFile = path.relative(projectDir, file).replace(/\\/g, "/");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Count import paths
      if (/@miguel\/design-system\/tokens/.test(line)) importCounts.tokens++;
      if (/@miguel\/design-system\/layout/.test(line)) importCounts.layout++;
      if (/@miguel\/design-system\/theme/.test(line)) importCounts.theme++;
      if (/@miguel\/design-system\/status/.test(line)) importCounts.status++;
      if (/@miguel\/design-system\/icons/.test(line)) importCounts.icons++;
      if (/@miguel\/design-system\/gallery/.test(line)) importCounts.gallery++;
      if (/@miguel\/design-system["']/.test(line) && !/@miguel\/design-system\//.test(line)) importCounts.barrel++;

      // Skip comments
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;

      // PALETTE leak
      if (/\bPALETTE\b/.test(line) && /@miguel\/design-system/.test(content)) {
        findings.push({ primary_id: "CS.PALETTE-LEAK", severity: "high", file: relFile, line: i + 1, evidence: line.trim().slice(0, 120), message: "Direct PALETTE import — use useTokens()", recommended_fix: "Replace PALETTE import with useTokens() from @miguel/design-system/theme" });
      }

      // Non-Fluent icon imports
      if (/from\s+["'](lucide-react|@heroicons|@mui\/icons|react-icons)/.test(line)) {
        findings.push({ primary_id: "CS.NON-FLUENT-ICON", severity: "high", file: relFile, line: i + 1, evidence: line.trim().slice(0, 120), message: "Non-Fluent icon library — use @miguel/design-system/icons", recommended_fix: "Replace with Fluent icon from @miguel/design-system/icons" });
      }

      // Hardcoded font-family
      if (/fontFamily\s*:/.test(line) && !/TYPE|FONT_FAMILY/.test(line) && !/@miguel\/design-system/.test(line)) {
        findings.push({ primary_id: "CS.HARDCODED-FONT", severity: "medium", file: relFile, line: i + 1, evidence: line.trim().slice(0, 120), message: "Hardcoded fontFamily — use TYPE tokens", recommended_fix: "Use TYPE.* token from @miguel/design-system/tokens" });
      }

      // CS.INVALID-TOKEN
      if (semanticKeys.size > 0) {
        const tokenRefs = [...line.matchAll(/\b(?:tokens|t)\.([\w]+)/g)];
        for (const [, key] of tokenRefs) {
          if (!semanticKeys.has(key) && !/^(?:toString|valueOf|constructor|hasOwnProperty)$/.test(key)) {
            findings.push({ primary_id: "CS.INVALID-TOKEN", severity: "medium", file: relFile, line: i + 1, evidence: `tokens.${key}`, message: `Token key "${key}" does not exist in the current registry`, recommended_fix: "Check for typos or use a valid semantic token key from useTokens()." });
          }
        }
      }

      // CS.PRIMITIVE-TOKEN
      for (const pat of PRIMITIVE_PATTERNS) {
        if (pat.test(line) && !/import/.test(line)) {
          const match = line.match(pat);
          findings.push({ primary_id: "CS.PRIMITIVE-TOKEN", severity: "medium", file: relFile, line: i + 1, evidence: match ? match[0] : line.trim().slice(0, 80), message: "Direct primitive color reference — use semantic token via useTokens()", recommended_fix: "Replace with a semantic token from useTokens()." });
        }
      }
    }
  }

  const summary = {
    blocker: findings.filter((f) => f.severity === "blocker").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
    total: findings.length,
  };

  // Apply waivers — separate active from waived findings
  const activeFindings = [];
  const waivedFindings = [];

  for (const f of findings) {
    const waiver = matchWaiver(consumerActiveWaivers, project.name, f);
    if (waiver) {
      waivedFindings.push({ ...f, waiver_reason: waiver.reason, waiver_expires: waiver.expires });
    } else {
      activeFindings.push(f);
    }
  }

  const activeSummary = {
    blocker: activeFindings.filter((f) => f.severity === "blocker").length,
    high: activeFindings.filter((f) => f.severity === "high").length,
    medium: activeFindings.filter((f) => f.severity === "medium").length,
    low: activeFindings.filter((f) => f.severity === "low").length,
    total: activeFindings.length,
  };

  const waivedSummary = {
    blocker: waivedFindings.filter((f) => f.severity === "blocker").length,
    high: waivedFindings.filter((f) => f.severity === "high").length,
    medium: waivedFindings.filter((f) => f.severity === "medium").length,
    low: waivedFindings.filter((f) => f.severity === "low").length,
    total: waivedFindings.length,
  };

  // Status is derived from ACTIVE (unwaived) findings only
  project.status = deriveStatus(activeSummary, true);
  project.source_files = sourceFiles.length;
  project.imports = importCounts;
  project.findings = activeFindings;
  project.waived_findings = waivedFindings;
  project.summary = activeSummary;
  project.waived_summary = waivedSummary;
  project.total_raw_findings = summary;

  scannedProjects.push(project);

  // Console output
  console.log(`  Status: ${project.status}`);
  console.log(`  Files scanned: ${sourceFiles.length}`);
  console.log(`  Imports: ${JSON.stringify(importCounts)}`);
  console.log(`  Active findings: ${activeSummary.total} (${activeSummary.blocker}B ${activeSummary.high}H ${activeSummary.medium}M ${activeSummary.low}L)`);
  console.log(`  Waived findings: ${waivedSummary.total}`);
  for (const f of activeFindings) {
    console.log(`    ${f.severity.toUpperCase().padEnd(7)} ${f.primary_id} ${f.file}:${f.line} — ${f.message}`);
  }
  for (const f of waivedFindings) {
    console.log(`    WAIVED  ${f.primary_id} ${f.file}:${f.line} — ${f.waiver_reason}`);
  }
  console.log();
}

// ── 3. Write report ──
// Aggregate waivers across all consumers (each owns its own file) for the summary.
const expiredWaivers = allWaivers.filter(isExpired);
const activeWaivers = allWaivers.filter((w) => w.status === "active" && !isExpired(w));

const outputDir = path.join(ROOT, "docs/audits");
fs.mkdirSync(outputDir, { recursive: true });

const activeProjects = scannedProjects.filter((p) => !["not-installed", "unknown"].includes(p.status));
const versionDrift = activeProjects.filter((p) => p.dependency_range && !p.dependency_range.includes(dsVersion)).length;

const output = {
  generated_at: new Date().toISOString(),
  design_system_version: dsVersion,
  total_projects: scannedProjects.length,
  active_consumers: activeProjects.length,
  clean_count: scannedProjects.filter((p) => p.status === "clean").length,
  warning_count: scannedProjects.filter((p) => p.status === "warning").length,
  needs_review_count: scannedProjects.filter((p) => p.status === "needs-review").length,
  blocked_count: scannedProjects.filter((p) => p.status === "blocked").length,
  version_drift: versionDrift,
  waivers: {
    active: activeWaivers.length,
    expired: expiredWaivers.length,
    applied: scannedProjects.reduce((n, p) => n + (p.waived_summary?.total ?? 0), 0),
  },
  projects: scannedProjects.map(({ _fullPath, ...rest }) => rest),
};

// Idempotent write (2026-08-02): only rewrite when the RESULT changed, ignoring `generated_at` (pure
// run provenance). Previously this rewrote the artifact on every run, dirtying the tree for nothing.
const __w = writeJsonIfChanged(path.join(outputDir, "consumer-sync-latest.json"), output, ["generated_at"]);
if (__w.skipped) console.log("[consumer-sync] unchanged - artifact not rewritten");

// ── 4. Console summary ──
console.log("── Summary ──");
console.log(`Design system version: ${dsVersion}`);
console.log(`Projects scanned: ${scannedProjects.length}`);
console.log(`Active consumers: ${activeProjects.length}`);
console.log(`  Clean: ${output.clean_count}`);
console.log(`  Warning: ${output.warning_count}`);
console.log(`  Needs review: ${output.needs_review_count}`);
console.log(`  Blocked: ${output.blocked_count}`);
console.log(`  Version drift: ${versionDrift}`);
console.log(`Waivers: ${output.waivers.active} active, ${output.waivers.expired} expired, ${output.waivers.applied} applied`);
if (expiredWaivers.length > 0) {
  console.log(`  ⚠ Expired waivers:`);
  for (const w of expiredWaivers) {
    console.log(`    ${w.project} / ${w.finding_id} / ${w.file} — expired ${w.expires}`);
  }
}
console.log();
console.log(`Report written to docs/audits/consumer-sync-latest.json`);

// ── 5. Write Markdown summary (for GitHub Actions $GITHUB_STEP_SUMMARY) ──
if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    `## Consumer Sync Report`,
    ``,
    `**Design system:** v${dsVersion}`,
    `**Generated:** ${output.generated_at}`,
    ``,
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Projects scanned | ${scannedProjects.length} |`,
    `| Active consumers | ${activeProjects.length} |`,
    `| Clean | ${output.clean_count} |`,
    `| Warning | ${output.warning_count} |`,
    `| Needs review | ${output.needs_review_count} |`,
    `| Blocked | ${output.blocked_count} |`,
    `| Version drift | ${versionDrift} |`,
    `| Active waivers | ${output.waivers.active} |`,
    `| Expired waivers | ${output.waivers.expired} |`,
    `| Waived findings | ${output.waivers.applied} |`,
    ``,
  ];

  if (activeProjects.length > 0) {
    md.push(`### Projects`);
    md.push(``);
    md.push(`| Project | Version Range | Status | Active | Waived |`);
    md.push(`|---------|---------------|--------|--------|--------|`);
    for (const p of scannedProjects) {
      const statusEmoji = { clean: "✅", warning: "⚠️", "needs-review": "🔍", blocked: "🚫", "not-installed": "➖", unknown: "❓" }[p.status] ?? "";
      md.push(`| ${p.name} | ${p.dependency_range ?? "—"} | ${statusEmoji} ${p.status} | ${p.summary?.total ?? 0} | ${p.waived_summary?.total ?? 0} |`);
    }
    md.push(``);
  }

  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join("\n") + "\n");
}
