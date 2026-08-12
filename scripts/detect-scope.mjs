// ═══════════════════════════════════════════════════════════════════════════════════
// Is this change component-local, or system-wide? — Milestone 7, step 2.
//
//   node scripts/detect-scope.mjs                 # HEAD~1..HEAD
//   node scripts/detect-scope.mjs --base main     # main...HEAD
//   node scripts/detect-scope.mjs --staged        # what is staged right now
//   node scripts/detect-scope.mjs --json          # machine-readable, for CI
//
// The RULE lives in scripts/lib/scope.mjs; this file is only the command around it. They
// are separate because importing a module should never run a program: the first version
// of this had both in one file, and `check-scope-detection.mjs` importing the classifier
// executed the CLI, printed a diff report, and called process.exit() before a single
// assertion ran. The test appeared to pass by printing nothing.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { classifyPaths } from "./lib/scope.mjs"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const staged = args.includes("--staged")
const baseIndex = args.indexOf("--base")
const base = baseIndex >= 0 ? args[baseIndex + 1] : null

function changedPaths() {
  const git = (...a) => execFileSync("git", a, { cwd: REPO_ROOT }).toString().trim()
  if (staged) return git("diff", "--name-only", "--cached").split("\n").filter(Boolean)
  if (base) {
    // Three-dot: what THIS branch changed since it diverged, not everything that landed on
    // the base meanwhile. Two-dot would escalate a change someone else made.
    return git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean)
  }
  return git("diff", "--name-only", "HEAD~1..HEAD").split("\n").filter(Boolean)
}

const paths = changedPaths()
const result = classifyPaths(paths)

if (asJson) {
  console.log(JSON.stringify({ ...result, changedFiles: paths.length }, null, 2))
} else {
  const range = staged ? "staged changes" : base ? `${base}...HEAD` : "HEAD~1..HEAD"
  console.log(`\n${paths.length} changed file(s) in ${range}\n`)

  if (result.scope === "component") {
    console.log("  scope: COMPONENT-LOCAL")
    console.log("  Nothing touched here reaches beyond the component being worked on.")
  } else {
    console.log("  scope: SYSTEM-WIDE\n")
    // Grouped by rule so the reason is stated once rather than repeated per file.
    const byRule = new Map()
    for (const m of result.matches) {
      const key = m.rule.prefix ?? m.rule.path
      if (!byRule.has(key)) byRule.set(key, { rule: m.rule, files: [] })
      byRule.get(key).files.push(m.path)
    }
    for (const [key, { rule, files }] of byRule) {
      console.log(`  ${key}`)
      console.log(`    ${rule.why}`)
      console.log(`    (${rule.source})`)
      for (const f of files) console.log(`      ${f}`)
      console.log("")
    }
    console.log(`  affected_paths: ${JSON.stringify(result.affectedPaths)}`)
    console.log(
      "\n  This change needs a system_change record. Landing it without one is how the font\n" +
        "  change and the Fluent migration invalidated verified work with nothing noticing.",
    )
  }
}

// Exit code carries the classification so CI can branch on it without parsing output:
//   0 = component-local, 10 = system-wide.
// Not 1 — a system-wide change is a correct, expected outcome, not a failure, and giving
// it the generic error code would make a working detection indistinguishable from a
// crashed script.
process.exit(result.scope === "system" ? 10 : 0)
