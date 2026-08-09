import { useEffect, useMemo, useRef, useState } from "react"
import { Presence } from "@radix-ui/react-presence"
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
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
  RibbonIcon,
  SavingsIcon,
  ScrollArea,
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
// named `SpecIcon`, nothing else). Built limbo-factory for production and confirmed empirically (not
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
                // QA finding (see divergence row L-13): this plain div had no vertical padding at
                // all (relying solely on `items-center` + fixed `h-9` for centering), while every
                // real Button row (leaf/group/selected) carries `py-2` (8px) from Button's own base
                // recipe, which we never override. No visible difference today — both approaches
                // center content identically inside a fixed-height flex row — but the underlying
                // values didn't actually match. Added `py-2` explicitly so this row's computed
                // padding is identical to every other row, not just visually equivalent.
                className="flex h-9 items-center gap-1.5 rounded-md px-2 py-2 text-sm"
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
              aria-pressed={isSelected}
              onClick={() => onSelectLeaf(node.id)}
              // QA finding (see divergence row L-12): `px-2` alone didn't actually win — Button's
              // own default-size recipe carries `has-[>svg]:px-3` (12px, conditional on containing
              // an icon), which is a DIFFERENT conflict group to tailwind-merge than plain `px-2`,
              // so both survive and the base `has-[>svg]:px-3` kept winning the cascade (confirmed:
              // icon sat 12px from the button edge, not the intended 8px) — the exact same
              // failure class as M-18/M-19. Explicitly repeating the override AS a `has-[>svg]:`
              // variant (not just the plain utility) puts it in the same conflict group so it
              // actually replaces the base rule.
              className="h-9 w-full justify-start gap-1.5 rounded-md px-2 has-[>svg]:px-2 text-left text-sm font-normal hover:bg-accent"
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
              <span className="flex-1 truncate">{node.label}</span>
              {node.badge && <PanelBadge label={node.badge} />}
            </Button>
          )
        }

        const isOpen = expanded.has(node.id)
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
                  not visually demoted by depth. */}
              <Button
                type="button"
                variant="ghost"
                // QA finding (see divergence row L-12): same has-[>svg]:px-3 vs px-2 conflict-group
                // gap as the leaf Button above — repeating the override as a has-[>svg]: variant
                // makes it actually win over Button's own default-size base recipe.
                className="h-9 w-full justify-start gap-1.5 rounded-md px-2 has-[>svg]:px-2 text-left text-sm font-normal hover:bg-accent"
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
            <CollapsibleContent>
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
 * DEPLOYMENT NOTE (see divergence row F-10): `height` here is a measured pixel NUMBER, not a
 * percentage/`h-full` — that's this limbo-factory preview's own plumbing (App.tsx's `FillHeight`
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

  // QA finding (see divergence row L-16): needed so the panel's own content (icon/label/tree data)
  // stays visible and rendered while `<Presence>` keeps the wrapper mounted for the exit animation
  // below \u2014 `openSection` itself goes `undefined` the instant the panel starts closing, which would
  // otherwise blank the panel out a frame before the fade/zoom-out animation even has a chance to
  // play. Updated synchronously during render (not via useEffect) so there's no one-tick lag where
  // the DOM would flash empty first.
  const lastOpenSectionRef = useRef(openSection)
  if (openSection) lastOpenSectionRef.current = openSection
  const displaySection = openSection ?? lastOpenSectionRef.current

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
          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.divider }} />

          {/* DEPLOYMENT NOTE (see divergence row F-11): `flex-1 min-h-0` here is the ENTIRE
              mechanism that anchors the footer group (Profile + Settings, below) to the bottom of
              the rail — this nav section grows to consume all left-over vertical space, pushing
              the second divider and footer group down to the bottom edge. This is not achieved by
              reordering the DOM or by absolute/fixed positioning, and the footer's own items still
              render in normal top-to-bottom order (Profile above Settings) — only the GROUP as a
              whole is bottom-anchored. Preserve this same flex-1-spacer approach in any real Build
              reimplementation. */}
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
                <DropdownMenuContent side="right" align="start" className="w-[180px]">
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
                      MenubarItem/CommandItem, etc.) gain this truncation by default system-wide? */}
                  {stashedSections.map((section) => (
                    <DropdownMenuItem key={section.id} onSelect={() => handleRailClick(section)}>
                      <section.icon className="size-4" filled={section.id === activeSectionId} />
                      <span className="min-w-0 flex-1 truncate">{section.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mx-0 my-2 h-px max-w-full" style={{ background: colors.divider }} />
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
        {displaySection && (
          <Presence present={Boolean(openSection)}>
            {/* QA finding (see divergence row L-15/L-16): prompted by "it is not just the border you
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
                starts \u2014 exactly when the CSS exit animation should begin playing. The `<Presence>`
                wrapper is what keeps this element mounted in the DOM for the duration of that exit
                animation before actually unmounting it \u2014 it's the exact same primitive every real
                Radix Content component (Popover/DropdownMenu/Dialog) uses internally for this exact
                problem (confirmed in @radix-ui/react-dialog's own compiled source: `<Presence present=
                {forceMount || context.open}>{content}</Presence>`, a single plain element child, not
                the function/render-prop form \u2014 using the render-prop form here initially caused a
                type error, since Presence's own forceMount branch (active for that form) requires a
                real element back, not `null`; this plain-element form matches real Radix usage anyway).
                This is not a hand-rolled setTimeout-based unmount delay standing in for a real
                mechanism \u2014 it's the same underlying primitive, used the same way real Radix content
                components use it, per the standing "don't reinvent the wheel, use real components"
                rule. `displaySection` (not `openSection`) drives the header/tree content specifically
                so the content stays rendered and visible while Presence holds the wrapper mounted for
                the exit animation \u2014 `openSection` itself goes `undefined` the instant closing starts,
                which would otherwise blank the panel a frame before the animation had a chance to
                play. */}
            <div
              data-state={openSection ? "open" : "closed"}
              className="flex flex-col overflow-hidden shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
              style={{
                width: 300,
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
                      spacing, so there's no padding-override arithmetic (or cascade pitfall) at all. */}
                  <InputGroup className="h-8 text-sm">
                    <InputGroupAddon>
                      <SearchIcon className="size-3.5 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      className="text-sm"
                    />
                  </InputGroup>
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
                  <div className="p-1.5 pr-4">
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
                </ScrollArea>
              </div>
            </div>
          </Presence>
        )}
      </div>
    </TooltipProvider>
  )
}

export type { ProposedToken }
