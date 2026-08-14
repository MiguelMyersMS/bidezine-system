// ═══════════════════════════════════════════════════════════════════════════════════
// Every written review description reaches the card. Verified by render.
//
//   npm --prefix sandbox run dev            # in one terminal
//   npm --prefix sandbox run verify-cards   # in another
//
// ── Why a DB-side check cannot cover this ──────────────────────────────────────────
// `db/verify-review-prompt-fidelity.mjs` checks that a prompt's quoted value still
// matches the real token it names. `check-corpus-equivalence.mjs` checks the snapshot
// against the database. Both can pass in full while the description never appears on
// screen — a column read into a field the card does not render is indistinguishable,
// from the database's side, from one that renders perfectly.
//
// That gap is not hypothetical here. The 51 component-gap descriptions (L-1..L-51) were
// written, verified 51/51 in the database, verified byte-identical in the snapshot, and
// only a render check could say whether a human would ever see them.
//
// ── It asserts both directions, because one direction is not identity ──────────────
// Checking "rows with a prompt show it" alone would pass if the card rendered the same
// text everywhere, or if the fallback happened to contain the words being matched. So
// this also asserts the opposite: every row WITHOUT a prompt still shows the "nobody has
// said what needs deciding here" fallback, and no row shows both. CLAUDE.md checklist
// item 10 — a positive marker alone is not identity.
//
// The first version of this file proved that point against itself: it looped every
// component and scoped each card query by `ref`, which is unique per component and not
// globally — `__dbg__`'s only row is `D-1`, and so is one of rail-sidebar's. Four
// assertions "passed" for a component that was never mounted. It now scopes to the
// component the app says is mounted, and SKIPS the rest out loud.
//
// ── It waits on content, and it refuses rather than skips ──────────────────────────
// /api/corpus opens a Fabric connection, takes ~5s on a good run, and intermittently
// answers 503 when Fabric is unreachable. The app handles that correctly (it says the
// corpus could not be read, and deliberately does NOT render an empty list, which would
// be indistinguishable from a component with nothing to decide) — but for this check a
// 503 means the run proved nothing, so it exits non-zero saying so. A check that quietly
// does nothing reads exactly like a passing one in a scroll-back.
// ═══════════════════════════════════════════════════════════════════════════════════

import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// Playwright is the verifier's dependency, not the Sandbox app's — see the same note in
// `verify-machines-ui.mjs`. Resolved through Node's real resolution FROM the verifier's
// directory rather than a hand-written path that breaks the first time npm dedupes.
const HERE = dirname(fileURLToPath(import.meta.url))
const requireFromVerifier = createRequire(join(HERE, "..", "verifier", "package.json"))
const playwright = await import(pathToFileURL(requireFromVerifier.resolve("playwright")).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
if (!chromium) throw new Error("Could not load playwright's chromium from the verifier's install.")

const BASE = process.env.SANDBOX_URL ?? "http://localhost:4199"

/** The exact copy `ReviewCardShell` renders when a row has no description. Matched as a
 *  substring so a later rewording of the tail does not silently disable this check —
 *  but if the LEAD changes, this must change with it, deliberately. */
const FALLBACK = "No review description written yet"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

// ── Refuse early and legibly ───────────────────────────────────────────────────────
try {
  const probe = await fetch(BASE, { signal: AbortSignal.timeout(4000) })
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
} catch (err) {
  console.error(`\nNothing is serving ${BASE} (${err.message}).`)
  console.error("This check drives the real app. Start it first:\n")
  console.error("    npm --prefix sandbox run dev\n")
  process.exit(1)
}

// ── The truth this render is checked against ───────────────────────────────────────
// Read from the same endpoint the app reads, so the check cannot drift from the data by
// consulting a snapshot the running app is not using.
const corpusRes = await fetch(`${BASE}/api/corpus`, { cache: "no-store" })
const corpus = await corpusRes.json()
if (corpus.error) {
  console.error(`\n/api/corpus answered ${corpusRes.status}: ${corpus.error}`)
  console.error("Nothing was verified. This is a refusal, not a pass — rerun when Fabric is reachable.")
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()

try {
  await page.goto(BASE, { waitUntil: "networkidle" })
  // On content, never on a duration.
  await page.waitForFunction(() => document.querySelectorAll("[data-review-card]").length > 0, null, {
    timeout: 60_000,
  })

  // Refs are unique per component, NOT globally: `__dbg__`'s only row is `D-1`, and so is
  // one of rail-sidebar's. Looping every component and querying by ref alone therefore
  // "verified" __dbg__ against rail-sidebar's card and passed four assertions that could
  // not have failed — found by this check's own first run, and the reason `App.tsx` now
  // names the mounted component in the DOM rather than leaving it to be inferred.
  const activeSlug = await page.evaluate(
    () => document.querySelector("[data-active-component]")?.getAttribute("data-active-component") ?? null,
  )
  if (!activeSlug) {
    console.error("\nNo [data-active-component] on the page — cannot scope to a component.")
    console.error("Nothing was verified. This is a refusal, not a pass.")
    process.exit(1)
  }

  const skipped = Object.keys(corpus.divergences ?? {}).filter((s) => s !== activeSlug)
  if (skipped.length) {
    // A SKIP, deliberately not a check(): a passing line for something never tested is
    // the false-green this whole system exists to refuse.
    console.log(`  SKIP  not mounted, so not verified: ${skipped.join(" ")}`)
  }

  for (const [slug, rows] of Object.entries(corpus.divergences ?? {})) {
    if (slug !== activeSlug) continue

    const withPrompt = rows.filter((r) => r.reviewPrompt)
    const without = rows.filter((r) => !r.reviewPrompt)

    const seen = await page.evaluate(
      ({ refs, fallback }) => {
        const out = {}
        for (const ref of refs) {
          // Scoped to the exact card. A bare `p` query would read whichever card the DOM
          // happens to order first — CLAUDE.md checklist item 10.
          const card = document.querySelector(`[data-review-card="${CSS.escape(ref)}"]`)
          if (!card) {
            out[ref] = { missing: true }
            continue
          }
          const text = card.innerText ?? ""
          out[ref] = { missing: false, text, hasFallback: text.includes(fallback) }
        }
        return out
      },
      { refs: rows.map((r) => r.ref), fallback: FALLBACK },
    )

    const missing = rows.filter((r) => seen[r.ref]?.missing).map((r) => r.ref)
    check(missing.length === 0, `${slug}: every row has a card`, missing.length ? `missing: ${missing.join(" ")}` : "")

    // 1. A written description reaches the screen.
    //    The card clamps the description to three lines, so the FULL string is not always
    //    laid out — `innerText` returns the clamped text. Matched on a generous prefix
    //    rather than equality for that reason, and on a long enough one that two rows
    //    sharing a constant tail (the close register, by design) cannot satisfy each
    //    other's assertion.
    const notShown = withPrompt.filter((r) => {
      const s = seen[r.ref]
      if (!s || s.missing) return false
      const prefix = r.reviewPrompt.slice(0, Math.min(60, r.reviewPrompt.length))
      return !s.text.includes(prefix)
    })
    check(
      notShown.length === 0,
      `${slug}: all ${withPrompt.length} written descriptions render`,
      notShown.length ? `not on screen: ${notShown.map((r) => r.ref).join(" ")}` : "",
    )

    // 2. …and none of them still shows the fallback beside it.
    const bothShown = withPrompt.filter((r) => seen[r.ref]?.hasFallback)
    check(
      bothShown.length === 0,
      `${slug}: no described row also shows the "not written yet" fallback`,
      bothShown.length ? `both: ${bothShown.map((r) => r.ref).join(" ")}` : "",
    )

    // 3. The other direction. Without this, a card that rendered the same text on every
    //    row would pass everything above.
    const silentlyBlank = without.filter((r) => {
      const s = seen[r.ref]
      return s && !s.missing && !s.hasFallback
    })
    check(
      silentlyBlank.length === 0,
      `${slug}: all ${without.length} undescribed rows say so`,
      silentlyBlank.length ? `no description and no fallback: ${silentlyBlank.map((r) => r.ref).join(" ")}` : "",
    )

    console.log(`\n  ${slug}: ${withPrompt.length} described, ${without.length} not yet.`)
  }
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed.`)
if (!results.length) {
  console.error("Nothing was asserted. Treating that as a failure — see the header.")
  process.exit(1)
}
process.exit(failed.length ? 1 : 0)
