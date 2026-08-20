// ═══════════════════════════════════════════════════════════════════════════════════
// M9 step 3 — every rule must be able to FAIL.
//
//   node scripts/check-rules-test.mjs
//
// A rule that cannot fire is indistinguishable from a rule that is passing. This project
// has already shipped one: `evidence.current` was satisfied for every divergence from M1
// until M7, because its JOIN could never match — it emitted no unmet row, which looks
// exactly like a met requirement. Nothing in any suite noticed, because nothing ever
// constructed the failing case.
//
// So each rule below is given a planted violation and must report it, AND given a
// deliberately-similar NON-violation and must stay quiet. The second half matters as much:
// a rule that fires on everything is as useless as one that fires on nothing, and it is the
// version people disable.
//
// Fixtures are written to a temporary directory inside the repo, checked, and removed. They
// are never committed — a fixture containing a forbidden icon import would itself trip the
// rule it exists to test, on every subsequent run.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFile } from "node:child_process"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"
// Issue 07o: REPO_ROOT comes from a database-free module, NOT verifier/lib/db.mjs, which
// imports mssql at top level. This is a source-only check; borrowing the constant from the
// db module crashed it — and, as the FIRST step of the blocking `rules` CI gate, the whole
// gate — with ERR_MODULE_NOT_FOUND on any clean/root-only install, before asserting.
import { REPO_ROOT } from "./lib/repo-root.mjs"

const run = promisify(execFile)

// Inside `sandbox/src/` so the checker's own directory walk reaches it without changing
// which roots it scans for the test. `__ruletest__` matches this repo's existing
// double-underscore convention for fixtures.
const FIXTURE_DIR = join(REPO_ROOT, "sandbox", "src", "__ruletest__")

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

async function checkerViolations() {
  try {
    const { stdout } = await run(process.execPath, [join(REPO_ROOT, "scripts", "check-rules.mjs"), "--json"], { cwd: REPO_ROOT, maxBuffer: 8 * 1024 * 1024 })
    return JSON.parse(stdout).violations
  } catch (err) {
    // Non-zero exit is expected whenever there are violations; the JSON is still on stdout.
    if (err.stdout) return JSON.parse(err.stdout).violations
    throw err
  }
}

/** Writes one fixture, runs the checker, returns the violations that came from it. */
async function withFixture(name, contents, body) {
  await mkdir(FIXTURE_DIR, { recursive: true })
  const file = join(FIXTURE_DIR, name)
  await writeFile(file, contents, "utf8")
  try {
    const all = await checkerViolations()
    return await body(all.filter((v) => v.file.includes("__ruletest__")))
  } finally {
    await rm(file, { force: true })
  }
}

try {
  // Baseline: whatever the real tree currently reports, so the planted-violation counts
  // below are attributable to the fixture rather than to pre-existing findings.
  const baseline = await checkerViolations()
  console.log(`\nreal tree currently reports ${baseline.length} violation(s) — fixtures are counted separately\n`)

  // ── R1: forbidden icon source ─────────────────────────────────────────────────────
  console.log("R1 — only Fluent icons\n")
  await withFixture(
    "r1-violation.tsx",
    `import { Check } from "lucide-react"\nexport const A = () => <Check />\n`,
    (v) => check(v.some((x) => x.rule === "icons.fluent-only"), "a lucide-react import is caught", v[0]?.detail),
  )
  await withFixture(
    "r1-clean.tsx",
    `// A comment mentioning lucide-react, which is not an import.\nimport { CheckIcon } from "@/icons"\nexport const A = () => <CheckIcon />\n`,
    (v) => check(!v.some((x) => x.rule === "icons.fluent-only"), "a comment mentioning lucide-react is NOT caught", "comments are stripped before matching"),
  )

  // ── R2: raw scroll in src/ui ──────────────────────────────────────────────────────
  // Planted in src/ui itself, because that is the only directory this rule scans.
  console.log("\nR2 — no raw overflow in src/ui/\n")
  const uiFixture = join(REPO_ROOT, "src", "ui", "__ruletest__.tsx")
  await writeFile(uiFixture, `export const A = () => <div className="overflow-y-auto" />\n`, "utf8")
  try {
    const v = (await checkerViolations()).filter((x) => x.file.includes("__ruletest__"))
    check(v.some((x) => x.rule === "scroll.no-raw-overflow"), "a raw overflow-y-auto in src/ui/ is caught", v[0]?.detail?.slice(0, 70))
  } finally {
    await rm(uiFixture, { force: true })
  }
  await writeFile(uiFixture, `// This component deliberately avoids overflow-y-auto; see the scroll protocol.\nexport const A = () => <div className="min-h-0" />\n`, "utf8")
  try {
    const v = (await checkerViolations()).filter((x) => x.file.includes("__ruletest__"))
    check(!v.some((x) => x.rule === "scroll.no-raw-overflow"), "the same string inside a COMMENT is not caught", "five real files in src/ui/ match only in comments")
  } finally {
    await rm(uiFixture, { force: true })
  }

  // ── R3: the action-icon marker ────────────────────────────────────────────────────
  console.log("\nR3 — icon components carry isActionIcon\n")
  await withFixture(
    "r3-violation.tsx",
    `export function ThingIcon() {\n  return <svg viewBox="0 0 20 20"><path d="M0 0h20v20H0z" /></svg>\n}\n`,
    (v) => check(v.some((x) => x.rule === "icons.action-marker"), "an svg-rendering *Icon without the marker is caught", v[0]?.detail?.slice(0, 80)),
  )
  await withFixture(
    "r3-marked.tsx",
    `export function ThingIcon() {\n  return <svg viewBox="0 0 20 20"><path d="M0 0h20v20H0z" /></svg>\n}\nThingIcon.isActionIcon = true\n`,
    (v) => check(!v.some((x) => x.rule === "icons.action-marker"), "the same component WITH the marker is not caught"),
  )
  await withFixture(
    "r3-not-svg.tsx",
    `export function ThingIcon() {\n  return <span data-slot="marker-icon" />\n}\n`,
    (v) => check(!v.some((x) => x.rule === "icons.action-marker"), "a *Icon that renders no <svg> is not caught", "MarkerIcon in src/ui/marker.tsx is exactly this, and was a false positive"),
  )
  await withFixture(
    "r3-optout.tsx",
    `/** not-an-action-icon: preview-only glyph, never handed to fillActionIcons. */\nexport function ThingIcon() {\n  return <svg viewBox="0 0 20 20"><path d="M0 0h20v20H0z" /></svg>\n}\n`,
    (v) => check(!v.some((x) => x.rule === "icons.action-marker"), "an explicit, reasoned opt-out is honoured"),
  )
  await withFixture(
    "r3-bare-optout.tsx",
    `/** not-an-action-icon: */\nexport function ThingIcon() {\n  return <svg viewBox="0 0 20 20"><path d="M0 0h20v20H0z" /></svg>\n}\n`,
    (v) => check(v.some((x) => x.rule === "icons.action-marker"), "an opt-out with NO reason is still caught", "the annotation must state why, or it is just a silencer"),
  )

  // ── R4: leading-none with truncate ────────────────────────────────────────────────
  console.log("\nR4 — no leading-none on truncating text\n")
  await withFixture(
    "r4-violation.tsx",
    `export const A = () => <span className="truncate leading-none font-medium">x</span>\n`,
    (v) => check(v.some((x) => x.rule === "text.leading-none-truncate"), "leading-none alongside truncate is caught", v[0]?.detail?.slice(0, 70)),
  )
  await withFixture(
    "r4-clean.tsx",
    `export const A = () => <><span className="truncate">x</span><span className="leading-none">y</span></>\n`,
    (v) => check(!v.some((x) => x.rule === "text.leading-none-truncate"), "the two on SEPARATE elements are not caught", "the defect is the combination on one element"),
  )
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await rm(FIXTURE_DIR, { recursive: true, force: true })
  await rm(join(REPO_ROOT, "src", "ui", "__ruletest__.tsx"), { force: true })

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nA rule that cannot fail is indistinguishable from one that is passing. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
