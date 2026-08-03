import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonIfChanged } from "./lib/audit-core.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDITS_DIR = path.join(ROOT, "docs/audits");

const REQUIRED_REFS = [
  {
    file: "CLAUDE.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: "AGENTS.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/session-start/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/create-wave/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/evidence-wave/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/deploy-wave/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/figma-build/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/evidence-pipeline/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
  {
    file: ".claude/skills/smell/SKILL.md",
    patterns: [
      "docs/process/SPEC_KERNEL_COMPACT.md",
      "docs/process/TASK_BRIEF_TEMPLATE.md",
      "docs/process/VERIFIER_CHECKLIST.md",
    ],
  },
];

const findings = [];

for (const { file, patterns } of REQUIRED_REFS) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) {
    findings.push({ level: "blocker", file, msg: "required file is missing" });
    continue;
  }
  const content = fs.readFileSync(abs, "utf-8");
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      findings.push({ level: "blocker", file, msg: `missing required kernel reference: ${pattern}` });
    }
  }
}

let blockers = findings.filter((f) => f.level === "blocker").length;

console.log("[kernel-audit] checking compact-kernel integration");
if (!findings.length) {
  console.log("  ✓ kernel integration references present in startup and wave entry points");
} else {
  for (const finding of findings) {
    console.log(`  ✗ ${finding.file}`);
    console.log(`      [${finding.level}] ${finding.msg}`);
  }
}

try {
  fs.mkdirSync(AUDITS_DIR, { recursive: true });
  // Idempotent write (2026-08-02): only rewrite when the RESULT changed. This hand-written artifact
  // previously rewrote LF bytes over a CRLF checkout on every run, which git reports as " M" while
  // `git diff` shows nothing - invisible, non-self-healing dirt. See writeJsonIfChanged in audit-core.
  const __w = writeJsonIfChanged(
    path.join(AUDITS_DIR, "kernel-audit-latest.json"),
    { summary: { blocker: blockers, high: 0, files: REQUIRED_REFS.length } },
  );
  if (__w.skipped) console.log("[kernel-audit] unchanged - artifact not rewritten");
} catch {
  // non-fatal
}

console.log(blockers ? `\n✗ kernel-audit: ${blockers} blocker(s)` : "\n✓ kernel-audit: passed");
process.exit(blockers ? 1 : 0);