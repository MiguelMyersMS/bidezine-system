// ═══════════════════════════════════════════════════════════════════════════════════
// The verifier runner — Milestone 2.
//
//   node run-checks.mjs checks/rail-sidebar/L-34.json
//   node run-checks.mjs --all
//
// Reads check specs from the repository, drives a real browser against a real render,
// measures, and writes the result to sandbox.evidence under the runner_evidence
// credential — the only identity permitted to write that table.
//
// The agent chose what to verify. It does not get to say how it turned out.
//
// Two behaviours worth knowing, because both are deliberate and both look like bugs
// until you know why:
//
//   · An anchor that resolves to nothing produces a FAILING evidence row, not a crash.
//     A check that cannot find its subject has failed, and the gate must see that. A
//     crash would leave no trace and the divergence would simply look unverified.
//
//   · A check with no expectations FAILS. A measurement that asserts nothing would
//     otherwise be a passing row proving nothing — the same hole migration 005 closed
//     for screenshots, and it must not reopen here.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"
import { pathToFileURL } from "node:url"
import { chromium } from "playwright"
import { REPO_ROOT, connect, sql } from "./lib/db.mjs"

const HERE = join(REPO_ROOT, "verifier")
const CHECKS_DIR = join(HERE, "checks")
const ARTIFACTS_DIR = join(HERE, "artifacts")

const ASSERTING_KINDS = new Set(["computed-style", "box"])
const BOX_PROPS = ["width", "height", "top", "left", "right", "bottom"]

// ── git ─────────────────────────────────────────────────────────────────────────────
const git = (...args) => execFileSync("git", args, { cwd: REPO_ROOT }).toString().trim()

function head() {
  const sha = git("rev-parse", "HEAD")
  const iso = git("log", "-1", "--format=%cI", sha)
  const dirty = git("status", "--porcelain").length > 0
  return { sha, at: new Date(iso), dirty }
}

// ── spec loading ────────────────────────────────────────────────────────────────────
async function collectSpecs(args) {
  if (args.includes("--all")) {
    const out = []
    const walk = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) await walk(p)
        else if (entry.name.endsWith(".json")) out.push(p)
      }
    }
    await walk(CHECKS_DIR).catch(() => {})
    return out.sort()
  }
  return args.filter((a) => a.endsWith(".json")).map((a) => (a.startsWith("/") ? a : join(HERE, a)))
}

// A spec may name a URL as `file:./relative/path.html`, resolved against the repository
// root. An absolute file:// path would be machine-specific and could not be committed.
function resolveUrl(url) {
  if (url.startsWith("file:") && !url.startsWith("file://")) {
    return pathToFileURL(join(REPO_ROOT, url.slice("file:".length).replace(/^\.\//, ""))).href
  }
  return url
}

// ── state application ───────────────────────────────────────────────────────────────
// Each state is produced by driving the real interaction. Reading a class name and
// inferring the state is exactly the mistake this whole layer exists to prevent.
async function applyState(page, locator, state) {
  switch (state) {
    case "rest":
      return async () => {}
    case "hover":
      await locator.hover()
      return async () => page.mouse.move(0, 0)
    case "active": {
      const box = await locator.boundingBox()
      if (!box) throw new Error("element has no box; cannot press it")
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      return async () => page.mouse.up()
    }
    case "focus":
      await locator.focus()
      return async () => locator.blur().catch(() => {})
    case "focus-visible":
      // Chromium grants :focus-visible based on the LAST INPUT MODALITY. A bare focus()
      // after a mouse interaction will not show a focus ring, which silently makes a
      // ring check pass when the ring is invisible to real keyboard users. Pressing Tab
      // first sets keyboard modality; the focus() then lands with :focus-visible active.
      await page.keyboard.press("Tab")
      await locator.focus()
      return async () => locator.blur().catch(() => {})
    case "disabled":
      // Not simulated on purpose: forcing the attribute would measure a state the real
      // component may never enter. Point the spec at an already-disabled element.
      return async () => {}
    default:
      throw new Error(`unknown state: ${state}`)
  }
}

// ── comparison ──────────────────────────────────────────────────────────────────────
function compare(expected, actual, tolerance = 0) {
  const failures = []
  for (const [key, want] of Object.entries(expected)) {
    const got = actual[key]
    if (got === undefined) {
      failures.push(`${key}: not measured`)
      continue
    }
    if (typeof want === "number") {
      const gotNum = typeof got === "number" ? got : Number.parseFloat(got)
      if (!Number.isFinite(gotNum) || Math.abs(gotNum - want) > tolerance) {
        failures.push(`${key}: expected ${want}${tolerance ? ` ±${tolerance}` : ""}, got ${got}`)
      }
    } else if (String(got).trim() !== String(want).trim()) {
      failures.push(`${key}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`)
    }
  }
  return failures
}

// ── one check ───────────────────────────────────────────────────────────────────────
async function runCheck(page, spec, check, runId, commit) {
  const selector = `[data-divergence="${spec.anchor}"]`
  const base = {
    kind: check.kind === "box" ? "measurement" : check.kind,
    check_spec: JSON.stringify({ ...check, url: spec.url, anchor: spec.anchor, selector }),
  }

  const count = await page.locator(selector).count()
  if (count === 0) {
    return {
      ...base,
      passed: 0,
      raw_output: `ANCHOR NOT FOUND\nselector: ${selector}\nurl: ${spec.url}\n\nThe check could not locate its subject. This is a failure, not an absence of information: either the data-divergence attribute was removed from the markup, or the spec names an anchor that never existed.`,
    }
  }
  if (count > 1) {
    // Ambiguity is a failure too. Checklist item 10 in CLAUDE.md exists because a
    // verification once silently measured the wrong one of several matching elements.
    return {
      ...base,
      passed: 0,
      raw_output: `ANCHOR AMBIGUOUS\nselector: ${selector}\nmatched ${count} elements\n\nA data-divergence value must identify exactly one element. Measuring whichever matched first is how a verification passes against the wrong subject.`,
    }
  }

  const locator = page.locator(selector)
  const release = await applyState(page, locator, check.state ?? "rest")

  try {
    if (check.kind === "screenshot") {
      const png = await locator.screenshot()
      const hash = createHash("sha256").update(png).digest("hex")
      const file = `${spec.component}__${spec.divergence}__${check.state ?? "rest"}__${hash.slice(0, 12)}.png`
      await mkdir(ARTIFACTS_DIR, { recursive: true })
      await writeFile(join(ARTIFACTS_DIR, file), png)
      return {
        ...base,
        kind: "screenshot",
        passed: 1,
        artifact_hash: hash,
        raw_output: `state: ${check.state ?? "rest"}\nfile: verifier/artifacts/${file}\nsha256: ${hash}\nbytes: ${png.length}\n\nA screenshot asserts nothing. It cannot satisfy the gate's evidence requirement on its own (db/migrations/005).`,
      }
    }

    let measured
    if (check.kind === "box") {
      measured = await locator.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom }
      })
    } else if (check.kind === "computed-style") {
      const props = Object.keys(check.expect ?? {})
      measured = await locator.evaluate((el, list) => {
        const cs = getComputedStyle(el)
        return Object.fromEntries(list.map((p) => [p, cs.getPropertyValue(p)]))
      }, props)
    } else {
      return { ...base, passed: 0, raw_output: `UNKNOWN CHECK KIND: ${check.kind}` }
    }

    const outerHTML = await locator.evaluate((el) => el.outerHTML.slice(0, 400))

    const expected = check.expect ?? {}
    if (Object.keys(expected).length === 0) {
      return {
        ...base,
        passed: 0,
        raw_output: `NO EXPECTATIONS DECLARED\nstate: ${check.state ?? "rest"}\nmeasured: ${JSON.stringify(measured, null, 2)}\n\nA measurement that asserts nothing is not verification. Declare what the value should be.`,
      }
    }

    const failures = compare(expected, measured, check.tolerance ?? 0)
    return {
      ...base,
      passed: failures.length === 0 ? 1 : 0,
      raw_output: [
        `state: ${check.state ?? "rest"}`,
        `selector: ${selector}`,
        `element: ${outerHTML}`,
        `expected: ${JSON.stringify(expected)}`,
        `measured: ${JSON.stringify(measured, null, 2)}`,
        failures.length ? `\nFAILURES:\n  ${failures.join("\n  ")}` : "\nall expectations held",
      ].join("\n"),
    }
  } finally {
    await release()
  }
}

// ── main ────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const specPaths = await collectSpecs(args)
if (!specPaths.length) {
  console.error("usage: node run-checks.mjs <spec.json ...> | --all")
  process.exit(1)
}

const commit = head()
if (commit.dirty) {
  // Not fatal, but it means the evidence records a commit that does not describe the
  // code actually measured. Better said loudly than discovered later.
  console.warn("WARNING: working tree is dirty. Evidence will cite HEAD, which is not what ran.\n")
}

const runId = randomUUID()
console.log(`run ${runId}  ·  HEAD ${commit.sha.slice(0, 8)}  ·  ${specPaths.length} spec(s)\n`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
let pool
const rows = []

try {
  pool = await connect("RUNNER")

  for (const path of specPaths) {
    const spec = JSON.parse(await readFile(path, "utf8"))
    const label = relative(REPO_ROOT, path).replace(/\\/g, "/")
    console.log(`${label}  →  ${spec.component}/${spec.divergence}`)

    const found = await pool
      .request()
      .input("slug", sql.NVarChar(100), spec.component)
      .input("ref", sql.NVarChar(20), spec.divergence)
      .query(`SELECT d.divergence_id FROM sandbox.divergence d
              JOIN sandbox.component c ON c.component_id = d.component_id
              WHERE c.slug = @slug AND d.ref_code = @ref`)

    if (!found.recordset.length) {
      console.log(`  SKIP — no divergence ${spec.component}/${spec.divergence} in the database\n`)
      continue
    }
    const divergenceId = found.recordset[0].divergence_id

    await page.goto(resolveUrl(spec.url), { waitUntil: "networkidle" })

    for (const check of spec.checks) {
      const r = await runCheck(page, spec, check, runId, commit)
      const tag = `${r.kind}/${check.state ?? "rest"}`
      console.log(`  ${r.passed ? "pass" : "FAIL"}  ${tag}`)
      if (!r.passed) {
        const detail = r.raw_output.split("\n").find((l) => l.startsWith("  ") || /^[A-Z ]+$/.test(l))
        if (detail) console.log(`        ${detail.trim()}`)
      }

      await pool
        .request()
        .input("divergence_id", sql.Int, divergenceId)
        .input("kind", sql.NVarChar(20), r.kind)
        .input("check_spec", sql.NVarChar(sql.MAX), r.check_spec)
        .input("raw_output", sql.NVarChar(sql.MAX), r.raw_output)
        .input("passed", sql.Bit, r.passed)
        .input("verified_at_commit", sql.Char(40), commit.sha)
        .input("verified_at_commit_at", sql.DateTime2, commit.at)
        .input("run_id", sql.UniqueIdentifier, runId)
        .input("artifact_hash", sql.Char(64), r.artifact_hash ?? null)
        .query(`INSERT INTO sandbox.evidence
                  (divergence_id, kind, check_spec, raw_output, passed,
                   verified_at_commit, verified_at_commit_at, run_id, artifact_hash)
                VALUES
                  (@divergence_id, @kind, @check_spec, @raw_output, @passed,
                   @verified_at_commit, @verified_at_commit_at, @run_id, @artifact_hash)`)

      rows.push(r)
    }
    console.log("")
  }

  const failed = rows.filter((r) => !r.passed).length
  console.log(`${rows.length - failed}/${rows.length} checks passed. ${rows.length} evidence rows written.`)
  if (failed) process.exitCode = 1
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
  await pool?.close()
}
