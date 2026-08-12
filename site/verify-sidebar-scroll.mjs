// ═══════════════════════════════════════════════════════════════════════════════════
// SidebarContent's ScrollArea migration, verified by measurement against the PRODUCTION
// build.
//
//   npm --prefix site run build && npm --prefix site run preview   # one terminal
//   npm --prefix site run verify-sidebar                           # another
//
// `SidebarContent` used a raw `overflow-auto` until M9's rule check found it — the only
// component in `src/ui/` still on a native scroll region that CLAUDE.md's scroll protocol
// does not list as a deliberate exception. This is the proof that replacing it did not
// break what it replaced.
//
// ── What is actually asserted, and why it is not "it renders" ──────────────────────
// Checklist item 9: swapping a plain `overflow-y-auto` div for `ScrollArea` broke
// scrolling outright once before. `ScrollArea`'s Root sets no `overflow` of its own, so it
// never received flexbox's automatic-minimum-size-of-0 treatment the old div relied on —
// it grew to fit its content and there was nothing left to scroll. It rendered perfectly.
// So this drives `scrollTop` and requires it to move.
//
// ── Production build, not the dev server ──────────────────────────────────────────
// Checklist item 15. And it matters concretely here beyond minification: `site/` imports
// the BUILT `@bidezine/system`, not `src/`. The first run of this check measured
// `overflow: auto` and no viewport — the source change was real but `dist/` was stale.
// Editing `src/ui/` and rebuilding only the site proves nothing. Run `npm run build` at the
// repo root first.
// ═══════════════════════════════════════════════════════════════════════════════════

import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const requireFromVerifier = createRequire(join(HERE, "..", "verifier", "package.json"))
const playwright = await import(pathToFileURL(requireFromVerifier.resolve("playwright")).href)
const chromium = playwright.chromium ?? playwright.default?.chromium

const BASE = process.env.SITE_URL ?? "http://localhost:4188"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

try {
  const probe = await fetch(`${BASE}/components/sidebar`, { signal: AbortSignal.timeout(4000) })
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
} catch (err) {
  console.error(`\nNothing is serving ${BASE} (${err.message}).`)
  console.error("\n    npm run build && npm --prefix site run build && npm --prefix site run preview\n")
  console.error("Not skipped on purpose — a check that quietly does nothing reads as a passing one.")
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 620 } })
const noise = []
page.on("pageerror", (e) => noise.push(e.message))
page.on("console", (m) => m.type() === "error" && noise.push(m.text()))

try {
  await page.goto(`${BASE}/components/sidebar`, { waitUntil: "networkidle" })

  // Scoped to the sidebar's own instance, never "the first ScrollArea on the page" —
  // checklist item 10: a bare selector once "confirmed" a rail's scrolling while actually
  // measuring the surrounding page's unrelated instance.
  const content = page.locator('[data-slot="sidebar-content"]').first()
  await content.waitFor({ state: "visible", timeout: 20_000 })
  const viewport = content.locator('[data-slot="scroll-area-viewport"]').first()

  check((await viewport.count()) === 1, "SidebarContent is a real ScrollArea — one viewport inside this instance")
  const overflow = await content.evaluate((el) => getComputedStyle(el).overflow)
  check(overflow !== "auto" && overflow !== "scroll", "and its Root no longer carries a native overflow", `computed overflow = ${overflow}`)

  // ── it actually scrolls ───────────────────────────────────────────────────────────
  const fits = await viewport.evaluate((el) => el.scrollHeight <= el.clientHeight)
  if (fits) {
    // Asserting "it scrolls" against content that fits proves nothing in either direction,
    // so the overflow is forced rather than recorded as a pass.
    await content.evaluate((el) => {
      const filler = document.createElement("div")
      filler.id = "__scrolltest__"
      filler.style.height = "2000px"
      el.querySelector('[data-slot="scroll-area-viewport"]').firstElementChild.appendChild(filler)
    })
    await page.waitForTimeout(300)
  }

  const box = await viewport.evaluate((el) => ({ s: el.scrollHeight, c: el.clientHeight }))
  check(box.s > box.c, "the viewport is genuinely scrollable — it did not just grow to fit its content", `scrollHeight ${box.s} > clientHeight ${box.c}`)
  const moved = await viewport.evaluate((el) => {
    el.scrollTop = 120
    return el.scrollTop
  })
  check(moved > 0, "and scrollTop moves — the exact regression checklist item 9 records", `scrollTop = ${moved}`)

  // ── the conditional gutter, in BOTH directions ────────────────────────────────────
  const inner = viewport.locator("> div > div").first()
  check(parseFloat(await inner.evaluate((el) => getComputedStyle(el).paddingInlineEnd)) > 0, "the scrollbar-side gutter is present while content overflows")

  await content.evaluate((el) => {
    document.getElementById("__scrolltest__")?.remove()
    const holder = el.querySelector('[data-slot="scroll-area-viewport"]').firstElementChild
    holder.style.height = "40px"
    holder.style.overflow = "hidden"
  })
  await page.waitForTimeout(400)
  check(
    parseFloat(await inner.evaluate((el) => getComputedStyle(el).paddingInlineEnd)) === 0,
    "and disappears when it no longer overflows — the half a one-directional check misses",
  )

  // ── icon-collapsed mode still suppresses scrolling ────────────────────────────────
  // The old `group-data-[collapsible=icon]:overflow-hidden` sat on the element that used to
  // scroll. Radix's Viewport scrolls now, and sets its overflow as an INLINE style — so the
  // replacement needs `!important` to win. Without it the class compiled fine and did
  // nothing, which is only visible by measuring in the collapsed state.
  await page.reload({ waitUntil: "networkidle" })
  await content.waitFor({ state: "visible", timeout: 20_000 })
  const expanded = await viewport.evaluate((el) => getComputedStyle(el).overflowY)
  await page.keyboard.press("Control+b")
  await page.waitForTimeout(700)
  const collapsedState = await page.locator('[data-slot="sidebar"]').first().getAttribute("data-collapsible")
  const collapsed = await viewport.evaluate((el) => getComputedStyle(el).overflowY)
  check(collapsedState === "icon" && collapsed === "hidden", "icon-collapsed mode suppresses scrolling, as the raw overflow-auto did", `data-collapsible=${collapsedState}, overflow-y=${collapsed}`)

  await page.keyboard.press("Control+b")
  await page.waitForTimeout(700)
  check((await viewport.evaluate((el) => getComputedStyle(el).overflowY)) === expanded, "and re-expanding restores it", `back to ${expanded}`)

  check(noise.length === 0, "no console or page errors", noise.slice(0, 2).join(" | ") || "clean")
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
