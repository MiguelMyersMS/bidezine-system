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
import { classifyPaths, findSystemChangeRefs } from "./lib/scope.mjs"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const staged = args.includes("--staged")
const baseIndex = args.indexOf("--base")
const base = baseIndex >= 0 ? args[baseIndex + 1] : null
const requireRecord = args.includes("--require-record")

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

// ── --require-record: the gate this script was always meant to become ───────────────
// The workflow around this has reported and never blocked since M7, and said why in its own
// header: steps 3 and 5 did not exist, and "a gate that blocked with nowhere to route the
// escalation would just teach people to bypass it." Correct then. They exist now, and the
// exemption was never revisited — which is CLAUDE.md checklist item 19 exactly, at CI level.
//
// What is checked is a `System-Change: SC-nn` trailer on a commit in the range, NOT a live
// database lookup. CI has no database credential, and giving it one to answer a yes/no
// question would be a much larger change than this deserves. The trailer is offline-checkable,
// greppable forever after, and — this is the part that matters — it gives an author a ROUTE
// rather than a wall: the failure message names the tool that files the record.
//
// One trailer covers the range rather than every commit in it. A single system change
// legitimately spans several commits, and demanding the trailer on each would push authors
// toward one giant commit to satisfy CI, which is worse for review than the thing being
// prevented.
//
// A trailer is an assertion, not proof: nothing here confirms SC-7 exists or is related. It
// is the same class of claim as `decided_by` and the machine name, and it is disclosed for
// the same reason. `usp_land_system_change` is what can verify it afterwards, and it can only
// do that if the reference was written down at all.
if (requireRecord && result.scope === "system") {
  const git = (...a) => execFileSync("git", a, { cwd: REPO_ROOT }).toString()
  const range = staged ? null : base ? `${base}...HEAD` : "HEAD~1..HEAD"
  const messages = range ? git("log", "--format=%B%x00", range).split("\0") : [git("log", "-1", "--format=%B")]
  const refs = findSystemChangeRefs(messages)

  if (refs.length) {
    console.log(`\n  System-Change: ${refs.join(", ")} — declared. CI does not verify the record exists;`)
    console.log("  usp_land_system_change does, and it can only do that because the reference is written down.")
    process.exit(0)
  }

  console.log("\n  BLOCKED — this change is system-wide and names no system change.\n")
  console.log("  Add a trailer to a commit message in this range:\n")
  console.log("      System-Change: SC-12\n")
  console.log("  If no record exists yet, file one first — sandbox_propose_system_change over MCP, or")
  console.log("  sandbox.usp_propose_system_change directly — then assess it. Pass the affected_paths")
  console.log(`  above verbatim: ${JSON.stringify(result.affectedPaths)}`)
  console.log("  The staleness sweep has nothing to match on without them, which is the whole point of")
  console.log("  recording it: everything already verified under these paths needs re-checking.")
  process.exit(1)
}

// Exit code carries the classification so CI can branch on it without parsing output:
//   0 = component-local, 10 = system-wide.
// Not 1 — a system-wide change is a correct, expected outcome, not a failure, and giving
// it the generic error code would make a working detection indistinguishable from a
// crashed script.
process.exit(result.scope === "system" ? 10 : 0)
