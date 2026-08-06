import { Badge, cn } from "@bidezine/system"
import {
  BIDEZINE_LOGO_PATH,
  BIDEZINE_LOGO_VIEWBOX,
  FULL_PREVIEW_ICONS,
  PANEL_LEFT_CONTRACT_PATH,
  PREVIEW_NAV_ICONS,
  type ProposedToken,
} from "@/data/rail-sidebar"

/**
 * The full, "robust" side-by-side you asked for on the Full divergence list tab: not just colors
 * (that's RailPreview, in Color token lab) but the whole rail + expanded panel shape — icon sizes,
 * nesting, badges, disabled rows, footer, typography, padding, spacing, radius — reconstructed from
 * the origin's real canonical `Default` story.
 *
 * CORRECTED against the origin's actual, currently-shipping source (not a screenshot, not the
 * possibly-stale INTAKE-REPORT.md) — read directly from the real local clone at
 * `design-system/src/gallery/RailNav.stories.tsx` (`SPEC_TREE`, exact literal node data) and
 * `design-system/src/layout.ts` (`LAYOUT.panelW = 300`, `RADIUS.rounded = 12`). The panel content
 * below is the exact "slides" section SPEC_TREE, item-for-item and badge-for-badge:
 *   Activity stream (+23) / Live operations / Participants / System logic (badge "New", icon,
 *   expanded) → Rules engine, Triggers, Schedules (icon, expanded) → Daily (+05), Monthly (+11,
 *   ACTIVE — the origin's own Default story also gives the selected row its own badge), Yearly
 *   (disabled) / Content (a sibling of System logic, NOT nested under it — corrects an earlier
 *   assumption). Every SPEC_TREE node's icon is the origin's own real Fluent path, copied verbatim
 *   from `design-system/src/icons/fluent.tsx` (see FULL_PREVIEW_ICONS in rail-sidebar.ts).
 *
 * Still a REPRESENTATIVE SUBSET for the RAIL itself (origin ships 16 rail sections; this mocks 6) —
 * expanding the rail to all 16 needs 13 more icons sourced one-by-one and wasn't the focus of this
 * pass. The PANEL — the part with all the real nesting/badge/typography detail worth reviewing — is
 * now exact.
 *
 * Both columns share ONE render path (colors/fonts/sizes are the only inputs that differ) so the
 * two sides are guaranteed structurally identical — the comparison is never accidentally apples-to-
 * oranges. Origin uses literal hex/px values sourced verbatim from categories B/C/D/F/G in
 * rail-sidebar.ts (never invented). bidezine uses the 10 APPROVED dark-rail tokens for color, and —
 * for every dimension categories D/F/G still list as "needs decision" (not yet resolved) — the
 * origin's own proposed value, applied provisionally so you can judge it, called out explicitly in
 * the "Pending" legend below each column rather than silently presented as final. See CLAUDE.md /
 * LIMBO-PROTOCOL-LOG.md: "AI never auto-decides."
 */

// Literal origin hex values, sourced verbatim from divergence categories B (dark rail) and C (light
// panel) in rail-sidebar.ts. Never invented — every value here has a matching beforeHexLight/
// beforeHexDark in that data file.
const ORIGIN = {
  light: {
    surface: "#1c2024",
    hover: "rgba(255,255,255,0.10)",
    pressed: "rgba(255,255,255,0.15)",
    active: "rgba(255,255,255,0.20)",
    border: "rgba(255,255,255,0.6)",
    fg: "#ffffff",
    fgHover: "rgba(255,255,255,0.85)",
    fgSubtle: "rgba(255,255,255,0.5)",
    fgDisabled: "rgba(255,255,255,0.2)",
    panelSurface: "#ffffff",
    ink: "#1c2024",
    textMuted: "#60646c",
    textSubtle: "#8b8d98",
    textDisabled: "#b9bbc6",
    panelHover: "#f0f0f3",
    panelBgSubtle: "#f9f9fb",
    hairline: "#d9d9e0",
    statusRed: "#ce2c31",
    onInk: "#ffffff",
  },
  dark: {
    surface: "#111113",
    hover: "#212225",
    pressed: "#2e3135",
    active: "#272a2d",
    border: "#5a6169",
    fg: "#ffffff",
    fgHover: "#edeef0",
    fgSubtle: "#696e77",
    fgDisabled: "#3e4348",
    panelSurface: "#272a2d",
    ink: "#edeef0",
    textMuted: "#b0b4ba",
    textSubtle: "#696e77",
    textDisabled: "#5a6169",
    panelHover: "#2e3135",
    panelBgSubtle: "#212225",
    hairline: "#363a3f",
    statusRed: "#ff9592",
    onInk: "#111113",
  },
} as const

type Variant = "light" | "dark"
type Source = "origin" | "bidezine"

function byName(tokens: ProposedToken[], originName: string): ProposedToken {
  const found = tokens.find((t) => t.originName === originName)
  if (!found) throw new Error(`FullRailPreview: missing proposed token "${originName}"`)
  return found
}

/** Resolved color set for one column, one theme variant — the only thing that differs between
 * origin/bidezine renders of the identical JSX structure below. */
function colorsFor(source: Source, variant: Variant, tokens: ProposedToken[]) {
  if (source === "origin") return ORIGIN[variant]
  const pick = (originName: string) => {
    const t = byName(tokens, originName)
    return variant === "light" ? t.proposedLight : t.proposedDark
  }
  return {
    surface: pick("darkSurface"),
    hover: pick("darkHoverBg"),
    pressed: pick("darkPressedBg"),
    active: pick("darkActiveBg"),
    border: pick("darkBorderStrong"),
    fg: pick("onDark"),
    fgHover: pick("onDarkHover"),
    fgSubtle: pick("onDarkSubtle"),
    fgDisabled: pick("onDarkDisabled"),
    // Light panel: bidezine's own decided/clean tokens (C-2, C-3, C-13, C-14 are exact matches;
    // C-1/C-6/C-7/C-11 are the "closest candidate" from the divergence data, applied provisionally —
    // flagged in the Pending legend, not silently treated as approved).
    panelSurface: "var(--card)",
    ink: "var(--foreground)",
    textMuted: "var(--muted-foreground)",
    textSubtle: "var(--muted-foreground)",
    textDisabled: "var(--muted-foreground)",
    panelHover: "var(--accent)",
    panelBgSubtle: "var(--muted)",
    hairline: "var(--border)",
    statusRed: "var(--destructive)",
    onInk: "var(--primary-foreground)",
  }
}

function Glyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** Small negative-token marker for any dimension a column is using PROVISIONALLY — i.e. the
 * matching divergence row is still "decision" status, not yet approved. Never silently presented
 * as final. */
function PendingLegend({ items }: { items: string[] }) {
  return (
    <div className="flex max-w-[19rem] flex-wrap items-center justify-center gap-1">
      <span className="text-[10px] font-medium text-destructive">Pending, applied provisionally:</span>
      {items.map((id) => (
        <Badge key={id} variant="destructive" className="px-1.5 py-0 text-[10px]">
          {id}
        </Badge>
      ))}
    </div>
  )
}

function RailBtn({
  icon,
  label,
  state,
  colors,
  size,
  radius,
}: {
  icon: { d: string }
  label: string
  state: "default" | "selected" | "disabled"
  colors: ReturnType<typeof colorsFor>
  size: number
  radius: number
}) {
  const isSelected = state === "selected"
  const isDisabled = state === "disabled"
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-pressed={isSelected}
      title={label}
      className="flex shrink-0 flex-col items-center justify-center gap-0.5 text-[8px] leading-none transition-colors disabled:cursor-not-allowed"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: isSelected ? colors.active : "transparent",
        color: isDisabled ? colors.fgDisabled : isSelected ? colors.fg : colors.fgSubtle,
      }}
      onMouseEnter={(e) => {
        if (isDisabled || isSelected) return
        e.currentTarget.style.background = colors.hover
        e.currentTarget.style.color = colors.fgHover
      }}
      onMouseLeave={(e) => {
        if (isDisabled || isSelected) return
        e.currentTarget.style.background = "transparent"
        e.currentTarget.style.color = colors.fgSubtle
      }}
      onMouseDown={(e) => {
        if (isDisabled) return
        e.currentTarget.style.background = colors.pressed
      }}
      onMouseUp={(e) => {
        if (isDisabled) return
        e.currentTarget.style.background = isSelected ? colors.active : colors.hover
      }}
    >
      <Glyph d={icon.d} className="h-4 w-4" />
      <span className="max-w-full truncate px-0.5">{label}</span>
    </button>
  )
}

/** Origin's RailBadge is `string | { label, variant: "neutral" | "info" }` (see Badge.tsx). bidezine's
 * Badge has no dedicated info/neutral split yet — "secondary" (neutral pill) is a clean match, but
 * "info" (the iris-tinted "New" pill) has no equivalent variant, so "default" (primary color) is used
 * as the closest provisional stand-in and flagged in the Pending legend, not silently treated as a
 * decided mapping. */
function PanelBadge({ label, info }: { label: string; info?: boolean }) {
  return (
    <Badge variant={info ? "default" : "secondary"} className="ml-2 shrink-0 px-1.5 py-0 text-[10px]">
      {label}
    </Badge>
  )
}

function PanelRow({
  label,
  badge,
  badgeInfo,
  icon,
  indent = 0,
  state = "default",
  colors,
  bold = false,
  typeClassName,
}: {
  label: string
  badge?: string
  badgeInfo?: boolean
  icon?: { d: string }
  indent?: number
  state?: "default" | "selected" | "disabled"
  colors: ReturnType<typeof colorsFor>
  bold?: boolean
  typeClassName: string
}) {
  const isSelected = state === "selected"
  const isDisabled = state === "disabled"
  return (
    <div
      role="button"
      aria-disabled={isDisabled}
      aria-pressed={isSelected}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-md px-2 transition-colors",
        typeClassName,
        isDisabled && "cursor-not-allowed opacity-50",
        bold && "font-medium",
      )}
      style={{
        marginLeft: indent * 14,
        background: isSelected ? colors.ink : "transparent",
        color: isDisabled ? colors.textDisabled : isSelected ? colors.onInk : colors.ink,
      }}
      onMouseEnter={(e) => {
        if (isDisabled || isSelected) return
        e.currentTarget.style.background = colors.panelHover
      }}
      onMouseLeave={(e) => {
        if (isDisabled || isSelected) return
        e.currentTarget.style.background = "transparent"
      }}
    >
      {icon && <Glyph d={icon.d} className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {badge && <PanelBadge label={badge} info={badgeInfo} />}
    </div>
  )
}

function GroupHeader({
  label,
  badge,
  badgeInfo,
  icon,
  colors,
  indent = 0,
  typeClassName,
}: {
  label: string
  badge?: string
  badgeInfo?: boolean
  icon?: { d: string }
  colors: ReturnType<typeof colorsFor>
  indent?: number
  typeClassName: string
}) {
  return (
    <div
      className={cn("flex h-8 items-center gap-1.5 px-2 font-medium", typeClassName)}
      style={{ marginLeft: indent * 14, color: colors.textMuted }}
    >
      <Glyph d={FULL_PREVIEW_ICONS.chevronDown.d} className="h-3.5 w-3.5 shrink-0" />
      {icon && <Glyph d={icon.d} className="h-4 w-4 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {badge && <PanelBadge label={badge} info={badgeInfo} />}
    </div>
  )
}

function FullRailMock({
  source,
  variant,
  tokens,
  railW,
  railBtn,
  panelW,
  radiusRail,
  radiusXs,
  fontFamily,
  headingClass,
  bodySClass,
  labelMClass,
}: {
  source: Source
  variant: Variant
  tokens: ProposedToken[]
  railW: number
  railBtn: number
  panelW: number
  radiusRail: number
  radiusXs: number
  fontFamily: string
  headingClass: string
  bodySClass: string
  labelMClass: string
}) {
  const colors = colorsFor(source, variant, tokens)

  return (
    <div className="flex overflow-hidden rounded-2xl border shadow-sm" style={{ fontFamily, borderRadius: radiusRail, borderColor: colors.border }}>
      {/* Dark rail */}
      <div
        className="flex shrink-0 flex-col items-center gap-2 p-2"
        style={{ width: railW, background: colors.surface }}
      >
        <svg viewBox={BIDEZINE_LOGO_VIEWBOX} className="mt-1 h-6 w-6" fill={colors.fg}>
          <path d={BIDEZINE_LOGO_PATH} />
        </svg>
        <div className="my-0.5 h-px w-full" style={{ background: colors.border }} />
        <RailBtn icon={PREVIEW_NAV_ICONS.home} label="Overview" state="default" colors={colors} size={railBtn} radius={radiusXs} />
        <RailBtn icon={FULL_PREVIEW_ICONS.folderOpen} label="Slides" state="selected" colors={colors} size={railBtn} radius={radiusXs} />
        <RailBtn icon={FULL_PREVIEW_ICONS.document} label="Docs" state="default" colors={colors} size={railBtn} radius={radiusXs} />
        <RailBtn icon={PREVIEW_NAV_ICONS.people} label="Team" state="default" colors={colors} size={railBtn} radius={radiusXs} />
        <div className="flex-1" />
        <div className="my-0.5 h-px w-full" style={{ background: colors.border }} />
        <RailBtn icon={PREVIEW_NAV_ICONS.settings} label="Settings" state="default" colors={colors} size={railBtn} radius={radiusXs} />
        <RailBtn icon={FULL_PREVIEW_ICONS.person} label="Owner" state="disabled" colors={colors} size={railBtn} radius={radiusXs} />
      </div>

      {/* Expanded panel — "Slides" section, SPEC_TREE nested content */}
      <div className="flex flex-col" style={{ width: panelW, background: colors.panelSurface }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
          <span className={headingClass} style={{ color: colors.ink }}>
            Slides
          </span>
          <div className="flex items-center gap-1" style={{ color: colors.textMuted }}>
            <Glyph d={FULL_PREVIEW_ICONS.search.d} className="h-4 w-4" />
            <Glyph d={FULL_PREVIEW_ICONS.moreHorizontal.d} className="h-4 w-4" />
            <Glyph d={PANEL_LEFT_CONTRACT_PATH} className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-col gap-0.5 p-1.5">
          <PanelRow label="Activity stream" badge="+23" icon={FULL_PREVIEW_ICONS.video} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Live operations" icon={FULL_PREVIEW_ICONS.videoSettings} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Participants" icon={FULL_PREVIEW_ICONS.peopleCommunity} colors={colors} typeClassName={bodySClass} />
          <GroupHeader label="System logic" badge="New" badgeInfo icon={FULL_PREVIEW_ICONS.cubeTree} colors={colors} typeClassName={labelMClass} />
          <PanelRow label="Rules engine" icon={FULL_PREVIEW_ICONS.engine} indent={1} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Triggers" icon={FULL_PREVIEW_ICONS.syncOff} indent={1} colors={colors} typeClassName={bodySClass} />
          <GroupHeader label="Schedules" icon={FULL_PREVIEW_ICONS.calendarClock} colors={colors} indent={1} typeClassName={labelMClass} />
          <PanelRow label="Daily" badge="+05" icon={FULL_PREVIEW_ICONS.calendarMonth} indent={2} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Monthly" badge="+11" state="selected" bold icon={FULL_PREVIEW_ICONS.calendarMonth} indent={2} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Yearly" state="disabled" icon={FULL_PREVIEW_ICONS.calendarMonth} indent={2} colors={colors} typeClassName={bodySClass} />
          <PanelRow label="Content" icon={FULL_PREVIEW_ICONS.contentView} colors={colors} typeClassName={bodySClass} />
        </div>

        <div className="mt-auto flex flex-col gap-0.5 p-1.5" style={{ borderTop: `1px solid ${colors.hairline}` }}>
          <PanelRow label="Settings" colors={colors} typeClassName={bodySClass} />
        </div>
      </div>
    </div>
  )
}

function FullRailMockBothThemes(props: Omit<Parameters<typeof FullRailMock>[0], "variant">) {
  return (
    <>
      <div className="dark:hidden">
        <FullRailMock {...props} variant="light" />
      </div>
      <div className="hidden dark:block">
        <FullRailMock {...props} variant="dark" />
      </div>
    </>
  )
}

export function FullRailPreview({ tokens }: { tokens: ProposedToken[] }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/20 p-6">
      <p className="text-center text-sm font-medium">
        Full composed preview: origin RailNav (Default story) vs. bidezine Rail Sidebar (so far)
      </p>
      <p className="max-w-2xl text-center text-xs text-muted-foreground">
        The exact "Slides" section SPEC_TREE from the origin's real, currently-shipping
        RailNav.stories.tsx — item-for-item, badge-for-badge, icon-for-icon (Activity stream,
        Live operations, Participants, System logic → Rules engine/Triggers/Schedules →
        Daily/Monthly (active + its own badge)/Yearly (disabled), Content) — read directly from
        source, not screenshotted or approximated. Panel width (300px) and radius (12px) are also
        the origin's real literal values. Still a representative subset for the RAIL itself (origin
        ships 16 sections; this mocks 6). Same structure on both sides; only color/font/size inputs
        differ. Hover/click the rows — they're genuinely interactive. Toggle light/dark to check both.
      </p>
      <div className="flex flex-col items-center gap-10 py-2 md:flex-row md:items-start md:justify-center">
        <div className="flex flex-col items-center gap-3">
          <FullRailMockBothThemes
            source="origin"
            tokens={tokens}
            railW={54}
            railBtn={38}
            panelW={300}
            radiusRail={12}
            radiusXs={4}
            fontFamily="Inter, sans-serif"
            headingClass="text-base font-medium"
            bodySClass="text-[13px]"
            labelMClass="text-[13px] font-medium"
          />
          <p className="text-xs font-medium text-muted-foreground">Origin (verbatim, Default story branch)</p>
        </div>

        <span className="mt-16 hidden text-muted-foreground md:block" aria-hidden>
          →
        </span>

        <div className="flex flex-col items-center gap-3">
          <FullRailMockBothThemes
            source="bidezine"
            tokens={tokens}
            railW={54}
            railBtn={38}
            panelW={300}
            radiusRail={12}
            radiusXs={4}
            fontFamily="var(--font-sans, ui-sans-serif)"
            headingClass="text-base font-medium"
            bodySClass="text-xs"
            labelMClass="text-xs font-medium"
          />
          <p className="text-xs font-medium">bidezine (so far — approved tokens + provisional layout)</p>
          <PendingLegend items={["F-1", "F-2", "F-3", "G-1", "D-1", "D-4", "D-5", "C-1", "C-6", "C-7", "A-1", "badge-variant-map"]} />
        </div>
      </div>
    </div>
  )
}
