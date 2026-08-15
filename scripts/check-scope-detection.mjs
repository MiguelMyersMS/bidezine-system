// ═══════════════════════════════════════════════════════════════════════════════════
// Scope detection classifies correctly — Milestone 7, step 2's proof.
//
//   node scripts/check-scope-detection.mjs
//
// Runs against SYNTHETIC path lists rather than real git history, deliberately: the thing
// worth testing is the rule, and a test that needed the repository in a particular state
// would break every time someone committed something. It also means the cases that matter
// most — the ones that have never happened yet — can be exercised at all.
//
// Every case below is drawn from something this project actually did. The two that matter
// most are the near-misses: a change that LOOKS component-local but is not, and a change
// that looks alarming but genuinely is local. A detector that only recognises the obvious
// cases would have missed both of the real incidents (P5) that M7 exists for.
// ═══════════════════════════════════════════════════════════════════════════════════

import { classifyPaths, findSystemChangeRefs } from "./lib/scope.mjs"

const results = []
const check = (ok, label, note = "") => {
  results.push(ok)
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const scopeOf = (paths) => classifyPaths(paths).scope

console.log("\nthe two the spec names\n")

check(scopeOf(["tokens/base.tokens.json"]) === "system", "a token change is system-wide")
check(scopeOf(["src/ui/button.tsx"]) === "system", "a primitive change is system-wide")

console.log("\nthe real incidents this exists for\n")

// CLAUDE.md item 15. The literal reading of §5.7 would have called this component-local.
check(
  scopeOf(["src/lib/action-icons.tsx"]) === "system",
  "a change to the shared icon-fill mechanism is system-wide",
  "item 15: it silently stopped EVERY icon filling on hover in production while passing every dev check",
)

// The Fluent icon migration — one of the two changes named in P5.
check(
  scopeOf(["icons/manifest.json"]) === "system",
  "an icon manifest change is system-wide",
  "the manifest is the only place icon mappings are authored; one entry changes that icon everywhere",
)

// The font-family change — the other change named in P5.
check(
  scopeOf(["src/styles/system.css"]) === "system",
  "a stylesheet change is system-wide",
  "every consumer imports it",
)

console.log("\ncomponent-local work stays local\n")

check(
  scopeOf(["sandbox/src/components/FunctionalRailSidebar.tsx"]) === "component",
  "working on the sandbox component is component-local",
)
check(scopeOf(["site/src/routes/components/ButtonShowcase.tsx"]) === "component", "showcase-site work is component-local")
check(
  scopeOf(["origin/rail-sidebar/app/src/design-system/gallery/RailNav.tsx"]) === "component",
  "quarantined origin material is component-local",
  "it is structurally incapable of reaching a consumer — that is the whole point of the quarantine",
)
check(
  scopeOf(["db/migrations/010_divergence_declaration.sql", "mcp/server.mjs", "verifier/run-checks.mjs"]) === "component",
  "tooling changes do not escalate",
  "over-broad detection makes escalation meaningless (§9's over-ceremony risk)",
)

console.log("\nmixed and edge cases\n")

// The commit shape that caused P5 in the first place: component work that quietly carries
// a primitive change along with it.
const mixed = classifyPaths([
  "sandbox/src/components/FunctionalRailSidebar.tsx",
  "sandbox/src/data/rail-sidebar.ts",
  "src/ui/button.tsx",
])
check(mixed.scope === "system", "one system file among many component files still escalates")
check(
  mixed.componentPaths.length === 2 && mixed.matches.length === 1,
  "and it separates which files were which",
  `${mixed.matches.length} system, ${mixed.componentPaths.length} component`,
)

check(scopeOf([]) === "component", "an empty diff is component-local, not an error")

// A path that merely CONTAINS a system directory name must not match. `sandbox/src/ui/`
// would be a component's own folder, not the design system's.
check(
  scopeOf(["sandbox/src/ui/something.tsx"]) === "component",
  "a path that merely contains 'src/ui/' deeper down does not match",
  "prefix matching is anchored at the repo root, so sandbox/src/ui/ is not src/ui/",
)

check(
  scopeOf(["src/index.ts"]) === "system",
  "the export surface is system-wide",
  "renaming or dropping an export breaks consumers at build time",
)
check(
  scopeOf(["src/tokens.ts"]) === "component",
  "a GENERATED file is not treated as source",
  "src/tokens.ts is emitted from tokens/ and gitignored; the real change is in tokens/",
)

console.log("\nthe output feeds system_change directly\n")

const forRecord = classifyPaths(["tokens/base.tokens.json", "src/ui/button.tsx", "src/ui/badge.tsx"])
check(
  JSON.stringify(forRecord.affectedPaths) === JSON.stringify(["src/ui/**", "tokens/**"]),
  "affected_paths is de-duplicated and ready to store",
  JSON.stringify(forRecord.affectedPaths),
)
check(
  forRecord.matches.every((m) => m.rule.why && m.rule.source),
  "every match carries the reason it qualified, not just the fact that it did",
)

console.log("\nthe System-Change trailer — and what only looks like one\n")

// The workflow now BLOCKS a system-scope change that names no system change, and what counts
// as naming one is this function. A gate whose admission rule has never been tested is a gate
// that has never been tested.
const trailerCases = [
  ["a trailer is found", ["fix\n\nSystem-Change: SC-12"], ["SC-12"]],
  ["the key is case-insensitive — CI must not fail over capitalisation", ["x\n\nsystem-change: SC-3"], ["SC-3"]],
  ["leading whitespace is tolerated", ["x\n\n  System-Change: SC-9"], ["SC-9"]],
  [
    "refs are collected across commits and sorted numerically, not as strings",
    ["a\n\nSystem-Change: SC-12", "b\n\nSystem-Change: SC-2"],
    ["SC-2", "SC-12"],
  ],
  ["the same ref in two commits is one ref", ["a\n\nSystem-Change: SC-4", "b\n\nSystem-Change: SC-4"], ["SC-4"]],
  // The one that matters: a reference you can satisfy by TALKING about one is not a reference.
  ["a prose mention mid-sentence does NOT satisfy the gate", ["we discussed System-Change: SC-12 at length"], []],
  ["an ordinary commit declares nothing", ["ordinary commit"], []],
  ["a malformed id is not a reference", ["x\n\nSystem-Change: SC-abc"], []],
]
for (const [label, messages, expected] of trailerCases) {
  const got = findSystemChangeRefs(messages)
  check(JSON.stringify(got) === JSON.stringify(expected), label, JSON.stringify(got))
}

const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} checks passed.`)
process.exit(failed ? 1 : 0)
