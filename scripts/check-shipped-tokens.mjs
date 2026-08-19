// ═══════════════════════════════════════════════════════════════════════════════════
// Every CSS variable a component references must exist in the stylesheet consumers get.
//
//   npm run build && node scripts/check-shipped-tokens.mjs
//
// This exists because of a specific failure, and the failure is worth stating because the
// check is shaped by it: `rail-sidebar.tsx` shipped referencing ten `--sidebar-rail-*`
// variables, and the rail rendered as a transparent box wherever the stylesheet lacked them.
// An undefined custom property with no fallback makes the whole declaration invalid, so the
// element paints NOTHING — it does not fall back to a default, and it does not warn.
//
// Three checks passed while that was true. `npm run tokens` said "73 emitted, parity OK" —
// about the source file. The token sync said "121 recorded" — about the database. A grep of
// dist/system.css matched — but that was a line count on a minified file, so one matching line
// said nothing about how many tokens were in it. Not one of them asked the only question that
// matters: does the variable this component references exist in the CSS that ships.
//
// ── Why static, and why against dist/ ──────────────────────────────────────────────
// No browser, no dev server, no running app — those are exactly the things that lied. It reads
// the built stylesheet, which is the artifact a consumer installs. `dist/` is gitignored, so
// this must run AFTER `npm run build`; it refuses rather than passing vacuously if the build
// output is missing, because "nothing to check" and "everything is fine" must never look alike.
//
// A reference WITH a fallback -- `var(--x, red)` -- degrades to something visible rather than
// vanishing, so it is reported but does not fail. A reference without one is a hard failure.
//
// ── What this does NOT cover (Issue 07k, finding TWO) ───────────────────────────────
// It sees only values reached THROUGH `var(--x)`. A hard-coded literal — a raw `#0a0a0a`,
// an `oklch(…)`, a bare pixel — references no variable, so this check is structurally
// blind to it. That is the class round one spent five findings on; it is out of scope here
// by construction, not by omission, and would need a rule of its own (see 07k report).
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, readdir } from "node:fs/promises"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
// Issue 07k: loading dist/system.css — and distinguishing "the build has not run" from a
// real failure — is shared with check-type-slots.mjs. See scripts/lib/shipped-css.mjs's
// own header for the concurrent-build race this closes. Neutral loader, not a gate.
import { readShippedCss } from "./lib/shipped-css.mjs"

const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const SHIPPED_CSS = join(REPO_ROOT, "dist", "system.css")
const SOURCE_DIRS = ["src"]

// Tailwind's own internal machinery, declared by the framework at use sites rather than in our
// token layer. Not ours to define and not a defect when absent from the token declarations.
const IGNORE = /^--(tw-|radix-|default-)/

// Set by the positioning engines at runtime, on the element itself, and documented as such by
// Radix and Base UI. A stylesheet will never contain them and their absence is not a defect.
// Listed explicitly rather than pattern-matched: an unrecognised variable should surface as a
// failure and get triaged, not disappear into a wildcard.
const RUNTIME_PROVIDED = new Set([
  "--anchor-width",
  "--available-height",
  "--available-width",
  "--radix-popper-available-height",
  "--radix-popper-available-width",
  "--radix-popper-anchor-width",
])

/**
 * Source with comments removed.
 *
 * Prose talks about CSS. `rail-sidebar.tsx` explains a hazard using `var(--x)` as a stand-in, and
 * scanning that reported a missing token for a variable no component ever reads. A checker that
 * fails on documentation teaches people to stop writing documentation, so comments are stripped
 * first — the same thing `check-rules.mjs` does, for the same reason.
 */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) await walk(p, out)
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(p)
  }
  return out
}

const css = await readShippedCss(SHIPPED_CSS)

// Every custom property the shipped stylesheet DEFINES (`--name:`), as opposed to references it
// merely makes. The colon is what separates a declaration from a `var()` use.
const defined = new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]))

const files = []
for (const d of SOURCE_DIRS) await walk(join(REPO_ROOT, d), files)

// A component may legitimately DEFINE a variable on the element itself and read it back further
// down the tree — `SidebarProvider` sets `--sidebar-width`, the rail sets its own
// `--dm-icon-fg-*`. Those never appear in a stylesheet and their absence there is correct, so
// they are collected from source before anything is judged missing. Without this the check
// reported 16 failures of which 14 were sound code, and a check that cries wolf is one people
// learn to skip — the precise failure mode this project already fixed once in the runner.
// ONLY from .ts/.tsx — never from a source .css file, and this is the whole correctness of the
// check. The first version scanned every file it walked, so it read `--sidebar-rail-surface` out
// of `src/styles/tokens.css` and counted it as satisfied. Deleting all 22 rail declarations from
// `dist/system.css` then still PASSED: it was verifying the source against the source while
// claiming to verify what ships. Proven by reproducing the real defect and watching it stay green.
//
// A source stylesheet is an input to the build. The only thing that answers "does this ship" is
// the build output, so definitions may come from exactly one place: `dist/system.css`.
const locallySet = new Set()
for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
  const text = stripComments(await readFile(file, "utf8"))
  // An inline style key on an element: `"--name":` / `'--name':`. That is a real definition the
  // component makes at runtime, and a stylesheet will never contain it.
  for (const m of text.matchAll(/["'`](--[a-zA-Z0-9-]+)["'`]\s*:/g)) locallySet.add(m[1])
}

const missing = []
const withFallback = []
for (const file of files) {
  const text = stripComments(await readFile(file, "utf8"))
  // `var(--name)` and `var(--name, fallback)` — the second capture tells them apart.
  for (const m of text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*(,)?/g)) {
    const [, name, comma] = m
    if (IGNORE.test(name) || defined.has(name) || locallySet.has(name) || RUNTIME_PROVIDED.has(name)) continue
    const line = text.slice(0, m.index).split("\n").length
    const where = `${relative(REPO_ROOT, file).replace(/\\/g, "/")}:${line}`
    ;(comma ? withFallback : missing).push({ name, where })
  }
}

console.log(`\n${defined.size} custom properties defined in dist/system.css`)
console.log(`${files.length} source file(s) scanned for var() references\n`)

if (withFallback.length) {
  console.log(`${withFallback.length} reference(s) to an undefined variable WITH a fallback — degraded, not broken:`)
  for (const r of withFallback) console.log(`  ${r.name}  ${r.where}`)
  console.log()
}

if (missing.length === 0) {
  console.log("  PASS  every var() a component references is defined in the shipped stylesheet")
  console.log("\n1/1 checks passed.")
} else {
  console.log(`  FAIL  ${missing.length} reference(s) to a variable that does NOT ship:`)
  for (const r of missing) console.log(`  ${r.name}  ${r.where}`)
  console.log(
    "\nAn undefined custom property with no fallback invalidates the whole declaration, so the",
  )
  console.log("element renders nothing — silently, with no console warning. Either author the token")
  console.log("in tokens/ and rebuild, or give the reference a fallback.")
  console.log("\n0/1 checks passed.")
  process.exitCode = 1
}
