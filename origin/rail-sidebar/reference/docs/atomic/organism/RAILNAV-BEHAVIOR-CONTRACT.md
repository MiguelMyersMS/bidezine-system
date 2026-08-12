# RailNav + SidebarPanel — BEHAVIOR CONTRACT

**Status: the protected regression gate for Primitives-First Phase 2 (see `docs/process/PRIMITIVES-FIRST-METHOD.md` §4a + §10).**
**Owner: Miguel Myers. Created 2026-07-12. Source of truth: `src/gallery/RailNav.tsx` @ branch `chore/molecule-foundation`.**

This document enumerates **every bespoke behavior** that `RailNav` and its internal `SidebarPanel`
implement, each as a checkable assertion grounded in the actual code (file + line/function). Figma
holds layout + visual states; it cannot hold this behavioral/domain logic — which is exactly the value
invented by the owner that exists nowhere else.

**Rule (§4a):** before any borrow/refactor (e.g. swapping the hand-rolled overflow menu for Radix
DropdownMenu, the search box for cmdk, the disclosure for Radix Collapsible), a borrow may replace only
the **dumb engine** beneath a behavior — never the behavior itself. **Every assertion below must still
hold, verbatim, after the swap**, re-verified in Storybook contract stories AND in the PLG production
view. If a borrowed engine cannot preserve an assertion, WE KEEP OURS.

Legend for each assertion's verification status:
- **[STORY]** — implemented AND covered by an automated `--*-contract` play story (regression-gated in `npm run health`).
- **[CODE]** — implemented, cited in code, but NO automated test (must be re-confirmed manually in Storybook + PLG after a borrow).
- **[VISUAL]** — implemented; only covered by a static render story (no interaction assertion).

Unless noted, all line numbers are `src/gallery/RailNav.tsx`.

---

## A. Rail overflow policy (OWNER-CRITICAL)

The rail is a full-height dark icon column. Its top navigation zone is height-budgeted; when it runs
out of vertical room the *lowest-priority top icons* collapse into a three-dot "More" overflow menu,
while the footer zone stays pinned and is never consumed.

**A1. Height-measured overflow trigger. [CODE]**
Given no explicit `maxVisibleRailItems` prop, When the rail surface renders/resizes, Then the number of
top items that fit is computed by measuring the rail's `clientHeight` and subtracting rail padding
(`SPACE[2]*2`), the measured logo height, the measured footer height (capped at `FOOTER_MAX_HEIGHT`),
and the inter-section gaps, then flooring `navBudget / ITEM_SLOT` (`ITEM_SLOT = railButton(38) + SPACE[1](4) = 42`).
*Code:* the `compute()` effect L364–387 (`navBudget` L379, `fits` L380, `ITEM_SLOT` L233); `computedMax` state L273.

**A2. Live recompute on resize (ResizeObserver). [CODE]**
Given the rail is observed by a `ResizeObserver`, When the rail's height changes, Then `computedMax`
recomputes so overflow appears/disappears dynamically. *Code:* `new ResizeObserver(compute); ro.observe(rail)` L383–386.

**A3. Explicit override wins. [CODE]**
Given `maxVisibleRailItems` is passed, Then measurement is skipped and `computedMax` is set to that value verbatim. *Code:* L365–368.

**A4. "More" button appears only when top sections exceed capacity. [VISUAL]**
Given `sections.length > computedMax`, Then `needsOverflow` is true and an `OverflowButton` ("More") is
rendered as the last item of the top nav column. *Code:* `needsOverflow` L425; render `{needsOverflow && …}` L552–583.
*Story:* `--figmaspec` renders the overflow state at a pinned 730px height (12 visible + More).

**A5. The "More" button consumes one top slot. [CODE]**
Given overflow is needed, Then the visible count is `computedMax - 1` (the More button occupies the final available slot), floored at 0. *Code:* `visibleCount = needsOverflow ? Math.max(0, computedMax - 1) : sections.length` L427.

**A6. Burial priority = array order; last items bury first. [CODE]**
Given overflow, Then `visibleSections = sections.slice(0, visibleCount)` stay on the rail and
`overflowSections = sections.slice(visibleCount)` move into the menu — i.e. the earliest sections in the
`sections` array have priority and the trailing sections are buried first. *Code:* L428–429.

**A7. FOOTER IS PINNED AND NEVER OVERFLOWS. [CODE]**
Given any rail height, Then `footerSections` / `utilityItems` / `footer` are rendered in a separate
FooterSlot flex child with `flexShrink: 0`, and ONLY the top `sections` array feeds `needsOverflow` /
`overflowSections`. Footer items are never added to `overflowSections` and never appear in the overflow
menu. *Code:* FooterSlot `flexShrink: 0` L590–597; overflow derives solely from `sections` L425–429; footer rendered L589–611.

**A8. Footer space is reserved BEFORE top items are counted. [CODE]**
Given the budget computation, Then the footer's measured height (capped at `FOOTER_MAX_HEIGHT`) is
subtracted from `navBudget` first, so top overflow triggers while the footer keeps its room (the footer
is never squeezed to make room for top icons). *Code:* `footerH = Math.min(footerSlotRef…offsetHeight, FOOTER_MAX_HEIGHT)` L375; subtracted at L379.

**A9. Footer zone hard-capped at 3 icons via maxHeight. [CODE — see caveat F-note / Owner-not-found #2]**
Given the FooterSlot, Then its height is clamped to `FOOTER_MAX_HEIGHT = railButton*3 + SPACE[1]*2`
(3-icon budget). *Code:* `FOOTER_MAX_ICONS = 3` L234, `FOOTER_MAX_HEIGHT` L235, `maxHeight: FOOTER_MAX_HEIGHT` on FooterSlot L596.
*Caveat:* the cap is enforced only by CSS `maxHeight` clipping — there is NO footer overflow menu; a 4th+ footer icon is visually clipped, not relocated (see Owner-not-found #2).

**A10. Active-in-overflow indicator dot. [CODE]**
Given the currently-active section is one of the buried `overflowSections`, When the overflow menu is
CLOSED, Then the "More" button shows a 6×6 `tokens.onDark` dot at top-right; the dot hides while the
menu is open. *Code:* `activeInOverflow` L430 → `active` prop L555; dot render `active && !open` L1111–1123.

**A11. Overflow menu lists exactly the buried sections, with live state. [CODE]**
Given the overflow menu is open, Then it renders one `OverflowMenuItem` per `overflowSections` entry,
each reflecting `active` (`activeSection === id`) and `browsing` (`openPanel === id && !active`). *Code:* `sections.map` L1277–1291; state derivation L1278–1279.

**A12. Items re-appear on the rail when it grows. [CODE]**
Given the rail grows (A2 recompute raises `computedMax`), Then `visibleCount` rises and
`overflowSections` shrinks, so buried icons return to the rail; when `sections.length <= computedMax`,
`needsOverflow` is false and the "More" button disappears entirely. *Code:* derived every render from `computedMax` L425–429.

**A13. Selecting an overflow item returns focus to the "More" trigger. [CODE]**
Given the overflow menu is open, When a menu item is activated (`handleRailClick`), Then the menu closes
and focus is restored to the overflow trigger button. *Code:* `handleRailClick` captures `wasOverflowOpen`, closes menu, and `if (wasOverflowOpen) overflowBtnRef.current?.focus()` L432–438; also on menu `onClose` L575.

---

## B. Panel open/close, reveal transition, elevation, resize

**B1. Peek-before-commit: opening a panel is NOT a navigation. [CODE]**
Given a rail button click, Then `setOpenPanel` toggles which section's panel is visible, WITHOUT calling
`onNavigate`; content change only happens via `handlePanelItemClick → onNavigate`. *Code:* `handleRailClick`/`setOpenPanel` L432–438, L314–324; navigation is separate `handlePanelItemClick` L440–442.

**B2. Rail button toggles its own panel closed. [CODE]**
Given a section's panel is open, When its rail button is clicked again, Then the panel closes
(`prev === sectionId ? null : sectionId`). *Code:* L435.

**B3. Panel reveal is an animated width + margin-left transition. [CODE]**
Given the panel becomes visible, Then the wrapper animates `width: 0 → panelWidth` and
`margin-left: 0 → LAYOUT.panelGap` over `MOTION.medium` with `MOTION.easeOut` (the `panelReveal` preset).
*Code:* wrapper style L762–771.

**B4. Reduced-motion: reveal is instant. [CODE]**
Given `prefers-reduced-motion: reduce`, Then the width/margin transitions resolve to `"none"` (instant), and no transition-clip window is scheduled. *Code:* `transition()` helper L50–52; reduced short-circuit in the transitioning effect L751.

**B5. Elevation shadow must NOT be clipped once the panel is open + settled. [STORY]**
Given the panel is open AND not mid-transition, Then its immediate wrapper is `overflow: visible` so the
panel's `boxShadow: elev.mid` escapes; during the open/close transition (or while closed) the wrapper is
`overflow: hidden` to clip the width animation cleanly. *Code:* `wrapperOverflow` L756; `panelTransitioning` timer L746–755. *Story:* `--elevationcontract` asserts wrapper `overflowX/Y === "visible"` while open.

**B6. Transition-clip window is time-boxed to the animation. [CODE]**
Given a visibility change (non-reduced), Then `panelTransitioning` is true for `MOTION.medium + 80`ms then flips false (revealing the shadow). *Code:* `setTimeout(… , MOTION.medium + 80)` L753.

**B7. Drag-resize clamp: min 240, max viewport-derived. [CODE]**
Given the panel edge resize handle is dragged, Then the new width is clamped to
`[PANEL_MIN_WIDTH(240), viewportMax]` where `viewportMax = max(LAYOUT.panelW, innerWidth - railW - panelGap - SPACE[6])`.
*Code:* mousemove handler L393–399 (`PANEL_MIN_WIDTH = 240` L236).

**B8. Resize handle exists only while the panel is visible; grip darkens while dragging. [CODE]**
Given `isPanelVisible`, Then a `role="separator"` vertical resize handle renders on the panel's right
edge; its grip is `tokens.borderStrong` while `isResizingPanel`, else `tokens.border`. *Code:* handle render `isPanelVisible && (…)` L1028–1058; grip color L1054.

**B9. Resized width persists across close/reopen + section change; resets on fresh load. [CODE]**
Given a resize, Then `panelWidth` state holds for the component's lifetime (survives panel close/reopen
and `openPanel` changes) and is only reset to `LAYOUT.panelW (300)` on remount (fresh app load). *Code:* `panelWidth` state initialised once L275; never reset on close.

**B10. Body cursor/selection are locked during a drag. [CODE]**
Given a resize is in progress, Then `document.body` gets `cursor: ew-resize` + `userSelect: none`, restored on mouseup/cleanup. *Code:* L403–415.

**B11. Panel is suppressible while keeping toggle state (external-panel mode). [CODE]**
Given `suppressBuiltinPanel`, Then `isPanelVisible` is forced false (built-in panel not rendered) but all
open/close state + `onPanelChange` callbacks stay live for a consumer-rendered external panel. *Code:* `isPanelVisible` L459.

**B12. Controlled vs uncontrolled open state. [CODE]**
Given `panelOpen` is provided (controlled), Then `openPanel` reflects `controlledPanelOpen ? internalOpenPanel : null`; When the consumer externally closes it, `internalOpenPanel` resets to null so the next rail click OPENS (not re-toggles-closed). *Code:* `isControlled`/`openPanel` L298–301; external-close reset effect L306–312.

**B13. Built-in panel only shows for a section that has items. [CODE]**
Given `panelSection` resolves and `panelSection.items.length > 0`, Then the panel is visible; a section with an empty `items` array opens **no panel** — and its rail click instead commits navigation directly (see **B15**). *Code:* `isPanelVisible` L488 (`(panelSection.items ?? []).length > 0`).

**B14. Panel-nav scrollbar gutter is conditional. [CODE]**
Given the panel nav list, Then `paddingRight` is `SPACE[2]` only when the nav is actually scrollable (`scrollHeight > clientHeight`), else 0. *Code:* `navScrollable` detection L462–472; `paddingRight: navScrollable ? SPACE[2] : 0` L977.

**B15. Childless section is a DIRECT nav button (leaf nav). [STORY]**
Given a section with no `items` (empty array), When its rail button (or its overflow-menu entry) is clicked,
Then `handleRailClick` commits navigation via `onNavigate(sectionId, sectionId)` and closes any open panel —
it does NOT peek-toggle an empty panel. This makes a leaf section (one that IS the destination, e.g.
"Summary") selectable instead of a dead button; the rail button then shows active/`aria-current` when
`activeSection` matches (G3). *Code:* `handleRailClick` leaf branch L456–462 (`isLeaf` L458). *Story:*
`--railleafnavcontract`. *Finding:* R1.OWN1 (owner, RailNav production-test round).

---

## C. Expand / collapse state machine

**C1. Single lifted Set is the one source of truth at every depth. [STORY]**
Given nested disclosure groups, Then expansion for a group at ANY depth is read from the single
`expandedGroups: Set<string>` (top-level PanelGroup, NestedSubGroup all read `expandedGroups.has(id)`),
so expand-all/collapse-all/seed-once reach nested groups, not just top-level. *Code:* `expandedGroups` state L274; `PanelGroup` `expanded = expandedGroups.has(item.id)` L984; `NestedSubGroup` `expanded = … expandedGroups.has(item.id)` L1995. *Story:* `--nestedexpandallcontract`.

**C2. Seed-once active-path expansion. [STORY]**
Given navigation lands on `activeSection::activeItem`, Then the full chain of groups on the path to the
active item (at any depth) is added to `expandedGroups` EXACTLY ONCE per active item; the same
active item never re-seeds. *Code:* `autoExpandSeededRef` guard + `collectActivePathGroupIds` L337–355 (helper L78–87). *Story:* `--expandcollapsecontract` relies on "System logic" auto-expanding because active `monthly` is inside it.

**C3. Seed-once NEVER re-opens a user-collapsed group. [STORY]**
Given a group the user explicitly collapsed, When any re-render occurs (stable active item), Then
auto-expand must NOT re-add it — the seed key already fired. *Code:* `if (autoExpandSeededRef.current === seedKey) return` L343. *Story:* `--expandcollapsecontract` asserts the group stays `aria-expanded="false"` after a user collapse.

**C4. Manual toggle flips a single group. [CODE]**
Given a group header click, Then `toggleGroup(id)` adds/removes exactly that id from `expandedGroups`. *Code:* `toggleGroup` L735–740; wired to `onToggle`/`onToggleGroup`.

**C5. Expand-all opens every group in the active section. [STORY]**
Given the panel menu "expand-all" action, Then `expandedGroups` is set to `collectGroupIds(panelSection.items)` (every group id, recursively). *Code:* `id === "expand-all"` handler L841–842 (helper L65–74). *Story:* `--nestedexpandallcontract` (verifies a nested group re-opens).

**C6. Collapse-all closes every group. [CODE]**
Given the panel menu "collapse-all" action, Then `expandedGroups` is set to an empty Set. *Code:* L843–844.

**C7. Reserved menu ids are handled natively AND forwarded. [CODE]**
Given `expand-all`/`collapse-all`, Then the built-in panel mutates its own `expandedGroups` AND still
calls `onPanelMenuAction(id)` so consumers can react; all other ids only forward. *Code:* L841–846.

**C8. Chevron rotation tracks expand state ONLY (not active). [CODE]**
Given a disclosure row, Then the chevron rotates `0deg` (expanded) / `-90deg` (collapsed) driven solely
by `isExpanded`; `isActive` drives background/text, never rotation (CP.CHEVRON-ROTATION-ACTIVE-LOCK). *Code:* `chevronDown = isExpanded` L1453; transform L1498.

**C9. Collapsed group children LEAVE the DOM after the close animation. [STORY]**
Given a group is collapsed, When the `<Collapse>` close transition completes, Then its subtree is
unmounted (not merely visually hidden), deterministically via a timer (`duration + 50`) rather than
relying on `transitionend`. *Code:* `<Collapse>` wraps children in PanelGroup L2083 / NestedSubGroup L2015; unmount logic `motion.tsx` L128–135, `if (!mounted) return null` L143. *Story:* `--groupcollapseunmountcontract`.

**C10. Expand/collapse animation is auto-height + reduced-motion instant. [CODE]**
Given a group toggle, Then `<Collapse>` animates `grid-template-rows: 0fr↔1fr` + opacity over the
`collapse` preset; under reduced motion it snaps with immediate mount/unmount. *Code:* `motion.tsx` `Collapse` L91–162.

**C11. Nesting depth cap = 3, with a dev warning beyond. [CODE]**
Given a group nested deeper than `MAX_SUPPORTED_DEPTH = 3`, Then a `console.warn` fires (density/a11y not guaranteed). *Code:* `MAX_SUPPORTED_DEPTH` L1953; warn L1980–1986. Indent lines cap at 2 (`Math.min(depth, 2)` L1455).

**C12. `defaultExpandedGroups` seeds initial expansion, independent of the active path. [STORY]**
Given the `defaultExpandedGroups?: string[]` prop, Then the initial `expandedGroups` Set is seeded from it at
mount, so those groups render expanded even when the active item is NOT inside them; the active-path auto-seed
(C2) merges on top, and after mount user toggles / expand-all / collapse-all own the state (it is an
UNCONTROLLED initial value, not re-applied on prop change). *Code:* `useState(() => new Set(defaultExpandedGroups ?? []))` L294.
*Story:* `--defaultexpandedgroupscontract`. *Finding:* R1.COP1 (Copilot, RailNav production-test round).

---

## D. Search / filter

**D1. Recursive tree filter. [STORY]**
Given a non-empty query, Then the rendered tree is filtered so a node is kept if its own label matches
(with all children) OR a descendant matches (keeping only the matching subtree); empty query returns the
list unchanged. *Code:* `filterRailItems` L657–669; `visibleItems = searching ? filterRailItems(...) : ...` L732. *Story:* `--searchfiltercontract`.

**D2. Surviving groups are force-expanded while searching. [STORY]**
Given an active search, Then every group renders expanded regardless of `expandedGroups` (`searching ? true : expandedGroups.has(id)`), so matches deep in the tree are visible. *Code:* PanelGroup L984, NestedSubGroup L1995, and the `expanded` derivations pass `searching`. *Story:* `--searchfiltercontract` (match remains visible; non-match removed).

**D3. Escape clears the query (does not close the panel). [CODE]**
Given the search input is focused with a value, When Escape is pressed, Then the query is cleared and the
event is `stopPropagation()`'d so the rail-level Escape (which would close the panel/overflow) does not fire. *Code:* input `onKeyDown` Escape branch L916–925.

**D4. Clear button reveals only when there is a value; refocuses input. [CODE]**
Given the search field, Then the `ClearButton` occupies a reserved slot, is visible only when a value is
present, and on click clears the value + refocuses the input. *Code:* `<ClearButton visible={!!(value)} onClick={… searchInputRef.current?.focus()} />` L939–946.

**D5. Search icon + text color reflect empty vs has-value. [CODE]**
Given the search field, Then the leading icon is `textSubtle` when empty / `textMuted` when filled, and the input text is `textSubtle` (placeholder tone) when empty / `ink` when filled. *Code:* icon color L904; input color L928.

**D6. Controlled vs uncontrolled search value. [CODE]**
Given `searchable`, Then the value is `controlledSearchValue ?? internalSearchValue`; changes route to `onSearchChange` when provided, else to internal state. *Code:* value L910; onChange L911–915.

**D7. Search bar renders only when `searchable`. [CODE]** *Code:* `{searchable && (…)}` L882.

---

## E. Focus management

**E1. Focus returns to the originating rail button after panel collapse. [CODE]**
Given a panel is collapsed to null, Then focus moves to the rail button whose `data-section-id` matches
the section that was showing, located via a query on `railRef`; the source ref is then cleared. *Code:*
`collapseSourceRef` set in `setOpenPanel` L317–319; focus-return effect L327–335; `data-section-id` on RailButtonDark L102.
*Limitation (see Owner-not-found #3):* if the collapsed section is currently buried in the overflow menu, its button is not inside `railRef`, so the query returns null and focus-return silently no-ops.

**E2. Keyboard-only focus rings on nav rows. [CODE]**
Given a NavRow, Then `onMouseDown` calls `preventDefault()` so mouse clicks don't acquire focus, and the
focus ring (`FOCUS.style`) is applied only when `isKeyboardFocused` (set via `:focus-visible` match). *Code:* `onMouseDown` preventDefault L1463; `isKeyboardFocused` L1465/L1486.

**E3. Rail/ellipsis/expand buttons gate focus state on `:focus-visible`. [CODE]**
Given these buttons, Then `onFocus` only sets the focused state when `e.currentTarget.matches(":focus-visible")` — pointer focus shows no ring. *Code:* RailButtonDark L95; EllipsisButton L74; ExpandButton L72.

**E4. Escape at rail level closes overflow first, then panel. [CODE]**
Given the aside has focus, When Escape is pressed, Then if the overflow menu is open it closes and returns
focus to the More trigger; else if a panel is open it closes. *Code:* `handleKeyDown` L445–454.

**E5. Menus auto-focus their first item on open. [CODE]**
Given the overflow menu or panel-header menu opens, Then focus moves to the first `[role="menuitem"]`. *Code:* overflow L1203–1208; panel-header popover L1710–1713.

---

## F. Menus (overflow menu + panel-header actions menu)

Both menus follow Golden Rule #3: rendered via `ReactDOM.createPortal(..., document.body)` with
`position: fixed` coordinates from the trigger's `getBoundingClientRect()`, because the rail wrapper
clips absolutely-positioned children.

**F1. Portal + fixed positioning. [CODE]**
Given a menu opens, Then it is portaled to `document.body` and positioned `fixed` from a captured anchor rect. *Code:* overflow `createPortal` L567–581, anchor capture L559; panel-header `createPortal` L1651–1663, anchor capture L1629–1630.

**F2. Overflow menu opens to the RIGHT of the trigger, flips DOWN when short on space above. [CODE]**
Given the overflow menu, Then `left = anchorRect.right + SPACE[1]`; it anchors to the trigger's top and
flips downward (with a height cap) only when it doesn't fit above and there's more room below. *Code:* position L1227–1230; flip logic `useLayoutEffect` L1162–1176.

**F3. Panel-header menu is right-aligned below the trigger, flips UP when needed. [CODE]**
Given the panel-header menu, Then it right-aligns to the trigger's right edge, opens below by default, and
flips above (with height cap) when it doesn't fit below. *Code:* position L1727–1730; flip logic L1692–1707.

**F4. Both menus close on outside click (checking BOTH trigger and portal). [CODE]**
Given a menu is open, When a mousedown lands outside both the trigger and the portal menu, Then it closes;
clicks inside either are ignored (so the menu doesn't close on intent). *Code:* overflow handler L1179–1189; panel-header handler L1612–1624.

**F5. Keyboard roving: Arrow Up/Down wrap, Home/End jump, Escape closes. [CODE]**
Given menu focus, Then ArrowDown/ArrowUp move focus with wraparound, Home/End jump to first/last, Escape
closes the menu. *Code:* overflow `handleMenuKeyDown` L1211–1225; panel-header `handleKeyDown` L1715–1725 (skips `:disabled` items).

**F6. Menu items are roving (`tabIndex=-1`), not in the tab order. [CODE]** *Code:* overflow item `tabIndex={-1}` L1346; panel-menu row `tabIndex={-1}` L1821.

**F7. Overflow menu items carry full nav per-state visuals. [CODE]**
Given an overflow menu item, Then it renders rest/hover/browsing/active states (bg, label color, label
font rest=`bodyM`/active=`labelL`, filled icon on engagement, inset ring while browsing) matching the
RailMenu per-state contract. *Code:* `OverflowMenuItem` L1298–1387 (bg L1317, color L1325, `labelFont` L1342, browsing ring L1361).

**F8. Overflow menu is internally scrollable with a conditional gutter + height cap. [CODE]**
Given the overflow menu exceeds available height, Then its inner list scrolls (`overflowY: auto`), the
scrollbar gutter (`paddingRight`) appears only when scrollable, and `maxHeight` is set from the measured available space. *Code:* scroll region L1264–1275; `menuScrollable` L1192–1200; `maxHeight` L1155/L1249.

**F9. Panel-header menu row: checked / danger / disabled variants. [CODE]**
Given a `PanelHeaderMenuItem`, Then: `checked` → `bgSubtle` rest bg + `ink` label + weight 500 + trailing
checkmark; `danger` → `statusRedText` label; `disabled` → `textDisabled`, non-interactive (`disabled` attr,
no hover/press, cursor `not-allowed`), and its right checkmark suppressed. *Code:* `PanelMenuRow` L1782–1882 (bg L1800–1808, color L1810–1816, weight L1842, checkmark `isChecked && !isDisabled` L1876, disabled gating throughout).

**F10. Panel-header menu button reflects open ≡ engaged. [CODE]**
Given the panel-header ellipsis trigger, Then hover/pressed/open all render the engaged visual (hoverBg / ink / filled icon); pressed maps to `bgStrong`. *Code:* `PanelHeaderMenuButton` bg/icon L1635–1641; `EllipsisButton` state model L33–60.

**F11. Panel-header menu appears only when items are provided. [CODE]** *Code:* `{panelMenuItems && panelMenuItems.length > 0 && (…)}` L830.

---

## G. Tooltips, dividers, per-state visuals

**G1. Rail tooltip is suppressed while browsing / active / disabled. [CODE]**
Given a rail button, Then the label tooltip shows only when (hovered OR keyboard-focused) AND NOT browsing
AND NOT active AND NOT disabled; a disabled rail button shows no tooltip at all. *Code:* `showTooltip` L54 (`RailButtonDark.tsx`); disabled buttons pass `disabled` and never satisfy it.

**G2. Rail button "browsing" state (panel open ≠ active section). [CODE]**
Given a section whose panel is open but which is not the active section, Then its rail button renders the
browsing visual: inset 1.5px `darkBorderStrong` ring + `onDarkHover` icon + filled glyph, no fill bg. *Code:* `browsing={openPanel === section.id && activeSection !== section.id}` L545/L605; `browsingRing` `RailButtonDark.tsx` L68; color L70–76.

**G3. Rail button active state. [CODE]**
Given the active section, Then its rail button renders `darkActiveBg` fill + `onDark` icon + filled glyph + `aria-current="page"`. *Code:* `RailButtonDark.tsx` background L56–64, color L70–76, `aria-current` L101.

**G4. NavRow active-collapsed is a FILLED dark row; active-expanded is transparent. [CODE]**
Given a NavRow, Then active+collapsed (selected leaf, or a collapsed group on the active path) renders a
filled `tokens.ink` background with `onInk` label/icon; active+expanded renders transparent with `ink`
label; hover/keyboard-focus render `hoverBg` (suppressed while active-expanded); disabled is a full
`textDisabled` override. *Code:* `NavRowShell` state derivation L1439–1452.

**G5. NavRow label weight bumps to `labelL` when active. [CODE]** *Code:* `labelFont = isActive ? TYPE.labelL : TYPE.bodyM` L1454.

**G6. Badge stays de-emphasized in ALL row states. [CODE]**
Given a row with a badge, Then the badge color is always `tokens.textDisabled`, including on the dark active row. *Code:* `badgeColor = tokens.textDisabled` L1451.

**G7. "Coming soon" rows: disabled + leading chevron even with no children. [CODE]**
Given `comingSoon`, Then the row is disabled (greyed, non-interactive) AND shows a leading disclosure
chevron to signal it will become a group later. *Code:* `PanelItem` `hasChevron={comingSoon}`, `isDisabled={!!item.disabled || comingSoon}` L1553/L1559/L1562.

**G8. Panel title truncates; subtitle WRAPS. [STORY]**
Given the panel header, Then the section title single-line truncates (`nowrap` + ellipsis) while the
subtitle wraps to multiple lines (`whiteSpace: normal`), indented 28px to align under the title. *Code:* title L819–829; subtitle L862–874. *Story:* `--subtitlewrapcontract` asserts subtitle `whiteSpace !== "nowrap"`.

**G9. Two hairline dividers frame the search bar. [CODE]**
Given the panel, Then a 0.5px `tokens.hairline` divider sits below the header, and (when searchable) a
second below the search bar. *Code:* header divider L879; search divider L950.

**G10. Footer ordering: top-to-bottom, Settings anchored bottom-most. [CODE]**
Given `footerSections`, Then they render top-to-bottom, but any section whose id/label is exactly
"settings" is sorted to the very bottom slot. *Code:* `orderedFooterSections` sort L290–295; render L600–609.
*Caveat:* the Settings-anchoring match is a literal `=== "settings"` (case-insensitive) check only.

**G11. Logo slot: default icon, suppressible, optional interactivity. [CODE]**
Given `logo`, Then it defaults to `<IconLogo />` when omitted, is suppressed entirely when `null`, and
renders as an interactive button (with `logoLabel` tooltip/aria) when `onLogoClick` is provided. *Code:* `{logo !== null && …}` L514–523; default `logo ?? <IconLogo />` L517.

**G12. Disabled rail/footer section renders non-interactive with no tooltip. [CODE]**
Given `section.disabled`, Then the rail button is `onDarkDisabled`, non-interactive, and shows no tooltip. *Code:* `RailButtonDark.tsx` `isDisabled` L48, color L70–72, `onClick` gated L92, tooltip gated L54.

**G13. Panel header title can differ from the rail tooltip (`RailSection.panelTitle`). [CODE]**
Given a section, Then its **rail button tooltip always uses `section.label`**, but the **open panel's header
title uses `section.panelTitle` when set, falling back to `section.label`** when omitted. This lets the rail
read compact (e.g. tooltip "Revenue") while the panel header reads fuller (e.g. "Azure Data Revenue").
*Code:* `panelSection.panelTitle ?? panelSection.label` L838; `RailSection.panelTitle?: string` L101.

**G14. Landmark / aria labels are props with brand-specific DEFAULTS a consumer must review. [CODE]**
Given the nav, Then these labels are consumer-overridable props, each with a built-in default:
- `logoLabel` — logo tooltip + aria-label when the logo is interactive. **Default `"BiDezine"`.** ⚠️ This is a
  brand string: **every non-BiDezine consumer MUST pass its own `logoLabel`** or it silently ships the wrong
  brand in the tooltip/aria. *Code:* default L260, applied L540.
- `railAriaLabel` — the rail `<nav>` landmark label. Default `"Main navigation"`. *Code:* L267, applied L553.
- `overflowLabel` — the "More" overflow menu aria-label. Default `"More navigation options"`. *Code:* L268, applied L581.
- `panelMenuAriaLabel` — the panel-header actions (ellipsis) trigger aria-label. Default `"Panel actions"`. *Code:* L271, applied L858.

---

## Owner-described — NOT found in code (verify / may be unimplemented)

The owner's overflow narrative is, on the whole, IMPLEMENTED (see §A). The items below are the honest
gaps / partials found while enumerating — none is a full contradiction, but each is a place where the
described behavior is weaker or narrower than the words imply, and a borrow must not quietly rely on it.

**#1 — "FOOTER stays pinned and NEVER overflows" is TRUE, but only for the top-vs-footer split.**
The footer being pinned and never feeding the overflow menu IS implemented (A7/A8). What is NOT
implemented is any *footer-side* overflow handling: there is no "footer More menu." This is consistent
with the owner's intent, but flagged so no one assumes symmetric overflow logic exists for the footer.

**#2 — "Footer shows at most 3 icons" is enforced by CLIPPING, not by relocation.**
The spec (`railnav.spec.md`, "FooterSlot is protected space … max 3 icons") and `FOOTER_MAX_ICONS = 3`
only clamp the FooterSlot's `maxHeight` (A9). A 4th+ footer icon is **visually clipped/hidden**, not moved
into any menu and not otherwise surfaced. If the owner expects a 4th footer item to degrade gracefully
(e.g. into a menu), that behavior does NOT exist — verify the intended handling before a borrow.

**#3 — Focus-return-after-collapse does NOT cover an overflowed source section.**
E1 restores focus by querying `railRef` for `button[data-section-id=…]`. If the panel being collapsed
belongs to a section currently BURIED in the overflow menu (its rail button is not rendered in `railRef`),
the query returns null and focus-return silently no-ops (focus is left wherever the collapse button was).
The owner-described "focus returns to the rail button after a panel collapses" holds for on-rail sections
only. Verify whether overflowed-section focus-return is required.

**#4 — Overflow burial priority is fixed array order, not a declared priority.**
A6 buries by `sections` array order (trailing items first). There is no per-section "priority"/"pin" field
to keep a specific important section on the rail regardless of position. The owner described "the
priority/order of which items bury" — that priority IS purely positional today. If a non-positional pin
is intended, it is unimplemented.

**#5 — Rail overflow has NO automated regression test.**
The entire §A overflow policy (measurement, burial, footer-pinned, active-in-overflow dot, re-appear on
grow) is covered only by the static `--figmaspec` render (A4, VISUAL) — there is no play story that
drives a height change and asserts icons bury/return, that the footer stays put, or that the dot appears.
This is the single highest-risk area for a borrow because the owner-critical behavior is un-gated. A
contract play story should be added BEFORE swapping the overflow engine.

---

## Coverage summary (assertions by area)

| Area | Assertions | [STORY] gated | [CODE] only | [VISUAL] only |
|------|-----------:|--------------:|------------:|--------------:|
| A. Rail overflow policy | 13 | 0 | 12 | 1 (A4) |
| B. Panel open/close, reveal, elevation, resize | 15 | 2 (B5,B15) | 13 | 0 |
| C. Expand/collapse state machine | 12 | 6 (C1,C2,C3,C5,C9,C12) | 6 | 0 |
| D. Search/filter | 7 | 2 (D1,D2) | 5 | 0 |
| E. Focus management | 5 | 0 | 5 | 0 |
| F. Menus (overflow + panel header) | 11 | 0 | 11 | 0 |
| G. Tooltips, dividers, per-state visuals | 14 | 1 (G8) | 13 | 0 |
| **Total** | **77** | **11 story-backed** | **64** | **2** |

The 11 story-backed assertions are gated by 8 distinct contract stories: `--railleafnavcontract` (B15),
`--defaultexpandedgroupscontract` (C12), `--expandcollapsecontract`
(C2,C3), `--nestedexpandallcontract` (C1,C5), `--groupcollapseunmountcontract` (C9), `--searchfiltercontract`
(D1,D2), `--elevationcontract` (B5), `--subtitlewrapcontract` (G8).

**Existing contract stories (`src/gallery/RailNav.stories.tsx`, all `tags:["!dev"]`, run in `npm run health`):**
`--railleafnavcontract` (B15) · `--defaultexpandedgroupscontract` (C12) · `--expandcollapsecontract` (C2/C3) ·
`--searchfiltercontract` (D1/D2) · `--subtitlewrapcontract` (G8) · `--elevationcontract` (B5) ·
`--nestedexpandallcontract` (C1/C5) · `--groupcollapseunmountcontract` (C9).
Plus static renders: `--default` (full surface) and `--figmaspec` (rail overflow visual, A4).

**Highest-risk un-gated behaviors for a Phase-2 borrow (add a play story before swapping):**
the entire rail overflow policy §A (measurement/burial/footer-pinned/active-dot/re-appear), focus-return
§E1, resize clamp §B7, menu keyboard roving + outside-click §F4/F5, and Escape-to-clear-search §D3.
