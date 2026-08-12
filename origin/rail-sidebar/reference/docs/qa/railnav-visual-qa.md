# RailNav Visual QA — v0.1.2

> Created: 2026-05-24
> Updated: 2026-05-25
> Author: Agent (owner-reviewed)
> Status: **VISUAL APPROVED — BETA-CANDIDATE**

---

## 1. Current Status

| Field | Value |
|-------|-------|
| Version | v0.1.2 (`06687bc`) |
| Maturity | **experimental** (beta-candidate) |
| Technical gates | All passing (tsc, health:strict 0 findings, storybook build, consumer sync, 136/136 visual) |
| Visual acceptance | **APPROVED** (2026-05-24, Nohemi / owner review) |
| Foundation audit | **PASS** — scroll/overlay compliance, all 6 checks |
| Open blockers | **0** — accessibility behavior validation complete |
| Open non-blockers | 7 (3 medium, 4 low — deferred refinements) |

---

## 2. Golden References

### Bloodwork Dashboard (localhost:5173) — Primary Golden Reference
The bloodwork dashboard is the most mature consumer and the **source of truth**
for how the navigation should look and feel. It uses RailNav with:
- Logo mark at top
- 7 rail sections with icons (Lab Results, Health Summary, CBC, etc.)
- Flat panel items with leading icons
- Settings + theme toggle pinned at bottom of rail
- Collapse chevron (`«`) in panel header

Key visual characteristics observed:
- Rail icons are 24px, buttons are 40×40, radius 8 (soft)
- Panel items have 18px leading icons with consistent icon–label gap
- Active item has a subtle light-gray background row
- Panel header title is muted, collapse button is a double-chevron
- Bottom utility items (moon icon = theme, gear icon = settings) are properly spaced

### Storybook (localhost:6007) — Component Isolation
8 stories covering: flat navigation, 1-level nesting, 2-level nesting (with and
without item icons), max-depth (3-level) nesting, overflow menu, collapsed panel,
and long panel scroll.

### Docs App (localhost:5188) — Real Consumer Integration
Uses RailNav with 4 sections (Overview, Foundations, Library, Governance),
utility area with theme toggle, collapse button.

---

## 3. Visual Comparison Checklist

### Rail

| Property | Bloodwork (golden) | Storybook | Docs App | Match? |
|----------|-------------------|-----------|----------|--------|
| Logo placement | Top of rail, above nav, 40×40 cell | Same | Same | ✅ |
| Rail width | 56px (`LAYOUT.railW`) | 56px | 56px | ✅ |
| Rail radius | 18px (`RADIUS.container`) | 18px | 18px | ✅ |
| Rail background | `tokens.darkSurface` (dark navy) | Same | Same | ✅ |
| Rail vertical padding | 8px top + 8px bottom (`SPACE[2]`) | Same | Same | ✅ |
| Rail horizontal padding | 8px (`SPACE[2]`) — centered | Same | Same | ✅ |
| Icon size | 24px | 24px | 24px | ✅ |
| Button size | 40×40px (`LAYOUT.hitTarget`) | 40×40px | 40×40px | ✅ |
| Button gap | 4px (`SPACE[1]`) | 4px | 4px | ✅ |
| Active state | Filled icon + `darkActiveBg` | Same | Same | ✅ |
| Hover state | `darkHoverBg` + `onDarkHover` color | Same | Same | ✅ |
| Bottom utility placement | Pinned to bottom via flex spacer | Same | Same | ✅ |
| Overall density | Comfortable — compact but breathable | Same | Same | ⚠️ See F-01 |
| Rail feels too heavy/light | Balanced dark contrast | Same | Same | ✅ |

### Sidebar (Panel)

| Property | Bloodwork (golden) | Storybook | Docs App | Match? |
|----------|-------------------|-----------|----------|--------|
| Panel width | 256px (`LAYOUT.panelW`) | 256px | 256px | ✅ |
| Panel radius | 18px (`RADIUS.container`) | 18px | 18px | ✅ |
| Panel background | `tokens.surface` (white/dark) | Same | Same | ✅ |
| Distance from rail | 12px (`LAYOUT.panelGap`) | 12px | 12px | ✅ |
| Header spacing | 4px top pad + 4px bottom margin | Same | Same | ⚠️ See F-02 |
| Title typography | `TYPE.labelM`, muted color | Same | Same | ⚠️ See F-03 |
| Collapse button placement | Right side of header row | Same | Same | ⚠️ See F-04 |
| Row height | Auto (padding-driven: 8px top/bottom) | Same | Same | ⚠️ See F-05 |
| Row padding | 8px vertical, 12px horizontal | Same | Same | ✅ |
| Item typography | `TYPE.bodyM` (13px Inter 400) | Same | Same | ✅ |
| Item icons | 18px, `SPACE[2]` gap to label | Same | Same | ⚠️ See F-06 |
| Active row treatment | `hoverBg` + 500 weight + ink color | Same | Same | ⚠️ See F-07 |
| Nested group treatment | Chevron rotation, indented children | N/A in bloodwork | N/A | ⚠️ See F-08 |
| Scroll behavior | `overflowY: auto` on items nav | Same | Same | ✅ |
| Empty space balance | Large empty area below short item lists | Same | Same | ⚠️ See F-09 |

### Behavior

| Property | Bloodwork (golden) | Storybook | Docs App | Match? |
|----------|-------------------|-----------|----------|--------|
| Panel collapse | `«` (double chevron) collapses, focus returns | `‹` single chevron | Same | ⚠️ See F-04 |
| Rail overflow | Not triggered (≤7 sections) | Works in OverflowRailItems story | N/A | ✅ |
| Keyboard navigation | Escape closes panel/overflow | Same | Same | ✅ |
| Focus return | Returns to source rail button | Same | Same | ✅ |
| Active nested item | Auto-expands group | N/A in bloodwork | N/A | ✅ |
| Reduced motion | Respects `prefers-reduced-motion` | Same | Same | ✅ |

---

## 4. Findings Table

### F-01 — Rail button gap feels tight with many sections

| Field | Detail |
|-------|--------|
| **Severity** | low |
| **Location** | rail |
| **Expected** | Rail buttons feel balanced and evenly spaced regardless of count |
| **Actual** | 4px (`SPACE[1]`) gap between 40px buttons is visually tight when 5+ sections present. Bloodwork has 7 sections and it works, but the spacing reads as a continuous column rather than discrete targets |
| **Reference** | Bloodwork screenshot — 7 rail icons are stacked tightly |
| **Recommended fix** | Consider `SPACE[2]` (8px) gap, or keep as-is per bloodwork precedent |
| **Blocks beta?** | No |

### F-02 — Panel header vertical spacing is cramped

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Panel header has clear visual separation from panel items. Bloodwork header has ~16px breathing room above the first item |
| **Actual** | Header uses `padding: SPACE[1] SPACE[2]` (4px 8px) + `marginBottom: SPACE[1]` (4px) = only 8px total between title and first item. Header itself has minimal vertical presence |
| **Reference** | Compare bloodwork "Lab Results" header vs. Storybook "Overview" header |
| **Recommended fix** | Increase header `marginBottom` to `SPACE[2]` (8px) or `SPACE[3]` (12px). Consider `padding: SPACE[2] SPACE[2]` (8px 8px) for the header container |
| **Blocks beta?** | No, but should be fixed |

### F-03 — Panel section title is too subtle / small

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Section title ("Lab Results", "Overview") reads as a clear label for the panel content |
| **Actual** | Uses `TYPE.labelM` + `textMuted` which is a small, low-contrast label. In bloodwork this works because the content gives context, but in Storybook isolation the title is easy to miss |
| **Reference** | Bloodwork "Lab Results" header vs. Storybook "Overview" header |
| **Recommended fix** | Consider `TYPE.headingS` or at minimum `TYPE.bodyM` with medium weight (500) for the title. Keep `textMuted` color |
| **Blocks beta?** | No, but should be resolved for readability |

### F-04 — Collapse button uses single chevron, bloodwork uses double chevron

| Field | Detail |
|-------|--------|
| **Severity** | high |
| **Location** | sidebar |
| **Expected** | Collapse affordance matches the established bloodwork pattern: `«` (double chevron left) clearly signals "collapse this panel" |
| **Actual** | RailNav uses `IconChevronLeft` (single `‹`). Bloodwork uses `«` (double chevron or `IconPanelLeftContract`). This creates inconsistency between the DS component and its primary consumer |
| **Reference** | Bloodwork collapse button (top-right of panel header) vs. Storybook CollapseButton |
| **Recommended fix** | Replace `IconChevronLeft` with a panel-collapse icon (double chevron left) to match bloodwork. Also review the 28×28 size — bloodwork may use a different hit target |
| **Blocks beta?** | Yes — visual inconsistency with primary consumer |

### F-05 — Panel item row height feels inconsistent with bloodwork

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Panel items have consistent, comfortable row height matching bloodwork (~40px visible rows with generous padding) |
| **Actual** | Row height is driven purely by `padding: SPACE[2] SPACE[3]` (8px 12px) + `TYPE.bodyM` (13px line-height). Total ~29px. Bloodwork items appear taller (~36-40px) with more vertical breathing room |
| **Reference** | Compare bloodwork "Health Summary" / "Complete Blood Count" row heights vs. Storybook "Summary" / "Consumer Sync" |
| **Recommended fix** | Consider `padding: SPACE[3] SPACE[3]` (12px 12px) or adding a `minHeight: LAYOUT.hitTargetSm` (36px) for comfortable tapping |
| **Blocks beta?** | No, but affects comfort and touch-friendliness |

### F-06 — Panel item icons are smaller than bloodwork items

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Panel item icons are visually balanced with the text label and match bloodwork icon presence |
| **Actual** | Panel item icons are 18px (standard small tier). Bloodwork panel items use what appears to be 20px icons with slightly more visual weight. The 18px icons look a bit small relative to the 13px text |
| **Reference** | Compare bloodwork "Health Summary" icon (clipboard with pulse) vs. Storybook "Summary" icon (info circle) |
| **Recommended fix** | Consider 20px for panel item icons to match bloodwork. Keep 18px for nested children |
| **Blocks beta?** | No |

### F-07 — Active row treatment is too subtle

| Field | Detail |
|-------|--------|
| **Severity** | high |
| **Location** | sidebar |
| **Expected** | Active/selected panel item is immediately obvious. Bloodwork shows a clear background highlight on the active row |
| **Actual** | Active item uses `tokens.hoverBg` as background — this is the same color as hover, so the selected state is only distinguishable by font-weight 500 and `tokens.ink` color. The background tint is very faint (near-white in light mode). It doesn't provide a strong "you are here" signal |
| **Reference** | Compare bloodwork "Health Summary" (active, clear bg highlight) vs. Storybook "Summary" (active, barely visible bg) |
| **Recommended fix** | Use a dedicated `tokens.selectedBg` or `tokens.accentBg` that is visually distinct from hover. Or increase the opacity/tint of the active background |
| **Blocks beta?** | Yes — active item must be immediately identifiable |

### F-08 — Nested group disclosure affordance is weak

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Group parent items clearly signal "this expands" via a visible chevron. Expanded children are clearly indented and visually subordinate |
| **Actual** | The 14px chevron (`IconChevronDown`) at the right edge is small and low-contrast (`currentColor` inherits `textSubtle`). The indentation uses `SPACE[5] + SPACE[3]` (36px) left padding which is generous but the children aren't visually differentiated from flat items except by indent |
| **Reference** | Storybook "With Nested Group" story |
| **Recommended fix** | Consider (a) slightly larger chevron (16px), (b) a subtle left-border or background tint on the expanded group container, (c) review indent depth — 36px may be too deep |
| **Blocks beta?** | No, but should be refined |

### F-09 — Panel feels empty when section has few items

| Field | Detail |
|-------|--------|
| **Severity** | low |
| **Location** | sidebar |
| **Expected** | Panel layout doesn't feel wasteful when there are only 2-3 items |
| **Actual** | With 2 items (e.g., "Summary" + "Consumer Sync"), the panel is 95% empty white space. The panel stretches full viewport height. This is structurally correct but visually unbalanced |
| **Reference** | Storybook "Default With Logo" and Docs App — both show 2-item panels with large empty areas |
| **Recommended fix** | This may be acceptable — the panel is a persistent sidebar, not a popup. But worth considering whether the panel should auto-size to content height (like a popover) when items are few. Defer to owner judgment |
| **Blocks beta?** | No |

### F-10 — Logo dot is too small / lacks visual weight

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | rail |
| **Expected** | Logo mark at top of rail has clear visual presence and establishes brand identity |
| **Actual** | In Storybook stories, the logo renders as a small dot (~8px?) above the first rail button. It has minimal visual weight and doesn't read as a deliberate product mark. Bloodwork's logo (the "D" mark) is much more prominent |
| **Reference** | Compare bloodwork logo mark vs. Storybook "Default With Logo" dot |
| **Recommended fix** | This is a story concern, not a component bug — the `LogoMark` helper in stories should render a more realistic logo placeholder. But the component's 40×40 slot is correct |
| **Blocks beta?** | No — story data issue, not component issue |

### F-11 — No visual separator between nav items and utility items in rail

| Field | Detail |
|-------|--------|
| **Severity** | low |
| **Location** | rail |
| **Expected** | Clear visual break between primary nav icons and utility icons at bottom (theme, settings) |
| **Actual** | Only a flex spacer separates them. In bloodwork this works because there are many sections pushing utilities far down. With fewer sections (2-3), the flex spacer creates a large gap but no visual marker to distinguish "nav" from "utility" |
| **Reference** | Storybook "With Footer Utilities" — only 1 utility icon at bottom, large gap above it |
| **Recommended fix** | Consider a subtle horizontal divider (1px `darkBorderStrong`) above utility items, or a small top margin. Only when utility items are present |
| **Blocks beta?** | No |

### F-12 — Deep nesting (depth > 3) outside supported contract

| Field | Detail |
|-------|--------|
| **Severity** | medium |
| **Location** | sidebar |
| **Expected** | Consumer navigation stays within the supported 3-level depth contract (parent → child → grandchild) |
| **Actual** | `RailPanelChild.children` is recursive — the component technically renders any depth. However, visual density (indent overflow), guide-line stacking, and accessibility have only been validated through depth 3. |
| **Dev warning** | `NestedSubGroup` emits `console.warn` in dev mode when `depth > 3` |
| **DQA guidance** | Consumers using depth > 3 must request explicit design review. The `DQA.DEEP-NESTING` catalog ID should be flagged during smell/component-builder checks. |
| **Catalog ID** | `DQA.DEEP-NESTING` |
| **Blocks beta?** | No — dev warning + documentation sufficient for beta. CI enforcement deferred. |

---

## 5. Beta Promotion Criteria

RailNav **cannot** move from `experimental` to `beta` until:

### Blockers (must be resolved)

- [x] **F-04 / R2-02** — Collapse button icon → RESOLVED. `IconChevronDoubleLeft` size 20 (implemented, visually approved 2026-05-24)
- [x] **F-07 / R2-03** — Active row uses neutral tokens → RESOLVED. `tokens.bg` + `tokens.ink` + weight 500 (implemented, visually approved 2026-05-24)
- [x] **R2-01** — Panel title → RESOLVED. `TYPE.headingM` + `tokens.ink` (implemented, visually approved 2026-05-24)
- [x] All BLOCKER/HIGH visual QA findings resolved (R2-01, R2-02, R2-03 confirmed in code + approved screenshots)
- [x] Manual visual approval recorded (owner reviewed screenshots)
- [x] Resolved-finding regression check passed (see Section 5a) — verified against current source 2026-05-25
- [x] Accessibility behavior validation completed (Playwright a11y tree + keyboard automation, 2026-05-25)
- [x] Storybook stories visually approved by owner
- [x] Docs app integration visually approved by owner
- [x] At least one consumer integration confirms the API is usable (bloodwork-dashboard + docs app both use RailNav)

### High priority (should be resolved before beta)

- [x] **F-02** — Panel header spacing → ACCEPTED. Current spacing visually approved (2026-05-24)
- [x] **F-03** — Panel section title → SUPERSEDED by R2-01 fix. Now `TYPE.headingM` + `tokens.ink`
- [ ] **F-05** — Panel item row height. Current `minHeight: LAYOUT.hitTargetSm` (36px) accepted in approval, but bloodwork uses ~44px. Deferred refinement
- [ ] **F-06** — Panel item icon size (18px vs. 20px). Deferred refinement
- [ ] **F-08** — Nested group disclosure affordance. Deferred refinement

### Nice-to-have (can be resolved during beta)

- [ ] **F-01** — Rail button gap assessment
- [ ] **F-09** — Empty panel balance
- [ ] **F-10** — Story logo placeholder improved
- [ ] **F-11** — Nav/utility visual separator

### Gate sequence after fixes

1. Implement approved fixes
2. Run resolved-finding regression check (Section 5a)
3. Run all technical gates (`health`, `tsc`, `storybook`, `consumer:sync`)
4. Capture screenshots for owner review (Storybook + docs app + bloodwork)
5. Owner visual approval — recorded below in Section 5b
6. **Only after approval:** regenerate visual baselines (`test:visual:update`)
7. Run visual regression tests (`test:visual`)
8. Accessibility behavior validation pass
9. Promote to `beta` in component registry
10. Tag new version

### 5a. Resolved-Finding Regression Checklist

Before every commit or tag that touches RailNav, re-verify each resolved finding:

| Finding | What to verify | File / Line hint |
|---|---|---|
| R2-01 panel title | `TYPE.headingM` + `tokens.ink` in panel header `<span>` | RailNav.tsx L432-438 |
| R2-02 collapse icon | `IconChevronDoubleLeft` size 20, filled on hover | CollapseButton component L1095 |
| R2-03 active row neutral | PanelItem selected bg = `tokens.bg`, color = `tokens.ink`, weight 500 | PanelItem component L1053-1070 |
| R2-06 nested border | PanelGroup expanded border = `tokens.border` (not accentSubtle) | PanelGroup component |
| R2-12 logo slot | `<IconLogo />` renders D mark SVG, `tokens.onDark` color | LogoSlot component |
| Logo tooltip | LogoSlot always shows tooltip on hover, default text "BiDezine" | LogoSlot component |
| Rail top padding | `${SPACE[2]}px` uniform (8px all sides) | Rail surface style |
| Panel/rail alignment | Header height = `LAYOUT.hitTarget`, centers with logo; first item aligns with first rail icon | Panel header + LogoSlot |
| Icon filled wiring | All interactive icon call sites include `hovered` in `filled` prop | All icon call sites |
| Icon path integrity | Regular vs Filled SVG paths are visually distinct (not truncated) | fluent.tsx all icons with filled |
| Settings icon | Regular (outlined gear) by default, Filled (solid gear) on hover | IconSettings in fluent.tsx |
| Utility items | ThemeToggle + SettingsButton in all stories | RailNav.stories.tsx |
| Row height | PanelItem + PanelGroup minHeight = `LAYOUT.hitTargetSm` (36px) — approved in visual review | PanelItem + PanelGroup |
| Item text contrast | Non-selected items use `tokens.textMuted` (not textSubtle) | PanelItem + PanelGroup |
| Header breathing room | Panel header `marginBottom: SPACE[4]` (16px) | Panel header style |
| Logo–icon gap | LogoSlot `marginBottom: SPACE[3]` (12px), first icon center = first item center | LogoSlot sharedStyle |
| First-item alignment | Rail icon center (84px) = Panel item center (84px) | Cross-component math |

**Procedure:** grep for each value in the current source. If any value has changed
from its approved state, emit `DQA.RESOLVED-REGRESSION` and halt.

### 5b. Visual Approval Log

| Date | Reviewer | Scope | Decision | Notes |
|---|---|---|---|---|
| 2026-05-24 | Nohemi / owner review | 8 Storybook RailNav stories + docs app RailNav | **APPROVED** | RailNav visual direction approved after multi-level nesting, focus, scroll, overflow, logo, sidebar, and token/foundation hardening. Stories: WithAllIcons, WithoutItemIcons, OverflowMenu, FlatNavigation, OneLevelNesting, MaxDepthNesting, CollapsedPanel, LongPanelScroll. Docs app integration also approved. |

---

---

## 6. Round 1 Approved Constants (SUPERSEDED)

> **⚠ SUPERSEDED** — Round 2 findings (§7) corrected several values below.
> The current approved state is reflected in the §5a regression checklist.
> Do NOT use this table for implementation — it preserves Round 1 decisions for history only.

Owner approved on 2026-05-24. These were the values for the Round 1 fix pass.

| Property | Before (v0.1.2) | After (v0.1.3) | Token/Source |
|----------|-----------------|-----------------|-------------|
| Panel title typography | `TYPE.labelM` (13px, 500, 1.4lh) | `TYPE.bodyM` + `TYPE.medium` (14px, 500, 1.55lh) | F-03 |
| Panel title color | `tokens.textMuted` | `tokens.textMuted` (unchanged) | — |
| Nav item typography | `TYPE.bodyM` (14px, 400) | `TYPE.bodyM` (unchanged) | — |
| Row height | ~29px (padding-driven) | `minHeight: LAYOUT.hitTargetSm` (36px) | F-05 |
| Row padding | `SPACE[2] SPACE[3]` (8px 12px) | `SPACE[2] SPACE[3]` (unchanged) | — |
| Item icon size | 18px | 20px | F-06 |
| Child icon size | 18px | 18px (unchanged) | — |
| Child indent paddingLeft | `SPACE[5] + SPACE[3]` = 36px | `SPACE[5] + SPACE[2]` = 32px | F-08 |
| Panel header padding | `SPACE[1] SPACE[2]` (4px 8px) | `SPACE[2] SPACE[2]` (8px 8px) | F-02 |
| Panel header marginBottom | `SPACE[1]` (4px) | `SPACE[2]` (8px) | F-02 |
| Collapse button size | 28×28, `IconChevronLeft` 18px | 28×28, `IconPanelLeftContract` 18px | F-04 |
| Active row bg | `tokens.hoverBg` | `tokens.accentSubtle` | F-07 |
| Active row color | `tokens.ink` | `tokens.accentText` | F-07 |
| Active row weight | 500 | 500 (unchanged) | — |
| Group header active color | `tokens.ink` | `tokens.accentText` (when hasActiveChild) | F-07 |
| Nested group chevron size | 14px | 16px | F-08 |
| Nested expanded container | No visual indicator | 2px left border `tokens.accentSubtle` | F-08 |
| Story logo | `IconLogo size={24}` | `IconLogo size={32}` | F-10 |

### Deferred (pending post-fix visual review)

| Property | Current | Notes |
|----------|---------|-------|
| Rail button gap | `SPACE[1]` (4px) | F-01 — may be fine per bloodwork precedent |
| Panel empty balance | Full-height stretch | F-09 — acceptable for persistent sidebar |
| Nav/utility separator | Flex spacer only | F-11 — evaluate after other fixes land |

> **Next step:** Implement approved fixes, then provide before/after
> screenshots for owner visual review. No baseline regeneration until approved.

---

## 7. Visual QA Round 2: Remaining Issues

> Round 1 fixes (F-02 through F-08, F-10) have been implemented.
> This section documents remaining visual gaps found by comparing
> Storybook stories, docs app, and the bloodwork golden reference.
>
> Screenshots taken: 2026-05-24
> Status: **FINDINGS LISTED — AWAITING REVIEW**

### Screenshots captured

1. **DefaultWithLogo** — 4-section rail, 2-item flat panel, logo dot
2. **WithSidebarCollapse** — same as default, controlled mode
3. **WithItemIcons** — 3 items with leading 20px icons, active row accent
4. **WithNestedGroup (collapsed)** — Metrics group collapsed, chevron right
5. **WithNestedGroup (expanded)** — Metrics group open, left border, 3 children
6. **ActiveNestedItem** — "Weekly" active inside Metrics group, accent bg
7. **LongSidebarScroll** — 25 items, scrollbar visible, row density
8. **BloodworkReference** — 3-section flat, utility item at bottom
9. **Docs app** — real consumer, 4 sections, utility at bottom
10. **Bloodwork dashboard** (golden reference) — 7 sections, item icons, logo, `«` collapse

---

### Findings Table

| ID | Severity | Area | Expected | Actual | Screenshot | Blocks beta? | Recommended fix |
|----|----------|------|----------|--------|------------|--------------|-----------------|
| R2-01 | ~~high~~ **RESOLVED** | sidebar / title | Panel title matches bloodwork: "Lab Results" uses dark ink color, ~16px, strong visual weight, reads as a section heading | **Fixed:** Now `TYPE.headingM` + `tokens.ink`. Visually approved 2026-05-24. | WithAllIcons, WithoutItemIcons | No (resolved) | Implemented: `TYPE.headingM` + `tokens.ink` in panel header. |
| R2-02 | ~~high~~ **RESOLVED** | sidebar / collapse | Bloodwork uses `«` double-chevron-left — a compact, universally recognized "collapse panel" glyph | **Fixed:** Now `IconChevronDoubleLeft` size 20. Visually approved 2026-05-24. | WithAllIcons, WithoutItemIcons | No (resolved) | Implemented: `IconChevronDoubleLeft` replaces `IconPanelLeftContract`. |
| R2-03 | ~~high~~ **RESOLVED** | sidebar / active row | Active row uses neutral tokens, distinguishable from hover, with filled icon + weight as the "you are here" signal | **Fixed:** Now `tokens.bg` (selected bg) + `tokens.ink` (selected text) + weight 500. Accent tokens removed from active row. Visually approved 2026-05-24. | WithAllIcons, OneLevelNesting, MaxDepthNesting | No (resolved) | Implemented: `tokens.bg` + `tokens.ink` + weight 500. Accent reserved for intentional accent situations. |
| R2-04 | medium | sidebar / row height | Bloodwork panel items appear ~44px tall with generous vertical padding, creating comfortable scan density | DS rows have `minHeight: 36px` but actual rendered height with padding is ~36px. Compared to bloodwork's ~44px rows, the DS rows feel noticeably tighter. The difference is visible in BloodworkReference story vs. actual bloodwork | BloodworkReference, Bloodwork | No | Increase row padding to `SPACE[3] SPACE[3]` (12px 12px) or set `minHeight: LAYOUT.hitTarget` (40px) to match bloodwork comfort |
| R2-05 | medium | sidebar / nested children | Children (Daily, Weekly, Monthly) under an expanded group should be clearly subordinate but still readable. The left border helps but children text is very light | Child items use `tokens.textSubtle` (slate9) at 400 weight in default state. At 13px this is quite faint, especially compared to the parent group header. The indent + faint color + small text creates a readability concern | WithNestedGroup (expanded), ActiveNestedItem | No | Consider using `tokens.textMuted` (slate11) instead of `tokens.textSubtle` for unselected children, giving them more contrast while still being subordinate |
| R2-06 | medium | sidebar / nested border | The 2px left border uses `tokens.accentSubtle` (iris3). Combined with the accent active row (R2-03), the panel has unexpected purple accents that don't match the neutral gray palette of the bloodwork reference | Left border draws a vertical purple line in the sidebar which introduces color where the golden reference has none. If R2-03 is fixed (remove accent from active row), the purple border becomes the only accent color in an otherwise neutral panel | WithNestedGroup (expanded), ActiveNestedItem | No | If R2-03 is fixed, also change the border to `tokens.hairline` or `tokens.border` (neutral gray) to match the overall panel palette |
| R2-07 | medium | rail / logo | Bloodwork logo is a full brand mark ("D" drop shape) at ~32px with strong visual presence. Story `LogoMark` renders `IconLogo size={32}` but the icon itself is a small teardrop — at the top of the rail it reads as a decorative dot rather than a product mark | The logo dot, even at 32px, doesn't fill the 40×40 cell convincingly. It lacks the visual gravity of a real product mark. This is partly a story data issue but also affects how the component presents in docs | DefaultWithLogo, Bloodwork | No | Story concern — not a component bug. Consider rendering `IconLogo` at `size={36}` to fill more of the 40×40 cell, or improve the `IconLogo` SVG to have more visual mass |
| R2-08 | low | rail / docs app | Docs app rail has no logo, so the first rail button (`Overview`) sits at the very top of the rail with only 8px padding above it. This looks abrupt compared to bloodwork where the logo provides a visual anchor | Without a logo, the rail's top padding (SPACE[2] = 8px) creates a cramped top edge. The first button is very close to the rounded corner of the rail surface | Docs app | No | Not a component bug — the docs app should provide a logo. Could also consider adding a slightly larger top padding when no logo is present, but this might be over-engineering |
| R2-09 | low | sidebar / panel top padding | Panel container uses `padding: SPACE[3] SPACE[2]` (12px 8px top/sides). The 12px top padding before the header creates a small asymmetry — the header row itself adds 8px padding, so the first visible text starts ~20px from the top of the panel surface | Compared to bloodwork where "Lab Results" title appears to start at ~12-16px from the panel top, the DS panel title sits slightly lower. The visual gap between the rail's top and the panel's first content differs | DefaultWithLogo, Bloodwork | No | Consider reducing panel container top padding to `SPACE[2]` (8px) so the header starts closer to the top of the panel surface, matching bloodwork alignment |
| R2-10 | low | sidebar / scrollbar | In LongSidebarScroll, the native scrollbar is visible inside the panel. It works correctly but the scrollbar thumb is thick and visually heavy against the white panel | Native scrollbar is functional but could benefit from custom thin scrollbar styling for a polished feel. This is cosmetic only | LongSidebarScroll | No | Add thin custom scrollbar CSS (`scrollbar-width: thin` / `::-webkit-scrollbar` with 4px width). Defer to post-beta |

---

### Round 2 summary

| Severity | Count | IDs | Status |
|----------|-------|-----|--------|
| ~~**High (blocks beta)**~~ | ~~3~~ → 0 open | R2-01, R2-02, R2-03 | **All RESOLVED** — implemented and visually approved 2026-05-24 |
| **Medium** | 3 | R2-04, R2-05, R2-06 | Open — deferred refinements, do not block beta |
| **Low** | 4 | R2-07, R2-08, R2-09, R2-10 | Open — cosmetic, do not block beta |

### Key theme (historical — superseded by resolution)

> The Round 1 fixes overcorrected in two directions. All three high-severity
> findings (R2-01, R2-02, R2-03) were subsequently fixed:
>
> 1. **Accent color removed** — Active row reverted to `tokens.bg` + `tokens.ink`.
>    Purple accent treatment removed from navigation selection.
> 2. **Title fixed** — Panel title now uses `TYPE.headingM` + `tokens.ink` (full
>    contrast heading).
> 3. **Collapse icon simplified** — `IconPanelLeftContract` replaced with
>    `IconChevronDoubleLeft` (simple double-chevron glyph).
>
> All three fixes were visually approved on 2026-05-24 (Nohemi / owner review).
> The current RailNav visual direction is now the canonical reference —
> bloodwork remains a golden reference for overall patterns but the DS
> component is intentionally more mature/refined in specific areas.

---

## 8. Scroll/Overlay Foundation Compliance

> Reviewed: 2026-05-24 (commit `e349aa0`)
> Status: **PASS — all 6 checks**

| Catalog ID | Result | Evidence |
|---|---|---|
| `SC.SCROLL-PATTERN-VIOLATION` | PASS | Two-layer pattern: outer shell (L925) + inner scroll with `SCROLL.className` (L930). Panel nav same pattern (L478). |
| `SC.COMPONENT-SPECIFIC-SCROLLBAR` | PASS | No `railnav-scroll`, no `::-webkit-scrollbar`, no `scrollbar-width`. Uses `SCROLL.className` (L478, L930) + `SCROLL.css(tokens)` (L308). |
| `LAY.STACKING-CONTEXT-TRAP` | PASS | Rail surface has no `zIndex`. `Z.dropdown` only on overlays (tooltips L597/L753, overflow menu L919). `zIndex: 1` on decorative guide line (L1162) — no overlay trapping. |
| `LAY.VIEWPORT-UNSAFE-OVERLAY` | PASS | `useLayoutEffect` + `getBoundingClientRect()` (L863-889) with downward default, upward flip, maxHeight cap with scroll. |
| `LAY.OVERFLOW-MEASUREMENT-FRAGILE` | PASS | ResizeObserver on rail surface ref, subtracts sibling heights via separate refs. No measurement of overflow-constrained elements. |
| `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` | PASS | Nav wrapper has no overflow. `overflow: hidden` only on: panel animation wrapper (L419), panel card (L441), text ellipsis (L460), overflow menu outer shell (L925). None clip tooltips. |

RailNav passes Scroll/Overlay Foundation Compliance as of this review.

---

## 9. Maturity Recommendation (2026-05-25)

### Assessment

| Criterion | Status |
|-----------|--------|
| Visual QA — all blockers resolved | **PASS** (R2-01, R2-02, R2-03 implemented + approved) |
| Visual approval recorded | **PASS** (2026-05-24, 8 stories + docs app) |
| Foundation audit (scroll/overlay) | **PASS** (6/6 checks) |
| Technical gates (health:strict) | **PASS** (0B 0H 0M 0L) |
| Storybook build | **PASS** |
| Visual regression (136/136) | **PASS** |
| Consumer sync (2 active consumers) | **PASS** |
| Docs app build | **PASS** |
| Accessibility behavior validation | **PASS** — programmatic a11y tree + keyboard automation (2026-05-25) |

### Recommendation: **beta**

RailNav meets all beta promotion criteria:
- Visual QA approved (2026-05-24)
- Foundation audit passing (6/6)
- All technical gates clean (0 findings)
- Accessibility behavior validation complete (Playwright, 2026-05-25)
- Programmatic verification via Playwright accessibility tree confirms all
  ARIA attributes, keyboard navigation, and focus management working correctly

**Promote to `beta` in component registry.**

### Relationship to bloodwork golden reference

The 2026-05-24 visual approval establishes the current RailNav screenshots as the
canonical visual direction. Bloodwork remains a golden reference for overall
navigation patterns (rail + panel layout, icon sizing, density), but the DS
component is intentionally more mature/refined in specific areas:

- Multi-level nesting (3-level depth contract) — not present in bloodwork
- `IconChevronDoubleLeft` for collapse — clean implementation of the `«` pattern
- `TYPE.headingM` + `tokens.ink` for panel title — stronger heading treatment
- Neutral active row (`tokens.bg` + `tokens.ink`) — matches bloodwork intent

Future bloodwork updates should adopt the DS component, not the other way around.
