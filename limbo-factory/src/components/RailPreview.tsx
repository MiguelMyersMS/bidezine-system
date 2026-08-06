import type { CSSProperties } from "react"
import {
  BIDEZINE_LOGO_PATH,
  BIDEZINE_LOGO_VIEWBOX,
  PREVIEW_NAV_ICONS,
  type ProposedToken,
} from "@/data/rail-sidebar"

/**
 * You asked to see the candidate tokens composed together in an actual rail shape, side by side
 * with the origin, before giving final sign-off — a row of isolated swatches doesn't tell you
 * whether the ramp reads correctly once background/hover/active/border/text are all adjacent, and
 * doesn't let you compare against the source directly.
 *
 * Left = origin's own colors (verbatim, same as the swatches' "origin, verbatim" column). Right =
 * bidezine's candidate tokens. BOTH sides use the same real Fluent _20_regular icons (home/folder/
 * people/settings) so color is the only variable being compared — this is a compositional mock only
 * (not the real RailNav component; that build happens in the Transformation/Build phase), but real
 * enough DOM + CSS that hover/pressed states are genuinely interactive, not simulated.
 *
 * "Projects" is the persistent selected row on both sides — hover it to compare select-hover
 * behavior: the bidezine side previews the newly proposed --sidebar-rail-active-hover candidate
 * (not yet approved, see Color Token Lab), inspired by src/ui/navigation-menu.tsx's own
 * data-[active=true]:hover:bg-accent pattern. The origin side intentionally shows no change on the
 * same hover — confirmed against its docs, it never modeled a distinct "selected + hovered" tone.
 */

const NAV_ITEMS = [
  { label: "Overview", state: "default" as const, icon: PREVIEW_NAV_ICONS.home },
  { label: "Projects", state: "selected" as const, icon: PREVIEW_NAV_ICONS.folder },
  { label: "Team", state: "default" as const, icon: PREVIEW_NAV_ICONS.people },
  { label: "Settings", state: "disabled" as const, icon: PREVIEW_NAV_ICONS.settings },
]

function byName(tokens: ProposedToken[], originName: string): ProposedToken {
  const found = tokens.find((t) => t.originName === originName)
  if (!found) throw new Error(`RailPreview: missing proposed token "${originName}"`)
  return found
}

function RailMock({
  tokens,
  variant,
  source,
}: {
  tokens: ProposedToken[]
  variant: "light" | "dark"
  source: "origin" | "bidezine"
}) {
  const pick = (originName: string) => {
    const t = byName(tokens, originName)
    if (source === "origin") return variant === "light" ? t.originLightHex : t.originDarkHex
    return variant === "light" ? t.proposedLight : t.proposedDark
  }

  // The origin project has no "selected + hovered" state at all (confirmed against its docs) — its
  // dark rail only differentiates plain hover vs. plain selected. So on the origin side, hovering an
  // already-selected row falls back to the same active tone (no visible change, matching its real,
  // undifferentiated behavior). On the bidezine side, this previews the newly proposed
  // --sidebar-rail-active-hover candidate (not yet approved — see Color Token Lab).
  const activeHoverBg = source === "bidezine" ? pick("darkActiveHoverBg") : pick("darkActiveBg")

  const vars = {
    "--prv-surface": pick("darkSurface"),
    "--prv-hover": pick("darkHoverBg"),
    "--prv-pressed": pick("darkPressedBg"),
    "--prv-active": pick("darkActiveBg"),
    "--prv-active-hover": activeHoverBg,
    "--prv-border": pick("darkBorderStrong"),
    "--prv-fg": pick("onDark"),
    "--prv-fg-hover": pick("onDarkHover"),
    "--prv-fg-subtle": pick("onDarkSubtle"),
    "--prv-fg-disabled": pick("onDarkDisabled"),
  } as CSSProperties

  return (
    <div
      style={vars}
      className="flex w-24 flex-col items-center gap-2 rounded-2xl border border-[var(--prv-border)] bg-[var(--prv-surface)] p-3 shadow-sm"
    >
      <svg viewBox={BIDEZINE_LOGO_VIEWBOX} className="h-6 w-6" fill="var(--prv-fg)">
        <path d={BIDEZINE_LOGO_PATH} />
      </svg>
      <div className="my-1 h-px w-full bg-[var(--prv-border)]" />
      <div className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isSelected = item.state === "selected"
          const isDisabled = item.state === "disabled"
          return (
            <button
              key={item.label}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              className="flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] leading-none transition-colors disabled:cursor-not-allowed"
              style={{
                background: isSelected ? "var(--prv-active)" : "transparent",
                color: isDisabled ? "var(--prv-fg-disabled)" : isSelected ? "var(--prv-fg)" : "var(--prv-fg-subtle)",
              }}
              onMouseDown={(e) => {
                if (isDisabled || isSelected) return
                e.currentTarget.style.background = "var(--prv-pressed)"
              }}
              onMouseUp={(e) => {
                if (isDisabled || isSelected) return
                e.currentTarget.style.background = "var(--prv-hover)"
              }}
              onMouseEnter={(e) => {
                if (isDisabled) return
                if (isSelected) {
                  // Select-hover: the row is already active, hovering it further should still give
                  // feedback rather than doing nothing (see --prv-active-hover above).
                  e.currentTarget.style.background = "var(--prv-active-hover)"
                  return
                }
                e.currentTarget.style.background = "var(--prv-hover)"
                e.currentTarget.style.color = "var(--prv-fg-hover)"
              }}
              onMouseLeave={(e) => {
                if (isDisabled) return
                if (isSelected) {
                  e.currentTarget.style.background = "var(--prv-active)"
                  return
                }
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--prv-fg-subtle)"
              }}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d={item.icon.d} />
              </svg>
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RailMockBothThemes({ tokens, source }: { tokens: ProposedToken[]; source: "origin" | "bidezine" }) {
  return (
    <>
      <div className="dark:hidden">
        <RailMock tokens={tokens} variant="light" source={source} />
      </div>
      <div className="hidden dark:block">
        <RailMock tokens={tokens} variant="dark" source={source} />
      </div>
    </>
  )
}

export function RailPreview({ tokens }: { tokens: ProposedToken[] }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/20 p-6">
      <p className="text-center text-sm font-medium">Composed preview: origin vs. bidezine candidates</p>
      <p className="max-w-lg text-center text-xs text-muted-foreground">
        Same structure, same real Fluent icons (home / folder / people / settings) on both sides —
        color is the only thing being compared. Hover and click the rows, they're genuinely
        interactive. "Projects" is the persistent selected state; "Settings" is disabled. Hover
        "Projects" itself to compare select-hover — bidezine previews a newly proposed candidate
        token there (not yet approved, see Color Token Lab), the origin side stays unchanged since
        it never modeled that state. Toggle light/dark in the header to see both app-theme variants.
      </p>
      <div className="flex items-start justify-center gap-10 py-2">
        <div className="flex flex-col items-center gap-2">
          <RailMockBothThemes tokens={tokens} source="origin" />
          <p className="text-xs font-medium text-muted-foreground">Origin (verbatim)</p>
        </div>
        <span className="mt-10 text-muted-foreground" aria-hidden>
          →
        </span>
        <div className="flex flex-col items-center gap-2">
          <RailMockBothThemes tokens={tokens} source="bidezine" />
          <p className="text-xs font-medium">bidezine (candidate tokens)</p>
        </div>
      </div>
    </div>
  )
}
