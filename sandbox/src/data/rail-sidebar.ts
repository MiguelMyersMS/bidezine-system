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
    { id: "q2", title: "Q2 — Dark rail surface token family", status: "done", note: "Resolved: all 11 candidate tokens approved in the Color Token Lab (incl. 2 post-Build corrections + 1 new token, see M-13/M-14/M-15)" },
    { id: "q3", title: "Q3 — Default logo icon", status: "done", note: "Resolved: custom manifest entry, sourced from the origin bidezine mark" },
    { id: "q4", title: "Q4 — Panel collapse icon", status: "done", note: "Resolved: panel_left_contract_20_regular, a clean 1:1 Fluent match" },
    { id: "remaining", title: "0 divergence rows awaiting a decision \u2014 all resolved", status: "done", note: "L-7 (Collapse motion component) was the last remaining status: \"decision\" row and is now resolved: the rail's PanelTree group-node CollapsibleContent animates via `data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden`, reusing the same tw-animate-css keyframe technique already adopted by our real Accordion primitive (Collapsible's own dedicated --radix-collapsible-content-height keyframe pair, not Accordion's variable) \u2014 no fixed pixel height, height is measured live by Radix from the actual content each open. This decouples L-7 from H-2\u2013H-6's still-deferred motion-token upgrade, since it needed zero new tokens, only reuse of tw-animate-css (already a root package.json dependency). A real implementation gap was caught and fixed along the way: limbo-factory runs its own separate Tailwind build that never imported tw-animate-css, so the animation utility classes would have been dead/no-op CSS in this app specifically \u2014 fixed by adding tw-animate-css as an explicit devDependency and import in limbo-factory/src/index.css, verified via the live dev server's compiled CSS. Scoped to FunctionalRailSidebar.tsx's call site only, not the shared src/ui/collapsible.tsx primitive. User approved live in the limbo-factory preview before this was marked resolved. Every other category (A\u2013K, M) was already fully resolved before this pass, and L-6 (Badge neutral/info/dark-surface variants) was resolved once Badge grew success/warning/info/muted variants plus the weight and tone axes \u2014 the rail's own panel-tree badges now default to variant=\"muted\" weight=\"regular\" per that decision (see L-6's own detail). Category M (M-1 through M-22, every row) closed out earlier this pass: M-5 (Tooltip), M-9 (logo contract \u2014 expanded into a full request-SVG/hyperlink/tooltip-name spec, see FunctionalRailSidebar.tsx's logoIcon/logoHref/logoLabel/logoPlaceholder props), and M-10 (modal={false} passthrough) were approved by the user (\u201cmake it green\u201d) with zero or minimal code needed; M-6/M-7/M-8/M-20/M-21/M-22 were resolved in the prior pass (see LIMBO-PROTOCOL-LOG.md Update 19). H-2\u2013H-6 (the five motion-DURATION/EASING/animation-approach items with no direct bidezine token) were explicitly deferred/greenlit by the user (\u201cmake them green for now... I have planned to make a major upgrade in animations soon\u201d), and H-7/H-8 were approved outright \u2014 category H fully closed. Category F (F-1\u2013F-11, all 11 rows) closed out via F-4/F-7/F-8/F-9/F-10/F-11 (see L-44 through L-47) \u2014 F-7 in particular caught a real gap where an approved concept had never actually been wired into code, now fixed and folded into CLAUDE.md checklist item 26 as a fourth verification axis. 6 rail-specific items (G-1, H-1, K-1, K-2, L-2, M-1) approved once the rail was visually signed off (\u201crail seems right entirely\u201d). D-12 (Panel-actions menu text-size vs. D-5/D-6) was raised and resolved after that sign-off: keep the shared dropdown-menu text-sm convention, no override. K-3 (scrollbar) was resolved after that too: swapped to the real ScrollArea component. L-20 (video/video_settings icons) is resolved too (see L-27): both icons fill on hover/press/select like every other actionable icon, using their real Fluent filled paths. L-11 (panel-tree vertical guide line) is now resolved (see L-3): compared against origin's fuller NavIndentLine bleed/weight technique and the current simpler border-l approximation was approved as sufficient, explicitly flagged as a deliberate simplification rather than silently dropped. L-3/L-4 (NavIndentLine, ExpandButton) are both resolved too, for the same reason and via the Q4/A-7 icon resolution respectively \u2014 neither needed further user input once actually investigated against their real origin sources and the current shipped code. L-48/L-49 (rail-to-panel gap doubling; overflow menu's missing \u201cbrowsing\u201d state tier) and M-20/M-21/M-22 (adjacentContent visibility, width-chain, and collapsed-gap fixes) are code-level fixes, all resolved and verified live." },
  ],
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
  // L-20/L-27: `filledD` IS present here (restored, not exempted) — see L-27's divergence log entry
  // for why the "regular vs. filled looks like a different icon" observation does not justify an
  // exemption: every actionable icon in this system fills on hover/press/select with zero
  // exceptions (Q1's resolved decision), and inconsistent exemptions were themselves reported by the
  // user as a recurring bug ("many icons are not filling"), not a feature.
  video: { d: "M5 4C3.34315 4 2 5.34315 2 7V13C2 14.6569 3.34315 16 5 16H10C11.6569 16 13 14.6569 13 13V12.6787L16.0372 14.7759C16.8664 15.3484 17.9975 14.7549 17.9975 13.7473V6.25215C17.9975 5.24453 16.8664 4.65101 16.0372 5.22353L13 7.32067V7C13 5.34315 11.6569 4 10 4H5ZM13 8.53588L16.6054 6.04643C16.7712 5.93193 16.9975 6.05063 16.9975 6.25215V13.7473C16.9975 13.9488 16.7712 14.0675 16.6054 13.953L13 11.4635V8.53588ZM3 7C3 5.89543 3.89543 5 5 5H10C11.1046 5 12 5.89543 12 7V13C12 14.1046 11.1046 15 10 15H5C3.89543 15 3 14.1046 3 13V7Z", filledD: "M2 7a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7Zm14.04 7.78L14 13.37V6.63l2.04-1.4c.83-.58 1.96.01 1.96 1.02v7.5c0 1-1.13 1.6-1.96 1.03Z", fluent: "video_20_regular / video_20_filled" },
  // See the note above `video` — same reasoning applies here (L-27 restores this rather than
  // continuing to exempt it).
  videoSettings: { d: "M5 3C3.34315 3 2 4.34315 2 6V10.2572C2.30711 10.0035 2.64222 9.78261 3 9.59971V6C3 4.89543 3.89543 4 5 4H10C11.1046 4 12 4.89543 12 6V12C12 12.7605 11.5756 13.4218 10.9507 13.7601C10.9832 14.0021 11 14.2491 11 14.5C11 14.6117 10.9967 14.7227 10.9901 14.8328C12.1605 14.4237 13 13.3099 13 12V11.6787L16.0372 13.7759C16.8664 14.3484 17.9975 13.7549 17.9975 12.7473V5.25215C17.9975 4.24453 16.8664 3.65101 16.0372 4.22353L13 6.32067V6C13 4.34315 11.6569 3 10 3H5ZM13 7.53588L16.6054 5.04643C16.7712 4.93193 16.9975 5.05063 16.9975 5.25215V12.7473C16.9975 12.9488 16.7712 13.0675 16.6054 12.953L13 10.4635V7.53588ZM3.06572 11.4421L2.90953 10.8853C3.16362 10.69 3.43901 10.5227 3.73144 10.3878L4.06879 10.7458C4.85773 11.5829 6.18849 11.5836 6.97831 10.7473L7.30299 10.4035C7.60078 10.544 7.88057 10.7183 8.1378 10.9216L8.01161 11.3439C7.68227 12.446 8.34826 13.5982 9.46769 13.8628L9.81669 13.9454C9.83828 14.1271 9.8494 14.3122 9.8494 14.5C9.8494 14.656 9.84173 14.8101 9.82675 14.962L9.36621 15.0797C8.27826 15.3576 7.63226 16.4765 7.93556 17.5576L8.09171 18.1143C7.83764 18.3096 7.56226 18.477 7.26985 18.6119L6.93249 18.2539C6.14355 17.4168 4.81279 17.4161 4.02297 18.2524L3.69797 18.5965C3.40025 18.4561 3.12051 18.2819 2.86333 18.0786L2.98967 17.6558C3.31901 16.5537 2.65302 15.4016 1.53358 15.1369L1.18403 15.0542C1.16247 14.8726 1.15137 14.6876 1.15137 14.5C1.15137 14.3439 1.15904 14.1898 1.17402 14.0378L1.63506 13.92C2.72301 13.6421 3.36901 12.5232 3.06572 11.4421ZM5.50039 15.5C6.05267 15.5 6.50039 15.0523 6.50039 14.5C6.50039 13.9477 6.05267 13.5 5.50039 13.5C4.9481 13.5 4.50039 13.9477 4.50039 14.5C4.50039 15.0523 4.9481 15.5 5.50039 15.5Z", filledD: "M2 6a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v6a3 3 0 0 1-2.01 2.83l.01-.33a5.5 5.5 0 0 0-9-4.24V6Zm14.04 7.78L14 12.37V5.63l2.04-1.4c.83-.58 1.96.01 1.96 1.02v7.5c0 1-1.13 1.6-1.96 1.03ZM2.9 10.88l.15.56a2 2 0 0 1-1.43 2.48l-.46.12a4.7 4.7 0 0 0 .01 1.01l.35.09A2 2 0 0 1 3 17.66l-.13.42c.26.2.54.38.84.52l.32-.35a2 2 0 0 1 2.91 0l.34.36c.29-.13.56-.3.82-.5l-.16-.55a2 2 0 0 1 1.43-2.48l.46-.12a4.7 4.7 0 0 0 0-1.01l-.36-.09a2 2 0 0 1-1.45-2.52l.12-.42c-.25-.2-.53-.38-.83-.52l-.32.35a2 2 0 0 1-2.91 0l-.34-.36c-.3.13-.57.3-.82.5ZM6.5 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z", fluent: "video_settings_20_regular / video_settings_20_filled" },
  peopleCommunity: { d: "M10 3C8.89543 3 8 3.89543 8 5C8 6.10457 8.89543 7 10 7C11.1046 7 12 6.10457 12 5C12 3.89543 11.1046 3 10 3ZM7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5ZM5.0528 9.99585C5.01946 10.1587 5.00195 10.3273 5.00195 10.5V11.0448L2.37096 11.7497C2.10423 11.8212 1.94594 12.0954 2.01741 12.3621L2.66446 14.7769C3.0613 16.2579 4.49965 17.1817 5.98034 16.9715C6.21006 17.2819 6.47486 17.5647 6.76887 17.8142C6.7124 17.832 6.65527 17.8487 6.59751 17.8642C4.46365 18.4359 2.2703 17.1696 1.69853 15.0357L1.05148 12.6209C0.837071 11.8207 1.31194 10.9982 2.11214 10.7838L5.0528 9.99585ZM15.002 11.0448V10.5C15.002 10.3273 14.9844 10.1587 14.9511 9.99585L17.8918 10.7838C18.692 10.9982 19.1668 11.8207 18.9524 12.6209L18.3054 15.0357C17.7336 17.1696 15.5403 18.4359 13.4064 17.8642C13.3486 17.8487 13.2915 17.832 13.235 17.8142C13.529 17.5647 13.7938 17.2819 14.0236 16.9715C15.5043 17.1817 16.9426 16.2579 17.3394 14.7769L17.9865 12.3621C18.058 12.0954 17.8997 11.8212 17.6329 11.7497L15.002 11.0448ZM15 6.5C15 5.67157 15.6716 5 16.5 5C17.3284 5 18 5.67157 18 6.5C18 7.32843 17.3284 8 16.5 8C15.6716 8 15 7.32843 15 6.5ZM16.5 4C15.1193 4 14 5.11929 14 6.5C14 7.88071 15.1193 9 16.5 9C17.8807 9 19 7.88071 19 6.5C19 5.11929 17.8807 4 16.5 4ZM3.5 5C2.67157 5 2 5.67157 2 6.5C2 7.32843 2.67157 8 3.5 8C4.32843 8 5 7.32843 5 6.5C5 5.67157 4.32843 5 3.5 5ZM1 6.5C1 5.11929 2.11929 4 3.5 4C4.88071 4 6 5.11929 6 6.5C6 7.88071 4.88071 9 3.5 9C2.11929 9 1 7.88071 1 6.5ZM7.5 9C6.67157 9 6 9.67157 6 10.5V14C6 16.2091 7.79086 18 10 18C12.2091 18 14 16.2091 14 14V10.5C14 9.67157 13.3284 9 12.5 9H7.5ZM7 10.5C7 10.2239 7.22386 10 7.5 10H12.5C12.7761 10 13 10.2239 13 10.5V14C13 15.6569 11.6569 17 10 17C8.34315 17 7 15.6569 7 14V10.5Z", filledD: "M10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-4.95 8c-.03.16-.05.33-.05.5V14c0 1.53.69 2.9 1.77 3.81l-.17.05a4 4 0 0 1-4.9-2.82l-.65-2.42a1.5 1.5 0 0 1 1.06-1.84L5.05 10Zm8.18 7.81A4.99 4.99 0 0 0 15 14v-3.5c0-.17-.02-.34-.05-.5l2.94.78a1.5 1.5 0 0 1 1.06 1.84l-.64 2.42a4 4 0 0 1-5.07 2.77ZM16.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm-13 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4 5C6.67 9 6 9.67 6 10.5V14a4 4 0 0 0 8 0v-3.5c0-.83-.67-1.5-1.5-1.5h-5Z", fluent: "people_community_20_regular / people_community_20_filled" },
  cubeTree: { d: "M8.65811 4.52651C8.39614 4.43919 8.11298 4.58077 8.02566 4.84274C7.93833 5.10471 8.07991 5.38787 8.34189 5.4752L9.5 5.86123V7.00073C9.5 7.27687 9.72386 7.50073 10 7.50073C10.2761 7.50073 10.5 7.27687 10.5 7.00073V5.86123L11.6581 5.4752C11.9201 5.38787 12.0617 5.10471 11.9743 4.84274C11.887 4.58077 11.6039 4.43919 11.3419 4.52651L10 4.97381L8.65811 4.52651ZM10.4273 2.06606C10.1485 1.98319 9.85153 1.98319 9.57267 2.06607L6.70796 2.91748C6.28798 3.04229 6 3.42832 6 3.86645V8.12782C6 8.57041 6.29094 8.96036 6.71521 9.08641L9.50719 9.9159C9.50246 9.94351 9.5 9.9719 9.5 10.0009V11.0009H8C6.89543 11.0009 6 11.8963 6 13.0009V13.0509C4.85888 13.2825 4 14.2914 4 15.5009C4 16.8816 5.11929 18.0009 6.5 18.0009C7.88071 18.0009 9 16.8816 9 15.5009C9 14.2914 8.14112 13.2825 7 13.0509V13.0009C7 12.4486 7.44772 12.0009 8 12.0009H12C12.5523 12.0009 13 12.4486 13 13.0009V13.0509C11.8589 13.2825 11 14.2914 11 15.5009C11 16.8816 12.1193 18.0009 13.5 18.0009C14.8807 18.0009 16 16.8816 16 15.5009C16 14.2914 15.1411 13.2825 14 13.0509V13.0009C14 11.8963 13.1046 11.0009 12 11.0009H10.5V10.0009C10.5 9.9719 10.4975 9.94351 10.4928 9.9159L13.2848 9.08641C13.7091 8.96036 14 8.57042 14 8.12782V3.87389C14 3.43133 13.7091 3.0414 13.2849 2.91532L10.4273 2.06606ZM9.85756 3.02463C9.95051 2.997 10.0495 2.997 10.1424 3.02463L13 3.87389V8.12782L10.1424 8.97681C10.0495 9.00442 9.95053 9.00442 9.8576 8.97681L7 8.12782V3.87391L9.85756 3.02463ZM5 15.5009C5 14.6724 5.67157 14.0009 6.5 14.0009C7.32843 14.0009 8 14.6724 8 15.5009C8 16.3293 7.32843 17.0009 6.5 17.0009C5.67157 17.0009 5 16.3293 5 15.5009ZM13.5 14.0009C14.3284 14.0009 15 14.6724 15 15.5009C15 16.3293 14.3284 17.0009 13.5 17.0009C12.6716 17.0009 12 16.3293 12 15.5009C12 14.6724 12.6716 14.0009 13.5 14.0009Z", filledD: "M9.57267 2.06606C9.85153 1.98319 10.1485 1.98319 10.4273 2.06606L13.2849 2.91533C13.7091 3.0414 14 3.43133 14 3.87389V8.12782C14 8.57042 13.7091 8.96036 13.2848 9.08641L10.4928 9.9159C10.4975 9.94351 10.5 9.9719 10.5 10.0009V11.0009H12C13.1046 11.0009 14 11.8963 14 13.0009V13.0509C15.1411 13.2825 16 14.2914 16 15.5009C16 16.8816 14.8807 18.0009 13.5 18.0009C12.1193 18.0009 11 16.8816 11 15.5009C11 14.2914 11.8589 13.2825 13 13.0509V13.0009C13 12.4486 12.5523 12.0009 12 12.0009H8C7.44772 12.0009 7 12.4486 7 13.0009V13.0509C8.14112 13.2825 9 14.2914 9 15.5009C9 16.8816 7.88071 18.0009 6.5 18.0009C5.11929 18.0009 4 16.8816 4 15.5009C4 14.2914 4.85888 13.2825 6 13.0509V13.0009C6 11.8963 6.89543 11.0009 8 11.0009H9.5V10.0009C9.5 9.9719 9.50246 9.94351 9.50719 9.9159L6.7152 9.08641C6.29094 8.96036 6 8.57042 6 8.12782V3.87389C6 3.43133 6.2909 3.0414 6.71512 2.91533L9.57267 2.06606ZM8.65811 4.52651C8.39614 4.43919 8.11298 4.58077 8.02566 4.84274C7.93833 5.10471 8.07991 5.38787 8.34189 5.4752L9.5 5.86123V7.00073C9.5 7.27687 9.72386 7.50073 10 7.50073C10.2761 7.50073 10.5 7.27687 10.5 7.00073V5.86123L11.6581 5.4752C11.9201 5.38787 12.0617 5.10471 11.9743 4.84274C11.887 4.58077 11.6039 4.43919 11.3419 4.52651L10 4.97381L8.65811 4.52651Z", fluent: "cube_tree_20_regular / cube_tree_20_filled (design-system custom glyph, both variants)" },
  engine: { d: "M8 3C8 2.72386 7.77614 2.5 7.5 2.5C7.22386 2.5 7 2.72386 7 3V4H6C4.89543 4 4 4.89543 4 6V9H3V6.5C3 6.22386 2.77614 6 2.5 6C2.22386 6 2 6.22386 2 6.5V12.5C2 12.7761 2.22386 13 2.5 13C2.77614 13 3 12.7761 3 12.5V10H4V12.8787C4 13.4091 4.21071 13.9178 4.58579 14.2929L7 16.7071C7.18754 16.8946 7.44189 17 7.70711 17H13.191C13.5698 17 13.916 16.786 14.0854 16.4472L14.809 15H16C17.1046 15 18 14.1046 18 13V8C18 6.89543 17.1046 6 16 6H14.809L14.0854 4.55279C13.916 4.214 13.5698 4 13.191 4H11V3C11 2.72386 10.7761 2.5 10.5 2.5C10.2239 2.5 10 2.72386 10 3V4H8V3ZM6 5H13.191L13.9146 6.44721C14.084 6.786 14.4302 7 14.809 7H16C16.5523 7 17 7.44772 17 8V13C17 13.5523 16.5523 14 16 14H14.809C14.4302 14 14.084 14.214 13.9146 14.5528L13.191 16H7.70711L5.29289 13.5858C5.10536 13.3983 5 13.1439 5 12.8787V6C5 5.44772 5.44772 5 6 5ZM7.5 7C7.77614 7 8 7.22386 8 7.5V10C8 10.5523 8.44772 11 9 11H10V7.5C10 7.22386 10.2239 7 10.5 7C10.7761 7 11 7.22386 11 7.5V11H14.5C14.7761 11 15 11.2239 15 11.5C15 11.7761 14.7761 12 14.5 12H9C7.89543 12 7 11.1046 7 10V7.5C7 7.22386 7.22386 7 7.5 7Z", filledD: "M7.5 2.5c.28 0 .5.22.5.5v1h2V3a.5.5 0 0 1 1 0v1h2.2a1 1 0 0 1 .89.55L14.8 6H16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1.2l-.71 1.45a1 1 0 0 1-.9.55H7.71a1 1 0 0 1-.71-.3l-2.41-2.4A2 2 0 0 1 4 12.87V10H3v2.5a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 1 0V9h1V6c0-1.1.9-2 2-2h1V3c0-.28.22-.5.5-.5Zm0 4.5a.5.5 0 0 0-.5.5V10c0 1.1.9 2 2 2h5.5a.5.5 0 0 0 0-1H11V7.5a.5.5 0 0 0-1 0V11H9a1 1 0 0 1-1-1V7.5a.5.5 0 0 0-.5-.5Z", fluent: "engine_20_regular / engine_20_filled" },
  syncOff: { d: "M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10ZM10 3C6.47353 3 3.55612 5.60771 3.07089 9H8.26566L9.01926 6.36241C9.09512 6.09689 9.37186 5.94315 9.63738 6.01901C9.9029 6.09487 10.0566 6.37161 9.98078 6.63713L7.98078 13.6371C7.90492 13.9026 7.62818 14.0564 7.36266 13.9805C7.09714 13.9047 6.9434 13.6279 7.01926 13.3624L7.97995 10H3C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10H12.0199L10.9807 13.6371C10.9049 13.9027 10.6281 14.0564 10.3626 13.9805C10.0971 13.9047 9.94334 13.6279 10.0192 13.3624L12.0193 6.36241C12.0951 6.09689 12.3719 5.94315 12.6374 6.01901C12.9029 6.09487 13.0566 6.37162 12.9808 6.63713L12.3057 9H16.9291C16.4439 5.60771 13.5265 3 10 3Z", filledD: "M9.89 3.75a6.24 6.24 0 0 0-3.12.9L5.68 3.56a7.73 7.73 0 0 1 3.67-1.28l-.59-.59A.75.75 0 0 1 9.82.63l2.12 2.12c.3.3.3.77 0 1.06L9.82 5.93a.75.75 0 0 1-1.06-1.06L9.9 3.75ZM4.18 4.88a7.75 7.75 0 0 0 1.18 11.33.75.75 0 1 0 .9-1.2 6.25 6.25 0 0 1-1.02-9.06l8.81 8.8a6.23 6.23 0 0 1-3.94 1.5l1.13-1.12a.75.75 0 0 0-1.06-1.07L8.06 16.2c-.3.29-.3.76 0 1.06l2.12 2.12a.75.75 0 1 0 1.06-1.06l-.59-.59a7.72 7.72 0 0 0 4.47-1.9l2.03 2.03a.5.5 0 0 0 .7-.7l-15-15a.5.5 0 1 0-.7.7l2.03 2.03Zm11.17 8.35 1.09 1.09a7.75 7.75 0 0 0-1.8-10.53.75.75 0 0 0-.9 1.2 6.25 6.25 0 0 1 1.6 8.24Z", fluent: "arrow_sync_off_20_regular / arrow_sync_off_20_filled" },
  calendarClock: { d: "M17 5.5C17 4.11929 15.8807 3 14.5 3H5.5C4.11929 3 3 4.11929 3 5.5V14.5C3 15.8807 4.11929 17 5.5 17H9.59971C9.43777 16.6832 9.30564 16.3486 9.20703 16H5.5C4.67157 16 4 15.3284 4 14.5V7H16V9.20703C16.3486 9.30564 16.6832 9.43777 17 9.59971V5.5ZM5.5 4H14.5C15.3284 4 16 4.67157 16 5.5V6H4V5.5C4 4.67157 4.67157 4 5.5 4ZM14.5 19C16.9853 19 19 16.9853 19 14.5C19 12.0147 16.9853 10 14.5 10C12.0147 10 10 12.0147 10 14.5C10 16.9853 12.0147 19 14.5 19ZM14 12.5C14 12.2239 14.2239 12 14.5 12C14.7761 12 15 12.2239 15 12.5V14H16C16.2761 14 16.5 14.2239 16.5 14.5C16.5 14.7761 16.2761 15 16 15H14.5C14.2239 15 14 14.7761 14 14.5V12.5Z", filledD: "M17 5.5C17 4.11929 15.8807 3 14.5 3H5.5C4.11929 3 3 4.11929 3 5.5V6H17V5.5ZM17 9.59971V7H3V14.5C3 15.8807 4.11929 17 5.5 17H9.59971C9.21628 16.2499 9 15.4002 9 14.5C9 11.4624 11.4624 9 14.5 9C15.4002 9 16.2499 9.21628 17 9.59971ZM14.5 19C16.9853 19 19 16.9853 19 14.5C19 12.0147 16.9853 10 14.5 10C12.0147 10 10 12.0147 10 14.5C10 16.9853 12.0147 19 14.5 19ZM14 12.5C14 12.2239 14.2239 12 14.5 12C14.7761 12 15 12.2239 15 12.5V14H16C16.2761 14 16.5 14.2239 16.5 14.5C16.5 14.7761 16.2761 15 16 15H14.5C14.2239 15 14 14.7761 14 14.5V12.5Z", fluent: "calendar_clock_20_regular / calendar_clock_20_filled" },
  calendarMonth: { d: "M14.5 3C15.8807 3 17 4.11929 17 5.5V14.5C17 15.8807 15.8807 17 14.5 17H5.5C4.11929 17 3 15.8807 3 14.5V5.5C3 4.11929 4.11929 3 5.5 3H14.5ZM14.5 4H5.5C4.67157 4 4 4.67157 4 5.5V14.5C4 15.3284 4.67157 16 5.5 16H14.5C15.3284 16 16 15.3284 16 14.5V5.5C16 4.67157 15.3284 4 14.5 4ZM7 11C7.55228 11 8 11.4477 8 12C8 12.5523 7.55228 13 7 13C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11ZM10 11C10.5523 11 11 11.4477 11 12C11 12.5523 10.5523 13 10 13C9.44772 13 9 12.5523 9 12C9 11.4477 9.44772 11 10 11ZM7 7C7.55228 7 8 7.44772 8 8C8 8.55228 7.55228 9 7 9C6.44772 9 6 8.55228 6 8C6 7.44772 6.44772 7 7 7ZM10 7C10.5523 7 11 7.44772 11 8C11 8.55228 10.5523 9 10 9C9.44772 9 9 8.55228 9 8C9 7.44772 9.44772 7 10 7ZM13 7C13.5523 7 14 7.44772 14 8C14 8.55228 13.5523 9 13 9C12.4477 9 12 8.55228 12 8C12 7.44772 12.4477 7 13 7Z", filledD: "M14.5 3A2.5 2.5 0 0 1 17 5.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 3 14.5v-9A2.5 2.5 0 0 1 5.5 3h9ZM7 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z", fluent: "calendar_month_20_regular / calendar_month_20_filled" },
  contentView: { d: "M5 7C5 6.44772 5.44772 6 6 6H14C14.5523 6 15 6.44771 15 7V9C15 9.55228 14.5523 10 14 10H6C5.44772 10 5 9.55229 5 9V7ZM14 7H6V9H14V7ZM12 11C11.4477 11 11 11.4477 11 12V13C11 13.5523 11.4477 14 12 14H14C14.5523 14 15 13.5523 15 13V12C15 11.4477 14.5523 11 14 11H12ZM12 12H14V13H12V12ZM5 11.5C5 11.2239 5.22386 11 5.5 11H9.5C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12H5.5C5.22386 12 5 11.7761 5 11.5ZM5.5 13C5.22386 13 5 13.2239 5 13.5C5 13.7761 5.22386 14 5.5 14H9.5C9.77614 14 10 13.7761 10 13.5C10 13.2239 9.77614 13 9.5 13H5.5ZM3 6C3 4.34315 4.34315 3 6 3H14C15.6569 3 17 4.34315 17 6V14C17 15.6569 15.6569 17 14 17H6C4.34315 17 3 15.6569 3 14V6ZM6 4C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H14C15.1046 16 16 15.1046 16 14V6C16 4.89543 15.1046 4 14 4H6Z", filledD: "M14 7H6v2h8V7Zm-2 5h2v1h-2v-1ZM6 3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6ZM5 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7Zm7 4h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Zm-7 .5c0-.28.22-.5.5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Zm.5 1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1Z", fluent: "content_view_20_regular / content_view_20_filled" },
} as const


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
    // FINAL SIGN-OFF received — the rail-matches-page-background problem is fixed, hover still reads
    // as a real increase, and light app mode is unaffected.
    proposalNote:
      "Approved: oklch(0.18 0 0) for dark app mode only (light app mode's oklch(0.205 0 0) is " +
      "unchanged — no collision there against a white --background). Fixes the rail-matches-page-" +
      "background problem while staying below darkHoverBg so hover still reads as an increase.",
    proposedLight: "oklch(0.205 0 0)",
    proposedDark: "oklch(0.18 0 0)",
    approved: true,
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
    // FINAL SIGN-OFF received — visibly stronger against the rail surface, confirmed in both app
    // modes.
    proposalNote:
      "Approved: oklch(0.708 0 0) for both app modes (reuses the already-approved " +
      "onDarkSubtle value / the base theme's own --ring token) — visibly stronger against the rail " +
      "surface than the original candidate.",
    proposedLight: "oklch(0.708 0 0)",
    proposedDark: "oklch(0.708 0 0)",
    approved: true,
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
  /** Plain-language pointer to exactly where in the live Rail Sidebar this color state applies —
   * e.g. which menu, which row, which real component. Rendered as a caption above the swatches so
   * a reviewer never has to guess which part of the UI a token like "hoverBg"/"bgSubtle" refers to. */
  locationHint?: string
  /** When set, renders a small REAL, interactive composition (built from the actual bidezine
   * primitive involved — never hand-rolled markup) directly below the swatches, so the described
   * state can be seen/hovered/clicked live instead of only read about. */
  usageDemo?: "panel-header-menu" | "ellipsis-trigger"
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

/**
 * The itemized divergence list USED TO LIVE HERE, as a hand-written array of 154 rows.
 *
 * It was deleted at Sandbox Milestone 5, step 4, once the database path was proven to render
 * exactly the same thing — 154/154 rows compared field by field, including every visual
 * payload (scripts/check-corpus-equivalence.mjs). The corpus is authoritative while a component
 * is in the Sandbox (SANDBOX-SPEC §4.1) and the app now reads it over /api/corpus; keeping a
 * second hand-maintained copy here would guarantee the two drift.
 *
 * The immutable, versioned copy lives at db/snapshots/rail-sidebar.json, emitted from the
 * corpus by scripts/emit-corpus-snapshot.mjs. db/verify-import.mjs diffs the live corpus against
 * that frozen file, so unexplained drift fails a check while an intended change shows up as a
 * deliberate commit regenerating it.
 *
 * The TYPES above (DivergenceRow, DivergenceCategory, Visual, …) deliberately stay: they describe
 * the shape the app renders, which is now built from corpus rows in sandbox/src/data/corpus.ts.
 * So does everything else in this file — phases, blocking questions, risks, proposed tokens, logo
 * paths. None of that is corpus data, and none of it has anywhere in the schema to live yet.
 */





