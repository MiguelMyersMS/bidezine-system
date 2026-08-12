// ═══════════════════════════════════════════════════════════════════════════════════
// The origin quarantine, verified by render rather than by reading the code.
//
//   npm --prefix sandbox run dev        (or: run build, then preview)
//   node scripts/verify-origin-quarantine.mjs
//
// `scripts/check-quarantine.mjs` proves no import crosses the boundary. This proves the
// other half: that what actually renders in the origin pane IS the origin, is genuinely
// in its own realm, and still behaves — which a static check cannot establish.
//
// Two traps this exists to keep catching, both found the hard way:
//
// 1. **Identity, asserted in both directions.** An earlier version of this script checked
//    only "an <aside> renders inside the frame". It PASSED while the frame was serving a
//    nested copy of the SANDBOX APP — Vite's dev server applies its SPA history fallback
//    to a bare directory URL, so `/origin/rail-sidebar/` returned the app's own
//    index.html with HTTP 200 and no error anywhere. The app has an <aside> too. Every
//    identity check below therefore asserts something only the ORIGIN could produce
//    (`.ds-scroll-region`, its own `#1c2024` rail surface) AND the absence of something
//    only OUR code could produce (any Tailwind utility class — origin is entirely
//    inline-styled). Per Primitive Fidelity Checklist item 10: never trust whatever a
//    bare selector happens to match first. The fix was to spell out `index.html` in
//    `ORIGIN_EMBED_PATH`; this script is what would notice if it were ever shortened back.
//
// 2. **A behaviour that changed for a good reason still has to be re-measured.** Moving
//    origin code into the frame's own realm removed the need for the old hand-written
//    mousemove relay, and also changed what `window.innerWidth` means to RailNav's resize
//    clamp. Both are re-checked live rather than reasoned about — see the drag check.
// ═══════════════════════════════════════════════════════════════════════════════════
import { chromium } from "playwright"

const BASE = "http://localhost:4199"
const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

await page.goto(BASE, { waitUntil: "networkidle" })
await page.getByRole("button", { name: "Origin", exact: true }).click()
await page.waitForTimeout(1500)

const SEL = 'iframe[title*="Origin RailNav"]'
check((await page.locator(SEL).count()) === 1, "the origin pane renders as exactly one iframe")

// ── 1. identity: it is the ORIGIN, and it is NOT the Sandbox app ─────────────────────
const identity = await page.evaluate((sel) => {
  const w = document.querySelector(sel).contentWindow
  const d = w.document
  const all = [...d.querySelectorAll("*")]
  const rail = [...d.querySelectorAll("aside div")].find(
    (el) => w.getComputedStyle(el).backgroundColor === "rgb(28, 32, 36)",
  )
  return {
    title: d.title,
    // Origin's own scrollbar class, defined and injected by RailNav itself. Nothing in bidezine
    // produces it.
    originScrollClass: d.querySelectorAll(".ds-scroll-region").length,
    // Origin is entirely inline-styled. Any Tailwind utility class inside the frame would mean the
    // Sandbox app (or something else of ours) is rendering in there.
    tailwindClasses: all.filter((el) =>
      typeof el.className === "string" && /\b(bg-card|h-screen|text-muted-foreground|shrink-0)\b/.test(el.className),
    ).length,
    railSurface: rail ? w.getComputedStyle(rail).backgroundColor : null,
  }
}, SEL)

check(
  identity.title.includes("Origin RailNav"),
  "the framed document is the quarantined origin page",
  `document.title = ${JSON.stringify(identity.title)}`,
)
check(
  identity.originScrollClass > 0 && identity.railSurface === "rgb(28, 32, 36)",
  "it is the REAL origin rail (origin-only markers present)",
  `.ds-scroll-region elements = ${identity.originScrollClass}, rail surface = ${identity.railSurface} (origin's own #1c2024)`,
)
check(
  identity.tailwindClasses === 0,
  "the Sandbox app is NOT rendering inside the frame",
  `Tailwind utility classes found in frame = ${identity.tailwindClasses} (must be 0; origin is entirely inline-styled)`,
)

// ── 2. separate realm ────────────────────────────────────────────────────────────────
await page.evaluate(() => {
  window.__SANDBOX_APP_REALM__ = true
})
const isolation = await page.evaluate((sel) => {
  const w = document.querySelector(sel).contentWindow
  return {
    separateWindow: w !== window,
    separateDocument: w.document !== document,
    markerLeaked: w.__SANDBOX_APP_REALM__ === true,
    reactShared: w.React === window.React && w.React !== undefined,
    frameUrl: w.location.pathname + w.location.search,
  }
}, SEL)
check(
  isolation.separateWindow && isolation.separateDocument && !isolation.markerLeaked && !isolation.reactShared,
  "the frame is a genuinely separate realm, not a React subtree",
  `separate window=${isolation.separateWindow}, separate document=${isolation.separateDocument}, app marker visible inside=${isolation.markerLeaked}`,
)

// ── 3. theme reaches the frame, without re-navigating it ─────────────────────────────
const railBg = () =>
  page.evaluate((sel) => {
    const w = document.querySelector(sel).contentWindow
    const rail = [...w.document.querySelectorAll("aside div")].find((el) => {
      const bg = w.getComputedStyle(el).backgroundColor
      return bg === "rgb(28, 32, 36)" || bg === "rgb(17, 17, 19)"
    })
    return rail ? w.getComputedStyle(rail).backgroundColor : null
  }, SEL)

const bgBefore = await railBg()
const urlBefore = isolation.frameUrl

await page.getByRole("button", { name: /switch to (dark|light) mode/i }).click()
await page.waitForTimeout(1200)

const bgAfter = await railBg()
const urlAfter = await page.evaluate((sel) => {
  const w = document.querySelector(sel).contentWindow
  return w.location.pathname + w.location.search
}, SEL)

check(
  bgBefore === "rgb(28, 32, 36)" && bgAfter === "rgb(17, 17, 19)",
  "the app's own theme toggle reaches the frame over postMessage",
  `rail surface ${bgBefore} -> ${bgAfter} (origin's own #1c2024 light -> #111113 dark)`,
)
check(
  urlAfter === urlBefore,
  "the frame did NOT re-navigate on theme change (no remount; RailNav's ResizeObserver survives)",
  `url before=${urlBefore}  after=${urlAfter}`,
)

// ── 4. panel drag-resize, with the hand-written mousemove relay removed ──────────────
// The old shim relayed mousemove/mouseup from the frame to the parent, because RailNav's module
// code ran in the parent realm. It now runs inside the frame, so its own window.addEventListener
// receives those events directly. That claim is tested here rather than assumed.
const frameBox = await page.locator(SEL).boundingBox()
const handle = await page.evaluate((sel) => {
  const w = document.querySelector(sel).contentWindow
  const el = w.document.querySelector('[role="separator"][aria-label*="Resize"]')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: el.getAttribute("aria-label") }
}, SEL)

const panelWidth = () =>
  page.evaluate((sel) => {
    const w = document.querySelector(sel).contentWindow
    const el = w.document.querySelector('[role="separator"][aria-label*="Resize"]')
    // The panel is the separator's own parent box.
    return el ? el.parentElement.getBoundingClientRect().width : null
  }, SEL)

if (!handle) {
  check(false, "the panel still drag-resizes with the relay removed", "resize separator not found in frame")
} else {
  // Dragged INWARD on purpose. Origin's own clamp is
  //   viewportMax = max(LAYOUT.panelW, window.innerWidth - railW - panelGap - SPACE[6])
  // and `window.innerWidth` inside the frame is the FRAME's width (396), so widening is capped at
  // 396 - 54 - 8 - 32 = 302px — only 2px of travel. That cap is origin's own logic applied to its
  // own viewport (which is what real Storybook does too, since every story renders in an iframe);
  // it is not a defect in the embedding. Shrinking has genuine room: 300px down to
  // PANEL_MIN_WIDTH = 240px.
  const before = await panelWidth()
  await page.mouse.move(frameBox.x + handle.x, frameBox.y + handle.y)
  await page.mouse.down()
  await page.mouse.move(frameBox.x + handle.x - 60, frameBox.y + handle.y, { steps: 15 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  const after = await panelWidth()
  check(
    after !== null && before !== null && Math.abs(after - before) > 40,
    "the panel still drag-resizes with the hand-written mousemove relay removed",
    `handle "${handle.label}"  panel width ${before?.toFixed(1)}px -> ${after?.toFixed(1)}px  (dragged -60px; origin's own PANEL_MIN_WIDTH is 240)`,
  )
}

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
process.exit(failed.length ? 1 : 0)
