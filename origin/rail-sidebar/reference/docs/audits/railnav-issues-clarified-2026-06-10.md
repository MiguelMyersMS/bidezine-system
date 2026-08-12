# RailNav Issues — Verified & Corrected (2026-06-10)

## Critical Issues Found

### ❌ **ISSUE #1: GOLDEN RULE #3 VIOLATION — Tooltips Using `position: absolute` (BLOCKER)**

**Severity:** BLOCKER — Violates Golden Rule #3 explicitly documented in the code

**Location:** `src/gallery/RailNav.tsx`
- Line 452: Navigation container has `overflow: "clip"`
- Lines 755, 915, 992: Tooltips use `position: "absolute"` inside that overflow container
- Lines 686, 730: Resize separator and logo panel also have overflow constraints

**The Problem:**
Tooltips for RailButton, LogoSlot, and OverflowButton are positioned absolutely but are rendered INSIDE a flex child with `overflow: "clip"`. This clips the tooltips, making them invisible.

```typescript
// ❌ WRONG PATTERN:
<div style={{ flex: 1, minHeight: 0, overflow: "clip" }}>  // ← Clips descendants
  <nav style={{ gap: SPACE[1] }}>
    <RailButton />  {/* Contains position: absolute tooltip → CLIPPED! */}
  </nav>
</div>
```

**Figma/Spec Source:**
Golden Rule #3 (AGENTS.md) explicitly states:
```
Every menu, dropdown popover, tooltip, or overlay in this design system MUST be
rendered via ReactDOM.createPortal(..., document.body) with position: fixed.
The ONLY allowed overlay positioning strategy is portal + fixed positioning.
```

**Code Gap:**
The irony: line 1368 contains a comment warning AGAINST this exact pattern:
```typescript
// Never use position: absolute inside a component tree that may have overflow: hidden ancestors.
```

Yet that's exactly what the tooltips do.

---

### ❌ **ISSUE #2: PanelItem Selected State — Wrong Token (MEDIUM)**

**Location:** `src/gallery/RailNav.tsx:1278` (PanelItem component)

**Spec Source:** AGENTS.md Button States contract (calm rest → progressive engagement):
```
| State | Background | Label color |
| Selected | bgSubtle (filled) | ink |
| Hover | hoverBg (lighter) | ink |
```

**Code (WRONG):**
```typescript
background: selected ? tokens.hoverBg : hovered ? tokens.hoverBg : "transparent",
```

Both selected and hovered use `tokens.hoverBg` — no visual differentiation.

**Should Be:**
```typescript
background: selected ? tokens.bgSubtle : hovered ? tokens.hoverBg : "transparent",
```

**RailButton/MenuItemDark Reference:**
- RailButton dark surface: hovered uses darkHoverBg (0.1 opacity), active uses darkActiveBg (0.2 opacity) ✓ differentiated
- MenuItemDark: hovered uses darkHoverBg (0.1), selected uses darkActiveBg (0.2) ✓ differentiated
- PanelItem light surface: both use hoverBg ✗ NOT differentiated (violates contract)

---

### ⚠️ **ISSUE #3: RailNav Internal Gap — Clarification Needed**

**Location:** `src/gallery/RailNav.tsx:428`

**Current Code:**
```typescript
gap: SPACE[1],  // 4px
```

**Figma Spec (railnav.spec.md):**
```yaml
# RailNav (FRAME, column, gap: 16px, padding: 8px)
# │
# ├── LogoSlot
# ├── RailNav (section column)
# └── FooterSlot
gap: "16px"  # SPACE[4] between these three sections
```

**Your Clarification Needed:**
You said "the gap between the rail and the side bar seems right." This gap (rail-to-panel) is set by `marginLeft: LAYOUT.panelGap` (8px) and is correct.

**But** the INTERNAL gap within the rail (between LogoSlot, nav column, and FooterSlot) should be 16px per Figma, not 4px.

**Question:** Should the internal rail sections have 16px gap (SPACE[4])? Or did the Figma spec change and should now be 4px?

---

### ✅ **ISSUE #4: MenuItemDark Icon Slot — VERIFIED CORRECT**

**Figma Spec (menuitemdark.spec.md):**
```yaml
slots:
  - id: icon-slot-left
    width: 20    # px — INCREASED 2026-06-10 (was 18px)
    height: 20   # px
```

**Code (`src/gallery/RailNav.tsx:1230`):**
```typescript
<span style={{
  width: 20,      // ✓ Correct
  height: 20,     // ✓ Correct
  flexShrink: 0,
}}>
  <Icon size={16} color="currentColor" filled={...} />  // ✓ Correct (icon inside slot)
</span>
```

**Status:** ✅ Code matches Figma (Golden Rule #4 compliant)

---

### ❌ **ISSUE #5: RailButton & OverflowMenuItem Selected/Hover Differentiation — VERIFIED CORRECT**

**Figma State Matrix (railbutton.spec.md & menuitemdark.spec.md):**

| State | RailButton | MenuItemDark |
|-------|-----------|--------------|
| **Hover** | bg=darkHoverBg (0.1), icon=onDarkHover (85%), fill=filled | bg=darkHoverBg (0.1), label=onDarkHover (85%), fill=filled |
| **Selected/Active** | bg=darkActiveBg (0.2), icon=onDark (100%), fill=filled | bg=darkActiveBg (0.2), label=onDark (100%), indicator=checkmark |

**Code (`src/gallery/RailNav.tsx:850-868` & `1195-1204`):**

**RailButton:**
```typescript
const bg = pressed ? tokens.darkPressedBg
  : active ? tokens.darkActiveBg       // ✓ 0.2 opacity
  : hovered ? tokens.darkHoverBg       // ✓ 0.1 opacity
  : "transparent";

const color = active ? tokens.onDark       // ✓ 100% white
  : browsing || hovered ? tokens.onDarkHover  // ✓ 85% white
  : tokens.onDarkSubtle;

// Icon fill:
<Icon filled={active || browsing || hovered || pressed} />  // ✓ Correct
```

**OverflowMenuItem:**
```typescript
const bg = active ? tokens.darkActiveBg      // ✓ 0.2 opacity
  : hovered ? tokens.darkHoverBg           // ✓ 0.1 opacity
  : "transparent";

const color = active ? tokens.onDark              // ✓ 100% white
  : browsing || hovered ? tokens.onDarkHover    // ✓ 85% white
  : tokens.onDarkSubtle;

<Icon filled={active || browsing || hovered} />  // ✓ Correct
```

**Status:** ✅ Both RailButton and OverflowMenuItem have CLEAR differentiation between hover and active/selected. Spec is correctly implemented.

**Note:** User's concern was about PanelItem (light surface), not RailButton/MenuItemDark. PanelItem is the one missing differentiation.

---

## Summary of Fixes Required

| Issue | Type | Fix |
|-------|------|-----|
| Tooltips position: absolute inside overflow: clip | BLOCKER | Convert to ReactDOM.createPortal + position: fixed (Golden Rule #3) |
| PanelItem selected background | MEDIUM | Change `tokens.hoverBg` → `tokens.bgSubtle` for selected state |
| RailNav internal gap (4px vs 16px) | CLARIFICATION | Need user confirmation on Figma intent |

---

## Tooltip Conversion Plan (Golden Rule #3)

**Current Pattern (WRONG):**
```tsx
// Inside RailButton wrapper with position: relative
<div style={{ position: "relative" }}>
  <button>{/* icon */}</button>
  {showTooltip && (
    <span style={{ position: "absolute" }}>  {/* ← Clipped by overflow: clip */}
      Tooltip text
    </span>
  )}
</div>
```

**Fixed Pattern (Golden Rule #3):**
```tsx
// Separate state management
const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);

return (
  <>
    <button
      ref={btnRef}
      onMouseEnter={() => setTooltipAnchor(btnRef.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setTooltipAnchor(null)}
    >
      {/* icon */}
    </button>
    
    {tooltipAnchor && ReactDOM.createPortal(
      <Tooltip
        anchorRect={tooltipAnchor}
        text="Tooltip text"
      />,
      document.body
    )}
  </>
);
```

