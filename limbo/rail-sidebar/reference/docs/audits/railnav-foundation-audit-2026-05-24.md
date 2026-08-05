# RailNav Foundation Audit

**Date:** 2026-05-24
**Component:** `src/gallery/RailNav.tsx` (1307 lines)
**Stories:** `src/gallery/RailNav.stories.tsx` (3 stories)
**Auditor:** Automated foundation audit
**Status:** `experimental`

---

## 1. Token Usage Audit — PASS (with findings)

**Files checked:** RailNav.tsx (all 1307 lines), RailNav.stories.tsx (all 420 lines)

| Check | Result | Notes |
|-------|--------|-------|
| Hardcoded hex colors | **PASS** | Zero `#rrggbb` values found |
| Hardcoded `rgba()`/`rgb()` | **PASS** | Zero inline color functions |
| Hardcoded font-family | **PASS** | All from `TYPE.*` tokens |
| Hardcoded font-size | **PASS** | All from `TYPE.*` spread |
| Hardcoded spacing | **PASS** | All spacing from `SPACE[n]` or `LAYOUT.*` |
| Hardcoded border-radius | **PASS** | All from `RADIUS.*` (see borderRadius finding F-5.1) |
| Raw `opacity:` property | **PASS** | Zero uses in RailNav.tsx |
| Primitive token (PALETTE) usage | **PASS** | Zero references to `PALETTE` |
| Light/dark token support | **PASS** | `useTokens()` consumed once at top; all sub-components receive `tokens` prop |
| Active/hover/pressed states | **PASS** | All use semantic tokens: `darkActiveBg`, `darkHoverBg`, `darkPressedBg`, `onDark`, `onDarkHover`, `onDarkSubtle` |
| Focus states | **PASS** | No custom focus overrides; inherits global `FOCUS_GLOBAL_CSS` |
| Disabled states | **N/A** | No disabled states implemented (not required for current API) |

### Finding F-1.1 — Stories `opacity: 0.5` (LOW)
**File:** [RailNav.stories.tsx](../src/gallery/RailNav.stories.tsx#L243)
**Line 243:** `opacity: 0.5` on story shell placeholder text
**Assessment:** Acceptable — this is demo placeholder content in Storybook, not a shipped component. However, it violates the "opacity via color alpha" principle.
**Severity:** LOW (story-only, not shipped)

---

## 2. Typography Audit — PASS (with findings)

**Token usage map:**

| Element | Token | File/Line | Correct? |
|---------|-------|-----------|----------|
| Panel title | `TYPE.headingM` | [L467](../src/gallery/RailNav.tsx#L467) | **YES** — 18px/500 Inter, appropriate for panel header |
| Nav item labels (flat) | `TYPE.bodyM` | [L987](../src/gallery/RailNav.tsx#L987) | **YES** — 14px/400 Inter, standard body text |
| Nested group headers | `TYPE.bodyM` | [L1176](../src/gallery/RailNav.tsx#L1176), [L1260](../src/gallery/RailNav.tsx#L1260) | **YES** |
| Overflow menu items | `TYPE.bodyS` | [L949](../src/gallery/RailNav.tsx#L949) | **YES** — 13px for compact menu items |
| Tooltips (logo, rail) | `TYPE.labelM` | [L604](../src/gallery/RailNav.tsx#L604), [L760](../src/gallery/RailNav.tsx#L760) | **YES** — 13px/500 for tooltip labels |
| Utility labels (stories) | Not applicable | Stories don't render utility labels | — |

### Finding F-2.1 — fontWeight overrides without TYPE modifier (MEDIUM)
**Lines:** [L991](../src/gallery/RailNav.tsx#L991), [L1181](../src/gallery/RailNav.tsx#L1181), [L1265](../src/gallery/RailNav.tsx#L1265)
**Pattern:** `fontWeight: selected ? 500 : 400` / `fontWeight: hasActiveChild ? 500 : 400`
**Issue:** These override the fontWeight from `...TYPE.bodyM` (which sets 400) using raw numeric values instead of `TYPE.medium.fontWeight` (500) and `TYPE.light.fontWeight` (400).
**Assessment:** The values are correct (500 = medium, 400 = regular), but they bypass the `TYPE.medium`/`TYPE.light` modifiers. If the weight scale ever changes, these won't update.
**Severity:** MEDIUM — semantic drift risk

### Finding F-2.2 — Typography hierarchy not documented (HIGH)
**Issue:** No documentation maps which TYPE token is used for which RailNav element. The interaction-patterns.md documents states and behavior but not the typography bindings.
**Severity:** HIGH — consumers cannot verify correct token usage without reading source code

---

## 3. Iconography Audit — PASS

| Check | Result | Notes |
|-------|--------|-------|
| All icons from DS icon system | **PASS** | Imports: `IconEllipsis`, `IconChevronDoubleLeft`, `IconChevronDown`, `IconLogo` from `../icons` |
| No third-party icon libs | **PASS** | Zero imports from lucide, react-icons, heroicons, etc. |
| Icons use `currentColor` | **PASS** | All icon calls pass `color="currentColor"` |
| Icon sizes tokenized/named | **PASS** | 20px (nav icons — AGENTS.md rule), 16px (disclosure chevrons — approved tier) |
| `filled` prop wired correctly | **PASS** | All interactive icons pass `filled={condition}` |
| Filled state branches | **PASS** | Verified all 4 icons have Regular/Filled ternaries in `fluent.tsx` |
| Logo slot documented | **PASS** | Default `<IconLogo />`, custom logo constraints in interaction-patterns.md |

### Finding F-3.1 — Icon size magic numbers (LOW)
**Lines:** `size={20}` at L741, L827, L954, L1007, L1059, L1197, L1281 and `size={16}` at L1206, L1290
**Assessment:** These are correct per the icon size tier system (20px = nav icons, 16px = disclosure chevrons). However, they are raw literals, not named constants. The AGENTS.md documents these tiers but no `ICON_SIZE` constant exists.
**Severity:** LOW — values are correct and stable, but a named constant would prevent drift

### Finding F-3.2 — Tooltip `height: 24` and `padding: "0 6px"` (LOW)
**Lines:** [L597-598](../src/gallery/RailNav.tsx#L597), [L753-754](../src/gallery/RailNav.tsx#L753)
**Assessment:** Tooltip dimensions are component-internal constants, not mapped to LAYOUT or SPACE tokens. `24` is not a SPACE scale value (closest: SPACE[5]=24 — but that's coincidental; this is a height, not spacing). `6px` padding is not on the SPACE grid.
**Severity:** LOW — tooltip is a transient flyout, not a primary interactive element. These are acceptable as internal constants.

---

## 4. Stroke / Border / Line Audit — PASS (with findings)

| Check | Result | Notes |
|-------|--------|-------|
| Borders use semantic tokens | **PASS** | All borders use `tokens.darkBorderStrong`, `tokens.darkBorder`, `tokens.border` |
| Focus rings use approved tokens | **PASS** | Inherited from `FOCUS_GLOBAL_CSS` (accent-based) |
| Nested guide line uses semantic token | **PASS** | `background: tokens.border` at [L1102](../src/gallery/RailNav.tsx#L1102) |
| Line widths named/tokenized | **SEE F-4.1** | Guide line is `1px`, borders are `1.5px` and `0.5px` |
| No mismatched stroke widths | **PASS** | Icon strokes (fill-based, no stroke) vs UI lines (border) are separate systems |

### Finding F-4.1 — Border width magic numbers (MEDIUM)
**Locations and values:**
- `1.5px solid transparent/darkBorderStrong` — Rail buttons ([L696-697](../src/gallery/RailNav.tsx#L696)), overflow button ([L815](../src/gallery/RailNav.tsx#L815)), story utility buttons ([stories L273, L308](../src/gallery/RailNav.stories.tsx#L273))
- `0.5px solid darkBorderStrong` — Tooltips ([L602](../src/gallery/RailNav.tsx#L602), [L758](../src/gallery/RailNav.tsx#L758)), overflow menu ([L873](../src/gallery/RailNav.tsx#L873))
- `1px solid transparent/darkBorderStrong` — Overflow menu items ([L945](../src/gallery/RailNav.tsx#L945))
- `1px` width — Nested guide line ([L1101](../src/gallery/RailNav.tsx#L1101))
- `4px` — Scrollbar width and thumb border-radius ([L307, L314](../src/gallery/RailNav.tsx#L307))

**Assessment:** Three distinct border width values (0.5, 1, 1.5) are used for different visual roles but are not named as component constants. This is a potential source of inconsistency for consumers building custom rail-adjacent components.
**Severity:** MEDIUM — functional, but should be documented as named constants

---

## 5. Layout Foundation Audit — PASS (with findings)

| Check | Result | Token/Constant |
|-------|--------|----------------|
| Rail width | **PASS** | `LAYOUT.railW` (56) at [L327](../src/gallery/RailNav.tsx#L327) |
| Button size | **PASS** | `LAYOUT.hitTarget` (40) used for all buttons |
| Rail padding | **PASS** | `SPACE[2]` (8) uniform |
| Logo gap | **PASS** | `marginBottom: SPACE[3]` (12) on LogoSlot |
| Panel width | **PASS** | `LAYOUT.panelW` (256) at [L428, L446](../src/gallery/RailNav.tsx#L428) |
| Panel gap | **PASS** | `LAYOUT.panelGap` (12) at [L429](../src/gallery/RailNav.tsx#L429) |
| Panel spacing | **PASS** | `SPACE[2]` (8) panel container padding |
| Row height | **PASS** | `LAYOUT.hitTargetSm` (36) min-height for panel items |
| Nested indent | **PASS** | Named formula: `SPACE[3] + depth * SPACE[5]` |
| `border-box` | **PASS** | Applied on rail surface, overflow button, all hit-target buttons |
| Viewport containment | **PASS** | Documented in interaction-patterns.md; aside has no fixed height |
| Content-hugging | **PASS** | Rail uses `minWidth: LAYOUT.railW`, doesn't stretch |

### Finding F-5.1 — Scrollbar border-radius `4px` in CSS string (LOW)
**Line:** [L314](../src/gallery/RailNav.tsx#L314)
**Issue:** `border-radius: 4px` in the scrollbar `<style>` block is a raw value, not from RADIUS.
**Assessment:** This is a WebKit scrollbar pseudo-element style inside a scoped CSS string — it cannot use JS token references inline. 4px is a reasonable scrollbar thumb rounding. RADIUS tokens are 6, 8, 12, 99 — none match. This is an acceptable internal constant.
**Severity:** LOW

### Finding F-5.2 — Overflow menu `minWidth: 160` (LOW)
**Line:** [L881](../src/gallery/RailNav.tsx#L881)
**Issue:** Not mapped to any LAYOUT constant.
**Assessment:** This is a reasonable component-internal constant for a flyout menu minimum width. It doesn't align to the SPACE grid (closest: SPACE[9]=64, far too small). Acceptable as-is.
**Severity:** LOW

### Finding F-5.3 — FOOTER_SLOT / ITEM_SLOT constants (LOW)
**Lines:** [L127-128](../src/gallery/RailNav.tsx#L127)
**Issue:** `FOOTER_SLOT = LAYOUT.hitTarget + SPACE[1]` (44) and `ITEM_SLOT = LAYOUT.hitTarget + SPACE[1]` (44) are defined but `FOOTER_SLOT` is no longer used (the overflow computation now uses ResizeObserver). Dead constant.
**Assessment:** `FOOTER_SLOT` is dead code since the overflow refactor. `ITEM_SLOT` is still used in the ResizeObserver-based budget calculation.
**Severity:** LOW — cleanup opportunity

### Finding F-5.4 — `SURFACE_PAD_V` and `ASIDE_PAD_V` constants are dead (LOW)
**Lines:** [L126](../src/gallery/RailNav.tsx#L126)
**Issue:** `SURFACE_PAD_V = SPACE[2] * 2` (16) and `ASIDE_PAD_V = SPACE[2] * 2` (16) were used in the old window.innerHeight overflow calculation. No longer referenced.
**Severity:** LOW — dead code cleanup

---

## 6. Accessibility Audit — PASS (with findings)

| Check | Result | Notes |
|-------|--------|-------|
| Rail `<nav>` has accessible label | **PASS** | `aria-label={railAriaLabel}` default "Main navigation" at [L361](../src/gallery/RailNav.tsx#L361) |
| Panel `<nav>` has accessible label | **PASS** | `aria-label="{section} items"` at [L488](../src/gallery/RailNav.tsx#L488) |
| Active route uses `aria-current` | **PASS** | `aria-current="page"` on active rail button at [L723](../src/gallery/RailNav.tsx#L723) |
| Collapse button accessible name | **PASS** | `aria-label="Collapse sidebar"` at [L1041](../src/gallery/RailNav.tsx#L1041) |
| Logo accessibility | **PASS** | Decorative: `aria-hidden="true"` ([L623](../src/gallery/RailNav.tsx#L623)); Interactive: `aria-label={label}` ([L648](../src/gallery/RailNav.tsx#L648)) |
| Nested group `aria-expanded` | **PASS** | PanelGroup ([L1258](../src/gallery/RailNav.tsx#L1258)), NestedSubGroup ([L1174](../src/gallery/RailNav.tsx#L1174)) |
| Group semantic relationship | **PASS** | `role="group"` + `aria-labelledby` at [L1251](../src/gallery/RailNav.tsx#L1251) |
| Overflow menu ARIA | **PASS** | `role="menu"`, `aria-haspopup="menu"`, `aria-expanded`, `role="menuitem"` |
| Keyboard: Escape | **PASS** | Closes overflow first, then panel ([L257-263](../src/gallery/RailNav.tsx#L257)) |
| Focus return after collapse | **PASS** | Returns to rail button via `data-section-id` ([L177-183](../src/gallery/RailNav.tsx#L177)) |
| Reduced motion | **PASS** | `useReducedMotion()` hook, all transitions wrapped in `transition()` helper |
| Tooltips accessible | **PASS** | `role="tooltip"`, `pointer-events: none` |

### Finding F-6.1 — No `aria-current` on panel items (MEDIUM)
**Issue:** Rail buttons use `aria-current="page"` for the active section, but the active *panel item* has no `aria-current="true"` or `aria-selected`. A screen reader cannot distinguish the selected panel item from siblings by role alone (it only differs visually by background + font weight).
**Severity:** MEDIUM — usable but incomplete for screen reader navigation

### Finding F-6.2 — NestedSubGroup missing `role="group"` (MEDIUM)
**Issue:** Top-level `PanelGroup` uses `role="group"` + `aria-labelledby`, but `NestedSubGroup` (recursive child groups) renders a plain `<div>` with just `<button aria-expanded>`. The group relationship at depth > 1 is not semantic.
**Severity:** MEDIUM — depth-1 groups are correct, deeper groups lack semantics

### Finding F-6.3 — Keyboard navigation is Tab-based only (LOW)
**Issue:** The interaction-patterns.md documents `Tab` for sequential focus but no arrow-key navigation within the rail or panel. WAI-ARIA APG recommends arrow keys for toolbar/tablist-like patterns. The current Tab-based approach works but is more verbose for users with many items.
**Assessment:** Tab-based is valid per WAI-ARIA; arrow keys are a progressive enhancement. Not a blocker.
**Severity:** LOW

### Finding F-6.4 — Collapse button label is static (LOW)
**Issue:** `aria-label="Collapse sidebar"` is hardcoded. When the panel is collapsed, there is no "Expand sidebar" equivalent because the button disappears with the panel. The rail button's click already re-opens the panel, so this is functionally fine.
**Severity:** LOW

---

## 7. API Audit — PASS (with findings)

| Check | Result | Notes |
|-------|--------|-------|
| Props clearly named | **PASS** | All props in `RailNavProps` are descriptive |
| Deprecated `footer` documented | **PASS** | JSDoc `@deprecated Use utilityItems instead` at [L100](../src/gallery/RailNav.tsx#L100) |
| Controlled mode works | **PASS** | `panelOpen` + `onPanelChange` supported |
| Uncontrolled mode works | **PASS** | Omitting `panelOpen` uses internal state |
| Nesting limit documented | **PASS** | Docs updated to multi-level (max 3 recommended). See F-7.1 RESOLVED. |
| Custom logo constraints documented | **PASS** | interaction-patterns.md Logo slot section |
| Consumer examples | **PASS** | interaction-patterns.md has import snippet |
| Types exported | **PASS** | `RailNavProps`, `RailSection`, `RailPanelItem`, `RailPanelChild` in gallery/index.ts |

### Finding F-7.1 — ~~Unlimited nesting not enforced by types~~ RESOLVED
**Issue:** `RailPanelChild` has `children?: RailPanelChild[]` — this allows arbitrary recursion. The interaction-patterns.md says "One level" ([L240](../docs/interaction-patterns.md#L240): "Exactly one level. `RailPanelChild` has no `children` — impossible by type.") — **this is now false**. The type allows unlimited nesting and the code renders it via `NestedSubGroup` recursion.
**Resolution:** Multi-level nesting is now intentional. Docs updated across interaction-patterns.md, navigation-rail.md, and railnav-visual-qa.md. Recommended design limit: 3 levels. Stories cover flat, 1-level, 2-level, and 3-level (max depth).

### Finding F-7.2 — Misuse cases not documented (LOW)
**Issue:** No "don't" examples in the API docs (e.g., "don't pass 50 sections", "don't use for non-navigation purposes", "don't nest deeper than 3 levels").
**Severity:** LOW

---

## 8. Documentation Audit — PARTIAL PASS

| Required doc | Exists? | Location | Up-to-date? |
|--------------|---------|----------|-------------|
| RailNav anatomy | **YES** | interaction-patterns.md Architecture section | Partially stale |
| Design tokens used | **NO** | — | **MISSING** — no token inventory |
| Typography roles | **NO** | — | **MISSING** — not documented |
| Icon rules | **YES** | interaction-patterns.md Item icons section | **STALE** — says "18px" but code uses 20px |
| Logo slot rules | **YES** | interaction-patterns.md Logo slot section | Current |
| Rail states | **YES** | interaction-patterns.md Rail icon visual states | Current |
| Sidebar states | **YES** | interaction-patterns.md Secondary panel item visual states | Current |
| Nested group rules | **YES** | interaction-patterns.md Multi-level nested groups | Current — updated to multi-level |
| Collapse behavior | **YES** | interaction-patterns.md Panel collapse section | Current |
| Overflow behavior | **YES** | interaction-patterns.md Rail overflow section | **STALE** — budget formula references old window-based calculation |
| Accessibility behavior | **YES** | interaction-patterns.md Accessibility requirements | Current |
| Do/don't examples | **YES** | interaction-patterns.md Do/Don't table | Current |
| Consumer recipe | **YES** | interaction-patterns.md Reusable component section | Current |
| Migration guidance | **NO** | — | **MISSING** — no guide from custom sidebar to RailNav |

### Finding F-8.1 — Stale docs: "flex spacer" footer model (HIGH)
**Issue:** Three references in interaction-patterns.md describe the old flex-spacer layout model:
- [L100](../docs/interaction-patterns.md#L100): "Footer items are pushed to the bottom via a flex spacer"
- [L112](../docs/interaction-patterns.md#L112): `Flex spacer <div style={{ flex: 1 }} /> between </nav> and footer`
- [L216](../docs/interaction-patterns.md#L216): "Bottom of rail, after flex spacer, above deprecated `footer`"

**Reality:** The current implementation uses a `flex: 1; overflow: hidden` nav wrapper + `flexShrink: 0` footer block (VS Code activity bar model). No spacer div exists.
**Severity:** HIGH — consumers following the docs would build the wrong layout model

### Finding F-8.2 — Stale docs: overflow budget formula (MEDIUM)
**Issue:** [L130-133](../docs/interaction-patterns.md#L130) documents:
```
Available height = 100dvh - aside padding (16px) - surface padding (16px) - footer (44px if present)
```
**Reality:** The current implementation uses a `ResizeObserver` on the nav wrapper container. The old `window.innerHeight`-based math is removed.
**Severity:** MEDIUM — the concept is correct but the implementation details are wrong

### Finding F-8.3 — Stale docs: icon size "18px" (MEDIUM)
**Issue:** [L256](../docs/interaction-patterns.md#L256) Item icons section says "Size: 18px (standard DS icon tier)"
**Reality:** All panel item icons use `size={20}`. The AGENTS.md specifies 20px for all navigation icons.
**Severity:** MEDIUM — incorrect value in docs

### Finding F-8.4 — ~~Stale docs: nesting depth claim~~ RESOLVED
**Issue:** [L240](../docs/interaction-patterns.md#L240) says "Exactly one level. `RailPanelChild` has no `children` — impossible by type."
**Reality:** `RailPanelChild.children` exists, multi-level nesting works, stories demonstrate 2+ levels.
**Resolution:** Docs rewritten to document multi-level nesting as intentional capability with 3-level recommended max.

### Finding F-8.5 — Missing token inventory (HIGH)
**Issue:** The `components.json` registry entry for RailNav has no `tokens_used` array. Other components (e.g., Segmented) list their token dependencies. There is no standalone document mapping token → RailNav element.
**Severity:** HIGH — blocks consumer ability to audit their own token consistency

### Finding F-8.6 — Missing typography binding table (MEDIUM)
**Issue:** No document maps which TYPE token is used for which RailNav element. See Finding F-2.2.
**Severity:** MEDIUM

### Finding F-8.7 — Missing migration guide (LOW)
**Issue:** No `docs/migrations/` guide for consumers moving from custom rail/sidebar implementations to RailNav.
**Severity:** LOW — acceptable for experimental status, required for beta

---

## 9. Audit / Protocol Gap Analysis

### Current skill coverage

| Skill | Can catch RailNav drift? | Gap? |
|-------|--------------------------|------|
| `token-audit` | Checks token usage in `src/` | No gap for color/spacing tokens |
| `icon-audit` | Checks icon source, filled prop, size tiers | No gap |
| `component-builder` | Scaffolds new components | N/A for existing |
| `smell` | Code smells, magic numbers | Should flag fontWeight overrides (F-2.1) |
| `visual-qa` | Visual comparison against golden reference | No gap |
| `a11y-audit` | Accessibility checks | Should flag missing aria-current on items (F-6.1) |

### Recommended new catalog IDs

| ID | Category | Description |
|----|----------|-------------|
| `TK.FONTWEIGHT-BYPASS` | token-audit | `fontWeight` literal used instead of TYPE modifier (500→TYPE.medium, 400→TYPE.light) |
| `TK.BORDER-WIDTH-MAGIC` | token-audit | Border width literal (0.5px, 1px, 1.5px) without named constant |
| `CP.DEAD-CONSTANT` | smell | Declared constant no longer referenced in code |
| `CP.DOCS-IMPL-MISMATCH` | smell | Documentation claims contradict actual implementation |
| `CP.MISSING-TOKEN-INVENTORY` | component-builder | Component in registry without `tokens_used` array |
| `CP.MISSING-TYPOGRAPHY-MAP` | component-builder | Component without documented typography bindings |
| `A11.MISSING-ARIA-CURRENT-ITEM` | a11y-audit | Active item in list/menu without aria-current or aria-selected |
| `A11.NESTED-GROUP-NO-ROLE` | a11y-audit | Nested disclosure group rendered without role="group" |

### AGENTS.md governance updates needed

1. Add RailNav to the Component Maturity Model example table
2. Add RailNav to "Known golden references" table (when golden reference is established)
3. Document that multi-level nesting is now a supported pattern (or restrict it)

---

## 10. Final Report

### Summary

| Section | Verdict | Blockers | Findings |
|---------|---------|----------|----------|
| 1. Token usage | **PASS** | 0 | 1 LOW (story opacity) |
| 2. Typography | **PASS** | 0 | 2 findings (1 MEDIUM, 1 HIGH) |
| 3. Iconography | **PASS** | 0 | 2 LOW |
| 4. Stroke/border/line | **PASS** | 0 | 1 MEDIUM |
| 5. Layout foundation | **PASS** | 0 | 4 LOW |
| 6. Accessibility | **PASS** | 0 | 4 findings (2 MEDIUM, 2 LOW) |
| 7. API | **PASS** | 0 | 2 findings (1 MEDIUM, 1 LOW) |
| 8. Documentation | **PARTIAL** | 0 | 7 findings (3 HIGH, 3 MEDIUM, 1 LOW) |
| 9. Audit protocols | **GAP** | 0 | 8 new catalog IDs proposed |

### Hardcoded values found (all acceptable)

| Value | Location | Acceptable? | Reason |
|-------|----------|-------------|--------|
| `fontWeight: 500 / 400` | PanelItem, NestedSubGroup, PanelGroup | **YES but should use TYPE modifiers** | Correct values, semantic drift risk |
| `height: 24`, `padding: "0 6px"` | Tooltip flyouts | **YES** | Internal component constant, transient element |
| `width: 6, height: 6` | Overflow indicator dot | **YES** | Decorative, below minimum token granularity |
| `minWidth: 160` | Overflow menu | **YES** | Internal component constant |
| `border-radius: 4px` | Scrollbar thumb (CSS string) | **YES** | Cannot use JS tokens in CSS pseudo-elements |
| `1.5px`, `0.5px`, `1px` | Various borders | **YES but should be named constants** | Three distinct tiers, undocumented |
| `size={20}`, `size={16}` | Icons | **YES** | Matches icon size tier system |
| `left: "calc(100% + 12px)"` | Tooltip position | **YES** | Positional offset, not a spacing token |
| `left: "calc(100% + 8px)"` | Overflow menu position | **YES** | Same |

### Named constants (correctly defined)

| Constant | Value | Derived from | Status |
|----------|-------|--------------|--------|
| `SURFACE_PAD_V` | 16 | `SPACE[2] * 2` | **DEAD** — no longer referenced |
| `ASIDE_PAD_V` | 16 | `SPACE[2] * 2` | **DEAD** — no longer referenced |
| `FOOTER_SLOT` | 44 | `LAYOUT.hitTarget + SPACE[1]` | **DEAD** — no longer referenced |
| `ITEM_SLOT` | 44 | `LAYOUT.hitTarget + SPACE[1]` | **ALIVE** — used in ResizeObserver budget |

### Promotion assessment

| Gate | Status |
|------|--------|
| Token foundation | **PASS** |
| Icon foundation | **PASS** |
| Layout foundation | **PASS** |
| Accessibility (BLOCKER findings) | **PASS** — no blockers |
| Accessibility (HIGH findings) | **PASS** — no HIGH findings |
| Documentation completeness | **BLOCKED** — 3 HIGH findings (stale docs, missing token inventory, nesting mismatch) |
| Visual baseline | **NOT YET** — baselines not approved |
| DQA golden reference | **NOT YET** — golden reference comparison not performed |

### Verdict

**RailNav should remain `experimental`.**

The component foundation (tokens, icons, layout, a11y) is solid. Zero BLOCKERs. The code is well-structured and follows DS principles correctly.

**To move to `beta`, resolve:**
1. **F-8.1** — Update interaction-patterns.md to reflect the VS Code activity bar layout model (no more flex spacer)
2. **F-8.2** — Update overflow budget formula documentation
3. **F-8.3** — Fix icon size from "18px" to "20px" in docs
4. **F-8.4** — Resolve nesting depth: update docs to say multi-level OR restrict the type
5. **F-8.5** — Add `tokens_used` to components.json registry entry
6. **F-2.1** — Replace `fontWeight: 500/400` with `TYPE.medium.fontWeight`/`TYPE.light.fontWeight`
7. **F-6.1** — Add `aria-current` or equivalent to active panel item
8. Clean up dead constants (F-5.3, F-5.4)

**Nice-to-have (not blocking beta):**
- F-4.1 — Name border width constants
- F-6.2 — Add `role="group"` to NestedSubGroup
- F-7.2 — Document misuse cases
- F-8.7 — Migration guide (required for stable, not beta)
