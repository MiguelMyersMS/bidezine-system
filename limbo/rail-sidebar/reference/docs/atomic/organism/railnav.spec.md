# `RailNav` — Figma Spec

```yaml
# ============================================================
#  FRONT-BLOCK  (machine-checkable — audit-specs.js validates)
# ============================================================

# --- IDENTITY -------------------------------------------------
element: "RailNav"
atomicLevel: organism
status: verified           # VERIFY @ 2026-06-15: vision pass — story gallery-railnav--figma-spec rendered @730px vs Figma 166:4494, element-by-element match (logo · 12 sections + More overflow · Slide active · Person-disabled/Settings footer)
specVersion: 1
lastVerifiedCycle: null

# --- FIGMA SOURCE  (read SETS, not instances) -----------------
# OD-2 (owner-confirmed 2026-07-12): the RailNav frame was MOVED. Old node 166:4494 is gone. Re-bound to
# the current frame 783:4714 (the "RailNav" scene). It lives inside the ORGANISMS GROUP node 783:4537
# (owner-provided 2026-07-12 — this is where ALL organisms now live; use it to reconcile the other stale
# organism specs: pageheadertitle, selectdropdown, sidebarpanel, actionmenu, overflowmenu). Current
# sub-node map inside 783:4714 (fetched 2026-07-12): rail 783:4716 · SidebarPanel 783:4757 · OverflowMenu
# 783:4791 · ActionMenu 783:4802. NOTE: the child nodeMap ids below (LogoSlot 166:4495, RailButton
# 166:44xx, …) are STALE — re-map against 783:4714 + the sub-nodes above when railnav is
# next re-verified. Re-verification is PENDING against the new node.
figma:
  fileKey: "EyYETHXMDDURPGK4PXTU5C"
  fileName: "Single shape"
  workspace:
    id: "783:4714"
    name: "RailNav"
  thisNode: "783:4714"
  nodeMap:
    - role: element
      name: "RailNav"
      nodeId: "166:4494"
      path: "RailNav"
      spec: railnav.spec.md
    - role: subcomponent
      name: "LogoSlot (state=rest, interactive=false)"
      nodeId: "166:4495"
      path: "RailNav > LogoSlot"
      spec: ../atom/logoslot.spec.md
    - role: subcomponent
      name: "RailNav (section buttons column)"
      nodeId: "166:4465"
      path: "RailNav > RailNav"
      spec: railnav.spec.md
    - role: subcomponent
      name: "RailButton (Document Folder, state=rest)"
      nodeId: "166:4457"
      path: "RailNav > RailNav > RailButton[0]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "RailButton (Slide Text Multiple, state=active)"
      nodeId: "166:4461"
      path: "RailNav > RailNav > RailButton[1]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "RailButton (Data Histogram, state=rest)"
      nodeId: "166:4466"
      path: "RailNav > RailNav > RailButton[2]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "RailButton (Food Grains, state=rest)"
      nodeId: "166:4470"
      path: "RailNav > RailNav > RailButton[3]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "RailButton (More Horizontal, state=rest)"
      nodeId: "168:3112"
      path: "RailNav > RailNav > RailButton[4]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "FooterSlot"
      nodeId: "166:4474"
      path: "RailNav > FooterSlot"
      spec: railnav.spec.md
    - role: subcomponent
      name: "RailButton (Person, state=disabled)"
      nodeId: "166:4475"
      path: "RailNav > FooterSlot > RailButton[0]"
      spec: ../atom/railbutton.spec.md
    - role: subcomponent
      name: "RailButton (Settings, state=rest)"
      nodeId: "166:4476"
      path: "RailNav > FooterSlot > RailButton[1]"
      spec: ../atom/railbutton.spec.md
  assembledNode: "783:4714"   # OD-2 re-bind 2026-07-11 (was 166:4494 — moved)
  kind: frame   # assembled composition — has no variant SET (audit exempts componentSetIds)
  componentSetIds: []   # RailNav is a static FRAME (assembled), not a component set
  readDepth: 3

# --- VARIANT PROPERTIES ---------------------------------------
# RailNav has NO variant states — it is a static assembled FRAME.
# Interactive state (active section, hover, browsing) is driven at runtime
# via props and sub-component state (RailButton atoms handle their own visual state).

# --- LAYER ANATOMY --------------------------------------------
#
# RailNav (FRAME, column, gap: 16px, padding: 8px, sizing: hug×fixed, height: 730px)
# │   background: tokens.darkSurface (#1C2024), borderRadius: 12px (RADIUS.rounded)
# │
# ├── LogoSlot (INSTANCE, 38×38px, state=rest interactive=false)
# │   └── Group 34683203 (logo SVG, 26.06×24px)
# │
# ├── RailNav (FRAME — section buttons column, column, gap: 4px, sizing: 38px×fill)
# │   ├── RailButton (Document Folder,     state=rest,     38×38px, sizing: fill×fixed)
# │   ├── RailButton (Slide Text Multiple, state=active,   38×38px, bg=darkActiveBg)
# │   ├── RailButton (Data Histogram,      state=rest,     38×38px)
# │   ├── RailButton (Food Grains,         state=rest,     38×38px)
# │   └── RailButton (More Horizontal,     state=rest,     38×38px)  ← overflow
# │
# └── FooterSlot (FRAME, column, gap: 4px, sizing: 38px×hug)
#     ├── RailButton (Person,   state=disabled, 38×38px)
#     └── RailButton (Settings, state=rest,     38×38px)  ← bottom-most footer slot

# --- CONTAINER CONTRACT  (tokens only, no raw hex) ------------
container:
  width: "hug"            # sizing: hug — wraps the 38px button column
  computedWidth: 54        # 8px (padL) + 38px (button) + 8px (padR) = 54px — LAYOUT.railW
  height: 730              # px — fixed in Figma demo; fills viewport in code
  padding: "8px"           # SPACE[2] uniform
  gap: "16px"              # SPACE[4] between LogoSlot / section column / FooterSlot
  borderRadius: 12         # RADIUS.rounded — NOTE: prior code used RADIUS.container=18 (known discrepancy)
  background: "tokens.darkSurface"  # #1C2024
  boxShadow: "none"
  border: "none"
  overflow: "hidden"

# Section buttons column (inner RailNav FRAME):
#   mode: column, gap: 4px (SPACE[1]), sizing: 38px×fill
#   width: 38px (= LAYOUT.railButton, not hitTarget)

# FooterSlot FRAME:
#   mode: column, gap: 4px (SPACE[1]), sizing: 38px×hug
#   population order: top-to-bottom (same as primary rail column)
#   special rule: Settings is always anchored to the final/bottom-most footer slot
#   max visible icons: 3 total in the bottom zone

# RailButton instances inside rail:
#   sizing: fill×fixed, height: 38px = LAYOUT.railButton
#   alignSelf: stretch — stretches to full 38px column width

# --- DEMO ICONS (section buttons in this assembled example) ---
# These are the specific icons used in the Figma demo assembly.
# In production, icons are driven by the consumer's section data.
# Figma assembly: Document Folder (rest), Slide Text Multiple (active),
#                 Data Histogram (rest), Food Grains (rest), More Horizontal (rest/overflow)
# Footer: Person (disabled), Settings (rest)
# Storybook overflow validation fixture contract:
# - Primary rail sections count must be explicitly verified in story data.
# - Expected fixture count: 16 primary sections.
# - Expected final section id: emailing.
# - Figma ellipsis in assembled frames is a visual overflow placeholder, not a regular section icon.

# --- STATE MATRIX ---------------------------------------------
# Static organism — no interactive states at this level.
# Individual RailButton states are documented in atom/railbutton.spec.md.
states:
  - name: "assembled"
    background: "tokens.darkSurface"
    border: "none"
    label: null
    badge: null
    icon: null
    icon_fill: null
    font: null
    notes: "Static assembled frame. Section button states (rest/active/hover/etc) are runtime-driven."

# --- TOKEN MAP  (every non-state visual value -> token) -------
tokenMap:
  background: "tokens.darkSurface"          # #1C2024
  borderRadius: "RADIUS.rounded"            # 12px — Figma source of truth
  padding: "SPACE[2]"                        # 8px uniform
  outerGap: "SPACE[4]"                       # 16px — gap between logo / sections / footer
  innerColumnGap: "SPACE[1]"                 # 4px — gap between RailButtons
  railButtonSize: "LAYOUT.railButton"        # 38px (width and height of each button)
  railColumnWidth: 38                         # px — fixed (= LAYOUT.railButton)
  logoSlotSize: 38                            # px — 38×38 (= LAYOUT.railButton)
  # Known discrepancy: prior code used RADIUS.container (18px). Figma spec is 12px = RADIUS.rounded.
  # Per GR4, Figma is authoritative. Code should use RADIUS.rounded.

# --- KNOWN FIGMA DISCREPANCY (updated) -----------------------
# Rail borderRadius: Figma=12px (RADIUS.rounded). Prior code=RADIUS.container (18px).
# Per GR4, Figma is authoritative → code must use RADIUS.rounded.
# Tracked in railnav.spec.md Known Figma Discrepancies table.

# --- ICONS  (as used in this assembly) -----------------------
icons:
  - export: "IconDocumentFolder"
    figmaName: "Document Folder"
    setId: "168:3142"
    size: 20
    depthVerified: true
  - export: "IconSlideTextMultiple"
    figmaName: "Slide Text Multiple"
    setId: "169:3116"
    size: 20
    depthVerified: true
  - export: "IconDataHistogram"
    figmaName: "Data Histogram"
    setId: "168:3204"
    size: 20
    depthVerified: true
  - export: "IconFoodGrains"
    figmaName: "Food Grains"
    setId: "168:3222"
    size: 20
    depthVerified: true
  - export: "IconMoreHorizontal"
    figmaName: "More Horizontal"
    setId: "168:3116"
    size: 20
    depthVerified: true
  - export: "IconPerson"
    figmaName: "Person"
    setId: "171:3118"
    size: 20
    depthVerified: true
  - export: "IconSettings"
    figmaName: "Settings"
    setId: "171:3150"
    size: 20
    depthVerified: true

# --- ACCESSIBILITY -------------------------------------------
a11y:
  roles: ["navigation"]
  keyboard: ["ArrowUp", "ArrowDown", "Enter", "Space"]
  focusVisible: true
  minTargetPx: 38      # LAYOUT.railButton 38×38 — meets/exceeds WCAG 2.5.8 (≥24×24)
  contrastTextOk: true     # contract: rail is icon-only (RailButton); icon glyphs on tokens.darkSurface (#1C2024) treated as non-text
  contrastNonTextOk: true  # contract: RailButton icons + active darkActiveBg state on darkSurface — non-text ≥3:1
  ariaNotes: "rail = nav landmark; each RailButton is a labelled control (tooltip/aria-label per section); active section reflected via aria-current; overflow opens OverflowMenu via portal (GR3)"

# --- PROTOCOL: OVERFLOW MENU PORTAL PATTERN (Golden Rule #3) -
# The overflow ("More Horizontal") menu MUST use ReactDOM.createPortal() with position:fixed,
# NOT position:absolute inside the rail container, because the nav wrapper uses overflow:clip
# to prevent scroll-induced layout jank. overflow:clip clips absolutely-positioned children,
# so the menu would render but be immediately hidden.
#
# **Implementation checklist (MANDATORY):**
# 1. Measure trigger button viewport position: `anchorRect = triggerBtn.getBoundingClientRect()`
# 2. Open menu state: `setAnchorRect(rect); setOverflowOpen(true)`
# 3. Render via portal: `ReactDOM.createPortal(<Menu anchorRect={rect} />, document.body)`
# 4. Position with fixed: `position: fixed; left: anchorRect.right + gap; top: anchorRect.top`
# 5. Flip DOWN (not up) if insufficient space above trigger
# 6. Outside-click handler inside portal, not in rail: both trigger + portal must check containment
# 7. Escape key inside menu calls onClose() to clean up portal and restore focus to trigger
#
# **What NOT to do (common mistakes that caused prior bugs):**
# - ✗ Use position:absolute with overflow:clip parent — menu gets clipped/hidden
# - ✗ Render portal inside the scroll container — defeats the purpose of portal
# - ✗ Outside-click handler only checks trigger, not portal children — menu closes on intent
# - ✗ No flip logic — menu extends off-screen on small viewports or when trigger near top
#
# **Reference implementations (code examples):**
# - src/gallery/RailNav.tsx:OverflowMenu (post-cycle-128 portal refactor)
# - src/gallery/RailNav.tsx:PanelHeaderMenuButton (identical portal + fixed pattern)
#
# **See also:** AGENTS.md § Golden Rule #3 (full protocol)

# --- VERIFY --------------------------------------------------
verify:
  storyId: "organisms-railnav--figma-spec"   # re-bind 2026-07-15 (was gallery-→organisms- when organisms moved)
  # SCOPE (2026-07-21): the figma-spec story renders the COLLAPSED RAIL only, so the seal
  # binds the RAIL sub-node 783:4716 (matches the story) — NOT the full composite 783:4714
  # (rail + 2 SidebarPanels + overflow ActionMenu). The full assembly's panels/menus are
  # verified compositionally via their own specs (SidebarPanel 783:4757 / OverflowMenu
  # 783:4791 / ActionMenu 783:4802). See EX-RAILNAV-SCOPE.
  figmaExportNode: "783:4716"   # rail sub-node inside 783:4714 (re-bound 2026-07-21; matches the collapsed-rail story)
  figmaRef: tests/visual/figma-ref/railnav-783-4716.png   # ground-truth export of the collapsed rail 783:4716 (2026-07-21)
  snapshotBaseline: "docs/audits/railnav-density-flat-light.png"
  statesToCapture:
    - "assembled-default"
  lastVision: { cycle: "2026-06-15", verdict: pass }   # REAL: rendered gallery-railnav--figma-spec vs Figma 166:4494 (rail @730px); logo, 12 sections + More overflow, Slide Text Multiple active, Person-disabled→Settings footer all match. Overflow discrepancy (height) found + fixed during this check.
  lastPixelDiff: { cycle: null, verdict: pending }     # vision-verified by eye; no automated pixel-diff baseline run yet (honest — not gated for `verified`)

# --- COMPLETENESS CHECKLIST ----------------------------------
checklist:
  - id: node-path-verified
    pass: true    # canonical node 166:4494 verified 2026-06-10
  - id: read-set-not-instance
    pass: true    # FRAME not a component set — correct
  - id: states-match-variant-count
    pass: true    # no variants — static assembled
  - id: icons-depth6-verified
    pass: true    # all 7 section/footer icons verified
  - id: all-colors-tokenized
    pass: true    # darkSurface + darkActiveBg (active button bg) all mapped
  - id: state-matrix-all-slots
    pass: true    # static organism
  - id: radii-tokenized
    pass: true    # 12px → RADIUS.rounded (corrects prior code drift to RADIUS.container=18)
  - id: sizes-not-inflated
    pass: true    # 38px buttons = LAYOUT.railButton verbatim (GR4)
  - id: layout-token-organism-verify
    pass: true    # gap: 16px (SPACE[4]) and 4px (SPACE[1]) verified from organism node
  - id: organism-integration
    pass: false   # story must wire active section → SidebarPanel open/close
  - id: organism-not-spec-for-verification
    pass: true    # values verified from Figma, not prior draft spec
  - id: rail-overflow-lineup-verified
    pass: true    # Storybook fixture validates 16 primary sections with emailing as final; ellipsis treated as overflow trigger
  - id: slots-reserved
    pass: true    # LogoSlot (38×38) + FooterSlot are always-reserved structural slots; FooterSlot is protected space (max 3 icons, never consumed by overflow)
  - id: dividers-placement
    pass: true    # n/a — RailNav rail has no dividers (gap-only vertical rhythm)
  - id: story-covers-all-states
    pass: true    # the single assembled state is rendered by RailNav.stories Default (full rail with logo/sections/footer); per-button states live in railbutton.spec.md
```

---

## Container Contract

`RailNav` is a **hug-width × fill-height** dark column. Three layers stacked vertically with `gap: SPACE[4]` (16px):

1. **LogoSlot** — 38×38px (matches `LAYOUT.railButton`)
2. **RailNav inner column** — `gap: SPACE[1]` (4px) between buttons, `sizing: 38px × fill` (takes all remaining space)
3. **FooterSlot** — `gap: SPACE[1]` (4px), `sizing: 38px × hug`

`padding: SPACE[2]` (8px) on all sides. `background: tokens.darkSurface`. `borderRadius: RADIUS.rounded` (12px).

## Gap Contract (Figma 166:4494 — Code Location Mapping)

**Statement:** RailNav has THREE distinct vertical gaps, each with a different purpose and SPACE constant. Code MUST use the correct constant for each gap.

| Gap | Location in structure | Figma value | Code constant | Code location | Purpose |
|-----|-----------|-------------|---------------|--------|---------|
| **Outer gap** | Between LogoSlot / NavColumn / FooterSlot (main container) | 16 px | `SPACE[4]` | `src/gallery/RailNav.tsx:428` | Vertical rhythm between major sections |
| **Inner nav gap** | Between RailButton items within NavColumn | 4 px | `SPACE[1]` | NavColumn flex definition | Compact icon-button spacing |
| **Footer gap** | Between utility/section button items in FooterSlot | 4 px | `SPACE[1]` | FooterSlot flex definition | Compact icon-button spacing |

**Critical distinction:** The outer gap (16px between logo/nav/footer) is visually distinct from the inner gaps (4px). Confusing them breaks the rail's visual hierarchy.

**Example code (RailNav.tsx line 428):**
```typescript
gap: SPACE[4],  // 16px — outer gap between logo/nav/footer per Gap Contract
```

**Audit rule:** `CP.RAIL-GAP-DRIFT` (Medium) — any RailNav with outer gap ≠ SPACE[4], or unclear comments about which gap is which, is a finding.

## ⚠️ Border radius discrepancy resolved

**Prior code used `RADIUS.container` (18px). Figma specifies 12px = `RADIUS.rounded`.** Per GR4, Figma is authoritative → code must be updated to `RADIUS.rounded`. This was in the old `railnav.spec.md` discrepancy table as "fix Figma to 18px" — that direction was wrong. The discrepancy table is now corrected.

## Figma demo assembly — section icons

| Slot | Icon | State |
|---|---|---|
| Section 0 | Document Folder | `rest` |
| Section 1 | Slide Text Multiple | **`active`** (bg: `darkActiveBg`) |
| Section 2 | Data Histogram | `rest` |
| Section 3 | Food Grains | `rest` |
| Overflow | More Horizontal | `rest` |
| Footer 0 | Person | **`disabled`** |
| Footer 1 | Settings | `rest` |

## Structural learnings (Figma → code)

- **`gap: 16px` (SPACE[4]) between logo / sections / footer** — this is the outer gap. **`gap: 4px` (SPACE[1]) between individual RailButtons** — the inner gap. Do not conflate them.
- **RailButton `sizing: fill × fixed`** inside the column — the button stretches to the column's 38px width via `alignSelf: stretch`. The height is fixed at 38px (`LAYOUT.railButton`).
- **`More Horizontal` is the 5th section button** in this demo — it's a regular `RailButton` in `state=rest`, not a special overflow button. The overflow pattern is consumer-driven.
- **`Person` footer button is `state=disabled`** — consumers use this slot for the authenticated user profile.
- **Footer navigation parity is mandatory** — any footer item that should behave like navigation (for example, `Settings`) MUST be rendered as a RailButton-backed section (`footerSections` in `RailNav.tsx`), not as an arbitrary utility node. This guarantees tooltip, active/browsing visuals, and panel-open behavior match primary sections.
- **SidebarPanel default width is 300px** — the built-in `RailNav` panel now opens at `LAYOUT.panelW = 300` and can be resized via the panel-edge resize handle. The resized width persists for the current app session across panel close/reopen and section changes, resets to 300px on a fresh app load, and may not be reduced below 240px.
- **A section with no `items` is a DIRECT nav button (leaf), not a panel toggle** — when a rail section has an empty `items` array it has no sub-panel to peek; clicking its rail button commits navigation via `onNavigate(sectionId, sectionId)` and shows active/`aria-current` when selected, instead of being a dead, unselectable button. Sections WITH items keep the peek-before-commit panel behavior. (Behavior contract B15; finding R1.OWN1.)
- **FooterSlot is protected space** — the bottom zone may show at most 3 icons total and must never be consumed by top-section overflow. When rail height becomes constrained, only the top navigation zone collapses into the `More` button / RailMenu path; footer navigation and utility icons remain visible.
- **`borderRadius: 12px`** — matches `RADIUS.rounded` not `RADIUS.container` (18). The rail is a navigation column, not a card/panel container.

## FooterSlot behavior contract

Use FooterSlot in two distinct modes:

1. **Footer navigation sections** (`footerSections`): behaves exactly like top rail sections.
  - Shows rail tooltip on hover/focus
  - Opens/closes sidebar panel on click
  - Participates in `activeSection` / browsing state visuals
  - Ordered top-to-bottom, matching the main rail column
  - If a Settings section exists, it is anchored to the physical bottom-most slot
  - Shares the bottom-zone 3-icon maximum with utility actions
2. **Utility actions** (`utilityItems` / `footer`): arbitrary actions (theme toggle, profile actions, etc.) that do not use rail navigation behavior unless implemented by the consumer.
   - **Shape: both are a `React.ReactNode` slot, NOT an array of item descriptors** — despite the plural name, passing `[{ id, label, icon, onClick }]` throws *"Objects are not valid as a React child"*. Pass an element (or a fragment of elements). (Finding CD1.2 / CD0.6, Claude Design.)
   - **Compose it from the exported rail atom:** `RailButtonDark` (dark rail button, with tooltip/rest/hover/disabled states) is exported from the package root and the `window.DS` bundle — use it so a utility control matches the shipped rail buttons, e.g. `utilityItems={<RailButtonDark section={{ id:"profile", label:"Profile", icon: IconPerson }} disabled />}`. Before finding CD1.2 this atom was not on the root barrel, so consumers had to hand-roll a lookalike `<button>`; that is no longer necessary.

When a footer item is intended to navigate/open panel, it MUST be implemented through `footerSections`.
When Settings exists in FooterSlot, it MUST occupy the final bottom slot even if other footer items are added later.
When the rail is too short to show all top-section buttons, only the top-section area overflows into `More`; FooterSlot remains visible and never overlaps with the primary rail area.

## Sub-component specs

| Sub-component | Spec | Role |
|---|---|---|
| `LogoSlot` | `atom/logoslot.spec.md` | Brand logo at top |
| `RailButton` | `atom/railbutton.spec.md` | Each section/footer button |
| `SidebarPanel` | `organism/sidebarpanel.spec.md` | Opens alongside rail when active |

## Exception Registry

| ID | Type | Figma source | Why | Preserve |
|---|---|---|---|---|
| `EX-RAILNAV-SCOPE` | seal-scope decision (2026-07-21) | Full composite `783:4714` = rail + 2 SidebarPanels + overflow ActionMenu; the `organisms-railnav--figma-spec` story renders the **collapsed rail only** | The owner moved the organisms in Figma and the figma-spec story depicts only the collapsed rail. Rather than rebuild the story to assemble the full 2-panel scene (which would also embed the un-capturable portal `ActionMenu`), the seal binds the **rail sub-node `783:4716`** — the exact thing the story renders. | `verify.figmaExportNode` = `783:4716` (rail). The full assembly's panels/menus are verified compositionally via their own specs: `SidebarPanel` `783:4757` · `OverflowMenu` `783:4791` · `ActionMenu` `783:4802`. Do NOT re-point the seal at the full `783:4714` unless the story is rebuilt to render the assembled scene. |

## Files

| File | Role |
|---|---|
| `src/gallery/RailNav.tsx` | Full RailNav implementation |
| Token source: `src/tokens.ts` | `darkSurface`, `darkActiveBg` |
| Constant source: `src/layout.ts` | `LAYOUT.railW=54`, `LAYOUT.railButton=38`, `RADIUS.rounded=12`, `SPACE[1]=4`, `SPACE[2]=8`, `SPACE[4]=16` |
