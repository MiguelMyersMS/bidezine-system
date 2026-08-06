import { STANDARD_PHASES, type Phase } from "./phases"

/** Concrete phase state for the current Limbo occupant: Rail Sidebar (RailNav). */
export const railSidebarPhases: Phase[] = STANDARD_PHASES.map((p) => ({ ...p, status: "pending" as const }))

railSidebarPhases[0] = {
  ...railSidebarPhases[0],
  status: "done",
  subPhases: [
    { id: "gather-source", title: "Gather source + docs from origin project", status: "done" },
    { id: "self-contain-copy", title: "Copy self-contained into limbo/rail-sidebar/reference/", status: "done" },
    { id: "produce-inventory", title: "Component/experience inventory (34 items)", status: "done" },
    { id: "produce-divergence-list", title: "Itemized divergence list (~50 items, 13 categories)", status: "done" },
  ],
}

railSidebarPhases[1] = {
  ...railSidebarPhases[1],
  status: "in_progress",
  subPhases: [
    { id: "q1", title: "Q1 — Icon filled-prop system", status: "pending", note: "Blocks all interactive icon states" },
    { id: "q2", title: "Q2 — Dark rail surface token family", status: "pending", note: "Blocks the entire rail color system" },
    { id: "q3", title: "Q3 — Default logo icon", status: "pending" },
    { id: "q4", title: "Q4 — Panel collapse icon", status: "pending" },
    { id: "remaining", title: "~45 remaining itemized divergences", status: "pending", note: "Cascades from Q1/Q2" },
  ],
}

export interface DecisionOption {
  label: string
  detail: string
}

export interface DecisionResolution {
  chosenLabel: string
  note: string
}

export interface DecisionQuestion {
  id: string
  priority: number
  title: string
  context: string
  options: DecisionOption[]
  blocks: string
  resolution?: DecisionResolution
  visual?: Visual
}

// IconLogo — the bidezine brand mark, sourced verbatim from the origin project's
// src/icons/fluent.tsx (read-only reference copy at limbo/rail-sidebar/reference/).
// This IS the bidezine logo per the origin project's own branding, not a placeholder.
export const BIDEZINE_LOGO_PATH =
  "M 15.099 2.069 C 21.154 2.069 26.063 6.979 26.063 13.034 C 26.063 19.09 21.154 23.999 15.099 23.999 L 14.087 23.999 C 14.082 23.999 14.076 24 14.07 24 L 9.306 24 C 8.77 24 8.297 23.65 8.141 23.139 L 4.984 12.835 C 4.744 12.052 5.33 11.26 6.149 11.26 L 10.998 11.26 C 11.537 11.26 12.012 11.614 12.166 12.13 L 13.499 16.602 L 15.103 16.602 C 17.073 16.602 18.671 15.004 18.671 13.033 C 18.671 11.063 17.073 9.465 15.103 9.465 C 14.349 9.465 13.685 8.97 13.47 8.248 L 11.985 3.262 C 11.825 2.723 12.182 2.069 12.744 2.069 L 15.099 2.069 Z M 8.441 0 C 8.982 -0.002 9.459 0.352 9.613 0.87 L 10.084 2.446 C 10.201 2.838 10.013 3.256 9.644 3.431 L 9.12 3.678 L 9.12 3.68 L 9.119 3.681 L 8.805 3.832 C 8.366 4.043 8.452 4.692 8.931 4.781 L 10.311 5.038 C 10.666 5.104 10.954 5.363 11.058 5.709 L 11.779 8.129 C 12.012 8.91 11.428 9.695 10.612 9.695 L 3.429 9.695 C 2.893 9.695 2.42 9.345 2.264 8.833 L 0.055 1.602 C -0.184 0.82 0.398 0.029 1.215 0.026 L 8.441 0 Z"

export const BIDEZINE_LOGO_VIEWBOX = "0 0 26.064 24"

// Real Fluent _20_regular glyphs used only for the Color Token Lab's composed rail preview, so the
// origin-vs-bidezine comparison shows genuine iconography (not generic placeholder shapes) without
// prematurely deciding RailNav's actual final icon set — that's still tracked separately under
// "Full divergence list" → category A. Sourced directly from node_modules/@fluentui/svg-icons.
export const PREVIEW_NAV_ICONS = {
  home: { d: "M9 2.39a1.5 1.5 0 0 1 2 0l5.5 4.94c.32.28.5.69.5 1.12v7.05c0 .83-.67 1.5-1.5 1.5H13a1.5 1.5 0 0 1-1.5-1.5V12a.5.5 0 0 0-.5-.5H9a.5.5 0 0 0-.5.5v3.5c0 .83-.67 1.5-1.5 1.5H4.5A1.5 1.5 0 0 1 3 15.5V8.45c0-.43.18-.84.5-1.12L9 2.39Zm1.33.74a.5.5 0 0 0-.66 0l-5.5 4.94a.5.5 0 0 0-.17.38v7.05c0 .28.22.5.5.5H7a.5.5 0 0 0 .5-.5V12c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5v3.5c0 .28.22.5.5.5h2.5a.5.5 0 0 0 .5-.5V8.45a.5.5 0 0 0-.17-.38l-5.5-4.94Z", fluent: "home_20_regular" },
  folder: { d: "M4.5 3A2.5 2.5 0 0 0 2 5.5v9A2.5 2.5 0 0 0 4.5 17h11a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 15.5 5H9.7L8.23 3.51A1.75 1.75 0 0 0 6.98 3H4.5ZM3 5.5C3 4.67 3.67 4 4.5 4h2.48c.2 0 .4.08.53.22L8.8 5.5 7.44 6.85a.5.5 0 0 1-.35.15H3V5.5ZM3 8h4.09c.4 0 .78-.16 1.06-.44L9.7 6h5.79c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5V8Z", fluent: "folder_20_regular" },
  people: { d: "M4.5 6.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM6.75 3.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Zm5.69 11.65c.53.21 1.21.35 2.06.35 1.88 0 2.92-.67 3.47-1.43a2.92 2.92 0 0 0 .53-1.5v-.07c0-.83-.67-1.5-1.5-1.5h-4.63c.24.29.42.63.53 1H17c.28 0 .5.22.5.5v.1l-.04.22c-.04.18-.13.42-.3.66-.33.46-1.04 1.02-2.66 1.02-.73 0-1.28-.11-1.69-.28-.08.28-.2.6-.37.93ZM1.5 13c0-1.1.9-2 2-2H10a2 2 0 0 1 2 2V13.08a1.43 1.43 0 0 1-.01.18 3.95 3.95 0 0 1-.67 1.8C10.62 16.09 9.26 17 6.75 17c-2.51 0-3.87-.92-4.57-1.93a3.95 3.95 0 0 1-.68-1.99V13Zm1 .06v.1l.06.33c.07.27.2.64.45 1C3.49 15.2 4.5 16 6.75 16s3.26-.8 3.74-1.5a2.95 2.95 0 0 0 .5-1.42l.01-.02V13a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1v.06ZM13 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM14.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z", fluent: "people_20_regular" },
  settings: { d: "M1.91 7.38A8.5 8.5 0 0 1 3.7 4.3a.5.5 0 0 1 .54-.13l1.92.68a1 1 0 0 0 1.32-.76l.36-2a.5.5 0 0 1 .4-.4 8.53 8.53 0 0 1 3.55 0c.2.04.35.2.38.4l.37 2a1 1 0 0 0 1.32.76l1.92-.68a.5.5 0 0 1 .54.13 8.5 8.5 0 0 1 1.78 3.08c.06.2 0 .4-.15.54l-1.56 1.32a1 1 0 0 0 0 1.52l1.56 1.32a.5.5 0 0 1 .15.54 8.5 8.5 0 0 1-1.78 3.08.5.5 0 0 1-.54.13l-1.92-.68a1 1 0 0 0-1.32.76l-.37 2a.5.5 0 0 1-.38.4 8.53 8.53 0 0 1-3.56 0 .5.5 0 0 1-.39-.4l-.36-2a1 1 0 0 0-1.32-.76l-1.92.68a.5.5 0 0 1-.54-.13 8.5 8.5 0 0 1-1.78-3.08.5.5 0 0 1 .15-.54l1.56-1.32a1 1 0 0 0 0-1.52L2.06 7.92a.5.5 0 0 1-.15-.54Zm1.06 0 1.3 1.1a2 2 0 0 1 0 3.04l-1.3 1.1c.3.79.72 1.51 1.25 2.16l1.6-.58a2 2 0 0 1 2.63 1.53l.3 1.67a7.56 7.56 0 0 0 2.5 0l.3-1.67a2 2 0 0 1 2.64-1.53l1.6.58a7.5 7.5 0 0 0 1.24-2.16l-1.3-1.1a2 2 0 0 1 0-3.04l1.3-1.1a7.5 7.5 0 0 0-1.25-2.16l-1.6.58a2 2 0 0 1-2.63-1.53l-.3-1.67a7.55 7.55 0 0 0-2.5 0l-.3 1.67A2 2 0 0 1 5.81 5.8l-1.6-.58a7.5 7.5 0 0 0-1.24 2.16ZM7.5 10a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Zm1 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z", fluent: "settings_20_regular" },
} as const

// panel_left_contract_20_regular — verified directly in node_modules/@fluentui/svg-icons.
// Corrects the earlier (wrong) Q4 investigation: the actual RailNav source
// (design-system/src/gallery/ExpandButton.tsx line 6 + 99) imports IconPanelLeftContract,
// NOT IconChevronDoubleLeft. The docs claiming "IconChevronDoubleLeft, visually approved"
// were stale relative to the real, currently-shipping component file — see the flaws log
// in LIMBO-PROTOCOL-LOG.md. The user's screenshots (a real product using this exact glyph,
// highlighted) match this SVG exactly: a two-panel rectangle with a left-pointing arrow.
const PANEL_LEFT_CONTRACT_PATH =
  "M10.82 10.5h3.68a.5.5 0 0 0 0-1h-3.68l1-.87a.5.5 0 1 0-.66-.76l-2 1.75a.5.5 0 0 0 0 .76l2 1.75a.5.5 0 1 0 .66-.76l-1-.87ZM4 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4ZM3 6a1 1 0 0 1 1-1h3v10H4a1 1 0 0 1-1-1V6Zm5 9V5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8Z"

/** The 4 blocking-priority decisions — everything else cascades from these. */
export const blockingQuestions: DecisionQuestion[] = [
  {
    id: "q1",
    priority: 1,
    title: "Icon `filled` prop system",
    blocks: "All interactive icon states (hover / active / browsing) across the whole component",
    context:
      "RailNav toggles every interactive icon between a \u201cregular\u201d and \u201cfilled\u201d SVG variant on hover, active, and browsing states. Our Fluent icon pipeline (icons/manifest.json \u2192 build-icons.mjs) only emits static regular-style icons \u2014 there is no filled prop and no filled SVGs generated for any current manifest entry.",
    options: [
      { label: "(a) Add filled-variant manifest entries only for the icons RailNav needs", detail: "e.g. MoreHorizontalFilledIcon \u2192 more_horizontal_20_filled. Smallest footprint; filled variants added case-by-case as needed." },
      { label: "(b) Drop the filled toggle entirely \u2014 CHOSEN", detail: "Signal hover / active / browsing with color or opacity changes only \u2014 no fill change for now." },
      { label: "(c) Extend the icon pipeline to support `filled` natively", detail: "Change icons/manifest.json's schema + build-icons.mjs so ANY icon can declare a filled variant going forward. Largest scope, but reusable for future components." },
    ],
    resolution: {
      chosenLabel: "(b) Drop the filled toggle for now",
      note: "Regular-style icons only for the first prototype. Once a working Rail Sidebar prototype exists, revisit whether specific states (e.g. selected vs. not-selected) should use filled icons \u2014 decide against a real, running prototype rather than in the abstract.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "Origin: regular \u2192 filled swap on hover/active",
      beforeSvgPath: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      afterIconName: "MoreHorizontalIcon",
      afterLabel: "bidezine: regular only (Decision: b)",
      afterNote: "No fill toggle for now \u2014 hover/active signaled by color/opacity only.",
    },
  },
  {
    id: "q2",
    priority: 2,
    title: "Dark rail surface token family",
    blocks: "The entire rail color system \u2014 background, hover/active/pressed states, borders, on-dark text/icon colors",
    context:
      "The rail needs a coherent family of ~8 dark-surface-specific tokens (darkSurface, darkHoverBg, darkActiveBg, darkPressedBg, darkBorderStrong, onDark, onDarkHover, onDarkSubtle) with no bidezine equivalent. CLAUDE.md's core rule is that tokens are authored only in tokens/*.tokens.json \u2014 never hand-written inline.",
    options: [
      { label: "(a) Author a new dark-surface token group in tokens/base.tokens.json \u2014 CHOSEN", detail: "Adds a dedicated token family, with light/dark values since they DO differ by the app's own theme (confirmed against the origin's tokens.ts \u2014 see the Color token lab tab)." },
      { label: "(b) Reuse existing sidebar / sidebar-foreground tokens where close enough", detail: "Add only the tokens that truly have no equivalent (e.g. the interactive overlay states)." },
      { label: "(c) Treat the rail as always-dark regardless of app theme", detail: "Ruled out \u2014 the origin's own tokens.ts proves the rail's exact values DO change between the app's light and dark theme (see Color token lab)." },
    ],
    resolution: {
      chosenLabel: "(a) Author a new dark-surface token group",
      note: "The 9-token candidate set (matching bidezine's own achromatic lightness stops, not the origin's raw values) is tentatively approved \u2014 see the \u201cColor token lab\u201d tab, which now also shows them composed on a mock rail (RailPreview). Final sign-off is pending that composed view, not just the isolated swatches; nothing is written to tokens/*.tokens.json until then.",
    },
  },
  {
    id: "q3",
    priority: 3,
    title: "Default logo icon (IconLogo)",
    blocks: "The rail's default logo slot when no `logo` prop is supplied",
    context:
      "RailNav defaults to a custom IconLogo (the brand mark) when no logo prop is passed. It isn't in icons/manifest.json.",
    options: [
      { label: "(a) Add as a `custom` manifest entry \u2014 CHOSEN, with a standing rule", detail: "AI must never pick or invent a logo/brand icon. The rule going forward: always ask the user for an image link to import; if none is supplied, the logo slot renders empty (not a placeholder icon)." },
      { label: "(b) Remove the default entirely", detail: "Superseded by (a) with the standing rule \u2014 an explicit empty state covers this case too." },
      { label: "(c) Use an existing Fluent icon as a placeholder default", detail: "Rejected \u2014 a generic icon in a brand-mark slot is misleading, worse than an honest empty state." },
    ],
    resolution: {
      chosenLabel: "(a) Custom manifest entry, sourced from the origin project",
      note: "For Rail Sidebar specifically: use the exact bidezine mark from the origin project (design-system/src/icons/fluent.tsx \u2192 IconLogo) \u2014 that mark already IS the bidezine logo. Standing rule for every future logo/brand slot: AI asks for an image link; empty if none given; never auto-selects or invents one.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "Origin IconLogo (bidezine mark)",
      beforeSvgPath: BIDEZINE_LOGO_PATH,
      beforeViewBox: "0 0 26.064 24",
      afterLabel: "Same mark, added as a custom manifest entry",
      afterNote: "Not yet added to icons/manifest.json \u2014 happens at Build time, once the rest of Human Decisions is resolved.",
    },
  },
  {
    id: "q4",
    priority: 4,
    title: "Panel collapse icon \u2014 corrected: panel_left_contract, not double-chevron",
    blocks: "The panel's collapse/expand button",
    context:
      "CORRECTED after your feedback: the real, currently-shipping source (design-system/src/gallery/ExpandButton.tsx) imports IconPanelLeftContract, not IconChevronDoubleLeft \u2014 the earlier investigation trusted a stale QA doc instead of the actual component file. Verified against node_modules/@fluentui/svg-icons: panel_left_contract_20_regular and panel_left_expand_20_regular both exist natively, and the SVG path matches your screenshots exactly (two-panel rectangle + left-pointing arrow).",
    options: [
      { label: "(a) Add panel_left_contract_20_regular / panel_left_expand_20_regular to the manifest \u2014 CHOSEN", detail: "Exact 1:1 Fluent match, both regular and filled variants exist if Q1 is revisited later. No compromise needed." },
      { label: "(b) Use the existing PanelLeftIcon (panel_left_20_regular, no arrow)", detail: "Already in our manifest, but visually different \u2014 no collapse/expand direction shown." },
      { label: "(c) A different Fluent icon", detail: "Not needed \u2014 the exact source icon exists natively." },
    ],
    resolution: {
      chosenLabel: "(a) panel_left_contract_20_regular (+ panel_left_expand_20_regular for the open state)",
      note: "This is not really a divergence anymore \u2014 it's a clean 1:1 match, once traced to the real source file instead of a stale doc. Manifest addition happens at Build time.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "IconPanelLeftContract (real source: ExpandButton.tsx)",
      beforeSvgPath: PANEL_LEFT_CONTRACT_PATH,
      afterIconName: "PanelLeftIcon",
      afterLabel: "Closest current manifest icon (no arrow) \u2014 panel_left_contract to be added",
      afterNote: "panel_left_contract_20_regular verified to exist in @fluentui/svg-icons \u2014 exact match, just not in our manifest yet.",
    },
  },
]

/** Proposed draft values for Q2's new dark-rail token family \u2014 sourced directly from the
 * origin project's tokens.ts (real hex/rgba, not invented), split by the ORIGIN APP's own
 * light/dark theme (confirmed to differ \u2014 see Q2 resolution). Nothing here is written to
 * tokens/*.tokens.json; this is a preview lab for your approval only. */
export interface ProposedToken {
  /** Origin project's own token name (design-system/src/tokens.ts) — shown for traceability only. */
  originName: string
  /** Proposed bidezine CSS custom property name, extending the existing --sidebar-* family (the
   * closest existing bidezine token group) rather than inventing a new naming scheme. NOT yet
   * authored into tokens/*.tokens.json — naming only, pending your approval alongside the color. */
  proposedVar: string
  usage: string
  /** Origin's own value, verbatim, from design-system/src/tokens.ts. Reference only — not a bidezine color. */
  originLightHex: string
  originDarkHex: string
  /** Candidate value if we approve this token: reuses one of bidezine's EXISTING achromatic
   * lightness stops (the exact oklch() values already defined in src/styles/tokens.css for
   * --background/--sidebar/--secondary/--accent/--ring/--muted-foreground/--primary/--foreground),
   * rather than inventing a new number. This is what "strategic, matches bidezine's color balance"
   * means in practice: the rail's ramp lines up 1:1 with a ramp bidezine already uses elsewhere. */
  proposedLight: string
  proposedDark: string
}

export const proposedDarkRailTokens: ProposedToken[] = [
  { originName: "darkSurface", proposedVar: "--sidebar-rail-surface", usage: "Rail background", originLightHex: "#1c2024", originDarkHex: "#111113", proposedLight: "oklch(0.205 0 0)", proposedDark: "oklch(0.145 0 0)" },
  { originName: "darkHoverBg", proposedVar: "--sidebar-rail-hover", usage: "Row hover overlay", originLightHex: "rgba(255,255,255,0.10)", originDarkHex: "#212225", proposedLight: "oklch(0.301 0 0)", proposedDark: "oklch(0.222 0 0)" },
  { originName: "darkPressedBg", proposedVar: "--sidebar-rail-pressed", usage: "Row pressed overlay", originLightHex: "rgba(255,255,255,0.15)", originDarkHex: "#2e3135", proposedLight: "oklch(0.39 0 0)", proposedDark: "oklch(0.305 0 0)" },
  { originName: "darkActiveBg", proposedVar: "--sidebar-rail-active", usage: "Row active/selected overlay", originLightHex: "rgba(255,255,255,0.20)", originDarkHex: "#272a2d", proposedLight: "oklch(0.39 0 0)", proposedDark: "oklch(0.252 0 0)" },
  { originName: "darkBorderStrong", proposedVar: "--sidebar-rail-border-strong", usage: "Visible border on the dark rail", originLightHex: "rgba(255,255,255,0.6)", originDarkHex: "#5a6169", proposedLight: "oklch(0.256 0 0)", proposedDark: "oklch(0.301 0 0)" },
  { originName: "onDark", proposedVar: "--sidebar-rail-foreground", usage: "Full-strength text/icon on dark rail", originLightHex: "#ffffff", originDarkHex: "#ffffff", proposedLight: "oklch(0.985 0 0)", proposedDark: "oklch(0.985 0 0)" },
  { originName: "onDarkHover", proposedVar: "--sidebar-rail-foreground-hover", usage: "\u224885% on-dark, hover state", originLightHex: "rgba(255,255,255,0.85)", originDarkHex: "#edeef0", proposedLight: "oklch(0.922 0 0)", proposedDark: "oklch(0.922 0 0)" },
  { originName: "onDarkSubtle", proposedVar: "--sidebar-rail-foreground-subtle", usage: "\u224850% on-dark, subordinate text", originLightHex: "rgba(255,255,255,0.5)", originDarkHex: "#696e77", proposedLight: "oklch(0.708 0 0)", proposedDark: "oklch(0.708 0 0)" },
  { originName: "onDarkDisabled", proposedVar: "--sidebar-rail-foreground-disabled", usage: "\u224820% on-dark, disabled", originLightHex: "rgba(255,255,255,0.2)", originDarkHex: "#3e4348", proposedLight: "oklch(0.42 0 0)", proposedDark: "oklch(0.375 0 0)" },
]

/** clean = never actually diverged; note/decision = still open; resolved = WAS a decision item,
 * now settled by an already-answered blocking question — kept distinct from "clean" so the row
 * still documents that a real decision happened, without the misleading "needs a human" tag. */
export type DivergenceStatus = "clean" | "decision" | "note" | "resolved"

/** Visual-comparison payloads — rendered by src/components/CompareVisuals.tsx. Every value here
 * is sourced from either the origin project's real code (limbo/rail-sidebar/reference/) or our
 * own manifest/tokens, never invented. See "Verify by render, not by number" in CLAUDE.md. */
export interface IconVisual {
  kind: "icon"
  beforeLabel: string
  beforeSvgPath: string
  beforeViewBox?: string
  afterIconName?: string
  afterLabel?: string
  afterNote?: string
}

export interface ColorVisual {
  kind: "color"
  beforeLabel: string
  beforeHexLight: string
  beforeHexDark?: string
  afterLabel?: string
  afterVar?: string
  afterNote?: string
}

export interface TypeVisual {
  kind: "type"
  beforeLabel: string
  beforeFamily: string
  beforeSize: string
  beforeWeight: string
  afterLabel: string
  afterClassName: string
}

export interface ShapeVisual {
  kind: "shape"
  beforeLabel: string
  beforeStyle: { radius?: string; width?: string; height?: string }
  afterLabel: string
  afterStyle: { radius?: string; width?: string; height?: string; className?: string }
}

export interface MotionVisual {
  kind: "motion"
  beforeLabel: string
  beforeDurationMs: number
  beforeEasing: string
  afterLabel?: string
  afterDurationMs?: number
  afterEasing?: string
  recommendation?: string
}

export interface ElevationVisual {
  kind: "elevation"
  beforeLabel: string
  afterLabel: string
  afterShadowClassName: string
}

export interface ZIndexVisual {
  kind: "zindex"
  beforeLabel: string
  afterLabel?: string
  afterValue?: string
}

export type Visual =
  | IconVisual
  | ColorVisual
  | TypeVisual
  | ShapeVisual
  | MotionVisual
  | ElevationVisual
  | ZIndexVisual

export interface DivergenceRow {
  id: string
  what: string
  status: DivergenceStatus
  detail: string
  visual?: Visual
}

export interface DivergenceCategory {
  id: string
  name: string
  rows: DivergenceRow[]
}

/** Full itemized divergence list, condensed from limbo/rail-sidebar/INTAKE-REPORT.md. */
export const divergenceCategories: DivergenceCategory[] = [
  {
    id: "A",
    name: "Icons",
    rows: [
      { id: "A-1", what: "IconEllipsis (\u201cMore\u201d trigger + panel-header ellipsis)", status: "note", detail: "MoreHorizontalIcon exists in our manifest. Waiting on your side for Q1's final resolution \u2014 the specific hover/active/selected-state fill behavior for this trigger is exactly the case Q1 said to revisit once a working prototype exists, so this stays open rather than auto-closing off Q1's interim answer.", visual: { kind: "icon", beforeLabel: "IconEllipsis (regular)", beforeSvgPath: "M4 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z", afterIconName: "MoreHorizontalIcon", afterLabel: "MoreHorizontalIcon (same Fluent slug)" } },
      { id: "A-2", what: "IconChevronDown (disclosure chevron)", status: "clean", detail: "ChevronDownIcon exists \u2014 same Fluent slug (chevron_down_20_regular), exact match. Icon-sizing rule (see A-6 for the same explanation): bidezine sources every icon from Fluent's 20px-regular grid (100% of icons/manifest.json uses the _20_regular slug \u2014 that's fixed), but the ON-SCREEN render size is controlled per component via Tailwind size-* classes (e.g. buttons default unstyled icons to size-4/16px), not a fixed 20px display rule. So origin's size={16} in a 20px slot isn't a divergence \u2014 it's the same sourcing grid, just a smaller render size, which our components already support.", visual: { kind: "icon", beforeLabel: "IconChevronDown (regular, 16px in a 20px slot)", beforeSvgPath: "M4.7 7.7a1 1 0 0 1 1.4 0L10 11.6l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L4.7 9.1a1 1 0 0 1 0-1.4Z", afterIconName: "ChevronDownIcon", afterLabel: "ChevronDownIcon (same Fluent slug, 20px)" } },
      { id: "A-3", what: "IconLogo (default logo slot)", status: "resolved", detail: "Not in our manifest \u2014 resolved by Q3: AI never picks a logo, the user always supplies the image link; for Rail Sidebar specifically, use the real bidezine mark (sourced from the origin project) as an inline SVG so it tracks the theme toggle. See the Logo import slot on the Blocking questions tab.", visual: { kind: "icon", beforeLabel: "IconLogo (origin bidezine mark)", beforeSvgPath: "M 15.099 2.069 C 21.154 2.069 26.063 6.979 26.063 13.034 C 26.063 19.09 21.154 23.999 15.099 23.999 L 14.087 23.999 C 14.082 23.999 14.076 24 14.07 24 L 9.306 24 C 8.77 24 8.297 23.65 8.141 23.139 L 4.984 12.835 C 4.744 12.052 5.33 11.26 6.149 11.26 L 10.998 11.26 C 11.537 11.26 12.012 11.614 12.166 12.13 L 13.499 16.602 L 15.103 16.602 C 17.073 16.602 18.671 15.004 18.671 13.033 C 18.671 11.063 17.073 9.465 15.103 9.465 C 14.349 9.465 13.685 8.97 13.47 8.248 L 11.985 3.262 C 11.825 2.723 12.182 2.069 12.744 2.069 L 15.099 2.069 Z M 8.441 0 C 8.982 -0.002 9.459 0.352 9.613 0.87 L 10.084 2.446 C 10.201 2.838 10.013 3.256 9.644 3.431 L 9.12 3.678 L 9.12 3.68 L 9.119 3.681 L 8.805 3.832 C 8.366 4.043 8.452 4.692 8.931 4.781 L 10.311 5.038 C 10.666 5.104 10.954 5.363 11.058 5.709 L 11.779 8.129 C 12.012 8.91 11.428 9.695 10.612 9.695 L 3.429 9.695 C 2.893 9.695 2.42 9.345 2.264 8.833 L 0.055 1.602 C -0.184 0.82 0.398 0.029 1.215 0.026 L 8.441 0 Z", afterLabel: "Same mark, rendered inline (fill=currentColor)" } },
      { id: "A-4", what: "IconCheckmark (checked-row indicator)", status: "clean", detail: "CheckIcon exists in our manifest, used without the filled toggle here.", visual: { kind: "icon", beforeLabel: "IconCheckmark (regular)", beforeSvgPath: "M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z", afterIconName: "CheckIcon", afterLabel: "CheckIcon \u2014 exact match" } },
      { id: "A-5", what: "IconSearch (search bar lead icon)", status: "clean", detail: "SearchIcon exists; API differs slightly (size/color props vs our className-only API) but no new icon needed.", visual: { kind: "icon", beforeLabel: "IconSearch (regular)", beforeSvgPath: "M9 3a6 6 0 1 0 3.76 10.66l3.79 3.79a1 1 0 0 0 1.41-1.41l-3.79-3.79A6 6 0 0 0 9 3Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z", afterIconName: "SearchIcon", afterLabel: "SearchIcon \u2014 exact match" } },
      { id: "A-6", what: "IconDismiss (search ClearButton)", status: "note", detail: "XIcon exists (dismiss_20_regular \u2014 exact Fluent match, same sizing-rule reasoning as A-2, no sizing divergence). What's genuinely still open is how ClearButton itself gets rebuilt (see L-5) \u2014 that's a component-structure decision, not an icon decision.", visual: { kind: "icon", beforeLabel: "IconDismiss (regular)", beforeSvgPath: "M4.4 4.4a1 1 0 0 1 1.4 0L10 8.6l4.2-4.2a1 1 0 1 1 1.4 1.4L11.4 10l4.2 4.2a1 1 0 0 1-1.4 1.4L10 11.4l-4.2 4.2a1 1 0 0 1-1.4-1.4L8.6 10 4.4 5.8a1 1 0 0 1 0-1.4Z", afterIconName: "XIcon", afterLabel: "XIcon (dismiss_20_regular) \u2014 exact match" } },
      { id: "A-7", what: "IconPanelLeftContract (panel collapse button) \u2014 corrected, was misidentified as IconChevronDoubleLeft", status: "resolved", detail: "Not in our manifest yet, but a verified 1:1 Fluent match exists (panel_left_contract_20_regular) \u2014 resolved by Q4. Just a manifest addition needed at Build time, no further decision required." },
      { id: "A-8", what: "Consumer-supplied section icons", status: "resolved", detail: "Used with a filled toggle at 20px in both rail and panel header in the origin \u2014 resolved by Q1 (b): regular-style only for now, so consumers pass one static icon, no filled/regular toggle to reconcile." },
      { id: "A-9", what: "The `filled` prop system itself", status: "resolved", detail: "The single largest structural decision \u2014 resolved by Q1: the `filled` prop system is dropped for now (regular icons only). Revisit specific states (e.g. selected) only once a working prototype exists \u2014 that revisit is tracked at A-1, not here." },
    ],
  },
  {
    id: "B",
    name: "Colors \u2014 Dark Rail Surface",
    rows: [
      { id: "B-1", what: "darkSurface (rail background)", status: "decision", detail: "Closest bidezine token (sidebar, dark mode) is visually different \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "darkSurface (origin)", beforeHexLight: "#1c2024", beforeHexDark: "#111113", afterVar: "--sidebar", afterLabel: "current --sidebar (for comparison only)", afterNote: "Proposed new token would carry the origin's own hex verbatim as a draft \u2014 see Color token lab tab." } },
      { id: "B-2", what: "darkHoverBg (hover overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "darkHoverBg (origin)", beforeHexLight: "rgba(255,255,255,0.10)", beforeHexDark: "#212225", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
      { id: "B-3", what: "darkActiveBg (active/selected overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "darkActiveBg (origin)", beforeHexLight: "rgba(255,255,255,0.20)", beforeHexDark: "#272a2d", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
      { id: "B-4", what: "darkPressedBg (pressed overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "darkPressedBg (origin)", beforeHexLight: "rgba(255,255,255,0.15)", beforeHexDark: "#2e3135", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
      { id: "B-5", what: "darkBorderStrong (visible border on dark surface)", status: "decision", detail: "Our dark `border` token is far too subtle (10% opacity) for this use \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "darkBorderStrong (origin)", beforeHexLight: "rgba(255,255,255,0.6)", beforeHexDark: "#5a6169", afterVar: "--border", afterLabel: "current --border (too subtle, for comparison)" } },
      { id: "B-6", what: "onDark (on-dark text/icon, full strength)", status: "decision", detail: "sidebar-foreground is close but theme-tied, while RailNav's value is always-dark \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "onDark (origin, always white)", beforeHexLight: "#ffffff", beforeHexDark: "#ffffff", afterVar: "--sidebar-foreground", afterLabel: "current --sidebar-foreground (theme-tied, for comparison)" } },
      { id: "B-7", what: "onDarkHover (\u224885% opacity on-dark)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "onDarkHover (origin)", beforeHexLight: "rgba(255,255,255,0.85)", beforeHexDark: "#edeef0", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
      { id: "B-8", what: "onDarkSubtle (\u224850\u201360% opacity on-dark)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "onDarkSubtle (origin)", beforeHexLight: "rgba(255,255,255,0.5)", beforeHexDark: "#696e77", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
      { id: "B-9", what: "onDarkDisabled", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2.", visual: { kind: "color", beforeLabel: "onDarkDisabled (origin)", beforeHexLight: "rgba(255,255,255,0.2)", beforeHexDark: "#3e4348", afterNote: "No bidezine equivalent \u2014 proposed as a new token, see Color token lab tab." } },
    ],
  },
  {
    id: "C",
    name: "Colors \u2014 Light Panel Surface",
    rows: [
      { id: "C-1", what: "surface (panel background)", status: "note", detail: "Several near-equivalent tokens exist (background / card / sidebar) \u2014 needs the correct semantic pick. Origin's own app theme changes this (it's not fixed-white) \u2014 toggle light/dark above to compare both.", visual: { kind: "color", beforeLabel: "surface (origin)", beforeHexLight: "#ffffff", beforeHexDark: "#272a2d", afterVar: "--card", afterLabel: "closest candidate: --card" } },
      { id: "C-2", what: "ink (full-strength text on light)", status: "clean", detail: "Maps directly to --foreground.", visual: { kind: "color", beforeLabel: "ink (origin)", beforeHexLight: "#1c2024", beforeHexDark: "#edeef0", afterVar: "--foreground", afterLabel: "--foreground \u2014 exact match" } },
      { id: "C-3", what: "textMuted (\u224860% subordinate text)", status: "clean", detail: "Maps directly to --muted-foreground.", visual: { kind: "color", beforeLabel: "textMuted (origin)", beforeHexLight: "#60646c", beforeHexDark: "#b0b4ba", afterVar: "--muted-foreground", afterLabel: "--muted-foreground \u2014 exact match" } },
      { id: "C-4", what: "textSubtle (\u224840% faint text)", status: "decision", detail: "No exact match \u2014 noticeably different from muted-foreground's 60%.", visual: { kind: "color", beforeLabel: "textSubtle (origin)", beforeHexLight: "#8b8d98", beforeHexDark: "#696e77", afterVar: "--muted-foreground", afterLabel: "--muted-foreground (closest, but stronger than intended)" } },
      { id: "C-5", what: "textDisabled (\u224830% very faint)", status: "decision", detail: "Bidezine uses opacity-50 on the whole element instead of a per-property color token.", visual: { kind: "color", beforeLabel: "textDisabled (origin)", beforeHexLight: "#b9bbc6", beforeHexDark: "#5a6169", afterNote: "bidezine approach: opacity-50 on the element, not a dedicated color token." } },
      { id: "C-6", what: "hoverBg (panel row hover)", status: "note", detail: "accent is the closest match; needs visual verification, especially in dark mode.", visual: { kind: "color", beforeLabel: "hoverBg (origin)", beforeHexLight: "#f0f0f3", beforeHexDark: "#2e3135", afterVar: "--accent", afterLabel: "closest candidate: --accent" } },
      { id: "C-7", what: "bgSubtle (checked menu rows)", status: "note", detail: "muted matches the value but its semantic reads \u201clow-emphasis,\u201d not \u201cchecked.\u201d", visual: { kind: "color", beforeLabel: "bgSubtle (origin)", beforeHexLight: "#f9f9fb", beforeHexDark: "#212225", afterVar: "--muted", afterLabel: "closest candidate: --muted" } },
      { id: "C-8", what: "activeBg (pressed panel-header menu rows)", status: "decision", detail: "No clean bidezine equivalent.", visual: { kind: "color", beforeLabel: "activeBg (origin)", beforeHexLight: "#e8e8ec", beforeHexDark: "#2e3135", afterVar: "--accent", afterLabel: "closest candidate: --accent (imperfect)" } },
      { id: "C-9", what: "pressedOverlay (ellipsis trigger pressed state)", status: "decision", detail: "No bidezine equivalent.", visual: { kind: "color", beforeLabel: "pressedOverlay (origin)", beforeHexLight: "#e0e1e6", beforeHexDark: "#363a3f", afterNote: "No bidezine equivalent yet." } },
      { id: "C-10", what: "focusOverlay (keyboard-focus fill)", status: "note", detail: "Our `ring` token may serve, but it's a ring not a fill \u2014 needs a decision.", visual: { kind: "color", beforeLabel: "focusOverlay (origin, a FILL)", beforeHexLight: "#f0f0f3", beforeHexDark: "#363a3f", afterVar: "--ring", afterLabel: "--ring (a ring, not a fill \u2014 different mechanism)" } },
      { id: "C-11", what: "hairline (0.5px dividers)", status: "note", detail: "border token is close; the 0.5px (not 1px) weight needs to be preserved.", visual: { kind: "color", beforeLabel: "hairline (origin, 0.5px)", beforeHexLight: "#d9d9e0", beforeHexDark: "#363a3f", afterVar: "--border", afterLabel: "--border (currently 1px in our components)" } },
      { id: "C-12", what: "borderStrong (inset pressed ring on light menu rows)", status: "decision", detail: "Our border token is too light for a \u201cstrong\u201d border.", visual: { kind: "color", beforeLabel: "borderStrong (origin)", beforeHexLight: "#b9bbc6", beforeHexDark: "#5a6169", afterVar: "--border", afterLabel: "--border (too light, for comparison)" } },
      { id: "C-13", what: "statusRedText (danger menu rows)", status: "clean", detail: "Maps directly to --destructive.", visual: { kind: "color", beforeLabel: "statusRedText (origin)", beforeHexLight: "#ce2c31", beforeHexDark: "#ff9592", afterVar: "--destructive", afterLabel: "--destructive \u2014 exact match" } },
      { id: "C-14", what: "onInk (text on filled-dark active panel row)", status: "clean", detail: "Maps to --primary-foreground.", visual: { kind: "color", beforeLabel: "onInk (origin)", beforeHexLight: "#ffffff", beforeHexDark: "#111113", afterVar: "--primary-foreground", afterLabel: "--primary-foreground \u2014 exact match" } },
    ],
  },
  {
    id: "D",
    name: "Typography",
    rows: [
      { id: "D-1", what: "Font family: Inter", status: "decision", detail: "Our font-sans is a system-ui stack, no Inter installed. Inter is a free Google Font.", visual: { kind: "type", beforeLabel: "Origin: Inter", beforeFamily: "Inter, sans-serif", beforeSize: "14px", beforeWeight: "400", afterLabel: "bidezine: font-sans (system-ui stack)", afterClassName: "font-sans text-sm" } },
      { id: "D-2", what: "headingS (panel title, ~16px/500)", status: "note", detail: "Depends on D-1; Tailwind text-base font-medium is structurally close.", visual: { kind: "type", beforeLabel: "Origin: headingS (16px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "16px", beforeWeight: "500", afterLabel: "bidezine: text-base font-medium", afterClassName: "font-sans text-base font-medium" } },
      { id: "D-3", what: "bodyM (default panel item, 14px/400)", status: "clean", detail: "Tailwind text-sm, once D-1 resolves." },
      { id: "D-4", what: "bodyS (panel-header menu rows, 13px/400)", status: "decision", detail: "No exact Tailwind step \u2014 12px or 14px are the nearest, 13px isn't a default utility.", visual: { kind: "type", beforeLabel: "Origin: bodyS (13px/400)", beforeFamily: "Inter, sans-serif", beforeSize: "13px", beforeWeight: "400", afterLabel: "bidezine: text-xs (12px, nearest step down)", afterClassName: "font-sans text-xs" } },
      { id: "D-5", what: "labelM (13px/500 \u2014 subtitle, checked rows, tooltip)", status: "decision", detail: "Same 13px gap as D-4.", visual: { kind: "type", beforeLabel: "Origin: labelM (13px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "13px", beforeWeight: "500", afterLabel: "bidezine: text-xs font-medium (12px, nearest step down)", afterClassName: "font-sans text-xs font-medium" } },
      { id: "D-6", what: "labelL (active row, 14px/500)", status: "clean", detail: "Tailwind text-sm font-medium." },
      { id: "D-7", what: "strong (font-weight 500)", status: "clean", detail: "Tailwind font-medium." },
      { id: "D-8", what: "caption (12px, superseded usage)", status: "clean", detail: "Tailwind text-xs \u2014 historical only, current code no longer uses it." },
      { id: "D-9", what: "Active row weight bump (bodyM \u2192 labelL)", status: "clean", detail: "font-normal vs font-medium, conditional class application." },
    ],
  },
  {
    id: "E",
    name: "Spacing",
    rows: [
      { id: "E-1", what: "SPACE[1] = 4px", status: "clean", detail: "gap-1 / p-1." },
      { id: "E-2", what: "SPACE[2] = 8px", status: "clean", detail: "gap-2 / p-2." },
      { id: "E-3", what: "SPACE[3] = 12px", status: "clean", detail: "gap-3 / p-3." },
      { id: "E-4", what: "SPACE[4] = 16px (rail outer gap)", status: "clean", detail: "gap-4 \u2014 note: was a historical bug site in the origin (wrong SPACE step for several cycles)." },
      { id: "E-5", what: "SPACE[6] = 24px", status: "clean", detail: "gap-6 / p-6." },
      { id: "E-6", what: "SPACE.half = 2px", status: "clean", detail: "gap-0.5." },
      { id: "E-7", what: "28px hardcoded subtitle indent", status: "clean", detail: "pl-7 (Tailwind's 4px scale)." },
    ],
  },
  {
    id: "F",
    name: "Layout / Sizing",
    rows: [
      { id: "F-1", what: "railW = 54px (rail column width)", status: "decision", detail: "Our Sidebar primitive's icon-rail width (3rem/48px) is close but not identical.", visual: { kind: "shape", beforeLabel: "railW 54px", beforeStyle: { width: "54px", height: "3rem" }, afterLabel: "Sidebar icon-rail 48px", afterStyle: { width: "48px", height: "3rem" } } },
      { id: "F-2", what: "railButton = 38px (icon button size)", status: "decision", detail: "Our Button default (h-9/36px) doesn't match exactly.", visual: { kind: "shape", beforeLabel: "railButton 38px", beforeStyle: { width: "38px", height: "38px", radius: "8px" }, afterLabel: "Button default 36px (h-9)", afterStyle: { width: "36px", height: "36px", radius: "8px" } } },
      { id: "F-3", what: "panelW = 300px (default panel width)", status: "decision", detail: "Our Sidebar's default width is 16rem/256px \u2014 no exact match.", visual: { kind: "shape", beforeLabel: "panelW 300px", beforeStyle: { width: "150px", height: "2.5rem" }, afterLabel: "Sidebar default 256px (scaled preview)", afterStyle: { width: "128px", height: "2.5rem" } } },
      { id: "F-4", what: "panelGap = 8px", status: "clean", detail: "= SPACE[2] = gap-2 / ml-2." },
      { id: "F-5", what: "hitTarget = 40px (row minHeight, ADR-003)", status: "note", detail: "h-10 matches the value, but it's a deliberate density decision worth preserving intentionally, not just numerically.", visual: { kind: "shape", beforeLabel: "hitTarget 40px", beforeStyle: { width: "8rem", height: "40px" }, afterLabel: "h-10 (40px) \u2014 same value", afterStyle: { width: "8rem", height: "40px" } } },
      { id: "F-6", what: "compact = 28px (NavRowShell minHeight)", status: "note", detail: "min-h-7 matches the value \u2014 but check against F-5 for a possible inconsistency in the origin code.", visual: { kind: "shape", beforeLabel: "compact 28px", beforeStyle: { width: "8rem", height: "28px" }, afterLabel: "min-h-7 (28px) \u2014 same value", afterStyle: { width: "8rem", height: "28px" } } },
      { id: "F-7", what: "FOOTER_MAX_HEIGHT = 122px (3-icon cap)", status: "decision", detail: "Computed constant with no bidezine equivalent; a 4th footer icon is silently clipped by design.", visual: { kind: "shape", beforeLabel: "FOOTER_MAX_HEIGHT 122px (3 icons)", beforeStyle: { width: "2.5rem", height: "122px" }, afterLabel: "No bidezine equivalent yet", afterStyle: { width: "2.5rem", height: "122px", className: "border-dashed" } } },
      { id: "F-8", what: "PANEL_MIN_WIDTH = 240px", status: "clean", detail: "min-w-60 \u2014 document as a design constant." },
      { id: "F-9", what: "ITEM_SLOT = 42px (derived: railButton + SPACE[1])", status: "clean", detail: "Resolves automatically once F-2 and E-1 are decided \u2014 no separate decision needed." },
    ],
  },
  {
    id: "G",
    name: "Border Radius",
    rows: [
      { id: "G-1", what: "RADIUS.rounded = 12px (rail, panel, menus)", status: "decision", detail: "No exact bidezine token \u2014 radius-lg is 10px, radius-xl is 14px.", visual: { kind: "shape", beforeLabel: "RADIUS.rounded 12px", beforeStyle: { width: "3.5rem", height: "3.5rem", radius: "12px" }, afterLabel: "radius-lg 10px vs radius-xl 14px (neither exact)", afterStyle: { width: "3.5rem", height: "3.5rem", radius: "10px" } } },
      { id: "G-2", what: "RADIUS.soft = 8px (rows, overflow items)", status: "clean", detail: "Exact match: radius-md (0.5rem).", visual: { kind: "shape", beforeLabel: "RADIUS.soft 8px", beforeStyle: { width: "3.5rem", height: "3.5rem", radius: "8px" }, afterLabel: "radius-md 8px \u2014 exact match", afterStyle: { width: "3.5rem", height: "3.5rem", radius: "8px" } } },
      { id: "G-3", what: "RADIUS.xs = 4px (menu button, chevron/icon slots)", status: "decision", detail: "Nearest bidezine token, radius-sm, is 6px \u2014 not exact.", visual: { kind: "shape", beforeLabel: "RADIUS.xs 4px", beforeStyle: { width: "2.5rem", height: "2.5rem", radius: "4px" }, afterLabel: "radius-sm 6px (nearest, not exact)", afterStyle: { width: "2.5rem", height: "2.5rem", radius: "6px" } } },
      { id: "G-4", what: "RADIUS.pill = 9999px", status: "clean", detail: "rounded-full.", visual: { kind: "shape", beforeLabel: "RADIUS.pill", beforeStyle: { width: "3.5rem", height: "1.75rem", radius: "9999px" }, afterLabel: "rounded-full \u2014 exact match", afterStyle: { width: "3.5rem", height: "1.75rem", radius: "9999px" } } },
    ],
  },
  {
    id: "H",
    name: "Motion / Animation",
    rows: [
      { id: "H-1", what: "MOTION.fast (hover/press transitions)", status: "decision", detail: "No bidezine motion token \u2014 Tailwind's default transition-colors (150ms) is the nearest baseline.", visual: { kind: "motion", beforeLabel: "MOTION.fast 120ms ease", beforeDurationMs: 120, beforeEasing: "ease", afterLabel: "Tailwind transition-colors 150ms", afterDurationMs: 150, afterEasing: "ease", recommendation: "Close enough (30ms) that a dedicated token may not be needed \u2014 candidate for \u201cclean-enough\u201d once approved." } },
      { id: "H-2", what: "MOTION.medium (panel reveal duration)", status: "decision", detail: "No bidezine motion token.", visual: { kind: "motion", beforeLabel: "MOTION.reveal 700ms ease-out", beforeDurationMs: 700, beforeEasing: "ease-out", recommendation: "No Tailwind default this slow \u2014 would need an arbitrary duration-[700ms] utility or a new motion token." } },
      { id: "H-3", what: "MOTION.ease (fast-transition easing curve)", status: "decision", detail: "No bidezine equivalent curve defined.", visual: { kind: "motion", beforeLabel: "MOTION.ease = \u201cease\u201d (CSS keyword)", beforeDurationMs: 300, beforeEasing: "ease", recommendation: "CSS keyword \u201cease\u201d \u2014 directly expressible via Tailwind's ease-in-out/ease utilities, no new token strictly required." } },
      { id: "H-4", what: "MOTION.easeOut (panel reveal easing)", status: "decision", detail: "No bidezine equivalent.", visual: { kind: "motion", beforeLabel: "MOTION.easeOut = \u201cease-out\u201d", beforeDurationMs: 700, beforeEasing: "ease-out", recommendation: "Maps directly to Tailwind's ease-out utility \u2014 no new token needed, just the 700ms duration from H-2." } },
      { id: "H-5", what: "Panel reveal animation (width + margin-left)", status: "decision", detail: "Entirely custom CSS approach; no bidezine concept for this at all.", visual: { kind: "motion", beforeLabel: "width + margin-left, 700ms ease-out", beforeDurationMs: 700, beforeEasing: "ease-out", recommendation: "Reimplement as a Tailwind transition-[width,margin] with duration-700 ease-out \u2014 no bidezine primitive covers this pattern today." } },
      { id: "H-6", what: "Collapse animation (grid-template-rows, deterministic unmount)", status: "decision", detail: "Our Collapsible (Radix) is similar but implemented differently \u2014 the deterministic-unmount behavior must survive whichever approach is chosen." },
      { id: "H-7", what: "Chevron rotation (\u221290deg \u2192 0deg)", status: "clean", detail: "Tailwind transition-transform + data-state variants, once H-1's timing is decided." },
      { id: "H-8", what: "prefers-reduced-motion handling", status: "clean", detail: "Tailwind's motion-reduce: variant covers this; per-element implementation differs but the approach is compatible." },
    ],
  },
  {
    id: "I",
    name: "Elevation / Shadow",
    rows: [
      { id: "I-1", what: "elevation.mid (panel + both overflow menus)", status: "decision", detail: "No elevation token in bidezine; shadow-md/shadow-lg are the nearest Tailwind classes but may look different.", visual: { kind: "elevation", beforeLabel: "elevation.mid: 0 2px 8px (origin)", afterLabel: "Tailwind shadow-md (nearest candidate)", afterShadowClassName: "shadow-md" } },
    ],
  },
  {
    id: "J",
    name: "Z-Index",
    rows: [
      { id: "J-1", what: "Z.dropdown (overflow + panel-header menus)", status: "note", detail: "Likely maps cleanly to Tailwind's z-50, used by our own overlay components \u2014 verify once building starts.", visual: { kind: "zindex", beforeLabel: "Z.dropdown menu", afterLabel: "Tailwind z-50 (our overlay default)", afterValue: "z-50" } },
      { id: "J-2", what: "Z.rail (rail wrapper, load-bearing stacking context)", status: "decision", detail: "Explicitly flagged in the origin as a sanctioned exception; needs a value chosen for our app shell (above sticky headers, below modals).", visual: { kind: "zindex", beforeLabel: "Z.rail wrapper", afterLabel: "proposed: above sticky headers, below modals", afterValue: "z-30 (proposed, unapproved)" } },
    ],
  },
  {
    id: "K",
    name: "Focus Ring / Scrollbar CSS",
    rows: [
      { id: "K-1", what: "FOCUS_GLOBAL_CSS (global <style> injection for focus rings)", status: "decision", detail: "Conflicts with our per-element Tailwind focus-visible: approach \u2014 needs to be translated, not injected." },
      { id: "K-2", what: "FOCUS.style (inline focus-ring style object)", status: "decision", detail: "Same class-based-vs-inline choice as K-1." },
      { id: "K-3", what: "SCROLL.css / SCROLL.className (custom scrollbar styling)", status: "decision", detail: "Could use our ScrollArea component, browser-default scrollbars, or a custom stylesheet \u2014 needs a pick." },
      { id: "K-4", what: "DISABLED.cursor (not-allowed cursor)", status: "clean", detail: "Tailwind cursor-not-allowed." },
    ],
  },
  {
    id: "L",
    name: "Custom Sub-Components",
    rows: [
      { id: "L-1", what: "LogoSlotDark", status: "note", detail: "No direct bidezine primitive; composable from a plain button + our Tooltip." },
      { id: "L-2", what: "RailButtonDark", status: "decision", detail: "Our Button is light-surface-oriented with standard shadcn variants \u2014 none match the dark rail visual model." },
      { id: "L-3", what: "NavIndentLine", status: "note", detail: "Simple to implement inline once density decisions (E-1/F-5/F-6) are resolved." },
      { id: "L-4", what: "ExpandButton (panel collapse trigger)", status: "note", detail: "Depends on the Q4 icon decision; otherwise composable from our Button." },
      { id: "L-5", what: "ClearButton (search clear)", status: "note", detail: "Composable from our Button (ghost/icon variant) with conditional visibility." },
      { id: "L-6", what: "Badge (neutral / info / dark-surface variants)", status: "decision", detail: "Our Badge's variants (default/secondary/destructive/outline/ghost/link) don't map cleanly to RailNav's neutral/info/atomSurface concepts." },
      { id: "L-7", what: "Collapse (motion component)", status: "decision", detail: "Same H-6 dependency \u2014 use our Collapsible with custom animation, or reimplement Collapse's exact behavior." },
    ],
  },
  {
    id: "M",
    name: "Structural / Behavioral Patterns",
    rows: [
      { id: "M-1", what: "Inline CSS-in-JS styling throughout", status: "decision", detail: "Complete paradigm shift to Tailwind utility classes \u2014 large mechanical translation task, not a per-item decision, but a Build-agent constraint." },
      { id: "M-2", what: "useTokens() hook", status: "note", detail: "Must not be created \u2014 bidezine tokens are CSS variables, consumed via Tailwind classes." },
      { id: "M-3", what: "Direct @radix-ui/react-dropdown-menu import", status: "note", detail: "Needs a dark-surface-styled variant of our own dropdown-menu.tsx wrapper." },
      { id: "M-4", what: "data-dark-surface scoping attribute", status: "note", detail: "No bidezine equivalent concept; worth tracking during Build even if not directly ported." },
      { id: "M-5", what: "Custom hand-rolled tooltip (portal + fixed positioning)", status: "clean", detail: "Our Tooltip (Radix-based, portal built-in) is an effectively clean replacement." },
      { id: "M-6", what: "ResizeObserver overflow budget", status: "note", detail: "Novel DOM-measurement logic with no bidezine equivalent \u2014 must be re-implemented as-is, not simplified away." },
      { id: "M-7", what: "Panel resize handle (mouse-drag)", status: "decision", detail: "Our Resizable primitive (react-resizable-panels) works at a different API level (panel groups vs a single handle) \u2014 needs a pick." },
      { id: "M-8", what: "Conflict with existing Sidebar primitive", status: "decision", detail: "Architecturally different organisms that both could be called \u201csidebar\u201d \u2014 needs naming/documentation guidance." },
      { id: "M-9", what: "logoLabel default = \u201cBiDezine\u201d", status: "clean", detail: "Already correct for our brand \u2014 just needs documenting that non-bidezine consumers must override it." },
      { id: "M-10", what: "modal={false} on both DropdownMenus", status: "clean", detail: "Our dropdown-menu.tsx wrapper passes props through to Radix's root \u2014 no decision needed." },
    ],
  },
]

export interface RiskActionItem {
  id: string
  text: string
  done: boolean
  /** IDs of blocking questions or divergence rows whose resolution satisfies this item, e.g. "Q1", "A-3", "H-6". */
  refs?: string[]
}

export interface RiskNote {
  id: string
  title: string
  detail: string
  actionItems: RiskActionItem[]
}

export const notableRisks: RiskNote[] = [
  {
    id: "R-1",
    title: "Icon `filled` prop is absent from our pipeline",
    detail: "Breaks the entire hover/active visual model until Q1 resolves. Proceeding without it risks silently dropped filled states that pass type-checking but look broken.",
    actionItems: [
      { id: "R-1a", text: "Q1 answered \u2014 regular icons only for now, revisit filled variants once a prototype exists", done: true, refs: ["Q1"] },
      { id: "R-1b", text: "Confirm no rows in category A silently assume a filled variant exists", done: false, refs: ["A-1", "A-2", "A-3", "A-4", "A-5", "A-6", "A-7", "A-8", "A-9"] },
    ],
  },
  {
    id: "R-2",
    title: "Dark surface token family has zero bidezine equivalents",
    detail: "The whole rail color system is missing. Authoring ad-hoc inline values would violate the tokens-only rule in CLAUDE.md.",
    actionItems: [
      { id: "R-2a", text: "Q2 answered \u2014 author new tokens (option a)", done: true, refs: ["Q2"] },
      { id: "R-2b", text: "Color Token Lab built so proposed values can be visually approved before authoring", done: false, refs: ["proposedDarkRailTokens"] },
      { id: "R-2c", text: "User approves each of the 9 proposed dark-rail tokens in the lab", done: false, refs: ["proposedDarkRailTokens"] },
      { id: "R-2d", text: "Approved tokens written to tokens/*.tokens.json (Build phase only)", done: false },
    ],
  },
  {
    id: "R-3",
    title: "Inline CSS-in-JS is incompatible with our Tailwind v4 paradigm",
    detail: "A large, trap-prone mechanical translation task \u2014 some values have no Tailwind utility without arbitrary-value syntax.",
    actionItems: [
      { id: "R-3a", text: "Category H (Motion) items individually decided (duration/easing per transition)", done: false, refs: ["H-1", "H-2", "H-3", "H-4", "H-5", "H-6"] },
      { id: "R-3b", text: "Category K (focus ring / scrollbar CSS injection) individually decided", done: false, refs: ["K-1", "K-2", "K-3", "K-4"] },
      { id: "R-3c", text: "Independent Audit agent confirms no runtime <style> injection survived into Build output", done: false },
    ],
  },
  {
    id: "R-4",
    title: "History of design instability in the origin",
    detail: "At least 7 visual decisions changed mid-development (button size, radius, panel typography, active-row background, etc.). Confirm which version is \u201cfinal\u201d before Build starts.",
    actionItems: [
      { id: "R-4a", text: "Confirm current live ExpandButton.tsx source (not stale QA docs) is the reference for Q4", done: true, refs: ["Q4"] },
      { id: "R-4b", text: "Spot-check remaining categories (F, G) against origin source, not just docs, before Build", done: false, refs: ["F-1", "F-2", "F-3", "F-7", "G-1", "G-3"] },
    ],
  },
  {
    id: "R-5",
    title: "Our own Sidebar primitive defines conflicting concepts",
    detail: "Both could be called \u201csidebar\u201d but are architecturally incompatible organisms \u2014 risk of consumer confusion and token collisions.",
    actionItems: [
      { id: "R-5a", text: "Decide final naming (\u201cRail Sidebar\u201d vs existing \u201cSidebar\u201d) to avoid nav-manifest / export collisions", done: false },
      { id: "R-5b", text: "Confirm neither component's token names or CSS classes collide at Promote time", done: false },
    ],
  },
  {
    id: "R-6",
    title: "The `Collapse` animation component isn't in the reference copy",
    detail: "Its behavior is documented but exact timing/easing values live only in the origin project's MOTION constants, not captured here \u2014 a documentation gap.",
    actionItems: [
      { id: "R-6a", text: "MOTION constants (fast/medium/reveal, easing curves) sourced directly from origin tokens.ts", done: true, refs: ["H-1", "H-2", "H-3", "H-4"] },
      { id: "R-6b", text: "Collapse.tsx (grid-template-rows, deterministic unmount) copied into the self-contained reference before Build", done: false, refs: ["H-6"] },
    ],
  },
  {
    id: "R-7",
    title: "Runtime <style> tag injection conflicts with our build-time CSS approach",
    detail: "Hostile to Tailwind v4's source(none)/@source pattern in CLAUDE.md if carried over as-is.",
    actionItems: [
      { id: "R-7a", text: "K-1/K-2 (focus ring CSS) translated to Tailwind focus-visible: classes, not injected <style>", done: false, refs: ["K-1", "K-2"] },
      { id: "R-7b", text: "K-3 (scrollbar styling) resolved to one of: ScrollArea component, browser default, or a static stylesheet rule", done: false, refs: ["K-3"] },
    ],
  },
  {
    id: "R-8",
    title: "RailButtonDark is exported from the origin package",
    detail: "Consumers compose their own utility items with it \u2014 our export chain (src/index.ts) must be ready at graduation time.",
    actionItems: [
      { id: "R-8a", text: "Decide bidezine-equivalent export name and confirm it's added to src/index.ts at Promote time", done: false },
    ],
  },
  {
    id: "R-9",
    title: "Collapse's deterministic unmount isn't covered by Radix's CollapsibleContent by default",
    detail: "If Build uses Radix Collapsible, unmount timing must be verified against the behavior contract or it will be flagged as a regression by the Escalation agent.",
    actionItems: [
      { id: "R-9a", text: "H-6 (Collapse animation) explicitly decided: reuse Radix Collapsible vs. reimplement custom unmount timing", done: false, refs: ["H-6"] },
      { id: "R-9b", text: "Escalation agent independently verifies chosen approach preserves deterministic unmount before Audit", done: false },
    ],
  },
]

/** A risk is resolved (green) once every one of its action items is done. */
export function isRiskResolved(risk: RiskNote): boolean {
  return risk.actionItems.length > 0 && risk.actionItems.every((item) => item.done)
}

