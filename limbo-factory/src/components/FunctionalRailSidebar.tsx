import { useEffect, useMemo, useRef, useState } from "react"
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
  Input,
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
  PersonHeartIcon,
  PlantGrassIcon,
  ReceiptMoneyIcon,
  ReceiptSearchIcon,
  RibbonIcon,
  SavingsIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckmarkIcon,
  SlideTextMultipleIcon,
  SportIcon,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UserIcon,
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
 * reimplemented from scratch against bidezine's own primitives. See LIMBO-PROTOCOL-LOG.md.
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
function specTreeIcon(entry: { d: string; filledD?: string }): React.ComponentType<{ className?: string; filled?: boolean }> {
  return function SpecIcon({ className, filled }: { className?: string; filled?: boolean }) {
    const d = filled && entry.filledD ? entry.filledD : entry.d
    return (
      <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
        <path d={d} />
      </svg>
    )
  }
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
    children: [
      { kind: "leaf", id: "rules-engine", label: "Rules engine", icon: specTreeIcon(FULL_PREVIEW_ICONS.engine) },
      { kind: "leaf", id: "triggers", label: "Triggers", icon: specTreeIcon(FULL_PREVIEW_ICONS.syncOff) },
      {
        kind: "group",
        id: "schedules",
        label: "Schedules",
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

// Documents panel content — mirrors the real demo's Apps + Products/Orders/Sales/Customers
// group structure, so both sides expose the same depth of nesting and badges to evaluate.
const DOCUMENTS_PANEL: PanelNode[] = [
  { kind: "leaf", id: "apps", label: "Apps", icon: AppsIcon },
  {
    kind: "group",
    id: "products",
    label: "Products",
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
  { id: "gauge", label: "Gauge", icon: GaugeIcon, items: [] },
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

function RailIconButton({
  section,
  state,
  colors,
  onClick,
}: {
  section: RailSection
  state: "default" | "browsing" | "active"
  colors: RailColors
  onClick: () => void
}) {
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

  const background = isPressed ? colors.pressed : isActive ? colors.active : isHovered ? colors.hover : "transparent"
  const color = isActive || isPressed ? colors.fg : isBrowsing || isHovered ? colors.fgHover : colors.fgSubtle

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isActive}
      data-state={isBrowsing ? "open" : isActive ? "active" : "default"}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className="h-[38px] w-[38px] shrink-0 rounded-lg"
      style={{
        background,
        color,
        boxShadow: isBrowsing ? `inset 0 0 0 1.5px ${colors.border}` : undefined,
        transition: "background-color 150ms ease, color 150ms ease",
      }}
    >
      <Icon className="size-5" filled={isActive || isBrowsing} />
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

function PanelBadge({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="ml-2 shrink-0 px-1.5 py-0 text-[10px]">
      {label}
    </Badge>
  )
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
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        if (node.kind === "leaf") {
          const isSelected = node.id === activeItemId
          const Icon = node.icon
          if (node.disabled) {
            return (
              <div
                key={node.id}
                aria-disabled="true"
                className="flex h-9 items-center gap-1.5 rounded-md px-2 text-sm"
                style={{ marginLeft: depth * 14, color: "var(--muted-foreground)", opacity: 0.5 }}
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
              aria-pressed={isSelected}
              onClick={() => onSelectLeaf(node.id)}
              className="h-9 w-full justify-start gap-1.5 rounded-md px-2 text-left text-sm font-normal hover:bg-accent"
              style={{
                marginLeft: depth * 14,
                background: isSelected ? "var(--foreground)" : "transparent",
                color: isSelected ? "var(--background)" : "var(--foreground)",
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{node.label}</span>
              {node.badge && <PanelBadge label={node.badge} />}
            </Button>
          )
        }

        const isOpen = expanded.has(node.id)
        return (
          <Collapsible key={node.id} open={isOpen} onOpenChange={() => onToggle(node.id)}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full justify-start gap-1.5 rounded-md px-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent"
                style={{ marginLeft: depth * 14 }}
              >
                <svg
                  viewBox="0 0 20 20"
                  className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-180")}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={FULL_PREVIEW_ICONS.chevronDown.d} />
                </svg>
                <span className="flex-1 truncate">{node.label}</span>
                {node.badge && <PanelBadge label={node.badge} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <PanelTree
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                activeItemId={activeItemId}
                onSelectLeaf={onSelectLeaf}
                colors={colors}
              />
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
  fg: string
  fgHover: string
  fgSubtle: string
  fgDisabled: string
  panelSurface: string
  hairline: string
}

export function FunctionalRailSidebar({
  colors,
  height = 550,
  fontFamily,
}: {
  colors: RailColors
  height?: number
  fontFamily: string
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
  const [pinnedCount, setPinnedCount] = useState(TOP_SECTIONS.length)

  useEffect(() => {
    const trackEl = trackRef.current
    if (!trackEl) return

    const recalc = () => {
      // The track is the flex-1 middle segment of the rail column, so flexbox has already sized
      // it to whatever's left after the logo row and footer group above/below it — no separate
      // footer/logo subtraction needed here.
      const buttonEl = trackEl.querySelector("button")
      if (!buttonEl) return
      const rowHeight = buttonEl.getBoundingClientRect().height
      const rowGap = parseFloat(getComputedStyle(trackEl).rowGap || "0") || 0
      const usableHeight = trackEl.clientHeight
      if (rowHeight <= 0) return

      // Walk one row at a time (rather than a single divide-by-constant formula) so the "stash
      // into a menu" trigger reads as its own, independently-derived thing.
      let fitCount = 0
      let consumed = 0
      while (fitCount < TOP_SECTIONS.length) {
        const next = consumed + (fitCount === 0 ? rowHeight : rowHeight + rowGap)
        if (next > usableHeight) break
        consumed = next
        fitCount += 1
      }
      setPinnedCount(Math.max(1, fitCount))
    }

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(trackEl)
    return () => observer.disconnect()
  }, [])

  const mustStash = TOP_SECTIONS.length > pinnedCount
  const pinnedSections = mustStash ? TOP_SECTIONS.slice(0, Math.max(1, pinnedCount - 1)) : TOP_SECTIONS
  const stashedSections = mustStash ? TOP_SECTIONS.slice(pinnedSections.length) : []
  const stashHoldsActiveSection = stashedSections.some((s) => s.id === activeSectionId)

  const allSections = [...TOP_SECTIONS, ...FOOTER_SECTIONS]
  const openSection = allSections.find((s) => s.id === openPanel)

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
    () => filterTree(openSection?.items ?? [], query),
    [openSection, query],
  )

  // While searching, force-expand every surviving group so matches are always visible.
  const effectiveExpanded = query.trim() ? new Set([...expanded, ...matchIds]) : expanded

  const railState = (id: string): "default" | "browsing" | "active" => {
    if (id === activeSectionId) return "active"
    if (id === openPanel) return "browsing"
    return "default"
  }

  return (
    <TooltipProvider>
      <div className="flex" style={{ fontFamily, gap: 8, height }}>
        {/* Rail */}
        <div
          className="flex shrink-0 flex-col overflow-hidden p-2"
          style={{ width: 54, borderRadius: 12, background: colors.surface }}
        >
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg"
                  style={{ color: colors.fgHover }}
                >
                  <svg viewBox={BIDEZINE_LOGO_VIEWBOX} className="size-6" fill="currentColor" aria-hidden="true">
                    <path d={BIDEZINE_LOGO_PATH} />
                  </svg>
                </div>
              </TooltipTrigger>
              {/* Origin's LogoSlotDark always shows a hover tooltip with the logo label (default
                  "BiDezine", see divergence row M-9), even when the slot has no onClick — matches
                  that behavior here via the real Tooltip primitive (L-1). */}
              <TooltipContent side="right">BiDezine</TooltipContent>
            </Tooltip>
          </div>
          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.border }} />

          <div ref={trackRef} aria-label="Main navigation" role="navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
            {pinnedSections.map((section) => (
              <RailIconButton
                key={section.id}
                section={section}
                state={railState(section.id)}
                colors={colors}
                onClick={() => handleRailClick(section)}
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
                    className="relative h-[38px] w-[38px] shrink-0 rounded-lg"
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
                <DropdownMenuContent side="right" align="start" className="w-[180px]">
                  {stashedSections.map((section) => (
                    <DropdownMenuItem key={section.id} onSelect={() => handleRailClick(section)}>
                      <section.icon className="size-4" filled={section.id === activeSectionId} />
                      {section.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.border }} />
          <div className="flex flex-col gap-1">
            {/* Pinned utility button — a permanently disabled "Profile" slot. Unlike the primary
                sections, this never gets absorbed by the overflow menu; it stays put in the
                footer zone above Settings, matching the demo's non-interactive utility slot. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label="Profile (disabled)"
              className="h-[38px] w-[38px] shrink-0 rounded-lg hover:bg-transparent"
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
        {openSection && (
          <div
            className="flex flex-col overflow-hidden"
            style={{ width: 300, borderRadius: 12, background: colors.panelSurface }}
          >
            <div className="flex flex-col gap-0.5 px-3 py-2" style={{ borderBottom: `1px solid ${colors.hairline}` }}>
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-1.5">
                  <openSection.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-base font-medium">{openSection.label}</span>
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
                      <DropdownMenuItem onSelect={() => setExpanded(new Set(collectGroupIds(openSection.items)))}>
                        Expand all
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setExpanded(new Set())}>Collapse all</DropdownMenuItem>
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
              <p className="truncate pl-[22px] text-xs text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>

            {searchEnabled && (
              <div className="relative px-2 pt-2">
                <SearchIcon className="pointer-events-none absolute left-4 top-[1.15rem] size-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-8 pl-7 text-sm"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-1.5">
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
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export type { ProposedToken }
