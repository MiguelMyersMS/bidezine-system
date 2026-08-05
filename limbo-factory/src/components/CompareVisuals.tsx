import { useState } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
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

function ColorCompare({ v }: { v: ColorVisual }) {
  return (
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
          className="h-14 w-14 rounded-md border"
          style={v.afterVar ? { background: `var(${v.afterVar})` } : undefined}
        >
          {!v.afterVar ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">?</div>
          ) : null}
        </div>
        <p className="max-w-28 text-center text-xs text-muted-foreground">
          {v.afterLabel ?? v.afterVar ?? "not yet proposed"}
        </p>
      </div>
      {v.afterNote ? <p className="max-w-64 text-xs text-muted-foreground italic">{v.afterNote}</p> : null}
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
        <button
          type="button"
          onClick={() => setPlay((p) => p + 1)}
          className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          Replay
        </button>
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
