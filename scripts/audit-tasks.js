// Task brief/verifier audit — the execution contract gate.
//
// Scans tasks/ for any TASK.md file whose status is not "draft" or "done"
// and checks that the required brief and verifier artifacts are present
// alongside it. A task that is ACCEPTED, IN_PROGRESS, or equivalent is
// a non-trivial task under the kernel contract:
//   - medium/large tasks MUST have a TASK_BRIEF.md in the same folder
//   - tasks marked IN_PROGRESS or ACCEPTED MUST have a VERIFIER.md or
//     VERIFIER_CHECKLIST.md present (either in the task folder or the root
//     process/ templates must be explicitly referenced inside TASK_BRIEF.md)
//
// Severity mapping:
//   BLOCKER — TASK.md exists, status is active, and no brief artifact or
//             verifier reference can be found.
//   HIGH    — TASK_BRIEF.md present but VERIFIER artifact is missing.
//   LOW     — active task uses legacy inline heading forms, or unknown status.
//   INFO    — Task is draft/done — skipped.
//
// Exit non-zero on any BLOCKER so `npm run health` fails loudly.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonIfChanged } from "./lib/audit-core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TASKS_DIR = path.join(ROOT, "tasks");
const AUDITS_DIR = path.join(ROOT, "docs/audits");

// Statuses that require the full brief+verifier contract.
const ACTIVE_STATUSES = ["accepted", "in_progress", "in-progress", "open", "started", "pending"];
// Statuses that are exempt.
const EXEMPT_STATUSES = ["draft", "done", "closed", "cancelled", "canceled", "completed"];

function extractStatus(content) {
  const m = content.match(/\*\*Status:\*\*\s*`?([A-Z_-]+)`?/i);
  return m ? m[1].trim().toLowerCase() : null;
}

function isActive(status) {
  if (!status) return false;
  return ACTIVE_STATUSES.some((s) => status.startsWith(s));
}

function isExempt(status) {
  if (!status) return false;
  return EXEMPT_STATUSES.some((s) => status.startsWith(s));
}

function hasSectionHeading(content, headingText) {
  const pattern = new RegExp(`^#{2,4}\\s*${headingText}\\s*$`, "im");
  return pattern.test(content);
}

// Check whether a task folder has a brief artifact.
function hasBrief(taskDir, taskContent) {
  const briefFile = path.join(taskDir, "TASK_BRIEF.md");
  if (fs.existsSync(briefFile)) return { found: true, via: "TASK_BRIEF.md", mode: "artifact" };
  // Inline brief is accepted only when there is an explicit section marker.
  // This avoids false positives from historical docs that casually mention AC-1.
  if (hasSectionHeading(taskContent, "Task Brief")) {
    return { found: true, via: "inline brief section in TASK.md", mode: "inline-canonical" };
  }
  if (hasSectionHeading(taskContent, "Acceptance Criteria")) {
    return { found: true, via: "inline brief section in TASK.md", mode: "inline-legacy" };
  }
  return { found: false };
}

// Check whether a task folder has a verifier artifact or reference.
function hasVerifier(taskDir, taskContent) {
  for (const name of ["VERIFIER.md", "VERIFIER_CHECKLIST.md", "VERIFY.md"]) {
    if (fs.existsSync(path.join(taskDir, name))) return { found: true, via: name, mode: "artifact" };
  }
  if (hasSectionHeading(taskContent, "Verification")) {
    return { found: true, via: "inline verifier section in TASK.md", mode: "inline-canonical" };
  }
  if (hasSectionHeading(taskContent, "Verifier")) {
    return { found: true, via: "inline verifier section in TASK.md", mode: "inline-legacy" };
  }
  return { found: false };
}

const findings = [];
let taskCount = 0;
let activeCount = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(abs);
    } else if (entry.name === "TASK.md") {
      taskCount++;
      const content = fs.readFileSync(abs, "utf-8");
      const status = extractStatus(content);
      const rel = path.relative(ROOT, abs);

      if (isExempt(status)) {
        console.log(`  ○ ${rel}  [${status}] — exempt`);
        continue;
      }

      if (!isActive(status)) {
        // Unknown status — treat as active/warn
        console.log(`  ? ${rel}  [${status ?? "unknown"}] — status not recognised, treating as active`);
        findings.push({
          level: "low",
          file: rel,
          msg: `task status '${status ?? "unknown"}' is not recognised; treating as active for safety`,
        });
      }

      activeCount++;
      const taskDir = path.dirname(abs);
      const { found: briefFound, via: briefVia, mode: briefMode } = hasBrief(taskDir, content);
      const { found: verifierFound, via: verifierVia, mode: verifierMode } = hasVerifier(taskDir, content);

      if (!briefFound) {
        findings.push({
          level: "blocker",
          file: rel,
          msg: `active task (${status}) has no Task Brief — create TASK_BRIEF.md or add a dedicated 'Task Brief'/'Acceptance Criteria' heading in TASK.md`,
        });
      }
      if (!verifierFound) {
        const level = briefFound ? "high" : "blocker";
        findings.push({
          level,
          file: rel,
          msg: `active task (${status}) has no Verifier artifact — add VERIFIER.md/VERIFIER_CHECKLIST.md or a dedicated 'Verifier'/'Verification' heading in TASK.md before marking done`,
        });
      }

      if (briefFound && briefVia && briefMode === "inline-legacy") {
        findings.push({
          level: "low",
          file: rel,
          msg: `active task (${status}) uses legacy inline heading 'Acceptance Criteria' for brief — prefer canonical 'Task Brief' heading`,
        });
      }

      if (verifierFound && verifierVia && verifierMode === "inline-legacy") {
        findings.push({
          level: "low",
          file: rel,
          msg: `active task (${status}) uses legacy inline heading 'Verifier' — prefer canonical 'Verification' heading`,
        });
      }

      const pass = briefFound && verifierFound;
      const tag = pass ? "✓" : findings.some((f) => f.level === "blocker" && f.file === rel) ? "✗" : "⚠";
      console.log(
        `  ${tag} ${rel}  [${status ?? "active"}]` +
          (briefFound ? `  brief: ${briefVia}` : "  brief: MISSING") +
          (verifierFound ? `  verifier: ${verifierVia}` : "  verifier: MISSING"),
      );
    }
  }
}

console.log(`[task-audit] scanning tasks/ for brief + verifier compliance`);
scanDir(TASKS_DIR);

if (taskCount === 0) {
  console.log("  (no TASK.md files found — nothing to check)");
}

const blockers = findings.filter((f) => f.level === "blocker").length;
const high = findings.filter((f) => f.level === "high").length;
const low = findings.filter((f) => f.level === "low").length;

for (const f of findings) {
  console.log(`    [${f.level}] ${f.file}: ${f.msg}`);
}

try {
  fs.mkdirSync(AUDITS_DIR, { recursive: true });
  // Idempotent write (2026-08-02): only rewrite when the RESULT changed. This hand-written artifact
  // previously rewrote LF bytes over a CRLF checkout on every run, which git reports as " M" while
  // `git diff` shows nothing - invisible, non-self-healing dirt. See writeJsonIfChanged in audit-core.
  const __w = writeJsonIfChanged(
    path.join(AUDITS_DIR, "task-audit-latest.json"),
    {
      summary: { blocker: blockers, high, low, tasks: taskCount, active: activeCount },
      findings,
    },
  );
  if (__w.skipped) console.log("[task-audit] unchanged - artifact not rewritten");
} catch {
  // non-fatal
}

console.log(
  blockers
    ? `\n✗ task-audit: ${blockers} blocker(s), ${high} high, ${low} low`
    : `\n✓ task-audit: passed (${activeCount} active task(s) checked, ${high} high, ${low} low)`,
);
process.exit(blockers ? 1 : 0);
