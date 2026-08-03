# `@miguel/design-system` — Reference for Figma Make

> **Purpose.** Hand this whole document to **Figma Make** so anything it generates (new atoms,
> molecules, organisms, or screens) matches our existing system: same tokens, same naming, same code
> approach. It is a single self-contained snapshot of our foundations, component inventory, and
> conventions. **Figma is the source of truth** for what things look like; this doc is the bridge so a
> generated design translates to our code with zero ambiguity.
>
> Figma file: `Single shape` · fileKey `EyYETHXMDDURPGK4PXTU5C`. Node IDs below reference that file.

---

## 0. The code approach (the contract Figma Make output must fit)

- **Stack:** React + TypeScript, shipped as **raw `.ts`/`.tsx`** (no build step; the consumer's Vite
  compiles on import). Atomic design: **atoms → molecules → organisms**.
- **Tokens, never raw values.** Every color/size/space/radius/type comes from a token. **Never a raw
  hex, never a magic px** where a token exists.
- **Theme-aware.** Components read tokens at render via `useTokens()` and must work in **both light and
  dark** (the live consumers — Rayfin/Fabric dashboards — currently run **dark**).
- **Opacity via color alpha, never CSS `opacity`** for text/icons.
- **Icons:** Microsoft **Fluent UI System Icons** only, fill-based, `viewBox="0 0 20 20"`.
- **Radius:** only the defined tiers (pill 99 / rounded 12 / soft 8 / xs 4 / container 16–20). No new tiers.

### Canonical component skeleton (generated code should look like this)
```tsx
import { useTokens } from "@miguel/design-system/theme";
import { TYPE } from "@miguel/design-system/tokens";
import { SPACE, RADIUS, LAYOUT } from "@miguel/design-system/layout";
import { IconCalendarSync } from "@miguel/design-system/icons";

export interface ExampleProps {
  label: string;
  value: string;
}

export default function Example({ label, value }: ExampleProps) {
  const tokens = useTokens();                       // <- theme-aware, light/dark
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: SPACE[2],   // 8px
      padding: `${SPACE[1]}px ${SPACE[2]}px`,                   // 4px 8px
      borderRadius: RADIUS.pill,                                // 99
      background: tokens.surface,                               // never "#fff"
      border: `1px solid ${tokens.hairline}`,
    }}>
      <span style={{ ...TYPE.caption, color: tokens.textMuted }}>{label}</span>
      <span style={{ ...TYPE.captionStrong, color: tokens.ink }}>{value}</span>
    </div>
  );
}
```

Import map: `@miguel/design-system/{tokens,layout,theme,status,motion,icons,gallery}`.

---

## 1. Foundations — Color tokens

Two layers: **PALETTE** (raw Radix colors, never used directly in components) → **semantic tokens**
(what components reference, mapped per theme). Figma Make should map to the **semantic** names.

### Palette (Radix) — primitives
| Scale | Light steps (1→12) | Dark steps (1→12) |
|---|---|---|
| **slate** | `#fcfcfd #f9f9fb #f0f0f3 #e8e8ec #e0e1e6 #d9d9e0 #cdced6 #b9bbc6 #8b8d98 #80838d #60646c #1c2024` | `#111113 #18191b #212225 #272a2d #2e3135 #363a3f #43484e #5a6169 #696e77 #777b84 #b0b4ba #edeef0` |
| **indigo** (accent) | `…9=#3e63dd 10=#3358d4 11=#3a5bc7 12=#1f2d5c` (3=#edeef9 4=#e0e2f5) | `…9=#3e63dd 10=#5472e4 11=#849dff 12=#d6e1ff` (3=#1f2768) |
| **red** | `3=#feebec 9=#e5484d 11=#ce2c31` | `3=#3b1219 9=#e5484d 11=#ff9592` |
| **amber** | `3=#fff7c2 9=#ffc53d 11=#ab6400` | `3=#302008 9=#ffc53d 11=#ffca16` |
| **green** | `3=#e6f6eb 9=#30a46c 11=#218358` | `3=#132d21 9=#30a46c 11=#3dd68c` |
| pure | white `#ffffff` · black `#000000` | — |

### Semantic tokens (`tokens.*`) — what components use
| Token | Role | Light | Dark |
|---|---|---|---|
| `ink` | primary text/icon (INVERTS per mode) | `#1c2024` | `#edeef0` |
| `textMuted` | secondary text | `#60646c` | `#b0b4ba` |
| `textSubtle` | tertiary/placeholder | `#8b8d98` | `#696e77` |
| `textDisabled` / `iconDisabled` | disabled | `#b9bbc6` | `#5a6169` |
| `onDark` | text on a **permanently** dark surface (rail) — always white | `#ffffff` | `#ffffff` |
| `onInk` | text on the **`ink` fill** (INVERTS — pairs with `ink`) | `#ffffff` | `#111113` |
| `bg` | app background | `#f0f0f3` | `#18191b` |
| `bgSubtle` | subtle background | `#f9f9fb` | `#212225` |
| `surface` | card/panel/pill surface | `#ffffff` | `#272a2d` |
| `hoverBg` | hover fill | `#f0f0f3` | `#2e3135` |
| `activeBg` | pressed/active fill | `#e8e8ec` | `#2e3135` |
| `bgStrong` | stronger fill | `#e0e1e6` | `#363a3f` |
| `hairline` | subtle border/divider | `#d9d9e0` | `#363a3f` |
| `border` | default border | `#cdced6` | `#43484e` |
| `borderStrong` | strong border | `#b9bbc6` | `#5a6169` |
| `accent` | brand/CTA/focus ring | `#3e63dd` | `#3e63dd` |
| `accentHover` / `accentPressed` | accent states | `#3358d4` / `#3a5bc7` | `#5472e4` / `#849dff` |
| `accentSubtle` / `accentText` | accent bg / accent-on-light text | `#edeef9` / `#3a5bc7` | `#1f2768` / `#849dff` |
| `statusRed/Amber/Green` | status solids | `#e5484d / #ffc53d / #30a46c` | same / `#ffc53d` / `#30a46c` |
| `statusRedText` etc. | status text (legible) | `#ce2c31 / #ab6400 / #218358` | `#ff9592 / #ffca16 / #3dd68c` |
| `statusRedSubtle` etc. | status bg | `#feebec / #fff7c2 / #e6f6eb` | `#3b1219 / #302008 / #132d21` |
| **Dark-surface set** (the rail is dark in BOTH themes) | | | |
| `darkSurface` | the rail/dark overlay surface | `#1c2024` | `#1c2024` |
| `onDarkHover/Muted/Subtle/Faint/Disabled` | white at 85/70/50/40/20% alpha | white-alpha | white-alpha |

> **Theme rule (critical, the `onInk` lesson):** a fill that **inverts per mode** needs an inverting
> foreground. `ink` is dark in light mode / light in dark mode → text on an `ink` fill MUST use
> **`onInk`** (white→near-black), **NOT `onDark`** (always white, which is illegible on the dark-mode
> light pill). `onDark` is only for *permanently* dark surfaces (the rail). When you design a "selected"
> or "filled" element, say which token the fill and the foreground use.

---

## 2. Foundations — Typography

Fonts (Google Fonts CDN, no proprietary): **Inter** (UI/body/labels), **DM Sans** (hero numbers),
**Raleway** (large display). Spread a `TYPE.*` object into `style` then set `color` separately.

| Token | Font | Size / Weight / LineHeight | Use |
|---|---|---|---|
| `displayXl` | DM Sans | 48 / 700 / 1.0 (tabular-nums) | hero callout numbers |
| `displayL` | Raleway | 28 / 700 / 1.1 | large display headings |
| `headingL` | Inter | 22 / 500 / 1.25 | section headings |
| `headingM` | Inter | 18 / 500 / 1.3 | subsection headings |
| `headingS` | Inter | 16 / 500 / 1.3 | card/panel titles |
| `bodyM` | Inter | 14 / 400 / 1.55 | default body |
| `bodyS` | Inter | 13 / 400 / 1.5 | compact body (menu rows) |
| `labelL` | Inter | 14 / 500 / 1.55 | selected/active nav + select rows |
| `labelM` | Inter | 13 / 500 / 1.4 | buttons, pills, badges, active menu rows |
| `caption` | Inter | 12 / 400 / 1.5 | small labels, timestamps |
| `captionStrong` | Inter | 12 / 600 / 1.5 | pill values, emphasized captions |
| modifiers | — | `strong`=700 · `medium`=500 · `light`=400 | spread after a TYPE token |

Opacity tiers (apply via color alpha): 100% emphasized/selected · 70% body · 50% inactive · 40% de-emphasized.

---

## 3. Foundations — Spacing, Radius, Layout, Motion, Elevation

**Spacing `SPACE[n]` (px):** 0:0 · 1:4 · 2:8 · 3:12 · 4:16 · 5:24 · 6:32 · 7:40 · 8:48 · 9:64.

**Radius `RADIUS.*`:** `pill`:99 · `rounded`:12 · `soft`:8 · `xs`:4 · `tooltip`:6 · `container`:18 ·
`containerSm`:16 · `containerLg`:20. (Interactive elements use pill/rounded/soft/xs only.)

**Layout `LAYOUT.*` (px):** `railW`:54 · `panelW`:300 · `railButton`:38 · `hitTarget`:40 ·
`hitTargetLg`:44 · `hitTargetSm`:36 · `hitTargetXs`:28 · `contentMax`:1640 · `contentPad`:32 ·
`checkboxSize`:18 · toggle 36×20 (knob 16). **List rows `LIST_ROW`:** compact 28 · default 32 ·
comfortable 40 · multiline 48. **Breakpoints `BP`:** xs520 sm768 md1024 lg1280 xl1640.

**Motion `MOTION.*` (ms / easing):** durations fast 120 · base 150 · medium 200 · slow 350 · reveal 700;
easings `ease` · `easeOut` · `expressive` cubic-bezier(0.22,1,0.36,1). Mandatory reduced-motion instant
fallback. Shared `<Collapse>` primitive for auto-height disclosure.

**Elevation `elevation(t).*`:** flat `0 1px 0` · low `0 1px 3px` · mid `0 2px 8px` · high `0 4px 24px` ·
overlay `0 8px 40px` (shadow tokens, stronger in dark). **Z `Z.*`:** base 1 · dropdown · overlay 50.
**Focus:** always `FOCUS.style(tokens)` = `2px solid tokens.accent`, offset 2 (keyboard-only). **Disabled:**
`DISABLED.cursor` = not-allowed + token color reset (never CSS opacity).

---

## 4. Icons

Fluent UI System Icons ONLY (no Lucide/Heroicons/Material/custom, except the brand logo). Conventions:
fill-based inline SVG, `viewBox="0 0 20 20"`; interactive icons accept `filled?: boolean` and branch on
two paths (Regular→Filled on hover/active); sizes 20px (nav/rail/footer/panel), 16px (disclosure
chevrons), 36px (decorative hero). Color via a `color` prop (currentColor). ~107 icons exported from
`@miguel/design-system/icons`. To add one: pull both Regular + Filled 20px SVGs from the Fluent repo
(`assets/<Name>/SVG/ic_fluent_<name>_20_{regular,filled}.svg`).

---

## 5. Atomic inventory (what already exists — reuse, don't recreate)

Each row: **component · Figma node · status** (`verified` = vision-checked vs Figma; `implemented` =
built, not yet vision-verified; `extracting`/`draft` = in progress).

### Atoms (indivisible)
| Component | Node | Status | What it is |
|---|---|---|---|
| `IconSlot` | 136:10925 | implemented | 20px icon container (4px radius) |
| `RailButton` | 165:4188 | implemented | 38px rail icon button (states: rest/hover/active/browsing/disabled) |
| `ChevronTrigger` | 292:3970 | implemented | disclosure chevron button (rotates per expand) |
| `ClearButton` | 292:4102 | implemented | search clear (×), visibility-hidden when empty |
| `EllipsisButton` | 297:5797 | implemented | "…" overflow trigger |
| `ExpandButton` | 297:5843 | implemented | panel expand/collapse button |
| `Divider` | 138:2830 | implemented | hairline divider |
| `NavIndentLine` | 207:3584 | implemented | nested-row indent guide (18px) |
| `LogoSlot` | 166:4216 | implemented | brand logo container (rail) |
| `Scrollbar` | 162:3082 | implemented | scrollbar artifact contract |
| `SelectionIndicator` | 292:3716 | implemented | checkmark/selection mark |
| `TrendArrow` | 350:5012 | implemented | up/down trend arrow (chart/stat) |
| `InfoIcon` | 342:4530 | implemented | info "i" affordance |
| `CarouselMark` / `ChevronCarousel` | 357:4764 / 358:4752 | implemented | carousel dot / chevron |

### Molecules (small compositions)
| Component | Node | Status | What it is |
|---|---|---|---|
| `NavRow` | 207:3406 | **verified** | sidebar nav row (depth 0-2 × states rest/hover/active/active-expanded/disabled/focus). Active = filled `ink`+`onInk`. |
| `InfoPill` | 338:4608 | **verified** | icon + muted label + bold value pill (hairline, RADIUS.pill) |
| `MenuItem` / `MenuItemDark` | 139:3594 / 194:3128 | implemented | menu row (light / dark surface) |
| `PanelHeader` | 209:3944 | implemented | sidebar panel header (title · "…" menu · collapse) |
| `SearchBar` | 139:3053 | implemented | search input + ClearButton |
| `SelectHeader` / `SelectRow` / `FeedbackText` | 296:4796 / 292:4166 / 299:4229 | implemented/extracting | Select dropdown parts |

### Organisms (assembled surfaces)
| Component | Node | Status | What it is |
|---|---|---|---|
| `RailNav` | 166:4494 | **verified** | dark icon rail + built-in sidebar panel (logo · sections · overflow · footer) |
| `SidebarPanel` | 224:3458 | implemented | the panel: header + search + scrollable nav tree |
| `ActionMenu` (+ sort/presets submenus) | 279:3934 (162:2959 / 141:3145) | **verified** | action menu with submenus |
| `OverflowMenu` | 195:3231 | **verified** | rail "More" overflow menu (dark) |
| `SelectDropdown` | 296:3919 | implemented | full Select dropdown |
| `PageHeaderTitle` | 338:4598 | **verified** | page title + subtitle + right-aligned InfoPill |
| `NavPanelShell` | — | draft | nav panel shell (in progress) |

---

## 6. Gallery (Storybook reusable controls — also available to consume)

All exported from `@miguel/design-system/gallery`. These are production controls beyond the atomic
specs above — reuse them; tell Figma Make these exist so it doesn't redraw them.

`ActionMenu` · `Badge` · `Button` · `Card` · `ChartCard` · `DataTable` · `DateChip` · `Dialog` ·
`Divider` · `Dots` · `DarkPillButton` · `EmptyState` · `FilterBar` · `IconButton` · `InfoIcon` ·
`InfoPill` · `LogoSlot` · `MetricCard` · `PageHeaderTitle` · `PageShell` · `Placeholder` · `RailNav` ·
`Segmented` · `Select` · `Spinner` · `StatCard` · `Tabs` · `TextInput` · `Tooltip` · `TrendArrow` ·
(+ the atoms: `CarouselMark` `ChevronCarousel` `ChevronTrigger` `ClearButton` `EllipsisButton`
`ExpandButton` `NavIndentLine` `RailButton` `SelectionIndicator`).

Domain-specific charts (D3/SVG) live in the consumer apps, not here — but they consume these tokens +
controls (e.g. a `ChartCard` wraps a D3 chart; `StatCard`/`MetricCard`/`TrendArrow` present chart-adjacent
numbers). New chart-bearing components should follow the same token/naming approach.

---

## 7. Figma ↔ code naming parity (so a generated layer maps to a prop)

This is the single most important thing for Figma Make output to be usable. **Name Figma layers as the
code identifiers they become.**

- **Component name = Figma component/frame name** (`NavRow`, `InfoPill`, `PageHeaderTitle`).
- **Slots** are named by role, in `Parent/Slot` form → these become props/sub-elements:
  `Row/LeadingSlot`, `Row/Label`, `Row/Badge`, `Icon/Slot`, `LogoSlot`, `FooterSlot`. Avoid
  `Frame 1234` / `Group 5` — unnamed frames don't translate.
- **Variant axes = props.** Figma variant properties map 1:1 to a prop/enum:
  `state = rest | hover | active | active-expanded | disabled | focus`, `depth = 0 | 1 | 2`,
  `filled = true | false`, `size = 16 | 20`. Name them exactly so `state=active` → `isActive`/the active branch.
- **Tokens = Figma variables.** Bind Figma color/number variables to the **semantic token names** above
  (`ink`, `surface`, `hairline`, `accent`, `SPACE/4`, `RADIUS/pill`) so a generated fill carries its token.
- **Text styles = TYPE tokens** (`bodyM`, `labelL`, `caption`…). Set `textAlignHorizontal` explicitly
  (it must become `textAlign` in code).
- **States carry full per-slot color** — every state defines fill for background, label, badge, icon,
  chevron (not just background). Disabled is a FULL reset (every slot → disabled token).

---

## 8. Patterns/contracts a NEW component must follow

So generated components are accepted into the system:
1. **Theme-aware** — works in light + dark via `useTokens()`; no fixed colors on inverting surfaces (use `onInk` on `ink` fills).
2. **Overlays escape via portal** — any menu/popover/tooltip/dropdown uses `createPortal(document.body)` + `position: fixed` (never `position:absolute` inside an `overflow:hidden/clip` container).
3. **Focus** — keyboard-only `FOCUS.style(tokens)` (accent ring, offset 2); suppress on mouse via `onMouseDown preventDefault`.
4. **Scroll gutter** — scrollable surfaces: outer owns `SPACE[2]` padding; inner scroll container `padding:0` with conditional `paddingRight` only when scrollable.
5. **Icons** — Fluent only, `filled` branch for interactive contexts, 20px viewBox.
6. **Sizes are Figma-exact** — don't inflate to a hit-target "for a11y" (28×28 already passes WCAG). Use the computed natural height (`padding + content`).
7. **Slots always present** — optional slots render with `visibility:hidden`, not removed.
8. **a11y** — text contrast ≥4.5:1, non-text ≥3:1; targets ≥24px; visible keyboard focus; correct roles.
9. **No CSS `opacity` for text** — use color alpha.

---

## 9. How to use this with Figma Make + where it should help

**Give Figma Make this whole file** + the prompt: *"Use these tokens, this atomic inventory, and these
naming/code conventions. Reuse existing atoms/molecules/organisms; only create what's missing. Name
every layer as its code identifier, bind every color/number to the listed semantic token, and make it
theme-aware (light + dark)."*

**Gaps it can help fill** (candidates for new atoms/molecules/organisms — confirm against the inventory
above before generating): form controls (Checkbox, Radio, Switch/Toggle as a spec'd atom, Slider),
feedback (Toast/Snackbar, Banner/Alert, ProgressBar, Skeleton), data display (Table cell variants,
Pagination, Avatar, Chip/Tag, KPI/metric tiles, Legend), navigation (Breadcrumb, Tabs variants,
Stepper), overlays (Popover, Drawer, ContextMenu), and chart scaffolding (chart axis/legend/tooltip
atoms that wrap D3/SVG). For each new piece: pick the right atomic level, compose from existing atoms,
name layers as code, bind tokens, and define all states.

> After Figma Make produces a design, bring the node back through our pipeline:
> `/figma-build <node>` (extract→implement), then verify with `/evidence-pipeline <slug>` (one) or
> `/evidence-wave <level>` (many) — plus the `design-system-auditor` agent for a parity/decomposition
> check. That's how a generated frame becomes a verified, shipped component.
