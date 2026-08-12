import { useState } from "react"
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
 * origin project's icon file or @fluentui/svg-icons, never imported into src/ui. Preview-only. */
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
                animation: `limbo-slide ${v.beforeDurationMs}ms ${v.beforeEasing} both`,
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
                  animation: `limbo-slide ${v.afterDurationMs}ms ${v.afterEasing ?? "ease"} both`,
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
      <style>{"@keyframes limbo-slide { from { transform: translateX(-100%); } to { transform: translateX(150%); } }"}</style>
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
