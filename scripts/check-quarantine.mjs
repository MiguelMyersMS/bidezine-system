// ═══════════════════════════════════════════════════════════════════════════════════
// The origin quarantine boundary, as an executable rule.
//
//   node scripts/check-quarantine.mjs
//
// Exits non-zero — and therefore fails the build it is wired into — if any bidezine
// application source imports origin material, or if the two sides of the origin embed
// contract have drifted apart.
//
// SANDBOX-SPEC invariant 6: "Origin material is quarantined. It renders in isolation and
// is never importable." Invariant 8: "Prose that keeps being violated becomes executable."
// This file is the second one applied to the first.
//
// ── Why a script rather than an ESLint rule ──────────────────────────────────────────
// The repo has no ESLint anywhere; introducing that toolchain for a single rule would be
// disproportionate, and SANDBOX-SPEC §9 already names grep-based CI checks as legitimate
// enforcement alongside custom lint rules. What matters is the property — a crossing
// import fails the build — not which tool notices.
//
// ── Why a checker at all, when the boundary is already structural ────────────────────
// `origin/rail-sidebar/app/` is its own npm + TypeScript project, so an import from
// `sandbox/` reaching into it does not resolve and the build would fail regardless. This
// script exists for the failures that would NOT announce themselves that way:
//
//   · a relative `../../origin/...` climb out of an app directory, which resolves fine
//     on disk and would quietly compile origin source back into the app's bundle;
//   · origin material being copied back under an app's own `src/`, which is precisely
//     the state this work removed (`sandbox/src/reference/origin-design-system/`);
//   · the two duplicated halves of the embed contract drifting apart, which breaks the
//     origin pane silently at runtime with no build error at all.
//
// The failure it is proven against is the first: adding a deliberate crossing import and
// watching this fail. See HANDOFF.md.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** The quarantine itself. Nothing in GUARDED_TREES may reach into this. */
const QUARANTINE = join(REPO_ROOT, "origin")

/**
 * Every tree that ships, or compiles into something that ships. `sandbox/` is included even though
 * it is a local dev tool: CLAUDE.md's "no hand-rolled components" rule is explicitly not waived for
 * sandbox tooling, and neither is this.
 */
const GUARDED_TREES = ["src", "site/src", "sandbox/src", "scripts", "verifier", "db", "mcp"]

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"])
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", "public"])

/**
 * Import/require/dynamic-import specifiers. Deliberately syntactic rather than a real parser: the
 * check must run with zero dependencies, and a specifier is a string literal in every form below.
 */
const SPECIFIER_PATTERNS = [
  /\bfrom\s*["']([^"']+)["']/g, //            import x from "..."  /  export x from "..."
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // import("...")
  /\bimport\s*["']([^"']+)["']/g, //          import "..."  (side-effect)
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, // require("...")
]

/** Specifiers that name the quarantine by path, however they are spelled. */
const BY_NAME = [
  { test: (s) => s.startsWith("@/reference/"), why: "the '@/reference/*' alias origin material used to live behind" },
  { test: (s) => /(^|\/)origin-design-system(\/|$)/.test(s), why: "the origin design-system tree" },
  { test: (s) => /(^|\/)origin\/rail-sidebar(\/|$)/.test(s), why: "the origin quarantine directory" },
]

const violations = []

function walk(dir, onFile) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return // a guarded tree that does not exist yet is not a violation
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, onFile)
    else if (SOURCE_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))) onFile(full)
  }
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length
}

function checkFile(file) {
  const source = readFileSync(file, "utf8")
  for (const pattern of SPECIFIER_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1]
      const named = BY_NAME.find((rule) => rule.test(specifier))
      if (named) {
        violations.push({ file, line: lineOf(source, match.index), specifier, why: named.why })
        continue
      }
      // A relative climb that lands inside origin/ resolves perfectly well on disk and would
      // compile origin source straight into the app's bundle. This is the case a name-based check
      // alone would miss entirely.
      if (specifier.startsWith(".")) {
        const resolved = resolve(dirname(file), specifier)
        if (resolved === QUARANTINE || resolved.startsWith(QUARANTINE + sep)) {
          violations.push({
            file,
            line: lineOf(source, match.index),
            specifier,
            why: "a relative path that resolves inside the origin quarantine",
          })
        }
      }
    }
  }
}

for (const tree of GUARDED_TREES) walk(join(REPO_ROOT, tree), checkFile)

// ── Contract drift ───────────────────────────────────────────────────────────────────
// The origin embed contract is duplicated on purpose — sharing one module would itself be a
// crossing import. Duplication that nothing checks is duplication that silently drifts, and this
// particular drift produces no build error and no console error: the origin pane simply stops
// responding to the theme toggle. So the constants are compared here.
const CONTRACT_PAIR = [
  join(REPO_ROOT, "sandbox/src/components/origin-embed-protocol.ts"),
  join(REPO_ROOT, "origin/rail-sidebar/app/src/embed-protocol.ts"),
]
const SHARED_CONSTANTS = ["MESSAGE_NAMESPACE", "VARIANT_MESSAGE", "READY_MESSAGE"]

function constantsOf(file) {
  const source = readFileSync(file, "utf8")
  const found = {}
  for (const name of SHARED_CONSTANTS) {
    const match = source.match(new RegExp(`export const ${name}\\s*=\\s*(\`[^\`]*\`|"[^"]*")`))
    if (match) found[name] = match[1]
  }
  return found
}

const contractDrift = []
try {
  const [sandboxSide, originSide] = CONTRACT_PAIR.map(constantsOf)
  for (const name of SHARED_CONSTANTS) {
    if (sandboxSide[name] !== originSide[name]) {
      contractDrift.push(`${name}: sandbox has ${sandboxSide[name] ?? "(missing)"}, origin has ${originSide[name] ?? "(missing)"}`)
    }
  }
} catch (error) {
  contractDrift.push(`could not read both halves of the embed contract — ${error.message}`)
}

// ── Report ───────────────────────────────────────────────────────────────────────────
const rel = (file) => relative(REPO_ROOT, file).split(sep).join("/")

if (violations.length === 0 && contractDrift.length === 0) {
  console.log("quarantine intact — no application source imports origin material, embed contract in sync")
  process.exit(0)
}

console.error("\nQUARANTINE VIOLATION — the build is failing on purpose.\n")

for (const v of violations) {
  console.error(`  ${rel(v.file)}:${v.line}`)
  console.error(`      imports "${v.specifier}"`)
  console.error(`      -> ${v.why}\n`)
}

if (contractDrift.length > 0) {
  console.error("  The two halves of the origin embed contract disagree:\n")
  for (const line of contractDrift) console.error(`      ${line}`)
  console.error(`\n      ${rel(CONTRACT_PAIR[0])}`)
  console.error(`      ${rel(CONTRACT_PAIR[1])}`)
  console.error("      They are duplicated deliberately (sharing a module would itself cross the")
  console.error("      boundary) and must be changed together.\n")
}

if (violations.length > 0) {
  console.error("Origin material renders in an isolated iframe and is never imported.")
  console.error("Use sandbox/src/components/OriginRailFrame.tsx, or add a new quarantined page")
  console.error("under origin/<component>/app/. See docs/SANDBOX-SPEC.md invariant 6.\n")
}

process.exit(1)
