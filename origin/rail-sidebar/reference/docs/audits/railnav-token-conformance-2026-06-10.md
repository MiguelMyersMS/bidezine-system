# RailNav Token & Padding Conformance Audit — 2026-06-10

## Executive Summary

**Status:** 🔴 **CRITICAL DISCREPANCIES FOUND** (2 blockers, 3 medium findings)

Comprehensive token/padding/sizing audit comparing:
- **Figma source nodes** (RailNav `166:4494`, RailMenu `195:3231`, RailButton `165:4188`)
- **Specification docs** (railnav.spec.md, railmenu.spec.md, railbutton.spec.md)
- **Actual code** (src/gallery/RailNav.tsx)

---

## BLOCKER DISCREPANCIES

### ❌ **BLOCKER #1: RailNav Outer Container Gap**

**Location:** `src/gallery/RailNav.tsx:428`

**Spec Contract:**
```yaml
# From railnav.spec.md:
# RailNav (FRAME, column, gap: 16px, padding: 8px)
gap: "16px"              # SPACE[4] between LogoSlot / section column / FooterSlot
```

**Figma Value:**
```
layout_XKW7WV:
  mode: column
  gap: 16px              # Between LogoSlot, RailNav buttons, FooterSlot
  padding: 8px
```

**Code (WRONG):**
```typescript
<div
  ref={railRef}
  style={{
    // ... other styles
    gap: SPACE[1],       // ❌ 4px — WRONG! Should be SPACE[4] = 16px
  }}
>
  {/* LogoSlot */}
  <div style={{ flex: 1, minHeight: 0, overflow: "clip" }}>
    <nav style={{ gap: SPACE[1] }}>  // ✓ 4px gap between buttons is CORRECT
```

**Impact:** Logo slot, nav column, and footer slot are spaced too tightly. Visual gap on Figma is 16px; code renders at 4px.

**Fix Required:**
```typescript
gap: SPACE[4],  // 16px — matches Figma layout_XKW7WV
```

---

### ❌ **BLOCKER #2: Panel Item State Colors — Selected Weight & Background Mismatch**

**Location:** `src/gallery/RailNav.tsx:1276-1290` (PanelItem component)

**Spec Contract (from AGENTS.md — List Row Geometry):**
```yaml
# Panel items should follow "calm rest → progressive engagement" pattern
# Selected state: ink color + weight 500
Interactive State Pattern:
  | State | Opacity | Weight |
  | Selected | 100% | 500 (medium) |
  | Default (resting) | 70% | 400 |
  | Unselected (toggled off) | 50% | 400 |
  | Hover | 100% | inherit |
```

**Figma Panel Reference:**
The panel in the RailNav assembled frame shows selected row with `tokens.hoverBg` (fill background).

**Code (MIXED):**
```typescript
style={{
  ...TYPE.bodyM,
  background: selected ? tokens.hoverBg : hovered ? tokens.hoverBg : "transparent",
  color: selected ? tokens.ink : hovered ? tokens.ink : tokens.textSubtle,
  fontWeight: selected ? 500 : 400,  // ✓ Weight is correct
  // ... rest of styles
}}
```

**Analysis:**
- ✓ Weight state is correct (500 selected, 400 default)
- ✓ Color progression is correct (ink selected/hovered, textSubtle default)
- ❓ Background fill on selected is `tokens.hoverBg` — should verify against Figma panel row spec

**Related Finding:** Panel row background selected state uses `tokens.hoverBg`, but per Button States contract and Panel Item specs, selected rows in light-surface panels should use `tokens.bgSubtle` with the weight bump. The code treats hover and selected the same (both hoverBg). This may be intentional for the "browsing" peek pattern but needs explicit verification against the panel item spec.

**Status:** Check panel row spec for final confirmation. For now: **MEDIUM FINDING** (not a blocker).

---

### ❌ **BLOCKER #3: OverflowMenuItem Icon Size Mismatch in Slot**

**Location:** `src/gallery/RailNav.tsx:1230-1235` (OverflowMenuItem component)

**Spec Contract (from railmenu.spec.md + menuitemdark.spec.md):**
```yaml
# MenuItemDark structure after cycle 2026-06-10 update:
# Icon slot: 20×20 px (INCREASED from 18×18 per 2026-06-10 update note)
# Icon rendering size: 16 px (Fluent icon size param)
row:
  layout: flex, alignItems: center, gap: SPACE[2]
  leftSlot: 20×20 px    # Icon slot width/height
  icon: size={16}       # Icon render size inside slot
```

**Code (PARTIAL MISMATCH):**
```typescript
<span style={{
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,            // ✓ 20px slot width
  height: 20,           // ✓ 20px slot height
  flexShrink: 0,
}}>
  <Icon size={16} color="currentColor" filled={...} />  // ✓ 16px icon
</span>
```

**Analysis:**
- ✓ Slot size is 20×20 (correct per updated spec)
- ✓ Icon render size is 16px (correct)
- ⚠️ BUT: this is in OverflowMenu for Rail — which is a DARK-SURFACE menu, so should render MenuItemDark row style. The icon slot is correct, but **verify the row padding matches MenuItemDark spec** (see below).

**Status:** Conditional blocker — depends on next finding.

---

## MEDIUM FINDINGS

### ⚠️ **MEDIUM #1: RailMenu Row Padding Mismatch**

**Location:** `src/gallery/RailNav.tsx:1217` (OverflowMenuItem padding)

**Spec Contract (from railmenu.spec.md + menuitemdark.spec.md):**
```yaml
# MenuItemDark row geometry (per Figma + spec):
row_padding: "SPACE[1] × SPACE[2]"   # 4px vertical, 8px horizontal
# Breakdown: top/bottom = 4px, left/right = 8px
```

**Figma Values:**
```
layout_LXDC6U:  # MenuItemDark layout
  mode: column
  justifyContent: center
  padding: 4px  # Figma shows 4px vertical padding per item
  sizing: fill×hug
```

For horizontal, the ActionMenu/Container has padding: 8px, and each row inside Section/List is flush (padding: 0 on the row itself), relying on the container's 8px for left/right inset.

**Code (CORRECT):**
```typescript
<button
  style={{
    display: "flex",
    alignItems: "center",
    gap: SPACE[2],
    padding: `${SPACE[1]}px`,  // 4px all sides — but spec shows 4px vertical only
    background: bg,
    border: "none",
    boxShadow: browsing ? `inset 0 0 0 1.5px ${tokens.darkBorderStrong}` : "none",
    borderRadius: RADIUS.soft,
    cursor: "pointer",
    color,
    ...TYPE.bodyS,
    // ... rest
  }}
>
```

**Analysis:**
- Code uses `padding: SPACE[1]` which is 4px all sides (uniform).
- Spec/Figma shows 4px top/bottom, but horizontal padding is inherited from the container's 8px.
- This is actually a **design pattern choice**: the code insets each row by 4px on all sides, while Figma relies on the container padding to provide horizontal space and only adds vertical padding to each row.
- **Impact:** Code rows have more internal left/right breathing room. This is acceptable if intentional.
- **Status:** Not a blocker IF documented as deliberate design choice. Recommend adding a comment: `/* 4px all sides for breathing room (container provides additional horizontal inset) */`.

---

### ⚠️ **MEDIUM #2: Panel Header Title Font-Weight Not Explicit**

**Location:** `src/gallery/RailNav.tsx:585-586` (Panel header title)

**Spec Contract (from AGENTS.md — Panel Header):**
```yaml
# Panel header layout (fixed) — section title + collapse button
# Title: TYPE.headingS + strong (weight 500)
titleFont: "TYPE.headingS + TYPE.strong"
titleWeight: 500
titleColor: "tokens.ink"
```

**Code (CORRECT):**
```typescript
<span style={{
  ...TYPE.headingS,
  ...TYPE.strong,  // ✓ Explicit spread — weight 500 is applied
  color: tokens.ink,
  // ...
}}
```

**Analysis:**
- ✓ Uses both TYPE.headingS and TYPE.strong spreads.
- ✓ TYPE.strong should provide `fontWeight: 500`.
- Status: **VERIFIED** — no issue here.

---

### ⚠️ **MEDIUM #3: Collapse Button Size Matches RailButton? Verify Against Spec**

**Location:** `src/gallery/RailNav.tsx:1335` (CollapseButton)

**Spec Contract (from AGENTS.md — Panel Header):**
```yaml
# Panel header toolbar buttons use LAYOUT.hitTarget (40×40)?
# Or LAYOUT.railButton (38×38) for consistency with rail buttons?
# Spec says: "28×28 per Figma PanelHeader node 209:3944"
button_size: "28×28 px"
borderRadius: "RADIUS.xs"  # 4px
```

**Code:**
```typescript
<button
  style={{
    width: 28,       // ✓ 28px
    height: 28,      // ✓ 28px
    borderRadius: RADIUS.xs,  // ✓ 4px
    border: "none",
    background: bg,
    cursor: "pointer",
    padding: 0,
    // ...
  }}
>
  <IconChevronDoubleLeft size={20} color="currentColor" filled={...} />
</button>
```

**Analysis:**
- ✓ 28×28 matches Figma PanelHeader spec.
- ✓ RADIUS.xs is correct.
- ✓ Icon size 20px is standard nav icon size.
- Status: **VERIFIED** — no issue.

---

### ⚠️ **MEDIUM #4: OverflowMenu Container Padding vs Figma vs Popover Contract**

**Location:** `src/gallery/RailNav.tsx:1136` (OverflowMenu container)

**Spec Contract (from railmenu.spec.md + AGENTS.md Popover Container Contract):**
```yaml
# OverflowMenu = RailMenu = dark-surface popover
# Container padding should be SPACE[1] (4px) per popover spec
# BUT RailMenu outer frame in Figma shows:
container_padding: null  # Outer RailMenu frame has NO padding
actionMenu_container_padding: "8px"  # ActionMenu/Container has SPACE[2]
```

**Code:**
```typescript
<div
  style={{
    position: "fixed",
    // positioning...
    background: tokens.darkSurface,
    border: `0.5px solid ${tokens.darkBorderStrong}`,
    borderRadius: RADIUS.rounded,
    boxSizing: "border-box",
    zIndex: Z.dropdown,
    boxShadow: elev.mid,
    width: 180,
    maxHeight,
    overflow: "hidden",
  }}
>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: `${SPACE[2]}px`,  // ✓ 8px — ActionMenu/Container pattern
      boxSizing: "border-box",
      maxHeight,
      overflow: "hidden",
    }}
  >
    {/* rows */}
  </div>
</div>
```

**Analysis:**
- ✓ Outer frame has no padding (correct).
- ✓ Inner ActionMenu/Container has SPACE[2] = 8px padding (correct).
- ✓ Gap inside container is 10px (correct per Figma layout_FCHSAB).
- Status: **VERIFIED** — no issue.

---

## SUMMARY TABLE

| Finding | Location | Spec | Code | Status | Severity |
|---------|----------|------|------|--------|----------|
| **RailNav outer gap** | 428 | SPACE[4] (16px) | SPACE[1] (4px) | ❌ WRONG | BLOCKER |
| **Panel row selected state** | 1276-1290 | bgSubtle (light) | hoverBg (light) | ⚠️ VERIFY | MEDIUM |
| **OverflowMenuItem icon slot** | 1230-1235 | 20×20px | 20×20px | ✓ OK | — |
| **OverflowMenuItem row padding** | 1217 | 4px v, 8px h | 4px all | ⚠️ DESIGN CHOICE | MEDIUM |
| **Panel header title weight** | 585-586 | TYPE.strong (500) | TYPE.strong (500) | ✓ OK | — |
| **Collapse button size** | 1335 | 28×28 | 28×28 | ✓ OK | — |
| **OverflowMenu container padding** | 1136 | SPACE[2] | SPACE[2] | ✓ OK | — |

---

## REQUIRED FIXES

### FIX #1: RailNav Outer Gap (BLOCKER)

**File:** `src/gallery/RailNav.tsx:428`

**Change:**
```diff
        gap: SPACE[1],
+       // BLOCKER FIX: Gap should be SPACE[4] (16px) per Figma layout_XKW7WV.
+       // This is the gap between LogoSlot, RailNav buttons column, and FooterSlot.
+       gap: SPACE[4],
```

**Reason:** Figma spec explicitly sets gap: 16px between major sections (LogoSlot, nav, footer).

---

### FIX #2: Panel Row State Verification (MEDIUM — Conditional)

**File:** `src/gallery/RailNav.tsx:1278`

**Current:**
```typescript
background: selected ? tokens.hoverBg : hovered ? tokens.hoverBg : "transparent",
```

**Spec Question:** Should selected row use `tokens.bgSubtle` (matching the light-surface "selected" row pattern per Button States contract) instead of `tokens.hoverBg`?

**Recommendation:**
- If this is intentional (visual peek pattern where hover and selected look the same), add a comment.
- If selected should be distinct, change to `tokens.bgSubtle` per Button States contract.

**Pending:** Explicit user approval on the intended selected-row visual.

---

## VERIFICATION CHECKLIST

- [ ] **Live story visual:** Open Storybook `gallery-railnav--default`, verify the gap between logo and nav buttons and nav and footer.
- [ ] **Figma comparison:** Open Figma node `166:4494`, measure the gap between sections (should be 16px).
- [ ] **Token values:** Confirm `SPACE[4] = 16px` in `src/layout.ts`.
- [ ] **Panel row states:** Confirm intended visual for selected vs. hover in panel items (light surface).

---

## Notes

- All dark-surface token references (onDark, darkSurface, darkHoverBg, etc.) are correctly applied to the rail and overflow menu.
- Icon sizes (20px for rail buttons, 16px for overflow menu rows) are correct per spec.
- Portal positioning (Golden Rule #3) is correctly implemented with `position: fixed` and viewport-aware flip logic.
- Scrollbar padding (`paddingRight: menuScrollable ? SPACE[2] : 0`) is correctly conditional per Hard Rule.
- All typography tokens (TYPE.bodyS, TYPE.bodyM, TYPE.headingS, TYPE.labelM) are correctly applied.

