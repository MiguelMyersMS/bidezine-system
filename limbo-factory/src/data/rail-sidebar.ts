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

export interface DecisionQuestion {
  id: string
  priority: number
  title: string
  context: string
  options: DecisionOption[]
  blocks: string
}

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
      { label: "(b) Drop the filled toggle entirely", detail: "Signal hover / active / browsing with color or opacity changes only \u2014 no fill change. Simplest, but changes RailNav's visual identity from the source." },
      { label: "(c) Extend the icon pipeline to support `filled` natively", detail: "Change icons/manifest.json's schema + build-icons.mjs so ANY icon can declare a filled variant going forward. Largest scope, but reusable for future components." },
    ],
  },
  {
    id: "q2",
    priority: 2,
    title: "Dark rail surface token family",
    blocks: "The entire rail color system \u2014 background, hover/active/pressed states, borders, on-dark text/icon colors",
    context:
      "The rail needs a coherent family of ~8 dark-surface-specific tokens (darkSurface, darkHoverBg, darkActiveBg, darkPressedBg, darkBorderStrong, onDark, onDarkHover, onDarkSubtle) with no bidezine equivalent. CLAUDE.md's core rule is that tokens are authored only in tokens/*.tokens.json \u2014 never hand-written inline.",
    options: [
      { label: "(a) Author a new dark-surface token group in tokens/base.tokens.json", detail: "Adds a dedicated token family, with light/dark values if they differ by app theme." },
      { label: "(b) Reuse existing sidebar / sidebar-foreground tokens where close enough", detail: "Add only the tokens that truly have no equivalent (e.g. the interactive overlay states)." },
      { label: "(c) Treat the rail as always-dark regardless of app theme", detail: "Fixed values in base.tokens.json rather than light/dark-split entries, since the rail's darkness is a RailNav design constant, not theme-driven." },
    ],
  },
  {
    id: "q3",
    priority: 3,
    title: "Default logo icon (IconLogo)",
    blocks: "The rail's default logo slot when no `logo` prop is supplied",
    context:
      "RailNav defaults to a custom IconLogo (the brand mark) when no logo prop is passed. It isn't in icons/manifest.json.",
    options: [
      { label: "(a) Add as a `custom` manifest entry", detail: "Same approach as AudioLinesIcon \u2014 you supply the SVG markup for the bidezine mark." },
      { label: "(b) Remove the default entirely", detail: "Require every consumer to always pass a logo prop explicitly." },
      { label: "(c) Use an existing Fluent icon as a placeholder default", detail: "Consumers can still override; avoids blocking on new artwork." },
    ],
  },
  {
    id: "q4",
    priority: 4,
    title: "Panel collapse icon (double-left chevron)",
    blocks: "The panel's collapse/expand button",
    context:
      "The panel collapse button uses IconChevronDoubleLeft, which is not in icons/manifest.json. Our manifest only has a single ChevronLeftIcon.",
    options: [
      { label: "(a) Add chevron_double_left_20_regular to the manifest", detail: "Needs verifying the slug exists in @fluentui/svg-icons before wiring it in." },
      { label: "(b) Use the existing single ChevronLeftIcon instead", detail: "No new manifest entry needed; slightly different visual meaning (single vs double chevron)." },
      { label: "(c) A different Fluent icon", detail: "You name the exact slug to use." },
    ],
  },
]

export type DivergenceStatus = "clean" | "decision" | "note"

export interface DivergenceRow {
  id: string
  what: string
  status: DivergenceStatus
  detail: string
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
      { id: "A-1", what: "IconEllipsis (\u201cMore\u201d trigger + panel-header ellipsis)", status: "note", detail: "MoreHorizontalIcon exists in our manifest, but the filled-hover toggle depends on Q1." },
      { id: "A-2", what: "IconChevronDown (disclosure chevron)", status: "note", detail: "ChevronDownIcon exists; same filled-toggle dependency as A-1, plus a 16px-in-20px-slot sizing note." },
      { id: "A-3", what: "IconLogo (default logo slot)", status: "decision", detail: "Not in our manifest \u2014 this is Q3." },
      { id: "A-4", what: "IconCheckmark (checked-row indicator)", status: "clean", detail: "CheckIcon exists in our manifest, used without the filled toggle here." },
      { id: "A-5", what: "IconSearch (search bar lead icon)", status: "clean", detail: "SearchIcon exists; API differs slightly (size/color props vs our className-only API) but no new icon needed." },
      { id: "A-6", what: "IconDismiss (search ClearButton)", status: "note", detail: "XIcon exists; depends on how ClearButton itself is rebuilt (see L-5)." },
      { id: "A-7", what: "IconChevronDoubleLeft (panel collapse button)", status: "decision", detail: "Not in our manifest \u2014 this is Q4." },
      { id: "A-8", what: "Consumer-supplied section icons", status: "note", detail: "Used with a filled toggle at 20px in both rail and panel header \u2014 structurally broken until Q1 resolves." },
      { id: "A-9", what: "The `filled` prop system itself", status: "decision", detail: "The single largest structural decision \u2014 this is Q1." },
    ],
  },
  {
    id: "B",
    name: "Colors \u2014 Dark Rail Surface",
    rows: [
      { id: "B-1", what: "darkSurface (rail background)", status: "decision", detail: "Closest bidezine token (sidebar, dark mode) is visually different \u2014 part of Q2." },
      { id: "B-2", what: "darkHoverBg (hover overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
      { id: "B-3", what: "darkActiveBg (active/selected overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
      { id: "B-4", what: "darkPressedBg (pressed overlay)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
      { id: "B-5", what: "darkBorderStrong (visible border on dark surface)", status: "decision", detail: "Our dark `border` token is far too subtle (10% opacity) for this use \u2014 part of Q2." },
      { id: "B-6", what: "onDark (on-dark text/icon, full strength)", status: "decision", detail: "sidebar-foreground is close but theme-tied, while RailNav's value is always-dark \u2014 part of Q2." },
      { id: "B-7", what: "onDarkHover (\u224885% opacity on-dark)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
      { id: "B-8", what: "onDarkSubtle (\u224850\u201360% opacity on-dark)", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
      { id: "B-9", what: "onDarkDisabled", status: "decision", detail: "No bidezine equivalent \u2014 part of Q2." },
    ],
  },
  {
    id: "C",
    name: "Colors \u2014 Light Panel Surface",
    rows: [
      { id: "C-1", what: "surface (panel background)", status: "note", detail: "Several near-equivalent tokens exist (background / card / sidebar) \u2014 needs the correct semantic pick." },
      { id: "C-2", what: "ink (full-strength text on light)", status: "clean", detail: "Maps directly to --foreground." },
      { id: "C-3", what: "textMuted (\u224860% subordinate text)", status: "clean", detail: "Maps directly to --muted-foreground." },
      { id: "C-4", what: "textSubtle (\u224840% faint text)", status: "decision", detail: "No exact match \u2014 noticeably different from muted-foreground's 60%." },
      { id: "C-5", what: "textDisabled (\u224830% very faint)", status: "decision", detail: "Bidezine uses opacity-50 on the whole element instead of a per-property color token." },
      { id: "C-6", what: "hoverBg (panel row hover)", status: "note", detail: "accent is the closest match; needs visual verification, especially in dark mode." },
      { id: "C-7", what: "bgSubtle (checked menu rows)", status: "note", detail: "muted matches the value but its semantic reads \u201clow-emphasis,\u201d not \u201cchecked.\u201d" },
      { id: "C-8", what: "activeBg (pressed panel-header menu rows)", status: "decision", detail: "No clean bidezine equivalent." },
      { id: "C-9", what: "pressedOverlay (ellipsis trigger pressed state)", status: "decision", detail: "No bidezine equivalent." },
      { id: "C-10", what: "focusOverlay (keyboard-focus fill)", status: "note", detail: "Our `ring` token may serve, but it's a ring not a fill \u2014 needs a decision." },
      { id: "C-11", what: "hairline (0.5px dividers)", status: "note", detail: "border token is close; the 0.5px (not 1px) weight needs to be preserved." },
      { id: "C-12", what: "borderStrong (inset pressed ring on light menu rows)", status: "decision", detail: "Our border token is too light for a \u201cstrong\u201d border." },
      { id: "C-13", what: "statusRedText (danger menu rows)", status: "clean", detail: "Maps directly to --destructive." },
      { id: "C-14", what: "onInk (text on filled-dark active panel row)", status: "clean", detail: "Maps to --primary-foreground." },
    ],
  },
  {
    id: "D",
    name: "Typography",
    rows: [
      { id: "D-1", what: "Font family: Inter", status: "decision", detail: "Our font-sans is a system-ui stack, no Inter installed. Inter is a free Google Font." },
      { id: "D-2", what: "headingS (panel title, ~16px/500)", status: "note", detail: "Depends on D-1; Tailwind text-base font-medium is structurally close." },
      { id: "D-3", what: "bodyM (default panel item, 14px/400)", status: "clean", detail: "Tailwind text-sm, once D-1 resolves." },
      { id: "D-4", what: "bodyS (panel-header menu rows, 13px/400)", status: "decision", detail: "No exact Tailwind step \u2014 12px or 14px are the nearest, 13px isn't a default utility." },
      { id: "D-5", what: "labelM (13px/500 \u2014 subtitle, checked rows, tooltip)", status: "decision", detail: "Same 13px gap as D-4." },
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
      { id: "F-1", what: "railW = 54px (rail column width)", status: "decision", detail: "Our Sidebar primitive's icon-rail width (3rem/48px) is close but not identical." },
      { id: "F-2", what: "railButton = 38px (icon button size)", status: "decision", detail: "Our Button default (h-9/36px) doesn't match exactly." },
      { id: "F-3", what: "panelW = 300px (default panel width)", status: "decision", detail: "Our Sidebar's default width is 16rem/256px \u2014 no exact match." },
      { id: "F-4", what: "panelGap = 8px", status: "clean", detail: "= SPACE[2] = gap-2 / ml-2." },
      { id: "F-5", what: "hitTarget = 40px (row minHeight, ADR-003)", status: "note", detail: "h-10 matches the value, but it's a deliberate density decision worth preserving intentionally, not just numerically." },
      { id: "F-6", what: "compact = 28px (NavRowShell minHeight)", status: "note", detail: "min-h-7 matches the value \u2014 but check against F-5 for a possible inconsistency in the origin code." },
      { id: "F-7", what: "FOOTER_MAX_HEIGHT = 122px (3-icon cap)", status: "decision", detail: "Computed constant with no bidezine equivalent; a 4th footer icon is silently clipped by design." },
      { id: "F-8", what: "PANEL_MIN_WIDTH = 240px", status: "clean", detail: "min-w-60 \u2014 document as a design constant." },
      { id: "F-9", what: "ITEM_SLOT = 42px (derived: railButton + SPACE[1])", status: "clean", detail: "Resolves automatically once F-2 and E-1 are decided \u2014 no separate decision needed." },
    ],
  },
  {
    id: "G",
    name: "Border Radius",
    rows: [
      { id: "G-1", what: "RADIUS.rounded = 12px (rail, panel, menus)", status: "decision", detail: "No exact bidezine token \u2014 radius-lg is 10px, radius-xl is 14px." },
      { id: "G-2", what: "RADIUS.soft = 8px (rows, overflow items)", status: "clean", detail: "Exact match: radius-md (0.5rem)." },
      { id: "G-3", what: "RADIUS.xs = 4px (menu button, chevron/icon slots)", status: "decision", detail: "Nearest bidezine token, radius-sm, is 6px \u2014 not exact." },
      { id: "G-4", what: "RADIUS.pill = 9999px", status: "clean", detail: "rounded-full." },
    ],
  },
  {
    id: "H",
    name: "Motion / Animation",
    rows: [
      { id: "H-1", what: "MOTION.fast (hover/press transitions)", status: "decision", detail: "No bidezine motion token \u2014 Tailwind's default transition-colors (150ms) is the nearest baseline." },
      { id: "H-2", what: "MOTION.medium (panel reveal duration)", status: "decision", detail: "No bidezine motion token." },
      { id: "H-3", what: "MOTION.ease (fast-transition easing curve)", status: "decision", detail: "No bidezine equivalent curve defined." },
      { id: "H-4", what: "MOTION.easeOut (panel reveal easing)", status: "decision", detail: "No bidezine equivalent." },
      { id: "H-5", what: "Panel reveal animation (width + margin-left)", status: "decision", detail: "Entirely custom CSS approach; no bidezine concept for this at all." },
      { id: "H-6", what: "Collapse animation (grid-template-rows, deterministic unmount)", status: "decision", detail: "Our Collapsible (Radix) is similar but implemented differently \u2014 the deterministic-unmount behavior must survive whichever approach is chosen." },
      { id: "H-7", what: "Chevron rotation (\u221290deg \u2192 0deg)", status: "clean", detail: "Tailwind transition-transform + data-state variants, once H-1's timing is decided." },
      { id: "H-8", what: "prefers-reduced-motion handling", status: "clean", detail: "Tailwind's motion-reduce: variant covers this; per-element implementation differs but the approach is compatible." },
    ],
  },
  {
    id: "I",
    name: "Elevation / Shadow",
    rows: [
      { id: "I-1", what: "elevation.mid (panel + both overflow menus)", status: "decision", detail: "No elevation token in bidezine; shadow-md/shadow-lg are the nearest Tailwind classes but may look different." },
    ],
  },
  {
    id: "J",
    name: "Z-Index",
    rows: [
      { id: "J-1", what: "Z.dropdown (overflow + panel-header menus)", status: "note", detail: "Likely maps cleanly to Tailwind's z-50, used by our own overlay components \u2014 verify once building starts." },
      { id: "J-2", what: "Z.rail (rail wrapper, load-bearing stacking context)", status: "decision", detail: "Explicitly flagged in the origin as a sanctioned exception; needs a value chosen for our app shell (above sticky headers, below modals)." },
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

export interface RiskNote {
  id: string
  title: string
  detail: string
}

export const notableRisks: RiskNote[] = [
  { id: "R-1", title: "Icon `filled` prop is absent from our pipeline", detail: "Breaks the entire hover/active visual model until Q1 resolves. Proceeding without it risks silently dropped filled states that pass type-checking but look broken." },
  { id: "R-2", title: "Dark surface token family has zero bidezine equivalents", detail: "The whole rail color system is missing. Authoring ad-hoc inline values would violate the tokens-only rule in CLAUDE.md." },
  { id: "R-3", title: "Inline CSS-in-JS is incompatible with our Tailwind v4 paradigm", detail: "A large, trap-prone mechanical translation task \u2014 some values have no Tailwind utility without arbitrary-value syntax." },
  { id: "R-4", title: "History of design instability in the origin", detail: "At least 7 visual decisions changed mid-development (button size, radius, panel typography, active-row background, etc.). Confirm which version is \u201cfinal\u201d before Build starts." },
  { id: "R-5", title: "Our own Sidebar primitive defines conflicting concepts", detail: "Both could be called \u201csidebar\u201d but are architecturally incompatible organisms \u2014 risk of consumer confusion and token collisions." },
  { id: "R-6", title: "The `Collapse` animation component isn't in the reference copy", detail: "Its behavior is documented but exact timing/easing values live only in the origin project's MOTION constants, not captured here \u2014 a documentation gap." },
  { id: "R-7", title: "Runtime <style> tag injection conflicts with our build-time CSS approach", detail: "Hostile to Tailwind v4's source(none)/@source pattern in CLAUDE.md if carried over as-is." },
  { id: "R-8", title: "RailButtonDark is exported from the origin package", detail: "Consumers compose their own utility items with it \u2014 our export chain (src/index.ts) must be ready at graduation time." },
  { id: "R-9", title: "Collapse's deterministic unmount isn't covered by Radix's CollapsibleContent by default", detail: "If Build uses Radix Collapsible, unmount timing must be verified against the behavior contract or it will be flagged as a regression by the Escalation agent." },
]

