> Working document for the Rail Sidebar Limbo transformation. Produced by the Intake/Dissection agent
> (read-only). This is the item-by-item divergence list the human must decide on before the Build agent
> proceeds, per LIMBO-PROTOCOL-LOG.md. Keep this file until Rail Sidebar ships; delete alongside the
> protocol log at that point.
# Limbo Intake / Dissection Report — RailNav

**Protocol role:** Intake / Dissection agent (read-only)
**Date:** 2026-08-05
**Subject:** `limbo/rail-sidebar/reference/` — RailNav from `MiguelMyersMS/design-system`
**Reconciliation target:** `@bidezine/system` (this repo)

---

## 1. Component / Experience Inventory

Every distinct sub-component and interactive behavior found in `RailNav.tsx`, `RAILNAV-BEHAVIOR-CONTRACT.md`, `railnav.spec.md`, and the stories. One line each.

| # | Name | What it does |
|---|---|---|
| 1 | **Rail surface** | Full-height 54px dark-navy icon column (`tokens.darkSurface`, `LAYOUT.railW`). The outer wrapper (`<aside>`) owns flex layout, z-index stacking, and reduced-motion state. |
| 2 | **LogoSlotDark** | 38×38 logo slot pinned to the top of the rail; defaults to `<IconLogo />`; becomes an interactive button with tooltip when `onLogoClick` is supplied; suppressed entirely when `logo={null}`. |
| 3 | **RailButtonDark** | Individual dark-surface icon button; four interactive states (rest/hover/browsing/active) with distinct backgrounds (`darkHoverBg`/`darkActiveBg`/`darkPressedBg`), icon colors (`onDarkSubtle`/`onDarkHover`/`onDark`), and a `filled` icon toggle; shows a right-side tooltip when hovered/focused and NOT active/browsing/disabled. |
| 4 | **ResizeObserver overflow budget** | Measures the rail's `clientHeight` at runtime, subtracts rail padding + measured logo height + measured footer height (capped at `FOOTER_MAX_HEIGHT`), and floors `navBudget / ITEM_SLOT` to compute how many top sections fit. |
| 5 | **Overflow "More" trigger (OverflowTriggerButton)** | 38×38 dark-surface button with `IconEllipsis`; renders only when top sections exceed the computed max; shows a 6×6 `tokens.onDark` indicator dot at top-right when the active section is buried and the menu is closed. |
| 6 | **OverflowMenu** | Radix `DropdownMenu.Root` (non-modal, `modal={false}`) wrapping buried sections; opens to the RIGHT of the trigger via `side="right" align="start"`; `position:fixed` portal; internally scrollable with conditional scrollbar gutter; height-capped to Radix-measured available height. |
| 7 | **OverflowMenuItem** | Per-row entry in the overflow menu; reproduces the RailMenu per-state contract (dark surface, `bodyM`→`labelL` weight on active, browsing ring, filled icon on hover/browsing/active). |
| 8 | **FooterSlot** | Pinned bottom zone inside the rail (`flexShrink: 0`); renders `utilityItems`, `footer`, and `footerSections` in order; Settings auto-sorted to the bottom-most slot; hard-capped at 3 icons via `maxHeight`; never feeds the overflow menu. |
| 9 | **SidebarPanel (built-in secondary panel)** | Collapsible 300px-default light-surface panel; animates `width: 0 → panelWidth` + `margin-left: 0 → LAYOUT.panelGap` over `MOTION.medium / easeOut`; resizable by drag; suppressible via `suppressBuiltinPanel`. |
| 10 | **Panel header** | Top section of the panel with section icon (20×20), title (`TYPE.headingS`, `tokens.ink`), optional subtitle (`TYPE.labelM`, `tokens.textSubtle`, wraps to multiple lines), panel-header menu trigger, and collapse button. |
| 11 | **PanelHeaderMenuButton** | 28×28 ellipsis icon button; opens a Radix `DropdownMenu.Root` (non-modal, `modal={false}`) that flips UP when short on space below; light-surface visual model; only renders when `panelMenuItems` are supplied. |
| 12 | **PanelMenuRow** | Individual row in the panel-header actions menu; supports `checked` (bgSubtle + checkmark + weight 500), `danger` (statusRedText), and `disabled` variants; checked rows use `DropdownMenu.CheckboxItem` for real `aria-checked`. |
| 13 | **Search bar** | Borderless input row inside the panel (only when `searchable`); `IconSearch` lead icon (color reflects empty/filled state); `ClearButton` with reserved 24×24 slot; Escape clears query and `stopPropagation`s to avoid closing the panel; controlled or uncontrolled value. |
| 14 | **NavRowShell (shared row body)** | Single source of visual row logic for every panel row type; handles all states: rest (`transparent`/`textMuted`), hover (`hoverBg`/`ink`), active-collapsed (filled `tokens.ink` background + `onInk` label), active-expanded (transparent + `ink` label), disabled (`textDisabled`). |
| 15 | **PanelItem (leaf route row)** | Renders a leaf navigation row by delegating to `NavRowShell`; fires `onNavigate` on click; `aria-current="page"` when selected. |
| 16 | **PanelGroup (disclosure group row)** | Top-level disclosure toggle row; owns `Collapse` animation of its children; delegates header visuals to `NavRowShell`. |
| 17 | **NestedSubGroup (recursive nested group)** | Same as PanelGroup but for children at any depth; warns when `depth > MAX_SUPPORTED_DEPTH (3)`; indented via `NavIndentLine` atoms in each row. |
| 18 | **NestedChildren (recursive child list)** | Renders a list of child rows or further `NestedSubGroup`s at a given depth; `overflow: clip` clips `NavIndentLine` bleed at group boundaries. |
| 19 | **NavIndentLine** | Per-row visual indentation line atom; renders as a hairline vertical bar at the appropriate depth; at most 2 indent lines visible (depth capped at 2 for visual density). |
| 20 | **Collapse animation** | Custom `<Collapse>` component from `../motion`; animates `grid-template-rows: 0fr → 1fr` + opacity over a `collapse` preset; on close, children are **unmounted** after `duration + 50`ms (deterministic DOM cleanup); instant under reduced motion. |
| 21 | **Panel resize handle** | `role="separator"` drag target on the panel's right edge; 3×32 pill grip (`tokens.hairline` at rest, `tokens.ink` while dragging); clamps width to `[240px, viewportMax]`; body cursor + userSelect locked during drag. |
| 22 | **expandedGroups state machine** | Single lifted `Set<string>` for group expansion at ALL depths; auto-seeds the full path to `activeItem` ONCE per active item; never re-opens a group the user collapsed; driven by expand-all / collapse-all panel menu actions; `defaultExpandedGroups` prop seeds initial state. |
| 23 | **Search/filter** | Recursive `filterRailItems` function keeps a node if its label matches (with all children) or a descendant matches; surviving groups are force-expanded while searching; empty query returns the tree unchanged. |
| 24 | **Focus management** | Focus returns to the originating rail button when the panel collapses; keyboard-only focus rings (suppressed on mouse click via `onMouseDown preventDefault`); Escape at the `<aside>` level closes the overflow menu first, then the panel. |
| 25 | **Controlled vs uncontrolled panel open state** | `panelOpen` / `onPanelChange` props; when controlled panel closes externally, internal state resets to null so the next rail click opens rather than re-toggles closed. |
| 26 | **Leaf nav (childless section)** | A section with `items: []` becomes a direct navigation button: clicking fires `onNavigate(sectionId, sectionId)` and closes any open panel instead of peeking an empty panel. |
| 27 | **Badge atom (nav + overflow)** | `RailBadge` type: bare string → neutral pill; `{ label, variant: "neutral" | "info" }` → accented pill. Rendered on section rail buttons (only visible in overflow menu), on panel rows. Stays `atomSurface="atom"` (light neutral) in ALL row states including the dark active row. |
| 28 | **"Coming soon" row** | Disabled + leading chevron even with no children; signals a future expandable group; non-interactive. |
| 29 | **prefers-reduced-motion** | `useReducedMotion()` hook; all transitions resolve to `"none"` when preference is set; children unmount instantly in `Collapse`; panel reveal is instant. |
| 30 | **Tooltip (rail/logo)** | Custom tooltip: positioned to the right of the rail button; suppressed while browsing/active/disabled; does NOT use `aria-describedby` (avoids double-announcement since tooltip text = aria-label). |
| 31 | **Active-in-overflow indicator dot** | 6×6 `tokens.onDark` circular dot at top-right of the More trigger; shows only when `activeInOverflow && !overflowOpen`. |
| 32 | **`suppressBuiltinPanel` mode** | Keeps all panel toggle state and `onPanelChange` callbacks live while suppressing built-in panel rendering; for consumers who want to render an external panel driven by `onPanelChange`. |
| 33 | **`panelTitle` override** | Rail button tooltip always uses `section.label`; panel header title uses `section.panelTitle` when set, falling back to `section.label`. |
| 34 | **Hairline dividers** | Two 0.5px `tokens.hairline` dividers: one between panel header and nav (always present), one below the search bar (only when `searchable`). |

---

## 2. Divergence List — Itemized

Format per item: **what RailNav does/uses** (with citation) · **bidezine status** (equivalent or not).

---

### CATEGORY A: Icons

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| A-1 | `IconEllipsis` — 20px, `filled` toggle, used as the "More" button and panel-header ellipsis | `RailNav.tsx:31`, `RailNav.tsx:1173`, `RailNav.tsx:1666` | `MoreHorizontalIcon` exists in `icons/manifest.json` → `more_horizontal_20_regular`. **BUT**: bidezine has no `filled` variant and no `filled` prop on any icon. The hover/active fill interaction is impossible without it. See A-9. |
| A-2 | `IconChevronDown` — 16px, `filled` toggle, used as disclosure chevron in NavRowShell | `RailNav.tsx:31`, `RailNav.tsx:1500` | `ChevronDownIcon` exists in manifest → `chevron_down_20_regular`. Same `filled` prop problem as A-1. Also: origin uses `size={16}` inside a 20×20 slot; bidezine icons are all authored at 20px viewBox. |
| A-3 | `IconLogo` — custom bidezine product mark; renders as default logo slot content | `RailNav.tsx:31`, `RailNav.tsx:517` | Not in bidezine `icons/manifest.json`. This is the brand/product mark. **NEEDS HUMAN DECISION**: should a bidezine logo icon be added to the manifest (as a `custom` entry like `AudioLinesIcon`)? Or does the consumer always pass `logo` explicitly and no default is provided? |
| A-4 | `IconCheckmark` — 16px (no `filled` used), shown as checked-row indicator in PanelMenuRow | `RailNav.tsx:31`, `RailNav.tsx:1851` | `CheckIcon` exists in manifest → `checkmark_20_regular`. Used without `filled` prop here (static). **Clean equivalent** — but the 20px viewBox at `size={16}` scaling needs to be considered. |
| A-5 | `IconSearch` — 16px, used in search bar lead icon; no `filled` toggle (color changes only) | `RailNav.tsx:31`, `RailNav.tsx:939` | `SearchIcon` exists in manifest → `search_20_regular`. Used without filled toggle. **Effectively clean equivalent**, but the `size` prop and `color` prop differ from bidezine icon API (bidezine icons take `className` only, not `size`/`color` props). |
| A-6 | `IconDismiss` — used inside `ClearButton` sub-component (not directly in `RailNav.tsx`) | Origin sub-component `ClearButton.tsx` (not in reference) | `XIcon` exists in manifest → `dismiss_20_regular`. **NEEDS HUMAN DECISION** on what `ClearButton` is replaced with — see sub-component C-6 below. |
| A-7 | `IconChevronDoubleLeft` — 20px, `filled` toggle; used as the panel collapse button (ExpandButton) | `railnav-token-conformance-2026-06-10.md` (MEDIUM #3); `visual-qa-railnav-2026-05-24.md` Row R2-02 | **No match in bidezine manifest**. `chevron_double_left_20_regular` is not listed in `icons/manifest.json`. bidezine has `ChevronLeftIcon` (single chevron). **NEEDS HUMAN DECISION**: (a) add `chevron_double_left_20_regular` to manifest, (b) use `ChevronLeftIcon` as a one-chevron substitute, or (c) user picks a different Fluent icon. |
| A-8 | Consumer-supplied section icons (structural icons are the consumer's responsibility, but RailNav uses them at `size={20}` with `filled` toggle in both rail and panel header) | `RailNav.tsx:844`, `RailNav.tsx:1368`, `RailNav.tsx:1509` | Any icon a consumer passes as a section `icon` field will be used with `filled={active || hovered || ...}` at `size={20}`. Bidezine icons have no `filled` prop. **Structurally broken until A-9 is resolved**. |
| A-9 | **`filled` prop system** — the ENTIRE hover/active/browsing interaction model relies on every icon supporting `filled?: boolean` to toggle between regular and filled SVG paths. This is a first-class part of the origin icon pipeline (each Fluent icon has both `_20_regular.svg` and `_20_filled.svg`; the component switches on the prop). | `RailNav.tsx:844`, `1173`, `1368`, `1500`, `1509`; `railnav-icon-fill-investigation-2026-05-26.md`; `RAILNAV-BEHAVIOR-CONTRACT.md` §G | **No equivalent in bidezine**. bidezine's `scripts/build-icons.mjs` emits one static SVG per manifest entry (regular only). There is no `filled` prop; there are no filled-variant SVGs in the generated output. Every interactive icon in RailNav uses this toggle. **NEEDS HUMAN DECISION**: (a) add filled variants for each needed icon as separate manifest entries (e.g. `MoreHorizontalFilledIcon` → `more_horizontal_20_filled`), (b) adopt a different hover/active visual approach that doesn't require filled icons (color/opacity/scale change only), or (c) extend the icon pipeline to support a `filled` prop. This is the single largest structural decision for the entire port. |

---

### CATEGORY B: Colors — Dark Rail Surface (tokens on `tokens.darkSurface`)

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| B-1 | `tokens.darkSurface` — rail background (#1C2024 dark navy) | `RailNav.tsx:541`; `railnav.spec.md` tokenMap | bidezine `dark.tokens.json` has `sidebar: oklch(0.205, 0, 0)` which is a very dark gray. Visually close but **not identical**. Also the rail is always dark regardless of the app's light/dark mode — it's not a theme-toggled value. **NEEDS HUMAN DECISION**: use `sidebar` dark token, add a new `rail-surface` token, or treat as a hardcoded value? |
| B-2 | `tokens.darkHoverBg` — ~rgba(white, 0.10) overlay on dark surface for hover state | `RailNav.tsx:1142`, `1306`; `railnav-issues-clarified-2026-06-10.md` §ISSUE#5 | No equivalent in bidezine tokens. The dark-surface interactive overlays (`darkHoverBg`, `darkActiveBg`, `darkPressedBg`) are a complete token family with no bidezine parallel. **NEEDS HUMAN DECISION**: add new dark-interaction tokens to `tokens/*.tokens.json`, or compute inline as CSS with `oklch()` alpha values? |
| B-3 | `tokens.darkActiveBg` — ~rgba(white, 0.20) for active/selected state on dark surface | `RailNav.tsx:1141`, `1301`; `railnav-issues-clarified-2026-06-10.md` §ISSUE#5 | Same as B-2. **NEEDS HUMAN DECISION**. |
| B-4 | `tokens.darkPressedBg` — ~rgba(white, 0.25+) for pressed state on dark surface | `RailNav.tsx:1140`, `1302` | Same as B-2. **NEEDS HUMAN DECISION**. |
| B-5 | `tokens.darkBorderStrong` — visible border on dark surface; used for the browsing inset ring (`inset 0 0 0 1.5px`) and the overflow menu border | `RailNav.tsx:1346`, `1252` | bidezine `dark.tokens.json` has `border: oklch(1, 0, 0, alpha:0.1)` — visually almost invisible at 10% opacity. That is far too subtle for a visible browsing indicator ring or a menu border. **NEEDS HUMAN DECISION**: add a `rail-border-strong` token or derive a higher-opacity white border inline? |
| B-6 | `tokens.onDark` — 100% on-dark text/icon color (white or very near-white) | `RailNav.tsx:1175`, `1309` | bidezine has `sidebar-foreground: oklch(0.985, 0, 0)` in dark — effectively white. Potentially mappable. But `sidebar-foreground` is mode-specific while `onDark` is always the rail's foreground regardless of app theme. **NEEDS HUMAN DECISION** on whether to reuse `sidebar-foreground` or introduce a dedicated rail-foreground token. |
| B-7 | `tokens.onDarkHover` — ~85% opacity on-dark color for hover/browsing states | `RailNav.tsx:1147`, `1311` | No bidezine equivalent. A specific opacity step between full `onDark` and `onDarkSubtle`. **NEEDS HUMAN DECISION**: add token or inline as `oklch(0.985 0 0 / 0.85)`? |
| B-8 | `tokens.onDarkSubtle` — ~50–60% opacity on-dark color for resting state icons | `RailNav.tsx:1148`, `1312` | No bidezine equivalent. **NEEDS HUMAN DECISION**: add token or inline value? |
| B-9 | `tokens.onDarkDisabled` — specific disabled color for rail buttons on dark | Implied by `RailButtonDark.tsx` (not directly in reference but documented in `railnav-issues-clarified-2026-06-10.md` and `RAILNAV-BEHAVIOR-CONTRACT.md` §G12) | No bidezine equivalent. **NEEDS HUMAN DECISION**. |

---

### CATEGORY C: Colors — Light Panel Surface (tokens on `tokens.surface`)

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| C-1 | `tokens.surface` — panel background (white or near-white) | `RailNav.tsx:812` | bidezine `background: oklch(1, 0, 0)` (light) / `oklch(0.145, 0, 0)` (dark). Or `card`/`popover`. Semantically close; may map to `background` or `sidebar`. **NEEDS HUMAN DECISION**: which of the several near-equivalent bidezine tokens is the correct semantic match for the panel's light surface? |
| C-2 | `tokens.ink` — full-strength text/icon on light surface (used for selected rows, titles, active states) | `RailNav.tsx:845`, `1447`, `1780` | bidezine `foreground: oklch(0, 0, 0)` (light). Very likely the same semantic. **Clean equivalent** — map to `--foreground`. |
| C-3 | `tokens.textMuted` — ~60% readable subordinate text (panel item default, non-selected) | `RailNav.tsx:1447`; `ADR-003-railnav-panel-density.md` | bidezine `muted-foreground: oklch(0.556, 0, 0)` (light). Semantically identical. **Clean equivalent** — map to `--muted-foreground`. |
| C-4 | `tokens.textSubtle` — ~40% faint text (subtitle, empty search icon, default panel icon) | `RailNav.tsx:901`, `939` | No exact bidezine equivalent. `muted-foreground` at 0.556 is 60%; the 40% `textSubtle` is noticeably different (the audit history shows it was too faint for navigation items and was intentionally used only for very secondary elements). **NEEDS HUMAN DECISION**: derive inline as a lower-lightness oklch value, or add a new `text-subtle` token? |
| C-5 | `tokens.textDisabled` — ~30% very faint; applied to disabled rows and badge text in all states | `RailNav.tsx:1447`, `1780` | No direct bidezine equivalent. Bidezine's disabled convention uses `opacity-50` on the entire element, not a per-property color token. **NEEDS HUMAN DECISION**: adopt an opacity-based disabled approach, or add a `text-disabled` token? |
| C-6 | `tokens.hoverBg` — subtle light hover background for panel rows | `RailNav.tsx:1443` | bidezine `accent: oklch(0.97, 0, 0)` (light) / `oklch(0.371, 0, 0)` (dark). Semantically the closest match. **Potentially clean equivalent** — map to `--accent`, but note the dark-mode `accent` is significantly darker than a "subtle hover" — needs visual verification. |
| C-7 | `tokens.bgSubtle` — slightly stronger background for checked panel-header menu rows | `RailNav.tsx:1777`; `railnav-issues-clarified-2026-06-10.md` §ISSUE#2 | bidezine `muted: oklch(0.97, 0, 0)` (light) — same value as `accent` in light mode. Possibly mappable. **NEEDS HUMAN DECISION**: is `muted` the right semantic (it reads "disabled/low-emphasis") or does `accent` serve better? |
| C-8 | `tokens.activeBg` — pressed-state background for panel-header menu rows | `RailNav.tsx:1773` | No clean bidezine equivalent. **NEEDS HUMAN DECISION**. |
| C-9 | `tokens.pressedOverlay` — pressed state for the panel ellipsis trigger button | `RailNav.tsx:1627` | No bidezine equivalent. **NEEDS HUMAN DECISION**: inline as darker `accent`, or add token? |
| C-10 | `tokens.focusOverlay` — focus ring fill for the panel ellipsis trigger when keyboard-focused | `RailNav.tsx:1630` | No bidezine equivalent. Bidezine focus uses `ring` token (0.708 oklch light). **NEEDS HUMAN DECISION**: reuse `ring`, or add dedicated `focus-overlay` token? |
| C-11 | `tokens.hairline` — 0.5px divider between panel header and nav, below search bar | `RailNav.tsx:914`, `985` | bidezine `border: oklch(0.922, 0, 0)` (light). Could map to `--border` but the visual weight is explicitly described as "hairline" (0.5px line, not 1px). **Potentially clean** — map to `--border` at 0.5px thickness, but note that the CSS renders `borderTop: 0.5px solid` which may sub-pixel render differently from bidezine's typical 1px `border`. **NEEDS HUMAN DECISION** on whether to keep 0.5px or use 1px. |
| C-12 | `tokens.borderStrong` — inset pressed ring on light-surface menu rows | `RailNav.tsx:1795` | bidezine `border: oklch(0.922, 0, 0)` (light) is very light. A "strong" border implies more contrast. **NEEDS HUMAN DECISION**: use `--border`, derive inline, or add token? |
| C-13 | `tokens.statusRedText` — danger row label/icon color in panel-header menu | `RailNav.tsx:1782` | bidezine `destructive: oklch(0.577, 0.245, 27.325)` (light). The intent is identical. **Clean equivalent** — map to `--destructive`. |
| C-14 | `tokens.onInk` — text/icon color on the dark `tokens.ink` filled active row in the panel | `RailNav.tsx:1447` | bidezine `primary-foreground: oklch(0.985, 0, 0)` (light) — white on black. Semantically identical to "text on a dark background fill." **Effectively clean equivalent** — map to `--primary-foreground`. |

---

### CATEGORY D: Typography

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| D-1 | **Font family: Inter** — all `TYPE.*` tokens include `fontFamily: "Inter, ..."` as a spread | `railnav-foundation-audit-2026-05-24.md` §2; TYPE token system (origin `src/tokens.ts`) | bidezine `font-sans: ["ui-sans-serif", "system-ui", "sans-serif"]` — no Inter. **NEEDS HUMAN DECISION**: install Inter and add it to `base.tokens.json`'s `font-sans`, or accept system-ui for the ported RailNav? (Note: Inter is a free Google Font.) |
| D-2 | `TYPE.headingS` — panel title: ~16px/500 (Inter) | `RailNav.tsx:849`, `850` | No bidezine TYPE equivalent. Tailwind `text-base font-medium` is the closest structural match but font family and exact size may differ. **NEEDS HUMAN DECISION** once D-1 is resolved. |
| D-3 | `TYPE.bodyM` — default panel item / overflow item at rest: 14px/400 | `RailNav.tsx:1326`, `1452` | Tailwind `text-sm` (14px, `font-normal`). **Effectively clean** once font is decided (D-1). |
| D-4 | `TYPE.bodyS` — panel-header menu rows at rest: 13px/400 | `RailNav.tsx:1802` | No Tailwind utility for exactly 13px (Tailwind's `text-xs` = 12px, `text-sm` = 14px). **NEEDS HUMAN DECISION**: accept 12px (`text-xs`), accept 14px (`text-sm`), or add a custom 13px step to the token pipeline? |
| D-5 | `TYPE.labelM` — 13px/500 (Inter); used for subtitle, checked menu rows, tooltip text | `RailNav.tsx:900`, `1802` | Same 13px issue as D-4. `font-medium` (500) is available. **NEEDS HUMAN DECISION** on the 13px size. |
| D-6 | `TYPE.labelL` — 14px/500; active nav row, active overflow item | `RailNav.tsx:1326`, `1452` | Tailwind `text-sm font-medium`. **Clean equivalent** once font is decided. |
| D-7 | `TYPE.strong` — fontWeight 500 spread used in panel header title | `RailNav.tsx:849` | Tailwind `font-medium`. **Clean equivalent**. |
| D-8 | `TYPE.caption` — 12px; referenced historically (was used for subtitle before being changed to `TYPE.labelM`) | `consumer-governance/CLARIFICATIONS/railnav.md` §DS CHANGE 2026-07-31 | Tailwind `text-xs`. **Clean equivalent**, but note this is a superseded usage — current code uses `TYPE.labelM` for subtitles. |
| D-9 | Active panel row label weight bump: `TYPE.labelL` (500) vs rest `TYPE.bodyM` (400) | `RailNav.tsx:1452`, `RAILNAV-BEHAVIOR-CONTRACT.md` §G5 | `font-medium` vs `font-normal` Tailwind classes. **Clean equivalent** in behavior, but requires conditional class application. |

---

### CATEGORY E: Spacing

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| E-1 | `SPACE[1]` = 4px — inner nav gap (between rail buttons), footer gap, NavRow padding-y, panel nav list gap fallback | `railnav.spec.md` Gap Contract; `RailNav.tsx:577`, `622` | Tailwind `gap-1`, `p-1` = 4px. **Clean equivalent** — all standard 4px-grid values map directly to Tailwind utilities. No new token needed. |
| E-2 | `SPACE[2]` = 8px — rail padding, panel header padding, search bar padding, NavRow horizontal padding, panel gap (`LAYOUT.panelGap`) | `RailNav.tsx:508`, `821`, `920`, `993` | Tailwind `p-2`, `gap-2` = 8px. **Clean equivalent**. |
| E-3 | `SPACE[3]` = 12px — used in `ADR-003` for logo margin | `ADR-003-railnav-panel-density.md` | Tailwind `p-3`, `gap-3` = 12px. **Clean equivalent**. |
| E-4 | `SPACE[4]` = 16px — **outer gap** between LogoSlot/NavColumn/FooterSlot in the rail; header subtitle margin | `RailNav.tsx:547`, `railnav.spec.md` Gap Contract | Tailwind `gap-4` = 16px. **Clean equivalent**. Note: this was a historical bug site (code had `SPACE[1]` instead of `SPACE[4]` for several cycles — see `RAILNAV-ALIGNMENT-COMPLETE-PLAN-2026-06-10.md`). |
| E-5 | `SPACE[6]` — used in panel drag-resize `viewportMax` clamp | `RailNav.tsx:415` | Tailwind `p-6`/`gap-6` = 24px. **Clean equivalent**. |
| E-6 | `SPACE.half` = 2px — panel nav list row gap, NestedChildren gap | `RailNav.tsx:1007`, `1913` | Tailwind `gap-0.5` = 2px. **Clean equivalent**. |
| E-7 | `28px` hardcoded padding-left — subtitle indent under panel header title (28 = icon 20 + gap 8) | `RailNav.tsx:892` | No Tailwind utility for exactly 28px (`pl-7` = 28px in Tailwind 4 default 4px base scale). **Clean equivalent** — `pl-7`. |

---

### CATEGORY F: Layout / Sizing

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| F-1 | `LAYOUT.railW` = 54px — the rail column's fixed width | `railnav.spec.md` container.computedWidth; `RailNav.tsx:538` | No bidezine equivalent. This is a design-specific layout constant. bidezine's `SIDEBAR_WIDTH_ICON = "3rem"` (48px) from `sidebar.tsx` is close but not identical. **NEEDS HUMAN DECISION**: treat as a hardcoded `w-[54px]` in Tailwind, derive from an expression (8+38+8), or add a new layout token to `base.tokens.json`? |
| F-2 | `LAYOUT.railButton` = 38px — width and height of each rail icon button | `railnav.spec.md`; `RailNav.tsx:1157` | No bidezine equivalent. Bidezine's shadcn `Button` default size is `h-9` (36px). **NEEDS HUMAN DECISION**: use 38px as a hardcoded value (`h-[38px] w-[38px]`), or decide on a different button size aligned to bidezine's spacing scale? |
| F-3 | `LAYOUT.panelW` = 300px — default panel width | `RailNav.tsx:295` | bidezine's `SIDEBAR_WIDTH = "16rem"` (256px) and there's no 300px equivalent. **NEEDS HUMAN DECISION**: use 300px hardcoded, remap to 256px (16rem), or choose a different default? |
| F-4 | `LAYOUT.panelGap` = 8px — gap between rail and panel | `RailNav.tsx:789` | = SPACE[2] = 8px = Tailwind `ml-2` or `gap-2`. **Clean equivalent**. |
| F-5 | `LAYOUT.hitTarget` = 40px — used as row `minHeight` in `ADR-003` | `ADR-003-railnav-panel-density.md` | `h-10` = 40px in Tailwind. **Clean equivalent** for the value. But the ADR decision to use this specifically (vs 36px or 28px) must be retained — it's a deliberate density choice. |
| F-6 | `LIST_ROW.compact` = 28px — `minHeight` of NavRowShell buttons (navrow.spec.md calls it "NavRow natural height: 4+20+4=28px") | `RailNav.tsx:1470` | Tailwind `min-h-7` = 28px. **Clean equivalent** for the value, but verify against the ADR-003 density decision (which bumped to 40px `hitTarget` — there may be an inconsistency in the code). |
| F-7 | `FOOTER_MAX_ICONS` = 3 / `FOOTER_MAX_HEIGHT` = 3×38 + 2×4 = 122px — FooterSlot `maxHeight` | `RailNav.tsx:251`, `252`, `622` | No bidezine equivalent. A computed constant. **NEEDS HUMAN DECISION**: hardcode as `max-h-[122px]` or derive arithmetically? (Note: behavior contract §A9 flags that a 4th footer icon is silently clipped — this constraint matters.) |
| F-8 | `PANEL_MIN_WIDTH` = 240px — minimum draggable panel width | `RailNav.tsx:253`, `416` | No bidezine equivalent. Tailwind `min-w-60` = 240px. **Clean equivalent** for value — document as design constant. |
| F-9 | `ITEM_SLOT` = 42px — computed `railButton(38) + SPACE[1](4)`; used as the per-icon height budget for overflow calculation | `RailNav.tsx:250` | This is a derived constant, not independently authored. Resolves automatically once F-2 and E-1 are resolved. No separate decision needed. |

---

### CATEGORY G: Border Radius

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| G-1 | `RADIUS.rounded` = 12px — rail surface borderRadius, panel surface borderRadius, overflow menu borderRadius, panel-header menu borderRadius | `RailNav.tsx:542`, `811`, `1254`, `1721`; `railnav.spec.md` `borderRadius: 12px` | bidezine `base.tokens.json` has NO 12px radius token. Closest: `radius-xl = 0.875rem = 14px` (slightly larger). Next down: `radius-lg = 0.625rem = 10px`. Neither is exactly 12px. **NEEDS HUMAN DECISION**: use `radius-xl` (14px), use `radius-lg` (10px), add a `radius-2dot5xl` = 0.75rem = 12px, or treat as a hardcoded `rounded-[12px]`? Note: the origin spec went through significant churn on this value (`RADIUS.container = 18px` → `RADIUS.rounded = 12px` — documented as a correction). |
| G-2 | `RADIUS.soft` = 8px — NavRowShell button borderRadius, overflow trigger borderRadius, OverflowMenuItem borderRadius | `RailNav.tsx:1159`, `1344`, `1473` | bidezine `radius-md = 0.5rem = 8px`. **Exact match** — map to `--radius-md` / Tailwind `rounded-[var(--radius-md)]`. |
| G-3 | `RADIUS.xs` = 4px — panel-header menu button borderRadius, chevron slot borderRadius, icon slot borderRadius, SearchBar borderRadius | `RailNav.tsx:1650`, `1495`, `1506` | bidezine `radius-sm = 0.375rem = 6px`. **Not exact** (6px vs 4px). **NEEDS HUMAN DECISION**: use `radius-sm` (6px), or treat as a hardcoded `rounded-[4px]` / `rounded-sm`? |
| G-4 | `RADIUS.pill` = 9999px — indicator dot, resize grip | `RailNav.tsx:1183`, `1092` | Tailwind `rounded-full`. **Clean equivalent**. |

---

### CATEGORY H: Motion / Animation

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| H-1 | `MOTION.fast` — duration for background/color transitions on interactive elements (hover, press) | `RailNav.tsx:1170`, `1355`, `1482`, `1663` | No bidezine motion token. Tailwind's `transition-colors` uses a default `150ms ease-in-out`. **NEEDS HUMAN DECISION**: use Tailwind's default transition, adopt a specific ms value from the origin, or add a `motion-fast` token? |
| H-2 | `MOTION.medium` — duration for the panel reveal width animation | `RailNav.tsx:797`, `779` | No bidezine motion token. **NEEDS HUMAN DECISION** (same as H-1 but for a longer animation). |
| H-3 | `MOTION.ease` — easing curve for fast state transitions (`background`, `box-shadow`, `color`) | `RailNav.tsx:1170`, `1355` | No bidezine equivalent. The origin likely uses a standard `ease` or `ease-in-out` curve. **NEEDS HUMAN DECISION** on the specific easing. |
| H-4 | `MOTION.easeOut` — easing for panel reveal and margin-left transitions | `RailNav.tsx:797`, `798` | No bidezine equivalent. **NEEDS HUMAN DECISION**. |
| H-5 | **Panel reveal animation** — `width: 0 → panelWidth` + `margin-left: 0 → panelGap` transitions, suppressed during drag, instant under reduced motion | `RailNav.tsx:796–799`; `RAILNAV-BEHAVIOR-CONTRACT.md` §B3/B4 | bidezine has no panel-reveal animation concept. The CSS approach (animating `width` with `overflow:hidden` during transition, then `overflow:visible` after) is entirely custom. **NEEDS HUMAN DECISION**: (a) implement the same width-animation approach, (b) use CSS `max-width` or `transform:scaleX` instead, (c) use Tailwind `transition-[width]` with data-state variants. |
| H-6 | **Collapse animation** — `grid-template-rows: 0fr → 1fr` + opacity; custom `<Collapse>` component in `../motion`; deterministic unmount after `duration + 50ms` | `RAILNAV-BEHAVIOR-CONTRACT.md` §C9/C10; `RailNav.tsx:1015`, `2015`, `2083` | bidezine has `Collapsible` from Radix UI (`collapsible.tsx`). Radix's `CollapsibleContent` uses CSS `--radix-collapsible-content-height` for animation. The behaviors are similar but the implementation is different. **NEEDS HUMAN DECISION**: use bidezine's `Collapsible` (Radix-driven), or implement the custom `Collapse` component? The deterministic DOM unmount on close (C9 behavior contract assertion) must survive whichever approach is chosen. |
| H-7 | **Chevron rotation animation** — `transform: rotate(-90deg → 0deg)` over `MOTION.fast` tracks expand state | `RailNav.tsx:1497–1499` | Tailwind `transition-transform` + `data-[state=open]:rotate-0` / `data-[state=closed]:-rotate-90`. **Clean functional equivalent** with bidezine's Tailwind approach, but the exact timing (`MOTION.fast`) needs H-1 resolved first. |
| H-8 | `prefers-reduced-motion` hook (`useReducedMotion()`) — sets all transitions to `"none"` | `RailNav.tsx:36–46`, `50–52` | Tailwind handles this via `motion-reduce:` variant on utility classes. **Clean equivalent** approach, but the per-element implementation will be different (Tailwind variants vs inline `transition()` helper calls). |

---

### CATEGORY I: Elevation / Shadow

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| I-1 | `elevation(tokens).mid` — a computed box-shadow string; used on the panel surface and both overflow menus | `RailNav.tsx:813`, `1254`, `1723` | No elevation token in bidezine. bidezine's shadcn components use Tailwind `shadow-md` (0 4px 6px -1px rgba(0,0,0,0.1)) or `shadow-lg`. The origin's `elev.mid` is computed from tokens and may have a different look. **NEEDS HUMAN DECISION**: map to a specific Tailwind shadow class, or add a `shadow-mid` token to `base.tokens.json`? |

---

### CATEGORY J: Z-Index

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| J-1 | `Z.dropdown` — z-index for the overflow menu and panel-header menu popovers | `RailNav.tsx:1256`, `1726` | bidezine's shadcn components use `z-50` for overlays (seen in `tooltip.tsx`, `dropdown-menu.tsx`). **Likely clean equivalent** — map to Tailwind `z-50`. Verify once the build is underway. |
| J-2 | `Z.rail` — z-index for the `<aside>` rail wrapper; ensures rail elevation shadow paints above the app's sticky header | `RailNav.tsx:523`; comment at `RailNav.tsx:513–526` | No bidezine equivalent. The comment explicitly flags this as a LOAD-BEARING stacking context (sanctioned exception). **NEEDS HUMAN DECISION**: what z-index should the rail wrapper use in bidezine's app shell? (The value must be above sticky headers but below modal portals.) |

---

### CATEGORY K: Focus Ring / Scrollbar CSS

| # | What RailNav uses | Citation | Bidezine status |
|---|---|---|---|
| K-1 | `FOCUS_GLOBAL_CSS(tokens, tokens.onDark)` — injects `<style>` with global CSS for `:focus-visible` rings in both light and dark-surface contexts; must run at the `<aside>` level | `RailNav.tsx:531` | bidezine uses Tailwind `focus-visible:ring-*` classes per component. There is no `<style>` injection for global focus rings. **NEEDS HUMAN DECISION**: (a) translate to per-element Tailwind focus classes on each interactive element (preferred bidezine approach), or (b) retain the style injection as a one-time cost? |
| K-2 | `FOCUS.style(tokens)` — returns an inline style object for the focus ring applied to NavRowShell buttons | `RailNav.tsx:1484` | bidezine focus-visible is class-based. **NEEDS HUMAN DECISION** (same as K-1, same choice). |
| K-3 | `SCROLL.css(tokens)` + `SCROLL.className` — injects custom scrollbar CSS (`<style>`) and applies a custom className to scrollable containers for thin, token-colored scrollbars | `RailNav.tsx:529`, `1003`, `1243`, `1710` | No bidezine equivalent. bidezine uses browser-default scrollbars or `scroll-area.tsx` (Radix ScrollArea). **NEEDS HUMAN DECISION**: (a) use bidezine's `ScrollArea` component for the panel nav, (b) use browser-default scrollbars, (c) add a custom scrollbar stylesheet, (d) use Tailwind's `scrollbar-*` utilities (available in Tailwind v4 via a plugin). |
| K-4 | `DISABLED.cursor` — "not-allowed" cursor for disabled rows | `RailNav.tsx:1474` | Tailwind `cursor-not-allowed`. **Clean equivalent**. |

---

### CATEGORY L: Custom Sub-Components (all require bidezine-idiomatic replacements)

| # | Sub-component | What it does | Bidezine status |
|---|---|---|---|
| L-1 | `LogoSlotDark` | 38×38 dark-surface logo slot; interactive button variant when `onLogoClick` supplied; tooltip; keyboard focus ring | Not in bidezine. Could be composed from a plain `<button>` + bidezine `Tooltip`. No direct primitive. The icon slot is a custom dark-surface button — see F-2 for the 38×38 size decision. |
| L-2 | `RailButtonDark` | Dark-surface icon button with 4 interactive states, tooltip, `filled` icon toggle, browsing ring, `aria-current` | Not in bidezine. bidezine's `Button` uses Tailwind and Radix Slot; it is a light-surface-oriented component with standard shadcn variants (`default/secondary/outline/ghost/link`). None of these match the dark rail visual model. **NEEDS HUMAN DECISION**: (a) build `RailButtonDark` as a new internal component using bidezine tokens/Tailwind, (b) use bidezine's `Button` with a custom `variant`, or (c) use an unstyled button element. |
| L-3 | `NavIndentLine` | Visual indentation line atom — a hairline vertical bar indicating nesting depth inside each NavRowShell | Not in bidezine. Simple enough to implement inline (e.g. a 1px-wide `<div>` with `--border` color), but its exact sizing (`rowPadY`, `rowGap`, `isLast`) needs the density decisions (E-1, F-5, F-6) resolved first. |
| L-4 | `ExpandButton` | 28×28 button with `IconChevronDoubleLeft`, collapses the panel; `aria-expanded={true}` while visible | Not in bidezine. Depends on A-7 (icon decision). Could be composed from bidezine `Button` with custom sizing. |
| L-5 | `ClearButton` | 24×24 search clear button; `visibility:hidden` when input is empty (reserved slot); shows `IconDismiss`; refocuses the search input on click | Not in bidezine. A small interactive element. Could use bidezine `Button` (ghost/icon variant) with conditional visibility. |
| L-6 | `Badge` (origin system) | Pill badge atom; variants: `neutral` (subtle fill + hairline border + muted text), `info` (iris-colored); surface modes: `atom` (light) and `darkAtom` (dark rail/overflow); appears on sections and panel rows | bidezine has `Badge` (`src/ui/badge.tsx`) with variants `default/secondary/destructive/outline/ghost/link`. The `neutral` and `info` origin variants, and the `atomSurface` dark-surface mode, have **no direct bidezine equivalents**. **NEEDS HUMAN DECISION**: which bidezine Badge variant maps to origin `neutral`? Which maps to `info`? What is the dark-surface (`darkAtom`) badge equivalent? |
| L-7 | `Collapse` (motion component) | `grid-template-rows: 0fr→1fr` height animation; deterministic unmount after close; reduced-motion instant | bidezine has `Collapsible` (`collapsible.tsx`) — Radix-based. Radix handles the open/close state, but the CSS height animation (`--radix-collapsible-content-height` variable) needs Tailwind animation utilities or custom CSS. **NEEDS HUMAN DECISION**: (a) use bidezine's `Collapsible` with appropriate CSS animation applied, (b) build an inline `Collapse`-equivalent using Tailwind `grid` utilities and `data-[state]` variants. The contract assertion C9 (DOM unmount after close) must be verified with whichever approach is chosen. |

---

### CATEGORY M: Structural / Behavioral Patterns

| # | What RailNav does | Citation | Bidezine status |
|---|---|---|---|
| M-1 | **Inline CSS styling (JS objects)** — every style is authored as a React inline style object referencing token/constant values | Throughout `RailNav.tsx` | Bidezine uses Tailwind v4 utility classes exclusively. This is a complete paradigm shift: every inline style in the source must be translated to either a Tailwind class, a CSS variable reference via Tailwind's `[var(--...)]` syntax, or an arbitrary value. This is not a divergence that needs a human decision — it is how the Build agent must work — but it is a very large mechanical translation task. |
| M-2 | **`useTokens()` hook** — all colors consumed via a React context hook that provides the token map | `RailNav.tsx:284` | bidezine tokens are CSS variables on `:root` / `.dark`, consumed via Tailwind classes or direct `var()` references. The `useTokens()` hook and its entire return type (`TokenSet`) do not exist and must not be created. |
| M-3 | **`@radix-ui/react-dropdown-menu` direct import** — both menus use `import * as DropdownMenu` | `RailNav.tsx:18` | bidezine has `dropdown-menu.tsx` which wraps Radix's `DropdownMenu` primitive but applies shadcn styles. The overflow menu needs a **dark-surface re-skin** and the panel-header menu needs a **light-surface** style — both of which look very different from bidezine's default `DropdownMenuContent` styling. **NEEDS HUMAN DECISION**: (a) use bidezine's `DropdownMenu*` components and override styles via className props, (b) use Radix directly for these menus (via `radix-ui` package already installed), (c) build new `DarkDropdownMenu` variants for the system. |
| M-4 | **`data-dark-surface` attribute** — applied to the rail `<div>` to trigger dark-surface CSS scoping | `RailNav.tsx:536` | bidezine has no such attribute or concept. Not strictly needed if tokens are handled differently, but the pattern of marking a dark-surface context for scoped CSS is worth noting. |
| M-5 | **Tooltip implementation** — custom hand-rolled tooltips using portal + fixed positioning (or after the fix documented in the audits, using `ReactDOM.createPortal`) | `RAILNAV-ALIGNMENT-COMPLETE-PLAN-2026-06-10.md` Fix #1; `RAILNAV-BEHAVIOR-CONTRACT.md` §G1 | bidezine has `tooltip.tsx` — Radix-based `TooltipProvider` + `TooltipContent` with portal already built in. **Effectively clean equivalent** — use bidezine's `Tooltip` to replace the custom tooltip implementation. The bidezine Tooltip suppression rule (show only when not active/browsing/disabled) is behavioral logic, not component API. |
| M-6 | **ResizeObserver overflow budget** — measures its own `clientHeight` at runtime to compute `computedMax` | `RailNav.tsx:383–406`; `RAILNAV-BEHAVIOR-CONTRACT.md` §A1/A2 | No equivalent concept in bidezine. This is novel DOM measurement logic that must be re-implemented. The approach is valid and necessary — it cannot be replaced by a simpler Tailwind-only layout approach because it responds dynamically to arbitrary app-shell heights. |
| M-7 | **Panel resize handle** — mouse-drag resize with body cursor lock | `RailNav.tsx:411–435`; `RAILNAV-BEHAVIOR-CONTRACT.md` §B7–B10 | bidezine has `resizable.tsx` which wraps `react-resizable-panels`. That primitive handles resize semantics but at a completely different API level (panel groups, not a single draggable handle). **NEEDS HUMAN DECISION**: (a) implement the custom drag-resize handle as in the reference, (b) use bidezine's `Resizable` primitive (which changes the structural API), (c) make the panel width fixed (no resize). |
| M-8 | **bidezine `Sidebar` primitive conflict** — `src/ui/sidebar.tsx` is an already-ported shadcn Sidebar with its own `SidebarContext`, `SidebarProvider`, cookie state, mobile offcanvas, `collapsible=icon` mode (3rem icon column) | bidezine `src/ui/sidebar.tsx:28–53` | These two are architecturally different organisms. bidezine's `Sidebar` is a traditional collapsible/offcanvas sidebar. RailNav is a persistent icon rail + secondary panel. They are NOT composable: RailNav does not wrap `Sidebar`, and `Sidebar` cannot express RailNav's behaviors. If both live in `src/ui/`, consumers need guidance on which to use. **NEEDS HUMAN DECISION**: (a) keep them as two independent components with clear documentation differentiating them, (b) deprecate `Sidebar` in favor of RailNav for app-shell navigation, (c) make RailNav compose `Sidebar`'s pieces (unlikely — very different structure). |
| M-9 | **`logoLabel` default = "BiDezine"** — hardcoded brand string as the logo's tooltip/aria-label default | `RailNav.tsx:267`, `RAILNAV-BEHAVIOR-CONTRACT.md` §G14 | The default value IS the bidezine brand name, so this is correct for our system. However, the behavior contract explicitly flags this as a property every non-bidezine consumer MUST override. Retain the default but document this in the bidezine component API. No decision needed on the value itself. |
| M-10 | **`modal={false}` on both DropdownMenus** — the overflow menu and panel-header menu are both non-modal (scroll+focus not locked) | `RailNav.tsx:1223`, `1692` | bidezine's `DropdownMenuContent` defaults to portal+modal behavior. `modal={false}` is passed at the Radix root level. The build must preserve this — using bidezine's `DropdownMenu` wrapper must still allow `modal={false}` to pass through to Radix. Verify that `bidezine/src/ui/dropdown-menu.tsx`'s `DropdownMenu` function passes `...props` to `DropdownMenuPrimitive.Root` (it does — line 12 of `dropdown-menu.tsx`). **Clean — no decision needed** if the build uses bidezine's `DropdownMenu` root and passes `modal={false}`. |

---

## 3. Notable Risks / Conflicts

### R-1: Icon `filled` prop is absent from bidezine's pipeline — breaks the entire hover/active visual model
The most critical structural risk. RailNav's interactive identity (the Regular→Filled icon toggle on hover, browsing, active, and pressed) is the key visual differentiator of the component. Every rail button, chevron, overflow trigger, and panel disclosure row depends on it. bidezine's icon pipeline emits one static regular SVG per entry. There is no `filled` prop, no filled SVG variant in `node_modules/@fluentui/svg-icons/icons/` for any of the icons currently in `icons/manifest.json`. Until decision A-9 is made, no interactive icon state in the ported component can be correctly expressed.

**Contamination risk:** If a Build agent proceeds without this decision, it will silently drop the filled states or substitute placeholders, producing a component that looks broken on hover/active but passes type-checking.

### R-2: Dark surface token family has zero bidezine equivalents — the entire rail color system is missing
The rail surface needs a coherent 5-token interactive family: `darkSurface`, `darkHoverBg`, `darkActiveBg`, `darkPressedBg`, `darkBorderStrong`, and 3 on-dark text colors (`onDark`, `onDarkHover`, `onDarkSubtle`). None of these exist in bidezine's DTCG token files. Authoring ad-hoc color values inline would violate bidezine's core rule ("Tokens are authored in `tokens/`, nowhere else. Never hand-write a CSS variable."). The Build agent **cannot proceed on the rail at all** without a human decision on how to represent these tokens.

### R-3: The origin system's styling paradigm (inline CSS JS objects) is entirely incompatible with bidezine's Tailwind v4 paradigm
RailNav's 87KB source file uses inline React styles everywhere. Translating this to Tailwind is a large mechanical task, and there are traps: some values (RADIUS.rounded = 12px, LAYOUT.railW = 54px, LAYOUT.railButton = 38px) have no Tailwind utility match without arbitrary value syntax. The Build agent must not use `style={{}}` anywhere in the ported code — but converting 200+ inline style properties to class-based styling while preserving all state conditionals (hover, active, browsing, disabled, keyboard-focused, expanded) is high-complexity work. **Contamination risk:** inline style fallbacks quietly left in the built code would bypass the token system.

### R-4: History of design instability — at least 7 distinct visual decisions changed mid-development
From the audit trail:
- Rail button size: 40×40 (`hitTarget`) then 38×38 (`railButton`) — with mismatched documentation
- Border radius: `RADIUS.container` (18px) → `RADIUS.rounded` (12px)
- Panel header title: `TYPE.bodyM` → `TYPE.headingM` → `TYPE.headingS`
- Panel subtitle: `TYPE.caption` → `TYPE.bodyM` → `TYPE.labelM`
- Active row background: `accentSubtle` → `tokens.bg` → `tokens.ink` (filled dark)
- Rail icon hover fill: added → removed → re-added
- Outer gap: 4px → 16px (filed as a BLOCKER mid-cycle)

This pattern shows the design was still being finalized when the reference snapshot was taken. The `railnav-visual-qa.md` notes the component was at `experimental` maturity at the time of the 2026-05-24 snapshot, and the `consumer-governance/CLARIFICATIONS/railnav.md` records a typography change as late as 2026-07-31. **Before the Build agent starts, the human should confirm which version of the design is "final" and which of the above evolutionary decisions to carry forward.**

### R-5: bidezine `Sidebar` primitive already exists and defines conflicting concepts
`src/ui/sidebar.tsx` defines a `SidebarContext`, a `SidebarProvider`, and component-tree exports like `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` etc. These are shadcn/ui conventions using `--sidebar`, `--sidebar-accent`, etc. tokens. The in-progress RailNav port would introduce a fundamentally different navigation organism that also calls itself a "sidebar." **Contamination risk:** unless the RailNav is named and documented distinctly, consumers will be confused, tokens may collide (the `sidebar` DTCG token may be reused for the rail surface even though the semantics differ), and future agents may mix the two architectures.

### R-6: `Collapse` animation component is not present in the reference folder
The `RailNav.tsx` imports `import { Collapse } from "../motion"` — a custom animation component that handles the `grid-template-rows` expand/collapse with deterministic unmount. This component is **not included** in the `limbo/rail-sidebar/reference/` copy (no `motion.tsx` file is present). The behavior contract documents its behavior precisely (§C9/C10) and the Build agent can reimplement it from the spec, but the exact timing values (`MOTION.medium + 50ms` unmount delay) and easing curves are in the origin system's `MOTION` constants — not captured in the reference. This creates a documentation gap.

### R-7: `SCROLL.css(tokens)` and `FOCUS_GLOBAL_CSS(tokens)` inject `<style>` tags at runtime
Both utilities inject global CSS via `<style>` elements rendered inside the component. This pattern is hostile to Tailwind v4's build-time stylesheet approach and could interfere with the CSP (Content Security Policy) and the `source(none)` / explicit `@source` pattern described in `CLAUDE.md`. **Contamination risk:** if these style injections carry over to the ported component, they bypass bidezine's generated token CSS entirely.

### R-8: `RailButtonDark` is a sub-component that is exported from the origin package (PR #63 per `CLARIFICATIONS/railnav.md`)
The clarifications document notes that `RailButtonDark` was added to the package exports specifically to allow consumers to compose their own utility items slot. This means the ported bidezine version would also likely need `RailButtonDark` to be exported from `src/index.ts`. This must be planned — the LIMBO protocol prevents any `src/ui/` export until the component graduates, so the export chain must be ready at graduation time.

### R-9: The `Collapse` component's deterministic unmount (behavior contract C9) is not covered by Radix's `CollapsibleContent`
Radix `CollapsibleContent` renders `null` when closed by default, but the Radix unmount happens on state change immediately (or on animation end if CSS transitions are used). The origin's `Collapse` uses a `setTimeout(duration + 50ms)` to deterministically unmount after the CSS animation finishes. If the Build agent uses Radix `Collapsible`, they must verify that the DOM unmount timing matches the behavior contract — or this will be flagged as a regression by the Escalation agent.

---

## 4. Open Questions for the Human

These map directly back to the `NEEDS HUMAN DECISION` items in Section 2. Ordered by blocking priority (earlier items block the most subsequent work).

---

**Q1 — Icon `filled` prop system (blocks ALL interactive icon states) [A-9]**
RailNav uses a `filled` boolean prop on every interactive icon to toggle between regular and filled SVG variants. bidezine's icon pipeline does not support this — all icons are static regular SVGs. How should the port express hover/active/browsing icon states?
- **(a)** Add filled variants of the required icons to `icons/manifest.json` (e.g., `MoreHorizontalFilledIcon → more_horizontal_20_filled`); Build agent wires the two components together as a toggle.
- **(b)** Drop the filled-icon toggle entirely; use color/opacity changes only to signal interactive states (no fill change).
- **(c)** Extend the icon pipeline to support a `filled` prop natively (larger scope change to `scripts/build-icons.mjs` and `icons/manifest.json`).

---

**Q2 — Dark surface token family (blocks the entire rail color system) [B-1 through B-9]**
The rail needs 8 dark-surface-specific tokens (`darkSurface`, `darkHoverBg`, `darkActiveBg`, `darkPressedBg`, `darkBorderStrong`, `onDark`, `onDarkHover`, `onDarkSubtle`) none of which exist in bidezine's DTCG token files. Authoring inline values violates the "tokens only in `tokens/`" rule.
- **(a)** Add a new group of dark-surface interaction tokens to `tokens/base.tokens.json` (and corresponding light/dark values if they differ by mode).
- **(b)** Use existing bidezine tokens for approximate matches where close enough (e.g., `sidebar` for `darkSurface`, `sidebar-foreground` for `onDark`), and add only the tokens with no equivalent.
- **(c)** Decide the rail is always dark regardless of app theme → some of these tokens may need a single fixed value in `base.tokens.json` rather than mode-split light/dark entries.

---

**Q3 — Logo icon (`IconLogo`) [A-3]**
The component defaults to `<IconLogo />` as the rail's logo slot. `IconLogo` is not in the bidezine manifest.
- **(a)** Add the bidezine product mark to `icons/manifest.json` as a `custom` entry (same approach as `AudioLinesIcon`). The user would need to supply the SVG markup.
- **(b)** Remove the default entirely; require consumers to always pass a `logo` prop.
- **(c)** Use an existing Fluent icon as a placeholder default and let consumers override.

---

**Q4 — Panel collapse icon (`IconChevronDoubleLeft`) [A-7]**
The panel's collapse button uses a double-left-chevron icon, which is not in bidezine's manifest.
- **(a)** Add `chevron_double_left_20_regular` to `icons/manifest.json` (verify the `.svg` file exists in `node_modules/@fluentui/svg-icons/icons/`).
- **(b)** Use `ChevronLeftIcon` (single chevron, already in manifest).
- **(c)** Use a different Fluent icon — user names it.

---

**Q5 — Typography and font family [D-1 through D-5]**
The origin system uses Inter throughout. bidezine uses `system-ui`. Additionally, some TYPE sizes (13px for `TYPE.bodyS` and `TYPE.labelM`) fall between Tailwind's `text-xs` (12px) and `text-sm` (14px).
- **(a)** Add Inter to `base.tokens.json`'s `font-sans` as the first font in the stack; use 14px everywhere (round up 13px steps to `text-sm`).
- **(b)** Keep `system-ui`; accept that the component renders in the system font, not Inter.
- **(c)** Keep `system-ui`; add a custom 13px font-size token to `base.tokens.json` for sub-`text-sm` uses.

---

**Q6 — Rail geometry constants (rail width, button size, panel width) [F-1, F-2, F-3]**
`LAYOUT.railW` = 54px, `LAYOUT.railButton` = 38px, `LAYOUT.panelW` = 300px have no bidezine token equivalents. bidezine's existing `Sidebar` uses 3rem (48px) icon width and 16rem (256px) panel width.
- **(a)** Carry the origin's exact values forward (54px / 38px / 300px) as Tailwind arbitrary values `w-[54px]` etc.; document them as RailNav design constants.
- **(b)** Adapt to bidezine's Sidebar sizing (48px rail / 256px panel) for visual consistency with `Sidebar`.
- **(c)** User specifies preferred values.

---

**Q7 — Rail border radius: `RADIUS.rounded` = 12px [G-1]**
bidezine has no 12px radius token (closest: `radius-xl` = 14px or `radius-lg` = 10px).
- **(a)** Add a 12px radius step to `base.tokens.json` (e.g., `radius-2xl` could be redefined, or a new `radius-2dot5xl` added).
- **(b)** Use `radius-xl` (14px) — slightly rounder.
- **(c)** Use `radius-lg` (10px) — slightly less round.
- **(d)** Hardcode `rounded-[12px]` as an arbitrary Tailwind value (technically valid but bypasses the token system).

---

**Q8 — Small radius: `RADIUS.xs` = 4px [G-3]**
bidezine's `radius-sm` = 6px, not 4px. Used for icon slots, focus-ring insets, panel menu button corners.
- **(a)** Use `radius-sm` (6px) — slightly rounder.
- **(b)** Hardcode `rounded-[4px]` as an arbitrary Tailwind value.
- **(c)** Add a 4px step to `base.tokens.json` (e.g., `radius-xs`).

---

**Q9 — Motion / animation timing values [H-1 through H-5]**
`MOTION.fast`, `MOTION.medium`, `MOTION.ease`, `MOTION.easeOut` are not in bidezine. The panel reveal and chevron rotation rely on specific timing.
- **(a)** Use Tailwind's default `transition-colors` (150ms ease-in-out) for fast transitions; choose an explicit value (e.g., 250ms ease-out) for the panel reveal; do not add formal motion tokens yet.
- **(b)** Add `motion-fast`, `motion-medium`, `motion-ease`, `motion-ease-out` tokens to `base.tokens.json` so future components can share the same timing.
- **(c)** User specifies the preferred timing values.

---

**Q10 — Panel reveal animation approach [H-5]**
The panel animates `width: 0 → panelWidth` plus `margin-left`. This approach requires `overflow:hidden` during the transition and `overflow:visible` after (for the shadow to escape).
- **(a)** Implement the same width-transition approach with the `panelTransitioning` state timer.
- **(b)** Use `max-width` transition instead (simpler; avoids the overflow clipping issue).
- **(c)** Use CSS `transform: scaleX()` (avoids layout reflow).
- **(d)** No panel animation — instant open/close.

---

**Q11 — Collapse animation: bidezine Collapsible vs custom Collapse [H-6, L-7, R-6]**
The `Collapse` animation component from `../motion` is not in the reference; its source code was not copied. The behavior contract precisely specifies its behavior (grid-rows animation, deterministic DOM unmount after `duration + 50ms`).
- **(a)** Use bidezine's `Collapsible` (Radix) with custom Tailwind CSS for the height animation and verify the DOM unmount timing satisfies behavior contract C9.
- **(b)** Reimplement the `Collapse` component from the behavior contract spec alone (height animation + timed unmount), making it a new bidezine internal utility.

---

**Q12 — Overflow menu and panel-header menu: dark/light re-skins of DropdownMenu [M-3]**
Both menus need custom visual skins. The overflow menu is dark-surface; the panel-header menu is light-surface with checked/danger/disabled rows.
- **(a)** Use bidezine's `DropdownMenu*` components and pass className overrides for the dark/light skins.
- **(b)** Use Radix directly (via `radix-ui` package) to get full style control, bypassing bidezine's wrapper — same approach as the origin.
- **(c)** Build `DarkDropdownMenuContent` and update `dropdown-menu.tsx` to support a `variant="dark"` prop.

---

**Q13 — Panel resize: custom drag handle vs Resizable primitive [M-7]**
The panel has a mouse-drag resize handle. bidezine has `resizable.tsx` (react-resizable-panels).
- **(a)** Implement the custom drag handle as in the reference (8px invisible hit area, 3×32 pill grip, body cursor lock).
- **(b)** Use bidezine's `Resizable` primitive (changes the structural API — requires `ResizablePanelGroup` wrapper).
- **(c)** Remove panel resize entirely (fixed-width panel only).

---

**Q14 — Badge `neutral` and `info` variants, and dark-surface Badge [L-6]**
The origin Badge has `neutral` (subtle pill) and `info` (iris-colored pill) variants, plus `atomSurface="darkAtom"` for rendering on dark backgrounds. bidezine's Badge has `default/secondary/destructive/outline/ghost/link`.
- **(a)** Map `neutral` → bidezine `outline`, `info` → bidezine `secondary` (or `default`); dark-surface badge uses `secondary` or a custom dark variant.
- **(b)** Add `neutral` and `info` variants to bidezine's `badge.tsx` and `base.tokens.json`.
- **(c)** User specifies the exact variant mappings.

---

**Q15 — bidezine `Sidebar` vs RailNav coexistence [M-8]**
Both `src/ui/sidebar.tsx` and the incoming RailNav are navigation primitives called "sidebars" with overlapping conceptual territory.
- **(a)** Keep both as clearly distinct components with documentation differentiating use cases.
- **(b)** Deprecate `sidebar.tsx` and make RailNav the single app-shell navigation component.
- **(c)** No change needed — they serve different use cases (shadcn Sidebar = document/content navigation; RailNav = app-level icon-rail navigation).

---

**Q16 — Light panel surface token gaps [C-4 through C-12]**
Several light-surface tokens (`textSubtle`, `textDisabled`, `activeBg`, `pressedOverlay`, `focusOverlay`, `borderStrong`, and the hairline 0.5px convention) have no clean bidezine equivalents.
- **(a)** Add missing tokens to `tokens/light.tokens.json` and `dark.tokens.json`.
- **(b)** Map to the nearest bidezine token where close enough (accept minor visual differences).
- **(c)** Derive inline as CSS `oklch()` or `rgba()` values (technically violates the "no hand-written CSS variable" rule unless added via tokens).

---

*End of Intake / Dissection Report. This document is read-only analysis. No files have been modified. All decisions above are flagged for the human — none have been resolved by this agent.*
