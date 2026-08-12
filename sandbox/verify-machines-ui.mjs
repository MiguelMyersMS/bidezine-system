// ═══════════════════════════════════════════════════════════════════════════════════
// M8's machine switcher, verified by render.
//
//   npm --prefix sandbox run dev        # in one terminal
//   npm --prefix sandbox run verify-ui  # in another
//
// `verify-readonly.mjs` proves the SERVER refuses a foreign write, which is the claim
// that matters. This proves the separate, weaker thing that file explicitly does not:
// that the running app mounts that middleware, renders the switcher, and says so on
// screen — built from real primitives rather than markup shaped like them.
//
// ── Why it needs a running server, and why it says so instead of pretending ────────
// Playwright against a real Vite dev server is the only way to check "Vite mounts the
// middleware" and "the tab renders". So this REFUSES to run rather than skipping: a
// skipped check that prints nothing looks exactly like a passing one in a scroll-back,
// and this project has already shipped a requirement that passed by being unable to fail
// (evidence.current, vacuous since M1 — found at M7 step 4).
//
// ── It waits for content, never for a duration ─────────────────────────────────────
// /api/machines opens a Fabric connection and takes seconds. The first version of this
// check asserted after a fixed 1500ms, caught the "Reading machines…" placeholder, and
// reported three failures that were entirely the test's own impatience. Every wait below
// is on a real condition.
// ═══════════════════════════════════════════════════════════════════════════════════

import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// Playwright is the verifier's dependency, not the Sandbox app's, and it stays that way
// deliberately: `sandbox/` ships a dev UI, and adding a browser engine to its dependency
// tree for one check would make every `npm install` here pull one. Resolved through Node's
// real resolution FROM the verifier's directory rather than by a hand-written
// `../verifier/node_modules/...` path, which would break the first time npm hoisted or
// deduped it somewhere else.
//
// If this throws, run `npm --prefix verifier install` — and see `.env.example` for
// PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, which the network here requires.
const HERE = dirname(fileURLToPath(import.meta.url))
const VERIFIER = join(HERE, "..", "verifier")
const requireFromVerifier = createRequire(join(VERIFIER, "package.json"))
// Destructured defensively: playwright's entry is CommonJS, and Node's named-export
// detection for CJS does not surface `chromium` here — it arrives on `default` instead.
// Reading it off the namespace alone yields `undefined` and fails later at `.launch()`,
// several lines from the actual cause.
const playwright = await import(pathToFileURL(requireFromVerifier.resolve("playwright")).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
if (!chromium) throw new Error("Could not load playwright's chromium from the verifier's install.")

const BASE = process.env.SANDBOX_URL ?? "http://localhost:4199"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

// Refuse early and legibly, rather than failing later as a confusing timeout.
try {
  const probe = await fetch(BASE, { signal: AbortSignal.timeout(4000) })
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
} catch (err) {
  console.error(`\nNothing is serving ${BASE} (${err.message}).`)
  console.error("This check drives the real app. Start it first:\n")
  console.error("    npm --prefix sandbox run dev\n")
  console.error("Not skipped on purpose — a check that quietly does nothing reads as a passing one.")
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const noise = []
page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`))
page.on("console", (m) => m.type() === "error" && noise.push(`console: ${m.text()}`))

try {
  await page.goto(BASE, { waitUntil: "networkidle" })
  await page.getByRole("tab", { name: "Machines" }).click()
  await page.getByText("This machine:", { exact: false }).waitFor({ state: "visible", timeout: 45_000 })

  const thisMachine = (await page.locator("text=This machine:").first().textContent())?.trim()
  check(!!thisMachine && !/not identified/.test(thisMachine), "the tab renders and names this machine", thisMachine)

  // Real data, not a placeholder: assert the shape rather than a hard-coded count, so the
  // check keeps meaning something as the corpus resolves divergences.
  const progress = page.locator("text=/\\d+\\/\\d+ resolved/").first()
  check(await progress.isVisible(), "component progress is read from the corpus", (await progress.textContent())?.trim())

  // data-slot is what every ported shadcn primitive stamps on its own root. A hand-rolled
  // lookalike would render fine and not have it — which is exactly the class of violation
  // CLAUDE.md's "no hand-rolled components" rule exists to catch, and which a screenshot
  // cannot distinguish.
  const trigger = page.locator("#observed-machine")
  check((await trigger.getAttribute("data-slot")) === "select-trigger", "the switcher is the real Select primitive", `data-slot=${await trigger.getAttribute("data-slot")}`)

  // ── the transfer control ──────────────────────────────────────────────────────────
  // The label is not cosmetic: it is the only place the page shows whether it believes
  // this component is owned. It read "Claim…" for an owned component on the first pass,
  // because the API summary dropped `owner` — which would also have sent `from: undefined`
  // and had every transfer refused as a stale read. A clean typecheck said nothing; the
  // rendered button did.
  const transfer = page.getByRole("button", { name: /Hand over…|Claim…/ }).first()
  await transfer.waitFor({ state: "visible", timeout: 10_000 })
  check(
    (await transfer.textContent())?.includes("Hand over"),
    "an owned component offers 'Hand over…', not 'Claim…' — the page knows it is owned",
    (await transfer.textContent())?.trim(),
  )

  await transfer.click()
  const submit = page.getByRole("button", { name: "Transfer", exact: true })
  await submit.waitFor({ state: "visible", timeout: 10_000 })
  check(
    await submit.isDisabled(),
    "Transfer is disabled before a destination and a reason are given",
    "usp_transfer_component requires a note; an audit row reading '' is an audit trail in name only",
  )
  // Left closed rather than submitted: this check is deliberately non-mutating, and
  // verify-readonly.mjs already drives a real transfer through the route.
  await page.getByRole("button", { name: "Cancel", exact: true }).click()

  // Driven by a real interaction, not by setting a prop.
  const options = await page.evaluate(async () => (await (await fetch("/api/machines", { cache: "no-store" })).json()).machines.map((m) => m.name))
  const me = options.find((n) => thisMachine?.includes(n))
  const other = options.find((n) => n !== me)
  check(!!other, "there is a second machine to observe", `machines: ${options.join(", ")}`)

  await trigger.click()
  await page.getByRole("option", { name: new RegExp(other) }).click()

  const notice = page.getByText("owns the components below", { exact: false })
  await notice.waitFor({ state: "visible", timeout: 10_000 })
  const text = (await notice.textContent()) ?? ""
  check(true, `switching to ${other} shows the read-only explanation`)
  check(
    /refused by the database, not by this screen/.test(text),
    "which attributes the refusal to the database, not to the UI",
    text.replace(/\s+/g, " ").slice(0, 120),
  )
  check(/reopen/i.test(text), "and states that an observer can still reopen")

  // Switch back, so a human opening the app next finds it as they left it.
  await trigger.click()
  await page.getByRole("option", { name: new RegExp(me ?? "") }).first().click()
  await notice.waitFor({ state: "hidden", timeout: 10_000 })
  check(true, "switching back clears the read-only notice")

  check(noise.length === 0, "no console errors or page errors throughout", noise.slice(0, 2).join(" | ") || "clean")
} catch (err) {
  check(false, "the check completed", err.message.split("\n")[0])
} finally {
  await browser.close()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
