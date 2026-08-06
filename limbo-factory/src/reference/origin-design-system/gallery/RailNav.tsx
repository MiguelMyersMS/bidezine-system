// RailNav — Two-part navigation: icon rail + collapsible secondary panel.
// Viewport-bounded, overflow-aware, keyboard-accessible.
//
// Height model:
//   The rail surface fills the full viewport height on the Y-axis (like a
//   traditional sidebar). On the X-axis it hugs its buttons (LAYOUT.railW = 54px, Figma 783:4716).
//   Footer items are pushed to the bottom via a flex spacer.
//
// Architecture:
//   - Rail surface: 54px dark navy icon column, full-height
//   - Panel surface: 300px default collapsible text panel, full-height with internal scroll
//   - Navigation model: "peek before committing" — panel open ≠ content change
//   - Overflow: excess rail items collapse into a "More" menu
//
// See docs/interaction-patterns.md for full behavior spec.

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTokens } from "../theme";
import { TYPE } from "../tokens";
import type { TokenSet } from "../tokens";
import { SPACE, LAYOUT, RADIUS, LIST_ROW } from "../layout";
import { MOTION, Z, elevation, SCROLL, FOCUS, FOCUS_GLOBAL_CSS, DISABLED, SELECT } from "../status";
import { Collapse } from "../motion";
import Badge from "./Badge";
import ClearButton from "./ClearButton";
import NavIndentLine from "./NavIndentLine";
import ExpandButton from "./ExpandButton";
import LogoSlotDark from "./LogoSlotDark";
import RailButtonDark from "./RailButtonDark";
import { IconEllipsis, IconChevronDown, IconLogo, IconCheckmark, IconSearch, IconDismiss } from "../icons";

// ── Reduced motion helper ──

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Transition helper ──

function transition(property: string, durationMs: number, easing: string, reduced: boolean): string {
  return reduced ? "none" : `${property} ${durationMs}ms ${easing}`;
}

// ── Types ──

/** Recursively check if any descendant matches the active item */
function hasActiveDescendant(children: RailPanelChild[], activeItem: string): boolean {
  return children.some(
    (c) => c.id === activeItem || (c.children ? hasActiveDescendant(c.children, activeItem) : false),
  );
}

/** Recursively collect the IDs of every node that has children (disclosure groups).
 *  Used by the built-in panel's "expand-all" menu action to open every group at once. */
function collectGroupIds(items: (RailPanelItem | RailPanelChild)[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      ids.push(item.id);
      ids.push(...collectGroupIds(item.children));
    }
  }
  return ids;
}

/** Collect the IDs of every group on the path to the active item (root → leaf), at ANY depth.
 *  Used to seed-expand the full active path so nested groups open too, not just the top-level. */
function collectActivePathGroupIds(items: (RailPanelItem | RailPanelChild)[], activeItem: string): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0 && hasActiveDescendant(item.children, activeItem)) {
      ids.push(item.id);
      ids.push(...collectActivePathGroupIds(item.children, activeItem));
    }
  }
  return ids;
}

/** A nav / overflow badge. A bare string renders the default NEUTRAL pill; `{ label, variant }`
 *  renders an accented pill — e.g. `variant: "info"` for the iris "New" badge (Figma 783:4748). */
export type RailBadge = string | { label: string; variant?: "neutral" | "info" };

export interface RailSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  items: RailPanelItem[];
  /** Optional panel-header title. The rail button's tooltip always uses `label`; when the panel
   *  header should read differently (e.g. tooltip "Revenue" but header "Azure Data Revenue"), set
   *  this. Falls back to `label` when omitted. */
  panelTitle?: string;
  /** Optional badge text (e.g. "New", "+23"). Rendered as the Badge atom in the overflow ("More")
   *  menu when this section is buried — the panel rows carry their own per-item badges. */
  badge?: RailBadge;
  /** When true, the rail button renders disabled (onDarkDisabled, no tooltip, non-interactive) —
   *  a "coming soon"/unavailable section. Applies to rail and footer buttons. */
  disabled?: boolean;
}

export interface RailPanelItem {
  id: string;
  label: string;
  /** Optional leading icon for the panel item */
  icon?: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  /** Optional nested children. Parent becomes a disclosure toggle, not a route.
   *  Supports multi-level nesting (recommended max 3 levels). */
  children?: RailPanelChild[];
  /** Optional badge text (e.g. "New", "+23") shown after the label. */
  badge?: RailBadge;
  /** When true, the row renders in the NavRow disabled state (textDisabled, no interaction). */
  disabled?: boolean;
  /** "Coming soon" placeholder: renders disabled (greyed, non-interactive) AND shows a leading
   *  disclosure chevron to signal it will become an expandable group later — even though it has no
   *  children yet. Implies `disabled`. (Figma: disabled nav rows that show a chevron.) */
  comingSoon?: boolean;
}

export interface RailPanelChild {
  id: string;
  label: string;
  /** Optional leading icon for the child item */
  icon?: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  /** Nested children for multi-level nesting.
   *  Supported contract: up to 3 levels. Depth beyond 3 triggers a dev-mode warning
   *  and is not guaranteed for visual density or accessibility. */
  children?: RailPanelChild[];
  /** Optional badge text (e.g. "New", "+23") shown after the label. */
  badge?: RailBadge;
  /** When true, the row renders in the NavRow disabled state (textDisabled, no interaction). */
  disabled?: boolean;
  /** "Coming soon" placeholder: renders disabled (greyed, non-interactive) AND shows a leading
   *  disclosure chevron to signal it will become an expandable group later — even though it has no
   *  children yet. Implies `disabled`. (Figma: disabled nav rows that show a chevron.) */
  comingSoon?: boolean;
}

/** An action item in the PanelHeaderMenu popover. */
export interface PanelHeaderMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  /** When true: bgSubtle background at rest, ink label, weight 500, checkmark on right. */
  checked?: boolean;
  /** Renders label in statusRedText and icon in statusRed. */
  danger?: boolean;
  disabled?: boolean;
}

export interface RailNavProps {
  sections: RailSection[];
  /** Footer navigation sections rendered as RailButtons in FooterSlot.
   *  These behave exactly like primary sections: tooltip, active/browsing states,
  *  and panel open/close via rail click. FooterSlot is ordered top-to-bottom,
  *  with Settings anchored at the very bottom when present. */
  footerSections?: RailSection[];
  /** Which section's content is currently displayed */
  activeSection: string;
  /** Which panel item is currently displayed */
  activeItem: string;
  /** Called when user clicks a panel item — commits navigation */
  onNavigate: (sectionId: string, itemId: string) => void;

  // Rail slots
  /** Logo / product mark at top of rail. Rendered above primary nav.
   *  Defaults to `<IconLogo />` when omitted. Pass `null` to suppress. */
  logo?: React.ReactNode | null;
  /** Called when logo is clicked. When provided, logo renders as an interactive button. */
  onLogoClick?: () => void;
  /** Tooltip text shown on logo hover. Default: "BiDezine". Also used as aria-label when interactive. */
  logoLabel?: string;
  /** Utility items in the bottom zone of the rail (theme toggle, profile, etc.). Separate from nav. */
  utilityItems?: React.ReactNode;
  /** @deprecated Use `utilityItems` instead. Rendered below utilityItems for compat. */
  footer?: React.ReactNode;

  // Panel control
  /** Controlled panel open state. Omit for uncontrolled mode. */
  panelOpen?: boolean;
  /** Callback when panel open state changes (controlled mode). `sectionId` is the newly-opened section, or null when closed. */
  onPanelChange?: (open: boolean, sectionId: string | null) => void;
  /**
   * When true, suppresses the built-in secondary panel rendering while keeping
   * all panel toggle state and callbacks active. Use when rendering your own
   * external panel driven by onPanelChange.
   */
  suppressBuiltinPanel?: boolean;

  // Overflow
  /** Max rail icons before overflow menu. Default: auto-computed from viewport. */
  maxVisibleRailItems?: number;

  // Accessibility
  /** Aria label for the rail nav landmark. Default: "Main navigation" */
  railAriaLabel?: string;
  /** Aria label for the overflow menu. Default: "More navigation options" */
  overflowLabel?: string;

  // Panel header menu
  /** Action items shown in the PanelHeaderMenu popover (ellipsis button in panel header).
   *  When omitted the button is not rendered.
   *
   *  Reserved item ids the built-in panel handles natively (no consumer wiring needed):
   *  - `"expand-all"`   — opens every disclosure group in the active panel section.
   *  - `"collapse-all"` — closes every group.
   *  `"search-box"` is consumer-owned: handle it in `onPanelMenuAction` by toggling
   *  the `searchable` prop, and reflect the state via the item's `checked` field.
   *  All ids (reserved or custom) still fire `onPanelMenuAction`. */
  panelMenuItems?: PanelHeaderMenuItem[];
  /** Called when the user activates a PanelHeaderMenu item. */
  onPanelMenuAction?: (itemId: string) => void;
  /** Aria label for the PanelHeaderMenu trigger button. Default: "Panel actions" */
  panelMenuAriaLabel?: string;

  // Panel content
  /** Group ids to expand on initial render, independent of the active-path auto-seed.
   *  Use to open specific disclosure groups by default (e.g. show a group expanded while a
   *  DIFFERENT leaf is active). This SEEDS the initial expanded set only — after mount, user
   *  toggles / expand-all / collapse-all take over; it is not re-applied on prop change. The
   *  active-path auto-seed (the chain to `activeItem`) still merges on top. */
  defaultExpandedGroups?: string[];
  /** Subtitle text shown below the section title in the panel header. */
  panelSubtitle?: string;
  /** When true, renders a search bar below the panel header.
   *  Search state is controlled: provide searchValue + onSearchChange. */
  searchable?: boolean;
  /** Controlled search input value. Only used when `searchable` is true. */
  searchValue?: string;
  /** Called when the search input value changes. Only used when `searchable` is true. */
  onSearchChange?: (value: string) => void;
}

// ── Constants ──

// Rail vertical budget (full-height surface):
//   surface padding: SPACE[2] (8) top + SPACE[2] (8) bottom = 16px
//   aside padding:   SPACE[2] (8) top/left/bottom, 0 right (flush right edge).
//   footer (when present): railButton (38) + gap SPACE[1] (4) = 42px
//   overflow button (when needed): railButton (38) + gap = 42px
// Rail icon slot height: railButton (38) + column gap (4) = 42px
const ITEM_SLOT = LAYOUT.railButton + SPACE[1];       // 42 per item
const FOOTER_MAX_ICONS = 3;
const FOOTER_MAX_HEIGHT = LAYOUT.railButton * FOOTER_MAX_ICONS + SPACE[1] * (FOOTER_MAX_ICONS - 1);
const PANEL_MIN_WIDTH = 240;

// ── Component ──

export default function RailNav({
  sections = [], // default to [] (consistent with footerSections) so <RailNav/> renders an empty rail
  //             instead of throwing on `sections.length` — consumer-test finding CD0.1 (2026-07-29).
  footerSections = [],
  activeSection,
  activeItem,
  onNavigate,
  logo,
  onLogoClick,
  logoLabel = "BiDezine",
  utilityItems,
  footer,
  panelOpen: controlledPanelOpen,
  onPanelChange,
  suppressBuiltinPanel = false,
  maxVisibleRailItems,
  railAriaLabel = "Main navigation",
  overflowLabel = "More navigation options",
  panelMenuItems,
  onPanelMenuAction,
  panelMenuAriaLabel = "Panel actions",
  defaultExpandedGroups,
  panelSubtitle,
  searchable = false,
  searchValue: controlledSearchValue,
  onSearchChange,
}: RailNavProps) {
  const tokens = useTokens();
  const elev = elevation(tokens);
  const reducedMotion = useReducedMotion();

  // Panel visibility is decoupled from active content
  const [internalOpenPanel, setInternalOpenPanel] = useState<string | null>(activeSection);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [computedMax, setComputedMax] = useState(sections.length);
  // Seed initial expansion from defaultExpandedGroups (uncontrolled initial state — the active-path
  // auto-seed merges on top; after mount, user toggles / expand-all / collapse-all own it).
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(defaultExpandedGroups ?? []));
  const [panelWidth, setPanelWidth] = useState<number>(LAYOUT.panelW);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const collapseSourceRef = useRef<string | null>(null);
  const panelResizeStartRef = useRef<{ clientX: number; width: number } | null>(null);
  // Tracks the activeSection::activeItem we last auto-seeded expansion for, so auto-expand
  // SEEDS ONCE per active item and never re-opens a group the user explicitly collapsed.
  const autoExpandSeededRef = useRef<string | null>(null);
  // Memoized so the auto-expand effect's deps are stable across renders (an unstable
  // `allSections` was what made auto-expand re-fire every render and fight user collapses).
  const allSections = useMemo(() => [...sections, ...footerSections], [sections, footerSections]);
  const orderedFooterSections = [...footerSections].sort((left, right) => {
    const leftIsSettings = left.id.toLowerCase() === "settings" || left.label.trim().toLowerCase() === "settings";
    const rightIsSettings = right.id.toLowerCase() === "settings" || right.label.trim().toLowerCase() === "settings";
    if (leftIsSettings === rightIsSettings) return 0;
    return leftIsSettings ? 1 : -1;
  });

  // Controlled vs uncontrolled panel state
  const isControlled = controlledPanelOpen !== undefined;
  const openPanel = isControlled
    ? (controlledPanelOpen ? internalOpenPanel : null)
    : internalOpenPanel;

  // When controlled panel is closed externally (e.g. consumer's collapse button),
  // reset internalOpenPanel to null so the next rail button click opens (not toggles-closed).
  // Uses setInternalOpenPanel directly (not setOpenPanel) to avoid re-firing onPanelChange.
  const prevControlled = useRef(controlledPanelOpen);
  useEffect(() => {
    if (isControlled && prevControlled.current && !controlledPanelOpen) {
      setInternalOpenPanel(null);
    }
    prevControlled.current = controlledPanelOpen;
  }, [isControlled, controlledPanelOpen]);

  const setOpenPanel = useCallback((updater: string | null | ((prev: string | null) => string | null)) => {
    const next = typeof updater === "function" ? updater(internalOpenPanel) : updater;
    // Track which section panel was showing so focus can return to its rail button
    if (next == null && internalOpenPanel != null) {
      collapseSourceRef.current = internalOpenPanel;
    }
    setInternalOpenPanel(next);
    if (onPanelChange) {
      onPanelChange(next != null, next);
    }
  }, [internalOpenPanel, onPanelChange]);

  // Return focus to the corresponding rail button after panel collapse
  useEffect(() => {
    if (openPanel == null && collapseSourceRef.current && railRef.current) {
      const btn = railRef.current.querySelector<HTMLButtonElement>(
        `button[data-section-id="${collapseSourceRef.current}"]`
      );
      if (btn) btn.focus();
      collapseSourceRef.current = null;
    }
  }, [openPanel]);

  // Auto-expand the FULL path of groups to the active item — but SEED ONCE per active item.
  // expandedGroups is the single source of truth (top-level AND nested); this effect only opens
  // the active path when navigation lands there, and must NEVER re-open a group the user later
  // collapsed (the previous version re-added it on every render, breaking manual + collapse-all).
  useEffect(() => {
    const seedKey = `${activeSection}::${activeItem}`;
    if (autoExpandSeededRef.current === seedKey) return; // already seeded for this active item
    autoExpandSeededRef.current = seedKey;
    const section = allSections.find((s) => s.id === activeSection);
    if (!section) return;
    const pathIds = collectActivePathGroupIds(section.items ?? [], activeItem); // guard: a section may omit items (CD0.3)
    if (pathIds.length === 0) return;
    setExpandedGroups((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of pathIds) if (!next.has(id)) { next.add(id); changed = true; }
      return changed ? next : prev;   // same ref when nothing changed → React bails out
    });
  }, [activeSection, activeItem, allSections]);

  // Compute how many items fit in the rail surface.
  // We observe the rail surface container (railRef) and subtract the measured
  // heights of logo and footer siblings.  This avoids placing overflow styles
  // on the nav wrapper, which would clip absolutely-positioned tooltips and
  // the overflow menu that pop out to the right.
  const logoSlotRef = useRef<HTMLDivElement>(null);
  const footerSlotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (maxVisibleRailItems != null) {
      setComputedMax(maxVisibleRailItems);
      return;
    }
    const rail = railRef.current;
    if (!rail) return;
    const compute = () => {
      const totalHeight = rail.clientHeight;
      const railPadding = SPACE[2] * 2; // top + bottom padding
      const logoH = logoSlotRef.current?.offsetHeight ?? 0;
      const footerH = Math.min(footerSlotRef.current?.offsetHeight ?? 0, FOOTER_MAX_HEIGHT);
      // Count gaps: column gap between logo/nav and nav/footer
      const gapCount = (logoH > 0 ? 1 : 0) + (footerH > 0 ? 1 : 0);
      const gaps = gapCount * SPACE[1];
      const navBudget = totalHeight - railPadding - logoH - footerH - gaps;
      const fits = Math.max(0, Math.floor(navBudget / ITEM_SLOT));
      setComputedMax(fits);
    };
    const ro = new ResizeObserver(compute);
    ro.observe(rail);
    compute();
    return () => ro.disconnect();
  }, [maxVisibleRailItems]);

  // Outside-click for overflow menu is now handled inside the portal OverflowMenu component (Golden Rule #3).

  useEffect(() => {
    if (!isResizingPanel) return;
    const handleMouseMove = (event: MouseEvent) => {
      const start = panelResizeStartRef.current;
      if (!start) return;
      const viewportMax = Math.max(LAYOUT.panelW, window.innerWidth - LAYOUT.railW - LAYOUT.panelGap - SPACE[6]);
      const nextWidth = Math.max(PANEL_MIN_WIDTH, Math.min(viewportMax, start.width + event.clientX - start.clientX));
      setPanelWidth(nextWidth);
    };
    const handleMouseUp = () => {
      setIsResizingPanel(false);
      panelResizeStartRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingPanel]);

  const handlePanelResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    panelResizeStartRef.current = { clientX: event.clientX, width: panelWidth };
    setIsResizingPanel(true);
  }, [panelWidth]);

  // Determine visible vs overflow sections
  const needsOverflow = sections.length > computedMax;
  // When overflow is needed, the "More" button consumes the final available top slot.
  const visibleCount = needsOverflow ? Math.max(0, computedMax - 1) : sections.length;
  const visibleSections = sections.slice(0, visibleCount);
  const overflowSections = needsOverflow ? sections.slice(visibleCount) : [];
  const activeInOverflow = overflowSections.some((s) => s.id === activeSection);

  const handleRailClick = (sectionId: string) => {
    const wasOverflowOpen = overflowOpen;
    setOverflowOpen(false);
    // Leaf section (no sub-panel items): the section IS the destination — commit navigation
    // directly (itemId = sectionId) instead of peek-toggling an empty panel, and close any open
    // panel. Without this a childless section is a dead, unselectable button. (finding R1.OWN1)
    const section = allSections.find((s) => s.id === sectionId);
    const isLeaf = section != null && (section.items ?? []).length === 0;
    if (isLeaf) {
      setOpenPanel(null);
      onNavigate(sectionId, sectionId);
    } else {
      setOpenPanel((prev) => (prev === sectionId ? null : sectionId));
    }
    // Return focus to overflow trigger when closing via menu item selection
    if (wasOverflowOpen) overflowBtnRef.current?.focus();
  };

  const handlePanelItemClick = (sectionId: string, itemId: string) => {
    onNavigate(sectionId, itemId);
  };

  // Keyboard: Escape closes panel and overflow menu
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (overflowOpen) {
        setOverflowOpen(false);
        overflowBtnRef.current?.focus();
      } else if (openPanel != null) {
        setOpenPanel(null);
      }
    }
  }, [overflowOpen, openPanel]);

  const panelSection = allSections.find((s) => s.id === openPanel);
  // suppressBuiltinPanel hides the built-in secondary panel while keeping all toggle logic active.
  // Use when rendering an external SidebarPanel driven by onPanelChange.
  const isPanelVisible = !suppressBuiltinPanel && panelSection != null && (panelSection.items ?? []).length > 0; // guard items (CD0.3)

  // Detect if panel nav is scrollable → add right padding only when scrollbar visible
  const panelNavRef = useRef<HTMLElement>(null);
  const [navScrollable, setNavScrollable] = useState(false);
  useEffect(() => {
    const el = panelNavRef.current;
    if (!el) { setNavScrollable(false); return; }
    const check = () => setNavScrollable(el.scrollHeight > el.clientHeight);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => ro.disconnect();
  }, []);

  return (
    <aside
      onKeyDown={handleKeyDown}
      style={{
        flexShrink: 0,
        padding: `${SPACE[2]}px 0 ${SPACE[2]}px ${SPACE[2]}px`,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        boxSizing: "border-box",
        // Own stacking level so the rail + flyout panel elevation shadow always paint
        // above the app's sticky header/slicer band (Z.sticky). Menus/dialogs still sit
        // on top because they portal to <body> with position: fixed (Z.rail is scoped
        // inside #root and never competes with them). owner-caught 2026-07-20.
        // LOAD-BEARING — do NOT strip `position:relative` + `zIndex:Z.rail` as an
        // "unnecessary stacking context" (AGENTS.md stacking rule #1). Without it a
        // consumer's sticky header/slicer band clips the rail's elevation shadow. It is a
        // SANCTIONED exception: safe because all overlays portal out (Golden Rule #3).
        // See AGENTS.md § "Stacking Contexts & Overlays".
        position: "relative",
        zIndex: Z.rail,
        // Height is inherited from the flex parent (the app shell).
        // The parent constrains via height: 100dvh / 100vh + overflow: hidden.
      }}
    >
      {/* DS scroll-region scrollbar styles (shared convention) */}
      <style>{SCROLL.css(tokens)}</style>
      {/* DS focus-visible ring (light + dark surface variants) */}
      <style>{FOCUS_GLOBAL_CSS(tokens, tokens.onDark)}</style>
      {/* ── Primary Rail (full-height surface) ── */}
      <div
        ref={railRef}
        data-dark-surface
        style={{
          flexShrink: 0,
          width: LAYOUT.railW,
          minWidth: LAYOUT.railW,
          boxSizing: "border-box",
          background: tokens.darkSurface,
          borderRadius: RADIUS.rounded,    // Figma: 12px (GR4 — corrected from RADIUS.container)
          padding: `${SPACE[2]}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: SPACE[4],  // Figma 166:4494 — outer gap between logo/nav/footer = 16px per RailNav Gap Contract
          position: "relative",
        }}
      >
        {/* Logo slot — rendered above nav, outside landmark.
            Constrained to rail button grid (40×40 content area).
            Defaults to <IconLogo /> when omitted. Pass logo={null} to suppress. */}
        {logo !== null && (
          <div ref={logoSlotRef}>
            <LogoSlotDark
              content={logo ?? <IconLogo />}
              onClick={onLogoClick}
              label={logoLabel}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* Nav section — fills remaining space between logo and footer.
            No overflow styles here: tooltips and overflow menu are absolutely-
            positioned and must escape this container.  Overflow budget is
            computed from railRef height minus logo/footer measured heights.
            GR3: Tooltips should use portal+fixed; removing overflow: clip to prevent clipping. */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <nav
            aria-label={railAriaLabel}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: SPACE[1],
            }}
          >
            {visibleSections.map((section) => (
              <RailButtonDark
                key={section.id}
                section={section}
                active={activeSection === section.id}
                browsing={openPanel === section.id && activeSection !== section.id}
                onClick={() => handleRailClick(section.id)}
                reducedMotion={reducedMotion}
              />
            ))}

            {/* Overflow "More" menu — Radix DropdownMenu engine, DS-dark re-skin.
                The overflow POLICY (overflowSections) is computed above and unchanged; this only
                renders the trigger + already-computed buried sections. */}
            {needsOverflow && (
              <OverflowMenu
                open={overflowOpen}
                onOpenChange={setOverflowOpen}
                triggerRef={overflowBtnRef}
                active={activeInOverflow}
                ariaLabel={overflowLabel}
                sections={overflowSections}
                activeSection={activeSection}
                openPanel={openPanel}
                onRailClick={handleRailClick}
                tokens={tokens}
                elev={elev}
                reducedMotion={reducedMotion}
              />
            )}
          </nav>
        </div>

        {/* FooterSlot — pinned at bottom, never squeezed.
            Ordering is top-to-bottom like the primary rail column; Settings is always bottom-most. */}
        {(footerSections.length > 0 || utilityItems || footer) && (
          <div ref={footerSlotRef} style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: SPACE[1],
            maxHeight: FOOTER_MAX_HEIGHT,
          }}>
            {utilityItems}
            {footer}
            {orderedFooterSections.map((section) => (
              <RailButtonDark
                key={section.id}
                section={section}
                active={activeSection === section.id}
                browsing={openPanel === section.id && activeSection !== section.id}
                onClick={() => handleRailClick(section.id)}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Secondary Panel (content-sized, scroll when needed) ── */}
      <SidebarPanel
        isPanelVisible={isPanelVisible}
        panelWidth={panelWidth}
        reducedMotion={reducedMotion}
        panelSection={panelSection}
        tokens={tokens}
        elev={elev}
        panelMenuItems={panelMenuItems}
        setExpandedGroups={setExpandedGroups}
        onPanelMenuAction={onPanelMenuAction}
        panelMenuAriaLabel={panelMenuAriaLabel}
        setOpenPanel={setOpenPanel}
        panelSubtitle={panelSubtitle}
        searchable={searchable}
        controlledSearchValue={controlledSearchValue}
        internalSearchValue={internalSearchValue}
        setInternalSearchValue={setInternalSearchValue}
        searchInputRef={searchInputRef}
        onSearchChange={onSearchChange}
        navScrollable={navScrollable}
        panelNavRef={panelNavRef}
        expandedGroups={expandedGroups}
        activeItem={activeItem}
        activeSection={activeSection}
        handlePanelItemClick={handlePanelItemClick}
        isResizingPanel={isResizingPanel}
        handlePanelResizeStart={handlePanelResizeStart}
      />
    </aside>
  );
}

// ── Sidebar Panel (built-in secondary panel) ──
//
// Cycle 1a unification seam: the built-in secondary panel JSX extracted verbatim
// from RailNav into a single internal component. Pure refactor — every value the
// JSX closed over is now threaded in as a prop with the SAME name. Behavior and
// rendered output are byte-for-byte identical.
/** Recursively filter panel items by a query: keep a node whose label matches (with all its
 *  children), else keep it only if a descendant matches (with just the matching subtree).
 *  Empty query returns the list unchanged. Generic so it works for RailPanelItem and
 *  RailPanelChild alike. */
function filterRailItems<T extends { label: string; children?: T[] }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.reduce<T[]>((acc, item) => {
    if (item.label.toLowerCase().includes(q)) {
      acc.push(item);
    } else if (item.children && item.children.length > 0) {
      const filtered = filterRailItems(item.children, q);
      if (filtered.length > 0) acc.push({ ...item, children: filtered });
    }
    return acc;
  }, []);
}

interface SidebarPanelProps {
  isPanelVisible: boolean;
  panelWidth: number;
  reducedMotion: boolean;
  panelSection: RailSection | undefined;
  tokens: TokenSet;
  elev: ReturnType<typeof elevation>;
  panelMenuItems?: PanelHeaderMenuItem[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  onPanelMenuAction?: (itemId: string) => void;
  panelMenuAriaLabel: string;
  setOpenPanel: (updater: string | null | ((prev: string | null) => string | null)) => void;
  panelSubtitle?: string;
  searchable: boolean;
  controlledSearchValue?: string;
  internalSearchValue: string;
  setInternalSearchValue: React.Dispatch<React.SetStateAction<string>>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchChange?: (value: string) => void;
  navScrollable: boolean;
  panelNavRef: React.RefObject<HTMLElement | null>;
  expandedGroups: Set<string>;
  activeItem: string;
  activeSection: string;
  handlePanelItemClick: (sectionId: string, itemId: string) => void;
  isResizingPanel: boolean;
  handlePanelResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function SidebarPanel({
  isPanelVisible,
  panelWidth,
  reducedMotion,
  panelSection,
  tokens,
  elev,
  panelMenuItems,
  setExpandedGroups,
  onPanelMenuAction,
  panelMenuAriaLabel,
  setOpenPanel,
  panelSubtitle,
  searchable,
  controlledSearchValue,
  internalSearchValue,
  setInternalSearchValue,
  searchInputRef,
  onSearchChange,
  navScrollable,
  panelNavRef,
  expandedGroups,
  activeItem,
  activeSection,
  handlePanelItemClick,
  isResizingPanel,
  handlePanelResizeStart,
}: SidebarPanelProps) {
  // Search filtering (1c): when searchable + a query is present, filter the rendered tree and
  // force every surviving group open so matches are visible. Empty query → normal list/state.
  const searchQuery = (controlledSearchValue ?? internalSearchValue ?? "").trim();
  const searching = searchable && searchQuery.length > 0;
  const visibleItems = searching ? filterRailItems(panelSection?.items ?? [], searchQuery) : (panelSection?.items ?? []);
  // Single toggle for groups at ANY depth — expandedGroups is the one source of truth, so
  // expand-all / collapse-all and seed-once reach nested sub-groups, not just top-level.
  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // Elevation-shadow clipping fix: the wrapper needs overflow:hidden to clip the fixed-width
  // panel during the open/close WIDTH animation — but that also truncates the panel's
  // `boxShadow: elev.mid`. So clip only while transitioning (or closed), and reveal
  // (overflow: visible) once the panel is open + settled, letting the shadow escape.
  const [panelTransitioning, setPanelTransitioning] = useState(false);
  const prevVisibleRef = useRef(isPanelVisible);
  useEffect(() => {
    if (prevVisibleRef.current === isPanelVisible) return;
    prevVisibleRef.current = isPanelVisible;
    if (reducedMotion) return;                 // instant change → no animation, no need to clip
    setPanelTransitioning(true);
    const t = setTimeout(() => setPanelTransitioning(false), MOTION.medium + 80);
    return () => clearTimeout(t);
  }, [isPanelVisible, reducedMotion]);
  const wrapperOverflow = isPanelVisible && !panelTransitioning ? "visible" : "hidden";

  return (
      <div
        aria-hidden={!isPanelVisible}
        style={{
          width: isPanelVisible ? panelWidth : 0,
          marginLeft: isPanelVisible ? LAYOUT.panelGap : 0,
          overflow: wrapperOverflow,
          alignSelf: "stretch",
          position: "relative",
          // panelReveal preset: MOTION.medium · easeOut (gentle decelerate; visible across the slide).
          // While RESIZING, drop the `width` transition so the panel tracks the drag 1:1 (no lag) — matching
          // the FilterPane. The open/collapse width animation still applies when not resizing.
          transition: [
            isResizingPanel ? null : transition("width", MOTION.medium, MOTION.easeOut, reducedMotion),
            transition("margin-left", MOTION.medium, MOTION.easeOut, reducedMotion),
          ].filter(Boolean).join(", "),
          display: "flex",
          flexDirection: "column",
        }}
      >
        {panelSection && (
          <div
            style={{
              flex: 1,
              width: panelWidth,
              minWidth: panelWidth,
              minHeight: 0,                  // scroll chain: don't grow beyond the flex parent's height
              background: tokens.surface,
              borderRadius: RADIUS.rounded,   // Figma: 12px (GR4 — corrected from RADIUS.container)
              boxShadow: elev.mid,           // Figma 224:3458 SidebarPanel — elevation.mid (GR4)
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Panel header section — Figma 224:3458 layout_T1WEW8 wraps PanelHeader with 8px padding */}
            <div style={{ padding: `${SPACE[2]}px`, borderRadius: RADIUS.rounded, flexShrink: 0 }}>
              {/* PanelHeader molecule — Figma 209:3944 layout_4DMLH3: 4px padding, borderRadius 8px.
                  COLUMN: Header/Row (icon + title + menu + collapse) above Header/SubtitleRow. */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACE[1],  // 4px between the title row and the subtitle row (Figma PanelHeader gap:4, audit LOW-6)
                  padding: `${SPACE[1]}px`,  // Figma 209:3944 PanelHeader — 4px uniform (GR4)
                  borderRadius: RADIUS.soft,  // Figma layout_4DMLH3: borderRadius 8px
                }}
              >
                {/* Header/Row — icon + title + menu + collapse */}
                <div style={{ display: "flex", alignItems: "center", gap: SPACE[2] }}>
                  {/* Section icon — leading 20×20 icon in panel header */}
                  {panelSection.icon && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                    }}>
                      <panelSection.icon size={20} color={tokens.ink} filled />
                    </span>
                  )}
                  <span style={{
                    ...TYPE.headingS,
                    color: tokens.ink,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {panelSection.panelTitle ?? panelSection.label}
                  </span>
                  {panelMenuItems && panelMenuItems.length > 0 && (
                    <PanelHeaderMenuButton
                      items={panelMenuItems}
                      onAction={(id) => {
                        // The built-in panel natively handles the reserved
                        // "expand-all" / "collapse-all" actions against its own
                        // expandedGroups — it owns the panel tree + state, the
                        // same way a consumer owns an external panel.
                        // "search-box" stays consumer-owned (toggles `searchable`).
                        // Every id still forwards to onPanelMenuAction so consumers
                        // can react / record telemetry / toggle search visibility.
                        if (id === "expand-all") {
                          setExpandedGroups(new Set(collectGroupIds(panelSection?.items ?? [])));
                        } else if (id === "collapse-all") {
                          setExpandedGroups(new Set());
                        }
                        onPanelMenuAction?.(id);
                      }}
                      ariaLabel={panelMenuAriaLabel}
                      tokens={tokens}
                      elev={elev}
                      reducedMotion={reducedMotion}
                    />
                  )}
                  <ExpandButton
                    onClick={() => setOpenPanel(null)}
                    open={true}
                    ariaLabel="Collapse sidebar"
                  />
                </div>

                {/* Header/SubtitleRow — indented 28px (icon 20 + gap 8) to align under the title */}
                {panelSubtitle && (
                  <div style={{ display: "flex", alignItems: "flex-start", paddingBottom: SPACE[1], paddingLeft: 28 }}>
                    <span style={{
                      // Figma PanelHeader subtitle = TYPE/labelM (Inter 13/500) + textSubtle. The owner
                      // rebound this in Figma on 2026-07-31 (node 209:3965) and PanelHeader.tsx was
                      // updated in 21907be — but this panel renders its OWN copy of the panel header
                      // rather than composing the PanelHeader molecule, so that change never reached
                      // here and the subtitle kept rendering at bodyM (14/400).
                      // Was TYPE.caption (12px) — owner-caught 2026-07-20; then bodyM until 2026-08-01.
                      ...TYPE.labelM,
                      color: tokens.textSubtle,
                      // 1d: subtitle WRAPS — container hugs y / fills x (Figma PanelHeader 209:3944).
                      // Was nowrap + ellipsis (single-line truncation). Title above still truncates.
                      whiteSpace: "normal",
                    }}>
                      {panelSubtitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider — Figma 224:3458: 0.5px hairline between header and search/nav */}
            <div aria-hidden="true" style={{ height: 0, borderTop: `0.5px solid ${tokens.hairline}`, flexShrink: 0 }} />

            {/* Search bar section — Figma PanelSearchBar (layout_HNC5RS). Borderless row per Golden Rule #1. */}
            {searchable && (
              <>
                {/* PanelSearchBar FRAME: padding 4px 8px, borderRadius 12px (layout_65ZHPK) */}
                <div style={{ padding: `${SPACE[1]}px ${SPACE[2]}px`, borderRadius: RADIUS.rounded, flexShrink: 0 }}>
                  {/* SearchBar molecule — borderless input row (Golden Rule #1, layout_Z739IS) */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACE[2],
                    padding: SELECT.searchPaddingY,
                    background: tokens.surface,
                  }}>
                    {/* Search/Icon — Icon/Slot 18×18, empty→textSubtle, has-value→textMuted */}
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: RADIUS.xs,
                      flexShrink: 0,
                    }}>
                      <IconSearch size={16} color={(controlledSearchValue ?? internalSearchValue) ? tokens.textMuted : tokens.textSubtle} />
                    </span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search..."
                      value={controlledSearchValue ?? internalSearchValue}
                      onChange={e => {
                        const v = e.target.value;
                        if (onSearchChange) onSearchChange(v);
                        else setInternalSearchValue(v);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          const val = controlledSearchValue ?? internalSearchValue;
                          if (val) {
                            if (onSearchChange) onSearchChange("");
                            else setInternalSearchValue("");
                          }
                        }
                      }}
                      style={{
                        ...TYPE.bodyM,
                        color: (controlledSearchValue ?? internalSearchValue) ? tokens.ink : tokens.textSubtle,
                        flex: 1,
                        minWidth: 0,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        padding: 0,
                        textAlign: "left" as const,  // Figma textAlignHorizontal:LEFT
                      }}
                    />
                    {/* Search/ClearButton — reserved 24×24 slot, visibility:hidden when empty */}
                    <ClearButton
                      visible={!!(controlledSearchValue ?? internalSearchValue)}
                      onClick={() => {
                        if (onSearchChange) onSearchChange("");
                        else setInternalSearchValue("");
                        searchInputRef.current?.focus();
                      }}
                    />
                  </div>
                </div>
                {/* Divider below search */}
                <div aria-hidden="true" style={{ height: 0, borderTop: `0.5px solid ${tokens.hairline}`, flexShrink: 0 }} />
              </>
            )}

            {/* NavPanelShell FRAME — two-layer scroll (AGENTS § Scroll Regions).
                Outer shell owns padding (SPACE[2]) + overflow:hidden + flex column;
                inner <nav> owns the scroll (overflowY:auto, flex:1, minHeight:0). */}
            <div style={{
              padding: `${SPACE[2]}px`,  // Figma 224:3458 NavPanelShell layout_T1WEW8: padding 8px (GR4)
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              flex: 1,
            }}>
              <nav
                ref={panelNavRef}
                aria-label={`${panelSection.label} items`}
                className={SCROLL.className}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACE.half,    // Figma NavPanel gap: 2px (NOT SPACE[1])
                  overflowY: "auto",
                  flex: 1,
                  minHeight: 0,
                  // Conditional scrollbar gutter ONLY when scrollable (SC.UNCONDITIONAL-SCROLLBAR-GAP).
                  paddingRight: navScrollable ? SPACE[2] : 0,
                }}
              >
                {visibleItems.map((item, i) => {
                  const isLastSibling = i === visibleItems.length - 1;
                  // Item with children = disclosure group (not a route itself)
                  if (item.children && item.children.length > 0) {
                    const expanded = searching ? true : expandedGroups.has(item.id);
                    const hasActiveChild = hasActiveDescendant(item.children, activeItem) &&
                      activeSection === panelSection.id;
                    return (
                      <PanelGroup
                        key={item.id}
                        item={item}
                        expanded={expanded}
                        hasActiveChild={hasActiveChild}
                        onToggle={() => toggleGroup(item.id)}
                        expandedGroups={expandedGroups}
                        onToggleGroup={toggleGroup}
                        searching={searching}
                        activeItem={activeItem}
                        sectionId={panelSection.id}
                        onNavigate={(childId) =>
                          handlePanelItemClick(panelSection.id, childId)
                        }
                        tokens={tokens}
                        reducedMotion={reducedMotion}
                      />
                    );
                  }

                  // Flat item (leaf route)
                  const selected =
                    activeSection === panelSection.id && activeItem === item.id;
                  return (
                    <PanelItem
                      key={item.id}
                      item={item}
                      selected={selected}
                      onClick={() =>
                        handlePanelItemClick(panelSection.id, item.id)
                      }
                      tokens={tokens}
                      isLastSibling={isLastSibling}
                    />
                  );
                })}
              </nav>
            </div>
          </div>
        )}
        {isPanelVisible && (
          <div
            role="separator"
            aria-label="Resize sidebar panel"
            aria-orientation="vertical"
            onMouseDown={handlePanelResizeStart}
            style={{
              // Inset the grip WITHIN the panel's right edge (centered in the 8px hit area) — matching the
              // FilterPane grip, which sits just inside the border, NOT straddling it (removed translateX).
              position: "absolute",
              top: 0,
              right: 0,
              width: SPACE[2],
              height: "100%",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: Z.dropdown,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                // Matches the FilterPane resize grip (owner 2026-07-29): 3×32 pill, hairline at rest,
                // ink while dragging — the same look/behavior, mirrored to this right-edge handle.
                width: 3,
                height: 32,
                borderRadius: RADIUS.pill,
                background: isResizingPanel ? tokens.ink : tokens.hairline,
              }}
            />
          </div>
        )}
      </div>
  );
}

// ── Overflow "More" menu (Radix DropdownMenu engine, DS-dark re-skin) ──
//
// PRIMITIVES-FIRST borrow (docs/process/PRIMITIVES-FIRST-METHOD.md): the popup MECHANISM
// (portal, positioning, roving focus, typeahead, outside-dismiss, Escape, focus-return-to-
// trigger) is delegated to @radix-ui/react-dropdown-menu — the same wrap-a-Radix-primitive
// pattern proven in Dialog.tsx. The overflow POLICY (which sections are buried) is unchanged
// and computed in the parent; this component only RENDERS the already-computed sections.
//
// Every visual comes from DS tokens (coherence contract §3): the trigger reproduces the
// former OverflowButton (dark hover/active bg, IconEllipsis, active-in-overflow dot); the
// content reproduces the former OverflowMenu box (darkSurface, darkBorderStrong hairline,
// RADIUS.rounded, elev.mid, width 180); each item reproduces the RailMenu per-state contract.
//
// Radix mapping of RAILNAV-BEHAVIOR-CONTRACT §A/§E/§F assertions:
//   A10  active-in-overflow dot → rendered on the trigger while `active && !open`
//   A13  focus returns to trigger on select → Radix default (Trigger regains focus on close)
//   E5   first item auto-focused on open → Radix Menu focuses the first item on open
//   F1   portal + fixed positioning → DropdownMenu.Portal + Popper `position: fixed`
//   F2   opens RIGHT of trigger, collision-flips → side="right" align="start" + avoidCollisions
//   F4   outside-click dismiss (both trigger + content checked) → Radix DismissableLayer
//   F5   Arrow roving (wrap), Home/End, Escape → Radix RovingFocus (loop) + Menu key handling
//   F6   items roving (tabIndex -1, not in tab order) → Radix Menu.Item roving
//   F7   full nav per-state visuals → reproduced below
//   F8   internally scrollable + conditional gutter + height cap → available-height var + scroll

const OverflowTriggerButton = React.forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    open: boolean;
    tokens: TokenSet;
    reducedMotion: boolean;
    ariaLabel: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function OverflowTriggerButton(
  { active, open, tokens, reducedMotion, ariaLabel, ...props },
  ref,
) {
  const [hovered, setHovered] = useState(false);

  const bg = open
    ? tokens.darkActiveBg
    : hovered
      ? tokens.darkHoverBg
      : "transparent";

  const color = open || hovered ? tokens.onDarkHover : tokens.onDarkSubtle;

  return (
    <button
      ref={ref}
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      style={{
        width: LAYOUT.railButton,
        height: LAYOUT.railButton,
        borderRadius: RADIUS.soft,
        background: bg,
        border: "1.5px solid transparent",
        boxSizing: "border-box",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        position: "relative",
        transition: transition("background", MOTION.fast, MOTION.ease, reducedMotion),
      }}
    >
      <IconEllipsis size={20} color="currentColor" filled={open || hovered} />
      {/* A10 — active-in-overflow indicator dot; hidden while the menu is open. */}
      {active && !open && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: RADIUS.pill,
            background: tokens.onDark,
          }}
        />
      )}
    </button>
  );
});

function OverflowMenu({
  open,
  onOpenChange,
  triggerRef,
  active,
  ariaLabel,
  sections,
  activeSection,
  openPanel,
  onRailClick,
  tokens,
  elev,
  reducedMotion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  active: boolean;
  ariaLabel: string;
  sections: RailSection[];
  activeSection: string;
  openPanel: string | null;
  onRailClick: (id: string) => void;
  tokens: TokenSet;
  elev: ReturnType<typeof elevation>;
  reducedMotion: boolean;
}) {
  return (
    // modal={false}: the rail overflow is a NON-modal nav menu — the rail behind it must stay
    // interactive and accessible (the former hand-rolled menu never aria-hid the rail nor locked
    // scroll). modal=true (Radix default) would aria-hide + scroll-lock the page, breaking the rail.
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <OverflowTriggerButton
          ref={triggerRef}
          active={active}
          open={open}
          tokens={tokens}
          reducedMotion={reducedMotion}
          ariaLabel={ariaLabel}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {/* F2 — RIGHT of the trigger, top-aligned, Radix collision-flips when short on room.
            F1 — Popper renders position: fixed in a body portal. */}
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={SPACE[1]}
          loop
          className={SCROLL.className}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACE.half,
            width: 180,
            padding: `${SPACE[2]}px`,
            boxSizing: "border-box",
            background: tokens.darkSurface,
            // KEPT (owner ruling 2026-07-20): DS menu-definition convention (Figma 783:4791 has no stroke).
            border: `0.5px solid ${tokens.darkBorderStrong}`,
            borderRadius: RADIUS.rounded,
            boxShadow: elev.mid,
            zIndex: Z.dropdown,
            // F8 — internally scrollable, capped to the Radix-measured available height.
            maxHeight: "var(--radix-dropdown-menu-content-available-height)",
            overflowY: "auto",
          }}
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const browsing = openPanel === section.id && !isActive;
            return (
              <OverflowMenuItem
                key={section.id}
                section={section}
                active={isActive}
                browsing={browsing}
                onSelect={() => onRailClick(section.id)}
                tokens={tokens}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function OverflowMenuItem({
  section,
  active,
  browsing,
  onSelect,
  tokens,
  reducedMotion,
}: {
  section: RailSection;
  active: boolean;
  browsing: boolean;
  onSelect: () => void;
  tokens: TokenSet;
  reducedMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const Icon = section.icon;

  const bg = active
    ? tokens.darkActiveBg
    : pressed
      ? tokens.darkPressedBg
    : hovered
      ? tokens.darkHoverBg
      : "transparent";

  const color = active
    ? tokens.onDark
    : browsing || hovered || pressed
      ? tokens.onDarkHover
      : tokens.onDarkSubtle;

  // ── RailMenu (overflow) per-state contract — see railmenu.spec.md ──
  // The rail overflow menu is a NAV-TIER surface (same tier as NavRow): rest = TYPE.bodyM
  // (14/400), active = TYPE.labelL (14/500). Description stays TYPE.caption (12/400).
  //   state     | background                       | label color  | label font           | icon
  //   rest      | transparent                      | onDarkSubtle | TYPE.bodyM (14/400)  | Regular
  //   hover     | darkHoverBg                       | onDarkHover  | TYPE.bodyM (14/400)  | Filled
  //   browsing  | transparent + inset 1.5px border  | onDarkHover  | TYPE.bodyM (14/400)  | Filled
  //   active    | darkActiveBg                      | onDark       | TYPE.labelL (14/500) | Filled
  // Verified via Figma-sync 2026-06-13 against the MenuItemDark master (node 194:3128, owner's
  // final adjustment): Row/Label = Body/M (77:47179) rest → Label/L (77:47181) active; the legacy
  // 13/500 style (316:4602) was removed. (Token Change Propagation Protocol / GR4.)
  const labelFont = active ? TYPE.labelL : TYPE.bodyM;

  return (
    // F6 — Radix Menu.Item is roving (tabIndex -1, not in the tab order) and carries role="menuitem".
    // F5 — Escape / Arrow roving / Home / End are handled by Radix Menu; onSelect closes the menu
    //      and returns focus to the trigger (A13).
    <DropdownMenu.Item
      onSelect={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACE[2],
        padding: `${SPACE[1]}px`,
        background: bg,
        border: "none",
        boxShadow: browsing ? `inset 0 0 0 1.5px ${tokens.darkBorderStrong}` : "none",
        borderRadius: RADIUS.soft,
        cursor: "pointer",
        outline: "none",
        color,
        ...labelFont,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        transition: [
          transition("background", MOTION.fast, MOTION.ease, reducedMotion),
          transition("box-shadow", MOTION.fast, MOTION.ease, reducedMotion),
        ].join(", "),
      }}
    >
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        flexShrink: 0,
      }}>
        <Icon size={20} color="currentColor" filled={active || browsing || hovered || pressed} />
      </span>
      <span style={{ flex: 1, textAlign: "left" as const }}>{section.label}</span>
      {/* No trailing chevron — owner ruling 2026-07-20: overflow ("More") items open a PANEL, not an
          in-place submenu, so the Figma ChevronTrigger (783:4796) is intentionally omitted. */}
      {section.badge && (
        // Composable pairing: our Badge atom rendered inside a borrowed Radix DropdownMenu.Item.
        // darkAtom surface because the overflow menu is a dark-tier surface. No buried rail section
        // is badged today, so this is a no-op capability until a section carries a badge.
        <span style={{ flexShrink: 0, display: "inline-flex" }}>
          <Badge variant={typeof section.badge === "string" ? "neutral" : (section.badge.variant ?? "neutral")} size="sm" atomSurface="darkAtom">
            {typeof section.badge === "string" ? section.badge : section.badge.label}
          </Badge>
        </span>
      )}
    </DropdownMenu.Item>
  );
}

// ── Panel Item ──

// ── NavRow shell (shared row body) ──
//
// Faithful to Figma NavRow 207:3406. This is the single source of row visuals for the
// built-in panel: PanelItem (leaf), PanelGroup (depth-0 group), and NestedSubGroup
// (nested group) all delegate here so every row renders identically.
//
// Layout (matches navrow.spec.md): leading row (height 20, gap SPACE[1]) holds
//   [depth× NavIndentLine 18px] [chevron slot 18px] [content: icon 20px + gap SPACE[2] + label + badge]
// State tokens (NavRow States Contract): rest=transparent/textMuted, hover=hoverBg/ink,
//   active(collapsed)=ink/onInk/labelL — FILLED DARK selected row (Figma 207:3406, 2026-06-15),
//   active-expanded=transparent/ink/labelL, disabled=textDisabled (full override).
//   Badge stays textDisabled in all states. Chevron rotation tracks expand state ONLY.
function NavRowShell({
  label,
  badge,
  depth,
  hasChevron,
  isExpanded,
  isActive,
  isDisabled,
  isLastSibling,
  Icon,
  ariaCurrent,
  idAttr,
  onActivate,
  tokens,
}: {
  label: string;
  badge?: RailBadge;
  depth: number;
  hasChevron: boolean;
  isExpanded: boolean;
  isActive: boolean;
  isDisabled: boolean;
  isLastSibling?: boolean;
  Icon?: React.ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  ariaCurrent?: boolean;
  idAttr?: string;
  onActivate: () => void;
  tokens: TokenSet;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  // navrow.spec.md state derivation:
  //   active (leaf or collapsed group on path) → FILLED dark (tokens.ink) + white label/icon
  //   active-expanded (group open + on path)   → transparent (light, ink label)
  //   hover / keyboard-focus                   → hoverBg (suppressed while active-expanded)
  const isActiveExpanded = isActive && isExpanded;
  // active-collapsed = the SELECTED row. Figma 207:3406 state=active (2026-06-15): inverted from the
  // prior subtle bgSubtle highlight to a filled dark #1C2024 (tokens.ink) row with white label/icon.
  const isActiveFilled = isActive && !isExpanded;
  const engaged = !isDisabled && (isHovered || isKeyboardFocused || isActive);
  const bg = isActiveFilled                                       ? tokens.ink
           : (isHovered || isKeyboardFocused) && !isActiveExpanded ? tokens.hoverBg
           : "transparent";
  // Disabled = FULL override (textDisabled). active-collapsed = onInk on the `ink` fill — both invert
  // per mode (white-on-dark in light, near-black-on-light in dark), so it's legible in BOTH themes.
  const labelColor = isDisabled ? tokens.textDisabled : isActiveFilled ? tokens.onInk : engaged ? tokens.ink : tokens.textMuted;
  // Badge (neutral pill) is rendered via the Badge atom below — its muted text tracks the atom's
  // neutral token (textMuted), so no separate badgeColor override is needed here.
  const iconFilled = !isDisabled && engaged;
  const chevronDown = isExpanded;  // Chevron tracks expand state only — isActive drives bg/text, not rotation (CP.CHEVRON-ROTATION-ACTIVE-LOCK)
  const labelFont = isActive ? TYPE.labelL : TYPE.bodyM;
  const indentLines = Math.min(depth, 2);  // depth cap at 2 lines (matches SpecRow nextDepth cap)

  return (
    <button
      id={idAttr}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // Prevent focus acquisition on mouse click so the focus ring is keyboard-only.
      onMouseDown={(e) => e.preventDefault()}
      onClick={!isDisabled ? onActivate : undefined}
      onFocus={() => !isDisabled && setIsKeyboardFocused(true)}
      onBlur={() => setIsKeyboardFocused(false)}
      disabled={isDisabled}
      aria-current={ariaCurrent ? "page" : undefined}
      aria-expanded={hasChevron ? isExpanded : undefined}
      style={{
        padding: `${SPACE[1]}px ${SPACE[2]}px`,   // Figma 207:3406 NavRow: 4px 8px (GR4) — indent comes from NavIndentLine slots, not padding
        minHeight: LIST_ROW.compact,               // Figma NavRow natural height: 4+20+4 = 28px (GR4)
        borderRadius: RADIUS.soft,
        background: bg,
        border: "none",
        cursor: isDisabled ? DISABLED.cursor : "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        flexShrink: 0,
        boxSizing: "border-box",
        width: "100%",
        transition: `background ${MOTION.fast}ms ${MOTION.ease}`,
        // Keyboard-only focus ring (FOCUS.style); mouse click suppressed via onMouseDown preventDefault.
        ...(isKeyboardFocused ? FOCUS.style(tokens) : { outline: "none" }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE[1], height: 20 }}>
        {indentLines >= 1 && <NavIndentLine weight="hairline" rowPadY={SPACE[1]} rowGap={2} isLast={isLastSibling} />}
        {indentLines >= 2 && <NavIndentLine weight="hairline" rowPadY={SPACE[1]} rowGap={2} isLast={isLastSibling} />}

        {/* Chevron slot — Figma Atom.ChevronTrigger (783:4745) is 20×20 (same slot as the nav icon),
            reserved so leaf and group labels align. Was 18×18. (audit MED-5, 2026-07-20) */}
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, borderRadius: RADIUS.xs, flexShrink: 0,
          color: labelColor,
          transform: hasChevron ? (chevronDown ? "rotate(0deg)" : "rotate(-90deg)") : undefined,
          transition: hasChevron ? `transform ${MOTION.fast}ms ${MOTION.ease}` : undefined,
        }}>
          {hasChevron && <IconChevronDown size={16} color="currentColor" filled={iconFilled} />}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: SPACE[2], flex: 1, minWidth: 0 }}>
          {/* Nav icon slot — always reserved at 20px for consistent alignment */}
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 20, height: 20, borderRadius: RADIUS.xs, flexShrink: 0, color: labelColor,
          }}>
            {Icon && <Icon size={20} color="currentColor" filled={iconFilled} />}
          </span>

          <span style={{
            ...labelFont, color: labelColor,
            flex: 1, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            textAlign: "left" as const,  // Figma textAlignHorizontal:LEFT on TYPE/bodyS + TYPE/labelM
          }}>
            {label}
          </span>

          {badge && (
            // Figma 783:4757 renders the nav-row badge as the Badge atom (neutral pill: subtle fill +
            // hairline border + muted text), NOT bare text. The pill stays the LIGHT neutral in EVERY
            // row state — including the active-collapsed ink row (Figma 783:4753 badge fill #F9F9FB,
            // and navrow.spec.md:283 "neutral pill — unchanged, legible on the dark ink row"). Was
            // atomSurface={isActiveFilled?"darkAtom":"atom"}, which put a dark pill on the ink row AND a
            // dark pill on the LIGHT active row in dark theme. (audit HIGH-1, 2026-07-20)
            <span style={{ flexShrink: 0, display: "inline-flex" }}>
              <Badge variant={typeof badge === "string" ? "neutral" : (badge.variant ?? "neutral")} size="sm" atomSurface="atom">
                {typeof badge === "string" ? badge : badge.label}
              </Badge>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// Leaf panel item (route). Delegates visuals to NavRowShell.
function PanelItem({
  item,
  selected,
  onClick,
  tokens,
  depth = 0,
  isLastSibling,
}: {
  item: RailPanelItem | RailPanelChild;
  selected: boolean;
  onClick: () => void;
  tokens: TokenSet;
  reducedMotion?: boolean;
  depth?: number;
  isLastSibling?: boolean;
}) {
  const Icon = "icon" in item ? item.icon : undefined;
  // "Coming soon" placeholder: disabled (greyed, non-interactive) AND shows a leading chevron to
  // signal it will become an expandable group later (Figma: disabled rows that show a chevron).
  const comingSoon = !!item.comingSoon;
  return (
    <NavRowShell
      label={item.label}
      badge={item.badge}
      depth={depth}
      hasChevron={comingSoon}
      isExpanded={false}
      isActive={selected}
      isDisabled={!!item.disabled || comingSoon}
      isLastSibling={isLastSibling}
      Icon={Icon}
      ariaCurrent={selected}
      onActivate={onClick}
      tokens={tokens}
    />
  );
}

// ── Panel Header Menu Button + Menu (Radix DropdownMenu engine, DS-LIGHT re-skin) ──
//
// PRIMITIVES-FIRST borrow (docs/process/PRIMITIVES-FIRST-METHOD.md): the popup MECHANISM
// (portal, positioning, up/down flip, roving focus, typeahead, outside-dismiss, Escape,
// focus-return-to-trigger) is delegated to @radix-ui/react-dropdown-menu — the same wrap-a-Radix-
// primitive pattern proven in Dialog.tsx and the rail OverflowMenu (this file). Unlike the dark rail
// overflow menu, this menu lives on the LIGHT panel surface, so every visual comes from the light DS
// tokens (surface / hairline / ink / textMuted / bgSubtle / elev.mid) — NOT the dark rail tokens. It
// carries CHECKED rows (checkmark + bgSubtle + weight-500), DANGER rows (statusRedText), and DISABLED
// rows.
//
// Figma ref: Single shape / PanelHeader (node 209:3944)
// Trigger: 28×28 icon button (RADIUS.xs = 4px), IconEllipsis (More Horizontal). Reproduces the former
// EllipsisButton light state model — rest: transparent/textMuted/regular · hover|open: hoverBg/ink/filled
// · pressed: pressedOverlay/ink/filled · focus-visible: focusOverlay + inset 1.5px ink ring.
//
// Radix mapping of RAILNAV-BEHAVIOR-CONTRACT §E/§F assertions:
//   E5   first item auto-focused on KEYBOARD open → Radix focuses the first item; on MOUSE open Radix
//        leaves focus on the trigger (standard WAI-ARIA menu-button pattern), ArrowDown enters the menu.
//   F1   portal + fixed positioning → DropdownMenu.Portal + Popper position: fixed
//   F3   right-aligned below trigger, flips UP when short below → side="bottom" align="end" + avoidCollisions
//   F4   outside-click dismiss (trigger + content) → Radix DismissableLayer (listens on pointerdown)
//   F5   Arrow roving (wrap), Home/End, Escape → Radix RovingFocus (loop) + Menu key handling
//   F6   items roving (tabIndex -1, not in tab order) → Radix Menu.Item roving
//   F9   checked / danger / disabled row visuals → reproduced below; checked rows use
//        DropdownMenu.CheckboxItem for real aria-checked (role="menuitemcheckbox")
//   F10  open ≡ engaged trigger visual → engaged bg/icon while `open`

const PanelMenuTriggerButton = React.forwardRef<
  HTMLButtonElement,
  {
    open: boolean;
    tokens: TokenSet;
    reducedMotion: boolean;
    ariaLabel: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function PanelMenuTriggerButton(
  { open, tokens, reducedMotion, ariaLabel, ...props },
  ref,
) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  // Former EllipsisButton light visual model, with open ≡ engaged (F10). Handlers COMPOSE with the
  // props Radix Trigger injects via asChild (onPointerDown/onKeyDown open the menu) — never clobber them.
  const engaged = hovered || pressed || open || focusVisible;
  const bg = pressed
    ? tokens.pressedOverlay
    : (hovered || open)
      ? tokens.hoverBg
      : focusVisible
        ? tokens.focusOverlay
        : "transparent";
  const iconColor = engaged ? tokens.ink : tokens.textMuted;

  return (
    <button
      ref={ref}
      {...props}
      type="button"
      onMouseEnter={(e) => { props.onMouseEnter?.(e); setHovered(true); }}
      onMouseLeave={(e) => { props.onMouseLeave?.(e); setHovered(false); setPressed(false); }}
      onMouseDown={(e) => { props.onMouseDown?.(e); setPressed(true); }}
      onMouseUp={(e) => { props.onMouseUp?.(e); setPressed(false); }}
      onFocus={(e) => { props.onFocus?.(e); setFocusVisible(e.currentTarget.matches(":focus-visible")); }}
      onBlur={(e) => { props.onBlur?.(e); setPressed(false); setFocusVisible(false); }}
      aria-label={ariaLabel}
      style={{
        width: 28,
        height: 28,
        borderRadius: RADIUS.xs,
        border: "none",
        background: bg,
        boxShadow: focusVisible ? `inset 0 0 0 1.5px ${tokens.ink}` : "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: iconColor,
        outline: "none",
        boxSizing: "border-box",
        transition: transition("background", MOTION.fast, MOTION.ease, reducedMotion),
      }}
    >
      <IconEllipsis size={16} color="currentColor" filled={engaged} />
    </button>
  );
});

function PanelHeaderMenuButton({
  items,
  onAction,
  ariaLabel,
  tokens,
  elev,
  reducedMotion,
}: {
  items: PanelHeaderMenuItem[];
  onAction: (id: string) => void;
  ariaLabel: string;
  tokens: TokenSet;
  elev: ReturnType<typeof elevation>;
  reducedMotion: boolean;
}) {
  // Local open state so the trigger can render the engaged (open ≡ engaged, F10) visual.
  const [open, setOpen] = useState(false);
  return (
    // modal={false}: like the rail overflow menu, this is a NON-modal panel actions menu — the panel
    // behind it must stay interactive (the former hand-rolled menu never aria-hid the panel nor
    // locked scroll). modal=true (Radix default) would aria-hide + scroll-lock the page.
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <PanelMenuTriggerButton
          open={open}
          tokens={tokens}
          reducedMotion={reducedMotion}
          ariaLabel={ariaLabel}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {/* F3 — right-aligned (align="end") BELOW the trigger (side="bottom"); Radix collision-flips
            UP when short on room below. F1 — Popper renders position: fixed in a body portal. */}
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={SPACE[1]}
          loop
          className={SCROLL.className}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACE.half,
            minWidth: 240,  // Figma ActionMenu 783:4802 = 240 (== MENU_DEFAULT_WIDTH). Was 200. (audit MED-3, 2026-07-20)
            padding: `${SPACE[1]}px`,
            boxSizing: "border-box",
            background: tokens.surface,
            // KEPT (owner ruling 2026-07-20): DS menu-definition convention — Figma 783:4802 has no
            // stroke, but we keep a hairline for legibility on light surfaces. Do not strip on re-audit.
            border: `1px solid ${tokens.hairline}`,
            borderRadius: RADIUS.rounded,
            boxShadow: elev.mid,
            zIndex: Z.dropdown,
            // Internally scrollable, capped to the Radix-measured available height.
            maxHeight: "var(--radix-dropdown-menu-content-available-height)",
            overflowY: "auto",
          }}
        >
          {items.map((item) => (
            <PanelMenuRow
              key={item.id}
              item={item}
              onAction={onAction}
              tokens={tokens}
              reducedMotion={reducedMotion}
            />
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// Export so SidebarPanel story and other consumers can reuse without reimplementing.
export { PanelHeaderMenuButton };

// A single row in the panel-header actions menu. The Radix engine handles roving/typeahead/select;
// this component reproduces the former hand-rolled per-state visuals (F9) with local hover/press state.
// checked → DropdownMenu.CheckboxItem (real aria-checked, role="menuitemcheckbox"); everything else →
// DropdownMenu.Item. onSelect fires onAction + closes the menu (Radix default), matching the old row's
// click-to-act-and-close; disabled rows are non-selectable and skipped by roving.
function PanelMenuRow({
  item,
  onAction,
  tokens,
  reducedMotion,
}: {
  item: PanelHeaderMenuItem;
  onAction: (id: string) => void;
  tokens: TokenSet;
  reducedMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isDisabled = !!item.disabled;
  const Icon = item.icon;

  const isChecked = !!item.checked;

  const bg = isDisabled
    ? "transparent"
    : pressed
      ? tokens.activeBg
      : hovered
        ? tokens.hoverBg
        : isChecked
          ? tokens.bgSubtle
          : "transparent";

  const color = isDisabled
    ? tokens.textDisabled
    : item.danger
      ? tokens.statusRedText
      : (hovered || pressed || isChecked)
        ? tokens.ink
        : tokens.textMuted;

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: SPACE[2],
    minHeight: 28,
    padding: `${SPACE[1]}px ${SPACE[2]}px`,
    background: bg,
    boxShadow: pressed && !isDisabled ? `inset 0 0 0 1px ${tokens.borderStrong}` : "none",
    border: "none",
    borderRadius: RADIUS.soft,
    cursor: isDisabled ? DISABLED.cursor : "pointer",
    color,
    // Checked rows use TYPE/labelM (13/500, lineHeight 1.4) per Figma 783:4805; unchecked = TYPE/bodyS
    // (13/400, 1.5). Was bodyS + a fontWeight:500 override, which kept bodyS's 1.5 line-height. (audit LOW-7, 2026-07-20)
    ...((!isDisabled && isChecked) ? TYPE.labelM : TYPE.bodyS),
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    width: "100%",
    textAlign: "left",
    outline: "none",
    userSelect: "none",
    transition: [
      transition("background", MOTION.fast, MOTION.ease, reducedMotion),
      transition("color", MOTION.fast, MOTION.ease, reducedMotion),
    ].join(", "),
  };

  // Reproduce the former per-state visuals via local hover/press. Guarded on !isDisabled so a disabled
  // row never shows hover/press. (Radix also flags the row via data-highlighted, but we drive our own
  // visuals to preserve the exact light-panel look.)
  const stateHandlers = {
    onMouseEnter: () => { if (!isDisabled) setHovered(true); },
    onMouseLeave: () => { setHovered(false); setPressed(false); },
    onMouseDown: () => { if (!isDisabled) setPressed(true); },
    onMouseUp: () => setPressed(false),
  };

  const rowContent = (
    <>
      {/* Left icon slot — 18×18, always reserved */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        flexShrink: 0,
      }}>
        {Icon && <Icon size={16} color="currentColor" filled={!isDisabled && (hovered || pressed || isChecked)} />}
      </span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
        {item.label}
      </span>
      {/* Right indicator slot — 18×18, always reserved. Shows checkmark when checked. */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        flexShrink: 0,
      }}>
        {isChecked && !isDisabled && (
          <IconCheckmark size={16} color={tokens.ink} />
        )}
      </span>
    </>
  );

  // Checked rows use CheckboxItem for real aria-checked (role="menuitemcheckbox").
  if (isChecked) {
    return (
      <DropdownMenu.CheckboxItem
        checked
        disabled={isDisabled}
        onSelect={() => onAction(item.id)}
        style={rowStyle}
        {...stateHandlers}
      >
        {rowContent}
      </DropdownMenu.CheckboxItem>
    );
  }

  return (
    <DropdownMenu.Item
      disabled={isDisabled}
      onSelect={() => onAction(item.id)}
      style={rowStyle}
      {...stateHandlers}
    >
      {rowContent}
    </DropdownMenu.Item>
  );
}

// ── Nested Children (recursive) ──

function NestedChildren({
  children,
  activeItem,
  onNavigate,
  tokens,
  reducedMotion,
  depth,
  expandedGroups,
  onToggleGroup,
  searching,
}: {
  children: RailPanelChild[];
  activeItem: string;
  onNavigate: (childId: string) => void;
  tokens: TokenSet;
  reducedMotion: boolean;
  depth: number;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  searching: boolean;
}) {
  // Column wrapper for a group's children. The nesting line is the per-row
  // NavIndentLine slot atom rendered INSIDE each row (in NavRowShell), matching
  // Figma NavRow 207:3406 (depth=N adds N× NavIndentLine). `overflow: clip`
  // clips the NavIndentLine bleed at group boundaries WITHOUT creating a BFC
  // (SC.BFC-TRUNCATION-TRAP). gap: SPACE.half matches the nav's row gap.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE.half, overflow: "clip" }}>
      {children.map((child, i) => {
        const isLastSibling = i === children.length - 1;
        if (child.children && child.children.length > 0) {
          // Render as a nested sub-group
          return (
            <NestedSubGroup
              key={child.id}
              item={child}
              activeItem={activeItem}
              onNavigate={onNavigate}
              tokens={tokens}
              reducedMotion={reducedMotion}
              depth={depth}
              isLastSibling={isLastSibling}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              searching={searching}
            />
          );
        }
        const selected = activeItem === child.id;
        return (
          <PanelItem
            key={child.id}
            item={child}
            selected={selected}
            onClick={() => onNavigate(child.id)}
            tokens={tokens}
            depth={depth}
            isLastSibling={isLastSibling}
          />
        );
      })}
    </div>
  );
}

// ── Max supported nesting depth ──

const MAX_SUPPORTED_DEPTH = 3;

// ── Nested Sub-Group (expandable child with its own children) ──

function NestedSubGroup({
  item,
  activeItem,
  onNavigate,
  tokens,
  reducedMotion,
  depth,
  isLastSibling,
  expandedGroups,
  onToggleGroup,
  searching,
}: {
  item: RailPanelChild;
  activeItem: string;
  onNavigate: (childId: string) => void;
  tokens: TokenSet;
  reducedMotion: boolean;
  depth: number;
  isLastSibling?: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  searching: boolean;
}) {
  if (typeof globalThis !== "undefined" && depth > MAX_SUPPORTED_DEPTH) {
    console.warn(
      `[RailNav] Nesting depth ${depth} exceeds the supported maximum of ${MAX_SUPPORTED_DEPTH}. ` +
      `Visual density and accessibility are not guaranteed beyond depth ${MAX_SUPPORTED_DEPTH}. ` +
      `Group: "${item.label}"`,
    );
  }

  const hasActiveChild = item.children
    ? hasActiveDescendant(item.children, activeItem)
    : false;
  // Single source of truth at every depth: read expansion from the lifted expandedGroups
  // (seed-once expands the full active path; the panel menu's expand-all / collapse-all reach
  // here). Search force-expands so matches are visible. (Was local useState — that left nested
  // groups outside expandedGroups, so expand-all/collapse-all never reached them.)
  const expanded = searching ? true : expandedGroups.has(item.id);

  return (
    <div role="group" aria-labelledby={`subgroup-${item.id}`} style={{ display: "flex", flexDirection: "column", gap: SPACE.half }}>
      <NavRowShell
        idAttr={`subgroup-${item.id}`}
        label={item.label}
        badge={item.badge}
        depth={depth}
        hasChevron
        isExpanded={expanded}
        isActive={hasActiveChild}
        isDisabled={!!item.disabled}
        isLastSibling={isLastSibling}
        Icon={item.icon}
        onActivate={() => onToggleGroup(item.id)}
        tokens={tokens}
      />

      {item.children && (
        <Collapse open={expanded} reducedMotion={reducedMotion}>
          <NestedChildren
            children={item.children}
            activeItem={activeItem}
            onNavigate={onNavigate}
            tokens={tokens}
            reducedMotion={reducedMotion}
            depth={depth + 1}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            searching={searching}
          />
        </Collapse>
      )}
    </div>
  );
}

// ── Panel Group (disclosure with multi-level nesting) ──

function PanelGroup({
  item,
  expanded,
  hasActiveChild,
  onToggle,
  expandedGroups,
  onToggleGroup,
  searching,
  activeItem,
  sectionId,
  onNavigate,
  tokens,
  reducedMotion,
}: {
  item: RailPanelItem;
  expanded: boolean;
  hasActiveChild: boolean;
  onToggle: () => void;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  searching: boolean;
  activeItem: string;
  sectionId: string;
  onNavigate: (childId: string) => void;
  tokens: TokenSet;
  reducedMotion: boolean;
}) {
  const Icon = item.icon;

  return (
    <div role="group" aria-labelledby={`group-${item.id}`} style={{ display: "flex", flexDirection: "column", gap: SPACE.half }}>
      {/* Group header (disclosure toggle) — depth 0, delegates visuals to NavRowShell */}
      <NavRowShell
        idAttr={`group-${item.id}`}
        label={item.label}
        badge={item.badge}
        depth={0}
        hasChevron
        isExpanded={expanded}
        isActive={hasActiveChild}
        isDisabled={!!item.disabled}
        Icon={Icon}
        onActivate={onToggle}
        tokens={tokens}
      />

      {/* Children (indented via per-row NavIndentLine slots) — animated via <Collapse> */}
      {item.children && (
        <Collapse open={expanded} reducedMotion={reducedMotion}>
          <NestedChildren
            children={item.children}
            activeItem={activeItem}
            onNavigate={onNavigate}
            tokens={tokens}
            reducedMotion={reducedMotion}
            depth={1}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            searching={searching}
          />
        </Collapse>
      )}
    </div>
  );
}
