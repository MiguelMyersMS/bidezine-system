# Interaction Patterns

> Shared component behavior specs for reporting/dashboard apps.
> Each section defines the state model, user actions, and visual rules for one interaction system.
> Add new sections as patterns are formalized (card expand/collapse, carousel, filters, etc.).
>
> Extracted from bloodwork-dashboard-prototype — applies to all consumers of @miguel/design-system.

---

## 1. Sidebar Navigation

### Architecture

Two-part system based on M3 Expressive Navigation Rail (May 2025):

| Part | Width | Role |
|------|-------|------|
| **Rail** | 56px | Dark navy icon column. Always visible. Shows all top-level sections. |
| **Secondary panel** | 300px default | White collapsible panel. Shows sub-items for the rail section whose panel is open. |

The rail and panel are visually adjacent but logically independent.

### State model (three orthogonal states)

| State | Variable | What it tracks | When it changes |
|-------|----------|---------------|-----------------|
| Active section | `activeSection` | Which rail section's **content** is displayed | Panel item click |
| Active item | `activePanel` | Which sub-item within the active section is shown | Panel item click |
| Open panel | `openPanel` | Which rail section's panel is **visible** (can differ from activeSection) | Rail click toggles; collapse chevron closes; auto-collapse on narrow viewport |

**Key principle:** Navigation state (what content is shown) and panel visibility (which panel is open) are **decoupled**. Opening a different section's panel does not change the displayed content until the user explicitly clicks a panel item.

### Action table

| User action | Panel | Content | Rail active indicator |
|-------------|-------|---------|----------------------|
| Click **different** rail icon | Opens that section's panel | **No change** | Stays on current section |
| Click **same active** rail icon | Toggles panel closed/open | **No change** | Stays on current section |
| Click **collapse chevron** (⟪) | Closes panel | **No change** | Stays on current section |
| Click **panel item** | Stays open | **Changes** to that item | **Moves** to that section |
| Auto-collapse (narrow viewport) | Closes | **No change** | Stays on current section |

### Why this pattern?

This is a **"peek before committing"** model (similar to VS Code's Activity Bar):

- **Prevents accidental navigation** — browsing another section's menu doesn't discard the current view.
- **Two-step navigation** — open panel → click item — is more intentional than single-click navigation.
- **Each section remembers its last selection** — returning to a section restores the previously selected sub-item.

The trade-off is a brief mismatch between panel title and content area when browsing. This is acceptable because the rail active indicator always shows the true content location.

### Rail icon visual states

The rail active indicator tracks `activeSection` (content), **not** `openPanel` (panel visibility).
Three distinct states separate "active" from "browsing":

| Rail icon state | Condition | Background | Border | Icon | Color |
|-----------------|-----------|------------|--------|------|-------|
| **Active** | `activeSection === id` | `darkActiveBg` (filled) | transparent | Filled | `onDark` (100%) |
| **Browsing** | `openPanel === id && activeSection !== id` | transparent | `1.5px solid darkBorderStrong` | Filled | `onDarkHover` |
| **Hovered** | Mouse over (not active/browsing) | `darkHoverBg` | transparent | Filled | `onDarkHover` |
| **Resting** | Default | transparent | transparent | Regular | `onDarkSubtle` |
| **Pressed** | Mouse down | `darkPressedBg` | transparent | Filled | `onDark` |

The **browsing** state (border outline + filled icon) signals "this section's panel is open, but you haven't navigated here yet."

### Secondary panel item visual states

| Item state | Condition | Visual |
|------------|-----------|--------|
| **Selected** | `railId === activeSection && activePanel === item.id` | `bg` background, `ink` color, `TYPE.medium`, filled icon |
| **Hovered** | Mouse over (when not selected) | `hoverBg`, `ink` color |
| **Resting** | Default | Transparent bg, `textSubtle` color (50% opacity) |

### Responsive behavior

| Viewport tier | Panel behavior |
|---------------|----------------|
| `xl` | Panel starts expanded, user can collapse/expand |
| `lg` and below | Panel auto-collapses; user can still open via rail click |
| All sizes | Rail is always visible (never hidden) |

### Layout tokens

| Token | Value | Source |
|-------|-------|--------|
| `LAYOUT.railW` | 56 | `@miguel/design-system/layout` |
| `LAYOUT.panelW` | 300 | `@miguel/design-system/layout` |
| `LAYOUT.panelGap` | 8 | `@miguel/design-system/layout` |
| `LAYOUT.hitTarget` | 40 | `@miguel/design-system/layout` |

The built-in `RailNav` panel supports session-only resize via drag handle. The resized width remains active while the app stays open, including across panel close/reopen and section changes, resets to the 300px default after app restart, and may not be reduced below 240px.

### Viewport containment

The rail and panel are viewport-bounded. They never extend beyond the visible app area and never cause the app shell to scroll.

**Full-height surface model:**

The rail surface fills the full viewport height on the Y-axis. On the X-axis it hugs its buttons (56px). Footer items are pushed to the bottom via a flex spacer — matching the bloodwork dashboard layout.

| Rule | Implementation |
|------|----------------|
| Aside (placement) | Stretches to shell height via flex stretch. `overflow: hidden` prevents content leak. |
| Rail surface | `flex: 1` — fills the full aside height. Footer pushed to bottom via spacer. |
| Panel surface | `flex: 1` in clip container. Scrolls internally when content exceeds available height. |
| App shell | `height: 100dvh; overflow: hidden` on root flex container. This is the single constraint source. |
| Aside alignment | `align-items: stretch` — children fill full height. |
| Rail margin | `SPACE[2]` (8px) padding on aside — rail floats inside the viewport, never touches browser edge. |
| Rail padding | `SPACE[2]` (8px) uniform — just enough to center 40px buttons inside 56px surface. |
| Containment chain | `100dvh → shell → aside (overflow: hidden) → surface (flex: 1, full height)` |
| Footer placement | Flex spacer `<div style={{ flex: 1 }} />` between `</nav>` and footer pushes footer to bottom. |

**Hard acceptance rule:** The dark rail surface must visually fill the entire viewport height (top to bottom, with 8px margin). Footer icons appear at the bottom. This matches the bloodwork dashboard reference.

### Rail overflow behavior

When the viewport is too short to display all rail icons, excess items collapse into a "More" menu.

| Aspect | Behavior |
|--------|----------|
| Trigger | Rail icons exceed computed max (auto-calculated from viewport height, or set via `maxVisibleRailItems` prop) |
| Visible items | First N sections remain as icon buttons |
| Hidden items | Move into a "More" dropdown anchored to an ellipsis (⋯) button |
| Active-in-overflow | A dot indicator appears on the More button when the active section is inside overflow |
| Menu style | Dark surface, rounded container, icon + label per item |
| Dismiss | Click outside, Escape key, or selecting an item |

**Protected bottom zone contract:** Footer navigation + utility actions occupy a separate bottom zone with a maximum of 3 visible icons. That zone never overflows into RailMenu and never disappears because the top zone has too many items. Overflow is a top-zone-only behavior.

**Budget calculation:**
```
Available height = 100dvh - aside padding (16px) - surface padding (16px) - footer (44px if present)
Max items = floor(available / 44px per slot)
When overflow: visible = max - 1 (reserve 1 slot for More button)
```

### Panel scroll behavior

Panel content scrolls internally when items overflow. The panel header stays fixed at the top.

| Part | Scroll behavior |
|------|----------------|
| Panel header (section label) | Fixed — `flexShrink: 0` |
| Panel items list | `overflow-y: auto`, `flex: 1`, `min-height: 0` |
| Panel container | `overflow: hidden` — prevents outer scroll leak |

### Keyboard behavior

| Key | Context | Action |
|-----|---------|--------|
| `Enter` / `Space` | Rail button | Opens/toggles panel for that section |
| `Enter` / `Space` | Panel item | Commits navigation |
| `Enter` / `Space` | More button | Opens/closes overflow menu |
| `Enter` / `Space` | Overflow menu item | Opens panel for that section |
| `Escape` | Overflow menu open | Closes overflow menu, returns focus to More button |
| `Escape` | Panel open | Closes panel |
| `Tab` | Any | Standard tab order through focusable elements |

### Focus management

| Scenario | Behavior |
|----------|----------|
| Overflow menu opens | First `[role="menuitem"]` receives focus |
| Overflow menu closes (Escape) | Focus returns to More (overflow trigger) button |
| Overflow menu closes (outside click) | Focus returns to More (overflow trigger) button |
| Overflow menu item selected | Focus returns to More (overflow trigger) button |

### Tooltip behavior

| Trigger | Shows tooltip |
|---------|--------------|
| Mouse hover | Yes — `onMouseEnter` / `onMouseLeave` |
| Keyboard focus | Yes — `onFocus` / `onBlur` on `<button>` |
| Suppressed | When section is active or panel is open (browsing) |

Tooltip text matches `aria-label` — no `aria-describedby` needed (avoids screen reader duplication).

### Accessibility requirements

| Requirement | Implementation |
|-------------|----------------|
| Rail landmark | `<nav aria-label="Main navigation">` |
| Panel landmark | `<nav aria-label="{section} items">` |
| Rail buttons | `aria-label={section.label}`, `aria-current="page"` when active |
| More button | `aria-haspopup="menu"`, `aria-expanded`, `aria-label` |
| Overflow menu | `role="menu"` with `role="menuitem"` children |
| Tooltips | `role="tooltip"`, `pointer-events: none` |
| Focus visible | Global `:focus-visible` styles injected by RailNav via `FOCUS_GLOBAL_CSS` |
| Focus return | Overflow menu close restores focus to trigger button |
| Auto-focus | Overflow menu opening focuses first `[role="menuitem"]` |
| Reduced motion | All transitions disabled when `prefers-reduced-motion: reduce` |

### Reduced motion

When the user has `prefers-reduced-motion: reduce` set:
- All CSS transitions are set to `none`
- Panel expand/collapse is instant
- State changes (hover, active, pressed) apply immediately without animation
- Uses `useReducedMotion()` hook internally

### Search box behavior

The sidebar panel may include a search bar (borderless input row per Golden Rule #1) that filters the nav tree. Search visibility and search text are **independent states** with different persistence rules.

#### State model

| State | Variable | Scope | Persistence | Changed by |
|-------|----------|-------|-------------|------------|
| Search visible | `searchVisible` | Session-level user preference | Survives panel collapse/expand, survives section switch | Panel menu toggle only |
| Search text | `searchValue` | Section-scoped working state | Survives panel collapse/expand for same section | User typing, clear button, section switch, menu toggle |

**Key principle:** Search visibility is a **session-level user preference**, not transient UI state. It survives panel open/close cycles. It is only changed by the explicit menu toggle ("Search box" item). Search text is a **section-scoped working state** — it persists across collapse/expand of the same section but resets when switching sections.

#### Action table

| User action | Search visibility | Search text | Focus | Rationale |
|---|---|---|---|---|
| **Toggle "Search box" OFF** via panel menu | Hides | **Cleared** | Returns to panel list | User explicitly dismissed — respect the decision |
| **Toggle "Search box" ON** via panel menu | Shows | **Empty** (fresh) | Moves to search input | Clean start — don't restore stale query |
| **Collapse panel** (chevron / click same rail icon) | N/A (panel hidden) | **Preserved** | N/A | Panel is hidden, not destroyed; user may resume |
| **Re-expand same section** | **Restored to last preference** | **Preserved** | N/A | If user hid search, it stays hidden. If visible, text is still there. |
| **Switch to different section** (click different rail icon) | **Restored to last preference** | **Cleared** | N/A | Search text is section-scoped; visibility preference is global |
| **Type in search input** | Stays visible | Updates live | Stays in input | Standard incremental search |
| **Press Escape in search input (has text)** | Stays visible | **Cleared** | Moves to first filtered item | Standard "clear field" pattern — not "hide search" |
| **Press Escape in search input (empty)** | Stays visible | Already empty | Moves to first item in list | Escape with nothing to clear returns focus to list |
| **Click clear button (×)** | Stays visible | **Cleared** | Stays in input | Clears text only — does not hide the box |
| **Press Escape on panel (no search focused)** | N/A | N/A | Closes panel | Standard panel dismiss |

#### Implementation requirements

1. **Controlled prop pattern.** `searchVisible` MUST be owned by the consumer (or lifted to the `RailNav`-wrapping parent), not stored as local `useState(true)` inside the panel component. This prevents reset-on-remount.
   ```tsx
   // Consumer owns the preference
   const [searchVisible, setSearchVisible] = useState(true);
   <RailNav searchVisible={searchVisible} onSearchVisibleChange={setSearchVisible} />
   ```
2. **Search text cleared on toggle-off.** When `searchVisible` transitions `true → false`, the `onSearchChange("")` callback fires automatically. This ensures the tree unfilters.
3. **Search text cleared on section switch.** When `activeSection` changes, `searchValue` resets to `""`. The visibility preference does NOT reset.
4. **No double-escape trap.** Escape in search input clears text (if any) and moves focus to the list. It does NOT hide the search box — that requires the explicit menu toggle. Second Escape (on the list) closes the panel.
5. **Menu item reflects state.** The "Search box" menu item shows a `checked` indicator when `searchVisible === true`. Label stays "Search box" regardless of state (not "Show search box" / "Hide search box").

#### Audit ID

`FN.SEARCH-STATE-RESET` (Medium) — search visibility resets on panel collapse/expand or section switch when it should persist. Grep target: `useState(true)` or `useState(false)` for search visibility inside a panel component that remounts on collapse.

### Do / Don't

| ✓ Do | ✗ Don't |
|------|---------|
| Use `100dvh` for viewport height | Hardcode pixel heights |
| Use `LAYOUT.railW` for rail width | Use magic numbers for dimensions |
| Use `tokens.darkSurface` for rail background | Use `bgSubtle` or surface tokens |
| Use `LAYOUT.hitTarget` for button size | Use 36px or other non-token sizes |
| Use `RADIUS.container` on rail/panel | Use `borderRight` hairline dividers |
| Decouple panel open from active content | Change content on rail click |
| Show overflow menu when items don't fit | Let rail extend beyond viewport |
| Scroll panel items internally | Let panel push app shell height |
| Respect `prefers-reduced-motion` | Assume all users want animation |

### Implementation checklist

A documented navigation pattern is **incomplete** unless it covers all four:

- [x] **Overflow behavior** — what happens when items don't fit
- [x] **Keyboard behavior** — all interactive elements reachable and operable
- [x] **Viewport behavior** — contained within viewport at all sizes
- [x] **Scroll behavior** — internal scroll, no layout overflow

### Logo slot (v0.1.2)

| Aspect | Behavior |
|--------|----------|
| Position | Top of rail, above `<nav>` landmark, outside navigation |
| Alignment | Centered in 40×40 grid cell (matches rail button grid) |
| Sizing | Must not distort rail width (56px) |
| Accessibility | Decorative logos: `aria-hidden="true"` on SVG. Interactive logos: provide accessible label. |
| Overflow | Logo area reserved in overflow budget (`ITEM_SLOT = 44px`). Does NOT count as a nav item. |

### Utility items slot (v0.1.2)

| Aspect | Behavior |
|--------|----------|
| Position | Bottom of rail, after flex spacer, above deprecated `footer` |
| Requirement | Must use DS rail button sizing: 40×40 hit target, `RADIUS.soft`, dark surface states |
| Focus | Must have `:focus-visible` styling (inherited from `FOCUS_GLOBAL_CSS`) |
| Priority | When viewport is too short, primary nav items overflow first — utility items remain visible |
| Replaces | `footer` prop (deprecated but still rendered below utilityItems) |

**`utilityItems` vs `footerSections` — choosing the right prop:**

| Prop | Type | Opens panel? | Use for |
|------|------|-------------|--------|
| `footerSections` | `RailSection[]` | **Yes** — same panel-open behavior as main `sections` | Buttons that navigate to a section with panel content (e.g., Settings with a settings panel, Notifications with a notification list) |
| `utilityItems` | `React.ReactNode` | **No** — standalone buttons, no panel association | Buttons that trigger inline actions, external links, or popover menus that don't use the sidebar panel (e.g., theme toggle, profile popover, help link) |

**Decision rule:** If clicking the button should open the sidebar panel with section-specific content, use `footerSections`. If it triggers something else (popover, modal, external link, toggle), use `utilityItems`.

**Common mistake:** Placing a Settings or Notifications button in `utilityItems` when it needs its own panel. The button renders correctly in the footer zone but clicking it does nothing because `utilityItems` are raw `ReactNode` with no panel routing. Use `footerSections` instead — it gets the same visual treatment (bottom of rail, same button sizing) plus panel integration.

**Audit ID:** `FN.FOOTER-BUTTON-NO-PANEL` (HIGH) — a footer button that visually resembles a section button (icon-only, same sizing) but doesn't open a panel when clicked. Either move it to `footerSections` or document why it intentionally has no panel. Blocks `beta` promotion.

**Mandatory implementation-time verification:** When wiring any icon button into the RailNav footer zone, the implementor MUST answer this question before choosing the prop slot: *"Does this button open a sidebar panel with section-specific content?"*
- **Yes** → use `footerSections` with a `RailSection` entry (provides panel routing, active state, tooltip automatically).
- **No** → use `utilityItems` with an explicit code comment: `// utilityItems: no panel — [reason]` (e.g., disabled, external link, theme toggle).
- **Unsure** → default to `footerSections`. It is always safer to provide panel routing that goes unused than to silently swallow clicks.

### Panel collapse (v0.1.2)

| Aspect | Behavior |
|--------|----------|
| Trigger | Collapse chevron button (⟪) in panel header |
| Target | Hides panel only — rail remains visible |
| Button | 28×28px, `RADIUS.soft`, `aria-label="Collapse sidebar"` |
| Controlled mode | `panelOpen` prop + `onPanelChange` callback — parent controls state |
| Uncontrolled mode | Omit `panelOpen` — component manages internally |
| Escape key | Closes overflow menu first (priority), then panel |
| Focus return | After collapse, focus returns to the corresponding rail button (`data-section-id` selector) |

### Multi-level nested groups

| Aspect | Behavior |
|--------|----------|
| Supported depth | **3 levels** (parent → child → grandchild) is the design-system’s guaranteed visual and accessibility contract. The implementation recurses via `RailPanelChild.children` and can technically render deeper, but depth beyond 3 is **not part of the supported contract** — visual density, indentation, and accessibility have not been validated past level 3. Consumers exceeding 3 levels will see a dev-mode console warning. |
| Parent role | Disclosure toggle (not a route). `aria-expanded` on button. |
| Group semantics | `role="group"` with `aria-labelledby` linking to parent button ID |
| Expand/collapse | Click or Enter/Space on parent. Chevron rotates 0° → -90°. **Chevron rotation MUST be driven by `isExpanded` only — never by `isActive` or `hasActiveChild`.** When a group contains the active item, `isActive` is always true, so `isActive \|\| isExpanded` locks the chevron at 0° even after collapse. See `CP.CHEVRON-ROTATION-ACTIVE-LOCK`. |
| Auto-expand | On mount, **all ancestor groups** containing `activeItem` auto-expand recursively via `hasActiveDescendant()` |
| Indent per depth | `paddingLeft: SPACE[3] + depth × SPACE[5]` — each level adds 24px indent |
| Vertical guide line | 1px `tokens.border` line positioned at the parent icon center for each nesting level |
| Typography | All depths use `TYPE.bodyM`. Active items get `fontWeight: 500` and `tokens.ink` color. |
| Icons per depth | Optional at every depth. 20px size. `filled` on selected/hovered. |
| Chevron per depth | 16px `IconChevronDown`, right-aligned. Rotates -90° when collapsed. |
| Ancestor treatment | When a descendant is active, all ancestor group headers show `tokens.ink` color and `fontWeight: 500` |
| Product guidance | Prefer flat categories for report apps. Use nesting only when hierarchy genuinely reduces cognitive load. Depth beyond 3 levels is outside the supported visual/accessibility contract and requires explicit design review. |

### Item icons (v0.1.2)

| Aspect | Behavior |
|--------|----------|
| Optional | Icons never replace text labels. Text is always rendered. |
| Filled state | Icon shows `filled={true}` only when item is selected |
| Size | 18px (standard DS icon tier) |
| Alignment rule | Within a section, items should consistently either all have icons or all not have icons. Mixed usage causes text misalignment. |
| Indent with icons | Children in nested groups use indent padding regardless of icon presence |

### Reusable component

The canonical implementation is `RailNav` from `@miguel/design-system/gallery`.

```tsx
import { RailNav } from "@miguel/design-system/gallery";
import type { RailSection } from "@miguel/design-system/gallery";
```

Consumers should use `RailNav` rather than building custom rail implementations.
The docs app itself uses this component — it is the primary dogfooding consumer.

### Design references

- [M3 Navigation Rail — Guidelines](https://m3.material.io/components/navigation-rail/guidelines) — collapsed/expanded behavior, active indicator rules
- [M3 Navigation Drawer — Guidelines](https://m3.material.io/components/navigation-drawer/guidelines) — standard vs modal, dismissible behavior
- M3 Expressive update (May 2025): expanded nav rail replaces navigation drawer

---

## 2. Scroll Regions

> System-wide convention for any bounded scrollable area: panels, menus, popovers,
> dialogs, command palettes, dropdown lists. Defined in `SCROLL` from `status.ts`.

### Two-layer structure

| Layer | Role | Required styles |
|-------|------|-----------------|
| **Outer shell** | Visual styling (bg, border, shadow, radius) | `padding: SPACE[2]`, `overflow: hidden`, `display: flex; flex-direction: column` |
| **Inner scroll** | Scrolling | `overflow-y: auto`, `flex: 1`, `min-height: 0`, `className={SCROLL.className}` |

### Conditional right padding

The inner scroll div gets `paddingRight: scrollable ? SPACE[2] : 0`.

Scrollability is detected by a `ResizeObserver` comparing `scrollHeight > clientHeight`.
This creates a gap between content and scrollbar only when the scrollbar is visible,
and reclaims the space when content fits without scrolling.

### Scrollbar styling

Provided by `SCROLL.css(tokens)` — inject once via `<style>{SCROLL.css(tokens)}</style>`.

| Property | Value |
|----------|-------|
| Width | 4px |
| Track | Transparent |
| Thumb | `tokens.border` (themed) |
| Thumb hover | `tokens.textMuted` |
| Firefox | `scrollbar-width: thin; scrollbar-color: ${tokens.border} transparent` |

### Anti-patterns

| Anti-pattern | Catalog ID | What to do instead |
|-------------|-----------|-------------------|
| Component-specific scrollbar class (e.g. `my-component-scroll`) | `SC.COMPONENT-SPECIFIC-SCROLLBAR` | Use `SCROLL.className` |
| Scrollbar CSS duplicated inline | `SC.SCROLL-PATTERN-VIOLATION` | Use `SCROLL.css(tokens)` |
| Scroll on outer shell (no inner layer) | `SC.SCROLL-PATTERN-VIOLATION` | Split into outer shell + inner scroll |
| Fixed `paddingRight` regardless of scrollbar | `SC.SCROLL-PATTERN-VIOLATION` | Use ResizeObserver conditional padding |

### Where this applies

- RailNav panel (nav items scroll)
- RailNav overflow menu (when capped by viewport)
- DateChip dropdown (if list overflows)
- Future: dialogs, command palettes, select menus, any bounded list

---

## 3. Overlay Positioning (Menus, Popovers, Tooltips)

> System-wide rules for absolutely-positioned elements that must escape their
> parent bounds and remain visible within the viewport.

### Viewport-aware positioning

All menus, popovers, and dropdowns MUST:

1. Measure available space above/below the trigger using `getBoundingClientRect()`
2. Default to opening downward (`top: 0` relative to trigger)
3. Flip upward (`bottom: 0`) when downward would clip
4. Cap `maxHeight` and enable scroll when neither direction has enough space
5. Use `useLayoutEffect` (not `useEffect`) to prevent flash of unconstrained position

### Stacking context rules

| Rule | Catalog ID |
|------|-----------|
| Do not place `z-index` on a container unless layering is needed **within** the component | `LAY.STACKING-CONTEXT-TRAP` |
| Do not place `overflow: hidden` on a container whose children include overlays | `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` |
| Do not measure `clientHeight` of an element whose `overflow` makes the value unreliable | `LAY.OVERFLOW-MEASUREMENT-FRAGILE` |

### Overflow measurement

When computing how many items fit in a container:

- **Do not** rely on measuring a div that also has `overflow: hidden/clip` — the
  overflow property can make `clientHeight` unreliable in flex contexts.
- **Do** measure a stable ancestor (e.g., the rail surface) and subtract the
  measured heights of sibling elements (logo, footer) using separate refs.
- **Do** use `ResizeObserver` for responsive measurement — not `window.innerHeight` math.

### Anti-patterns

| Anti-pattern | Catalog ID |
|-------------|-----------|
| Menu at fixed `top: 0` without viewport check | `LAY.VIEWPORT-UNSAFE-OVERLAY` |
| `position: relative; z-index: 1` on a container that doesn't need layering | `LAY.STACKING-CONTEXT-TRAP` |
| `overflow: hidden` on a container whose children include tooltips/menus | `LAY.TOOLTIP-CLIPPED-BY-CONTAINER` |
| Overflow budget computed from clipped element's `clientHeight` | `LAY.OVERFLOW-MEASUREMENT-FRAGILE` |
