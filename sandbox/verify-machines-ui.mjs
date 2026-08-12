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

  // ── readiness, not an investigation ───────────────────────────────────────────────
  // Run immediately after editing any file the dev server watches, the first click times
  // out: Vite is mid-reload, the HTTP probe above already answers 200, and the document
  // that arrives is not yet interactive. Reproduced three times, always straight after an
  // edit, never on a settled server. So the first interaction waits for the tab to be
  // genuinely actionable rather than assuming a 200 means ready — a race worth absorbing
  // rather than diagnosing, since nothing about it involves the code under test.
  const machinesTab = page.getByRole("tab", { name: "Machines" })
  await machinesTab.waitFor({ state: "visible", timeout: 30_000 })
  await machinesTab.click({ timeout: 30_000 }).catch(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await machinesTab.click({ timeout: 30_000 })
  })
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
  // The waitFor is how the check WAITS; the check itself has to assert something, or it
  // reports a result it never evaluated. Two `check(true, …)` calls sat here doing exactly
  // that — passing unconditionally under labels describing assertions made by a `waitFor`
  // reporting under a different label. Caught by review, one screen below this file's own
  // header condemning the same shape.
  await notice.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {})
  check(await notice.isVisible(), `switching to ${other} shows the read-only explanation`)
  const text = (await notice.textContent().catch(() => "")) ?? ""
  check(
    /refused by the database, not by this screen/.test(text),
    "which attributes the refusal to the database, not to the UI",
    text.replace(/\s+/g, " ").slice(0, 120),
  )
  check(/reopen/i.test(text), "and states that an observer can still reopen")

  // Switch back, so a human opening the app next finds it as they left it.
  await trigger.click()
  await page.getByRole("option", { name: new RegExp(me ?? "") }).first().click()
  await notice.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {})
  check(!(await notice.isVisible()), "switching back clears the read-only notice")

  // ── the control itself, not just the paragraph next to it ─────────────────────────
  // Everything above asserts that the read-only EXPLANATION renders. None of it would
  // notice if every Approve button stayed live underneath, and `EvidenceWidget`'s
  // `ownership?.mayWrite ?? true` fails OPEN by design — so a payload-shape drift silently
  // re-enables approval everywhere while the read-only paragraph keeps rendering and this
  // suite keeps passing. Raised by review; this is the check that closes it.
  //
  // Requires the component to actually be foreign-owned, so this section moves ownership
  // and puts it back in a finally. That makes this the one part of this file that mutates
  // anything.
  const transferTo = async (from, to, note) => {
    const res = await page.evaluate(
      async ([f, t, n]) => {
        const r = await fetch("/api/component/rail-sidebar/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: f, to: t, note: n }),
        })
        return { status: r.status, body: await r.json() }
      },
      [from, to, note],
    )
    if (res.status !== 200) throw new Error(`transfer ${from} -> ${to} failed: ${res.body?.error}`)
  }

  await transferTo(me, other, "verify-machines-ui.mjs: proving Approve is disabled for an observer. Handed straight back.")
  try {
    await page.getByRole("tab", { name: "Full divergence list" }).click()
    // The list is an Accordion and every category starts collapsed, so no row — and no
    // "Evidence & approval" button — exists until one is expanded. Waiting for the button
    // without this simply times out against a page that is working correctly.
    await page.locator("[data-slot=accordion-trigger]").first().click()

    const evidenceButton = page.getByRole("button", { name: "Evidence & approval" }).first()
    await evidenceButton.waitFor({ state: "visible", timeout: 20_000 })
    await evidenceButton.click()

    const approve = page.getByRole("button", { name: /^(Approve|Resolved)$/ })
    await approve.waitFor({ state: "visible", timeout: 45_000 })

    // Necessary but NOT sufficient, and worth saying so: every row in this corpus has an
    // unmet gate, so `!gate.ready` already disables Approve on its own. Verified by
    // injecting the exact drift this section exists to catch (`mayWrite: true` hard-coded
    // in the API) and re-running — this check still PASSED; only the reason below caught
    // it. A disabled control does not tell you WHY it is disabled, and here two different
    // mechanisms would both produce one.
    check(await approve.isDisabled(), "Approve is disabled while another machine owns the component", "necessary but not sufficient — the gate disables it too; the reason below is the real assertion")
    check(
      /owns this component/.test((await approve.getAttribute("title")) ?? ""),
      "and the reason it gives is OWNERSHIP, not the evidence gate",
      (await approve.getAttribute("title"))?.slice(0, 110),
    )
    // Reopen must stay live for the same observer — the distinction the whole design rests
    // on, and invisible in a screenshot of a disabled Approve.
    const reopen = page.getByRole("button", { name: "Reopen…" })
    check(await reopen.isEnabled(), "while Reopen stays ENABLED — an observer can still raise a concern")
  } finally {
    await transferTo(other, me, "verify-machines-ui.mjs: restoring after the disabled-Approve check.")
  }

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
