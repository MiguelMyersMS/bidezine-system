// ═══════════════════════════════════════════════════════════════════════════════════
// The verifier runner — Milestone 2.
//
//   node run-checks.mjs checks/rail-sidebar/L-34.json
//   node run-checks.mjs --all
//   node run-checks.mjs --stale [--component=<slug>]     ← M7 step 5
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
//
// ── --stale, M7's "re-verifying the whole affected set is one command" ──────────────
// Landing a system change marks evidence stale (migration 013). `--stale` is the other
// half of that: it asks the database which divergences carry stale evidence and re-runs
// exactly their specs.
//
// It reports the gap rather than hiding it. A stale divergence with NO check spec cannot
// be re-verified by this runner at all — it needs an anchor and a spec written first —
// and a batch command that silently skipped those would report "0 failures" while leaving
// the corpus exactly as stale as it found it.
//
// It also re-reads the gate afterwards, because clearing staleness is NOT the same as
// clearing the gate: `review.citations_support` names the evidence row a passing review
// cited, and a fresh measurement is a NEW row with a new id. The old citation stays
// pointed at a stale one, so the review has to be redone by a human. That is correct —
// a system change invalidated the measurement the judgement rested on — and saying so is
// the difference between a useful batch command and one that looks like it finished.
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
async function allSpecPaths() {
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

async function collectSpecs(args) {
  if (args.includes("--all")) return allSpecPaths()
  return args.filter((a) => a.endsWith(".json")).map((a) => (a.startsWith("/") ? a : join(HERE, a)))
}

/**
 * The stale set, and — just as importantly — the part of it this runner cannot reach.
 *
 * Indexed by `component/ref` from the specs' own declared fields rather than from their
 * filenames. A spec's location on disk is a convention; `spec.component`/`spec.divergence`
 * are what actually decide which database row it writes to, so matching on anything else
 * would drift the moment someone renamed a file.
 */
async function collectStale(pool, componentFilter) {
  const stale = (
    await pool
      .request()
      .input("slug", sql.NVarChar(100), componentFilter ?? null)
      .query(`
        SELECT   c.slug, d.ref_code,
                 stale_rows = COUNT(*),
                 reason     = MAX(e.stale_reason)
        FROM     sandbox.evidence e
        JOIN     sandbox.divergence d ON d.divergence_id = e.divergence_id
        JOIN     sandbox.component c  ON c.component_id  = d.component_id
        WHERE    e.is_stale = 1
          AND    (@slug IS NULL OR c.slug = @slug)
        GROUP BY c.slug, d.ref_code
        ORDER BY c.slug, d.ref_code`)
  ).recordset

  const byKey = new Map()
  for (const path of await allSpecPaths()) {
    const spec = JSON.parse(await readFile(path, "utf8"))
    byKey.set(`${spec.component}/${spec.divergence}`, path)
  }

  const paths = []
  const unreachable = []
  for (const row of stale) {
    const key = `${row.slug}/${row.ref_code}`
    const path = byKey.get(key)
    if (path) paths.push(path)
    else unreachable.push({ ...row, key })
  }
  return { stale, paths, unreachable }
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
/**
 * What "already in this state" looks like in the DOM — taken from bidezine's OWN primitives
 * rather than from a general-purpose guess about ARIA. Grepped out of `src/ui/*.tsx`:
 * `data-[active=true]` (28 uses), `data-[state=checked]` (12), `data-active` (6),
 * `data-[state=on]` (2), `aria-pressed` (2), `aria-current` (2), `aria-selected` (1); and for
 * expanded, `data-[state=open]` (78) and `aria-expanded` (1). The rail's own selected nav
 * button carries `aria-pressed={isActive}` (`FunctionalRailSidebar.tsx`), which is what
 * B-3/B-6 resolve against.
 *
 * Matched with `closest()` rather than on the element alone, on purpose: an anchor may
 * legitimately name an ICON inside a selected button — B-7's subject is exactly that — and
 * that icon is in the selected state by virtue of its button. Which element carried the
 * marker is recorded in the evidence, so a reviewer can see whether it was the subject
 * itself or an ancestor rather than having to assume.
 */
const STATE_MARKERS = {
  selected:
    '[aria-pressed="true"],[aria-selected="true"],[data-active="true"],[data-state="on"],[data-state="checked"],[aria-current]:not([aria-current="false"])',
  expanded: '[aria-expanded="true"],[data-state="open"]',
}

async function applyState(page, locator, state) {
  switch (state) {
    case "rest":
      return { release: async () => {} }
    case "hover":
      await locator.hover()
      return { release: async () => page.mouse.move(0, 0) }
    // Renamed from "active" at migration 022: this vocabulary's "active" meant CSS :active
    // (a press) while seven src/ui primitives use "active" for persistently-current, and the
    // collision had already bent a real declaration. What this case does — mouse.down, hold,
    // mouse.up — is a press, so the name now matches the behaviour.
    case "pressed": {
      const box = await locator.boundingBox()
      if (!box) throw new Error("element has no box; cannot press it")
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      return { release: async () => page.mouse.up() }
    }
    case "focus":
      await locator.focus()
      return { release: async () => locator.blur().catch(() => {}) }
    case "focus-visible":
      // Chromium grants :focus-visible based on the LAST INPUT MODALITY. A bare focus()
      // after a mouse interaction will not show a focus ring, which silently makes a
      // ring check pass when the ring is invisible to real keyboard users. Pressing Tab
      // first sets keyboard modality; the focus() then lands with :focus-visible active.
      await page.keyboard.press("Tab")
      await locator.focus()
      return { release: async () => locator.blur().catch(() => {}) }
    case "disabled":
      // Not simulated on purpose: forcing the attribute would measure a state the real
      // component may never enter. Point the spec at an already-disabled element.
      return { release: async () => {} }
    // `selected` and `expanded` arrived with migration 022, which taught the DATABASE two new
    // words and — for three days — did not teach the runner, so a spec declaring either would
    // have thrown here. That gap is this project's own enum-extension test 3 landing on the
    // change that introduced it: adding a value is a promise that something uses it distinctly.
    //
    // They are not simulated, for the same reason `disabled` is not: forcing the state would
    // measure something the component may never really enter. But an unsimulated state is a
    // silent trap in a way a simulated one is not — the runner would happily measure a RESTING
    // element and file a passing "selected" row if the spec pointed at the wrong subject, and
    // nothing downstream could tell. So these two are VERIFIED no-ops: the element must already
    // carry a marker proving it is in the state it claims, and the check fails if it does not.
    case "selected":
    case "expanded": {
      const found = await locator.evaluate((el, sel) => {
        const host = el.closest(sel)
        if (!host) return null
        return {
          self: host === el,
          tag: host.tagName.toLowerCase(),
          marker: [...host.attributes]
            .filter((a) => a.name.startsWith("aria-") || a.name.startsWith("data-"))
            .map((a) => `${a.name}="${a.value}"`)
            .join(" "),
        }
      }, STATE_MARKERS[state])
      if (!found) {
        throw new Error(
          `nothing here is ${state}: neither this element nor any ancestor matches ${STATE_MARKERS[state]}.\n\n` +
            `This state is not simulated — forcing it would measure a state the component may never ` +
            `enter — so the spec must point at an element that is ALREADY in it. Either the anchor ` +
            `names the wrong element, or the demo no longer renders that element ${state}.`,
        )
      }
      return {
        release: async () => {},
        note: `${state}: confirmed on ${found.self ? "the subject itself" : `an ancestor <${found.tag}>`} — ${found.marker}`,
      }
    }
    default:
      throw new Error(
        `unknown state: ${state}\n\nThe runner has no case for this state. If it was just added to ` +
          `the database's subject_state vocabulary, it has to be added here too, or every spec ` +
          `declaring it is unrunnable.`,
      )
  }
}

// ── waiting for the component to stop moving ────────────────────────────────────────
/**
 * Wait for the subject's animations and transitions to finish before measuring it.
 *
 * Without this the runner measures whatever value the interpolation happens to be passing
 * through at the moment it looks. That does not fail as "no value" — it fails as a WRONG
 * value, which is the worst shape a failure can take: the component looks broken, and pasting
 * the measured number into the spec would "fix" the check while pinning a mid-transition
 * colour forever. Three of the first six rail colour checks failed exactly this way against
 * the rail's 150ms transition, each one landing on its approved token at 150ms and holding.
 * That transition is divergence H-1 — approved, and not going away — so the runner is what
 * had to change.
 *
 * The wait looks BOTH WAYS along the tree, and that is not belt-and-braces. `subtree: true`
 * alone — the obvious implementation, and the first one written here — walks DOWN, and it
 * left B-7 failing on `oklab(0.866739 0 0)` while B-2 and B-4 were fixed. B-7's subject is an
 * icon, and its `color` is not animated on the icon at all: it is INHERITED from the button
 * around it, which is where the transition actually lives. An element's own subtree can never
 * contain that. So ancestors are collected too — each ancestor's own animations, without their
 * subtrees, which keeps the set to this element's real inheritance chain rather than the whole
 * document. Measuring an icon is the common case for a colour divergence, so a
 * downward-only wait would have been fixed for buttons and quietly broken for every icon.
 *
 * Two things this deliberately does not do. It does not sleep: a fixed delay would slow every
 * check in the suite and still be a guess. And it does not wait indefinitely — an infinite
 * animation never resolves its `finished` promise — so the wait is capped, and a timeout is
 * REPORTED in the evidence rather than swallowed, because "something was still moving" is
 * precisely the fact a reviewer needs when a measured value looks wrong.
 */
const SETTLE_TIMEOUT_MS = 2000

async function settle(locator) {
  return locator
    .evaluate(async (el, timeout) => {
      const ancestors = []
      for (let p = el.parentElement; p; p = p.parentElement) ancestors.push(p)
      const running = [
        ...el.getAnimations({ subtree: true }),
        ...ancestors.flatMap((a) => a.getAnimations()),
      ]
      if (running.length === 0) return { animations: 0, settled: true }
      let timedOut = false
      await Promise.race([
        // A cancelled animation rejects `finished`. For this purpose that is settled.
        Promise.all(running.map((a) => a.finished.catch(() => {}))),
        new Promise((resolve) =>
          setTimeout(() => {
            timedOut = true
            resolve()
          }, timeout),
        ),
      ])
      return { animations: running.length, settled: !timedOut }
    }, SETTLE_TIMEOUT_MS)
    .catch((err) => ({ animations: 0, settled: false, error: err.message }))
}

function motionNote(motion) {
  if (motion.error) return `settle: could not check for animations (${motion.error})`
  if (motion.animations === 0) return null
  return motion.settled
    ? `settle: waited for ${motion.animations} animation(s) to finish before measuring`
    : `settle: WARNING — ${motion.animations} animation(s) still running after ${SETTLE_TIMEOUT_MS}ms; the values below may have been read mid-transition`
}

/**
 * Chromium serialises a colour it is still interpolating as `oklab(...)` and a settled one as
 * `oklch(...)`. If a measured value still reads oklab after `settle()` claims to have waited,
 * something is still moving — and naming that is far more useful to whoever reads the failure
 * than a bare "expected X, got Y" that looks like a broken component.
 */
function midFlightColours(measured) {
  return Object.entries(measured)
    .filter(([, v]) => typeof v === "string" && v.includes("oklab("))
    .map(([k]) => k)
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

  // A state that cannot be established is a FAILING ROW, not a thrown run. The distinction
  // matters: applyState throwing here used to abort the whole batch, so one spec naming an
  // unknown state took every other spec's evidence down with it and left no record of why.
  let applied
  try {
    applied = await applyState(page, locator, check.state ?? "rest")
  } catch (err) {
    return {
      ...base,
      passed: 0,
      raw_output: `STATE NOT ESTABLISHED\nstate: ${check.state ?? "rest"}\nselector: ${selector}\n\n${err.message}\n\nNothing was measured, so this row asserts nothing about the component — only that the check could not be run as written.`,
    }
  }
  const { release, note: stateNote } = applied

  try {
    const motion = await settle(locator)

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
        raw_output: `state: ${check.state ?? "rest"}\n${[stateNote, motionNote(motion)].filter(Boolean).join("\n")}${stateNote || motionNote(motion) ? "\n" : ""}file: verifier/artifacts/${file}\nsha256: ${hash}\nbytes: ${png.length}\n\nA screenshot asserts nothing. It cannot satisfy the gate's evidence requirement on its own (db/migrations/005).`,
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
    const midFlight = midFlightColours(measured)
    return {
      ...base,
      passed: failures.length === 0 ? 1 : 0,
      raw_output: [
        `state: ${check.state ?? "rest"}`,
        stateNote,
        `selector: ${selector}`,
        motionNote(motion),
        `element: ${outerHTML}`,
        `expected: ${JSON.stringify(expected)}`,
        `measured: ${JSON.stringify(measured, null, 2)}`,
        midFlight.length
          ? `\nSTILL INTERPOLATING: ${midFlight.join(", ")} came back as oklab(), which is how Chromium serialises a colour mid-transition (a settled one reads oklch()). Whatever value is below was read while the component was still moving — treat a mismatch as a timing fault in the runner before treating it as a wrong colour.`
          : null,
        failures.length ? `\nFAILURES:\n  ${failures.join("\n  ")}` : "\nall expectations held",
      ]
        .filter(Boolean)
        .join("\n"),
    }
  } finally {
    await release()
  }
}

// ── main ────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const STALE = args.includes("--stale")
const COMPONENT = args.find((a) => a.startsWith("--component="))?.split("=")[1] ?? null

// In --stale mode the spec list comes from the database, so it cannot be resolved until
// after the pool is open. Everything else is decided from the arguments alone.
let specPaths = STALE ? [] : await collectSpecs(args)
if (!STALE && !specPaths.length) {
  console.error("usage: node run-checks.mjs <spec.json ...> | --all | --stale [--component=<slug>]")
  process.exit(1)
}

const commit = head()
if (commit.dirty) {
  // Not fatal, but it means the evidence records a commit that does not describe the
  // code actually measured. Better said loudly than discovered later.
  console.warn("WARNING: working tree is dirty. Evidence will cite HEAD, which is not what ran.\n")
}

const runId = randomUUID()

let browser
let page
let pool
let unreachable = []
// Nothing to re-run is not an error, but it must not skip the finally block either — an
// early process.exit() drops the pool and can truncate output still buffered on a pipe,
// which in a batch command is indistinguishable from the run having been cut short.
let nothingToRun = false
const rows = []
const touched = []

try {
  pool = await connect("RUNNER")

  if (STALE) {
    const found = await collectStale(pool, COMPONENT)
    specPaths = found.paths
    unreachable = found.unreachable
    console.log(
      `${found.stale.length} divergence(s) carry stale evidence${COMPONENT ? ` in ${COMPONENT}` : ""}` +
        ` · ${specPaths.length} re-runnable · ${unreachable.length} with no check spec`,
    )
    if (found.stale[0]?.reason) console.log(`  why: ${found.stale[0].reason.slice(0, 120)}`)
    if (!specPaths.length) {
      // "Nothing to do" and "nothing I CAN do" look identical from the outside, and only
      // one of them means the corpus is clean. So they are said differently.
      for (const u of unreachable) console.log(`  UNREACHABLE  ${u.key} — ${u.stale_rows} stale row(s), no check spec`)
      console.log(unreachable.length ? "\nNothing re-runnable. Every stale divergence needs a spec written first." : "\nNothing is stale.")
      if (unreachable.length) process.exitCode = 1
      nothingToRun = true
    } else {
      console.log("")
    }
  }

  // specPaths is empty when there is nothing to run, so the loop below is already a no-op;
  // the browser is simply never launched and the summary never printed.
  if (!nothingToRun) {
    console.log(`run ${runId}  ·  HEAD ${commit.sha.slice(0, 8)}  ·  ${specPaths.length} spec(s)\n`)
    browser = await chromium.launch()
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  }

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
    touched.push({ id: divergenceId, key: `${spec.component}/${spec.divergence}` })

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
  if (!nothingToRun) {
    console.log(`${rows.length - failed}/${rows.length} checks passed. ${rows.length} evidence rows written.`)
  }
  if (failed) process.exitCode = 1

  // ── what the re-run actually left behind ──────────────────────────────────────────
  // Only in --stale mode, because only there is "did this clear anything?" the question
  // being asked. Reading the gate is a SELECT the runner already has rights to; it writes
  // nothing, which matters — the identity that produces evidence must never be the one
  // that decides what the evidence means.
  if (STALE && !nothingToRun) {
    console.log("\nwhat the batch cleared, per the gate itself:\n")
    for (const t of touched) {
      const unmet = (
        await pool.request().input("id", sql.Int, t.id).query(`
          SELECT requirement, detail FROM sandbox.fn_divergence_unmet(@id) ORDER BY requirement`)
      ).recordset
      if (!unmet.length) {
        console.log(`  CLEAR   ${t.key}`)
        continue
      }
      console.log(`  UNMET   ${t.key}`)
      for (const u of unmet) console.log(`            ${u.requirement} — ${u.detail.slice(0, 110)}`)
    }

    for (const u of unreachable) {
      console.log(`  UNREACHABLE  ${u.key} — ${u.stale_rows} stale row(s), no check spec to re-run`)
    }

    // A batch that re-measured everything it could and left rows it could not reach has
    // not finished the job, and should not exit 0 as though it had.
    if (unreachable.length) process.exitCode = 1
  }
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await pool?.close()
}
