import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect, waitFor, fireEvent, fn } from "storybook/test";
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

// ── Meta ──

const meta = {
  title: "Organisms/RailNav",
  component: RailNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RailNav>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ──

// ── Figma Audit Test ──
// Mirrors the Figma RailNav + RailMenu frames exactly:
//   Rail: LogoSlot + 16 primary RailButtons dataset + More Horizontal overflow + FooterSlot
//   Overflow menu (RailMenu): hidden primary sections based on available rail real estate
//
// Primary lineup contract: 16 sections total, final id = "emailing"
// Base rail icons from the RailNav frame plus the additional overflow lineup.
//   Analytics  → IconDataUsageSparkle  (state=rest in Figma)
//   Advertising → IconMegaphone        (state=browsing in Figma — panel open, not active)
//   Quality    → IconRibbon            (state=rest in Figma)
//   Emailing   → IconMailTemplate      (state=hover in Figma)
//
// Row Dark states in the overflow menu:
//   rest:     transparent bg,        onDarkSubtle text/icon,  regular icon
//   hover:    darkHoverBg,           onDarkHover text/icon,   filled icon
//   browsing: inset 1.5px border,    onDarkHover text/icon,   filled icon
//   active:   darkActiveBg,          onDark text/icon,        filled icon
//
// Footer: Person (disabled → onDarkDisabled) + Settings (rest/hover)

// Primary rail sections (16) — includes the exact Figma lineup and extended overflow fixture.
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
    items: [{ id: "charts", label: "Charts", icon: IconDataHistogram }],
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

// The canonical Default view — the shipped built-in RailNav with the full variant set.
export const Default: Story = {
  name: "Default",
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
};

// ── FigmaSpec — verified replica of the RailNav COMPONENT node 166:4494 (rail only) ──
// Mirrors the Figma RailNav frame exactly: BiDezine logo + the 16-section FIGMA_AUDIT lineup
// (12 visible: Document Folder · Slide Text Multiple [active] · Data Histogram · Food Grains ·
// Savings · Gauge · Globe · Flag · Gift · Graduation · Images · Receipts, then More overflow) +
// FooterSlot (Person [disabled] above Settings). suppressBuiltinPanel → the rail alone, matching
// node 166:4494 (a static rail frame, no secondary panel). storyId = spec.verify.storyId.
export const FigmaSpec: Story = {
  name: "FigmaSpec — RailNav 166:4494 (rail)",
  tags: ["!dev"],
  args: { sections: SECTIONS_FIGMA_AUDIT, activeSection: "slides", activeItem: "", onNavigate: () => {} },
  // Height pinned to the Figma frame (730px) so the rail-overflow state matches: 12 sections
  // visible + the More (…) ellipsis absorbing analytics/advertising/quality/emailing, exactly as
  // node 166:4494 renders. A taller viewport would show all 16 and never trigger the overflow.
  render: () => (
    <div style={{ display: "flex", height: 730, overflow: "hidden" }}>
      <RailNav
        sections={SECTIONS_FIGMA_AUDIT}
        footerSections={[{ id: "settings", label: "Settings", icon: IconSettings, items: [{ id: "general", label: "General", icon: IconSettings }] }]}
        activeSection="slides"
        activeItem=""
        suppressBuiltinPanel
        utilityItems={<FigmaAuditDisabledButton />}
        onNavigate={() => {}}
      />
    </div>
  ),
};

// ── Revenue screen — replica of Figma 783:6304 (Azure Data Revenue) ──
// Owner-designed screen for PLG evaluation. Rail: 4 top sections (only Revenue active; the other
// three disabled) + 3 footer (Alerts + Info active; Settings disabled). Icons respect the Figma:
// Fabric brand mark (added), Money, Heart, Person Info (added); footer Alert / Info / Settings.
// The Revenue panel header title differs from the rail tooltip ("Revenue" → "Azure Data Revenue").
const REVENUE_PANEL_ITEMS: RailPanelItem[] = [
  { id: "overview", label: "Overview", icon: IconReceiptMoney },
  { id: "arr", label: "Annual recurring revenue", icon: IconMoneyCalculator },
  {
    id: "fabric-workloads", label: "Fabric workloads", icon: IconDataHistogram,
    children: [
      { id: "pf-sku", label: "P+F SKU Allocated", icon: IconMoney },
      { id: "f-sku", label: "F SKU Allocated", icon: IconMoney },
      { id: "p-sku", label: "P SKU Allocated", icon: IconMoney },
      { id: "nrr", label: "Net Revenue Retention", icon: IconReceiptSearch },
    ],
  },
];

const REVENUE_SECTIONS: RailSection[] = [
  { id: "fabric-telemetry", label: "Fabric telemetry", icon: IconFabric, disabled: true, items: [] },
  { id: "revenue", label: "Revenue", panelTitle: "Azure Data Revenue", icon: IconMoney, items: REVENUE_PANEL_ITEMS },
  { id: "nps", label: "NPS", icon: IconHeart, disabled: true, items: [] },
  { id: "customer-reporting", label: "Customer reporting", icon: IconPersonInfo, disabled: true, items: [] },
];

const REVENUE_FOOTER: RailSection[] = [
  { id: "alerts", label: "Alerts", icon: IconBell, items: [] },
  { id: "info", label: "Info", icon: IconInfo, items: [] },
  { id: "settings", label: "Settings", icon: IconSettings, disabled: true, items: [] },
];

function RevenueShell() {
  const tokens = useTokens();
  const [activeSection, setActiveSection] = useState("revenue");
  const [activeItem, setActiveItem] = useState("overview");
  const [searchOn, setSearchOn] = useState(true);
  const panelMenuItems: PanelHeaderMenuItem[] = [
    { id: "search-box", label: "Search box", icon: IconSearch, checked: searchOn },
    { id: "expand-all", label: "Expand all", icon: IconArrowExpandAll },
    { id: "collapse-all", label: "Collapse all", icon: IconArrowCollapseAll },
  ];
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: tokens.bg }}>
      <RailNav
        sections={REVENUE_SECTIONS}
        footerSections={REVENUE_FOOTER}
        activeSection={activeSection}
        activeItem={activeItem}
        onNavigate={(sectionId, itemId) => { setActiveSection(sectionId); setActiveItem(itemId); }}
        logoLabel="Azure Data Insights & Analytics"
        panelSubtitle="Know how Azure Data products generate and retain revenue."
        searchable={searchOn}
        panelMenuItems={panelMenuItems}
        onPanelMenuAction={(id) => { if (id === "search-box") setSearchOn((v) => !v); }}
      />
    </div>
  );
}

// Owner audit surface for the PLG deploy. Rail-overflow can't trigger (7 buttons < budget), so the
// exact rail + the Revenue panel render as designed.
export const RevenueScreen: Story = {
  name: "Revenue — Azure Data Revenue (783:6304)",
  args: { sections: REVENUE_SECTIONS, activeSection: "revenue", activeItem: "overview", onNavigate: () => {} },
  render: () => <RevenueShell />,
};

// ── Behavioral contract test (Phase 2, test-first) ──
// Encodes the expand/collapse contract Cycle 1b fixed: a group the user explicitly
// collapses must STAY collapsed. `tags: ['!dev']` HIDES this from the Storybook sidebar
// (so the view list stays to the single Default above) while still running in
// test-storybook / `npm run health` — the gate, without the clutter.
export const ExpandCollapseContract: Story = {
  name: "Behavior — collapse persists (expand/collapse contract)",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "System logic" auto-expands because the active item ("monthly") is inside it
    // (system → schedules → monthly).
    const group = await canvas.findByRole("button", { name: /System logic/i });
    await waitFor(() => expect(group).toHaveAttribute("aria-expanded", "true"));
    // User collapses the group.
    await userEvent.click(group);
    // CONTRACT: it must STAY collapsed — auto-expand must not re-open a user-collapsed group.
    await waitFor(() => expect(group).toHaveAttribute("aria-expanded", "false"));
  },
};

// ── Behavioral contract: empty/omitted sections must not throw (finding CD0.1, 2026-07-29) ──
// A consumer rendering <RailNav/> with no `sections` used to crash on `useState(sections.length)`.
// CONTRACT: `sections` defaults to [] (like footerSections) → an empty rail renders, no throw.
export const EmptySectionsContract: Story = {
  name: "Behavior — empty sections render (no crash)",
  tags: ["!dev"],
  args: {
    sections: [],
    activeSection: "",
    activeItem: "",
    onNavigate: () => {},
  },
  render: (args) => <RailNav {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // If the render threw on sections.length this story would error; asserting the rail landmark
    // rendered proves the empty-sections path is safe.
    await waitFor(() => expect(canvas.getAllByRole("navigation").length).toBeGreaterThan(0));
  },
};

// ── Behavioral contract: a section that OMITS `items` must not throw (finding CD0.3, 2026-07-30) ──
// The auto-expand effect (collectActivePathGroupIds(section.items,…)) and isPanelVisible dereferenced
// section.items unguarded while two other sites guarded it (`?? []`). A JS consumer can omit items
// (required only in TS). CONTRACT: both derefs guard → an items-less section renders as a rail button.
export const SectionMissingItemsContract: Story = {
  name: "Behavior — section without items renders (no crash)",
  tags: ["!dev"],
  args: {
    sections: [{ id: "solo", label: "Solo", icon: IconDocumentFolder } as unknown as RailSection],
    activeSection: "solo", // makes the auto-expand effect read section.items for the active section
    activeItem: "",
    onNavigate: () => {},
  },
  render: (args) => <RailNav {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByRole("navigation").length).toBeGreaterThan(0));
  },
};

// ── Behavioral contract: a childless section is a direct nav button (finding R1.OWN1, 2026-07-30) ──
// A section with no `items` has no sub-panel to peek — clicking its rail button must COMMIT navigation
// (onNavigate(sectionId, sectionId)) instead of toggling an empty panel, so it is not a dead, unselectable
// button. Reported by the owner during the RailNav production-test round.
export const RailLeafNavContract: Story = {
  name: "Behavior — childless section navigates directly (leaf nav)",
  tags: ["!dev"],
  args: {
    sections: [
      { id: "summary", label: "Summary", icon: IconDocumentFolder, items: [] },
      { id: "reports", label: "Reports", icon: IconDataHistogram, items: [
        { id: "r1", label: "Report 1", icon: IconDataHistogram },
      ]},
    ],
    activeSection: "reports",
    activeItem: "r1",
    onNavigate: fn(),
  },
  render: (args) => <RailNav {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = await canvas.findByRole("button", { name: /Summary/i });
    await userEvent.click(btn);
    // CONTRACT: a childless section commits navigation with itemId === sectionId (no panel peek).
    await waitFor(() => expect(args.onNavigate).toHaveBeenCalledWith("summary", "summary"));
  },
};

// ── Behavioral contract: defaultExpandedGroups seeds initial expansion (finding R1.COP1, 2026-07-30) ──
// A consumer needs to open specific disclosure groups by default, independent of the active-path auto-seed
// (e.g. a group expanded while a DIFFERENT leaf is active). CONTRACT: a group id passed in
// defaultExpandedGroups renders expanded at initial render even when the active item is not inside it.
export const DefaultExpandedGroupsContract: Story = {
  name: "Behavior — defaultExpandedGroups seeds initial expansion",
  tags: ["!dev"],
  args: {
    sections: [
      { id: "data", label: "Data", icon: IconDataHistogram, items: [
        { id: "overview", label: "Overview", icon: IconDataHistogram },
        { id: "workloads", label: "Workloads", icon: IconGrid, children: [
          { id: "sku-a", label: "SKU A", icon: IconDataHistogram },
          { id: "sku-b", label: "SKU B", icon: IconDataHistogram },
        ]},
      ]},
    ],
    activeSection: "data",
    activeItem: "overview", // active leaf is NOT inside "workloads" → active-path seed won't open it
    defaultExpandedGroups: ["workloads"],
    onNavigate: () => {},
  },
  render: (args) => <RailNav {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // CONTRACT: "Workloads" is expanded at initial render purely from defaultExpandedGroups.
    const group = await canvas.findByRole("button", { name: /Workloads/i });
    await waitFor(() => expect(group).toHaveAttribute("aria-expanded", "true"));
  },
};

// ── Behavioral contract test (1c, hidden from sidebar) ──
// Typing in the panel search filters the rendered rows: matches remain, non-matches hide.
export const SearchFilterContract: Story = {
  name: "Behavior — search filters results",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = await canvas.findByPlaceholderText("Search...");
    // Before: a non-matching row ("Activity stream") is present.
    await waitFor(() => expect(canvas.getByText("Activity stream")).toBeInTheDocument());
    // Type a query that matches only "Participants".
    await userEvent.type(search, "participants");
    // After: the non-matching row is gone; the match remains.
    await waitFor(() => expect(canvas.queryByText("Activity stream")).toBeNull());
    await expect(canvas.getByText("Participants")).toBeInTheDocument();
  },
};

// ── Behavioral contract test (1d, hidden from sidebar) ──
// The panel subtitle must WRAP (hug y / fill x), not truncate to a single nowrap line.
export const SubtitleWrapContract: Story = {
  name: "Behavior — panel subtitle wraps",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const subtitle = await canvas.findByText(/Lorem ipsum/i);
    // Must not be single-line clamped.
    await expect(getComputedStyle(subtitle).whiteSpace).not.toBe("nowrap");
  },
};

// ── Behavioral contract test (hidden) — elevation shadow must NOT be clipped ──
// The panel's elevation (boxShadow) is truncated if an ancestor wrapper clips it. While the
// panel is open + settled, its immediate wrapper must be overflow:visible so the shadow escapes.
export const ElevationContract: Story = {
  name: "Behavior — panel elevation shadow not clipped",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const panel = Array.from(canvasElement.querySelectorAll("div")).find((el) => {
        const s = getComputedStyle(el);
        return s.boxShadow !== "none" && el.getBoundingClientRect().width > 200;
      });
      if (!panel) throw new Error("no elevated panel found");
      const wrapper = panel.parentElement as HTMLElement;
      const ws = getComputedStyle(wrapper);
      // Wrapper must not clip the shadow while the panel is open.
      expect(ws.overflowX).toBe("visible");
      expect(ws.overflowY).toBe("visible");
    });
  },
};

// ── Behavioral contract test (hidden) — expand/collapse is single-source at EVERY depth ──
// A NESTED sub-group must be controlled by the shared expandedGroups, so the panel menu's
// "Expand all" reaches it (not just top-level groups). (Was local useState — expand-all missed it.)
export const NestedExpandAllContract: Story = {
  name: "Behavior — expand-all reaches nested groups",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body); // the panel menu portals to <body>
    // "Schedules" is a NESTED group (System logic → Schedules), auto-expanded because the
    // active item "monthly" lives inside it.
    const schedules = await canvas.findByRole("button", { name: /Schedules/i });
    await waitFor(() => expect(schedules).toHaveAttribute("aria-expanded", "true"));
    // Collapse the nested group.
    await userEvent.click(schedules);
    await waitFor(() => expect(schedules).toHaveAttribute("aria-expanded", "false"));
    // Open the panel menu and click "Expand all".
    await userEvent.click(canvas.getByRole("button", { name: /Panel actions/i }));
    await userEvent.click(await body.findByRole("menuitem", { name: /Expand all/i }));
    // CONTRACT: expand-all must re-open the NESTED group (single source of truth at depth).
    await waitFor(() => expect(schedules).toHaveAttribute("aria-expanded", "true"));
  },
};

// ── Behavioral contract (hidden) — collapsed group's children LEAVE the DOM after the animation ──
// The <Collapse> animation must still honor the expand/collapse contract: once a group is collapsed
// AND the close transition completes, its subtree is removed from the DOM — not just visually hidden.
// (Guards the animation against regressing the "collapsed content leaves the DOM" guarantee.)
export const GroupCollapseUnmountContract: Story = {
  name: "Behavior — collapsed group children unmount",
  tags: ["!dev"],
  args: {
    sections: SECTIONS_DEFAULT,
    activeSection: "slides",
    activeItem: "monthly",
    onNavigate: () => {},
  },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "System logic" auto-expands (active "monthly" → system → schedules → monthly), so the nested
    // "Schedules" group is initially in the DOM.
    const group = await canvas.findByRole("button", { name: /System logic/i });
    await waitFor(() => expect(canvas.queryByRole("button", { name: /Schedules/i })).not.toBeNull());
    // Collapse the parent group.
    await userEvent.click(group);
    // CONTRACT: after the <Collapse> close transition, the nested subtree is removed from the DOM.
    await waitFor(
      () => expect(canvas.queryByRole("button", { name: /Schedules/i })).toBeNull(),
      { timeout: 2000 },
    );
  },
};

// Consumer brand asset (PLG ships its own Azure logo via the `logo` prop). Exported from
// Figma LogoSlot 328:4357; fill="currentColor" so LogoSlot's onDark color drives it.
function AzureLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.3213 6.0293C23.7308 6.02936 24.1303 6.15865 24.4629 6.39746C24.7955 6.63635 25.0449 6.97432 25.1758 7.3623L32.6094 29.3857C32.7087 29.68 32.7363 29.9946 32.6905 30.3018C32.6445 30.6089 32.5258 30.901 32.3448 31.1533C32.1636 31.4057 31.9248 31.612 31.6485 31.7539C31.3719 31.8958 31.0647 31.9697 30.7539 31.9697H22.3643V31.9619C22.3068 31.9669 22.2485 31.9697 22.1895 31.9697H22.1573C21.7369 31.9697 21.3278 31.8336 20.9903 31.583L15.5215 27.5205L14.4698 30.6377C14.3389 31.0258 14.0895 31.3636 13.7569 31.6025C13.4241 31.8416 13.024 31.9697 12.6143 31.9697H7.24515C6.93431 31.9697 6.62716 31.8958 6.35061 31.7539C6.07422 31.612 5.8355 31.4057 5.65432 31.1533C5.47334 30.901 5.35458 30.6089 5.30862 30.3018C5.26282 29.9946 5.29031 29.68 5.38968 29.3857L12.8233 7.36133C12.9542 6.9733 13.2035 6.6354 13.5362 6.39648C13.8688 6.15767 14.2683 6.02939 14.6778 6.0293H23.3213ZM17.0479 22.1377L16.8662 22.6084H11.3994L13.9629 24.5342L21.8653 30.4043C21.9496 30.467 22.0522 30.5009 22.1573 30.501H22.1895C22.2672 30.501 22.344 30.4827 22.4131 30.4473C22.4822 30.4118 22.5417 30.3599 22.5869 30.2969C22.6321 30.2339 22.6624 30.1607 22.6739 30.084C22.6852 30.0073 22.6782 29.9279 22.6533 29.8545L18.6494 17.9922L17.0479 22.1377ZM24.044 29.3857C24.1668 29.7452 24.1813 30.1333 24.086 30.501H30.7539C30.8315 30.501 30.9085 30.4826 30.9776 30.4473C31.0467 30.4118 31.1071 30.36 31.1524 30.2969C31.1975 30.2339 31.2268 30.1606 31.2383 30.084C31.2497 30.0073 31.2426 29.9279 31.2178 29.8545L23.7852 7.83008C23.7523 7.73349 23.6893 7.64937 23.6065 7.58984C23.5234 7.53033 23.4235 7.49812 23.3213 7.49805H16.6573L24.044 29.3857Z" fill="currentColor"/>
    </svg>
  );
}

// ── Deployment render — PLG 289-4585-r2 "Product-Led Growth" (hidden) ──
// Triangulation render for docs/deploy/plg-dashboard/289-4585-r2 (verify/storybook.png).
// Scorecards is live; the other 5 are `comingSoon` (disabled + chevron) per Figma 289:4585.
const PLG_R2_SECTIONS: RailSection[] = [
  { id: "growth", label: "Product-Led Growth", icon: IconArrowTrendingSparkle, items: [
    { id: "scorecards", label: "Scorecards", icon: IconSlideTextMultiple, badge: { label: "New", variant: "info" } },
    { id: "acquisition", label: "Acquisition", icon: IconTargetArrow, comingSoon: true },
    { id: "time-to-value", label: "Time-to-Value", icon: IconRocket, comingSoon: true },
    { id: "pro-dev-retention", label: "Pro Dev Retention", icon: IconCodeBlock, comingSoon: true },
    { id: "trial-conversion", label: "Trial Conversion", icon: IconCircleMultipleHintCheckmark, comingSoon: true },
    { id: "expansion-revenue", label: "Expansion & Revenue", icon: IconReceiptMoney, comingSoon: true },
  ] },
  { id: "data", label: "Data", icon: IconDataHistogram, disabled: true, items: [{ id: "data-overview", label: "Overview", icon: IconDataHistogram }] },
];
function PLGR2Shell() {
  const [activeSection, setActiveSection] = useState("growth");
  const [activeItem, setActiveItem] = useState("scorecards");
  const [searchOn, setSearchOn] = useState(true);
  const panelMenuItems: PanelHeaderMenuItem[] = [
    { id: "search-box", label: "Search box", icon: IconSearch, checked: searchOn },
    { id: "expand-all", label: "Expand all", icon: IconArrowExpandAll },
    { id: "collapse-all", label: "Collapse all", icon: IconArrowCollapseAll },
  ];
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <RailNav
        sections={PLG_R2_SECTIONS}
        footerSections={[{ id: "settings", label: "Settings", icon: IconSettings, disabled: true, items: [{ id: "general", label: "General", icon: IconSettings }] }]}
        activeSection={activeSection}
        activeItem={activeItem}
        logo={<AzureLogo />}
        logoLabel="Product-Led Growth"
        panelSubtitle="Monitor key stages of the product lifecycle and growth funnel."
        searchable={searchOn}
        panelMenuItems={panelMenuItems}
        onPanelMenuAction={(id) => { if (id === "search-box") setSearchOn((v) => !v); }}
        onNavigate={(s, i) => { setActiveSection(s); setActiveItem(i); }}
      />
    </div>
  );
}
export const PLGDeploymentR2: Story = {
  name: "Deployment — PLG 289-4585-r2 (Product-Led Growth)",
  tags: ["!dev"],
  args: { sections: PLG_R2_SECTIONS, activeSection: "growth", activeItem: "scorecards", onNavigate: () => {} },
  render: () => <PLGR2Shell />,
};

// ════════════════════════════════════════════════════════════════════════════════
// Phase-2 borrow safety net — LOCK the highest-risk UN-GATED RailNav behaviors.
// (docs/atomic/organism/RAILNAV-BEHAVIOR-CONTRACT.md · docs/process/PRIMITIVES-FIRST-METHOD.md §4a)
// These stories assert CURRENT behavior verbatim so a Phase-2 engine swap (Radix menu / cmdk /
// Radix Collapsible) cannot silently drop it. TEST-ONLY — no component change. All `tags:["!dev"]`
// so they run in test-storybook / `npm run health` without cluttering the sidebar.
// ════════════════════════════════════════════════════════════════════════════════

// Deterministic rail-overflow fixture. Forces overflow via `maxVisibleRailItems` (Contract A3 —
// "explicit override wins": measurement is skipped and computedMax is set verbatim), so the test
// NEVER depends on real viewport height. 16 sections, cap 5 → visibleCount = 4 (Documents · Slides ·
// Data · Overview) + the "More" button; the trailing 12 (Savings … Emailing) bury into the menu.
// FooterSlot (Settings + disabled utility) is a separate flex child and stays pinned.
// suppressBuiltinPanel keeps this rail-only so panel rows can't collide with rail-button name queries.
// NOTE: this locks the burial/footer-pinned/menu policy (A4–A7, A11, E5, F4/F5). It does NOT cover
// the HEIGHT-MEASUREMENT path (A1/A2) — that remains covered only by the static --figmaspec render.
function RailOverflowFixture() {
  return (
    <div style={{ display: "flex", height: 600, overflow: "hidden" }}>
      <RailNav
        sections={SECTIONS_FIGMA_AUDIT}
        footerSections={[{ id: "settings", label: "Settings", icon: IconSettings, items: [{ id: "general", label: "General", icon: IconSettings }] }]}
        activeSection="documents"
        activeItem=""
        maxVisibleRailItems={5}
        suppressBuiltinPanel
        utilityItems={<FigmaAuditDisabledButton />}
        onNavigate={() => {}}
      />
    </div>
  );
}

// ── Contract §A — rail overflow policy (OWNER-CRITICAL, previously un-gated) ──
// Locks: More button appears when sections exceed capacity (A4/A5); trailing sections bury while
// earlier ones stay on the rail (A6); the buried section is revealed in the opened menu (A11);
// the FOOTER is pinned and NEVER feeds the overflow menu (A7).
export const RailOverflowContract: Story = {
  name: "Behavior — rail overflow buries trailing icons; footer stays pinned",
  tags: ["!dev"],
  args: { sections: SECTIONS_FIGMA_AUDIT, activeSection: "documents", activeItem: "", onNavigate: () => {} },
  render: () => <RailOverflowFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body); // overflow menu portals to <body>
    // A4/A5 — the "More" button appears once sections exceed capacity.
    const more = await canvas.findByRole("button", { name: "More navigation options" });
    // A6 — an early section stays on the rail; a trailing section is buried (not rendered on the rail).
    await expect(canvas.getByRole("button", { name: "Documents" })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Emailing" })).toBeNull();
    // A7 — the footer utility stays pinned on the rail (never consumed by overflow).
    await expect(canvas.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    // A11 — opening the menu reveals exactly the buried section as a menu item.
    await userEvent.click(more);
    await expect(await body.findByRole("menuitem", { name: "Emailing" })).toBeInTheDocument();
    // A7 — the footer section is NEVER added to the overflow menu, and is still on the rail.
    await expect(body.queryByRole("menuitem", { name: "Settings" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  },
};

// ── Contract §F — overflow menu keyboard roving + auto-focus (F5 / E5) ──
// Locks: menu auto-focuses first item on open (E5); ArrowDown/Up move with wraparound, Home/End
// jump to first/last, Escape closes (F5).
export const OverflowMenuRovingContract: Story = {
  name: "Behavior — overflow menu keyboard roving (arrows wrap, Home/End, Escape)",
  tags: ["!dev"],
  args: { sections: SECTIONS_FIGMA_AUDIT, activeSection: "documents", activeItem: "", onNavigate: () => {} },
  render: () => <RailOverflowFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const more = await canvas.findByRole("button", { name: "More navigation options" });
    await userEvent.click(more);
    // overflowSections = sections.slice(4) → first "Savings", second "Gauge", last "Emailing".
    const first = await body.findByRole("menuitem", { name: "Savings" });
    const last = await body.findByRole("menuitem", { name: "Emailing" });
    // E5 (updated 2026-07-12, owner-approved — Radix borrow): Radix leaves focus on the TRIGGER on MOUSE
    // open (the standard WAI-ARIA menu-button pattern); ArrowDown enters the menu to the first item.
    // (Keyboard open focuses the first item directly.) Every focus move is async — Radix RovingFocusGroup
    // moves focus on setTimeout(0) — so each focus assertion is wrapped in waitFor (was sync before).
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(first).toHaveFocus());
    // F5 — ArrowDown advances one item.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("menuitem", { name: "Gauge" })).toHaveFocus());
    // F5 — Home jumps to first, End jumps to last.
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(last).toHaveFocus());
    // F5 — wraparound: ArrowDown from last → first; ArrowUp from first → last.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(last).toHaveFocus());
    // F5 — Escape closes the menu.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Emailing" })).toBeNull());
  },
};

// ── Contract §F4 — overflow menu outside-click (checks BOTH trigger and portal) ──
// Locks: a mousedown INSIDE the portal menu is ignored (menu stays open); a mousedown OUTSIDE both
// the trigger and the portal closes the menu.
export const OverflowMenuOutsideClickContract: Story = {
  name: "Behavior — overflow menu closes on outside click only",
  tags: ["!dev"],
  args: { sections: SECTIONS_FIGMA_AUDIT, activeSection: "documents", activeItem: "", onNavigate: () => {} },
  render: () => <RailOverflowFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const more = await canvas.findByRole("button", { name: "More navigation options" });
    await userEvent.click(more);
    const item = await body.findByRole("menuitem", { name: "Savings" });
    // F4 (updated 2026-07-12, owner-approved — Radix borrow): assert via `pointerdown` — the event Radix's
    // DismissableLayer listens on (was `mousedown`, the old hand-rolled listener). Same behavior: a
    // pointerdown INSIDE the portal menu is ignored (menu stays open)…
    fireEvent.pointerDown(item);
    await expect(body.getByRole("menuitem", { name: "Savings" })).toBeInTheDocument();
    // …and a pointerdown OUTSIDE both trigger and portal closes the menu.
    fireEvent.pointerDown(doc.body);
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Savings" })).toBeNull());
  },
};

// ── Contract §E1 — focus returns to the originating rail button after panel collapse ──
// WORKING CASE ONLY: the collapsed section's rail button is present in the rail (maxVisibleRailItems
// forces no overflow so "Slides" is on the rail). KNOWN GAP (Contract Owner-not-found #3): if the
// collapsed section is BURIED in the overflow menu its button is not in railRef, so focus-return
// silently no-ops — that gap is deliberately NOT asserted here as correct.
function FocusReturnShell() {
  const [activeSection, setActiveSection] = useState("slides");
  const [activeItem, setActiveItem] = useState("monthly");
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <RailNav
        sections={SECTIONS_DEFAULT}
        footerSections={FOOTER_SECTIONS_DEFAULT}
        activeSection={activeSection}
        activeItem={activeItem}
        onNavigate={(s, i) => { setActiveSection(s); setActiveItem(i); }}
        maxVisibleRailItems={16} // no overflow → the "Slides" rail button is on the rail (working case)
        panelSubtitle="Lorem ipsum"
      />
    </div>
  );
}
export const FocusReturnContract: Story = {
  name: "Behavior — focus returns to rail button after panel collapse",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <FocusReturnShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Panel is open on "slides" (internalOpenPanel seeds to activeSection). Move focus INTO the panel
    // (a nav leaf), away from the rail button, so a genuine focus RETURN can be observed.
    const railSlides = await canvas.findByRole("button", { name: "Slides" });
    const contentRow = await canvas.findByRole("button", { name: "Content" });
    contentRow.focus();
    await expect(railSlides).not.toHaveFocus();
    // Collapse the panel via rail-level Escape (bubbles from the panel to the aside handler).
    await userEvent.keyboard("{Escape}");
    // E1 — focus returns to the originating rail button (located via data-section-id in railRef).
    await waitFor(() => expect(railSlides).toHaveFocus());
  },
};

// ── Contract §B7 — panel resize clamps to [240, viewport-max] ──
// Locks: dragging the resize separator clamps the panel width to PANEL_MIN_WIDTH (240) on the low
// end and to the viewport-derived max on the high end. Reads the wrapper's inline style.width (the
// clamped panelWidth is written verbatim to style; the CSS width transition never touches the attr).
export const ResizeClampContract: Story = {
  name: "Behavior — panel resize clamps to [240, viewport-max]",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const win = canvasElement.ownerDocument.defaultView as (Window & typeof globalThis);
    const handle = await canvas.findByRole("separator", { name: /Resize sidebar panel/i });
    const wrapper = handle.parentElement as HTMLElement; // the width-bearing SidebarPanel wrapper
    // Mirror the component's clamp math (RailNav.tsx L396): viewportMax is viewport-derived.
    const viewportMax = Math.max(LAYOUT.panelW, win.innerWidth - LAYOUT.railW - LAYOUT.panelGap - SPACE[6]);
    // Begin the drag at clientX=500 (initial width = LAYOUT.panelW = 300).
    fireEvent.mouseDown(handle, { clientX: 500 });
    // Drag far LEFT past the minimum → clamps to 240. The `mousemove` listener is attached in a
    // useEffect that runs AFTER the isResizingPanel re-render (RailNav.tsx L396–413), so a single move
    // fired synchronously after mouseDown can land BEFORE the listener exists (deterministic in headless
    // CI). RETRY the move inside waitFor until it registers — the clamp math is idempotent, so this still
    // asserts §B7 (240px low clamp) verbatim.
    await waitFor(() => {
      fireEvent.mouseMove(win, { clientX: 0 });
      expect(wrapper.style.width).toBe("240px");
    });
    // Drag far RIGHT past the maximum → clamps to the viewport-derived max (same retry pattern).
    await waitFor(() => {
      fireEvent.mouseMove(win, { clientX: 100000 });
      expect(wrapper.style.width).toBe(`${viewportMax}px`);
    });
    fireEvent.mouseUp(win);
  },
};

// ── Contract §D3 — Escape in the search input clears the query (does not close the panel) ──
// Locks: Escape clears the value AND stopPropagation() keeps the rail-level Escape (which would
// close the panel) from firing — proven by the search input (panel-only) still being present.
export const SearchEscapeClearContract: Story = {
  name: "Behavior — Escape clears search (panel stays open)",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = (await canvas.findByPlaceholderText("Search...")) as HTMLInputElement;
    await userEvent.type(search, "monthly");
    await expect(search.value).toBe("monthly");
    // D3 — Escape in the input clears the query.
    search.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(search.value).toBe(""));
    // D3 — stopPropagation kept the panel open: the panel-only search input is still present.
    await expect(canvas.getByPlaceholderText("Search...")).toBeInTheDocument();
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// Phase-2 borrow safety net — PANEL-HEADER ACTIONS MENU (Contract §E5 / §F4 / §F5 / §F9).
// (docs/atomic/organism/RAILNAV-BEHAVIOR-CONTRACT.md · docs/process/PRIMITIVES-FIRST-METHOD.md §4a)
// These stories LOCK the CURRENT hand-rolled PanelHeader actions-menu behavior verbatim, BEFORE the
// Radix DropdownMenu borrow, so the engine swap cannot silently drop it. They intentionally encode
// the REAL old behavior (auto-focus first item on open; outside-click via a document listener; checked
// row shows a trailing checkmark + weight bump; disabled row is inert; danger row renders red) — NOT
// Radix-friendly assertions. All `tags:["!dev"]` so they run in test-storybook / `npm run health`.
// ════════════════════════════════════════════════════════════════════════════════

// Lean fixture: the shipped RailNav with its built-in panel open on "slides" (so the PanelHeader and
// its actions-menu button render), parametrized by the menu items under test. `last-action` mirrors
// the most recent onPanelMenuAction id so a test can prove a disabled row is NOT actionable.
function PanelMenuShell({ menuItems }: { menuItems: PanelHeaderMenuItem[] }) {
  const [lastAction, setLastAction] = useState("");
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", position: "relative" }}>
      <RailNav
        sections={SECTIONS_DEFAULT}
        activeSection="slides"
        activeItem="monthly"
        onNavigate={() => {}}
        panelSubtitle="Lorem ipsum"
        panelMenuItems={menuItems}
        onPanelMenuAction={(id) => setLastAction(id)}
      />
      <span data-testid="last-action" style={{ position: "absolute", left: -9999, top: 0 }}>{lastAction}</span>
    </div>
  );
}

// Roving fixture — no checked row, so every row stays role="menuitem" (checked rows become
// role="menuitemcheckbox" after the Radix borrow). One disabled row proves roving SKIPS disabled.
// Non-disabled roving order: Option A(0) · Option B(1) · Remove(3); Locked(2) is skipped.
const PANEL_MENU_ROVING_ITEMS: PanelHeaderMenuItem[] = [
  { id: "opt-a", label: "Option A", icon: IconArrowExpandAll },
  { id: "opt-b", label: "Option B", icon: IconArrowCollapseAll },
  { id: "locked", label: "Locked action", icon: IconSyncOff, disabled: true },
  { id: "remove", label: "Remove", icon: IconBoxArrowLeft, danger: true },
];

// Row-states fixture — a checked row, a normal row, a disabled row, and a danger row.
const PANEL_MENU_STATE_ITEMS: PanelHeaderMenuItem[] = [
  { id: "toggle", label: "Search box", icon: IconSearch, checked: true },
  { id: "opt-a", label: "Option A", icon: IconArrowExpandAll },
  { id: "locked", label: "Locked action", icon: IconSyncOff, disabled: true },
  { id: "remove", label: "Remove", icon: IconBoxArrowLeft, danger: true },
];

// ── Contract §E5 / §F5 — panel-header menu auto-focus + keyboard roving ──
// Locks: opening via the panel actions button auto-focuses the first item (E5); ArrowDown/Up move
// with wraparound SKIPPING the disabled row, Home/End jump to first/last, Escape closes (F5).
export const PanelMenuRovingContract: Story = {
  name: "Behavior — panel actions menu keyboard roving (arrows wrap, Home/End, Escape)",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <PanelMenuShell menuItems={PANEL_MENU_ROVING_ITEMS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body); // the panel menu portals to <body>
    const trigger = await canvas.findByRole("button", { name: "Panel actions" });
    await userEvent.click(trigger);
    const first = await body.findByRole("menuitem", { name: "Option A" });
    const last = await body.findByRole("menuitem", { name: "Remove" });
    // E5 (updated 2026-07-12, owner-approved — Radix borrow): mouse-open leaves focus on the TRIGGER (the
    // standard WAI-ARIA menu-button pattern); ArrowDown enters the menu to the first item. Matches the
    // sibling OverflowMenuRovingContract.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(first).toHaveFocus());
    // F5 — ArrowDown advances one item.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("menuitem", { name: "Option B" })).toHaveFocus());
    // F5 — ArrowDown SKIPS the disabled "Locked action" row, landing on "Remove".
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(last).toHaveFocus());
    // F5 — Home jumps to first, End jumps to last.
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(last).toHaveFocus());
    // F5 — wraparound: ArrowDown from last → first; ArrowUp from first → last.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(last).toHaveFocus());
    // F5 — Escape closes the menu.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Remove" })).toBeNull());
  },
};

// ── Contract §F4 — panel-header menu outside-click (checks BOTH trigger and portal) ──
// Locks: a mousedown INSIDE the portal menu is ignored (menu stays open); a mousedown OUTSIDE both
// the trigger and the portal closes the menu (hand-rolled: a document `mousedown` listener).
export const PanelMenuOutsideClickContract: Story = {
  name: "Behavior — panel actions menu closes on outside click only",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <PanelMenuShell menuItems={PANEL_MENU_ROVING_ITEMS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const trigger = await canvas.findByRole("button", { name: "Panel actions" });
    await userEvent.click(trigger);
    const item = await body.findByRole("menuitem", { name: "Option A" });
    // A pointerdown INSIDE the portal menu is ignored (menu stays open)… [Radix DismissableLayer listens on
    // pointerdown, not mousedown — owner-approved 2026-07-12, matches OverflowMenuOutsideClickContract.]
    fireEvent.pointerDown(item);
    await expect(body.getByRole("menuitem", { name: "Option A" })).toBeInTheDocument();
    // …and a pointerdown OUTSIDE both trigger and portal closes the menu.
    fireEvent.pointerDown(doc.body);
    await waitFor(() => expect(body.queryByRole("menuitem", { name: "Option A" })).toBeNull());
  },
};

// ── Contract §F9 — panel-header menu row: checked / disabled / danger variants ──
// Locks: a checked row shows a trailing checkmark (2 svgs vs 1) + weight 500; a disabled row is inert
// (click fires no action + menu stays open); a danger row renders in a distinct (red) color.
export const PanelMenuRowStatesContract: Story = {
  name: "Behavior — panel actions menu checked / disabled / danger rows",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <PanelMenuShell menuItems={PANEL_MENU_STATE_ITEMS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = await canvas.findByRole("button", { name: "Panel actions" });
    await userEvent.click(trigger);
    await body.findByText("Option A");

    // F9 CHECKED — role-agnostic (the checked row's role changes menuitem → menuitemcheckbox after the
    // Radix borrow): find the row by text, walk to its [role] host. It carries a trailing checkmark
    // (leading icon svg + checkmark svg = 2) and its label weight is bumped to 500.
    const checkedRow = body.getByText("Search box").closest('[role^="menuitem"]') as HTMLElement;
    expect(checkedRow).not.toBeNull();
    const normalRow = body.getByText("Option A").closest('[role^="menuitem"]') as HTMLElement;
    expect(checkedRow.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    expect(normalRow.querySelectorAll("svg").length).toBe(1);
    expect(getComputedStyle(checkedRow).fontWeight).toBe("500");

    // F9 DANGER — the danger row renders in a color distinct from a normal enabled row.
    const dangerRow = body.getByRole("menuitem", { name: "Remove" });
    expect(getComputedStyle(dangerRow).color).not.toBe(getComputedStyle(normalRow).color);

    // F9 DISABLED — the disabled row is inert: clicking it fires NO onPanelMenuAction and the menu
    // stays open. (fireEvent bypasses userEvent's pointer-events/disabled guards.)
    const disabledRow = body.getByRole("menuitem", { name: "Locked action" });
    fireEvent.click(disabledRow);
    await expect(canvas.getByTestId("last-action").textContent).toBe("");
    await expect(body.getByRole("menuitem", { name: "Option A" })).toBeInTheDocument();
  },
};

// ── Behavioral contract test (hidden) — nav-row badge is the Badge ATOM, not bare text ──
// Figma 783:4757 renders the nav-row badge as a neutral pill (subtle fill + hairline border +
// pill radius). A prior build silently degraded it to a bare TYPE.caption span (no chrome); this
// locks it as the real Badge atom so it can't regress back to text.
export const PanelBadgeChromeContract: Story = {
  name: "Behavior — nav-row badge renders as the Badge atom pill",
  tags: ["!dev"],
  args: { sections: SECTIONS_DEFAULT, activeSection: "slides", activeItem: "monthly", onNavigate: () => {} },
  render: () => <DefaultShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "+23" is a top-level badged row in the slides panel (Activity stream). The Badge atom clips its
    // label in an INNER ellipsis span, so findByText returns that inner span — the pill chrome (border +
    // pill radius) lives on its PARENT (the Badge pill). Assert on the pill, not the text node.
    const badgeLabel = await canvas.findByText("+23");
    const badge = badgeLabel.parentElement as HTMLElement;
    const s = getComputedStyle(badge);
    // Pill chrome: a real border (not "none"/0-width) AND a pill radius — bare text has neither.
    expect(s.borderStyle).toContain("solid");
    expect(parseFloat(s.borderTopWidth)).toBeGreaterThan(0);
    expect(parseFloat(s.borderTopLeftRadius)).toBeGreaterThanOrEqual(24);
  },
};
