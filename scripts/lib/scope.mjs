// ═══════════════════════════════════════════════════════════════════════════════════
// Is this change component-local, or system-wide? — Milestone 7, step 2.
//
//   node scripts/detect-scope.mjs                 # HEAD~1..HEAD
//   node scripts/detect-scope.mjs --base main     # main..HEAD
//   node scripts/detect-scope.mjs --staged        # what is staged right now
//   node scripts/detect-scope.mjs --json          # machine-readable, for CI
//
// SANDBOX-SPEC §5.7: "Detected mechanically: if the proposed fix touches `tokens/` or
// `src/ui/`, it is system-scoped. If it touches only the sandbox component, it is
// component-local. NO AGENT DECIDES THIS."
//
// That last sentence is the whole point, and it is why this is a path-matching script and
// not a prompt. P5 is the problem it exists for: the font-family change and the entire
// Fluent icon migration both came out of Rail Sidebar work, and nothing marked prior
// verification stale when they landed. An agent asked "is this system-wide?" mid-task,
// with a component to finish, is exactly the wrong judge.
//
// ── Where this deviates from the spec's literal wording, and why ────────────────────
// The spec names two paths. Implementing only those would classify a change to
// `src/lib/action-icons.tsx` as component-local — and CLAUDE.md checklist item 15 records
// what a change there actually did: it silently stopped EVERY icon in the system filling
// on hover in production builds, while passing every dev-server check. That is as
// system-wide as a change gets.
//
// So the rule set below is wider than the spec's two examples. This is a judgement about
// the RULE, made once, recorded, and applied mechanically forever after — which is a
// different thing from the per-change judgement §5.7 forbids. Each entry carries the
// evidence that put it there. Nothing was added because it "felt" system-wide.
//
// The opposite failure is real too (§9's over-ceremony risk): a rule set so wide that
// every change escalates makes escalation meaningless. Tooling that cannot alter what a
// consumer renders — `db/`, `mcp/`, `scripts/`, `sandbox/`, `site/`, `origin/` — is
// deliberately NOT here.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * Paths whose change is system-scoped, each with the reason it qualifies.
 *
 * `why` is not decoration: when this script escalates a change, the reason is what the
 * author reads, and "matched a glob" would tell them nothing about why it matters.
 */
export const SYSTEM_PATHS = [
  {
    prefix: "tokens/",
    why: "token source — every component's colour, spacing and radius resolves through it",
    source: "SANDBOX-SPEC §5.7, named explicitly",
  },
  {
    prefix: "src/ui/",
    why: "the shipped primitives — a change here reaches every consumer that imports one",
    source: "SANDBOX-SPEC §5.7, named explicitly",
  },
  {
    prefix: "src/lib/",
    why: "shared mechanisms every primitive routes through, e.g. the action-icon fill system",
    source:
      "CLAUDE.md checklist item 15: a change to src/lib/action-icons.tsx silently stopped every icon filling on hover in PRODUCTION builds, while passing every dev-server check",
  },
  {
    prefix: "src/styles/",
    why: "the stylesheet every consumer imports, including the Tailwind entry and the token layer",
    source: "CLAUDE.md: `src/styles/system.css` pins `source(none)` plus one explicit `@source`",
  },
  {
    prefix: "src/hooks/",
    why: "shared hooks primitives depend on for behaviour, not just styling",
    source: "same reasoning as src/lib — a shared mechanism with no single owning component",
  },
  {
    path: "src/index.ts",
    why: "the export surface — renaming or dropping an export breaks consumers at build time",
    source: "it is the package's public API; dist/ is generated from it",
  },
  {
    path: "icons/manifest.json",
    why: "the icon authoring source — one entry changes that icon everywhere it is used",
    source: "CLAUDE.md iconography protocol: the manifest is the ONLY place icon mappings are authored",
  },
]

/**
 * Classifies a list of repo-relative paths.
 *
 * Pure and exported so it can be tested against synthetic inputs without a git history —
 * the classification rule is the thing worth testing, and it should not need a repository
 * in a particular state to exercise it.
 */
/**
 * Every `System-Change: SC-nn` reference declared across a set of commit messages.
 *
 * A TRAILER, not a mention: the match is anchored to the start of a line, so prose that
 * happens to discuss "System-Change: SC-12" in the middle of a sentence does not satisfy the
 * gate. That distinction is the whole value of the convention — a reference that can be
 * satisfied by talking about one is not a reference.
 *
 * Case-insensitive on the key, because `system-change:` and `System-Change:` are the same
 * intent and failing CI over capitalisation would teach people the gate is arbitrary. The
 * `SC-` prefix itself is matched exactly, since that is a real identifier from
 * `sandbox.system_change.ref_code` rather than a word.
 *
 * Lives here rather than in `detect-scope.mjs` for the reason stated at the top of that file:
 * the rule belongs in the module, the command belongs in the script, and a rule that only
 * exists inside a CLI cannot be tested without running a program.
 */
export function findSystemChangeRefs(messages) {
  const refs = new Set()
  for (const message of messages) {
    for (const match of String(message).matchAll(/^[ \t]*System-Change:[ \t]*(SC-\d+)/gim)) {
      refs.add(match[1])
    }
  }
  return [...refs].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))
}

export function classifyPaths(paths) {
  const matches = []
  for (const path of paths) {
    const normalised = String(path).replace(/\\/g, "/")
    for (const rule of SYSTEM_PATHS) {
      const hit = rule.prefix ? normalised.startsWith(rule.prefix) : normalised === rule.path
      if (hit) {
        matches.push({ path: normalised, rule })
        break
      }
    }
  }
  return {
    scope: matches.length > 0 ? "system" : "component",
    matches,
    // Ready to become `system_change.affected_paths`, whose own column comment reads
    // "JSON array of path globs this change touches. Drives the staleness sweep."
    affectedPaths: [...new Set(matches.map((m) => (m.rule.prefix ? `${m.rule.prefix}**` : m.rule.path)))].sort(),
    componentPaths: paths.filter((p) => !matches.some((m) => m.path === String(p).replace(/\\/g, "/"))),
  }
}
