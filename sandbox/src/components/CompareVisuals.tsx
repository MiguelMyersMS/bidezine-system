import { useEffect, useState } from "react"
import {
  Button,
  CheckIcon,
  ChevronDownIcon,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  MoreHorizontalIcon,
  PanelLeftIcon,
  SearchIcon,
  XIcon,
  cn,
} from "@bidezine/system"
import { proposedDarkRailTokens } from "@/data/rail-sidebar"
import type {
  ColorVisual,
  ElevationVisual,
  IconVisual,
  MotionVisual,
  ShapeVisual,
  TypeVisual,
  Visual,
  ZIndexVisual,
} from "@/data/rail-sidebar"

/** Bidezine icon components addressable by manifest name, for "after" comparisons. */
const BIDEZINE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  SearchIcon,
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
}

/** Raw inline SVGs for glyphs that aren't (yet) in our manifest — sourced directly from the
 * origin project's icon file or @fluentui/svg-icons, never imported into src/ui. Preview-only.
 *
 * not-an-action-icon: renders a static comparison glyph inside a preview panel, never as a
 * child of Button/DropdownMenuItem, so `fillActionIcons` never walks it and there is no
 * hover/press fill to participate in. Setting `isActionIcon = true` here would assert it
 * takes part in a system it is never handed to — a false marker is worse than none, because
 * the next person greps for the marker to find the real participants. Flagged by
 * `scripts/check-rules.mjs` (R3), exempted here rather than silenced there. */
function RawSvgIcon({ viewBox = "0 0 20 20", d, size = 20 }: { viewBox?: string; d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const SWATCH_BASE = "flex h-14 w-14 items-center justify-center rounded-md border text-[10px] text-center"

function IconCompare({ v }: { v: IconVisual }) {
  const After = v.afterIconName ? BIDEZINE_ICON_MAP[v.afterIconName] : undefined
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <div className={cn(SWATCH_BASE, "bg-muted")}>
          <RawSvgIcon d={v.beforeSvgPath} viewBox={v.beforeViewBox} />
        </div>
        <p className="max-w-24 text-center text-xs text-muted-foreground">{v.beforeLabel}</p>
      </div>
      <span className="text-muted-foreground">→</span>
      <div className="flex flex-col items-center gap-1">
        <div className={cn(SWATCH_BASE, "bg-card")}>
          {After ? <After className="h-5 w-5" /> : <span className="text-muted-foreground">?</span>}
        </div>
        <p className="max-w-24 text-center text-xs text-muted-foreground">
          {v.afterLabel ?? (After ? "bidezine equivalent" : "no equivalent yet")}
        </p>
      </div>
      {v.afterNote ? <p className="text-xs text-muted-foreground italic">{v.afterNote}</p> : null}
    </div>
  )
}

/**
 * Real, interactive preview of the panel-header "\u22ef" (More) menu — built entirely from the
 * actual bidezine DropdownMenu primitives (never hand-rolled markup), reproducing exactly the rows
 * FunctionalRailSidebar.tsx composes at this location. Open it and hover/click/toggle the rows to
 * see the RESOLVED, live behavior for C-6/C-7/C-8 — no simulation, no approximation.
 */
function PanelHeaderMenuDemo() {
  const [searchChecked, setSearchChecked] = useState(true)
  return (
    <div className="flex flex-col items-start gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="More">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem inset>Expand all</DropdownMenuItem>
          <DropdownMenuItem inset>Collapse all</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={searchChecked} onCheckedChange={setSearchChecked}>
            Search box
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground italic">
        Click to open, then hover, click-hold, and toggle "Search box" — this is the real, live
        panel-header menu, now with its resolved hover/pressed/checked states applied.
      </p>
    </div>
  )
}

/**
 * Real, interactive preview of the panel-header "\u22ef" TRIGGER button itself (distinct from the
 * menu rows above) — the actual Button/ghost/icon-xs recipe used at this call site. Press and hold
 * to confirm the resolved pressed behavior for C-9.
 */
function EllipsisTriggerDemo() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="ghost" size="icon-xs" aria-label="More">
        <MoreHorizontalIcon />
      </Button>
      <p className="text-xs text-muted-foreground italic">
        Press and hold — now shows a real, distinct pressed state (active:bg-accent), reusing the
        same --accent token the hover state already used.
      </p>
    </div>
  )
}

function ColorUsageDemo({ kind }: { kind: NonNullable<ColorVisual["usageDemo"]> }) {
  return kind === "panel-header-menu" ? <PanelHeaderMenuDemo /> : <EllipsisTriggerDemo />
}

function ColorCompare({ v }: { v: ColorVisual }) {
  return (
    <div className="flex flex-col gap-3">
      {v.locationHint ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Used in:</span> {v.locationHint}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <div
          className="h-14 w-14 rounded-md border dark:hidden"
          style={{ background: v.beforeHexLight }}
        />
        {v.beforeHexDark ? (
          <div
            className="hidden h-14 w-14 rounded-md border dark:block"
            style={{ background: v.beforeHexDark }}
          />
        ) : (
          <div className="hidden h-14 w-14 rounded-md border dark:block" style={{ background: v.beforeHexLight }} />
        )}
        <p className="max-w-28 text-center text-xs text-muted-foreground">{v.beforeLabel}</p>
      </div>
      <span className="text-muted-foreground">→</span>
      <div className="flex flex-col items-center gap-1">
        <div
          className="h-14 w-14 rounded-md border dark:hidden"
          style={
            v.afterVar
              ? { background: `var(${v.afterVar})` }
              : v.afterHexLight
                ? { background: v.afterHexLight }
                : undefined
          }
        >
          {!v.afterVar && !v.afterHexLight ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
          ) : null}
        </div>
        <div
          className="hidden h-14 w-14 rounded-md border dark:block"
          style={
            v.afterVar
              ? { background: `var(${v.afterVar})` }
              : v.afterHexDark ?? v.afterHexLight
                ? { background: v.afterHexDark ?? v.afterHexLight }
                : undefined
          }
        >
          {!v.afterVar && !v.afterHexDark && !v.afterHexLight ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
          ) : null}
        </div>
        <p className="max-w-28 text-center text-xs text-muted-foreground">
          {v.afterLabel ?? v.afterVar ?? v.afterHexLight ?? "not yet proposed"}
        </p>
      </div>
      {v.afterNote ? <p className="max-w-64 text-xs text-muted-foreground italic">{v.afterNote}</p> : null}
      </div>
      {v.usageDemo ? (
        <div className="rounded-md border bg-muted/30 p-3">
          <ColorUsageDemo kind={v.usageDemo} />
        </div>
      ) : null}
    </div>
  )
}

function TypeCompare({ v }: { v: TypeVisual }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
      <div className="flex-1 rounded-md border p-3">
        <p className="mb-1 text-xs text-muted-foreground">{v.beforeLabel}</p>
        <p style={{ fontFamily: v.beforeFamily, fontSize: v.beforeSize, fontWeight: v.beforeWeight as never }}>
          The quick brown fox
        </p>
      </div>
      <div className="flex-1 rounded-md border p-3">
        <p className="mb-1 text-xs text-muted-foreground">{v.afterLabel}</p>
        <p className={v.afterClassName}>The quick brown fox</p>
      </div>
    </div>
  )
}

function ShapeCompare({ v }: { v: ShapeVisual }) {
  if (v.beforeLabel.includes("railW") || v.afterLabel.includes("Sidebar icon-rail")) {
    return (
      <RailWidthCompare
        beforeLabel={v.beforeLabel}
        afterLabel={v.afterLabel}
        beforeWidth={v.beforeStyle.width ?? "54px"}
        afterWidth={v.afterStyle.width ?? "48px"}
      />
    )
  }

  if (v.beforeLabel.includes("railButton") || v.afterLabel.includes("Button default")) {
    return (
      <ButtonSizeCompare
        beforeLabel={v.beforeLabel}
        afterLabel={v.afterLabel}
        beforeSize={v.beforeStyle.width ?? "38px"}
        afterSize={v.afterStyle.width ?? "36px"}
        beforeRadius={v.beforeStyle.radius ?? "8px"}
        afterRadius={v.afterStyle.radius ?? "8px"}
      />
    )
  }

  if (v.beforeLabel.includes("panelW") || v.afterLabel.includes("Sidebar default")) {
    return (
      <PanelWidthCompare
        beforeLabel={v.beforeLabel}
        afterLabel={v.afterLabel}
        beforeWidth={v.beforeStyle.width ?? "150px"}
        afterWidth={v.afterStyle.width ?? "128px"}
      />
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-6">
      <div className="flex flex-col items-center gap-1">
        <div
          className="border bg-muted"
          style={{
            width: v.beforeStyle.width ?? "3.5rem",
            height: v.beforeStyle.height ?? "3.5rem",
            borderRadius: v.beforeStyle.radius ?? 0,
          }}
        />
        <p className="max-w-28 text-center text-xs text-muted-foreground">{v.beforeLabel}</p>
      </div>
      <span className="text-muted-foreground">vs</span>
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn("border bg-card", v.afterStyle.className)}
          style={{
            width: v.afterStyle.width ?? "3.5rem",
            height: v.afterStyle.height ?? "3.5rem",
            borderRadius: v.afterStyle.radius,
          }}
        />
        <p className="max-w-28 text-center text-xs text-muted-foreground">{v.afterLabel}</p>
      </div>
    </div>
  )
}

function RailWidthCompare({
  beforeLabel,
  afterLabel,
  beforeWidth,
  afterWidth,
}: {
  beforeLabel: string
  afterLabel: string
  beforeWidth: string
  afterWidth: string
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <RailWidthSample label={beforeLabel} width={beforeWidth} tone="origin" />
      <RailWidthSample label={afterLabel} width={afterWidth} tone="adjusted" />
    </div>
  )
}

function RailWidthSample({
  label,
  width,
  tone,
}: {
  label: string
  width: string
  tone: "origin" | "adjusted"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex h-28 overflow-hidden rounded-md border bg-card">
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-between p-2 text-[9px]",
            tone === "origin" ? "bg-muted" : "bg-secondary",
          )}
          style={{ width }}
        >
          <div className="h-5 w-5 rounded-sm bg-foreground/80" />
          <div className="h-px w-full bg-border" />
          <div className="h-5 w-5 rounded-sm border bg-background" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium">{tone === "origin" ? "Origin rail column" : "Adjusted rail column"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function ButtonSizeCompare({
  beforeLabel,
  afterLabel,
  beforeSize,
  afterSize,
  beforeRadius,
  afterRadius,
}: {
  beforeLabel: string
  afterLabel: string
  beforeSize: string
  afterSize: string
  beforeRadius: string
  afterRadius: string
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ButtonSizeSample label={beforeLabel} size={beforeSize} radius={beforeRadius} tone="origin" />
      <ButtonSizeSample label={afterLabel} size={afterSize} radius={afterRadius} tone="adjusted" />
    </div>
  )
}

function ButtonSizeSample({
  label,
  size,
  radius,
  tone,
}: {
  label: string
  size: string
  radius: string
  tone: "origin" | "adjusted"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex h-24 items-center justify-center rounded-md border bg-card">
        <div
          className={cn("flex items-center justify-center border", tone === "origin" ? "bg-muted" : "bg-secondary")}
          style={{ width: size, height: size, borderRadius: radius }}
        >
          <div className="h-4 w-4 rounded-sm bg-foreground/80" />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium">{tone === "origin" ? "Origin rail button" : "Adjusted button"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function PanelWidthCompare({
  beforeLabel,
  afterLabel,
  beforeWidth,
  afterWidth,
}: {
  beforeLabel: string
  afterLabel: string
  beforeWidth: string
  afterWidth: string
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PanelWidthSample label={beforeLabel} width={beforeWidth} tone="origin" />
      <PanelWidthSample label={afterLabel} width={afterWidth} tone="adjusted" />
    </div>
  )
}

function PanelWidthSample({
  label,
  width,
  tone,
}: {
  label: string
  width: string
  tone: "origin" | "adjusted"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex h-28 overflow-hidden rounded-md border bg-card">
        <div className="w-8 shrink-0 bg-muted" />
        <div
          className={cn("flex flex-col gap-2 p-3", tone === "origin" ? "bg-card" : "bg-secondary")}
          style={{ width }}
        >
          <div className="h-3 w-16 rounded bg-foreground/60" />
          <div className="h-3 w-24 rounded bg-muted-foreground/40" />
          <div className="h-3 w-20 rounded bg-muted-foreground/40" />
          <div className="h-3 w-28 rounded bg-muted-foreground/40" />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium">{tone === "origin" ? "Origin expanded panel" : "Adjusted sidebar panel"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function MotionCompare({ v }: { v: MotionVisual }) {
  const [play, setPlay] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-32 overflow-hidden rounded-md border bg-muted">
            <div
              key={`before-${play}`}
              className="h-full bg-foreground/40"
              style={{
                width: "40%",
                animation: `sandbox-slide ${v.beforeDurationMs}ms ${v.beforeEasing} both`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{v.beforeLabel}</p>
        </div>
        {v.afterDurationMs ? (
          <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-32 overflow-hidden rounded-md border bg-card">
              <div
                key={`after-${play}`}
                className="h-full bg-primary/60"
                style={{
                  width: "40%",
                  animation: `sandbox-slide ${v.afterDurationMs}ms ${v.afterEasing ?? "ease"} both`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{v.afterLabel}</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setPlay((p) => p + 1)}
          className="text-muted-foreground"
        >
          Replay
        </Button>
      </div>
      {v.recommendation ? (
        <p className="max-w-md text-xs text-muted-foreground italic">{v.recommendation}</p>
      ) : null}
      <style>{"@keyframes sandbox-slide { from { transform: translateX(-100%); } to { transform: translateX(150%); } }"}</style>
    </div>
  )
}

function ElevationCompare({ v }: { v: ElevationVisual }) {
  return (
    <div className="flex flex-wrap items-center gap-8 py-2">
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-12 w-20 rounded-md bg-card dark:[box-shadow:0_2px_8px_rgba(0,0,0,0.25)]"
          style={{ boxShadow: "0 2px 8px rgba(28,32,36,0.10)" }}
        />
        <p className="text-xs text-muted-foreground">{v.beforeLabel}</p>
      </div>
      <span className="text-muted-foreground">vs</span>
      <div className="flex flex-col items-center gap-2">
        <div className={cn("h-12 w-20 rounded-md bg-card", v.afterShadowClassName)} />
        <p className="text-xs text-muted-foreground">{v.afterLabel}</p>
      </div>
      <p className="max-w-48 text-xs text-muted-foreground italic">
        Toggle light/dark above — both shapes should read correctly in either mode.
      </p>
    </div>
  )
}

function ZIndexCompare({ v }: { v: ZIndexVisual }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-40">
        <div className="absolute left-0 top-0 h-14 w-28 rounded-md border bg-muted" style={{ zIndex: 1 }}>
          <p className="p-1 text-[10px] text-muted-foreground">base layer</p>
        </div>
        <div
          className="absolute left-8 top-6 h-14 w-28 rounded-md border bg-card shadow-md"
          style={{ zIndex: 2 }}
        >
          <p className="p-1 text-[10px] font-medium">{v.beforeLabel}</p>
        </div>
      </div>
      {v.afterValue ? (
        <p className="text-xs text-muted-foreground">
          Proposed stacking value: <span className="font-mono">{v.afterValue}</span>
          {v.afterLabel ? ` — ${v.afterLabel}` : ""}
        </p>
      ) : null}
    </div>
  )
}

/** Dispatches to the right renderer for a divergence row's `visual` field. */
export function VisualCompare({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "icon":
      return <IconCompare v={visual} />
    case "color":
      return <ColorCompare v={visual} />
    case "type":
      return <TypeCompare v={visual} />
    case "shape":
      return <ShapeCompare v={visual} />
    case "motion":
      return <MotionCompare v={visual} />
    case "elevation":
      return <ElevationCompare v={visual} />
    case "zindex":
      return <ZIndexCompare v={visual} />
    default:
      return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// The review card's comparison blocks — see sandbox/REVIEW-CARD-SPEC.md §3.11.
//
// One constant frame for every kind: a rendered example, the role it plays (Current or
// Proposal), and ONE short line that distinguishes it from the other. Only the example
// varies. That constancy is the point — a reviewer who has read one component's cards must
// be able to read the next component's without relearning the layout, so the frame is fixed
// even where a looser one would suit a particular kind slightly better.
//
// Stacked rather than side by side, deliberately: the card sits in a narrow column, and two
// examples across a ~335px card would shrink each below the size at which a colour or a
// typeface can actually be judged.
//
// ── Only three kinds get a block ────────────────────────────────────────────────────
// `icon`, `color`, `typography`. Everything else — motion, elevation, z-index, shape, and
// anything code-shaped — belongs in the canvas, where it can be triggered, or in the
// description. A motion has no static "before" to place beside an "after"; a code fact has
// nothing to render at all, and showing code on a review card is a standing prohibition.
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * The app's light/dark mode, as a live value.
 *
 * Read from `documentElement`'s `dark` class — the same signal `ThemeToggle` writes — and
 * observed, so switching the theme re-renders every example rather than leaving stale
 * values on screen. The card must never hold per-theme values of its own: the whole point
 * of these blocks is that flipping the mode shows what that mode actually looks like.
 */
function useThemeMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  )
  useEffect(() => {
    const read = () => setMode(document.documentElement.classList.contains("dark") ? "dark" : "light")
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])
  return mode
}

/**
 * A CSS custom property's real resolved value, or `null` if it is not defined anywhere.
 *
 * ── Why the card has to ask this at runtime ────────────────────────────────────────
 * A divergence's `afterVar` is a PROPOSED variable name. Some of them are real bidezine
 * tokens that exist today (`--card`, `--accent`, `--border` …); others name a token that
 * has not been authored yet (`--sidebar-rail-*` exists in no file under `tokens/`). The
 * payload does not distinguish them, and nothing except the browser can: "does this token
 * exist" is a question about the compiled stylesheet, not about the record.
 *
 * Getting this wrong is not cosmetic. An undefined `var()` used as a background is invalid
 * at computed-value time, so the element paints nothing and shows whatever is behind it —
 * white on a light card, dark on a dark one. Reported directly by the owner while
 * reviewing B-1: the Proposal swatch looked like a real colour that "switches when I
 * switch themes", i.e. like a proposal to turn the dark rail white. It was an empty box.
 *
 * Re-resolved on theme change, because a token's value differs per mode and the whole
 * point of these blocks is to show the mode you are actually looking at.
 */
function useResolvedVar(name: string | undefined, mode: "light" | "dark"): string | null {
  const [value, setValue] = useState<string | null>(null)
  useEffect(() => {
    if (!name) return setValue(null)
    // Read off the documentElement: that is where both :root and .dark declare, so it is
    // the only node whose computed value reflects the theme actually in force.
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    setValue(raw || null)
  }, [name, mode])
  return value
}

/** One block. `example` is whatever the kind renders; `spec` is the single differentiator. */
function Block({
  role,
  spec,
  children,
  stacked = false,
}: {
  role: "Origin" | "Adjusted"
  spec: string
  children: React.ReactNode
  stacked?: boolean
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className={cn("flex gap-3", stacked ? "flex-col" : "items-center")}>
        {children}
        <div className="min-w-0">
          <p className="text-xs font-medium">{role}</p>
          {/* Derived from the stored label, never a second authored field — one sentence
              whose only job is telling this block apart from the other one. */}
          <p className="truncate text-xs text-muted-foreground">{spec}</p>
        </div>
      </div>
    </div>
  )
}

const CHIP = "flex size-11 shrink-0 items-center justify-center rounded-md border bg-background"

/**
 * The Proposal half of a colour comparison, in the four states it can actually be in.
 *
 * It used to be one branch: render a swatch, fill it with `after ?? "transparent"`, and
 * label it `after ?? afterVar ?? "not proposed yet"`. That collapsed three genuinely
 * different situations into one square that looked identical in all of them:
 *
 *   1. a literal hex               — a real proposal, correctly shown
 *   2. a var naming a REAL token   — 14 rows (C-1…C-14) whose colour was available all
 *                                    along; `afterVar` was never read, so they rendered
 *                                    EMPTY while a perfectly good token sat behind the name
 *   3. a var naming a token that does not exist — B-1/B-5/B-6's `--sidebar-rail-*`,
 *                                    proposals nobody has authored
 *   4. nothing at all              — B-2/B-3/B-4/B-7/B-8/B-9, which carry only a note
 *
 * States 2, 3 and 4 all painted a bordered box with no background, captioned with a
 * variable name. A reviewer reads that as "the proposal is this colour" — and since an
 * empty box shows the card behind it, the "colour" changes with the theme. That is how
 * B-1 came to look like a proposal to turn the dark rail white.
 *
 * Now: a swatch is rendered ONLY when there is a real colour to put in it. Where there
 * isn't, the block says which of the two absences it is, because "not authored yet" and
 * "nothing proposed" are different facts and a reviewer's next action differs between them.
 */
/**
 * The adjusted value from the conversion table, for a row that has one.
 *
 * `proposedDarkRailTokens` IS that table: every entry pairs the value detected in origin
 * (`originLightHex`/`originDarkHex`) with the value chosen for bidezine
 * (`proposedLight`/`proposedDark`). A colour row's `visual` payload carries origin's half
 * and — for the rail rows — omits the chosen half, which is how nine cards came to read
 * "not decided yet" about values that were decided, are recorded, and are what the rail
 * renders right now. `colorsFor()` in FullRailPreview feeds the live component from this
 * same array.
 *
 * ── The join verifies itself ───────────────────────────────────────────────────────
 * The link is `beforeLabel`, which is the token's own `originName` plus a suffix
 * ("darkHoverBg (origin)"). Parsing a label is not evidence, so the parsed entry is only
 * accepted when its OWN recorded origin hex equals the one the payload carries. If they
 * disagree these are not the same row of the table and nothing is shown — a wrong colour
 * presented confidently is worse than an absence, which is the whole lesson of this card.
 */
function adjustedFromTable(visual: ColorVisual, mode: "light" | "dark") {
  const name = visual.beforeLabel?.replace(/\s*\(origin[^)]*\)\s*$/i, "").trim()
  if (!name) return null
  const token = proposedDarkRailTokens.find((t) => t.originName === name)
  if (!token) return null
  if (token.originLightHex !== visual.beforeHexLight) return null
  return {
    value: mode === "dark" ? token.proposedDark : token.proposedLight,
    varName: token.proposedVar,
    note: token.proposalNote,
  }
}

function ProposalColor({
  hex,
  varName,
  note,
  mode,
  visual,
}: {
  hex?: string
  varName?: string
  note?: string
  mode: "light" | "dark"
  visual: ColorVisual
}) {
  const resolved = useResolvedVar(varName, mode)
  const table = adjustedFromTable(visual, mode)
  // Order of authority: an explicit value on the row, then the conversion table's own
  // chosen value, then a var that genuinely resolves to a shipped token.
  const paint = hex ?? table?.value ?? (resolved ? `var(${varName})` : null)
  const spec = hex
    ? hex
    : table
      ? `${table.value}${table.varName ? ` → ${table.varName}` : ""}`
      : resolved
        ? `${varName} — ${resolved}`
        : varName
          ? `${varName} (not authored)`
          : "none"

  if (paint) {
    return (
      <Block role="Adjusted" spec={spec}>
        <span className="size-11 shrink-0 rounded-md border" style={{ background: paint }} />
      </Block>
    )
  }

  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-3">
      <p className="text-xs font-medium">Adjusted</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {varName ? (
          <>
            Not decided yet. <code className="font-mono">{varName}</code> is the intended token name and is
            defined in no token file, so no value has been chosen.
          </>
        ) : (
          <>Not decided yet. No adjusted value is recorded for this row, in the payload or in the conversion table.</>
        )}
      </p>
      {/* Said outright, because the absence is otherwise readable as a decision. An empty
          Adjusted block next to a filled Origin one looks like "no change from origin" —
          which is a real, choosable outcome and NOT what this state means. */}
      <p className="mt-1 text-xs text-muted-foreground">
        This is not a decision to keep origin's value. Nothing has been chosen either way.
      </p>
      {note ? <p className="mt-1 text-xs text-muted-foreground italic">{note}</p> : null}
    </div>
  )
}

export function ComparisonBlocks({ visual }: { visual: Visual }) {
  const mode = useThemeMode()

  if (visual.kind === "icon") {
    const After = visual.afterIconName ? BIDEZINE_ICON_MAP[visual.afterIconName] : undefined
    return (
      <div className="flex flex-col gap-2">
        <Block role="Origin" spec={visual.beforeLabel}>
          <span className={CHIP}>
            {/* Inline <svg>, never <img> — an SVG behind an img tag is opaque to
                `currentColor`, so it would ignore the theme switch these blocks exist to
                demonstrate. Standing rule, not a preference here. */}
            <RawSvgIcon d={visual.beforeSvgPath} viewBox={visual.beforeViewBox} />
          </span>
        </Block>
        <Block role="Adjusted" spec={visual.afterLabel ?? (After ? "bidezine equivalent" : "no equivalent yet")}>
          <span className={CHIP}>
            {After ? <After className="size-5" /> : <span className="text-xs text-muted-foreground">?</span>}
          </span>
        </Block>
      </div>
    )
  }

  if (visual.kind === "color") {
    // Both sides swap with the mode. Origin stores its own light and dark values, so
    // pinning Current to one would compare this mode's proposal against the other mode's
    // original — a difference that looks real and is an artefact of the card.
    const before = (mode === "dark" ? visual.beforeHexDark : visual.beforeHexLight) ?? visual.beforeHexLight
    const after = (mode === "dark" ? visual.afterHexDark : visual.afterHexLight) ?? visual.afterHexLight
    return (
      <div className="flex flex-col gap-2">
        <Block role="Origin" spec={before}>
          <span className="size-11 shrink-0 rounded-md border" style={{ background: before }} />
        </Block>
        <ProposalColor hex={after} varName={visual.afterVar} note={visual.afterNote} mode={mode} visual={visual} />
      </div>
    )
  }

  if (visual.kind === "type") {
    // Stacked: a typeface is judged by its own rendering, so the sample leads and the spec
    // reads underneath — matching the mockup, and the only kind where the example needs the
    // full width of the card.
    return (
      <div className="flex flex-col gap-2">
        <Block role="Origin" spec={`${visual.beforeFamily}, ${visual.beforeWeight}, ${visual.beforeSize}`} stacked>
          <p
            className="line-clamp-2 text-lg"
            style={{ fontFamily: visual.beforeFamily, fontWeight: visual.beforeWeight as React.CSSProperties["fontWeight"] }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </Block>
        <Block role="Adjusted" spec={visual.afterLabel} stacked>
          {/* The real utility class, so the sample is the system's own type rather than a
              description of it — and it re-renders on theme change like everything else. */}
          <p className={cn("line-clamp-2", visual.afterClassName)}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </Block>
      </div>
    )
  }

  return null
}

/** Which kinds the card renders inline. Everything else goes to the canvas. */
export const BLOCK_KINDS = new Set(["icon", "color", "type"])
