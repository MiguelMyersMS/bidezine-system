// Design System — Spacing, radius, layout, and breakpoint constants.
// Import: import { SPACE, RADIUS, LAYOUT, BP } from "@miguel/design-system/layout"

// ── Spacing system (Radix 9-step scale, 4px grid) ──
export const SPACE = {
  0:  0,
  half: 2,   // Figma `scale` collection spaceHalf — half-step below SPACE[1] (4px), used for hairline-adjacent gaps
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  24,
  6:  32,
  7:  40,
  8:  48,
  9:  64,
} as const;

// ── Breakpoints (min-width, px) ──
export const BP = {
  xs:  520,
  sm:  768,
  md:  1024,
  lg:  1280,
  xl:  1640,
} as const;

// ── Layout constants ──
// Fixed dimensions for structural elements. Not theme-dependent.
export const LAYOUT = {
  // Sidebar
  railW:         54,
  panelW:        300,
  panelGap:      SPACE[2],   // 8 — gap between rail and panel (verified: Figma RailNav organism layout_52XY6Q gap:8px)

  // Hit targets
  hitTarget:     40,         // standard interactive (panel header, toolbar buttons)
  hitTargetLg:   44,         // touch-friendly (filter trigger)
  hitTargetSm:   36,         // compact (ellipsis, chevron, dismiss)
  hitTargetXs:   28,         // tiny (filter pane close)
  railButton:    38,         // rail icon buttons — Figma source of truth (RailButton atom, node 165:4188)

  // Content area
  contentMax:    1640,       // max-width for card grid
  contentPad:    SPACE[6],   // 32 — horizontal padding of content area

  // Cards
  cardBasis:     477.5,      // flex-basis for card columns
  cardMax:       500,        // max-width for card columns
  railBasis:     400,        // flex-basis for right rail
  gridMin:       280,        // min-width for in-range grid columns
  cardGap:       SPACE[5],   // 24 — gap between card groups

  // Filter pane
  filterW:       360,
  filterMaxH:    480,

  // Toggle
  toggleW:       36,
  toggleH:       20,
  toggleKnob:    16,

  // Interactive elements
  checkboxSize:  18,
  dotSize:       8,

  // Decorative
  bellSize:      144,        // reminder bell image
} as const;

// ── Menu / popover scroll-region rhythm ──
// Vertical gap between a popover's sticky header (e.g. Menu's search box) and the
// scroll region below it. Codifies the SPACE[2] rhythm used by Menu so the value
// is named — see AGENTS "Menu Scroll Geometry".
export const RHYTHM = {
  stickyHeaderGap: SPACE[2],   // 8 — sticky header → scroll region (NOTE: some menus use 10px; verify per spec)
} as const;

// ── Menu / popover width ──
// Canonical default width for ellipsis-triggered menu popovers.
// Source: Figma node 500:1772 ActionMenu, designedWidth: 240px (GR4 verified 2026-06-23).
export const MENU_DEFAULT_WIDTH = 240;

// ── Menu / popover gaps (non-standard spacing outside SPACE grid) ──
// These gaps appear in menu containers and don't align to the SPACE[n] scale.
// Used between sticky header and scroll region in some menu variants (MenuItemDark, RailMenu, NavPanelShell).
export const MENU_GAPS = {
  containerToScroll: 10,  // gap from sticky header (search, title) to scroll region — Figma spec
  rowToRow:          4,   // gap between rows in popover lists (SPACE[1] — consistent with Figma)
} as const;

// ── List row density tiers ──
// Row heights for list/menu items (Select, Slicer, Menu, dropdowns, etc.).
// Choose density based on list length and context — compact for dense BI lists,
// default for standard pickers, comfortable for touch/accessibility-first.
export const LIST_ROW = {
  compact:     28,   // dense lists (> ~12 options), Power BI compact tier
  default:     32,   // DS default, Microsoft Fluent 2 menu item
  comfortable: 40,   // touch / mobile / accessibility-first, Spectrum L
  multiline:   48,   // two-line items (label + description), Fluent 2 two-line menu item — see AGENTS "Popover Container Contract" rule 11
} as const;

// ── Border radius system ──
// Three interactive tiers (no fourth value allowed)
// Container radii are separate and size-based.
export const RADIUS = {
  // Interactive element tiers
  pill:    99,     // pills, chips, badges, action buttons, circular indicators
  rounded: 12,    // triggers, dropdown containers, logo-size buttons
  soft:    8,     // small utility buttons, nav items, inner controls, dropdown items
  xs:      4,     // tight icon buttons, inline control chips (e.g. CollapseButton)

  // Tooltip
  tooltip: 6,     // tooltip flyouts

  // Container-level (cards, panels, floating panes)
  container:   18,  // panels, rails
  containerSm: 16,  // cards, smaller panels
  containerLg: 20,  // large cards, right rail sections
} as const;
