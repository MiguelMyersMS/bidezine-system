import { type ProposedToken } from "@/data/rail-sidebar"
import { OriginRailFrame } from "@/components/OriginRailFrame"
import { FunctionalRailSidebar } from "@/components/FunctionalRailSidebar"

/**
 * Color/token resolution for the origin-vs-bidezine Rail Sidebar comparison rendered by
 * RailNavStatusPreview below. The origin column renders the real, vendored RailNav inside a
 * quarantined iframe via `OriginRailFrame` (no color props needed — it's the actual origin
 * component executing, in its own bundle and its own realm); the bidezine column renders the real
 * `FunctionalRailSidebar`, built from actual `@bidezine/system` primitives, driven by whatever
 * dark-rail tokens are currently approved in the Color Token Lab.
 *
 * This file used to import origin source directly (`@/reference/origin-design-system/OriginRailNavLive`),
 * which compiled the whole origin tree into this app's own bundle. That import is gone and
 * `scripts/check-quarantine.mjs` fails the build if it returns — see `OriginRailFrame`.
 *
 * `ORIGIN` below holds the origin's own literal hex/rgba values, sourced verbatim from divergence
 * categories B (dark rail) and C (light panel) in rail-sidebar.ts — kept as a reference data point,
 * even though the live comparison no longer routes through it (see colorsFor's "origin" branch).
 *
 * Prior to this file being trimmed, a hand-built static mock (`FullRailMock`/`RailBtn`/`PanelRow`/
 * `GroupHeader`/a `FullRailPreview` export) reconstructed the bidezine side from raw JSX instead of
 * rendering the real component — including a raw native `<button>` and a `<div role="button">"
 * standing in for @bidezine/system's real `Button`, in violation of CLAUDE.md's "no hand-rolled
 * components" rule. That whole export chain had already been fully superseded by
 * `RailNavStatusPreview` -> `FunctionalRailSidebar` (confirmed: `FullRailPreview` was never imported
 * anywhere in the app) and has been removed entirely rather than left as dead, rule-violating code
 * that could be silently re-wired back in later. See SANDBOX-PROTOCOL-LOG.md's flaws log.
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
    // Origin's rail has no divider line at all (see darkDividerSubtle in rail-sidebar.ts) — it
    // separates logo/nav/footer purely with flex gap. Mirrors `border` here only so this reference
    // object's shape stays complete; never actually rendered as a divider on the origin side.
    divider: "rgba(255,255,255,0.6)",
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
    divider: "#5a6169",
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

/** Resolved color set for one theme variant, keyed by which column is asking. Passed straight into
 * FunctionalRailSidebar's `colors` prop for the bidezine column. */
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
    divider: pick("darkDividerSubtle"),
    fg: pick("onDark"),
    fgHover: pick("onDarkHover"),
    fgSubtle: pick("onDarkSubtle"),
    fgDisabled: pick("onDarkDisabled"),
    // Light panel: C-1 through C-5 and C-10 through C-14 have explicit sign-off.
    // C-6/C-7/C-8/C-9 still need final confirmation and are flagged in the Pending legend when
    // their candidate values are represented in this preview.
    panelSurface: "var(--card)",
    ink: "var(--foreground)",
    textMuted: "var(--muted-foreground)",
    textSubtle: "var(--muted-foreground)",
    textDisabled: variant === "light" ? "#B9B9B9" : "#585858",
    panelHover: "var(--accent)",
    panelBgSubtle: "var(--muted)",
    hairline: "var(--border)",
    statusRed: "var(--destructive)",
    onInk: "var(--primary-foreground)",
  }
}

/**
 * The single, shared RailNav review slot — replaces the old side-by-side RailPreview (color-only)
 * and FullRailPreview (full composed) mocks, both of which duplicated what the left-quadrant review
 * items already establish. One rail is shown at a time, switched by the Origin/Adjusted control next
 * to the theme toggle:
 *
 * - "origin" — the real, vendored RailNav, verbatim, rendered in quarantine (`OriginRailFrame`).
 *   This is reference material only and never changes once fully captured, no matter what gets
 *   decided here.
 * - "bidezine" ("Adjusted") — the composed mock rail, built from whatever tokens/layout values are
 *   currently approved. This view updates as decisions are made on the left (blocking questions,
 *   color tokens, divergence categories, risks) — it's a live reflection of "how far along are we,"
 *   not a frozen snapshot.
 */
export function RailNavStatusPreview({
  source,
  tokens,
  height = 550,
  forcedState = null,
}: {
  source: Source
  tokens: ProposedToken[]
  height?: number
  /** Passed straight through to the rail — see `PreviewProps` in PreviewRegistry. Origin is
   * unaffected: it renders in its own quarantined frame and nothing here can reach into it,
   * which is why a claim about origin's own hover colour is not showable this way. */
  forcedState?: { ref: string; state: string } | null
}) {
  if (source === "origin") {
    return <OriginRailFrame height={height} />
  }

  return (
    <>
      {/* M-21 (see rail-sidebar.ts): `w-full` on both wrappers — otherwise these plain, width-less
          divs shrink-wrap to `FunctionalRailSidebar`'s own content width, breaking the `w-full`
          chain `FillHeight`/`QuadrantLayout` already provide and starving `ResizablePanelGroup`'s
          `flex-1` of any real space to grow into. */}
      {/* `anchors` is enabled on the LIGHT copy ONLY, and this is load-bearing rather than
          arbitrary. Both copies are always present in the DOM — one is merely `display: none` — so
          emitting `data-divergence` from both would make every anchor match two elements, and
          `verifier/run-checks.mjs` fails an ambiguous anchor by design (it will not measure
          whichever matched first; see CLAUDE.md checklist item 10). The light copy is the one the
          verifier drives, since it renders with no `dark` class on the document.
          See `sandbox/src/lib/divergence-anchors.tsx`. */}
      <div className="w-full dark:hidden">
        <FunctionalRailSidebar colors={colorsFor("bidezine", "light", tokens)} fontFamily="var(--font-sans, ui-sans-serif)" height={height} anchors forcedState={forcedState} />
      </div>
      <div className="hidden w-full dark:block">
        <FunctionalRailSidebar colors={colorsFor("bidezine", "dark", tokens)} fontFamily="var(--font-sans, ui-sans-serif)" height={height} />
      </div>
    </>
  )
}
