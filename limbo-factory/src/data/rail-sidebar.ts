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
    { id: "q1", title: "Q1 — Icon filled-prop system", status: "done", note: "Resolved: filled?: boolean added to the icon pipeline" },
    { id: "q2", title: "Q2 — Dark rail surface token family", status: "done", note: "Resolved: all 10 candidate tokens approved in the Color Token Lab" },
    { id: "q3", title: "Q3 — Default logo icon", status: "done", note: "Resolved: custom manifest entry, sourced from the origin bidezine mark" },
    { id: "q4", title: "Q4 — Panel collapse icon", status: "done", note: "Resolved: panel_left_contract_20_regular, a clean 1:1 Fluent match" },
    { id: "remaining", title: "24 remaining divergence rows still awaiting a decision", status: "pending", note: "See the Full divergence list tab — categories C, F, G, H, I, J, K, L, M" },
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
  home: { d: "M9 2.39a1.5 1.5 0 0 1 2 0l5.5 4.94c.32.28.5.69.5 1.12v7.05c0 .83-.67 1.5-1.5 1.5H13a1.5 1.5 0 0 1-1.5-1.5V12a.5.5 0 0 0-.5-.5H9a.5.5 0 0 0-.5.5v3.5c0 .83-.67 1.5-1.5 1.5H4.5A1.5 1.5 0 0 1 3 15.5V8.45c0-.43.18-.84.5-1.12L9 2.39Zm1.33.74a.5.5 0 0 0-.66 0l-5.5 4.94a.5.5 0 0 0-.17.38v7.05c0 .28.22.5.5.5H7a.5.5 0 0 0 .5-.5V12c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5v3.5c0 .28.22.5.5.5h2.5a.5.5 0 0 0 .5-.5V8.45a.5.5 0 0 0-.17-.38l-5.5-4.94Z", filledD: "M11 2.39a1.5 1.5 0 0 0-2 0L3.5 7.33c-.32.28-.5.69-.5 1.12v7.05c0 .83.67 1.5 1.5 1.5h2c.83 0 1.5-.67 1.5-1.5v-4c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5v4c0 .83.67 1.5 1.5 1.5h2c.83 0 1.5-.67 1.5-1.5V8.45c0-.43-.18-.84-.5-1.12L11 2.39Z", fluent: "home_20_regular / home_20_filled" },
  folder: { d: "M4.5 3A2.5 2.5 0 0 0 2 5.5v9A2.5 2.5 0 0 0 4.5 17h11a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 15.5 5H9.7L8.23 3.51A1.75 1.75 0 0 0 6.98 3H4.5ZM3 5.5C3 4.67 3.67 4 4.5 4h2.48c.2 0 .4.08.53.22L8.8 5.5 7.44 6.85a.5.5 0 0 1-.35.15H3V5.5ZM3 8h4.09c.4 0 .78-.16 1.06-.44L9.7 6h5.79c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5V8Z", fluent: "folder_20_regular" },
  people: { d: "M4.5 6.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM6.75 3.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Zm5.69 11.65c.53.21 1.21.35 2.06.35 1.88 0 2.92-.67 3.47-1.43a2.92 2.92 0 0 0 .53-1.5v-.07c0-.83-.67-1.5-1.5-1.5h-4.63c.24.29.42.63.53 1H17c.28 0 .5.22.5.5v.1l-.04.22c-.04.18-.13.42-.3.66-.33.46-1.04 1.02-2.66 1.02-.73 0-1.28-.11-1.69-.28-.08.28-.2.6-.37.93ZM1.5 13c0-1.1.9-2 2-2H10a2 2 0 0 1 2 2V13.08a1.43 1.43 0 0 1-.01.18 3.95 3.95 0 0 1-.67 1.8C10.62 16.09 9.26 17 6.75 17c-2.51 0-3.87-.92-4.57-1.93a3.95 3.95 0 0 1-.68-1.99V13Zm1 .06v.1l.06.33c.07.27.2.64.45 1C3.49 15.2 4.5 16 6.75 16s3.26-.8 3.74-1.5a2.95 2.95 0 0 0 .5-1.42l.01-.02V13a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1v.06ZM13 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM14.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z", filledD: "M6.75 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm5.69 5.14c.53.22 1.2.36 2.06.36 4 0 4-3 4-3 0-.83-.67-1.5-1.5-1.5h-4.63c.4.48.63 1.09.63 1.75v.36a2.94 2.94 0 0 1-.02.25 4.62 4.62 0 0 1-.54 1.78ZM17 7.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM1.5 13c0-1.1.9-2 2-2H10a2 2 0 0 1 2 2s0 4-5.25 4-5.25-4-5.25-4Zm11.5.1v.07Z", fluent: "people_20_regular / people_20_filled" },
  settings: { d: "M1.91 7.38A8.5 8.5 0 0 1 3.7 4.3a.5.5 0 0 1 .54-.13l1.92.68a1 1 0 0 0 1.32-.76l.36-2a.5.5 0 0 1 .4-.4 8.53 8.53 0 0 1 3.55 0c.2.04.35.2.38.4l.37 2a1 1 0 0 0 1.32.76l1.92-.68a.5.5 0 0 1 .54.13 8.5 8.5 0 0 1 1.78 3.08c.06.2 0 .4-.15.54l-1.56 1.32a1 1 0 0 0 0 1.52l1.56 1.32a.5.5 0 0 1 .15.54 8.5 8.5 0 0 1-1.78 3.08.5.5 0 0 1-.54.13l-1.92-.68a1 1 0 0 0-1.32.76l-.37 2a.5.5 0 0 1-.38.4 8.53 8.53 0 0 1-3.56 0 .5.5 0 0 1-.39-.4l-.36-2a1 1 0 0 0-1.32-.76l-1.92.68a.5.5 0 0 1-.54-.13 8.5 8.5 0 0 1-1.78-3.08.5.5 0 0 1 .15-.54l1.56-1.32a1 1 0 0 0 0-1.52L2.06 7.92a.5.5 0 0 1-.15-.54Zm1.06 0 1.3 1.1a2 2 0 0 1 0 3.04l-1.3 1.1c.3.79.72 1.51 1.25 2.16l1.6-.58a2 2 0 0 1 2.63 1.53l.3 1.67a7.56 7.56 0 0 0 2.5 0l.3-1.67a2 2 0 0 1 2.64-1.53l1.6.58a7.5 7.5 0 0 0 1.24-2.16l-1.3-1.1a2 2 0 0 1 0-3.04l1.3-1.1a7.5 7.5 0 0 0-1.25-2.16l-1.6.58a2 2 0 0 1-2.63-1.53l-.3-1.67a7.55 7.55 0 0 0-2.5 0l-.3 1.67A2 2 0 0 1 5.81 5.8l-1.6-.58a7.5 7.5 0 0 0-1.24 2.16ZM7.5 10a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Zm1 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z", filledD: "M1.91 7.38A8.5 8.5 0 0 1 3.7 4.3a.5.5 0 0 1 .54-.13l1.92.68a1 1 0 0 0 1.32-.76l.36-2a.5.5 0 0 1 .4-.4 8.53 8.53 0 0 1 3.55 0c.2.04.35.2.38.4l.37 2a1 1 0 0 0 1.32.76l1.92-.68a.5.5 0 0 1 .54.13 8.5 8.5 0 0 1 1.78 3.08c.06.2 0 .4-.15.54l-1.56 1.32a1 1 0 0 0 0 1.52l1.56 1.32a.5.5 0 0 1 .15.54 8.5 8.5 0 0 1-1.78 3.08.5.5 0 0 1-.54.13l-1.92-.68a1 1 0 0 0-1.32.76l-.37 2a.5.5 0 0 1-.38.4 8.53 8.53 0 0 1-3.56 0 .5.5 0 0 1-.39-.4l-.36-2a1 1 0 0 0-1.32-.76l-1.92.68a.5.5 0 0 1-.54-.13 8.5 8.5 0 0 1-1.78-3.08.5.5 0 0 1 .15-.54l1.56-1.32a1 1 0 0 0 0-1.52L2.06 7.92a.5.5 0 0 1-.15-.54ZM8 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z", fluent: "settings_20_regular / settings_20_filled" },
} as const

// panel_left_contract_20_regular — verified directly in node_modules/@fluentui/svg-icons.
// Corrects the earlier (wrong) Q4 investigation: the actual RailNav source
// (design-system/src/gallery/ExpandButton.tsx line 6 + 99) imports IconPanelLeftContract,
// NOT IconChevronDoubleLeft. The docs claiming "IconChevronDoubleLeft, visually approved"
// were stale relative to the real, currently-shipping component file — see the flaws log
// in LIMBO-PROTOCOL-LOG.md. The user's screenshots (a real product using this exact glyph,
// highlighted) match this SVG exactly: a two-panel rectangle with a left-pointing arrow.
export const PANEL_LEFT_CONTRACT_PATH =
  "M10.82 10.5h3.68a.5.5 0 0 0 0-1h-3.68l1-.87a.5.5 0 1 0-.66-.76l-2 1.75a.5.5 0 0 0 0 .76l2 1.75a.5.5 0 1 0 .66-.76l-1-.87ZM4 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4ZM3 6a1 1 0 0 1 1-1h3v10H4a1 1 0 0 1-1-1V6Zm5 9V5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8Z"

// Additional real Fluent _20_regular glyphs, verified directly against
// node_modules/@fluentui/svg-icons, used only by the "Full composed preview" (FullRailPreview.tsx)
// to render a richer reconstruction of the origin's canonical Default story (rail + expanded panel
// with nested groups, badges, disabled rows, footer) — same "never invent a path" rule as
// PREVIEW_NAV_ICONS above.
export const FULL_PREVIEW_ICONS = {
  checkmark: { d: "M3.37 10.17a.5.5 0 0 0-.74.66l4 4.5c.19.22.52.23.72.02l10.5-10.5a.5.5 0 0 0-.7-.7L7.02 14.27l-3.65-4.1Z", fluent: "checkmark_20_regular" },
  chevronDown: { d: "M15.85 7.65c.2.2.2.5 0 .7l-5.46 5.49a.55.55 0 0 1-.78 0L4.15 8.35a.5.5 0 1 1 .7-.7L10 12.8l5.15-5.16c.2-.2.5-.2.7 0Z", fluent: "chevron_down_20_regular" },
  search: { d: "M13.73 14.44a6.5 6.5 0 1 1 .7-.7l3.42 3.4a.5.5 0 0 1-.63.77l-.07-.06-3.42-3.41Zm-.71-.71A5.54 5.54 0 0 0 15 9.5a5.5 5.5 0 1 0-1.98 4.23Z", fluent: "search_20_regular" },
  moreHorizontal: { d: "M6.25 10a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm5 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM15 11.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z", fluent: "more_horizontal_20_regular" },
  person: { d: "M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM7 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm-2 5a2 2 0 0 0-2 2c0 1.7.83 2.97 2.13 3.8A9.14 9.14 0 0 0 10 18c1.85 0 3.58-.39 4.87-1.2A4.35 4.35 0 0 0 17 13a2 2 0 0 0-2-2H5Zm-1 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1c0 1.3-.62 2.28-1.67 2.95A8.16 8.16 0 0 1 10 17a8.16 8.16 0 0 1-4.33-1.05A3.36 3.36 0 0 1 4 13Z", filledD: "M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-5 9a2 2 0 0 0-2 2c0 1.7.83 2.97 2.13 3.8A9.14 9.14 0 0 0 10 18c1.85 0 3.58-.39 4.87-1.2A4.35 4.35 0 0 0 17 13a2 2 0 0 0-2-2H5Z", fluent: "person_20_regular / person_20_filled" },
  folderOpen: { d: "M3 5.5v6.6l1.5-2.6A3 3 0 0 1 7.1 8H15v-.5c0-.83-.67-1.5-1.5-1.5h-4a.5.5 0 0 1-.35-.15l-1.71-1.7A.5.5 0 0 0 7.09 4H4.5C3.67 4 3 4.67 3 5.5Zm1.28 10.48.22.02h9.4a2 2 0 0 0 1.73-1l2.17-3.75A1.5 1.5 0 0 0 16.5 9H7.1a2 2 0 0 0-1.73 1L3.2 13.75a1.5 1.5 0 0 0 1.08 2.23ZM2 14.46V5.5A2.5 2.5 0 0 1 4.5 3h2.59c.4 0 .78.16 1.06.44L9.7 5h3.79A2.5 2.5 0 0 1 16 7.5V8h.5a2.5 2.5 0 0 1 2.16 3.75L16.5 15.5a3 3 0 0 1-2.6 1.5H4.5a2.54 2.54 0 0 1-1.62-.6A2.5 2.5 0 0 1 2 14.46Z", filledD: "M4.5 3A2.5 2.5 0 0 0 2 5.5v6.97l1.57-2.72A3.5 3.5 0 0 1 6.6 8H16v-.5A2.5 2.5 0 0 0 13.5 5H9.7L8.16 3.44A1.5 1.5 0 0 0 7.09 3H4.5Zm-.07 7.25A2.5 2.5 0 0 1 6.6 9H17a2 2 0 0 1 1.73 3l-2.16 3.75A2.5 2.5 0 0 1 14.4 17H4a2 2 0 0 1-1.73-3l2.16-3.75Z", fluent: "folder_open_20_regular / folder_open_20_filled" },
  document: { d: "M6 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7.41c0-.4-.16-.78-.44-1.06l-3.91-3.91A1.5 1.5 0 0 0 10.59 2H6ZM5 4a1 1 0 0 1 1-1h4v3.5c0 .83.67 1.5 1.5 1.5H15v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Zm9.8 3h-3.3a.5.5 0 0 1-.5-.5V3.2L14.8 7Z", filledD: "M10 2v4.5c0 .83.67 1.5 1.5 1.5H16v8.5c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-13C4 2.67 4.67 2 5.5 2H10Zm1 .25V6.5c0 .28.22.5.5.5h4.25L11 2.25Z", fluent: "document_20_regular / document_20_filled" },
  // The nine below are copied VERBATIM (regular variant) from the origin project's own
  // src/icons/fluent.tsx — i.e. these are the literal, currently-shipping path strings the real
  // RailNav.stories.tsx Default story's SPEC_TREE actually renders (activity/live-ops/participants/
  // system/rules/triggers/schedules nodes), not re-derived or approximated.
  video: { d: "M5 4C3.34315 4 2 5.34315 2 7V13C2 14.6569 3.34315 16 5 16H10C11.6569 16 13 14.6569 13 13V12.6787L16.0372 14.7759C16.8664 15.3484 17.9975 14.7549 17.9975 13.7473V6.25215C17.9975 5.24453 16.8664 4.65101 16.0372 5.22353L13 7.32067V7C13 5.34315 11.6569 4 10 4H5ZM13 8.53588L16.6054 6.04643C16.7712 5.93193 16.9975 6.05063 16.9975 6.25215V13.7473C16.9975 13.9488 16.7712 14.0675 16.6054 13.953L13 11.4635V8.53588ZM3 7C3 5.89543 3.89543 5 5 5H10C11.1046 5 12 5.89543 12 7V13C12 14.1046 11.1046 15 10 15H5C3.89543 15 3 14.1046 3 13V7Z", filledD: "M2 7a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7Zm14.04 7.78L14 13.37V6.63l2.04-1.4c.83-.58 1.96.01 1.96 1.02v7.5c0 1-1.13 1.6-1.96 1.03Z", fluent: "video_20_regular / video_20_filled" },
  videoSettings: { d: "M5 3C3.34315 3 2 4.34315 2 6V10.2572C2.30711 10.0035 2.64222 9.78261 3 9.59971V6C3 4.89543 3.89543 4 5 4H10C11.1046 4 12 4.89543 12 6V12C12 12.7605 11.5756 13.4218 10.9507 13.7601C10.9832 14.0021 11 14.2491 11 14.5C11 14.6117 10.9967 14.7227 10.9901 14.8328C12.1605 14.4237 13 13.3099 13 12V11.6787L16.0372 13.7759C16.8664 14.3484 17.9975 13.7549 17.9975 12.7473V5.25215C17.9975 4.24453 16.8664 3.65101 16.0372 4.22353L13 6.32067V6C13 4.34315 11.6569 3 10 3H5ZM13 7.53588L16.6054 5.04643C16.7712 4.93193 16.9975 5.05063 16.9975 5.25215V12.7473C16.9975 12.9488 16.7712 13.0675 16.6054 12.953L13 10.4635V7.53588ZM3.06572 11.4421L2.90953 10.8853C3.16362 10.69 3.43901 10.5227 3.73144 10.3878L4.06879 10.7458C4.85773 11.5829 6.18849 11.5836 6.97831 10.7473L7.30299 10.4035C7.60078 10.544 7.88057 10.7183 8.1378 10.9216L8.01161 11.3439C7.68227 12.446 8.34826 13.5982 9.46769 13.8628L9.81669 13.9454C9.83828 14.1271 9.8494 14.3122 9.8494 14.5C9.8494 14.656 9.84173 14.8101 9.82675 14.962L9.36621 15.0797C8.27826 15.3576 7.63226 16.4765 7.93556 17.5576L8.09171 18.1143C7.83764 18.3096 7.56226 18.477 7.26985 18.6119L6.93249 18.2539C6.14355 17.4168 4.81279 17.4161 4.02297 18.2524L3.69797 18.5965C3.40025 18.4561 3.12051 18.2819 2.86333 18.0786L2.98967 17.6558C3.31901 16.5537 2.65302 15.4016 1.53358 15.1369L1.18403 15.0542C1.16247 14.8726 1.15137 14.6876 1.15137 14.5C1.15137 14.3439 1.15904 14.1898 1.17402 14.0378L1.63506 13.92C2.72301 13.6421 3.36901 12.5232 3.06572 11.4421ZM5.50039 15.5C6.05267 15.5 6.50039 15.0523 6.50039 14.5C6.50039 13.9477 6.05267 13.5 5.50039 13.5C4.9481 13.5 4.50039 13.9477 4.50039 14.5C4.50039 15.0523 4.9481 15.5 5.50039 15.5Z", filledD: "M2 6a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v6a3 3 0 0 1-2.01 2.83l.01-.33a5.5 5.5 0 0 0-9-4.24V6Zm14.04 7.78L14 12.37V5.63l2.04-1.4c.83-.58 1.96.01 1.96 1.02v7.5c0 1-1.13 1.6-1.96 1.03ZM2.9 10.88l.15.56a2 2 0 0 1-1.43 2.48l-.46.12a4.7 4.7 0 0 0 .01 1.01l.35.09A2 2 0 0 1 3 17.66l-.13.42c.26.2.54.38.84.52l.32-.35a2 2 0 0 1 2.91 0l.34.36c.29-.13.56-.3.82-.5l-.16-.55a2 2 0 0 1 1.43-2.48l.46-.12a4.7 4.7 0 0 0 0-1.01l-.36-.09a2 2 0 0 1-1.45-2.52l.12-.42c-.25-.2-.53-.38-.83-.52l-.32.35a2 2 0 0 1-2.91 0l-.34-.36c-.3.13-.57.3-.82.5ZM6.5 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z", fluent: "video_settings_20_regular / video_settings_20_filled" },
  peopleCommunity: { d: "M10 3C8.89543 3 8 3.89543 8 5C8 6.10457 8.89543 7 10 7C11.1046 7 12 6.10457 12 5C12 3.89543 11.1046 3 10 3ZM7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5ZM5.0528 9.99585C5.01946 10.1587 5.00195 10.3273 5.00195 10.5V11.0448L2.37096 11.7497C2.10423 11.8212 1.94594 12.0954 2.01741 12.3621L2.66446 14.7769C3.0613 16.2579 4.49965 17.1817 5.98034 16.9715C6.21006 17.2819 6.47486 17.5647 6.76887 17.8142C6.7124 17.832 6.65527 17.8487 6.59751 17.8642C4.46365 18.4359 2.2703 17.1696 1.69853 15.0357L1.05148 12.6209C0.837071 11.8207 1.31194 10.9982 2.11214 10.7838L5.0528 9.99585ZM15.002 11.0448V10.5C15.002 10.3273 14.9844 10.1587 14.9511 9.99585L17.8918 10.7838C18.692 10.9982 19.1668 11.8207 18.9524 12.6209L18.3054 15.0357C17.7336 17.1696 15.5403 18.4359 13.4064 17.8642C13.3486 17.8487 13.2915 17.832 13.235 17.8142C13.529 17.5647 13.7938 17.2819 14.0236 16.9715C15.5043 17.1817 16.9426 16.2579 17.3394 14.7769L17.9865 12.3621C18.058 12.0954 17.8997 11.8212 17.6329 11.7497L15.002 11.0448ZM15 6.5C15 5.67157 15.6716 5 16.5 5C17.3284 5 18 5.67157 18 6.5C18 7.32843 17.3284 8 16.5 8C15.6716 8 15 7.32843 15 6.5ZM16.5 4C15.1193 4 14 5.11929 14 6.5C14 7.88071 15.1193 9 16.5 9C17.8807 9 19 7.88071 19 6.5C19 5.11929 17.8807 4 16.5 4ZM3.5 5C2.67157 5 2 5.67157 2 6.5C2 7.32843 2.67157 8 3.5 8C4.32843 8 5 7.32843 5 6.5C5 5.67157 4.32843 5 3.5 5ZM1 6.5C1 5.11929 2.11929 4 3.5 4C4.88071 4 6 5.11929 6 6.5C6 7.88071 4.88071 9 3.5 9C2.11929 9 1 7.88071 1 6.5ZM7.5 9C6.67157 9 6 9.67157 6 10.5V14C6 16.2091 7.79086 18 10 18C12.2091 18 14 16.2091 14 14V10.5C14 9.67157 13.3284 9 12.5 9H7.5ZM7 10.5C7 10.2239 7.22386 10 7.5 10H12.5C12.7761 10 13 10.2239 13 10.5V14C13 15.6569 11.6569 17 10 17C8.34315 17 7 15.6569 7 14V10.5Z", filledD: "M10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-4.95 8c-.03.16-.05.33-.05.5V14c0 1.53.69 2.9 1.77 3.81l-.17.05a4 4 0 0 1-4.9-2.82l-.65-2.42a1.5 1.5 0 0 1 1.06-1.84L5.05 10Zm8.18 7.81A4.99 4.99 0 0 0 15 14v-3.5c0-.17-.02-.34-.05-.5l2.94.78a1.5 1.5 0 0 1 1.06 1.84l-.64 2.42a4 4 0 0 1-5.07 2.77ZM16.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm-13 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4 5C6.67 9 6 9.67 6 10.5V14a4 4 0 0 0 8 0v-3.5c0-.83-.67-1.5-1.5-1.5h-5Z", fluent: "people_community_20_regular / people_community_20_filled" },
  cubeTree: { d: "M8.65811 4.52651C8.39614 4.43919 8.11298 4.58077 8.02566 4.84274C7.93833 5.10471 8.07991 5.38787 8.34189 5.4752L9.5 5.86123V7.00073C9.5 7.27687 9.72386 7.50073 10 7.50073C10.2761 7.50073 10.5 7.27687 10.5 7.00073V5.86123L11.6581 5.4752C11.9201 5.38787 12.0617 5.10471 11.9743 4.84274C11.887 4.58077 11.6039 4.43919 11.3419 4.52651L10 4.97381L8.65811 4.52651ZM10.4273 2.06606C10.1485 1.98319 9.85153 1.98319 9.57267 2.06607L6.70796 2.91748C6.28798 3.04229 6 3.42832 6 3.86645V8.12782C6 8.57041 6.29094 8.96036 6.71521 9.08641L9.50719 9.9159C9.50246 9.94351 9.5 9.9719 9.5 10.0009V11.0009H8C6.89543 11.0009 6 11.8963 6 13.0009V13.0509C4.85888 13.2825 4 14.2914 4 15.5009C4 16.8816 5.11929 18.0009 6.5 18.0009C7.88071 18.0009 9 16.8816 9 15.5009C9 14.2914 8.14112 13.2825 7 13.0509V13.0009C7 12.4486 7.44772 12.0009 8 12.0009H12C12.5523 12.0009 13 12.4486 13 13.0009V13.0509C11.8589 13.2825 11 14.2914 11 15.5009C11 16.8816 12.1193 18.0009 13.5 18.0009C14.8807 18.0009 16 16.8816 16 15.5009C16 14.2914 15.1411 13.2825 14 13.0509V13.0009C14 11.8963 13.1046 11.0009 12 11.0009H10.5V10.0009C10.5 9.9719 10.4975 9.94351 10.4928 9.9159L13.2848 9.08641C13.7091 8.96036 14 8.57042 14 8.12782V3.87389C14 3.43133 13.7091 3.0414 13.2849 2.91532L10.4273 2.06606ZM9.85756 3.02463C9.95051 2.997 10.0495 2.997 10.1424 3.02463L13 3.87389V8.12782L10.1424 8.97681C10.0495 9.00442 9.95053 9.00442 9.8576 8.97681L7 8.12782V3.87391L9.85756 3.02463ZM5 15.5009C5 14.6724 5.67157 14.0009 6.5 14.0009C7.32843 14.0009 8 14.6724 8 15.5009C8 16.3293 7.32843 17.0009 6.5 17.0009C5.67157 17.0009 5 16.3293 5 15.5009ZM13.5 14.0009C14.3284 14.0009 15 14.6724 15 15.5009C15 16.3293 14.3284 17.0009 13.5 17.0009C12.6716 17.0009 12 16.3293 12 15.5009C12 14.6724 12.6716 14.0009 13.5 14.0009Z", fluent: "cube_tree_20_regular (design-system custom glyph)" },
  engine: { d: "M8 3C8 2.72386 7.77614 2.5 7.5 2.5C7.22386 2.5 7 2.72386 7 3V4H6C4.89543 4 4 4.89543 4 6V9H3V6.5C3 6.22386 2.77614 6 2.5 6C2.22386 6 2 6.22386 2 6.5V12.5C2 12.7761 2.22386 13 2.5 13C2.77614 13 3 12.7761 3 12.5V10H4V12.8787C4 13.4091 4.21071 13.9178 4.58579 14.2929L7 16.7071C7.18754 16.8946 7.44189 17 7.70711 17H13.191C13.5698 17 13.916 16.786 14.0854 16.4472L14.809 15H16C17.1046 15 18 14.1046 18 13V8C18 6.89543 17.1046 6 16 6H14.809L14.0854 4.55279C13.916 4.214 13.5698 4 13.191 4H11V3C11 2.72386 10.7761 2.5 10.5 2.5C10.2239 2.5 10 2.72386 10 3V4H8V3ZM6 5H13.191L13.9146 6.44721C14.084 6.786 14.4302 7 14.809 7H16C16.5523 7 17 7.44772 17 8V13C17 13.5523 16.5523 14 16 14H14.809C14.4302 14 14.084 14.214 13.9146 14.5528L13.191 16H7.70711L5.29289 13.5858C5.10536 13.3983 5 13.1439 5 12.8787V6C5 5.44772 5.44772 5 6 5ZM7.5 7C7.77614 7 8 7.22386 8 7.5V10C8 10.5523 8.44772 11 9 11H10V7.5C10 7.22386 10.2239 7 10.5 7C10.7761 7 11 7.22386 11 7.5V11H14.5C14.7761 11 15 11.2239 15 11.5C15 11.7761 14.7761 12 14.5 12H9C7.89543 12 7 11.1046 7 10V7.5C7 7.22386 7.22386 7 7.5 7Z", filledD: "M7.5 2.5c.28 0 .5.22.5.5v1h2V3a.5.5 0 0 1 1 0v1h2.2a1 1 0 0 1 .89.55L14.8 6H16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.2l-.71 1.45a1 1 0 0 1-.9.55H7.71a1 1 0 0 1-.71-.3l-2.41-2.4A2 2 0 0 1 4 12.87V10H3v2.5a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 1 0V9h1V6c0-1.1.9-2 2-2h1V3c0-.28.22-.5.5-.5Zm0 4.5a.5.5 0 0 0-.5.5V10c0 1.1.9 2 2 2h5.5a.5.5 0 0 0 0-1H11V7.5a.5.5 0 0 0-1 0V11H9a1 1 0 0 1-1-1V7.5a.5.5 0 0 0-.5-.5Z", fluent: "engine_20_regular / engine_20_filled" },
  syncOff: { d: "M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10ZM10 3C6.47353 3 3.55612 5.60771 3.07089 9H8.26566L9.01926 6.36241C9.09512 6.09689 9.37186 5.94315 9.63738 6.01901C9.9029 6.09487 10.0566 6.37161 9.98078 6.63713L7.98078 13.6371C7.90492 13.9026 7.62818 14.0564 7.36266 13.9805C7.09714 13.9047 6.9434 13.6279 7.01926 13.3624L7.97995 10H3C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10H12.0199L10.9807 13.6371C10.9049 13.9027 10.6281 14.0564 10.3626 13.9805C10.0971 13.9047 9.94334 13.6279 10.0192 13.3624L12.0193 6.36241C12.0951 6.09689 12.3719 5.94315 12.6374 6.01901C12.9029 6.09487 13.0566 6.37162 12.9808 6.63713L12.3057 9H16.9291C16.4439 5.60771 13.5265 3 10 3Z", filledD: "M9.89 3.75a6.24 6.24 0 0 0-3.12.9L5.68 3.56a7.73 7.73 0 0 1 3.67-1.28l-.59-.59A.75.75 0 0 1 9.82.63l2.12 2.12c.3.3.3.77 0 1.06L9.82 5.93a.75.75 0 0 1-1.06-1.06L9.9 3.75ZM4.18 4.88a7.75 7.75 0 0 0 1.18 11.33.75.75 0 1 0 .9-1.2 6.25 6.25 0 0 1-1.02-9.06l8.81 8.8a6.23 6.23 0 0 1-3.94 1.5l1.13-1.12a.75.75 0 0 0-1.06-1.07L8.06 16.2c-.3.29-.3.76 0 1.06l2.12 2.12a.75.75 0 1 0 1.06-1.06l-.59-.59a7.72 7.72 0 0 0 4.47-1.9l2.03 2.03a.5.5 0 0 0 .7-.7l-15-15a.5.5 0 1 0-.7.7l2.03 2.03Zm11.17 8.35 1.09 1.09a7.75 7.75 0 0 0-1.8-10.53.75.75 0 0 0-.9 1.2 6.25 6.25 0 0 1 1.6 8.24Z", fluent: "arrow_sync_off_20_regular / arrow_sync_off_20_filled" },
  calendarClock: { d: "M17 5.5C17 4.11929 15.8807 3 14.5 3H5.5C4.11929 3 3 4.11929 3 5.5V14.5C3 15.8807 4.11929 17 5.5 17H9.59971C9.43777 16.6832 9.30564 16.3486 9.20703 16H5.5C4.67157 16 4 15.3284 4 14.5V7H16V9.20703C16.3486 9.30564 16.6832 9.43777 17 9.59971V5.5ZM5.5 4H14.5C15.3284 4 16 4.67157 16 5.5V6H4V5.5C4 4.67157 4.67157 4 5.5 4ZM14.5 19C16.9853 19 19 16.9853 19 14.5C19 12.0147 16.9853 10 14.5 10C12.0147 10 10 12.0147 10 14.5C10 16.9853 12.0147 19 14.5 19ZM14 12.5C14 12.2239 14.2239 12 14.5 12C14.7761 12 15 12.2239 15 12.5V14H16C16.2761 14 16.5 14.2239 16.5 14.5C16.5 14.7761 16.2761 15 16 15H14.5C14.2239 15 14 14.7761 14 14.5V12.5Z", fluent: "calendar_clock_20_regular" },
  calendarMonth: { d: "M14.5 3C15.8807 3 17 4.11929 17 5.5V14.5C17 15.8807 15.8807 17 14.5 17H5.5C4.11929 17 3 15.8807 3 14.5V5.5C3 4.11929 4.11929 3 5.5 3H14.5ZM14.5 4H5.5C4.67157 4 4 4.67157 4 5.5V14.5C4 15.3284 4.67157 16 5.5 16H14.5C15.3284 16 16 15.3284 16 14.5V5.5C16 4.67157 15.3284 4 14.5 4ZM7 11C7.55228 11 8 11.4477 8 12C8 12.5523 7.55228 13 7 13C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11ZM10 11C10.5523 11 11 11.4477 11 12C11 12.5523 10.5523 13 10 13C9.44772 13 9 12.5523 9 12C9 11.4477 9.44772 11 10 11ZM7 7C7.55228 7 8 7.44772 8 8C8 8.55228 7.55228 9 7 9C6.44772 9 6 8.55228 6 8C6 7.44772 6.44772 7 7 7ZM10 7C10.5523 7 11 7.44772 11 8C11 8.55228 10.5523 9 10 9C9.44772 9 9 8.55228 9 8C9 7.44772 9.44772 7 10 7ZM13 7C13.5523 7 14 7.44772 14 8C14 8.55228 13.5523 9 13 9C12.4477 9 12 8.55228 12 8C12 7.44772 12.4477 7 13 7Z", filledD: "M14.5 3A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5v-9A2.5 2.5 0 0 1 5.5 3h9ZM7 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z", fluent: "calendar_month_20_regular / calendar_month_20_filled" },
  contentView: { d: "M5 7C5 6.44772 5.44772 6 6 6H14C14.5523 6 15 6.44771 15 7V9C15 9.55228 14.5523 10 14 10H6C5.44772 10 5 9.55229 5 9V7ZM14 7H6V9H14V7ZM12 11C11.4477 11 11 11.4477 11 12V13C11 13.5523 11.4477 14 12 14H14C14.5523 14 15 13.5523 15 13V12C15 11.4477 14.5523 11 14 11H12ZM12 12H14V13H12V12ZM5 11.5C5 11.2239 5.22386 11 5.5 11H9.5C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12H5.5C5.22386 12 5 11.7761 5 11.5ZM5.5 13C5.22386 13 5 13.2239 5 13.5C5 13.7761 5.22386 14 5.5 14H9.5C9.77614 14 10 13.7761 10 13.5C10 13.2239 9.77614 13 9.5 13H5.5ZM3 6C3 4.34315 4.34315 3 6 3H14C15.6569 3 17 4.34315 17 6V14C17 15.6569 15.6569 17 14 17H6C4.34315 17 3 15.6569 3 14V6ZM6 4C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H14C15.1046 16 16 15.1046 16 14V6C16 4.89543 15.1046 4 14 4H6Z", filledD: "M14 7H6v2h8V7Zm-2 5h2v1h-2v-1ZM6 3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6ZM5 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7Zm7 4h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Zm-7 .5c0-.28.22-.5.5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Zm.5 1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1Z", fluent: "content_view_20_regular / content_view_20_filled" },
} as const

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
      { label: "(b) Drop the filled toggle entirely", detail: "Signal hover / active / browsing with color or opacity changes only \u2014 no fill change." },
      { label: "(c) Extend the icon pipeline to support `filled` natively \u2014 CHOSEN", detail: "Generated Fluent icons accept `filled?: boolean`. Actionable icons use filled variants for hover and selected states; non-interactive icon uses stay regular." },
    ],
    resolution: {
      chosenLabel: "(c) Filled variants for actionable hover/selected states",
      note: "New system-wide rule: actionable Fluent icons render regular at rest and filled on hover/selected/active states. Non-interactive icon usage remains regular. The icon generator now exposes `filled?: boolean`; components opt in only for actionable states.",
    },
    visual: {
      kind: "icon",
      beforeLabel: "Origin: regular \u2192 filled swap on hover/active",
      beforeSvgPath: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z",
      afterIconName: "MoreHorizontalIcon",
      afterLabel: "bidezine: regular -> filled for actionable states",
      afterNote: "Generated icons support filled?: boolean; non-interactive icons remain regular.",
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
      note: "All 10 candidate tokens (the original 9 \u2014 matching bidezine's own achromatic lightness stops, plus 5 later refined against the user's own hex picks for hover/pressed/active/border-strong/foreground-disabled \u2014 plus a 10th, select-hover, for hovering an already-selected row) now have FINAL sign-off \u2014 see the \u201cColor token lab\u201d tab and the composed mock rail (RailPreview). All 10 are ready to be authored into tokens/base.tokens.json at Build time.",
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
  /** Origin's own value, verbatim, from design-system/src/tokens.ts. Reference only — not a bidezine color.
   * Leave both hex fields as "" when `noOriginEquivalent` is true — this is a state the origin project
   * never modeled at all, not an unset/forgotten value. */
  originLightHex: string
  originDarkHex: string
  /** True when the origin project has no concept of this state whatsoever (confirmed by reading its
   * source/docs, not assumed) — e.g. a state inspired by one of bidezine's OWN existing component
   * conventions rather than ported from the origin at all. ColorTokenLab renders an explicit
   * "no origin equivalent" placeholder instead of a fabricated swatch. */
  noOriginEquivalent?: boolean
  /** Candidate value if we approve this token: reuses one of bidezine's EXISTING achromatic
   * lightness stops (the exact oklch() values already defined in src/styles/tokens.css for
   * --background/--sidebar/--secondary/--accent/--ring/--muted-foreground/--primary/--foreground),
   * rather than inventing a new number. This is what "strategic, matches bidezine's color balance"
   * means in practice: the rail's ramp lines up 1:1 with a ramp bidezine already uses elsewhere. */
  proposedLight: string
  proposedDark: string
  /** false = still awaiting your decision (default true, since the first 9 all have final sign-off).
   * Kept per-token rather than assumed, so a newly-added candidate never silently inherits "approved". */
  approved?: boolean
  /** Extra context shown only for not-yet-approved candidates — why it's proposed, what it's based on. */
  proposalNote?: string
}

export const proposedDarkRailTokens: ProposedToken[] = [
  {
    originName: "darkSurface",
    proposedVar: "--sidebar-rail-surface",
    usage: "Rail background",
    originLightHex: "#1c2024",
    originDarkHex: "#111113",
    // REVISED, pending re-approval — the originally-approved dark-app-mode value, oklch(0.145 0 0),
    // is EXACTLY identical to bidezine's own dark-theme --background (also oklch(0.145 0 0) in
    // tokens.css) — confirmed via getComputedStyle: the rail's real rendered background and the
    // page's own body background resolved to the literal same color. The rail visually disappeared
    // into the page in dark app mode.
    // The safe range for a new value is narrow and hard-bounded on both sides: it must stay ABOVE
    // 0.145 (else it's not distinct from --background) and — just as important — BELOW darkHoverBg's
    // already-approved oklch(0.191 0 0), or the rail's rest state would already read as "hovered"
    // with nowhere left for a real hover to escalate to. That rules out simply reusing bidezine's own
    // --card/--sidebar dark-theme value (oklch(0.205 0 0)) directly, tempting as that reuse would be
    // — 0.205 sits ABOVE darkHoverBg and would invert the hover/rest relationship entirely. No
    // existing bidezine achromatic stop falls inside the open (0.145, 0.191) window, so — same as
    // darkHoverBg/darkPressedBg/darkActiveBg/darkActiveHoverBg before it — this is a genuinely new
    // number on the same ramp, not a reused one.
    // Proposed: oklch(0.18 0 0) — sits meaningfully above the page background (delta 0.035) while
    // staying safely below hover (delta 0.011), the best available separation from --background
    // without inverting the hover escalation or touching hover/pressed/active's own already-approved
    // values.
    proposalNote:
      "Proposed revision: oklch(0.18 0 0) for dark app mode only (light app mode's oklch(0.205 0 0) " +
      "is untouched — no collision there against a white --background). Fixes the rail-matches-page-" +
      "background problem while staying below darkHoverBg so hover still reads as an increase.",
    proposedLight: "oklch(0.205 0 0)",
    proposedDark: "oklch(0.18 0 0)",
    approved: false,
  },
  { originName: "darkHoverBg", proposedVar: "--sidebar-rail-hover", usage: "Row hover overlay", originLightHex: "rgba(255,255,255,0.10)", originDarkHex: "#212225", proposedLight: "oklch(0.301 0 0)", proposedDark: "oklch(0.191 0 0)" },
  { originName: "darkPressedBg", proposedVar: "--sidebar-rail-pressed", usage: "Row pressed overlay", originLightHex: "rgba(255,255,255,0.15)", originDarkHex: "#2e3135", proposedLight: "oklch(0.348 0 0)", proposedDark: "oklch(0.222 0 0)" },
  { originName: "darkActiveBg", proposedVar: "--sidebar-rail-active", usage: "Row active/selected overlay", originLightHex: "rgba(255,255,255,0.20)", originDarkHex: "#272a2d", proposedLight: "oklch(0.39 0 0)", proposedDark: "oklch(0.252 0 0)" },
  {
    originName: "darkBorderStrong",
    proposedVar: "--sidebar-rail-border-strong",
    usage: "Visible border on the dark rail",
    originLightHex: "rgba(255,255,255,0.6)",
    originDarkHex: "#5a6169",
    // REVISED, pending re-approval — the originally-approved oklch(0.256)/oklch(0.254) sat almost
    // right on top of the rail surface itself (darkSurface: oklch(0.205) light-app-mode /
    // oklch(0.145) dark-app-mode) — a lightness delta of only ~0.05 in light-app-mode and ~0.11 in
    // dark-app-mode, confirmed via getComputedStyle in the browser: the "browsing" ring was
    // functionally invisible. Origin's own value (rgba(255,255,255,0.6) light-app-mode) composites
    // to a considerably brighter ring than what got approved here, so the original candidate
    // undersold origin's own intent, not just bidezine's.
    // Proposed fix reuses an EXISTING bidezine achromatic stop rather than inventing a new number
    // (same sourcing rule as every other candidate here): oklch(0.708 0 0) is already the exact
    // value approved for onDarkSubtle (this same rail-token family) AND matches the base theme's
    // own --ring (light) / --muted-foreground (dark) tokens in tokens.css — i.e. literally the
    // system's existing "make this visible against its surface" semantic. A single shared value
    // for both app light/dark modes (not two separate proposedLight/proposedDark numbers) matches
    // how onDark/onDarkHover/onDarkSubtle already work, since the ring's own visibility need doesn't
    // change with the app's theme the way the rail's fill colors do.
    // Bolder alternative, if this doesn't feel strong enough: oklch(0.922 0 0), reusing the already-
    // approved onDarkHover value (also matches tokens.css's own light-theme --border / dark-theme
    // --primary) — closer to origin's own apparently-bright original intent.
    proposalNote:
      "Proposed revision: oklch(0.708 0 0) for both app modes (reuses the already-approved " +
      "onDarkSubtle value / the base theme's own --ring token) — visibly stronger against the rail " +
      "surface than the original candidate. Bolder alternative if preferred: oklch(0.922 0 0) " +
      "(reuses onDarkHover / the base theme's --border light-mode value).",
    proposedLight: "oklch(0.708 0 0)",
    proposedDark: "oklch(0.708 0 0)",
    approved: false,
  },
  {
    originName: "darkDividerSubtle",
    proposedVar: "--sidebar-rail-divider",
    usage: "Subtle horizontal divider between the rail's logo/nav/footer groups",
    originLightHex: "",
    originDarkHex: "",
    noOriginEquivalent: true,
    // Confirmed against design-system/src/gallery/RailNav.tsx: origin's rail has NO divider line at
    // all between its logo/nav/footer groups — it separates them purely with flex `gap: SPACE[4]`
    // (16px), no visible border. FunctionalRailSidebar.tsx added a divider line as its own bidezine-
    // side choice, but it incorrectly reused `darkBorderStrong`/colors.border for it — the SAME token
    // also used for the "browsing" ring. That was fine as long as darkBorderStrong stayed dim, but
    // once M-13/B-5 raised darkBorderStrong to oklch(0.708) so the ring would actually be visible,
    // the divider (which was never meant to be bold) became too visible too, since it was really two
    // different visual roles sharing one token.
    // Fix: give the divider its own dedicated token, reusing the EXACT numeric value darkBorderStrong
    // used to have (oklch(0.256)/oklch(0.254)) before that revision — that value was already reviewed
    // and was always visually correct for a subtle divider, it was only ever wrong as a ring color.
    // No new number is being introduced or re-decided here, just correctly separating one shared
    // token back into the two distinct roles it was always serving.
    proposalNote:
      "Reuses darkBorderStrong's original, already-reviewed value (oklch(0.256)/oklch(0.254)), now " +
      "under its own name so raising the ring's brightness (M-13) doesn't also brighten this divider.",
    proposedLight: "oklch(0.256 0 0)",
    proposedDark: "oklch(0.254 0 0)",
    approved: true,
  },
  { originName: "onDark", proposedVar: "--sidebar-rail-foreground", usage: "Full-strength text/icon on dark rail", originLightHex: "#ffffff", originDarkHex: "#ffffff", proposedLight: "oklch(0.985 0 0)", proposedDark: "oklch(0.985 0 0)" },
  { originName: "onDarkHover", proposedVar: "--sidebar-rail-foreground-hover", usage: "\u224885% on-dark, hover state", originLightHex: "rgba(255,255,255,0.85)", originDarkHex: "#edeef0", proposedLight: "oklch(0.922 0 0)", proposedDark: "oklch(0.922 0 0)" },
  { originName: "onDarkSubtle", proposedVar: "--sidebar-rail-foreground-subtle", usage: "\u224850% on-dark, subordinate text", originLightHex: "rgba(255,255,255,0.5)", originDarkHex: "#696e77", proposedLight: "oklch(0.708 0 0)", proposedDark: "oklch(0.708 0 0)" },
  { originName: "onDarkDisabled", proposedVar: "--sidebar-rail-foreground-disabled", usage: "\u224820% on-dark, disabled", originLightHex: "rgba(255,255,255,0.2)", originDarkHex: "#3e4348", proposedLight: "oklch(0.42 0 0)", proposedDark: "oklch(0.375 0 0)" },
  {
    originName: "darkActiveHoverBg",
    proposedVar: "--sidebar-rail-active-hover",
    usage: "Select-hover overlay — the ALREADY-selected row, additionally hovered",
    originLightHex: "",
    originDarkHex: "",
    noOriginEquivalent: true,
    // Confirmed against limbo/rail-sidebar/reference/docs: the origin's dark rail (MenuItemDark)
    // differentiates hover vs. selected (darkHoverBg vs. darkActiveBg), but never modeled a THIRD
    // tone for "selected AND hovered" — hovering an already-selected row is currently a no-op there.
    // This candidate is inspired by a pattern our OWN design system already uses elsewhere for this
    // exact situation: src/ui/navigation-menu.tsx's `data-[active=true]:hover:bg-accent` gives the
    // active/selected item a distinct, brighter tone specifically when it's also hovered — proving
    // "selected + hover" is already a recognized third state in bidezine, just not yet given a rail
    // token. Value continues the same solid lightness ramp already approved for hover→pressed→active
    // (Light: 0.301→0.348→0.39, step ≈0.04; Dark: 0.191→0.222→0.252, step ≈0.03) one further step:
    // Light 0.43 (#505050), Dark 0.282 (#292929) — not an arbitrary guess, the next rung on the same
    // ladder. Toggle light/dark and hover the already-selected "Projects" row in RailPreview's
    // bidezine side to see it live; the origin side intentionally shows no change on the same hover,
    // matching its real, undifferentiated behavior.
    proposalNote:
      "Approved — extends the already-approved hover→pressed→active ramp one more step, inspired by " +
      "navigation-menu.tsx's own data-[active=true]:hover:bg-accent precedent.",
    proposedLight: "oklch(0.43 0 0)",
    proposedDark: "oklch(0.282 0 0)",
    approved: true,
  },
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
  afterHexLight?: string
  afterHexDark?: string
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
      { id: "A-1", what: "IconEllipsis (\u201cMore\u201d trigger + panel-header ellipsis)", status: "resolved", detail: "Resolved by the new Q1 ruling: MoreHorizontalIcon remains regular at rest and uses its Fluent filled variant for actionable hover/selected/active states. Non-interactive ellipsis usage stays regular.", visual: { kind: "icon", beforeLabel: "IconEllipsis (regular)", beforeSvgPath: "M4 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z", afterIconName: "MoreHorizontalIcon", afterLabel: "MoreHorizontalIcon regular + filled" } },
      { id: "A-2", what: "IconChevronDown (disclosure chevron)", status: "clean", detail: "ChevronDownIcon exists \u2014 same Fluent slug (chevron_down_20_regular), exact match. Icon-sizing rule (see A-6 for the same explanation): bidezine sources every icon from Fluent's 20px-regular grid (100% of icons/manifest.json uses the _20_regular slug \u2014 that's fixed), but the ON-SCREEN render size is controlled per component via Tailwind size-* classes (e.g. buttons default unstyled icons to size-4/16px), not a fixed 20px display rule. So origin's size={16} in a 20px slot isn't a divergence \u2014 it's the same sourcing grid, just a smaller render size, which our components already support.", visual: { kind: "icon", beforeLabel: "IconChevronDown (regular, 16px in a 20px slot)", beforeSvgPath: "M4.7 7.7a1 1 0 0 1 1.4 0L10 11.6l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L4.7 9.1a1 1 0 0 1 0-1.4Z", afterIconName: "ChevronDownIcon", afterLabel: "ChevronDownIcon (same Fluent slug, 20px)" } },
      { id: "A-3", what: "IconLogo (default logo slot)", status: "resolved", detail: "Not in our manifest \u2014 resolved by Q3: AI never picks a logo, the user always supplies the image link; for Rail Sidebar specifically, use the real bidezine mark (sourced from the origin project) as an inline SVG so it tracks the theme toggle. Requirement captured: the logo's default state uses the same brighter foreground token used by the hover state; hover may change the button background, but not the logo color. See the Logo import slot on the Blocking questions tab.", visual: { kind: "icon", beforeLabel: "IconLogo (origin bidezine mark)", beforeSvgPath: "M 15.099 2.069 C 21.154 2.069 26.063 6.979 26.063 13.034 C 26.063 19.09 21.154 23.999 15.099 23.999 L 14.087 23.999 C 14.082 23.999 14.076 24 14.07 24 L 9.306 24 C 8.77 24 8.297 23.65 8.141 23.139 L 4.984 12.835 C 4.744 12.052 5.33 11.26 6.149 11.26 L 10.998 11.26 C 11.537 11.26 12.012 11.614 12.166 12.13 L 13.499 16.602 L 15.103 16.602 C 17.073 16.602 18.671 15.004 18.671 13.033 C 18.671 11.063 17.073 9.465 15.103 9.465 C 14.349 9.465 13.685 8.97 13.47 8.248 L 11.985 3.262 C 11.825 2.723 12.182 2.069 12.744 2.069 L 15.099 2.069 Z M 8.441 0 C 8.982 -0.002 9.459 0.352 9.613 0.87 L 10.084 2.446 C 10.201 2.838 10.013 3.256 9.644 3.431 L 9.12 3.678 L 9.12 3.68 L 9.119 3.681 L 8.805 3.832 C 8.366 4.043 8.452 4.692 8.931 4.781 L 10.311 5.038 C 10.666 5.104 10.954 5.363 11.058 5.709 L 11.779 8.129 C 12.012 8.91 11.428 9.695 10.612 9.695 L 3.429 9.695 C 2.893 9.695 2.42 9.345 2.264 8.833 L 0.055 1.602 C -0.184 0.82 0.398 0.029 1.215 0.026 L 8.441 0 Z", afterLabel: "Same mark, inline SVG; default uses hover foreground token" } },
      { id: "A-4", what: "IconCheckmark (checked-row indicator)", status: "clean", detail: "CheckIcon exists in our manifest, used without the filled toggle here.", visual: { kind: "icon", beforeLabel: "IconCheckmark (regular)", beforeSvgPath: "M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z", afterIconName: "CheckIcon", afterLabel: "CheckIcon \u2014 exact match" } },
      { id: "A-5", what: "IconSearch (search bar lead icon)", status: "clean", detail: "SearchIcon exists; API differs slightly (size/color props vs our className-only API) but no new icon needed.", visual: { kind: "icon", beforeLabel: "IconSearch (regular)", beforeSvgPath: "M9 3a6 6 0 1 0 3.76 10.66l3.79 3.79a1 1 0 0 0 1.41-1.41l-3.79-3.79A6 6 0 0 0 9 3Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z", afterIconName: "SearchIcon", afterLabel: "SearchIcon \u2014 exact match" } },
      { id: "A-6", what: "IconDismiss (search ClearButton)", status: "note", detail: "XIcon exists (dismiss_20_regular \u2014 exact Fluent match, same sizing-rule reasoning as A-2, no sizing divergence). What's genuinely still open is how ClearButton itself gets rebuilt (see L-5) \u2014 that's a component-structure decision, not an icon decision.", visual: { kind: "icon", beforeLabel: "IconDismiss (regular)", beforeSvgPath: "M4.4 4.4a1 1 0 0 1 1.4 0L10 8.6l4.2-4.2a1 1 0 1 1 1.4 1.4L11.4 10l4.2 4.2a1 1 0 0 1-1.4 1.4L10 11.4l-4.2 4.2a1 1 0 0 1-1.4-1.4L8.6 10 4.4 5.8a1 1 0 0 1 0-1.4Z", afterIconName: "XIcon", afterLabel: "XIcon (dismiss_20_regular) \u2014 exact match" } },
      { id: "A-7", what: "IconPanelLeftContract (panel collapse button) \u2014 corrected, was misidentified as IconChevronDoubleLeft", status: "resolved", detail: "Not in our manifest yet, but a verified 1:1 Fluent match exists (panel_left_contract_20_regular) \u2014 resolved by Q4. Just a manifest addition needed at Build time, no further decision required." },
      { id: "A-8", what: "Consumer-supplied section icons", status: "resolved", detail: "Resolved by Q1: actionable consumer-supplied Fluent icons should expose regular and filled variants; rail/panel actions pass filled for hover/selected/active states, while non-interactive displays remain regular." },
      { id: "A-9", what: "The `filled` prop system itself", status: "resolved", detail: "Resolved by Q1: the design-system icon generator now supports `filled?: boolean` for Fluent icons. Filled rendering is a state decision made by actionable components, not the default for static/non-interactive icon display." },
    ],
  },
  {
    id: "B",
    name: "Colors \u2014 Dark Rail Surface",
    rows: [
      { id: "B-1", what: "darkSurface (rail background)", status: "decision", detail: "Q2 approved authoring a dedicated dark-rail surface token, but the dark-app-mode value approved at that time (oklch(0.145 0 0)) turned out to be EXACTLY identical to bidezine's own dark-theme --background (also oklch(0.145 0 0)) \u2014 confirmed via getComputedStyle: the rail's real rendered background and the page's own body background resolved to the literal same color, so the rail visually disappeared into the page in dark app mode. A revised candidate (oklch(0.18 0 0), a new value \u2014 no existing bidezine stop falls between --background's 0.145 and darkHoverBg's already-approved 0.191) is now live in the preview build, pending your sign-off \u2014 see the Color token lab tab and M-15.", visual: { kind: "color", beforeLabel: "darkSurface (origin)", beforeHexLight: "#1c2024", beforeHexDark: "#111113", afterVar: "--sidebar-rail-surface", afterLabel: "revised candidate, pending sign-off" } },
      { id: "B-2", what: "darkHoverBg (hover overlay)", status: "resolved", detail: "Resolved by Q2: add this state to the dedicated dark-rail token family. Implemented and interactively verified in the limbo-factory preview build (see M-12): RailIconButton and the overflow trigger button now track real hover state and apply this token via inline style, since it was initially approved but never actually wired up.", visual: { kind: "color", beforeLabel: "darkHoverBg (origin)", beforeHexLight: "rgba(255,255,255,0.10)", beforeHexDark: "#212225", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
      { id: "B-3", what: "darkActiveBg (active/selected overlay)", status: "resolved", detail: "Resolved by Q2: add this state to the dedicated dark-rail token family; Build still needs to author it.", visual: { kind: "color", beforeLabel: "darkActiveBg (origin)", beforeHexLight: "rgba(255,255,255,0.20)", beforeHexDark: "#272a2d", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
      { id: "B-4", what: "darkPressedBg (pressed overlay)", status: "resolved", detail: "Resolved by Q2: add this state to the dedicated dark-rail token family. Implemented and interactively verified in the limbo-factory preview build (see M-12): RailIconButton now tracks real pressed (mousedown/mouseup) state and applies this token via inline style, since it was initially approved but never actually wired up.", visual: { kind: "color", beforeLabel: "darkPressedBg (origin)", beforeHexLight: "rgba(255,255,255,0.15)", beforeHexDark: "#2e3135", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
      { id: "B-5", what: "darkBorderStrong (visible border on dark surface)", status: "decision", detail: "Q2 approved authoring a dedicated dark-rail border token, but the specific candidate value approved at that time (oklch(0.256)/oklch(0.254)) turned out to have almost no contrast against the rail surface itself (oklch(0.205)/oklch(0.145) \u2014 a delta of only ~0.05/0.11) once actually built and exercised (the \u201cbrowsing\u201d ring around a rail button was effectively invisible, confirmed via getComputedStyle). A revised candidate (oklch(0.708), reusing the already-approved onDarkSubtle value) is now live in the preview build, pending your sign-off \u2014 see the Color token lab tab and M-13.", visual: { kind: "color", beforeLabel: "darkBorderStrong (origin)", beforeHexLight: "rgba(255,255,255,0.6)", beforeHexDark: "#5a6169", afterVar: "--sidebar-rail-border-strong", afterLabel: "revised candidate, pending sign-off" } },
      { id: "B-6", what: "onDark (on-dark text/icon, full strength)", status: "resolved", detail: "Resolved by Q2: add a dedicated on-dark foreground token; Build still needs to author it.", visual: { kind: "color", beforeLabel: "onDark (origin, always white)", beforeHexLight: "#ffffff", beforeHexDark: "#ffffff", afterVar: "--sidebar-rail-foreground", afterLabel: "approved new token" } },
      { id: "B-7", what: "onDarkHover (\u224885% opacity on-dark)", status: "resolved", detail: "Resolved by Q2: add this foreground state to the dedicated dark-rail token family; Build still needs to author it.", visual: { kind: "color", beforeLabel: "onDarkHover (origin)", beforeHexLight: "rgba(255,255,255,0.85)", beforeHexDark: "#edeef0", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
      { id: "B-8", what: "onDarkSubtle (\u224850\u201360% opacity on-dark)", status: "resolved", detail: "Resolved by Q2: add this foreground state to the dedicated dark-rail token family; Build still needs to author it.", visual: { kind: "color", beforeLabel: "onDarkSubtle (origin)", beforeHexLight: "rgba(255,255,255,0.5)", beforeHexDark: "#696e77", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
      { id: "B-9", what: "onDarkDisabled", status: "resolved", detail: "Resolved by Q2: add this foreground state to the dedicated dark-rail token family; Build still needs to author it.", visual: { kind: "color", beforeLabel: "onDarkDisabled (origin)", beforeHexLight: "rgba(255,255,255,0.2)", beforeHexDark: "#3e4348", afterNote: "Resolved by Q2 and the approved Color token lab candidate." } },
    ],
  },
  {
    id: "C",
    name: "Colors \u2014 Light Panel Surface",
    rows: [
      { id: "C-1", what: "surface (panel background)", status: "resolved", detail: "Approved: use --card for the panel surface.", visual: { kind: "color", beforeLabel: "surface (origin)", beforeHexLight: "#ffffff", beforeHexDark: "#272a2d", afterVar: "--card", afterLabel: "approved: --card" } },
      { id: "C-2", what: "ink (full-strength text on light)", status: "resolved", detail: "Approved: maps directly to --foreground.", visual: { kind: "color", beforeLabel: "ink (origin)", beforeHexLight: "#1c2024", beforeHexDark: "#edeef0", afterVar: "--foreground", afterLabel: "approved: --foreground" } },
      { id: "C-3", what: "textMuted (\u224860% subordinate text)", status: "resolved", detail: "Approved: maps directly to --muted-foreground.", visual: { kind: "color", beforeLabel: "textMuted (origin)", beforeHexLight: "#60646c", beforeHexDark: "#b0b4ba", afterVar: "--muted-foreground", afterLabel: "approved: --muted-foreground" } },
      { id: "C-4", what: "textSubtle (\u224840% faint text)", status: "resolved", detail: "Approved: use the proposed --muted-foreground mapping.", visual: { kind: "color", beforeLabel: "textSubtle (origin)", beforeHexLight: "#8b8d98", beforeHexDark: "#696e77", afterVar: "--muted-foreground", afterLabel: "approved: --muted-foreground" } },
      { id: "C-5", what: "textDisabled (\u224830% very faint)", status: "resolved", detail: "Approved as explicit light/dark values for this disabled text state: light #B9B9B9, dark #585858.", visual: { kind: "color", beforeLabel: "textDisabled (origin)", beforeHexLight: "#b9bbc6", beforeHexDark: "#5a6169", afterHexLight: "#B9B9B9", afterHexDark: "#585858", afterLabel: "approved: #B9B9B9 / #585858" } },
      { id: "C-6", what: "hoverBg (panel row hover)", status: "decision", detail: "Proposal awaiting approval: use the design system's standard background hover color, --accent, with no custom variation.", visual: { kind: "color", beforeLabel: "hoverBg (origin)", beforeHexLight: "#f0f0f3", beforeHexDark: "#2e3135", afterVar: "--accent", afterLabel: "proposal: --accent", afterNote: "Current token values: light oklch(0.97 0 0), dark oklch(0.371 0 0)." } },
      { id: "C-7", what: "bgSubtle (checked menu rows)", status: "decision", detail: "Needs clarification: used for checked menu rows / subtle checked-state backgrounds in the panel. Not part of the approved dark-rail Color Token Lab.", visual: { kind: "color", beforeLabel: "bgSubtle (origin)", beforeHexLight: "#f9f9fb", beforeHexDark: "#212225", afterVar: "--muted", afterLabel: "candidate: --muted", afterNote: "Candidate only; awaiting confirmation." } },
      { id: "C-8", what: "activeBg (pressed panel-header menu rows)", status: "decision", detail: "Needs clarification: used for pressed/active rows in panel-header menus, not the main rail color lab. Candidate is --accent but it overlaps C-6.", visual: { kind: "color", beforeLabel: "activeBg (origin)", beforeHexLight: "#e8e8ec", beforeHexDark: "#2e3135", afterVar: "--accent", afterLabel: "candidate: --accent", afterNote: "Candidate only; awaiting confirmation." } },
      { id: "C-9", what: "pressedOverlay (ellipsis trigger pressed state)", status: "decision", detail: "Proposal awaiting approval: add/use a dedicated pressed overlay value for this trigger state.", visual: { kind: "color", beforeLabel: "pressedOverlay (origin)", beforeHexLight: "#e0e1e6", beforeHexDark: "#363a3f", afterHexLight: "#E0E1E6", afterHexDark: "#363A3F", afterLabel: "proposal: #E0E1E6 / #363A3F" } },
      { id: "C-10", what: "focusOverlay (keyboard-focus fill)", status: "resolved", detail: "Approved: use --ring as the focus-color source while preserving the correct focus mechanism during Build.", visual: { kind: "color", beforeLabel: "focusOverlay (origin, a FILL)", beforeHexLight: "#f0f0f3", beforeHexDark: "#363a3f", afterVar: "--ring", afterLabel: "approved: --ring" } },
      { id: "C-11", what: "hairline (0.5px dividers)", status: "resolved", detail: "Approved: use --border for the color and preserve the 0.5px divider weight during Build.", visual: { kind: "color", beforeLabel: "hairline (origin, 0.5px)", beforeHexLight: "#d9d9e0", beforeHexDark: "#363a3f", afterVar: "--border", afterLabel: "approved: --border" } },
      { id: "C-12", what: "borderStrong (inset pressed ring on light menu rows)", status: "resolved", detail: "Approved: use --border; Build must preserve the stronger/pressed border treatment where the component requires it.", visual: { kind: "color", beforeLabel: "borderStrong (origin)", beforeHexLight: "#b9bbc6", beforeHexDark: "#5a6169", afterVar: "--border", afterLabel: "approved: --border" } },
      { id: "C-13", what: "statusRedText (danger menu rows)", status: "resolved", detail: "Approved: maps directly to --destructive.", visual: { kind: "color", beforeLabel: "statusRedText (origin)", beforeHexLight: "#ce2c31", beforeHexDark: "#ff9592", afterVar: "--destructive", afterLabel: "approved: --destructive" } },
      { id: "C-14", what: "onInk (text on filled-dark active panel row)", status: "resolved", detail: "Approved: maps to --primary-foreground.", visual: { kind: "color", beforeLabel: "onInk (origin)", beforeHexLight: "#ffffff", beforeHexDark: "#111113", afterVar: "--primary-foreground", afterLabel: "approved: --primary-foreground" } },
    ],
  },
  {
    id: "D",
    name: "Typography",
    rows: [
      { id: "D-1", what: "Global sans family", status: "resolved", detail: "Approved and implemented at the design-system token source: --font-sans is Inter-first with ui-sans/system fallbacks.", visual: { kind: "type", beforeLabel: "Origin: FONT_FAMILY (Inter)", beforeFamily: "Inter, sans-serif", beforeSize: "14px", beforeWeight: "400", afterLabel: "bidezine: --font-sans Inter-first", afterClassName: "font-sans text-sm" } },
      { id: "D-2", what: "Page/header title (headingM)", status: "resolved", detail: "Approved: keep the current bidezine page/header title mapping, text-lg font-semibold.", visual: { kind: "type", beforeLabel: "Origin: headingM (18px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "18px", beforeWeight: "500", afterLabel: "approved: text-lg font-semibold", afterClassName: "font-sans text-lg font-semibold" } },
      { id: "D-3", what: "Panel/card title (headingS)", status: "resolved", detail: "Approved/aligned: use text-base font-medium for panel and card titles.", visual: { kind: "type", beforeLabel: "Origin: headingS (16px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "16px", beforeWeight: "500", afterLabel: "approved: text-base font-medium", afterClassName: "font-sans text-base font-medium" } },
      { id: "D-4", what: "Body / main option rows (bodyM)", status: "resolved", detail: "Approved/aligned: main panel option rows map to text-sm. The adjusted preview now uses text-sm for these rows.", visual: { kind: "type", beforeLabel: "Origin: bodyM (14px/400)", beforeFamily: "Inter, sans-serif", beforeSize: "14px", beforeWeight: "400", afterLabel: "approved: text-sm", afterClassName: "font-sans text-sm" } },
      { id: "D-5", what: "Compact body (bodyS)", status: "resolved", detail: "Approved for compact secondary/menu text only: use text-xs. Do not use this for main panel option rows.", visual: { kind: "type", beforeLabel: "Origin: bodyS (13px/400)", beforeFamily: "Inter, sans-serif", beforeSize: "13px", beforeWeight: "400", afterLabel: "approved compact: text-xs", afterClassName: "font-sans text-xs" } },
      { id: "D-6", what: "Medium label (labelM)", status: "resolved", detail: "Approved: use text-xs font-medium for medium labels, subtitles, checked rows, and compact label cases.", visual: { kind: "type", beforeLabel: "Origin: labelM (13px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "13px", beforeWeight: "500", afterLabel: "approved: text-xs font-medium", afterClassName: "font-sans text-xs font-medium" } },
      { id: "D-7", what: "Large label / active row (labelL)", status: "resolved", detail: "Approved/aligned: selected or active option rows use text-sm font-medium.", visual: { kind: "type", beforeLabel: "Origin: labelL (14px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "14px", beforeWeight: "500", afterLabel: "approved: text-sm font-medium", afterClassName: "font-sans text-sm font-medium" } },
      { id: "D-8", what: "Caption", status: "resolved", detail: "Approved/aligned: use text-xs for caption text.", visual: { kind: "type", beforeLabel: "Origin: caption (12px/400)", beforeFamily: "Inter, sans-serif", beforeSize: "12px", beforeWeight: "400", afterLabel: "approved: text-xs", afterClassName: "font-sans text-xs" } },
      { id: "D-9", what: "Strong caption / badge", status: "resolved", detail: "Approved/aligned: use text-xs font-semibold for dense badges and compact emphatic labels.", visual: { kind: "type", beforeLabel: "Origin: captionStrong (12px/600)", beforeFamily: "Inter, sans-serif", beforeSize: "12px", beforeWeight: "600", afterLabel: "approved: text-xs font-semibold", afterClassName: "font-sans text-xs font-semibold" } },
      { id: "D-10", what: "Large metric (numberL)", status: "resolved", detail: "Approved: use text-3xl font-medium tabular-nums for large metrics.", visual: { kind: "type", beforeLabel: "Origin: numberL (28px/500)", beforeFamily: "Inter, sans-serif", beforeSize: "28px", beforeWeight: "500", afterLabel: "approved: text-3xl font-medium tabular-nums", afterClassName: "font-sans text-3xl font-medium tabular-nums" } },
    ],
  },
  {
    id: "E",
    name: "Spacing",
    rows: [
      { id: "E-1", what: "SPACE[1] = 4px", status: "resolved", detail: "Approved: use gap-1 / p-1." },
      { id: "E-2", what: "SPACE[2] = 8px", status: "resolved", detail: "Approved: use gap-2 / p-2." },
      { id: "E-3", what: "SPACE[3] = 12px", status: "resolved", detail: "Approved: use gap-3 / p-3." },
      { id: "E-4", what: "SPACE[4] = 16px (rail outer gap)", status: "resolved", detail: "Approved: use gap-4. Preserve the note that the origin previously had a historical wrong-SPACE-step bug here." },
      { id: "E-5", what: "SPACE[6] = 24px", status: "resolved", detail: "Approved: use gap-6 / p-6." },
      { id: "E-6", what: "SPACE.half = 2px", status: "resolved", detail: "Approved: use gap-0.5." },
      { id: "E-7", what: "28px hardcoded subtitle indent", status: "resolved", detail: "Approved: use pl-7 from Tailwind's 4px scale." },
    ],
  },
  {
    id: "F",
    name: "Layout / Sizing",
    rows: [
      { id: "F-1", what: "railW = 54px", status: "resolved", detail: "Approved now: match the origin Rail Sidebar rail width at 54px in the adjusted example instead of using the Sidebar primitive's 48px collapsed rail width.", visual: { kind: "shape", beforeLabel: "Origin railW 54px", beforeStyle: { width: "54px", height: "3rem" }, afterLabel: "approved: adjusted railW 54px", afterStyle: { width: "54px", height: "3rem" } } },
      { id: "F-2", what: "railButton = 38px / railIcon = 20px", status: "resolved", detail: "Approved now: match the origin Rail Sidebar rail button container at 38px and main rail glyph size at 20px in the adjusted example.", visual: { kind: "shape", beforeLabel: "Origin railButton 38px", beforeStyle: { width: "38px", height: "38px", radius: "8px" }, afterLabel: "approved: adjusted 38px button / 20px icon", afterStyle: { width: "38px", height: "38px", radius: "8px" } } },
      { id: "F-3", what: "panelW = 300px (default panel width)", status: "decision", detail: "Our Sidebar's default width is 16rem/256px \u2014 no exact match.", visual: { kind: "shape", beforeLabel: "panelW 300px", beforeStyle: { width: "150px", height: "2.5rem" }, afterLabel: "Sidebar default 256px (scaled preview)", afterStyle: { width: "128px", height: "2.5rem" } } },
      { id: "F-4", what: "panelGap = 8px", status: "clean", detail: "= SPACE[2] = gap-2 / ml-2." },
      { id: "F-5", what: "hitTarget = 40px (row minHeight, ADR-003)", status: "note", detail: "h-10 matches the value, but it's a deliberate density decision worth preserving intentionally, not just numerically.", visual: { kind: "shape", beforeLabel: "hitTarget 40px", beforeStyle: { width: "8rem", height: "40px" }, afterLabel: "h-10 (40px) \u2014 same value", afterStyle: { width: "8rem", height: "40px" } } },
      { id: "F-6", what: "compact = 28px (NavRowShell minHeight)", status: "note", detail: "min-h-7 matches the value \u2014 but check against F-5 for a possible inconsistency in the origin code.", visual: { kind: "shape", beforeLabel: "compact 28px", beforeStyle: { width: "8rem", height: "28px" }, afterLabel: "min-h-7 (28px) \u2014 same value", afterStyle: { width: "8rem", height: "28px" } } },
      { id: "F-7", what: "FOOTER_MAX_HEIGHT = 122px (3-icon cap)", status: "decision", detail: "Computed constant with no bidezine equivalent; a 4th footer icon is silently clipped by design.", visual: { kind: "shape", beforeLabel: "FOOTER_MAX_HEIGHT 122px (3 icons)", beforeStyle: { width: "2.5rem", height: "122px" }, afterLabel: "No bidezine equivalent yet", afterStyle: { width: "2.5rem", height: "122px", className: "border-dashed" } } },
      { id: "F-8", what: "PANEL_MIN_WIDTH = 240px", status: "clean", detail: "min-w-60 \u2014 document as a design constant." },
      { id: "F-9", what: "ITEM_SLOT = 42px (derived: railButton + SPACE[1])", status: "resolved", detail: "Resolved by F-2/E-1: because the adjusted rail now matches the origin 38px rail button and uses the approved 4px spacing token, the derived rail item slot is 42px." },
    ],
  },
  {
    id: "G",
    name: "Border Radius",
    rows: [
      { id: "G-1", what: "RADIUS.rounded = 12px (rail, panel, menus)", status: "decision", detail: "No exact bidezine token \u2014 radius-lg is 10px, radius-xl is 14px.", visual: { kind: "shape", beforeLabel: "RADIUS.rounded 12px", beforeStyle: { width: "3.5rem", height: "3.5rem", radius: "12px" }, afterLabel: "radius-lg 10px vs radius-xl 14px (neither exact)", afterStyle: { width: "3.5rem", height: "3.5rem", radius: "10px" } } },
      { id: "G-2", what: "RADIUS.soft = 8px (rows, overflow items)", status: "clean", detail: "Exact match: radius-md (0.5rem).", visual: { kind: "shape", beforeLabel: "RADIUS.soft 8px", beforeStyle: { width: "3.5rem", height: "3.5rem", radius: "8px" }, afterLabel: "radius-md 8px \u2014 exact match", afterStyle: { width: "3.5rem", height: "3.5rem", radius: "8px" } } },
      { id: "G-3", what: "RADIUS.xs = 4px origin vs Sidebar rounded-md", status: "resolved", detail: "Approved for now: mirror the existing Sidebar collapsed icon-button structure and use radius-md/8px for adjusted rail icon slots instead of the origin's 4px radius.", visual: { kind: "shape", beforeLabel: "Origin RADIUS.xs 4px", beforeStyle: { width: "2.5rem", height: "2.5rem", radius: "4px" }, afterLabel: "approved: Sidebar rounded-md 8px", afterStyle: { width: "2.5rem", height: "2.5rem", radius: "8px" } } },
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
      { id: "L-1", what: "LogoSlotDark", status: "note", detail: "No direct bidezine primitive; composable from a plain button + our Tooltip. Behavior requirement (verified against design-system/src/gallery/LogoSlotDark.tsx, not re-derived from memory): the tooltip shows on hover UNCONDITIONALLY \u2014 even when the slot has no onClick/isInteractive \u2014 with the logo label (default \"BiDezine\", see M-9). Implemented and interactively verified in the limbo-factory preview build (FunctionalRailSidebar.tsx): wrap the logo in the same Tooltip/TooltipTrigger/TooltipContent pattern already used by every rail icon button, no state-based suppression." },
      { id: "L-2", what: "RailButtonDark", status: "decision", detail: "Our Button is light-surface-oriented with standard shadcn variants \u2014 none match the dark rail visual model. Separate BEHAVIOR requirement, independent of the still-open visual-model decision (verified against design-system/src/gallery/RailButtonDark.tsx): showTooltip = (hovered || focused) && !isBrowsing && !isActive && !isDisabled \u2014 the hover tooltip must be SUPPRESSED once a rail button is active (selected) or browsing (its panel is open), not shown unconditionally on hover. Implemented and interactively verified in the limbo-factory preview build: RailIconButton skips the Tooltip wrapper entirely for active/browsing states (do NOT implement this by toggling Radix Tooltip's `open` prop between `false`/`undefined` \u2014 that flips the component between controlled/uncontrolled and triggers a React warning, confirmed via manual testing)." },
      { id: "L-3", what: "NavIndentLine", status: "note", detail: "Simple to implement inline once density decisions (E-1/F-5/F-6) are resolved." },
      { id: "L-4", what: "ExpandButton (panel collapse trigger)", status: "note", detail: "Depends on the Q4 icon decision; otherwise composable from our Button." },
      { id: "L-5", what: "ClearButton (search clear)", status: "note", detail: "Composable from our Button (ghost/icon variant) with conditional visibility." },
      { id: "L-6", what: "Badge (neutral / info / dark-surface variants)", status: "decision", detail: "Our Badge's variants (default/secondary/destructive/outline/ghost/link) don't map cleanly to RailNav's neutral/info/atomSurface concepts." },
      { id: "L-7", what: "Collapse (motion component)", status: "decision", detail: "Same H-6 dependency \u2014 use our Collapsible with custom animation, or reimplement Collapse's exact behavior." },
      { id: "L-8", what: "OverflowTriggerButton (rail \u201cMore\u201d menu trigger, active-in-overflow dot)", status: "note", detail: "Not previously itemized \u2014 found only by direct comparison against design-system/src/gallery/RailNav.tsx's OverflowTriggerButton during Build, not caught at Intake (see the flaws log in LIMBO-PROTOCOL-LOG.md). Behavior requirement: the small active-indicator dot (`active && !open`) must be HIDDEN while the overflow dropdown menu itself is open \u2014 showing it then is redundant since the stashed active section is already visible/highlighted inside the open menu. Implemented and interactively verified in the limbo-factory preview build: the DropdownMenu is controlled (open/onOpenChange) so the dot's visibility can react to real open state, rather than rendering unconditionally whenever the active section happens to be stashed." },
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
      { id: "M-5", what: "Custom hand-rolled tooltip (portal + fixed positioning)", status: "clean", detail: "Our Tooltip (Radix-based, portal built-in) is an effectively clean replacement. Caveat found during Build (see L-1/L-2): our Tooltip shows on hover unconditionally by default \u2014 the origin's per-instance suppression rules (LogoSlotDark always shows; RailButtonDark suppresses when active/browsing/disabled) are NOT automatic and must be wired per call site. Do this by conditionally omitting the Tooltip wrapper for the suppressed state, never by toggling Radix Tooltip's own `open` prop between `false` and `undefined` \u2014 that flips the component between controlled/uncontrolled and triggers a React runtime warning (confirmed via manual testing in the limbo-factory preview)." },
      { id: "M-6", what: "ResizeObserver overflow budget", status: "note", detail: "Novel DOM-measurement logic with no bidezine equivalent \u2014 must be re-implemented as-is, not simplified away." },
      { id: "M-7", what: "Panel resize handle (mouse-drag)", status: "decision", detail: "Our Resizable primitive (react-resizable-panels) works at a different API level (panel groups vs a single handle) \u2014 needs a pick." },
      { id: "M-8", what: "Conflict with existing Sidebar primitive", status: "decision", detail: "Architecturally different organisms that both could be called \u201csidebar\u201d \u2014 needs naming/documentation guidance." },
      { id: "M-9", what: "logoLabel default = \u201cBiDezine\u201d", status: "clean", detail: "Already correct for our brand \u2014 just needs documenting that non-bidezine consumers must override it." },
      { id: "M-10", what: "modal={false} on both DropdownMenus", status: "clean", detail: "Our dropdown-menu.tsx wrapper passes props through to Radix's root \u2014 no decision needed." },
      { id: "M-11", what: "All interactive elements must be the real Button primitive, never a raw <button>", status: "resolved", detail: "QA finding, not an origin divergence: PanelTree's group-toggle row (the CollapsibleTrigger for \u201cSystem logic\u201d/\u201cSchedules\u201d) was a raw native <button> with hand-copied focus/hover styling instead of the real @bidezine/system Button \u2014 confirmed by inspecting the rendered DOM (missing data-variant/data-size attributes that the real Button always sets). This is the exact \u201cReal components only\u201d violation already logged once for the factory-line chrome itself (see LIMBO-PROTOCOL-LOG.md's flaws log) recurring in the actual adjusted-rail implementation. Fixed: swapped for <Button variant=\"ghost\"> with the same className, keeping CollapsibleTrigger's asChild wiring. A full sweep of FunctionalRailSidebar.tsx and FullRailPreview.tsx for the same pattern turned up one more instance: FullRailPreview.tsx's entire old static mock chain (FullRailMock/RailBtn/PanelRow \u2014 a raw <button> and a <div role=\"button\">) was confirmed fully dead code (its only export, FullRailPreview, was never imported anywhere \u2014 RailNavStatusPreview/FunctionalRailSidebar had already fully superseded it) and was deleted outright rather than left as a latent violation someone could silently re-wire back in." },
      { id: "M-12", what: "Rail buttons had zero hover/press feedback despite using the real Button primitive", status: "resolved", detail: "QA finding, not an origin divergence: prompted by \u201cwhy is there no hover/press state if Button has those states assigned?\u201d Root cause verified in code and confirmed via getComputedStyle in the browser (background stayed transparent through hover AND press): RailIconButton's className carried `hover:bg-transparent`, which overrode Button's own ghost-variant hover background (`hover:bg-accent`) \u2014 presumably because `--accent` is a light-surface token that would look wrong on the dark rail \u2014 but nothing was substituted in its place. The correct dark-rail hover/pressed tokens (B-2/B-4, colors.hover/colors.pressed) were already defined on the RailColors type and returned by colorsFor, but were never actually referenced anywhere in the component. The overflow \u201cMore\u201d trigger had the exact same gap (no hover feedback, and didn't reflect open state the way origin's OverflowTriggerButton does with darkActiveBg). Fixed: both buttons now track real hover/pressed(/open) state via onMouseEnter/Leave/Down/Up (mirroring origin RailButtonDark's own local-state pattern, since these are dynamic per-instance token values, not static utility classes) and apply colors.hover/colors.pressed/colors.active and colors.fgHover/colors.fgSubtle accordingly; the now-redundant `hover:bg-transparent` overrides were removed. Verified via getComputedStyle: background now genuinely transitions transparent \u2192 hover token \u2192 pressed token \u2192 transparent on mouse enter/down/up/leave." },
      { id: "M-13", what: "darkBorderStrong's approved value was nearly invisible against the rail surface once actually rendered", status: "decision", detail: "QA finding, not an origin divergence: prompted by \u201cthe active-state border color isn't very visible on the dark surface, can you propose something better?\u201d Confirmed via getComputedStyle in the browser: the \u201cbrowsing\u201d ring (`boxShadow: inset 0 0 0 1.5px \\${colors.border}`) rendered as oklch(0.256)/oklch(0.254) against a rail surface of oklch(0.205)/oklch(0.145) \u2014 a lightness delta of only ~0.05 in app-light-mode and ~0.11 in app-dark-mode, i.e. functionally invisible, even though B-5/Q2 had already been marked resolved. Origin's own value (rgba(255,255,255,0.6) composited over its dark surface) is considerably brighter than what got approved here, so the original candidate undersold even origin's own intent. Proposed and applied live (pending sign-off, NOT auto-approved \u2014 the user was unavailable to confirm when asked): oklch(0.708 0 0) for both app modes, reusing the already-approved onDarkSubtle value (and the base theme's own --ring/--muted-foreground tokens) rather than inventing a new number. A bolder alternative (oklch(0.922), reusing onDarkHover / the base theme's --border) remains available if 0.708 doesn't feel strong enough once reviewed. See the Color token lab tab and B-5.", visual: { kind: "color", beforeLabel: "Original approved candidate (barely visible)", beforeHexLight: "oklch(0.256 0 0)", beforeHexDark: "oklch(0.254 0 0)", afterVar: "--sidebar-rail-border-strong", afterHexLight: "oklch(0.708 0 0)", afterHexDark: "oklch(0.708 0 0)", afterLabel: "proposed revision, pending sign-off", afterNote: "Reuses the already-approved onDarkSubtle value; bolder oklch(0.922) alternative available." } },
      { id: "M-14", what: "Raising darkBorderStrong's brightness (M-13) also brightened the rail's own divider lines, since both shared one token", status: "resolved", detail: "QA finding, not an origin divergence: caught immediately after M-13 shipped \u2014 \u201cthat helped a lot but it changed the divider line making it too visible, the previous approach was good for the divider line.\u201d Root cause: FunctionalRailSidebar.tsx's two horizontal divider lines (between logo/nav and nav/footer) were reusing colors.border/darkBorderStrong \u2014 the SAME token as the browsing-state ring \u2014 for an entirely different visual role. That was harmless while darkBorderStrong stayed dim (M-13's whole complaint), but once it was correctly brightened for the ring, the divider brightened right along with it as an unwanted side effect. Confirmed against design-system/src/gallery/RailNav.tsx: origin's own rail has NO divider line at all between these groups \u2014 it separates them purely with flex `gap: SPACE[4]`, and darkBorderStrong there is used ONLY for the ring/overflow-menu border, never as a rail-internal divider. Fixed by giving the divider its own dedicated token (darkDividerSubtle, --sidebar-rail-divider) rather than reverting M-13 \u2014 the user asked for a proper token, not a rollback: it reuses darkBorderStrong's ORIGINAL, already-reviewed value (oklch(0.256)/oklch(0.254)) verbatim, now correctly scoped to only the role it was always visually right for. RailColors/colorsFor updated with a `divider` field; both divider <div>s switched from colors.border to colors.divider. Verified via getComputedStyle: dividers render back at oklch(0.256)/oklch(0.254) (confirmed unchanged from before M-13) while the ring stays at oklch(0.708 0 0)." },
      { id: "M-15", what: "darkSurface's dark-app-mode value was identical to bidezine's own --background token", status: "decision", detail: "QA finding, not an origin divergence: prompted by \u201cwhen dark mode the rail looks the same color as the background... i dont want it to look like the sidebar color but neither as dark as the background.\u201d Confirmed via getComputedStyle: the rail's real rendered background and the page body's background both resolved to the literal same value, oklch(0.145 0 0) \u2014 the rail was indistinguishable from the page in dark app mode, even though B-1/Q2 had already marked this resolved. Constraint discovered while picking a fix: the safe range is narrow and hard-bounded on both sides \u2014 a new value must sit ABOVE 0.145 (or it's still not distinct from --background) but BELOW darkHoverBg's already-approved oklch(0.191 0 0) (or the rail's rest state would already look \u201chovered,\u201d breaking the hover escalation with nowhere left to go). That rules out simply reusing bidezine's own --card/--sidebar dark-theme value (oklch(0.205 0 0), which is what \u201cdon't want it to look like the sidebar color\u201d correctly ruled out anyway) \u2014 0.205 sits ABOVE darkHoverBg and would invert rest/hover entirely. Proposed and applied live (pending sign-off, NOT auto-approved \u2014 the user was unavailable to confirm when asked): oklch(0.18 0 0) for dark app mode only, a genuinely new number on the same ramp (same precedent as darkHoverBg/darkPressedBg/darkActiveBg/darkActiveHoverBg before it, since no existing bidezine stop falls inside the open (0.145, 0.191) window) \u2014 gives the best available separation from --background (delta 0.035) without inverting the hover relationship (delta 0.011 below darkHoverBg) or touching hover/pressed/active's own already-approved values. Light app mode's oklch(0.205 0 0) is untouched (no collision there against a white --background). See the Color token lab tab and B-1.", visual: { kind: "color", beforeLabel: "Original approved candidate (matched page background)", beforeHexLight: "oklch(0.205 0 0)", beforeHexDark: "oklch(0.145 0 0)", afterVar: "--sidebar-rail-surface", afterHexLight: "oklch(0.205 0 0)", afterHexDark: "oklch(0.18 0 0)", afterLabel: "proposed revision (dark app mode only), pending sign-off", afterNote: "New number, hard-bounded between --background (0.145) and darkHoverBg (0.191)." } },
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
    title: "Icon `filled` prop support must be used deliberately",
    detail: "Q1 is resolved: the icon pipeline now supports `filled?: boolean`. Build must apply it only to actionable hover/selected/active states; static/non-interactive icon display remains regular.",
    actionItems: [
      { id: "R-1a", text: "Q1 answered \u2014 generated icons now expose filled?: boolean for actionable states", done: true, refs: ["Q1", "A-9"] },
      { id: "R-1b", text: "During Build, audit actionable icon usages so filled is opt-in by state and non-interactive icons remain regular", done: false, refs: ["A-1", "A-8", "A-9"] },
    ],
  },
  {
    id: "R-2",
    title: "Dark surface token family has zero bidezine equivalents",
    detail: "The whole rail color system is missing. Authoring ad-hoc inline values would violate the tokens-only rule in CLAUDE.md.",
    actionItems: [
      { id: "R-2a", text: "Q2 answered \u2014 author new tokens (option a)", done: true, refs: ["Q2"] },
      { id: "R-2b", text: "Color Token Lab built so proposed values can be visually approved before authoring", done: true, refs: ["proposedDarkRailTokens"] },
      { id: "R-2c", text: "User approves each of the 10 proposed dark-rail tokens in the lab \u2014 all 10 approved", done: true, refs: ["proposedDarkRailTokens"] },
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
      { id: "R-4b", text: "Spot-check remaining categories (F, G) against origin source, not just docs, before Build", done: false, refs: ["F-3", "F-7", "G-1"] },
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

