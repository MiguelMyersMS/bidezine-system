# Cross-Workspace Task

> **Status:** `DONE`
> **From:** PLG-dashboard (`C:\Users\miguelmyers\Workspaces\apps\PLG-dashboard`)
> **To:** design-system (`C:\Users\miguelmyers\Workspaces\systems\design-system`)
> **Created:** 2026-06-12
> **Task ID:** PLG-001

---

## Task: Extract RailNav Spec from Figma

### Objective

Use the Figma MCP to inspect the PLG-dashboard navigation design and output a structured JSON spec that the PLG-dashboard agent will use to build a `RailNav` component instance.

### Figma Reference

- **File:** `https://www.figma.com/design/EyYETHXMDDURPGK4PXTU5C/Single-shape`
- **Node:** `289-4585`
- **Fallback:** If node `289-4585` is not found, search the file for a frame named "RailNav", "Navigation", "Sidebar", or "Nav" and use that instead. Report which node you used.

### What to Extract

For the navigation frame, extract:

1. **Sections** — Each top-level nav group visible in the rail (icon buttons on the dark strip)
   - `id`: kebab-case derived from the label (e.g., "overview" → `"overview"`)
   - `label`: exact text from Figma
   - `icon`: mapped to an available export (see Icon Mapping below)
2. **Items per section** — The panel items that appear when a section is selected
   - `id`: kebab-case derived from the label
   - `label`: exact text from Figma
   - `icon`: optional, only if the item has a leading icon in the design
3. **Children** — Any nested sub-items under panel items (multi-level tree)
4. **Footer sections** — Sections pinned to the bottom of the rail (commonly Settings, Profile)
5. **Visual properties:**
   - Rail width (expected ~56px), panel width (expected ~300px)
   - Rail background color (hex)
   - Selected state: background + text color
   - Default state: text color + opacity
   - Hover state: background color
   - Typography: font family, size, weight for section labels and panel item labels
   - Icon size in the rail
   - Any badges (count indicators), dividers, or decorative elements
6. **Logo** — Is there a logo/product mark at the top of the rail? Describe it.

### Icon Mapping

Map each Figma icon to the closest export from `src/icons/index.ts`. Available icons:

**Navigation/Structure:** `IconApps`, `IconGrid`, `IconSettings`, `IconFilter`, `IconSearch`, `IconEllipsis`, `IconContentView`
**Data/Analytics:** `IconTrendUp`, `IconTrendDown`, `IconGauge`, `IconDataHistogram`, `IconDataUsageSparkle`
**People:** `IconPerson`, `IconPeople`, `IconPeopleCommunity`, `IconPeopleCheckmark`, `IconPeopleAdd`, `IconPersonHeart`
**Documents:** `IconDocumentFolder`, `IconDocumentMultiple`, `IconFormMultiple`, `IconSlideTextMultiple`, `IconFolderMultiple`
**Commerce:** `IconMoney`, `IconReceiptMoney`, `IconMoneyHand`, `IconMoneyCalculator`, `IconSavings`, `IconReceiptSearch`
**Communication:** `IconBell`, `IconMegaphone`, `IconMailTemplate`
**Status/Misc:** `IconSparkle`, `IconFlag`, `IconRibbon`, `IconGift`, `IconHatGraduation`, `IconMedal`, `IconShieldCheckmark`, `IconHeart`
**Calendar:** `IconCalendar`, `IconCalendarClock`, `IconCalendarMonth`, `IconReschedule`
**Actions:** `IconEdit`, `IconLink`, `IconDelete`, `IconArchive`, `IconArrowExport`, `IconBoxArrowLeft`
**UI:** `IconChevronDown`, `IconChevronLeft`, `IconChevronRight`, `IconChevronDoubleLeft`, `IconPanelLeftContract`
**Other:** `IconEngine`, `IconCubeTree`, `IconGlobeLocation`, `IconVideo`, `IconVideoSettings`, `IconLogo`

If no exact match exists, pick the closest semantic match and add a `"note"` field explaining the mapping choice. If nothing is close, use `"IconApps"` as a placeholder and flag it with `"unmapped": true`.

### Output Format

Write a single JSON object. Do NOT wrap in a markdown code fence inside the Output section — write raw JSON so it can be consumed programmatically.

```json
{
  "figmaNodeUsed": "289-4585",
  "sections": [
    {
      "id": "section-id",
      "label": "Section Label",
      "icon": "IconName",
      "note": "optional — only if icon mapping is approximate",
      "items": [
        {
          "id": "item-id",
          "label": "Item Label",
          "icon": "IconName or null",
          "children": []
        }
      ]
    }
  ],
  "footerSections": [
    {
      "id": "settings",
      "label": "Settings",
      "icon": "IconSettings",
      "items": []
    }
  ],
  "logo": {
    "description": "What the logo looks like",
    "hasLogoInDesign": true
  },
  "visual": {
    "railWidth": 56,
    "panelWidth": 300,
    "railBg": "#hex",
    "selectedBg": "#hex",
    "selectedText": "#hex",
    "defaultText": "#hex",
    "defaultTextOpacity": 0.7,
    "hoverBg": "#hex",
    "typography": {
      "sectionLabel": { "font": "", "size": 0, "weight": 0 },
      "itemLabel": { "font": "", "size": 0, "weight": 0 }
    },
    "iconSize": 20,
    "badges": [],
    "dividers": []
  },
  "unmappedIcons": []
}
```

### Context for Design-System Agent

- **Consumer:** PLG-dashboard uses `RailNav` from `@miguel/design-system/gallery`
- **RailNav props:** `sections`, `footerSections`, `activeSection`, `activeItem`, `onNavigate`, `logo`
- **RailSection:** `{ id, label, icon: React.ComponentType, items: RailPanelItem[] }`
- **RailPanelItem:** `{ id, label, icon?: React.ComponentType, children?: RailPanelChild[] }`
- The JSON spec will be transformed into TypeScript by the PLG-dashboard agent (not by you)
- Focus on **accuracy of extraction**, not implementation

### Instructions

1. Read this entire task document first
2. Use Figma MCP to read the node specified in Figma Reference
3. If the node is a complex frame, inspect child nodes to find individual sections/items
4. Extract all navigation sections, items, visual properties, and logo info
5. Map every icon to the available exports listed above
6. Write the JSON output in the **Output** section below
7. Change the Status line at the top of this file from `PENDING` to `REVIEW`
8. Do NOT modify anything above the Output section except the Status line

### If Something Goes Wrong

- **Figma MCP not responding:** Set status to `BLOCKED`, write the error in Output, leave for human to resolve
- **Node not found:** Try the fallback search (see Figma Reference). If nothing found, set status to `BLOCKED`
- **Ambiguous design:** Extract your best interpretation, add `"ambiguous": true` and a `"note"` to any uncertain fields
- **Missing icons in design:** Use `null` for the icon field, note which items had no visible icon

---

## Output

<!-- Design-system agent writes results here. Raw JSON, no markdown fences. -->

{
  "figmaNodeUsed": "289:4585",
  "sections": [
    {
      "id": "key-metrics",
      "label": "Key Metrics",
      "icon": "IconSlideTextMultiple",
      "note": "Figma uses 'Slide Text Multiple' icon in both the rail button (state=active) and the panel header. The panel title text reads 'Key Metrics'.",
      "items": [
        {
          "id": "product-led-growth",
          "label": "Product-Led Growth",
          "icon": "IconTrendUp",
          "note": "Figma uses 'Arrow Trending Checkmark' (Filled). No exact export exists. IconTrendUp is the closest semantic match (growth/trending). The PLG-dashboard agent should add IconArrowTrendingCheckmark to the design system if pixel-perfect match is needed.",
          "unmapped": true,
          "badge": "New",
          "children": [
            {
              "id": "scorecards",
              "label": "Scorecards",
              "icon": "IconApps",
              "note": "Figma uses 'Card UI Info' (Regular). No exact export exists. IconApps is a placeholder. The PLG-dashboard agent should add IconCardUiInfo to the design system for pixel-perfect match.",
              "unmapped": true,
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": "data",
      "label": "Data",
      "icon": "IconDataHistogram",
      "note": "Figma uses 'Data Histogram' (Regular) for the rail button in state=rest. No panel items are visible in this assembled frame — the panel only shows the active section (Key Metrics). The PLG-dashboard agent will need to define items for this section based on its own requirements.",
      "items": []
    }
  ],
  "footerSections": [
    {
      "id": "settings",
      "label": "Settings",
      "icon": "IconSettings",
      "items": []
    }
  ],
  "logo": {
    "description": "Custom SVG mark, 26.06×24px, white fill on dark rail background (#1C2024). Rendered inside a 38×38px LogoSlot (state=rest, interactive=false). The mark is a geometric shape group (Group 34683203) — not a standard Fluent icon. Uses the design system's existing IconLogo component.",
    "hasLogoInDesign": true
  },
  "visual": {
    "railWidth": 54,
    "railWidthNote": "Computed: 8px padding + 38px button + 8px padding = 54px. Figma layout_NIOGPA has padding:8px wrapping a 38px-wide column.",
    "panelWidth": 300,
    "panelHeight": 730,
    "railBg": "#1C2024",
    "panelBg": "#FFFFFF",
    "gap": 8,
    "gapNote": "layout_QOM05M gap:8px between rail and sidebar panel",
    "selectedBg": "rgba(255, 255, 255, 0.2)",
    "selectedText": "#FFFFFF",
    "defaultText": "rgba(255, 255, 255, 0.5)",
    "defaultTextOpacity": 0.5,
    "hoverBg": "See design system tokens — not explicitly shown in this static frame",
    "panelItemActiveText": "#1C2024",
    "panelItemActiveFont": "Inter 13px/500 (TYPE.labelM)",
    "panelItemRestText": "#60646C",
    "panelItemRestFont": "Inter 13px/400 (TYPE.bodyS)",
    "panelHeaderTitle": "Inter 16px/500 (TYPE.headingS)",
    "panelHeaderTitleColor": "#1C2024",
    "badgeFont": "Inter 12px/400 (TYPE.caption)",
    "badgeColor": "#B9BBC6",
    "typography": {
      "sectionLabel": { "font": "Inter", "size": 13, "weight": 500 },
      "itemLabel": { "font": "Inter", "size": 13, "weight": 400 },
      "panelTitle": { "font": "Inter", "size": 16, "weight": 500 },
      "badge": { "font": "Inter", "size": 12, "weight": 400 }
    },
    "iconSize": 20,
    "railButtonSize": 38,
    "railButtonRadius": 8,
    "panelRadius": 12,
    "panelElevation": "0px 2px 8px 0px rgba(28, 32, 36, 0.1)",
    "navRowPadding": "4px 8px",
    "navRowGap": 2,
    "navRowRadius": 8,
    "navIndentLineWidth": 18,
    "navIndentLineColor": "#D9D9E0",
    "navIndentLineWeight": 0.5,
    "dividerColor": "#D9D9E0",
    "dividerHeight": 0.5,
    "scrollbarWidth": 4,
    "badges": [
      {
        "text": "New",
        "location": "Product-Led Growth row (depth 0)",
        "color": "#B9BBC6",
        "font": "Inter 12px/400"
      }
    ],
    "dividers": [
      {
        "location": "Between PanelHeader and PanelSearchBar",
        "color": "#D9D9E0",
        "height": 0.5
      },
      {
        "location": "Between PanelSearchBar and NavPanelShell",
        "color": "#D9D9E0",
        "height": 0.5
      }
    ]
  },
  "panelStructure": {
    "note": "SidebarPanel follows the three-section model: PanelHeader (8px padding) → Divider → PanelSearchBar (4px 8px padding) → Divider → NavPanelShell (8px padding). No outer container padding. Each section owns its own padding.",
    "sections": [
      { "name": "PanelHeader", "padding": "8px", "contains": "Icon + Title 'Key Metrics' + EllipsisButton + ExpandButton (collapse)" },
      { "name": "Divider", "height": "0.5px", "color": "#D9D9E0" },
      { "name": "PanelSearchBar", "padding": "4px 8px", "contains": "SearchBar (state=empty)" },
      { "name": "Divider", "height": "0.5px", "color": "#D9D9E0" },
      { "name": "NavPanelShell", "padding": "8px", "contains": "NavPanel (gap:2px) + Scrollbar (4px wide)" }
    ]
  },
  "unmappedIcons": [
    {
      "figmaName": "Arrow Trending Checkmark",
      "usedOn": "Product-Led Growth item icon",
      "componentSetId": "290:4860",
      "mappedTo": "IconTrendUp",
      "reason": "Closest semantic match (growth/trending). Missing the checkmark element. Add IconArrowTrendingCheckmark to design system for exact match."
    },
    {
      "figmaName": "Card UI Info",
      "usedOn": "Scorecards item icon",
      "componentSetId": "290:4870",
      "mappedTo": "IconApps",
      "reason": "Placeholder only. Card UI Info represents a card/modal with info — no close semantic match in current exports. Add IconCardUiInfo to design system for exact match."
    }
  ]
}

---

## Revision History

<!-- Populated when status is REVISION. Each round appended with date + feedback. -->

_No revisions yet._
