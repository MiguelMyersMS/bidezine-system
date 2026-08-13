import { forwardRef, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Presence } from "@radix-ui/react-presence"
import { useOverflowFit } from "@/hooks/useOverflowFit"
import { DivergenceAnchorProvider, anchorAttrs, useDivergenceAnchor } from "@/lib/divergence-anchors"
import {
  AppsIcon,
  Badge,
  BellIcon,
  BoxArrowLeftIcon,
  Button,
  CartIcon,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ClothesHangerIcon,
  ColorIcon,
  DataHistogramIcon,
  DataUsageSparkleIcon,
  DeskIcon,
  DocumentFolderIcon,
  DocumentMultipleIcon,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FireplaceIcon,
  FlagIcon,
  FoodAppleIcon,
  FoodGrainsIcon,
  GaugeIcon,
  GiftIcon,
  GlobeLocationIcon,
  GridIcon,
  HatGraduationIcon,
  ImageShadowIcon,
  MailTemplateIcon,
  MedalIcon,
  MegaphoneIcon,
  MoneyCalculatorIcon,
  MoneyHandIcon,
  MoneyIcon,
  MoreHorizontalIcon,
  OvenIcon,
  PanelLeftContractIcon,
  PeopleAddIcon,
  PeopleCheckmarkIcon,
  PeopleIcon,
  PersonHeartIcon,
  PlantGrassIcon,
  ReceiptMoneyIcon,
  ReceiptSearchIcon,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  RibbonIcon,
  SavingsIcon,
  ScrollArea,
  SearchInput,
  SettingsIcon,
  ShieldCheckmarkIcon,
  SlideTextMultipleIcon,
  Skeleton,
  SportIcon,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UserIcon,
  useScrollAreaOverflow,
  VehicleCarProfileIcon,
  VehicleTruckProfileIcon,
} from "@bidezine/system"
import { BIDEZINE_LOGO_PATH, BIDEZINE_LOGO_VIEWBOX, FULL_PREVIEW_ICONS, type ProposedToken } from "@/data/rail-sidebar"

/**
 * The bidezine "adjusted" Rail Sidebar — a REAL, functional implementation built exclusively from
 * native @bidezine/system components (Button, Tooltip, DropdownMenu, Collapsible, Input) and the
 * real generated Fluent icon set (@bidezine/system's own HomeIcon/FolderOpenIcon/etc, all carrying
 * the shipped `filled?` prop). Nothing here is copied from, or references, the origin design
 * system's own component code — only its documented BEHAVIOR is replicated (overflow, footer
 * ordering, panel header actions, search, expand/collapse, browsing/active rail state), each
 * reimplemented from scratch against bidezine's own primitives. See SANDBOX-PROTOCOL-LOG.md.
 *
 * This is what makes the origin/adjusted comparison genuinely apples-to-apples: origin's column is
 * the real vendored component (OriginRailNavLiveAuto); this is bidezine's own equivalent, for real.
 */


interface LeafItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; filled?: boolean }>
  badge?: string
  disabled?: boolean
}

interface GroupNode {
  kind: "group"
  id: string
  label: string
  // QA finding (see divergence row L-17): this field didn't exist at all — every group node
  // (system-logic, schedules, products, orders, sales, customers) was silently missing its own
  // content icon, unlike origin's real SPEC_TREE, where every one of them carries an `Icon` (e.g.
  // IconCubeTree, IconCalendarClock, IconGrid, IconCart, IconMoney, IconPeople). Confirmed this was
  // an incomplete port, not a deliberate omission: CartIcon/GridIcon/MoneyIcon were already imported
  // into this file but never referenced anywhere — dead imports left over from an unfinished step.
  icon: React.ComponentType<{ className?: string; filled?: boolean }>
  badge?: string
  children: PanelNode[]
}

type PanelNode = (LeafItem & { kind: "leaf" }) | GroupNode

interface RailSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; filled?: boolean }>
  /** Empty items => a leaf rail button: clicking navigates directly, no panel opens. */
  items: PanelNode[]
}

// "Slides" keeps the exact origin SPEC_TREE content (icon paths sourced verbatim, see
// FULL_PREVIEW_ICONS) so the richly-nested/badged panel case stays represented faithfully.
//
// QA finding (see divergence row L-23): confirmed the actual root cause behind a recurring class of
// "icon doesn't fill on hover/select" reports across this whole session. src/lib/action-icons.tsx's
// own `isIconElement()` check has TWO detection paths: an explicit `isActionIcon === true` marker
// (set on every real generated icon by scripts/build-icons.mjs specifically because minifiers rename
// function declarations), and a fallback that checks whether the component's runtime `.name` ends in
// "Icon" -- with its own code comment already warning this fallback is unsafe under production
// minification. This factory previously relied ONLY on that unsafe fallback (the returned function was
// named `SpecIcon`, nothing else). Built sandbox for production and confirmed empirically (not
// assumed): the minified bundle's SpecIcon closure name does NOT survive (`grep "SpecIcon"` on the
// built JS returns no match), while `isActionIcon` (a static property access, not a renamed
// identifier) does. Served the actual built dist/ output and tested hover live: every specTreeIcon-based
// icon ("Participants", "Rules engine", etc.) had COMPLETELY STOPPED filling on hover/select with zero
// errors -- a fully silent failure -- while a real bidezine-generated icon in the same bundle
// ("Documents") still worked correctly. This explains why the bug kept "recurring" across this session:
// every fix was verified against the Vite dev server (function names preserved there), never against
// an actual production build, so a component-wide regression shipped invisibly underneath passing
// dev-server checks every time. FIXED at the source: mark the returned component with the same
// `isActionIcon = true` static property real generated icons carry, making it immune to minification
// exactly like the mechanism it was already supposed to opt into.
function specTreeIcon(entry: { d: string; filledD?: string }): React.ComponentType<{ className?: string; filled?: boolean }> {
  function SpecIcon({ className, filled }: { className?: string; filled?: boolean }) {
    const d = filled && entry.filledD ? entry.filledD : entry.d
    return (
      <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
        <path d={d} />
      </svg>
    )
  }
  SpecIcon.isActionIcon = true
  return SpecIcon
}

const SLIDES_PANEL: PanelNode[] = [
  { kind: "leaf", id: "activity", label: "Activity stream", badge: "+23", icon: specTreeIcon(FULL_PREVIEW_ICONS.video) },
  { kind: "leaf", id: "live-ops", label: "Live operations", icon: specTreeIcon(FULL_PREVIEW_ICONS.videoSettings) },
  { kind: "leaf", id: "participants", label: "Participants", icon: specTreeIcon(FULL_PREVIEW_ICONS.peopleCommunity) },
  {
    kind: "group",
    id: "system-logic",
    label: "System logic",
    badge: "New",
    icon: specTreeIcon(FULL_PREVIEW_ICONS.cubeTree),
    children: [
      { kind: "leaf", id: "rules-engine", label: "Rules engine", icon: specTreeIcon(FULL_PREVIEW_ICONS.engine) },
      { kind: "leaf", id: "triggers", label: "Triggers", icon: specTreeIcon(FULL_PREVIEW_ICONS.syncOff) },
      {
        kind: "group",
        id: "schedules",
        label: "Schedules",
        icon: specTreeIcon(FULL_PREVIEW_ICONS.calendarClock),
        children: [
          { kind: "leaf", id: "daily", label: "Daily", badge: "+05", icon: specTreeIcon(FULL_PREVIEW_ICONS.document) },
          { kind: "leaf", id: "monthly", label: "Monthly", badge: "+11", icon: specTreeIcon(FULL_PREVIEW_ICONS.document) },
          { kind: "leaf", id: "yearly", label: "Yearly", disabled: true, icon: specTreeIcon(FULL_PREVIEW_ICONS.document) },
        ],
      },
    ],
  },
  { kind: "leaf", id: "content", label: "Content", icon: specTreeIcon(FULL_PREVIEW_ICONS.contentView) },
]

const SETTINGS_PANEL: PanelNode[] = [
  { kind: "leaf", id: "general", label: "General", icon: SettingsIcon },
  { kind: "leaf", id: "appearance", label: "Appearance", icon: ColorIcon },
  { kind: "leaf", id: "notifications", label: "Notifications", icon: BellIcon },
  { kind: "leaf", id: "security", label: "Security", icon: ShieldCheckmarkIcon },
]

// Gauge panel content — gives the first STASHED (overflow-menu) section real items, per your
// ask: selecting "Gauge" from the overflow menu should open the actual side panel with its own
// options, exactly like selecting a pinned section (Documents/Slides) does — not a nested popup
// menu rendered inside the overflow dropdown itself (that DropdownMenuSub experiment has been
// reverted below). Reuses icons already imported elsewhere in this file (no new icon introduced).
const GAUGE_PANEL: PanelNode[] = [
  { kind: "leaf", id: "gauge-overview", label: "Overview", icon: GridIcon },
  { kind: "leaf", id: "gauge-performance", label: "Performance", icon: MedalIcon },
  { kind: "leaf", id: "gauge-alerts", label: "Alerts", icon: BellIcon },
]

// Documents panel content — mirrors the real demo's Apps + Products/Orders/Sales/Customers
// group structure, so both sides expose the same depth of nesting and badges to evaluate.
const DOCUMENTS_PANEL: PanelNode[] = [
  { kind: "leaf", id: "apps", label: "Apps", icon: AppsIcon },
  {
    kind: "group",
    id: "products",
    label: "Products",
    icon: GridIcon,
    children: [
      { kind: "leaf", id: "food", label: "Food", icon: FoodAppleIcon },
      { kind: "leaf", id: "clothes", label: "Clothes", icon: ClothesHangerIcon },
      { kind: "leaf", id: "sport", label: "Sport and fitness", badge: "Update", icon: SportIcon },
      { kind: "leaf", id: "office-supplies", label: "Office supplies", icon: DeskIcon },
      { kind: "leaf", id: "kitchen", label: "Kitchen", icon: OvenIcon },
      { kind: "leaf", id: "outdoors", label: "Outdoors", icon: FireplaceIcon },
      { kind: "leaf", id: "garden", label: "Garden", icon: PlantGrassIcon },
      { kind: "leaf", id: "auto", label: "Auto", icon: VehicleCarProfileIcon },
    ],
  },
  {
    kind: "group",
    id: "orders",
    label: "Orders",
    badge: "+348",
    icon: CartIcon,
    children: [
      { kind: "leaf", id: "all-orders", label: "All orders", icon: DocumentMultipleIcon },
      { kind: "leaf", id: "returns", label: "Returns", icon: BoxArrowLeftIcon },
      { kind: "leaf", id: "order-tracking", label: "Order tracking", icon: VehicleTruckProfileIcon },
    ],
  },
  {
    kind: "group",
    id: "sales",
    label: "Sales",
    icon: MoneyIcon,
    children: [
      { kind: "leaf", id: "gross-margin", label: "Gross margin", icon: ReceiptMoneyIcon },
      { kind: "leaf", id: "expenses", label: "Expenses", icon: MoneyHandIcon },
      { kind: "leaf", id: "costs", label: "Costs", icon: MoneyCalculatorIcon },
    ],
  },
  {
    kind: "group",
    id: "customers",
    label: "Customers",
    icon: PeopleIcon,
    children: [
      { kind: "leaf", id: "loyalty", label: "Loyalty programs", icon: MedalIcon },
      { kind: "leaf", id: "attrition", label: "Customer attrition", icon: PeopleCheckmarkIcon },
      { kind: "leaf", id: "new-customers", label: "New customers", icon: PeopleAddIcon },
      { kind: "leaf", id: "satisfaction", label: "Customer satisfaction", icon: PersonHeartIcon },
    ],
  },
]

// 16 top rail sections, mirroring the real demo's full option-by-option lineup (same concepts,
// same icon choices — resolved independently against @fluentui/svg-icons by name, never copied
// from the origin project's own source) — deliberately more than a normal-height rail can fit, so
// the "stash into a menu" behavior genuinely has to trigger, not just sit as a decorative stand-in.
const TOP_SECTIONS: RailSection[] = [
  { id: "documents", label: "Documents", icon: DocumentFolderIcon, items: DOCUMENTS_PANEL },
  { id: "slides", label: "Slides", icon: SlideTextMultipleIcon, items: SLIDES_PANEL },
  // Data: no sub-menu, per the explicit "3rd rail icon" requirement — mirrored from the origin
  // DefaultDemo.tsx edit (items: []), exercising the same direct-navigate / no-panel leaf path.
  { id: "data", label: "Data", icon: DataHistogramIcon, items: [] },
  { id: "overview", label: "Overview", icon: FoodGrainsIcon, items: [] },
  { id: "savings", label: "Savings", icon: SavingsIcon, items: [] },
  // Gauge is the first STASHED (overflow-menu) section — deliberately given real `items` (not
  // `[]`) so selecting it from the overflow menu demonstrates "selecting an overflow item opens
  // the actual side panel with its own options," the same behavior a pinned section like
  // Documents/Slides already has, rather than a nested popup menu living inside the overflow
  // dropdown itself.
  { id: "gauge", label: "Gauge", icon: GaugeIcon, items: GAUGE_PANEL },
  { id: "globe", label: "Globe", icon: GlobeLocationIcon, items: [] },
  { id: "flag", label: "Flag", icon: FlagIcon, items: [] },
  { id: "gift", label: "Gift", icon: GiftIcon, items: [] },
  { id: "graduation", label: "Graduation", icon: HatGraduationIcon, items: [] },
  { id: "images", label: "Images", icon: ImageShadowIcon, items: [] },
  { id: "receipts", label: "Receipts", icon: ReceiptSearchIcon, items: [] },
  { id: "analytics", label: "Analytics", icon: DataUsageSparkleIcon, items: [] },
  { id: "advertising", label: "Advertising", icon: MegaphoneIcon, items: [] },
  { id: "quality", label: "Quality", icon: RibbonIcon, items: [] },
  { id: "emailing", label: "Emailing", icon: MailTemplateIcon, items: [] },
]

const FOOTER_SECTIONS: RailSection[] = [{ id: "settings", label: "Settings", icon: SettingsIcon, items: SETTINGS_PANEL }]

/**
 * QA finding / feature request (see divergence row L-35): origin's real panel resize (RailNav.tsx)
 * enforces a hard-coded `const PANEL_MIN_WIDTH = 240` — its own mouse-drag handler clamps every
 * drag with `Math.max(PANEL_MIN_WIDTH, Math.min(viewportMax, ...))`. Bidezine's real
 * `ResizablePanelGroup`/`ResizablePanel`/`ResizableHandle` primitive (src/ui/resizable.tsx, wrapping
 * `react-resizable-panels`) replaces that hand-rolled `window.addEventListener("mousemove"/
 * "mouseup")` resize mechanism entirely — see the Panel JSX below for the rest of the writeup.
 *
 * CORRECTION (see divergence row F-3, resolved): `PANEL_MIN_WIDTH = 240` is kept because it is
 * independently a real bidezine value — it matches the `Sidebar` primitive's own `min-w-60` token
 * (confirmed at divergence row F-8) — NOT because it happens to equal origin's own hard-coded 240.
 * `PANEL_DEFAULT_WIDTH`, however, previously mirrored origin's own `LAYOUT.panelW = 300` verbatim
 * (this file's own prior hard-coded `width: 300`) purely because "that's what origin used" — with no
 * bidezine token or pattern backing that specific number. That is the exact "diverge to match origin
 * instead of reusing what bidezine already has" mistake the color-token fixes at divergence rows
 * C-6–C-9 (and CLAUDE.md Primitive Fidelity Checklist item 26) were written to catch. Bidezine's own
 * `Sidebar` primitive (src/ui/sidebar.tsx) already defines a real, native default panel width of
 * `16rem` (256px) — so `PANEL_DEFAULT_WIDTH` now reuses that bidezine value (256) instead of origin's
 * arbitrary 300, the panel-width equivalent of reusing `--accent` instead of inventing a new color.
 *
 * `PANEL_MAX_WIDTH`/`PANEL_FILLER_MIN_WIDTH`/`RESIZE_HANDLE_WIDTH`/`PANEL_GROUP_WIDTH` have no
 * origin equivalent by name — origin computes its own max DYNAMICALLY every drag
 * (`window.innerWidth - railW - panelGap - SPACE[6]`), which only makes sense when the rail sits in
 * a real page with real content to protect. This sandbox preview has no such surrounding content, so
 * that formula has nothing real to reference here. Instead, `ResizablePanelGroup` is given an
 * EXPLICIT fixed pixel width (`PANEL_GROUP_WIDTH`) — required because `ResizablePanel`'s own
 * `defaultSize`/`minSize`/`maxSize` numbers are converted to a PERCENTAGE of the group's rendered
 * width at mount (confirmed live: leaving the group at its own default `w-full` let it inherit an
 * arbitrary ambient width from this shrink-wrapping preview card, which skewed the panel's initial
 * render to ~312px instead of the intended 300 — the percentage conversion has nothing stable to
 * anchor to without a known total). With an explicit, known group width, the numbers below are
 * exact: `PANEL_GROUP_WIDTH = PANEL_MAX_WIDTH + RESIZE_HANDLE_WIDTH + PANEL_FILLER_MIN_WIDTH`, so
 * the invisible filler panel (which exists purely to give the drag something to shrink into — see
 * the writeup on the Panel JSX below) can shrink all the way to its own `PANEL_FILLER_MIN_WIDTH`
 * (mirroring origin's own 24px/`SPACE[6]` safety-margin reasoning) exactly when the real panel
 * reaches `PANEL_MAX_WIDTH`, and no further.
 *
 * `PANEL_SHADOW_INSET` (see divergence row L-35, part 2, later corrected by L-36 — see below):
 * `ResizablePanelGroup`'s own rendered box carries a real `overflow: hidden` (set internally by the
 * vendored `react-resizable-panels` library, not something in bidezine's own `src/ui/resizable.tsx`
 * recipe — confirmed live via `getComputedStyle`). With the panel's own `shadow-md` sitting flush
 * against the group's edges (zero slack, measured), the group clipped it — the same "ancestor
 * overflow-hidden clips a descendant's decoration" pattern as L-31's focus-ring bug, just with an
 * un-removable ancestor this time (the clipping is baked into the vendored library, unlike L-31's
 * bidezine-authored wrapper). `PANEL_MIN_WIDTH`/`PANEL_DEFAULT_WIDTH`/`PANEL_MAX_WIDTH` above
 * describe the panel's real, VISIBLE bordered/elevated card size (matching origin's real numbers
 * exactly).
 *
 * CORRECTION (see divergence row L-36): L-35's first pass at this fix added `PANEL_SHADOW_INSET`
 * padding on ALL FOUR sides inside `ResizablePanel`, and only compensated the WIDTH side of that
 * inset (bumping `minSize`/`defaultSize`/`maxSize` up by `2 × PANEL_SHADOW_INSET`) — the HEIGHT side
 * was never compensated, since `react-resizable-panels` has no min/default/max-HEIGHT prop for a
 * horizontal group (a panel's height is always simply "100% of the group's own cross-axis"). The
 * user caught this directly ("in order to fix the issue with the shadow i see it has been decided
 * to reduce the sidebar entirely... is it possible to avoid that down size"): the visible card was
 * measured 16px SHORTER than the group's own box (8px top + 8px bottom), no longer reaching the
 * same top/bottom edges the Rail column still does — a real, unintended regression, not a
 * deliberate tradeoff. FIXED by applying the SAME width-side trick to height too: rather than
 * shrinking the VISIBLE card to fit inside a fixed-size group, the GROUP itself is made 16px TALLER
 * than its own flex-item slot (`height: calc(100% + PANEL_SHADOW_INSET * 2)`) with symmetric
 * negative `marginTop`/`marginBottom` (`-PANEL_SHADOW_INSET` each) pulling it back to the exact same
 * visual position — the visible card (still with its own top/bottom padding) lands at precisely its
 * original height again, flush with the Rail, with the extra 16px existing purely as invisible
 * slack for the group's own clipping boundary.
 *
 * SECOND CORRECTION (see divergence row L-37): L-36 also removed the padding on the panel's RIGHT
 * side entirely, reasoning that edge is a functional attachment point to the drag handle (mirroring
 * origin's own "grip inset WITHIN the panel's right edge"), not open background needing shadow
 * clearance. That reasoning missed something real: the panel still has ROUNDED corners
 * (`borderRadius: 12`), and a shadow wrapping a rounded corner needs clearance in TWO directions at
 * once — the top-right and bottom-right corners still need room to bleed rightward AND up/down
 * simultaneously. Zeroing the right slack clipped exactly that corner-bleed region, reported
 * directly by the user ("the shadow at the right side of the sidebar is truncated") and confirmed
 * visually via a zoomed screenshot of the top-right corner (the shadow's soft curve abruptly stopped
 * instead of continuing to bleed outward, unlike every other corner). Also, bidezine's own real
 * `ResizableHandle` convention (confirmed via its existing use in the showcase site) always sits as
 * an independent thin-line flex item BETWEEN two panels, never overlapping/inset into one the way
 * origin's own hand-rolled grip does — so there was no real convention to preserve by forcing the
 * card flush against the handle in the first place. FIXED by restoring the padding on all four
 * sides again (back to `p-2`, matching L-35's original shape) and restoring the full
 * `2 × PANEL_SHADOW_INSET` width compensation on `ResizablePanel`'s own size props — the height fix
 * from L-36 (taller group + negative margins) is untouched and still correct.
 *
 * M-7 CORRECTION (see divergence row M-7 for the full history): the paragraph above about
 * `PANEL_GROUP_WIDTH`/an invisible filler panel described this project's own assumption at the time
 * — that `react-resizable-panels` converts pixel `minSize`/`defaultSize`/`maxSize` to a percentage
 * of the group's rendered width ONLY ONCE, at mount, so a stable/known total was required. Re-reading
 * the actually-installed version's own real, current source (`node_modules/react-resizable-panels`,
 * v4.12.2 at time of writing — never trust a prior record over the real source, per CLAUDE.md's
 * Sandbox fidelity checklist item on stale docs) shows this assumption was WRONG for this
 * version: its internal `groupSize` is re-measured live (the library tracks the group element's own
 * rendered size continuously, re-deriving each panel's percentage from pixel constraints on every
 * resize, not just at first mount — confirmed by tracing `groupSize` through the library's resize/
 * layout functions, which re-run this conversion on every live layout pass). This means a FIXED
 * `PANEL_GROUP_WIDTH` was never actually required for pixel-accurate bounds — it was a workaround for
 * a version behavior this project doesn't have. `PANEL_GROUP_WIDTH` and the fixed-width style on
 * `ResizablePanelGroup` are removed; the group now sizes itself normally (`flex-1`, filling whatever
 * width its real flex-row parent provides) exactly like a real consuming app's shell would provide.
 * The invisible, `aria-hidden`/`pointer-events-none` filler `ResizablePanel` (which existed purely to
 * give the drag handle something inert to shrink into, since this sandbox had no real adjacent page
 * content) is replaced with a real, VISIBLE `adjacentContent` panel — see the `FunctionalRailSidebar`
 * props and the Panel JSX below. `ADJACENT_CONTENT_MIN_WIDTH` (renamed from `PANEL_FILLER_MIN_WIDTH`)
 * keeps the same 24px/`SPACE[6]` safety-margin reasoning, now governing the real content panel's own
 * minimum width instead of an invisible spacer's.
 *
 * Also per M-7: the outer rail-to-panel `gap` (previously set to `0`, see the L-48 note on the outer
 * flex row below) is restored to an explicit `8` — `PANEL_SHADOW_INSET`'s padding no longer does
 * double duty as the visual gap (a workaround the user identified as unused anywhere else in this
 * design system and asked to be reversed). `PANEL_SHADOW_INSET` still exists for its own, independent
 * job — giving the panel's `shadow-md` clipping slack against `ResizablePanelGroup`'s un-removable
 * `overflow: hidden` — completely unchanged by this correction.
 */
/**
 * DEPLOYMENT NOTE: `RAIL_PANEL_GAP`'s `8` here is this SANDBOX example's own stand-in value, not a
 * fixed design-system constant this component owns or hard-codes for every real deployment. The
 * actual contract this component is responsible for is simpler and more general: whatever gap a
 * real consuming page's own layout system commits to between adjacent regions (its own spacing
 * token, however that consumer defines it) must be the exact, unbroken gap rendered between the
 * rail and its neighboring content \u2014 in EVERY state (panel open, panel collapsed), not just at
 * rest. `8` was chosen here only because it happens to match bidezine's own real `SidebarInset`
 * `md:peer-data-[variant=inset]:m-2` (see the M-7 doc comment above), making it a convenient,
 * already-approved value to verify the CONTRACT against in this example \u2014 not because `8` itself
 * is the permanent, universal rail-to-content gap. A real consumer wiring this component into its
 * own page shell should treat this value as configurable/pass-through to its own layout gap, and
 * M-21/M-22 (rail-sidebar.ts) are the live-verified proof that whatever gap is configured stays
 * exactly that gap across the open/collapse/reopen cycle, with no leftover invisible element (a
 * collapsed resize handle, an unconditional content-padding) silently adding to it.
 */
const PANEL_DEFAULT_WIDTH = 256
const PANEL_MIN_WIDTH = 240
const PANEL_MAX_WIDTH = 380
const ADJACENT_CONTENT_MIN_WIDTH = 24
const PANEL_SHADOW_INSET = 8
const RAIL_PANEL_GAP = 8

/**
 * DEPLOYMENT NOTE (see divergence row F-7, approved): origin's own RailNav.tsx computes
 * `FOOTER_MAX_HEIGHT = LAYOUT.railButton * FOOTER_MAX_ICONS + SPACE[1] * (FOOTER_MAX_ICONS - 1)`
 * — a hard cap on the footer group's own height, silently clipping any 4th+ footer icon by design
 * (`Math.min(footerSlotRef.current?.offsetHeight ?? 0, FOOTER_MAX_HEIGHT)` feeds directly into the
 * nav-item budget calculation, so an oversized footer can't eat into the space available for the
 * scrollable rail sections above it). The user's approval was specifically of the CONCEPT — "the
 * three icon cap" — not of reusing origin's literal 122px as an opaque magic number. Re-derived it
 * from bidezine's own already-implemented values instead: `RAIL_BUTTON_SIZE` (38px, the real
 * `size-[38px]` used by every RailIconButton/Profile-slot button in this rail, matching origin's
 * `LAYOUT.railButton` exactly) and `FOOTER_GAP` (4px, the real `gap-1` on the footer's own flex
 * column, line ~1056) — both values already shipped in this component, not introduced for this fix.
 * `FOOTER_MAX_HEIGHT` computes to 122px either way (38×3 + 4×2), so the NUMBER is unchanged from
 * origin, but it's now backed by bidezine's own real, already-verified constants rather than a
 * borrowed literal — the same "clean coincidence, now actually checked" outcome as F-4. Applied as
 * a real `maxHeight` + `overflow-hidden` on the footer's own flex column (previously this cap was
 * documented but NOT implemented in code at all — the footer container had no max-height/clipping
 * of any kind, a silent gap since this rail currently only ships 2 footer items (Profile, Settings),
 * so the cap was never yet exercised or missed in practice).
 */
const RAIL_BUTTON_SIZE = 38
const FOOTER_GAP = 4
const FOOTER_MAX_ICONS = 3
const FOOTER_MAX_HEIGHT = RAIL_BUTTON_SIZE * FOOTER_MAX_ICONS + FOOTER_GAP * (FOOTER_MAX_ICONS - 1)

/**
 * M-6 overflow-fit contract (see rail-sidebar.ts for the full history): a hard ceiling on how many
 * pinned sections the rail track will ever show at once, independent of how tall the track's
 * container physically is. Previously this was an implicit "whatever fits" behavior derived purely
 * from available pixel height — a sufficiently tall viewport could pin an unbounded number of rows,
 * which was never an explicit, testable contract. `useOverflowFit` (src/hooks/useOverflowFit.ts) now
 * enforces this ceiling directly; anything beyond it is stashed into the overflow ("More") menu
 * regardless of available vertical space.
 */
const RAIL_MAX_VISIBLE_SECTIONS = 12


function labelHits(label: string, term: string): boolean {
  return label.toLowerCase().indexOf(term) !== -1
}

function filterTree(nodes: PanelNode[], query: string): { nodes: PanelNode[]; matchIds: string[] } {
  const term = query.trim().toLowerCase()
  if (!term) return { nodes, matchIds: [] }

  const matchIds: string[] = []

  function keepMatching(list: PanelNode[]): PanelNode[] {
    const kept: PanelNode[] = []
    for (const node of list) {
      if (node.kind === "leaf") {
        if (labelHits(node.label, term)) kept.push(node)
        continue
      }
      const ownLabelHits = labelHits(node.label, term)
      const survivingChildren = keepMatching(node.children)
      if (!ownLabelHits && survivingChildren.length === 0) continue
      matchIds.push(node.id)
      kept.push({ ...node, children: ownLabelHits ? node.children : survivingChildren })
    }
    return kept
  }

  return { nodes: keepMatching(nodes), matchIds }
}

function collectGroupIds(nodes: PanelNode[]): string[] {
  return nodes.flatMap((n) => (n.kind === "group" ? [n.id, ...collectGroupIds(n.children)] : []))
}

/**
 * True if `activeItemId` is a leaf anywhere inside this subtree — used to identify a group row as
 * an ANCESTOR of the currently selected item, not just the selected leaf itself. Matches origin's
 * real derivation (RailNav.tsx: `active (leaf or collapsed group on path) -> labelFont: TYPE.labelL`)
 * — origin bolds the label for the active leaf AND every collapsed group on the path to it,
 * regardless of expand state (only the row's background fill toggles off when a group is expanded).
 */
function containsActiveItem(nodes: PanelNode[], activeItemId: string | null): boolean {
  if (!activeItemId) return false
  return nodes.some((n) =>
    n.kind === "leaf" ? n.id === activeItemId : n.id === activeItemId || containsActiveItem(n.children, activeItemId)
  )
}

/**
 * Single source of truth for "this row is on the active path" emphasis (L-28/L-29's own lesson,
 * folded into CLAUDE.md's Primitive Fidelity Checklist item 20: text weight and icon fill must be
 * driven from ONE reused boolean/mechanism, never two separately-maintained conditionals that can
 * drift out of sync — which is exactly what happened here across two separate passes before the
 * icon half was caught). Returns BOTH the label className and the `aria-pressed` value together, so
 * a future edit to either the leaf row or the group row can't update one without the other: spread
 * the `ariaPressed` result directly onto `Button`'s own `aria-pressed` prop (which its built-in
 * `useActionIconFill`/`fillActionIcons` wiring already reads for icon fill — see src/ui/button.tsx),
 * and the `className` result into the row's own `cn(...)` call for the label weight.
 *
 * QA finding (see divergence row L-34): this used to also carry `leading-none` on the active-path
 * branch (`"leading-none font-medium"`), collapsing the label's own line-height to exactly its
 * font-size (14px, confirmed live via getComputedStyle — was `line-height: 14px` on every
 * active-path row, vs. `20px` on regular rows). The label span also carries `truncate`
 * (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) for its horizontal ellipsis —
 * so any glyph with a descender (g/y/p/q/j — "System logic", "Monthly", etc. — NOT "Schedules",
 * which contains no descender at all and was never affected; see L-34's own CORRECTION note in
 * rail-sidebar.ts for how that wrong example got written down and propagated) rendered per the
 * font's own ascent/descent metrics past that reduced 14px line box, and `overflow: hidden` clipped
 * it right at the bottom, specifically only on bolded/active-path rows. Confirmed against origin's
 * real tokens (design-system's `tokens.ts`): `bodyM` (rest) and `labelL` (active) share the IDENTICAL
 * `lineHeight: 1.55` — origin only ever changes `fontWeight` between these two states, never
 * line-height. `leading-none` had no origin basis at all; it was a bidezine-introduced value with
 * nothing to preserve. FIXED by dropping it, keeping only the weight change — restores the row to
 * the same `text-sm` 20px line-height every regular row already safely uses (verified: plenty of
 * descender clearance, no clipping), and makes bidezine's active/inactive label contract match
 * origin's real "only weight changes" convention exactly. Row height is unaffected (each row's
 * outer height comes from the button's own fixed sizing, not the label's line-height), so this is
 * a pure text-rendering fix with no layout/spacing regression.
 */
function pathEmphasis(isOnActivePath: boolean) {
  return {
    ariaPressed: isOnActivePath,
    className: isOnActivePath ? "font-medium" : "font-normal",
  }
}

/**
 * Shared background/foreground escalation for every rail-style icon affordance (`RailIconButton`,
 * the overflow trigger, and — per divergence row L-1 — the logo slot). Deliberately written as a
 * plain, colors-in/colors-out function (not a hook, not rail-scoped state) so it's trivially
 * reusable by any FUTURE primitive that needs this exact same background+foreground ladder,
 * per the user's own framing: "this behavior right now is very specific for the rail but maybe in
 * the future can be used for other primitives."
 *
 * Given the caller's local hover/pressed interaction state (plus persistent active/browsing state
 * where applicable), returns the same background+foreground pair `RailIconButton` already computes
 * inline (see its own `background`/`color` derivation a few lines below):
 *   - pressed:           background = colors.pressed, foreground = colors.fg
 *   - active:             background = colors.active,  foreground = colors.fg
 *   - hovered/browsing:   background = colors.hover,   foreground = colors.fgHover
 *   - resting (default):  background = "transparent",  foreground = `restColor`
 *
 * `isInteractive` is the load-bearing gate requested in L-1: when `false`, hover/pressed/active/
 * browsing are never even consulted — the function unconditionally returns the resting pair, with
 * `restColor` substituted directly (no fallback to `colors.fgSubtle`, since a purely decorative
 * icon isn't a togglable nav item and has no "unselected" tier to fall back to). This is what makes
 * a non-interactive logo (no `href`, no click action) permanently render with zero hover/press
 * treatment — not just visually inert by coincidence, but structurally incapable of entering those
 * states at all, since the caller must simply never wire mouse handlers when `isInteractive` is
 * `false` (see `RailLogoSlot` below, which enforces exactly that).
 *
 * `restColor` defaults to `colors.fg` — the SAME foreground tone `RailIconButton` uses for its own
 * `active`/`pressed` tiers (its "selected" color) — because the logo slot's own resting state is
 * meant to already read as that same "selected" tone by default (L-1: "the logo should use the same
 * color as the icon when selected by default"), not the dimmer `colors.fgSubtle` a regular,
 * currently-unselected nav icon rests at. A future caller wanting the dimmer resting tone instead
 * (e.g. if this were reused for an ordinary unselected icon button) can simply pass
 * `restColor: colors.fgSubtle`.
 */
function iconInteractionColors(
  colors: RailColors,
  state: {
    isInteractive: boolean
    isActive?: boolean
    isBrowsing?: boolean
    isHovered: boolean
    isPressed: boolean
    restColor?: string
  },
): { background: string; color: string } {
  const { isInteractive, isActive = false, isBrowsing = false, isHovered, isPressed, restColor = colors.fg } = state
  if (!isInteractive) return { background: "transparent", color: restColor }
  if (isPressed) return { background: colors.pressed, color: colors.fg }
  if (isActive) return { background: colors.active, color: colors.fg }
  if (isHovered || isBrowsing) return { background: colors.hover, color: colors.fgHover }
  return { background: "transparent", color: restColor }
}

/**
 * L-1: the rail's logo slot, extracted out of the main render so its interactive-vs-decorative
 * contract lives in exactly one place instead of being duplicated across the "renders as `<a>`" and
 * "renders as `<div>`" branches that used to exist inline. Reported directly: "the logo should use
 * the same color as the icon when selected by default and govering [hovering] over should apply the
 * same color to the fill area as the other buttons... presing the icon logo should apply the color
 * of the fill area for press used on the other icons... this interactive behavior should only apply
 * if the icon triggers an action or a hyperlink, otherwhise the icon should not have a hover or
 * pressed state just default using the same token color as the other icons when selected."
 *
 * CONTRACT:
 *   - `isInteractive` (derived here as `Boolean(href)` — the only "triggers an action or hyperlink"
 *     signal this slot currently exposes; if a future `onClick` prop is ever added to the logo slot,
 *     it must be OR'd into this same `isInteractive` check, not treated as a separate gate) controls
 *     BOTH which element renders (`<a>` vs plain `<div>`) AND whether hover/press handlers are wired
 *     at all. A non-interactive logo never calls `setIsHovered`/`setIsPressed` — those handlers are
 *     omitted from the spread entirely, not merely guarded inside — so it is structurally impossible
 *     for a decorative logo to show a hover/press color, not just visually coincidental.
 *   - Color/background come from `iconInteractionColors` (see above), the SAME shared ladder
 *     `RailIconButton` uses, so the logo's hover/press tones can never independently drift from the
 *     rail's own icon buttons.
 *   - `children` (the actual mark — `logoIcon`, the placeholder box, or the default BiDezine SVG)
 *     is rendered with no color styling of its own; it relies on inheriting `color` from this
 *     wrapper via `currentColor` (the default SVG already sets `fill="currentColor"`; the
 *     placeholder box below is given `borderColor: "currentColor"` for the same reason) — so the
 *     mark automatically tracks every resting/hover/press color change with zero extra prop
 *     drilling.
 *   - MUST be `React.forwardRef` (not a plain function component): the render call site wraps this
 *     slot directly in `<TooltipTrigger asChild>` (see L-1's own tooltip contract below), and Radix's
 *     `asChild`/`Slot` mechanism clones its child and attaches a `ref` to it so it can track real
 *     hover/focus events on the actual DOM node. A plain (non-forwardRef) function component here
 *     silently swallows that ref — Radix then has nothing to attach hover tracking to, so the
 *     tooltip never opens, with NO error or warning anywhere. This is exactly what happened when this
 *     slot was first extracted out of inline JSX for the L-1/color-contract work: extracting native
 *     `<a>`/`<div>` markup (which accepts refs automatically) into a custom component broke the
 *     already-working L-1 tooltip-on-hover behavior without any visible failure until hover was
 *     actually tested live. If this component is ever refactored again, re-verify the tooltip still
 *     opens on hover — a passing typecheck/build gives zero signal that this ref chain is intact.
 *   - MUST accept and forward `...rest` props to the rendered element, NOT destructure only the
 *     props this component itself defines (`href`/`colors`/`children`). `TooltipTrigger asChild`
 *     clones its child (this component) with ADDITIONAL props merged in — `onPointerMove`,
 *     `onPointerLeave`, `onFocus`, `onBlur`, `data-state`, etc. — which is how Radix's Tooltip
 *     actually detects hover/focus on the real DOM node. Destructuring only the known props (as an
 *     earlier version of this fix did, even after adding `forwardRef`) silently drops every one of
 *     those Radix-injected props on the floor before they ever reach the rendered `<a>`/`<div>` —
 *     the ref reaches the DOM node correctly, but Radix's own pointer-tracking handlers never do, so
 *     the tooltip still never opens despite `forwardRef` being wired correctly. This is a SEPARATE
 *     failure mode from the missing-forwardRef one above; fixing one without the other still leaves
 *     the tooltip broken. Event-handler props already used internally here (`onMouseEnter`, etc.,
 *     only wired when `isInteractive`) must be composed with — not overwritten by — the incoming
 *     rest props, so both this component's own color-state tracking AND Radix's own hover/focus
 *     tracking fire correctly.
 */
const RailLogoSlot = forwardRef<
  HTMLAnchorElement | HTMLDivElement,
  { href?: string; colors: RailColors; children: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement | HTMLDivElement>
>(function RailLogoSlot({ href, colors, children, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...rest }, ref) {
  const isInteractive = Boolean(href)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const { background, color } = iconInteractionColors(colors, { isInteractive, isHovered, isPressed })

  const sharedProps = {
    ...rest,
    className: "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg",
    style: {
      background,
      color,
      transition: isInteractive ? "background-color 150ms ease, color 150ms ease" : undefined,
      ...rest.style,
    },
    // Only wired when interactive — see this function's own doc comment for why this must be an
    // omission, not a no-op guard inside the handler. Composed with (not overwriting, not
    // overwritten by) whatever Radix's Slot injects onto the same event, so both this component's
    // own color-state tracking and Radix's own hover/focus tracking fire on every event.
    ...(isInteractive
      ? {
          onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
            setIsHovered(true)
            onMouseEnter?.(e)
          },
          onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
            setIsHovered(false)
            setIsPressed(false)
            onMouseLeave?.(e)
          },
          onMouseDown: (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
            setIsPressed(true)
            onMouseDown?.(e)
          },
          onMouseUp: (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
            setIsPressed(false)
            onMouseUp?.(e)
          },
        }
      : { onMouseEnter, onMouseLeave, onMouseDown, onMouseUp }),
  }

  if (href) {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} target="_blank" rel="noreferrer" {...sharedProps}>
        {children}
      </a>
    )
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} {...sharedProps}>
      {children}
    </div>
  )
})

function RailIconButton({
  section,
  state,
  colors,
  onClick,
  anchorRef,
  forcedState,
}: {
  section: RailSection
  state: "default" | "browsing" | "active"
  colors: RailColors
  onClick: () => void
  /**
   * Divergence ref to anchor this button with, if it is the representative instance. Only ONE rail
   * button may carry it — the runner fails an anchor that matches more than one element — so the
   * resulting evidence proves that button, not all 27 of them. See lib/divergence-anchors.tsx.
   */
  anchorRef?: string
  /**
   * Hold this button in an interaction state so a divergence about that state can actually
   * be looked at — see `sandbox/REVIEW-CARD-SPEC.md` §5.3.
   *
   * A prop rather than a simulated event, because simulating does not work and that was
   * measured rather than assumed. This component drives hover and press from React state
   * (below), not from CSS `:hover`, so dispatching a `mouseover` LOOKS like it should
   * reach it — React synthesises `onMouseEnter` from delegated `mouseover`, and it ignores
   * a synthetic dispatch. Verified three ways against the live rail: a real Playwright
   * `hover()` moved the background to `oklch(0.301 0 0)` (B-2's own proposed
   * `--sidebar-rail-hover`), while dispatched `mouseover`, `mouseover` with a
   * `relatedTarget`, and `pointerover` + `mouseover` all left it untouched.
   *
   * It ORs with the real state rather than replacing it, so a forced hover does not freeze
   * the button against a genuine pointer — you can still interact with what you are shown.
   */
  forcedState?: string | null
}) {
  const anchor = useDivergenceAnchor()
  const Icon = section.icon
  const isActive = state === "active"
  const isBrowsing = state === "browsing"
  // Origin's RailButtonDark drives background/foreground from local hover/pressed state, layered
  // under the persistent active/browsing state — not from Tailwind's `hover:`/`active:` pseudo-
  // classes, because the color VALUES are per-instance dark-rail tokens (approved via Q2/B-2/B-3/
  // B-4/B-7), not static utility classes. This was previously missing entirely: the button's
  // className carried `hover:bg-transparent`, which suppressed Button's own default ghost-variant
  // hover feedback (`hover:bg-accent`, a light-surface token that would look wrong here) without
  // ever substituting the correct dark-rail hover/pressed tokens in its place — so the rail had no
  // hover or press feedback at all despite Button always having those states "assigned" (Q2's
  // tokens were resolved and approved, just never actually referenced in this component).
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // The forced state ORs in; it never replaces. `browsing` maps onto hover because that is
  // what the resolver below already does with it — one boolean, not a fourth branch.
  const hovered = isHovered || forcedState === "hover" || forcedState === "browsing"

  /**
   * `active` here means CSS `:active` — a transient press — and NOT this component's own
   * `isActive`, which is the persistent "this is the current section" look driven by the
   * `state` prop. Same word, two unrelated things, and the collision is load-bearing:
   * declaring a row `subject_state = 'active'` expecting the selected look would insert
   * cleanly against migration 010's vocabulary check and then render nothing, because
   * nothing in this resolver reads it that way. Caught in review before any row was
   * written that way.
   *
   * The database's vocabulary wins. It is shared across every occupant and matches the
   * runner's own `applyState`; this component's local naming is what bends.
   */
  const pressed = isPressed || forcedState === "pressed" || forcedState === "active"

  const background = pressed ? colors.pressed : isActive ? colors.active : hovered ? colors.hover : "transparent"
  const color = isActive || pressed ? colors.fg : isBrowsing || hovered ? colors.fgHover : colors.fgSubtle

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isActive}
      data-state={isBrowsing ? "open" : isActive ? "active" : "default"}
      // M-6: explicit measurement marker for `useOverflowFit` — see rail-sidebar.ts row M-6.
      data-rail-row=""
      {...(anchorRef ? anchor(anchorRef) : {})}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      // QA finding (see divergence row M-19): `size="icon"` carries Button's own `size-9` (36px)
      // sizing utility. An override of `h-[38px] w-[38px]` looks like it should win (appears later
      // in the className string) but doesn't: tailwind-merge only dedupes classes in the SAME
      // conflict group, and `size-*` vs `h-*`/`w-*` aren't grouped together, so both survive and
      // the compiled stylesheet lets `size-9` win the cascade tie — silently rendering the button
      // 36px instead of the intended 38px. Same root-cause class as M-18's search-icon overlap.
      // Fixed by using the matching `size-[38px]` shorthand, which IS in size-9's conflict group
      // and correctly replaces it.
      className="size-[38px] shrink-0 rounded-lg"
      style={{
        background,
        color,
        boxShadow: isBrowsing ? `inset 0 0 0 1.5px ${colors.border}` : undefined,
        transition: "background-color 150ms ease, color 150ms ease",
      }}
    >
      {/* F-2's decision is "railButton = 38px / railIcon = 20px", but its original check asserted
          only the button box — an independent review measured the icon at 20x20 and pointed out
          nothing guarded it. `spec.anchor` and `spec.divergence` are separate fields in the runner,
          so a second spec can carry anchor "F-2-icon" while still writing its evidence to
          divergence F-2. Same representative-instance caveat as the button itself. */}
      <Icon
        {...(anchorRef ? anchor(`${anchorRef}-icon`) : {})}
        className="size-5"
        filled={isActive || isBrowsing || isHovered || isPressed}
      />
      <span className="sr-only">{section.label}</span>
    </Button>
  )

  // Origin's RailButtonDark explicitly suppresses the hover tooltip once a button is active or
  // browsing (showTooltip = ... && !isBrowsing && !isActive && !isDisabled) — the tooltip would be
  // redundant once the button's own panel is already open/selected. Skip the Tooltip wrapper
  // entirely in those states rather than toggling Radix's `open` prop (which would flip the
  // component between controlled/uncontrolled and trigger a React warning).
  if (isActive || isBrowsing) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{section.label}</TooltipContent>
    </Tooltip>
  )
}

// Default badge treatment for this rail's panel tree: variant="muted" weight="regular" (see divergence
// row L-6 in sandbox/src/data/rail-sidebar.ts, and the "Guidance for an AI composing NEW Badge
// usage" note in src/ui/badge.tsx's own doc comment). `muted` keeps these dense, frequently-repeated
// inline counts/labels ("+23", "New", "+05") visually receding rather than competing with row content —
// `secondary`'s filled-pill look was too visually loud for a badge that appears many times per panel.
// `weight="regular"` is the advised AI default per the same guidance; bolder `weight="emphasis"` or a
// different `variant` (e.g. `warning`/`info`) remains valid and available for a specific badge that
// genuinely needs to stand out (an alert-level status, something explicitly requested), just not the
// unexamined default for every new one.
function PanelBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="muted"
      weight="regular"
      className="ml-2 shrink-0 px-1.5 py-0 text-[10px]"
    >
      {label}
    </Badge>
  )
}

/**
 * Reads the enclosing `ScrollArea`'s real overflow state via React Context (`useScrollAreaOverflow`)
 * rather than the CSS `group-data-[scrollable-y=true]/scroll-area:` selector this file used before —
 * that selector matches ANY ancestor sharing the `group/scroll-area` class + attribute, not just the
 * nearest one, which silently broke here once the site wraps every page (including this rail panel)
 * in its own outer, almost-always-scrollable `ScrollArea` (see src/ui/scroll-area.tsx's authoring
 * note for the full root-cause writeup, logged as L-26).
 *
 * QA finding (see divergence row L-33): this used to carry an unconditional base `p-1.5` (6px, all
 * sides) on top of its own conditional `pr-4` gutter. That base padding was the ONLY padding source
 * back when this component was first written (L-18), but once the parent `<div className="...p-2">`
 * wrapper was added around the whole `ScrollArea` (L-21, to give the scrollbar clearance from the
 * PANEL's own outer edge), nobody reconciled the two — this inner `p-1.5` became a second, redundant
 * layer stacked on top of the outer one on the left/top/bottom sides, where nothing needs any extra
 * clearance at all. Measured live: the tree rows sat 14px from the panel's content edge (8px outer +
 * 6px inner) while the search box above — which only ever passes through ONE padding layer, its own
 * `px-2 pt-2` wrapper — sat at a proper 8px, making the options area look noticeably "too deep."
 * Confirmed against origin's real source (reference/origin-design-system/gallery/RailNav.tsx, its
 * "NavPanelShell FRAME" ~lines 989-1013): origin's outer shell owns a single `padding: SPACE[2]px`
 * (8px, all sides) and its inner `<nav>` carries ZERO base padding of its own — only the same kind of
 * conditional right-only scrollbar gutter this file already has (`paddingRight: navScrollable ?
 * SPACE[2] : 0`). Origin never double-stacks a second uniform padding layer; bidezine's did, purely
 * as an artifact of two separate historical fixes (L-18, L-21) that were each correct in isolation
 * but never reconciled with each other. FIXED by dropping the redundant base `p-1.5` entirely, keeping
 * only the conditional right-side gutter — this is mathematically a no-op for the scrollbar-clearance
 * behavior itself (Tailwind's `pr-4` already overrode, not added to, `p-1.5`'s own right value via
 * tailwind-merge, so the scrollable-state right gap is unchanged), while making the left/top/bottom
 * sides match the search box's single-layer 8px exactly, same as origin's real single-outer-padding
 * structure.
 */
function PanelTreeScrollGutter({ children }: { children: React.ReactNode }) {
  const { scrollableY } = useScrollAreaOverflow()
  return <div className={cn(scrollableY && "pr-4")}>{children}</div>
}

function PanelTree({
  nodes,
  depth,
  expanded,
  onToggle,
  activeItemId,
  onSelectLeaf,
  colors,
}: {
  nodes: PanelNode[]
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  activeItemId: string | null
  onSelectLeaf: (id: string) => void
  colors: RailColors
}) {
  const anchor = useDivergenceAnchor()
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        if (node.kind === "leaf") {
          const isSelected = node.id === activeItemId
          const emphasis = pathEmphasis(isSelected)
          const Icon = node.icon
          if (node.disabled) {
            return (
              <div
                key={node.id}
                aria-disabled="true"
                // QA finding (see divergence row L-13): this plain div had no vertical padding at
                // all (relying solely on `items-center` + fixed height for centering), while every
                // real Button row (leaf/group/selected) carries `py-2` (8px) from Button's own base
                // recipe, which we never override. No visible difference today — both approaches
                // center content identically inside a fixed-height flex row — but the underlying
                // values didn't actually match. Added `py-2` explicitly so this row's computed
                // padding is identical to every other row, not just visually equivalent.
                // DEPLOYMENT NOTE (see divergence rows F-5/F-6, log entry L-43): `h-8` (32px), not
                // `h-9` (36px) — see the group-toggle row's own comment below for the full rationale.
                className="flex h-8 items-center gap-1.5 rounded-md px-2 py-2 text-sm"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{node.label}</span>
                {node.badge && <PanelBadge label={node.badge} />}
              </div>
            )
          }
          return (
            <Button
              key={node.id}
              type="button"
              variant="ghost"
              aria-pressed={emphasis.ariaPressed}
              onClick={() => onSelectLeaf(node.id)}
              // QA finding (see divergence row L-12): `px-2` alone didn't actually win — Button's
              // own default-size recipe carries `has-[>svg]:px-3` (12px, conditional on containing
              // an icon), which is a DIFFERENT conflict group to tailwind-merge than plain `px-2`,
              // so both survive and the base `has-[>svg]:px-3` kept winning the cascade (confirmed:
              // icon sat 12px from the button edge, not the intended 8px) — the exact same
              // failure class as M-18/M-19. Explicitly repeating the override AS a `has-[>svg]:`
              // variant (not just the plain utility) puts it in the same conflict group so it
              // actually replaces the base rule.
              // L-28/L-29: label weight/leading AND icon fill (via `aria-pressed` above, read by
              // Button's own useActionIconFill/fillActionIcons) both derive from the SAME
              // `pathEmphasis(isSelected)` call — see checklist item 20 for why this must stay a
              // single shared mechanism rather than two independently-maintained conditionals.
              className={cn(
                "h-8 w-full justify-start gap-1.5 rounded-md px-2 has-[>svg]:px-2 text-left text-sm hover:bg-accent",
                emphasis.className
              )}
              style={{
                // QA finding (see divergence row L-10): this used to be `background: isSelected ?
                // "var(--foreground)" : "transparent"` unconditionally — but an inline `style`
                // value ALWAYS wins over a class-based rule for the same CSS property, regardless
                // of the class's specificity or pseudo-state, so the literal string "transparent"
                // permanently blocked the `hover:bg-accent` class from ever visually applying on
                // unselected leaf rows (confirmed via getComputedStyle: hover stayed rgba(0,0,0,0)
                // instead of tinting). Omitting the property entirely when not selected (rather
                // than setting it to "transparent") lets the real hover:bg-accent class govern the
                // resting/hover background as intended, while a selected row still keeps its solid
                // persistent highlight.
                background: isSelected ? "var(--foreground)" : undefined,
                color: isSelected ? "var(--background)" : "var(--foreground)",
              }}
            >
              <Icon className="size-4 shrink-0" />
              {/* L-34 is anchored to the SELECTED leaf's label only. That is what makes it unique
                  (exactly one leaf is selected at a time) and it is also the row the divergence is
                  about: active-path rows are the ones that carried `leading-none`, collapsing the
                  line box to the 14px font-size and clipping descenders against this same span's
                  own `truncate` overflow. An unselected row would measure 20px whether or not the
                  bug were present, and would prove nothing. */}
              <span {...(isSelected ? anchor("L-34") : {})} className="flex-1 truncate">
                {node.label}
              </span>
              {node.badge && <PanelBadge label={node.badge} />}
            </Button>
          )
        }

        const isOpen = expanded.has(node.id)
        // L-28: matches origin's real derivation of "active" for a group row — bold/tighter label
        // whenever the currently selected leaf lives anywhere in this group's subtree, regardless
        // of expand state (see the `containsActiveItem` doc comment above for the origin citation).
        const isAncestorOfActive = containsActiveItem(node.children, activeItemId)
        const emphasis = pathEmphasis(isAncestorOfActive)
        return (
          <Collapsible key={node.id} open={isOpen} onOpenChange={() => onToggle(node.id)}>
            <CollapsibleTrigger asChild>
              {/* QA finding (see divergence row L-9): group-toggle rows previously used a visibly
                  DIFFERENT recipe from sibling leaf rows (h-8/text-xs/font-medium/muted vs
                  h-9/text-sm/font-normal/full-color) — they read as a distinct "kind" of element
                  (a section caption) rather than the same row type nested one level deeper. Fixed
                  by giving this row the EXACT SAME className/color recipe as the leaf Button below,
                  varying only by depth-based indentation (now a compounding wrapper — see L-11)
                  and the chevron affordance — the chevron communicates "this expands," not a
                  different visual tier. This is a DELIBERATE, flagged divergence from bidezine's
                  own real Sidebar sub-menu convention (SidebarMenuButton + SidebarMenuSub/
                  SidebarMenuSubButton), which intentionally shrinks text/height one level deeper —
                  chosen here because (a) that pairing is context-bound to a real <SidebarProvider>
                  tree (SidebarMenuButton calls useSidebar(), which throws without one) and doesn't
                  fit this panel's own composition, and (b) explicit user preference: parent and
                  child rows should look like the same kind of element, nested at different levels,
                  not visually demoted by depth.

                  DEPLOYMENT NOTE (see divergence rows F-5/F-6, log entry L-43): the shared row
                  height itself was ALSO revisited and changed from h-9 (36px) to h-8 (32px). 36px
                  never matched any real bidezine convention at any depth. 32px does, on TWO
                  independent counts: (1) it's bidezine's own Sidebar SidebarMenuButton top-level row
                  height, and (2) — the stronger precedent, since this tree genuinely nests 3-5
                  levels deep, not just one — it's the SAME uniform height DropdownMenuItem and
                  DropdownMenuSubTrigger/ContextMenuSubTrigger/MenubarSubTrigger already use at EVERY
                  nesting depth in production (measured live via getBoundingClientRect: both render
                  at exactly 32px, with zero shrink no matter how many Sub levels are nested). Sidebar
                  intentionally shrinks to 28px one level deep, but Sidebar's own sub-menu component
                  has no 3rd/4th/5th-level variant to extend that shrink from — the Dropdown/Context/
                  Menubar family is the only bidezine precedent that actually proves "uniform height
                  works at arbitrary depth" in a shipped component, so it — not Sidebar's one-level
                  shrink — is the correct precedent for this arbitrarily-deep tree. */}
              <Button
                type="button"
                variant="ghost"
                // F-5 / F-6 (row height unified to h-8 / 32px at EVERY nesting depth) are anchored
                // to two specific group rows, BY NODE ID, because each anchor must resolve to
                // exactly one element: "system-logic" is a top-level row (depth 0) and "schedules"
                // is its child (depth 1). Anchoring by depth alone would not be unique — PanelTree
                // recurses per group, so several sibling groups render rows at the same depth. The
                // PAIR is the point: F-6 exists to show the height does NOT shrink one level down
                // the way bidezine's own SidebarMenuSubButton does (28px), and a single anchored row
                // could never demonstrate that.
                {...(node.id === "system-logic" ? anchor("F-5") : node.id === "schedules" ? anchor("F-6") : {})}
                // L-28/L-29: label weight/leading AND icon fill both derive from the SAME
                // `pathEmphasis(isAncestorOfActive)` call (checklist item 20) — `aria-pressed` here
                // is read automatically by Button's own `useActionIconFill`/`fillActionIcons` wiring
                // (src/ui/button.tsx) to fill this group's own content icon (node.icon), with no
                // separate `filled={...}` prop needed at this call site.
                aria-pressed={emphasis.ariaPressed}
                // QA finding (see divergence row L-12): same has-[>svg]:px-3 vs px-2 conflict-group
                // gap as the leaf Button above — repeating the override as a has-[>svg]: variant
                // makes it actually win over Button's own default-size base recipe.
                className={cn(
                  "h-8 w-full justify-start gap-1.5 rounded-md px-2 has-[>svg]:px-2 text-left text-sm hover:bg-accent",
                  emphasis.className
                )}
                style={{ color: "var(--foreground)" }}
              >
                {/* QA finding (see divergence row L-17): the chevron used to be the FIRST element
                    here, before the icon/label — that placement was copied straight from origin's
                    own real source (design-system/src/gallery/RailNav.tsx renders its chevron slot
                    before the nav-icon slot), never actually checked against bidezine's OWN chevron
                    conventions. Confirmed both of bidezine's real "expand/collapse with a chevron"
                    primitives put the chevron at the FAR RIGHT, not the left: AccordionTrigger
                    (src/ui/accordion.tsx) renders `{children}` first and `<ChevronDownIcon>` last
                    inside a `justify-between` row; DropdownMenuSubTrigger/ContextMenuSubTrigger/
                    MenubarSubTrigger all place their `ChevronRightIcon` last with `ml-auto`. Group
                    rows now match that: this group's own content Icon comes first (previously
                    missing entirely — see the GroupNode.icon field above), then the label, then the
                    optional badge, then the chevron — the exact same element order as a leaf row,
                    with only the chevron appended at the end. The label's own `flex-1` already
                    pushes everything that follows it (badge, chevron) hard against the row's right
                    edge, the same mechanism that already positions the badge correctly today, so no
                    extra `ml-auto` is needed on the chevron itself. */}
                <node.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{node.label}</span>
                {node.badge && <PanelBadge label={node.badge} />}
                <svg
                  viewBox="0 0 20 20"
                  className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={FULL_PREVIEW_ICONS.chevronDown.d} />
                </svg>
              </Button>
            </CollapsibleTrigger>
            {/* RESOLVED (see divergence row L-7): real expand/collapse animation using
                tw-animate-css's collapsible-down/-up keyframes, which read Radix's own
                --radix-collapsible-content-height (the same recipe bidezine's real Accordion already
                uses for its own auto-height animation via --radix-accordion-content-height, just the
                Collapsible-specific variable instead). Height is measured live by Radix from the
                actual rendered content on every open — no fixed pixel height anywhere.
                Overflow-hidden is required so content doesn't render past the 0-height
                starting/ending frame. Scoped to this call site only, not bidezine's shared
                src/ui/collapsible.tsx primitive. User approved live before this row was marked
                resolved in rail-sidebar.ts. */}
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              {/* PROPOSAL, not yet confirmed (see divergence row L-11): a vertical guide line
                  indicating hierarchy, matching the real technique bidezine's own Sidebar uses for
                  SidebarMenuSub (a plain `border-l` on the nested group's wrapper — border color
                  is the real, globally-available --border token, not scoped to a live
                  SidebarProvider tree, so it's safe to reuse here even though this panel isn't a
                  real Sidebar instance). Indentation is now a compounding 20px step per recursion
                  level (14px margin + 6px padding past the line) instead of each row computing an
                  absolute depth*14 offset directly — avoids double-indenting now that the line
                  itself carries part of the visual offset. */}
              <div
                className="flex flex-col gap-0.5 border-l pl-1.5"
                style={{ marginLeft: 16, borderColor: "var(--border)" }}
              >
                <PanelTree
                  nodes={node.children}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  activeItemId={activeItemId}
                  onSelectLeaf={onSelectLeaf}
                  colors={colors}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}

interface RailColors {
  surface: string
  hover: string
  pressed: string
  active: string
  border: string
  divider: string
  fg: string
  fgHover: string
  fgSubtle: string
  fgDisabled: string
  panelSurface: string
  hairline: string
}

/**
 * Mirrors `react-resizable-panels`' own `PanelImperativeHandle` shape (see
 * `node_modules/react-resizable-panels/dist/react-resizable-panels.d.ts`) so the browsing panel's
 * `panelRef` can be typed here without sandbox taking a direct dependency on that package
 * (it's only ever installed transitively, via `@bidezine/system`'s own `src/ui/resizable.tsx`).
 */
interface RailPanelHandle {
  collapse: () => void
  expand: () => void
  getSize: () => { asPercentage: number; inPixels: number }
  isCollapsed: () => boolean
  resize: (size: number | string) => void
}


/**
 * Guards against feeding a CSS custom property back into itself. In "bidezine" (adjusted) mode,
 * `colors.hairline` resolves to the literal passthrough string `"var(--border)"` (see
 * `FullRailPreview.tsx`'s `colorsFor` — the C-6..C-9 panel tokens are deliberately left as direct
 * `var(--x)` reads of the app's own design-system tokens rather than hardcoded hex). That's fine
 * when read directly (e.g. `borderColor: colors.hairline` elsewhere in this file), but is NOT fine
 * when used to locally *redeclare* that same custom property on an element, as the two
 * DropdownMenuContent/DropdownMenuSubContent style blocks below do (`"--border": colors.hairline`)
 * — `--border: var(--border)` is a self-reference, which CSS treats as invalid at computed-value
 * time, silently falling back to the app root's own ambient `--border` token instead. That ambient
 * token happens to be a light, near-white value (meant for light-surface borders elsewhere in the
 * app), which is exactly the "white line" reported as too strong on this dark popup. This helper
 * omits the override entirely whenever the value would just be a self-reference, letting the
 * element fall through to the *real* inherited `--border` naturally (still correct, just without
 * the redundant, circular redeclaration) — while still allowing a genuine literal value (e.g.
 * origin mode's real hex hairline) to override normally.
 */
function nonCircularVar(name: string, value: string): string | undefined {
  return value.replace(/\s+/g, "") === `var(${name})` ? undefined : value
}

/**
 * M-7's default `adjacentContent` (see rail-sidebar.ts for the full history): a single real
 * `Skeleton` block (from `@bidezine/system`) filling the full available width and height, per the
 * standing "no hand-rolled components" rule — a plain `<div>` with placeholder text or a hand-styled
 * rectangle would itself be exactly the kind of hand-rolled approximation this project's rules
 * prohibit. Every real consumer of `FunctionalRailSidebar` is expected to pass its own real
 * `adjacentContent`; this is only the fallback shown when one isn't supplied, kept deliberately
 * simple (one block, not a fabricated multi-widget layout) since it exists purely to demonstrate the
 * resize interaction reflowing real content, not to imply any particular real page structure.
 */
function AdjacentContentPlaceholder({ collapseLeftInset }: { collapseLeftInset: boolean }) {
  return (
    // M-21 FOLLOW-UP (see rail-sidebar.ts): this placeholder's own `p-4` gives real
    // `adjacentContent` breathing room from the browsing panel's right edge when it's open — but
    // that SAME left-side padding also stacks on top of the outer row's real `RAIL_PANEL_GAP` (8px)
    // once the browsing panel collapses, since the widget then sits directly against the rail with
    // nothing else between them. Measured live: 8px (real gap) + 16px (this padding, still applied)
    // = a 24px visual gap where only 8px was intended. `collapseLeftInset` (driven by the same
    // `isBrowsingPanelCollapsed` state that hides `ResizableHandle`) zeroes it out via inline style
    // — not a `pl-0` class, since Tailwind's cascade order for a longhand vs. this shorthand `p-4`
    // isn't guaranteed by className string position alone; an inline style always wins.
    <div className="h-full w-full bg-muted/30 p-4" style={collapseLeftInset ? { paddingLeft: 0 } : undefined}>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}

/**
 * DEPLOYMENT NOTE (see divergence row F-10): `height` here is a measured pixel NUMBER, not a
 * percentage/`h-full` — that's this sandbox preview's own plumbing (App.tsx's `FillHeight`
 * measures its stage's clientHeight via ResizeObserver and passes the number down), not something
 * to carry over into the real `src/ui/` component. The actual requirement is just "the rail fills
 * whatever vertical space its parent gives it" — at real Build time, prefer ordinary CSS sizing
 * (e.g. `h-full` on the outer element, with the consumer's own layout providing a definite height
 * further up the tree, such as `h-screen` at the app-shell level) over requiring a measured-height
 * prop like this one.
 */
export function FunctionalRailSidebar({
  colors,
  height = 550,
  fontFamily,
  adjacentContent,
  logoLabel = "BiDezine",
  logoHref,
  logoIcon,
  logoPlaceholder = false,
  anchors = false,
  forcedState = null,
}: {
  colors: RailColors
  height?: number
  fontFamily: string
  /**
   * M-7: real content to render in the resizable region beside the panel — the actual
   * "rest of the page" a production consumer would place here. Falls back to a lightweight
   * placeholder (see the `ResizablePanel` housing it) when omitted, which is fine for a quick
   * preview but not representative of a real deployment — pass real content wherever possible.
   */
  adjacentContent?: React.ReactNode
  /**
   * M-9 LOGO CONTRACT (see rail-sidebar.ts row M-9 for the full decision record). This is the
   * name shown in the logo slot's hover tooltip (Radix `Tooltip`, always visible regardless of
   * rail state — matches origin's `LogoSlotDark`, see M-5/L-1). Defaults to "BiDezine" for this
   * design system's own brand; ANY other consumer overriding `logoIcon` below MUST also override
   * this to their own product/brand name, never leave it as "BiDezine".
   */
  logoLabel?: string
  /**
   * M-9 LOGO CONTRACT: when provided, the logo slot renders as a real hyperlink
   * (`<a href={logoHref} target="_blank" rel="noreferrer">`) that navigates to this URL on click
   * — e.g. a marketing site, a docs home, or an internal app root. When omitted, the logo slot
   * renders as a plain, non-interactive `<div>` (no click behavior), matching the pre-M-9
   * behavior for consumers that don't want the logo to be clickable.
   */
  logoHref?: string
  /**
   * M-9 LOGO CONTRACT — mandatory process, not just a prop: before writing any code that wires a
   * specific logo into a real consumer's Rail Sidebar, the AI (or human implementer) MUST
   * explicitly ask the requester for their logo, in SVG format, sized to fit this slot's real
   * rendered box (38×38px rail-button hit area; the icon itself renders at a 24×24px / `size-6`
   * mark inside it — see `BIDEZINE_LOGO_VIEWBOX`'s own 26.064×24 aspect for this component's own
   * default mark as a sizing reference). Never invent, guess, or auto-generate a logo. If the
   * requester has no logo ready yet, there are exactly two acceptable interim states, both
   * explicit and visible (never silently substitute one for the other):
   *   1. Leave `logoIcon` unset — renders this design system's own default BiDezine mark
   *      (`BIDEZINE_LOGO_PATH`) as a clearly-temporary stand-in, OR
   *   2. Set `logoPlaceholder` to `true` — renders an empty, bordered box with no mark at all, a
   *      deliberate "logo pending" signal distinct from the branded default, for consumers who
   *      don't want BiDezine's own mark shown even temporarily.
   * Once the real SVG is supplied, pass its markup as `logoIcon` (a `<svg>` element/fragment,
   * NOT an `<img>` — see CLAUDE.md's "SVG icons must be rendered as inline `<svg>`" rule) sized to
   * this same 24×24px slot; also set `logoLabel` to the real brand/product name at the same time.
   */
  logoIcon?: React.ReactNode
  /**
   * M-9 LOGO CONTRACT: renders an empty, outlined placeholder box instead of this design system's
   * own default BiDezine mark when no real `logoIcon` has been supplied yet. Ignored if `logoIcon`
   * is also provided (an explicit `logoIcon` always wins). See `logoIcon`'s own doc comment above
   * for the full request/interim-state process this flag is part of.
   */
  logoPlaceholder?: boolean
  /**
   * Emit `data-divergence` anchors (SANDBOX-SPEC §5.5) so `verifier/run-checks.mjs` can resolve a
   * divergence to the exact rendered element it describes. Off by default, and **only one rendered
   * instance may switch it on**: the runner fails any anchor matching more than one element, and
   * this component is mounted twice by `FullRailPreview` (a `dark:hidden` copy and a
   * `hidden dark:block` copy, both always present in the DOM). See `lib/divergence-anchors.tsx`.
   */
  anchors?: boolean
  /**
   * Hold one anchored element in an interaction state, so a divergence whose claim is about
   * that state can be seen rather than described.
   *
   * `{ ref, state }` rather than a bare state: the ref decides WHICH element is held, which
   * is the same question `data-divergence` answers, so the two stay in step. A ref this
   * component does not recognise holds nothing — an unknown ref must show a resting rail,
   * not a guess about which element was meant.
   *
   * Today only F-2's button responds. That is not a limitation of the mechanism but of the
   * corpus: `subject_state` is `rest` or NULL on every row, so nothing yet declares a state
   * to hold. When the colour rows are anchored and declare one, they key in here.
   */
  forcedState?: { ref: string; state: string } | null
}) {
  const [openPanel, setOpenPanel] = useState<string | null>("slides")
  const [activeSectionId, setActiveSectionId] = useState("slides")
  const [activeItemId, setActiveItemId] = useState<string | null>("monthly")
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["system-logic", "schedules"]))
  const [searchEnabled, setSearchEnabled] = useState(true)
  const [query, setQuery] = useState("")
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)
  const [overflowHovered, setOverflowHovered] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  // M-6: the track is the flex-1 middle segment of the rail column, so flexbox has already sized
  // it to whatever's left after the logo row and footer group above/below it — no separate
  // footer/logo subtraction needed here. `data-rail-row` (set on RailIconButton's own Button below)
  // is the explicit measurement marker the hook contract requires — see useOverflowFit.ts and
  // rail-sidebar.ts row M-6 for the full "why not querySelector('button')" writeup.
  const { fitCount: pinnedCount } = useOverflowFit({
    containerRef: trackRef,
    rowSelector: "[data-rail-row]",
    itemCount: TOP_SECTIONS.length,
    maxVisible: RAIL_MAX_VISIBLE_SECTIONS,
  })

  const mustStash = TOP_SECTIONS.length > pinnedCount
  const pinnedSections = mustStash ? TOP_SECTIONS.slice(0, Math.max(1, pinnedCount - 1)) : TOP_SECTIONS
  const stashedSections = mustStash ? TOP_SECTIONS.slice(pinnedSections.length) : []
  const stashHoldsActiveSection = stashedSections.some((s) => s.id === activeSectionId)

  const allSections = [...TOP_SECTIONS, ...FOOTER_SECTIONS]
  const openSection = allSections.find((s) => s.id === openPanel)

  // QA finding (see divergence row L-16): needed so the panel's own content (icon/label/tree data)
  // stays visible and rendered while `<Presence>` keeps the wrapper mounted for the exit animation
  // below \u2014 `openSection` itself goes `undefined` the instant the panel starts closing, which would
  // otherwise blank the panel out a frame before the fade/zoom-out animation even has a chance to
  // play. Updated synchronously during render (not via useEffect) so there's no one-tick lag where
  // the DOM would flash empty first.
  const lastOpenSectionRef = useRef(openSection)
  if (openSection) lastOpenSectionRef.current = openSection
  const displaySection = openSection ?? lastOpenSectionRef.current

  // M-7 FOLLOW-UP (see rail-sidebar.ts for the full history): the browsing panel and the
  // `adjacentContent` panel used to live inside a SINGLE `Presence`-gated `ResizablePanelGroup` —
  // the user found that collapsing the browsing panel (closing it entirely) made `adjacentContent`
  // vanish too, since `Presence` eventually unmounts its whole subtree, and that subtree WAS the
  // entire group, adjacent panel included. No real production consumer would want their actual page
  // content disappearing just because a flyout panel closed, so the group itself (and the adjacent
  // panel) now render unconditionally — only the browsing panel's own INNER content is Presence-gated
  // (see the JSX below). The browsing panel itself needs to visually shrink to 0 width when closed
  // (so `adjacentContent` reclaims that space) without unmounting from the group, which is exactly
  // what `react-resizable-panels`' own `collapsible`/`collapsedSize` + imperative `panelRef` are for —
  // reusing the primitive's real mechanism rather than hand-rolling a width animation.
  //
  // Collapsing happens on `onAnimationEnd` of the panel's own exit animation (not immediately on
  // `openSection` becoming falsy) so the existing fade/zoom-out animation (L-15/L-16) still gets to
  // play at full width first — collapsing the panel immediately would clip that animation to 0 width
  // instantly, defeating the whole point of it. Expanding, by contrast, happens immediately (no
  // animation to wait for before there's something visible to animate).
  const browsingPanelRef = useRef<RailPanelHandle>(null)
  useEffect(() => {
    if (openSection) browsingPanelRef.current?.expand()
  }, [openSection])

  // QA finding (this session): with the browsing panel collapsed to 0 width, `ResizableHandle`
  // still rendered as a floating grip with nothing on its left to resize against — the user
  // explicitly asked for it to be removed entirely in that state ("there is nothing to resize").
  // Tracked as real component state (not derived from `openPanel`, which flips the instant the
  // rail icon is clicked/re-clicked) so the handle stays visible through the panel's own exit
  // animation and only disappears once the panel has actually finished collapsing to 0 width —
  // matching the same moment `adjacentContent` visibly reclaims the freed space.
  const [isBrowsingPanelCollapsed, setIsBrowsingPanelCollapsed] = useState(false)

  // Keeps `openPanel` in sync if the user manually DRAGS the handle past the panel's own `minSize`
  // (which `collapsible` allows react-resizable-panels to auto-snap-collapse on) or drags a
  // collapsed panel back open — without this, dragging directly (bypassing the rail's own
  // open/close click handlers) would leave `openPanel` pointing at a section whose panel is actually
  // visually collapsed (or vice versa), desyncing the rail's own active/browsing highlight state.
  const handleBrowsingPanelResize = (size: { inPixels: number }) => {
    const isNowCollapsed = size.inPixels <= 0
    setIsBrowsingPanelCollapsed(isNowCollapsed)
    if (isNowCollapsed && openPanel !== null) {
      setOpenPanel(null)
    } else if (!isNowCollapsed && openPanel === null) {
      setOpenPanel(lastOpenSectionRef.current?.id ?? null)
    }
  }

  const handleRailClick = (section: RailSection) => {
    const isLeaf = section.items.length === 0
    if (isLeaf) {
      setActiveSectionId(section.id)
      setActiveItemId(null)
      setOpenPanel(null)
      return
    }
    if (openPanel === section.id) return // already browsing this section's panel
    setOpenPanel(section.id)
  }

  const handleSelectLeaf = (itemId: string) => {
    if (!openSection) return
    setActiveSectionId(openSection.id)
    setActiveItemId(itemId)
  }

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { nodes: filteredNodes, matchIds } = useMemo(
    () => filterTree(displaySection?.items ?? [], query),
    [displaySection, query],
  )

  // While searching, force-expand every surviving group so matches are always visible.
  const effectiveExpanded = query.trim() ? new Set([...expanded, ...matchIds]) : expanded

  const railState = (id: string): "default" | "browsing" | "active" => {
    if (id === activeSectionId) return "active"
    if (id === openPanel) return "browsing"
    return "default"
  }

  // Driven from the `anchors` prop DIRECTLY, not from the context hook: this component renders the
  // provider itself, and `useContext` only ever resolves to a provider *above* the calling
  // component — so the hook here would read the default `false` and every anchor below would
  // silently emit nothing. Descendants (RailIconButton, PanelTree) use the hook normally.
  const anchor = (ref: string) => anchorAttrs(anchors, ref)

  return (
    <DivergenceAnchorProvider enabled={anchors}>
    <TooltipProvider>
      {/* M-7 (see rail-sidebar.ts for the full history; supersedes the prior L-38/L-48 approach):
          this row's own `gap` is restored to an explicit `RAIL_PANEL_GAP` (8px, matching the
          approved `panelGap` — row F-4/L-44, cross-checked against bidezine's real `SidebarInset`
          `md:peer-data-[variant=inset]:m-2` = 8px) rather than relying on `PANEL_SHADOW_INSET`'s own
          padding to double as the visual gap (the user identified that reliance as an undocumented
          workaround, unused anywhere else in this design system, and asked for it to be reversed).
          `ResizablePanelGroup`'s own un-removable `overflow: hidden` still requires SOME internal
          inset before the panel's `shadow-md` so the shadow isn't clipped flush against the group's
          edge — but that inset is real, structural space belonging to the shadow-clearance concern,
          not the rail-to-panel visual gap, and doubling both would put 16px between the rail and the
          panel again (the exact L-38 regression). To avoid that: the panel's LEFT-side shadow inset
          is set to 0 (the honest, explicit gap already provides real breathing room on that side, and
          this is the side facing the dark rail, the least visually prominent edge for corner-bleed
          softness) while top/right/bottom keep the full `PANEL_SHADOW_INSET` (unchanged from L-36/
          L-37 — the right-side corner-bleed finding from L-37 is untouched, since only the LEFT side
          changed here). See the `ResizablePanel`/inner-div JSX below for the exact split. */}
      {/* M-21 (see rail-sidebar.ts for the full history): `w-full` added here (and on both mount
          wrappers in `FullRailPreview.tsx`'s `RailNavStatusPreview`) after live measurement showed
          this row was shrink-wrapping to its own content width instead of filling the actual
          available stage width, even though every ancestor up the chain (`FillHeight`/
          `QuadrantLayout`) already correctly used `w-full` — a `w-full` chain is only as strong as
          its weakest link; ANY plain, width-less block anywhere in it breaks the whole chain back
          to shrink-to-content. Without this, `ResizablePanelGroup`'s `flex-1` had no real space to
          grow into, so `adjacentContent` rendered at a nearly-invisible sliver of its own minSize
          instead of a real, visible share of the page. */}
      <div className="flex w-full" style={{ fontFamily, gap: RAIL_PANEL_GAP, height }}>
        {/* Rail */}
        <div
          {...anchor("F-1")}
          className="flex shrink-0 flex-col overflow-hidden p-2"
          style={{ width: 54, borderRadius: 12, background: colors.surface }}
        >
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                {/* M-9/L-1 LOGO CONTRACT: `RailLogoSlot` (defined above) owns both which element
                    renders (`<a>` only when `logoHref` is supplied, otherwise a plain,
                    non-interactive `<div>`) AND whether hover/press color states are wired at all —
                    see its own doc comment for the full contract. `asChild` on TooltipTrigger means
                    whichever element `RailLogoSlot` renders receives the trigger's own hover/focus
                    wiring directly — no extra wrapper needed either way. */}
                <RailLogoSlot href={logoHref} colors={colors}>
                  {logoIcon ?? (logoPlaceholder ? (
                    <div className="size-6 rounded border border-dashed" style={{ borderColor: "currentColor" }} aria-hidden="true" />
                  ) : (
                    <svg viewBox={BIDEZINE_LOGO_VIEWBOX} className="size-6" fill="currentColor" aria-hidden="true">
                      <path d={BIDEZINE_LOGO_PATH} />
                    </svg>
                  ))}
                </RailLogoSlot>
              </TooltipTrigger>
              {/* Origin's LogoSlotDark always shows a hover tooltip with the logo label (default
                  "BiDezine", see divergence row M-9), even when the slot has no onClick — matches
                  that behavior here via the real Tooltip primitive (L-1). Now sourced from the
                  configurable `logoLabel` prop instead of a hardcoded string, so a consumer
                  supplying their own `logoIcon`/`logoHref` also gets their own brand name shown. */}
              <TooltipContent side="right">{logoLabel}</TooltipContent>
            </Tooltip>
          </div>
          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.divider }} />

          {/* DEPLOYMENT NOTE (see divergence row F-11): `flex-1 min-h-0` here is the ENTIRE
              mechanism that anchors the footer group (Profile + Settings, below) to the bottom of
              the rail — this nav section grows to consume all left-over vertical space, pushing
              the second divider and footer group down to the bottom edge. This is not achieved by
              reordering the DOM or by absolute/fixed positioning, and the footer's own items still
              render in normal top-to-bottom order (Profile above Settings) — only the GROUP as a
              whole is bottom-anchored. Preserve this same flex-1-spacer approach in any real Build
              reimplementation.

              QA finding (see divergence row L-31): this div previously ALSO carried `overflow-hidden`
              directly on itself. That wrapper has no padding of its own — its rendered box is sized
              EXACTLY to the 38px-wide rail buttons it contains (confirmed via getBoundingClientRect:
              its own left/right edges were pixel-identical to a button's) — so its own overflow-hidden
              clipped anything rendered even 1px outside a button's own box, including the ENTIRE 3px
              `focus-visible:ring-[3px]` ring every real Button already renders (Button's own real,
              shared, correct convention — not something added for the rail). Removed `overflow-hidden`
              from this specific div; the outer rail column (the `p-2` dark surface wrapping this whole
              group, two levels up) already stretches to the same fixed rail height and already carries
              its own `overflow-hidden` with real 8px slack on every side — verified this still fully
              suppresses the transient "all `TOP_SECTIONS` render before the ResizeObserver-driven
              `pinnedCount` trims them down" flash (see the `recalc()` effect below) this div's own
              overflow-hidden was ALSO incidentally guarding against, while now giving the focus ring
              genuine room to render. `min-h-0 flex-1` (the actual footer-anchoring mechanism) stays. */}
          <div ref={trackRef} aria-label="Main navigation" role="navigation" className="flex min-h-0 flex-1 flex-col gap-1">
            {pinnedSections.map((section, index) => (
              <RailIconButton
                key={section.id}
                section={section}
                state={railState(section.id)}
                colors={colors}
                onClick={() => handleRailClick(section)}
                // F-2 (railButton = 38px) is anchored to the FIRST pinned rail button only. The
                // anchor must resolve to exactly one element, so this proves the representative
                // instance rather than the whole set — see lib/divergence-anchors.tsx.
                anchorRef={index === 0 ? "F-2" : undefined}
                // Only the anchored button can be forced. A colour claim is about ONE
                // rendered subject — lighting all 27 rail buttons would show the colour
                // while destroying the "which element is this about" the anchor exists for.
                forcedState={index === 0 && forcedState?.ref === "F-2" ? forcedState.state : undefined}
              />
            ))}

            {mustStash && (
              <DropdownMenu open={overflowMenuOpen} onOpenChange={setOverflowMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="More navigation options"
                    onMouseEnter={() => setOverflowHovered(true)}
                    onMouseLeave={() => setOverflowHovered(false)}
                    className="relative size-[38px] shrink-0 rounded-lg"
                    style={{
                      background: overflowMenuOpen ? colors.active : overflowHovered ? colors.hover : "transparent",
                      color: overflowMenuOpen || overflowHovered ? colors.fgHover : colors.fgSubtle,
                      transition: "background-color 150ms ease, color 150ms ease",
                    }}
                  >
                    <MoreHorizontalIcon className="size-5" />
                    {/* Origin's OverflowTriggerButton hides this dot while the menu itself is open
                        (active && !open) — showing it then would be redundant. */}
                    {stashHoldsActiveSection && !overflowMenuOpen && (
                      <span
                        className="absolute right-1 top-1 size-1.5 rounded-full"
                        style={{ background: colors.fgHover }}
                        aria-hidden
                      />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-[180px]"
                  // See divergence rows M-3/M-4: this rail overflow menu is the ONE dropdown in the
                  // app that should visually read as "part of the dark rail it drops out of," rather
                  // than the shared primitive's default light popover surface. Rather than editing
                  // DropdownMenuContent/DropdownMenuItem's own default look (which would change every
                  // other DropdownMenu system-wide), locally redefine the exact CSS custom properties
                  // those primitives already read -- --popover/--popover-foreground/--accent/
                  // --accent-foreground/--border, plus the two additive, fallback-only
                  // --accent-pressed/--accent-selected slots dropdown-menu.tsx now exposes -- using
                  // the SAME `colors` object already driving this rail's own trigger button and
                  // RailIconButton, so hover/pressed/selected states in the popup map 1:1 to the
                  // rail's own hover/pressed/active tokens. No other DropdownMenu instance defines
                  // these two extra variables, so this is a scoped, non-breaking override.
                  //
                  // --dm-icon-fg-hover/--dm-icon-fg-selected/--dm-icon-fg-rest (new, per this
                  // session's tweaks): the icon+label were pinned to a fixed text-muted-foreground
                  // token regardless of state; per your ask, all three states now use the SAME three
                  // tokens RailIconButton's own icon color already uses for those exact states --
                  // `colors.fgSubtle` at rest, `colors.fgHover` on hover/focus, `colors.fg` on the
                  // persistent selected/active row (mirrors RailIconButton's
                  // `isActive || isPressed ? colors.fg : isBrowsing || isHovered ? colors.fgHover :
                  // colors.fgSubtle` logic one section above) instead of the shared shadcn
                  // `--muted-foreground` token, which is an unrelated design token that happened to
                  // render close in value but was never actually the same source.
                  style={
                    {
                      "--popover": colors.surface,
                      "--popover-foreground": colors.fg,
                      "--accent": colors.hover,
                      "--accent-foreground": colors.fgHover,
                      "--accent-pressed": colors.pressed,
                      "--accent-selected": colors.active,
                      // See `nonCircularVar`'s own doc comment above: in
                      // "bidezine" (adjusted) mode, `colors.hairline` IS the literal string
                      // "var(--border)" -- a direct passthrough of the app's own real border
                      // token, not a distinct rail-specific value. Feeding that straight into this
                      // element's own `--border` custom property redeclared it as a self-reference,
                      // which is invalid at computed-value time and was silently falling back to
                      // `currentColor` (the popover's own near-white text color) for the visible
                      // `border` Tailwind class -- the reported "too strong white outline." Guarding
                      // it here lets the element fall through to the real, correctly-scoped
                      // ambient `--border` (the design system's own subtle dark-mode hairline token)
                      // instead, while still allowing a genuine literal override (e.g. origin mode's
                      // real hex hairline) to apply normally.
                      "--border": nonCircularVar("--border", colors.hairline),
                      "--dm-icon-fg-rest": colors.fgSubtle,
                      "--dm-icon-fg-hover": colors.fgHover,
                      "--dm-icon-fg-selected": colors.fg,
                    } as CSSProperties
                  }
                >
                  {/* QA finding (see divergence row L-19): the real DropdownMenuItem primitive
                      (src/ui/dropdown-menu.tsx) carries no truncate/whitespace-nowrap on its own
                      base recipe -- a plain text child has no width constraint or overflow handling
                      at all, so a long enough rail section label would wrap onto a second line
                      instead of truncating with an ellipsis (confirmed by reading the primitive's
                      className string directly: no `truncate`/`overflow-hidden`/`whitespace-nowrap`
                      anywhere in it). Scoped the fix to this call site only -- wrapping the label in
                      its own `min-w-0 flex-1 truncate` span -- rather than editing the shared
                      primitive itself, since DropdownMenuItem is used everywhere across the real
                      design system and changing its base recipe is a wider decision than this rail
                      component's own scope covers. Flagged back to the user as a broader question:
                      should every real menu-item primitive (DropdownMenuItem/ContextMenuItem/
                      MenubarItem/CommandItem, etc.) gain this truncation by default system-wide?

                      QA finding (see divergence row L-32): `filled={section.id === activeSectionId}`
                      on the icon below was DEAD CODE -- DropdownMenuItem's own `fillActionIcons`
                      wiring unconditionally overrides any icon child's `filled` prop based on its
                      own hover/press tracking, so this explicit value never actually applied, and
                      there was no other visual difference (background, text weight) for the
                      currently-active stashed section at all. FIXED at the primitive level, not
                      here: DropdownMenuItem now accepts a real `isActive` prop (mirroring Button's
                      own `active` and Sidebar's own `SidebarMenuButton.isActive`), which drives
                      background + font-weight + icon-fill together from one boolean -- passed
                      below instead of the old dead `filled` prop.

                      Icon/text color parity (per this session's tweaks): DropdownMenuItem's own base
                      recipe pins any icon lacking its own `text-*` class to a permanent
                      `text-muted-foreground`, regardless of hover/focus/active state -- while this
                      same row's TEXT normally shifts color per state
                      (`focus:text-accent-foreground`, `data-[active=true]:text-accent-foreground`).
                      Rather than letting the icon inherit the text's per-state color (which would
                      make the icon change with state instead), the label span is pinned to the same
                      steady token the icon uses, so BOTH stay in sync across every state instead of
                      the row's `--accent`-driven one. Scoped to this call site only, not the shared
                      primitive.

                      All three states -- rest, hover, and persistent selected/active -- now use the
                      SAME three tokens RailIconButton's own icon color already uses for those exact
                      states: `colors.fgSubtle` at rest, `colors.fgHover` on hover, `colors.fg` on
                      selected, via the `--dm-icon-fg-rest`/`--dm-icon-fg-hover`/
                      `--dm-icon-fg-selected` vars set on DropdownMenuContent above (previously rest
                      used the unrelated shared shadcn `--muted-foreground` token, which only
                      coincidentally rendered close to `colors.fgSubtle`'s value). `group/item` on
                      the Item plus `group-focus/item:`/`group-data-[active=true]/item:` on the
                      icon+label reads DropdownMenuItem's own existing `data-active`/roving-tabindex-
                      driven `:focus` state (the same mechanism its own
                      `focus:bg-accent`/`data-[active=true]:bg-...` rules already rely on) without
                      touching the shared primitive itself.

                      QA finding: a stashed section whose own destination panel was open (the
                      Rail's "browsing" tier -- e.g. right after first clicking "Gauge," before any
                      leaf inside its panel was picked) had ZERO visual indicator in this menu at
                      all -- `isActive` alone only covers the Rail's third/"active" tier (a leaf was
                      actually selected), leaving the middle tier invisible here even though
                      RailIconButton's own icon on the LEFT already shows it (fgHover color + inset
                      ring). FIXED at the primitive level (see DropdownMenuItem's own doc comment):
                      added a real `isOpen` prop, driven here by the SAME `railState()` helper the
                      pinned RailIconButtons already use, so all three rail tiers -- default/
                      browsing/active -- now read identically on both sides of the "More" menu.
                      `group-data-[state=open]/item:` on the icon+label reuses the SAME
                      `--dm-icon-fg-hover` token already used for `:focus`, matching RailIconButton's
                      own `isBrowsing || isHovered ? colors.fgHover` rule -- "open" and "hovered" are
                      the same visual tier there, distinct from "active." */}
                  {stashedSections.map((section) => (
                    <DropdownMenuItem
                      key={section.id}
                      className="group/item"
                      isActive={railState(section.id) === "active"}
                      isOpen={railState(section.id) === "browsing"}
                      onSelect={() => handleRailClick(section)}
                    >
                      <section.icon className="size-4 text-[var(--dm-icon-fg-rest)] group-focus/item:text-[var(--dm-icon-fg-hover)] group-data-[state=open]/item:text-[var(--dm-icon-fg-hover)] group-data-[active=true]/item:text-[var(--dm-icon-fg-selected)]" />
                      <span className="min-w-0 flex-1 truncate text-[var(--dm-icon-fg-rest)] group-focus/item:text-[var(--dm-icon-fg-hover)] group-data-[state=open]/item:text-[var(--dm-icon-fg-hover)] group-data-[active=true]/item:text-[var(--dm-icon-fg-selected)]">
                        {section.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.divider }} />
          {/* F-7 (approved 3-icon cap): caps the footer group's own rendered height so it can never
              grow past FOOTER_MAX_HEIGHT (122px = 3 rail buttons + 2 gaps) — matches origin's own
              defensive budget cap (see the FOOTER_MAX_HEIGHT doc comment above `const
              RAIL_BUTTON_SIZE` for the full derivation).

              CORRECTION (independent review of F-7, confirmed by live re-measurement): this element
              previously also carried `overflow-hidden`, on the reasoning that the cap "is required
              to actually clip rather than just stop growing the flex parent." That was wrong on its
              own terms and caused two real defects, neither visible at the single viewport the
              check ran at:

              1. **The shipped 2-item footer silently collapsed.** `overflow: hidden` flips a flex
                 item's automatic minimum size from min-content to 0, and this column had no
                 `shrink-0` and no `min-h-*`. Measured live: footer height 80px at viewport heights
                 900/560, 46.83px at 380, and **0px at 300 — both buttons gone, no error**. Causation
                 isolated at height 300: as shipped 0px; `overflow: visible` 80px; `overflow: hidden`
                 plus `flex-shrink: 0` 80px. This is CLAUDE.md checklist item 9 — a CSS mechanic
                 changed without re-verifying the behaviour that depended on it.
              2. **It clipped the footer buttons' focus rings**, exactly reintroducing L-31 /
                 checklist item 21. The container is sized to the 38px buttons with zero slack:
                 measured left/right slack 0px on BOTH buttons, plus bottom 0px on Settings and top
                 0px on Profile, against `Button`'s own real `focus-visible:ring-[3px]`.

              Fixed per item 21's own prescription — when a nested wrapper's `overflow-hidden` is
              redundant with a looser ancestor's, remove the tighter zero-slack one rather than
              padding it (padding here would shift the rail layout this container was sized around).
              The ancestor rail column already clips: an independent measurement of a hypothetical
              4th item found it painting 0px with this `overflow-hidden` and 4px without it, because
              that ancestor already removes 34 of the 38px. Losing 4px of clipping on a case that
              cannot occur in this rail's own 2-item configuration is plainly the better trade than
              a footer that vanishes and eats its own focus rings.

              `shrink-0` is what actually prevents the collapse and is NOT optional — without it the
              column shrinks under vertical pressure whether or not `overflow` is set. `maxHeight`
              still enforces the approved cap on growth. */}
          <div
            {...anchor("F-7")}
            className="flex shrink-0 flex-col gap-1"
            style={{ maxHeight: FOOTER_MAX_HEIGHT }}
          >
            {/* Pinned utility button — a permanently disabled "Profile" slot. Unlike the primary
                sections, this never gets absorbed by the overflow menu; it stays put in the
                footer zone above Settings, matching the demo's non-interactive utility slot. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Profile (disabled)"
              // QA finding (see divergence row L-14): removed a leftover `hover:bg-transparent` —
              // confirmed via getComputedStyle/`:matches(':hover')` that Button's own
              // `disabled:pointer-events-none` makes hover permanently unreachable on a disabled
              // button (real mouse hover can never hit-test this element), so the override was
              // syntactically correct but 100% dead code. Removed because it closely mimics the
              // M-12 anti-pattern (a hover override with no real purpose) and could mislead a
              // future reader into thinking hover suppression is intentionally needed here.
              className="size-[38px] shrink-0 rounded-lg"
              style={{ color: colors.fgDisabled }}
            >
              <UserIcon className="size-5" />
            </Button>
            {FOOTER_SECTIONS.map((section) => (
              <RailIconButton
                key={section.id}
                section={section}
                state={railState(section.id)}
                colors={colors}
                onClick={() => handleRailClick(section)}
              />
            ))}
          </div>
        </div>

        {/* Panel */}
        {
          /* QA finding (see divergence row L-15/L-16): prompted by "it is not just the border you
                need to emulate everything from the menu... the elevation token, the animations." The
                panel behaves exactly like a menu/popover (mounts/unmounts on trigger, is dismissible),
                so it now borrows the equivalent parts of the real DropdownMenuContent recipe
                (src/ui/dropdown-menu.tsx): `border` (L-15, unchanged), `shadow-md` (the same elevation
                utility, no bidezine-specific --shadow-* token exists to diverge from), and the exact
                `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
                data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                data-[state=closed]:zoom-out-95` state-driven enter/exit classes \u2014 copied verbatim,
                not approximated. Deliberately NOT copied: `z-50`/`min-w-[8rem]`/`max-h-(--radix-...)`/
                `origin-(--radix-...-transform-origin)`/the `slide-in-from-*` variants \u2014 those all
                depend on Radix Popper's floating/portal positioning (a `data-side` attribute, a
                measured available-height custom property), which doesn't apply here: this panel is
                laid out in-flow next to the rail, not a floating overlay positioned relative to a
                trigger.

                `data-state` is derived directly from `openSection` (mirroring how the real
                @radix-ui/react-dialog itself does it \u2014 confirmed in its own compiled source:
                `"data-state": getState(context.open)`, read from the actual open boolean, NOT from
                Presence's render-prop `present` value), so it flips to "closed" the instant closing
                starts \u2014 exactly when the CSS exit animation should begin playing.

                M-7 FOLLOW-UP (see rail-sidebar.ts): `<Presence>` used to wrap this ENTIRE
                `ResizablePanelGroup` \u2014 the user found that closing the browsing panel made the
                `adjacentContent` panel (real page content) disappear too, since Presence eventually
                unmounts its whole child once the exit animation finishes, and that child was the
                whole group. `<Presence>` now wraps ONLY the animated content div below (see its own
                JSX), so the group and BOTH panels always stay mounted \u2014 the browsing panel instead
                shrinks to 0 width via `react-resizable-panels`' own `collapsible`/`collapsedSize`
                (see `browsingPanelRef`/the `ResizablePanel` props below), triggered from this div's own
                `onAnimationEnd` so the exit animation still gets to play at full width first (collapsing
                the panel immediately would clip the animation to 0 width, defeating the point of it).
                This is not a hand-rolled setTimeout-based unmount delay standing in for a real
                mechanism \u2014 it's the same underlying Presence primitive, used the same way real Radix
                content components use it, per the standing "don't reinvent the wheel, use real
                components" rule; only WHERE it's placed in the tree changed. `displaySection` (not
                `openSection`) drives the header/tree content specifically so the content stays
                rendered and visible while Presence holds the div mounted for the exit animation \u2014
                `openSection` itself goes `undefined` the instant closing starts, which would otherwise
                blank the panel a frame before the animation had a chance to play. */
        }
        <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1"
              style={{
                // M-7: no fixed pixel width — see the doc comment above `PANEL_DEFAULT_WIDTH` for
                // why a fixed group width is no longer needed with this project's installed
                // `react-resizable-panels` version. The group now simply fills whatever space its
                // real flex-row parent gives it, exactly like a real consuming app's shell would.
                // QA finding (see divergence row L-36): a taller-than-slot group + negative
                // top/bottom margins, NOT a shrunk visible panel — see the full writeup below,
                // right where the previous (regressed) approach used to just say `height: "100%"`.
                height: `calc(100% + ${PANEL_SHADOW_INSET * 2}px)`,
                marginTop: -PANEL_SHADOW_INSET,
                marginBottom: -PANEL_SHADOW_INSET,
              }}
            >
              {/* QA finding / feature request (see divergence row L-35): origin's real panel resize
                  (RailNav.tsx) is hand-rolled — `onMouseDown` on a `role="separator"` div starts
                  tracking `event.clientX`, then raw `window.addEventListener("mousemove"/"mouseup")`
                  listeners compute `Math.max(PANEL_MIN_WIDTH, Math.min(viewportMax, ...))` on every
                  frame and write the result into `panelWidth` state. Reimplementing that same
                  mouse-event plumbing here would be exactly the kind of hand-rolled reimplementation
                  this project's own rules prohibit when a real primitive already exists — bidezine
                  ships a complete `Resizable` primitive (`src/ui/resizable.tsx`, wrapping
                  `react-resizable-panels`) built for precisely this. `ResizablePanel`'s own
                  `minSize`/`defaultSize` are interpreted as PIXELS by this project's installed
                  version (confirmed via its real `.d.ts`: "Numbers are interpreted as pixels"), a
                  direct, unit-for-unit match for `PANEL_MIN_WIDTH`/`PANEL_DEFAULT_WIDTH` above — no
                  unit conversion or approximation needed. (See divergence row F-3, resolved:
                  `PANEL_DEFAULT_WIDTH` is bidezine's own native `Sidebar` default of 256px, not
                  origin's `LAYOUT.panelW = 300` — `PANEL_MIN_WIDTH` remains 240 only because that
                  independently matches bidezine's own `min-w-60` token, per row F-8.)

                  Only the actual PANEL box (this component's own bordered/elevated surface) and its
                  own trailing resize edge move into this `ResizablePanelGroup` — the Rail column
                  above is completely untouched, still its own fixed 54px div, with its own 8px gap
                  to this group governed by the OUTER `className="flex"` row exactly as before (no
                  risk to any of the rail's already-hardened fixes: L-31's focus ring, L-33's padding,
                  etc.). The panel's own `data-state`-driven enter/exit animation (L-15/L-16) is also
                  completely untouched — `ResizablePanel` renders as a plain, unstyled wrapper (see
                  its own source: no border/background/shadow of its own), so the existing bordered/
                  elevated/animated div below is nested INSIDE it unchanged, just with `w-full h-full`
                  replacing its old static `width: 300` inline style (the width now comes from the
                  `ResizablePanel` itself).

                  Origin's own max-width cap is DYNAMIC (`window.innerWidth - railW - panelGap - 24`)
                  — "never let the panel swallow the rest of the page." `ResizablePanelGroup` now
                  fills its real flex-row parent (`flex-1`, no fixed pixel width — see M-7 in
                  rail-sidebar.ts) and the real panel a real `maxSize` (`PANEL_MAX_WIDTH`). A second,
                  REAL `adjacentContent` `ResizablePanel` absorbs whatever space that leaves —
                  `react-resizable-panels`' own built-in space allocation means the real panel
                  structurally CANNOT grow past `PANEL_MAX_WIDTH` (equivalently: past `group width -
                  handle - adjacent panel's own minSize`), achieving the same "leave room for the rest
                  of the page" guarantee origin's custom math was written for, without writing any of
                  that math by hand. `ADJACENT_CONTENT_MIN_WIDTH` (24) mirrors origin's own 24px
                  (`SPACE[6]`) safety margin in that same viewportMax formula.

                  M-7 (supersedes the DEPLOYMENT NOTE this paragraph used to carry): this project's
                  installed `react-resizable-panels` (v4.12.2) re-measures the group's own rendered
                  size live and re-derives each panel's pixel-based percentage on every resize, not
                  just once at mount (confirmed by tracing `groupSize` through the library's own
                  compiled resize/layout functions) — so `ResizablePanel`'s pixel `defaultSize`/
                  `minSize`/`maxSize` numbers stay accurate regardless of how the surrounding shell's
                  width changes, with no fixed group width required. The former invisible/
                  `aria-hidden`/`pointer-events-none` filler panel (which stood in for real page
                  content this sandbox never had) is replaced below with a real, visible
                  `adjacentContent` panel — the exact "real content next to this rail" scenario a
                  production consumer would actually render. */}
              <ResizablePanel
                defaultSize={PANEL_DEFAULT_WIDTH + PANEL_SHADOW_INSET}
                minSize={PANEL_MIN_WIDTH + PANEL_SHADOW_INSET}
                maxSize={PANEL_MAX_WIDTH + PANEL_SHADOW_INSET}
                collapsible
                collapsedSize={0}
                panelRef={browsingPanelRef}
                onResize={handleBrowsingPanelResize}
                className="flex flex-col"
              >
                {/* QA finding (see divergence row L-35, part 2, corrected by L-36, L-37, and M-7 —
                    see the `PANEL_SHADOW_INSET` doc comment above for the full writeup):
                    `ResizablePanelGroup`'s own rendered box carries a real `overflow: hidden`
                    (confirmed live via `getComputedStyle` — set internally by the vendored
                    `react-resizable-panels` library itself, not something in bidezine's own
                    `src/ui/resizable.tsx` recipe, so it can't simply be removed the way L-31 removed
                    a bidezine-authored `overflow-hidden`). The panel's own `shadow-md` (a
                    `box-shadow`, painted OUTSIDE its own border box) was measured flush against the
                    group's own edges — the exact same "ancestor overflow-hidden clips a descendant's
                    decoration when there's zero slack" pattern as L-31's focus-ring bug, just with an
                    un-removable ancestor this time. FIXED by adding a real inset wrapper INSIDE
                    `ResizablePanel` (its own root node has an inline `padding: 0px`, confirmed via
                    `getComputedStyle` — a class added directly to `ResizablePanel` itself can't
                    override an inline style, so the inset has to live on a nested plain div instead)
                    so the shadow-bearing div has genuine slack on top/right/bottom before hitting the
                    group's clipping boundary — including the right (L-37: even though that edge
                    attaches to the drag handle, the panel's ROUNDED corners still need bleed room in
                    two directions at once at the top-right/bottom-right corners specifically;
                    removing that slack clipped the shadow's curve right at the corner, not just along
                    the flat edge).

                    M-7 CORRECTION: the LEFT side of this inset is now `0` (`pl-0`, was `p-2` on all
                    four sides). Restoring the outer rail-to-panel `gap` (see the outer flex row's own
                    comment above) means real, honest 8px of empty space already exists between the
                    rail and this group's own left edge — keeping an ADDITIONAL 8px of left-side inset
                    here would double that to 16px, the exact regression L-38 fixed. The tradeoff:
                    the top-left/bottom-left corner shadow-bleed is clipped flush against the group's
                    left edge on this side only (unlike the right side, which keeps its full slack).
                    This is a deliberate, documented, low-risk tradeoff — the left edge faces the dark
                    rail, the least visually prominent side for a soft corner shadow, and there is
                    already 8px of real, honest gap space there for visual separation regardless of
                    the shadow's own bleed. Width is compensated on `ResizablePanel`'s own size props
                    above (`1 × PANEL_SHADOW_INSET`, right side only now — the left side needs no
                    compensation since it carries no inset); height is compensated by the group's own
                    taller-than-slot height + negative margins, see the JSX above this panel. */}
                <div className="h-full w-full py-2 pr-2 pl-0">
                  {displaySection && (
                    <Presence present={Boolean(openSection)}>
                      <div
                        {...anchor("F-3")}
                        data-state={openSection ? "open" : "closed"}
                        onAnimationEnd={(event) => {
                          // See the M-7 FOLLOW-UP comment above the `ResizablePanelGroup`: only
                          // collapse the panel's actual width once the exit animation finishes
                          // playing, not the instant `openSection` goes falsy — otherwise the
                          // panel would snap to 0 width immediately and clip the fade/zoom-out
                          // animation before it ever gets to run.
                          if (event.target !== event.currentTarget) return
                          if (!openSection) browsingPanelRef.current?.collapse()
                        }}
                        className="flex h-full w-full flex-col overflow-hidden shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                        style={{
                          borderRadius: 12,
                          background: colors.panelSurface,
                          border: `1px solid ${colors.hairline}`,
                        }}
                      >
              <div className="flex flex-col gap-0.5 px-3 py-2" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <displaySection.icon className="size-4 shrink-0 text-muted-foreground" />
                    {/* Verified against design-system/src/gallery/RailNav.tsx (real source, not a
                        screenshot): the panel title is single-line, truncated with an ellipsis
                        (`whiteSpace: nowrap; textOverflow: ellipsis`) — `truncate` here is the exact
                        Tailwind equivalent. See divergence row D-11. */}
                    <span className="truncate text-base font-medium">{displaySection.label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-xs" className="text-muted-foreground">
                          <MoreHorizontalIcon className="size-4" />
                          <span className="sr-only">Panel actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[220px]">
                        {/* `inset` here is not decorative — it's the fix for a measured text-alignment bug
                            (see divergence row D-12). Plain DropdownMenuItem defaults to 8px left padding,
                            while DropdownMenuCheckboxItem below ("Search box") is hard-coded to 32px to make
                            room for its checkmark. Without `inset`, "Expand all"/"Collapse all" sit 24px to
                            the left of "Search box". `inset` forces this row onto the same 32px gutter. */}
                        <DropdownMenuItem inset onSelect={() => setExpanded(new Set(collectGroupIds(displaySection.items)))}>
                          Expand all
                        </DropdownMenuItem>
                        <DropdownMenuItem inset onSelect={() => setExpanded(new Set())}>
                          Collapse all
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                          checked={searchEnabled}
                          onCheckedChange={(v) => {
                            setSearchEnabled(Boolean(v))
                            if (!v) setQuery("")
                          }}
                        >
                          Search box
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      onClick={() => setOpenPanel(null)}
                    >
                      <PanelLeftContractIcon className="size-4" />
                      <span className="sr-only">Collapse sidebar</span>
                    </Button>
                  </div>
                </div>
                {/* Origin's real source (design-system/src/gallery/RailNav.tsx) wraps the subtitle
                    unbounded (`whiteSpace: normal`, no line cap at all) — a 2026-07-31 change away
                    from its earlier single-line-truncate behavior. bidezine intentionally bounds
                    this to 3 lines (not unbounded) so a very long subtitle can't make the fixed-
                    width panel header grow arbitrarily tall; `line-clamp-3` wraps up to 3 lines then
                    truncates the 3rd with an ellipsis. See divergence row D-11. */}
                <p className="line-clamp-3 pl-[22px] text-xs text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>

              {searchEnabled && (
                <div className="px-2 pt-2">
                  {/* QA finding (see divergence row M-18): this used to be a manually-composed
                      relative/absolute icon over a raw Input with a `pl-7` padding override. That
                      override silently lost to the Input primitive's own default `px-3` in the
                      compiled Tailwind cascade (confirmed via getComputedStyle: padding-left stayed
                      12px, not the intended 28px, since tailwind-merge doesn't drop `px-3` for a
                      same-side longhand like `pl-7` — both classes survive, and px-3's declaration
                      happens to win the stylesheet's cascade order), causing the icon and typed text
                      to visually overlap. Fixed by switching to bidezine's own InputGroup/
                      InputGroupAddon/InputGroupInput primitives, purpose-built for exactly this
                      icon+input composition — the icon and input are flex siblings with real gap
                      spacing, so there's no padding-override arithmetic (or cascade pitfall) at all.

                      Follow-up (A-6/L-5 parity): now swapped again to the already-shipped
                      SearchInput primitive itself, so this sandbox reuses the SAME clear-button
                      behavior already validated for CommandInput/SearchInput rather than carrying
                      a locally-composed search row with no clear affordance. */}
                  <SearchInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="h-8 text-sm"
                    inputClassName="text-sm"
                  />
                </div>
              )}

              {/* QA finding (see divergence row K-3, now resolved): this was a plain `overflow-y-auto`
                  div, which renders the browser/OS's own native scrollbar rather than bidezine's real
                  ScrollArea primitive — origin's own approach here (SCROLL.css/SCROLL.className) is a
                  runtime <style> tag injection, already ruled out elsewhere (R-7) as incompatible with
                  this project's build-time Tailwind CSS approach, so it was never a valid target to
                  match anyway. Swapped to the real ScrollArea (Radix-based, exported from
                  @bidezine/system) so the scrollbar itself is a real, themeable bidezine primitive
                  instead of the browser's own default chrome.

                  QA finding (see divergence row K-3's follow-up, reported as "not able to scroll
                  anymore"): ScrollArea's own Root recipe never sets its own `overflow`, so — unlike
                  the plain `overflow-y-auto` div this replaced — it doesn't automatically get CSS
                  flexbox's "automatic minimum size: 0" treatment (that rule only applies to flex
                  items whose OWN overflow is something other than `visible`). Root's default
                  `overflow: visible` meant it just grew to fit its content's natural height instead
                  of being clipped to the flex parent's available space, so nothing overflowed and
                  there was nothing left to scroll. Fixed by adding `overflow-hidden` explicitly, which
                  triggers that automatic-minimum-size rule the same way the old div's `overflow-y-
                  auto` did. Verified via getComputedStyle: Root's height now correctly clips to the
                  parent's available space (scrollHeight > clientHeight again) and real wheel/scrollbar
                  interaction works.

                  QA finding (see divergence row L-18): prompted by "the rail nav from the origin has
                  a more efficient way to handle the scrollbar by allocating it in a layout component
                  with the group it belongs to, respecting the container's padding and adding a proper
                  gap between the scrolling area and the content. the one proposed in the adjusted
                  ignores the container's padding and there is no gap between the content, making it
                  too close." Measured this live before changing anything: with the scrollbar thumb
                  actually visible (forced via a real wheel-scroll, not assumed), the tree content's
                  own right edge sat at x=1128.2 while the scrollbar track's left edge sat at x=1124.2
                  -- a NEGATIVE 4px gap, i.e. genuine overlap, not just "a bit close." Root cause: Radix
                  ScrollArea's own ScrollBar is an absolutely-positioned overlay (a sibling of Viewport
                  inside Root), not a flex sibling that reserves layout space -- so it floats on top of
                  whatever's at the Viewport's right edge, and this content div's `p-1.5` (6px, uniform
                  on all sides) was never enough to clear a 10px-wide scrollbar track (src/ui/
                  scroll-area.tsx: `w-2.5`).

                  Read origin's own real documentation and source before changing anything (design-
                  system/docs/atomic/atom/scrollbar.spec.md + design-system/src/gallery/RailNav.tsx):
                  origin's actual technique is a documented "two-layer scroll region" (their own
                  comment: "NavPanelShell FRAME -- two-layer scroll (AGENTS Β§ Scroll Regions). Outer
                  shell owns padding (SPACE[2]) + overflow:hidden + flex column; inner <nav> owns the
                  scroll (overflowY:auto, flex:1, minHeight:0)"), PLUS a documented "figma-artifact-gap-
                  translation" rule in the spec doc: "when a molecule/organism uses this Scrollbar as a
                  sibling to a scroll container, the gap: 8px in Figma between the scroll content and
                  the scrollbar translates to paddingRight: SPACE[2] on the content element (not a
                  separate gap)." Concretely, origin's inner <nav> carries `paddingRight: navScrollable
                  ? SPACE[2] : 0` -- an EXTRA right-side gutter reserved specifically for the scrollbar,
                  on top of the outer shell's own uniform padding, and only applied when the content is
                  actually scrollable.

                  Radix's ScrollArea Root already plays the "outer shell" role here (it already owns
                  `flex-1 overflow-hidden`, i.e. the clipping), so no extra wrapper div was needed --
                  only this content div's own padding needed the same asymmetric treatment. Changed
                  `p-1.5` to `p-1.5 pr-4`: keeps the existing 6px gutter on every other side, raises
                  only the right side to 16px specifically to clear the scrollbar. Verified via
                  getBoundingClientRect after the fix: the gap between the tree content's right edge
                  and the scrollbar track is now a comfortable ~6px, not overlapping.

                  NOT yet done, flagged rather than silently skipped: origin's gutter is CONDITIONAL
                  (`navScrollable ? SPACE[2] : 0`), only reserving the extra space when content genuinely
                  overflows, so short lists don't carry unnecessary right-padding. This fix is
                  unconditional for now (always reserves the gutter) -- matching that exactly would
                  need a live overflow measurement (comparing scrollHeight/clientHeight, recomputed on
                  resize/content changes), which is a real but separate follow-up, not done in this
                  pass.

                  BROADER QUESTION, explicitly not auto-decided: the user asked whether this two-layer
                  outer-padding/inner-scrollbar-gutter concept should be extended into bidezine's own
                  real ScrollArea-consuming components system-wide (DropdownMenuContent, Select,
                  Command, ContextMenu, Menubar, NavigationMenu, Sidebar, etc. -- everywhere
                  `overflow-y-auto`/ScrollArea appears in src/ui/*.tsx), not just this rail panel. That
                  is a genuine, wide-blast-radius architecture change to the REAL shipped design system,
                  not this sandbox -- surfaced back to the user rather than auto-applied, per the
                  standing "AI never auto-decides this phase" rule for anything beyond a confirmed,
                  scoped bug fix.

                  CORRECTION (see divergence row L-21, itself now corrected below): the paragraph above
                  claiming "Radix's ScrollArea Root already plays the 'outer shell' role... so no extra
                  wrapper div was needed" was WRONG, caught by the user from a screenshot showing the
                  scrollbar thumb sitting flush against the panel's own outer border. L-18 only fixed
                  the gap between the tree CONTENT and the scrollbar (inside the ScrollArea's own
                  viewport) -- it never gave the ScrollArea itself, and therefore the scrollbar glued to
                  its edge, any clearance from the PANEL's outer edge, because the panel container had
                  (and still has) zero padding around ScrollArea on any side. Measured before fixing
                  (not assumed): with the scrollbar visible via a real scroll, the gap between the
                  scrollbar's own right edge and the panel's outer border was 0.8px -- essentially
                  flush, matching the screenshot. Root cause of the ORIGINAL fix being incomplete:
                  Radix's ScrollAreaScrollbar is positioned `position: absolute; right: 0` relative to
                  Root's own padding box (confirmed by reading @radix-ui/react-scroll-area's compiled
                  source directly) -- so padding added to Root ITSELF would not have pushed the
                  scrollbar inward anyway; only a separate wrapping element's padding, sitting outside
                  ScrollArea's own box, can create real clearance.

                  SECOND CORRECTION (see divergence row L-22): the FIRST attempt at this wrapper used
                  `px-2 pb-2` -- horizontal and bottom padding only, no top padding -- which fixed the
                  scrollbar-to-panel-edge gap but immediately created a NEW regression the user caught
                  next: the scroll region now sat flush against the search box above it, with no
                  vertical gap at all. Prompted directly: "now it is not respecting the gap between
                  elements, it is now touching the search bar... did you analyze how the origin manages
                  these components in a layout manner?" Went back and read origin's ACTUAL layout
                  structure for this exact region properly this time (design-system/src/gallery/
                  RailNav.tsx ~lines 913-1013), not just the scrollbar-gutter comment quoted earlier:
                  origin's real "NavPanelShell FRAME" wrapper carries `padding: ${SPACE[2]}px` -- a
                  single uniform padding shorthand applied to ALL FOUR SIDES (top included), not an
                  asymmetric horizontal+bottom-only pairing. My own first wrapper only copied the
                  bottom/horizontal sides mentioned in the scrollbar-specific comment thread and never
                  re-checked the padding declaration's actual shape against origin's real one-line
                  source. FIXED: changed the wrapper's className from `px-2 pb-2` to a plain `p-2`,
                  matching origin's uniform-padding-on-all-sides convention exactly. Also worth noting
                  for a future pass (not implemented here, to avoid unrequested scope creep on top of
                  today's reported bug): origin's real structure also places a `0.5px` hairline divider
                  line between the search bar and the NavPanelShell (a distinct visual separator, not
                  just spacing) -- our version currently relies on padding alone for that boundary,
                  matching the header's own divider technique (`borderBottom`) is available if this ever
                  needs reinforcing beyond padding. Verified via getBoundingClientRect after the p-2
                  fix: the gap between the search box and the first tree row is now 12px (was
                  effectively 0, confirmed touching before the fix), and the scrollbar-to-panel-edge gap
                  from L-21 is unaffected (still ~8.8px). */}
              <div className="flex-1 min-h-0 overflow-hidden p-2">
                <ScrollArea className="size-full">
                  {/* DEPLOYMENT NOTE: `pr-4` is now CONDITIONAL, read via `useScrollAreaOverflow()`
                      (React Context — see `PanelTreeScrollGutter` above) rather than the
                      `group-data-[scrollable-y=true]/scroll-area:pr-4` CSS selector this file used
                      before — matching origin's own real mechanism (RailNav.tsx's `navScrollable`
                      state, computed via `el.scrollHeight > el.clientHeight` and re-checked on
                      resize, gates `paddingRight: navScrollable ? SPACE[2] : 0` — origin's own code
                      even names the anti-pattern this guards against, `SC.UNCONDITIONAL-SCROLLBAR-GAP`).
                      An unconditional gutter leaves dead empty space on the scrollbar's side any time
                      the tree happens to fit without scrolling — exactly what was found here: this
                      panel's own content frequently fits without overflowing, so the previous bare
                      `pr-4` was reserving 16px of unused space on the right for a scrollbar that
                      wasn't even there. The CSS `group-data-*` selector was later found to ALSO match
                      the site's own outer page-level `ScrollArea` (an unrelated ancestor that wraps
                      every page's content and is itself almost always scrollable), silently forcing
                      this gutter on regardless of this panel's own actual overflow state — logged as
                      L-26; fixed by switching to Context, which always resolves to the nearest
                      Provider rather than any matching ancestor. */}
                  <PanelTreeScrollGutter>
                    <PanelTree
                      nodes={filteredNodes}
                      depth={0}
                      expanded={effectiveExpanded}
                      onToggle={toggleGroup}
                      activeItemId={activeItemId}
                      onSelectLeaf={handleSelectLeaf}
                      colors={colors}
                    />
                    {query.trim() && filteredNodes.length === 0 && (
                      <p className="px-2 py-3 text-xs text-muted-foreground">No matches for “{query}”.</p>
                    )}
                  </PanelTreeScrollGutter>
                </ScrollArea>
              </div>

                      </div>
                    </Presence>
                  )}
                  </div>
              </ResizablePanel>

            {/* M-21 (see rail-sidebar.ts for the full history): hidden entirely (not just
                visually) once the browsing panel has actually finished collapsing to 0 width —
                there's nothing left to drag against at that point. `isBrowsingPanelCollapsed` is
                real component state updated from this same panel's `onResize` callback, not
                derived from `openPanel` (which flips the instant a rail icon is clicked, before
                the exit animation has even started) — using `openPanel` directly would make the
                handle vanish mid-animation, while the panel is still visibly closing. */}
            {!isBrowsingPanelCollapsed && <ResizableHandle withHandle />}
            {/* M-7 (see rail-sidebar.ts for the full history): this used to be an invisible,
                `aria-hidden`/`pointer-events-none` filler panel standing in for real page content
                this sandbox never had — purely a react-resizable-panels bookkeeping trick to cap the
                real panel's max width (`group width - handle - filler's own minSize`). It's now a
                REAL, visible `adjacentContent` panel: the exact "real content next to this rail"
                scenario a production consumer would actually render, so the resize drag genuinely
                reflows something, not an inert void. `adjacentContent` defaults to a lightweight
                placeholder (below) when a consumer doesn't provide real content of its own — every
                real deployment of this rail should pass its own actual page content here instead.
                `ADJACENT_CONTENT_MIN_WIDTH` (24) still mirrors origin's own 24px (`SPACE[6]`) safety
                margin, now governing this real content panel's own minimum width. */}
            <ResizablePanel minSize={ADJACENT_CONTENT_MIN_WIDTH} className="min-w-0 overflow-hidden">
              {adjacentContent ?? <AdjacentContentPlaceholder collapseLeftInset={isBrowsingPanelCollapsed} />}
            </ResizablePanel>
            </ResizablePanelGroup>
      </div>
    </TooltipProvider>
    </DivergenceAnchorProvider>
  )
}

export type { ProposedToken }
