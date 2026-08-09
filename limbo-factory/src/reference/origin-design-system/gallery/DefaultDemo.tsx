// VERBATIM EXTRACT from the origin design-system's real RailNav.stories.tsx (Default story).
// This file is mechanically sliced (imports + SECTIONS_FIGMA_AUDIT..DefaultShell), not retyped/
// hand-reconstructed, to guarantee byte-for-byte fidelity with the real Storybook Default story.
// Only change from the source: the trailing export-default line, added so this file (not a
// wrapper (not a .stories.tsx file) can be imported and rendered directly.

import { useState } from "react";
import RailNav from "./RailNav";
import type { RailSection, PanelHeaderMenuItem, RailPanelItem, RailBadge } from "./RailNav";
import { useTokens } from "../theme";
import { TYPE } from "../tokens";
import { SPACE, LAYOUT, RADIUS } from "../layout";
import {
  IconColor, IconApps, IconShieldCheckmark,
  IconBell, IconSearch,
  IconSettings,
  IconSlideTextMultiple, IconDataHistogram, IconFoodGrains, IconPerson, IconDocumentFolder,
  IconDataUsageSparkle, IconMegaphone, IconRibbon, IconMailTemplate,
  IconSavings, IconGauge, IconGlobeLocation, IconFlag, IconGift, IconHatGraduation,
  IconImageShadow, IconReceiptSearch,
  IconVideo, IconVideoSettings, IconPeopleCommunity, IconCubeTree,
  IconEngine, IconSyncOff, IconCalendarClock, IconCalendarMonth, IconContentView,
  IconArrowExpandAll, IconArrowCollapseAll,
  IconArrowTrendingSparkle, IconTargetArrow, IconRocket, IconCodeBlock, IconCircleMultipleHintCheckmark,
  IconGrid, IconFoodApple, IconClothesHanger, IconSport, IconDesk, IconOven,
  IconFireplace, IconPlantGrass, IconVehicleCarProfile, IconCart,
  IconDocumentMultiple, IconBoxArrowLeft, IconVehicleTruckProfile,
  IconMoney, IconReceiptMoney, IconMoneyHand, IconMoneyCalculator,
  IconPeople, IconMedal, IconPeopleCheckmark, IconPeopleAdd, IconPersonHeart,
  IconFabric, IconPersonInfo, IconHeart, IconInfo,
} from "../icons";

const SECTIONS_FIGMA_AUDIT: RailSection[] = [
  {
    id: "documents",
    label: "Documents",
    icon: IconDocumentFolder,
    items: [{ id: "all-docs", label: "All Documents", icon: IconDocumentFolder }],
  },
  {
    id: "slides",
    label: "Slides",
    icon: IconSlideTextMultiple,
    items: [{ id: "presentations", label: "Presentations", icon: IconSlideTextMultiple }],
  },
  {
    id: "data",
    label: "Data",
    icon: IconDataHistogram,
    // Deliberate demo-data edit (not a RailNav.tsx logic change): items intentionally empty so
    // this section exercises the origin's real isLeaf code path — clicking it navigates directly,
    // no panel opens. Mirrored on the bidezine "adjusted" side for functional parity.
    items: [],
  },
  {
    id: "grains",
    label: "Overview",
    icon: IconFoodGrains,
    items: [{ id: "summary", label: "Summary", icon: IconFoodGrains }],
  },
  {
    id: "savings",
    label: "Savings",
    icon: IconSavings,
    items: [{ id: "savings-overview", label: "Savings Overview", icon: IconSavings }],
  },
  {
    id: "gauge",
    label: "Gauge",
    icon: IconGauge,
    items: [{ id: "gauge-metrics", label: "Gauge Metrics", icon: IconGauge }],
  },
  {
    id: "globe",
    label: "Globe",
    icon: IconGlobeLocation,
    items: [{ id: "locations", label: "Locations", icon: IconGlobeLocation }],
  },
  {
    id: "flag",
    label: "Flag",
    icon: IconFlag,
    items: [{ id: "flagged", label: "Flagged", icon: IconFlag }],
  },
  {
    id: "gift",
    label: "Gift",
    icon: IconGift,
    items: [{ id: "gift-catalog", label: "Gift Catalog", icon: IconGift }],
  },
  {
    id: "graduation",
    label: "Graduation",
    icon: IconHatGraduation,
    items: [{ id: "graduation-tracker", label: "Graduation Tracker", icon: IconHatGraduation }],
  },
  {
    id: "images",
    label: "Images",
    icon: IconImageShadow,
    items: [{ id: "image-library", label: "Image Library", icon: IconImageShadow }],
  },
  {
    id: "receipts",
    label: "Receipts",
    icon: IconReceiptSearch,
    items: [{ id: "receipt-search", label: "Receipt Search", icon: IconReceiptSearch }],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: IconDataUsageSparkle,
    items: [{ id: "analytics-overview", label: "Analytics Overview", icon: IconDataUsageSparkle }],
  },
  {
    id: "advertising",
    label: "Advertising",
    icon: IconMegaphone,
    items: [{ id: "campaigns", label: "Campaigns", icon: IconMegaphone }],
  },
  {
    id: "quality",
    label: "Quality",
    icon: IconRibbon,
    items: [{ id: "quality-metrics", label: "Quality Metrics", icon: IconRibbon }],
  },
  {
    id: "emailing",
    label: "Emailing",
    icon: IconMailTemplate,
    items: [{ id: "templates", label: "Templates", icon: IconMailTemplate }],
  },
];

function FigmaAuditDisabledButton() {
  const tokens = useTokens();
  // No tooltip on disabled buttons — per RailButton Tooltip Contract
  return (
    <button
      disabled
      aria-label="Profile (disabled)"
      style={{
        width: LAYOUT.railButton,
        height: LAYOUT.railButton,
        borderRadius: RADIUS.soft,
        background: "transparent",
        border: "1.5px solid transparent",
        boxSizing: "border-box",
        cursor: "not-allowed",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.onDarkDisabled,
      }}
    >
      <IconPerson size={20} color="currentColor" filled={false} />
    </button>
  );
}

import type { ComponentType } from "react";

// ── Spec tree types (shared nav data shape; mapped to RailPanelItem via specToRailItems) ──
type SpecTreeNode = {
  id: string;
  label: string;
  badge?: RailBadge;
  Icon: ComponentType<{ size?: number; color?: string; filled?: boolean }>;
  disabled?: boolean;
  children?: SpecTreeNode[];
  // NOTE: no forceHover flag — demo hover is owned by parent-level hoveredId state.
  // A static per-node flag is the stuck-hover antipattern (AGENTS §21f / PROTOCOL blind-spot).
};

// Exact items from Figma assembled node 209:4405.
const SPEC_TREE: SpecTreeNode[] = [
  { id: "activity",     label: "Activity stream", badge: "+23", Icon: IconVideo },
  { id: "live-ops",     label: "Live operations",               Icon: IconVideoSettings },
  { id: "participants", label: "Participants",                   Icon: IconPeopleCommunity },
  { id: "system",       label: "System logic",    badge: { label: "New", variant: "info" }, Icon: IconCubeTree, children: [
    { id: "rules",     label: "Rules engine", Icon: IconEngine },
    { id: "triggers",  label: "Triggers",     Icon: IconSyncOff },
    { id: "schedules", label: "Schedules",    Icon: IconCalendarClock, children: [
      { id: "daily",   label: "Daily",   badge: "+05", Icon: IconCalendarMonth },
      { id: "monthly", label: "Monthly", badge: "+11", Icon: IconCalendarMonth },
      { id: "yearly",  label: "Yearly",              Icon: IconCalendarMonth, disabled: true },
    ]},
  ]},
  { id: "content", label: "Content", Icon: IconContentView },
];

// ── Documents sidebar tree (Figma node 224-3458) ──────────────────────────────
// Structure: flat leaf + 4 groups (Products, Orders, Sales, Customers)
// Icons: all Fluent UI System Icons per AGENTS.md icon rules.
// Customers group — icons matched to Figma SidebarPanel 224:3458 (audit 2026-06-11).
const DOCUMENTS_SPEC_TREE: SpecTreeNode[] = [
  { id: "apps", label: "Apps", Icon: IconApps },
  { id: "products", label: "Products", Icon: IconGrid, children: [
    { id: "food",            label: "Food",             Icon: IconFoodApple },
    { id: "clothes",         label: "Clothes",          Icon: IconClothesHanger },
    { id: "sport",           label: "Sport and fitness", badge: "Update", Icon: IconSport },
    { id: "office-supplies", label: "Office supplies",  Icon: IconDesk },
    { id: "kitchen",         label: "Kitchen",          Icon: IconOven },
    { id: "outdoors",        label: "Outdoors",         Icon: IconFireplace },
    { id: "garden",          label: "Garden",           Icon: IconPlantGrass },
    { id: "auto",            label: "Auto",             Icon: IconVehicleCarProfile },
  ]},
  { id: "orders", label: "Orders", badge: "+348", Icon: IconCart, children: [
    { id: "all-orders",      label: "All orders",      Icon: IconDocumentMultiple },
    { id: "returns",         label: "Returns",         Icon: IconBoxArrowLeft },
    { id: "order-tracking",  label: "Order tracking",  Icon: IconVehicleTruckProfile },
  ]},
  { id: "sales", label: "Sales", Icon: IconMoney, children: [
    { id: "gross-margin",    label: "Gross margin",    Icon: IconReceiptMoney },
    { id: "expenses",        label: "Expenses",        Icon: IconMoneyHand },
    { id: "costs",           label: "Costs",           Icon: IconMoneyCalculator },
  ]},
  { id: "customers", label: "Customers", Icon: IconPeople, children: [
    { id: "loyalty",         label: "Loyalty programs",     Icon: IconMedal },
    { id: "attrition",       label: "Customer attrition",   Icon: IconPeopleCheckmark },
    { id: "new-customers",   label: "New customers",        Icon: IconPeopleAdd },
    { id: "satisfaction",    label: "Customer satisfaction", Icon: IconPersonHeart },
  ]},
];

// ── Settings panel tree ────────────────────────────────────────────────────────
// Demo content for the Settings footer section panel.
const SETTINGS_SPEC_TREE: SpecTreeNode[] = [
  { id: "general",       label: "General",       Icon: IconSettings },
  { id: "appearance",    label: "Appearance",    Icon: IconColor },
  { id: "notifications", label: "Notifications", Icon: IconBell },
  { id: "security",      label: "Security",      Icon: IconShieldCheckmark },
];

// ── Default RailNav view ──
// Renders the SHIPPED built-in panel (plain <RailNav>, NO suppressBuiltinPanel) with the full
// variant set — nesting, disabled items, badges, rail overflow (ellipsis), footer Settings panel,
// and a pinned utility button. This is the canonical reference for the component and mirrors what
// consumers (e.g. the PLG dashboard) deploy; there is no separate demo panel — the story exercises
// the real shipped component.

/** Map a SpecTreeNode[] (capital `Icon`) to RailPanelItem[] (lowercase `icon`),
 *  recursing children. Children share the RailPanelChild shape (same fields), so
 *  the recursive call is typed as RailPanelItem[] and cast to RailPanelChild[]. */
function specToRailItems(nodes: SpecTreeNode[]): RailPanelItem[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    badge: node.badge,
    disabled: node.disabled,
    icon: node.Icon,
    children: node.children
      ? (specToRailItems(node.children) as RailPanelItem["children"])
      : undefined,
  }));
}

// 16 rail sections (overflow → ellipsis) but with rich, deeply-nested items
// injected into "slides" (SPEC_TREE) and "documents" (DOCUMENTS_SPEC_TREE).
const SECTIONS_DEFAULT: RailSection[] = SECTIONS_FIGMA_AUDIT.map((section) => {
  if (section.id === "slides") return { ...section, items: specToRailItems(SPEC_TREE) };
  if (section.id === "documents") return { ...section, items: specToRailItems(DOCUMENTS_SPEC_TREE) };
  return section;
});

// Footer Settings section opens its own built-in panel with rich content.
const FOOTER_SECTIONS_DEFAULT: RailSection[] = [
  { id: "settings", label: "Settings", icon: IconSettings, items: specToRailItems(SETTINGS_SPEC_TREE) },
];

function DefaultShell() {
  const tokens = useTokens();
  const [activeSection, setActiveSection] = useState("slides");
  // Deep leaf inside system → schedules, so the "System logic" group auto-expands —
  // gives nesting + a group to exercise the expand/collapse contract test.
  const [activeItem, setActiveItem] = useState("monthly");
  // Search-box visibility — consumer-owned, toggled by the panel menu.
  const [searchOn, setSearchOn] = useState(true);

  const panelMenuItems: PanelHeaderMenuItem[] = [
    { id: "search-box", label: "Search box", icon: IconSearch, checked: searchOn },
    { id: "expand-all", label: "Expand all", icon: IconArrowExpandAll },
    { id: "collapse-all", label: "Collapse all", icon: IconArrowCollapseAll },
  ];

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: tokens.bg }}>
      <RailNav
        sections={SECTIONS_DEFAULT}
        footerSections={FOOTER_SECTIONS_DEFAULT}
        activeSection={activeSection}
        activeItem={activeItem}
        onNavigate={(sectionId, itemId) => {
          setActiveSection(sectionId);
          setActiveItem(itemId);
        }}
        logoLabel="PLG Dashboard"
        panelSubtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        searchable={searchOn}
        panelMenuItems={panelMenuItems}
        onPanelMenuAction={(id) => {
          if (id === "search-box") setSearchOn((v) => !v);
          // "expand-all" / "collapse-all" handled inside RailNav's built-in panel.
        }}
        // Bottom-rail utility button — pinned (stays when the rail overflows; top section
        // icons get absorbed by the ellipsis, the footer/utility zone does not).
        utilityItems={<FigmaAuditDisabledButton />}
      />
      <main style={{ flex: 1, padding: SPACE[6], display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: SPACE[2] }}>
        <span style={{ ...TYPE.caption, color: tokens.textSubtle, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Content area
        </span>
        <span style={{ ...TYPE.bodyM, color: tokens.textSubtle, maxWidth: 420 }}>
          The rail and built-in panel on the left are the shipped RailNav. Navigate sections, expand
          nested groups, search, and open the footer Settings panel to exercise the full surface.
        </span>
      </main>
    </div>
  );
}

export default DefaultShell;
