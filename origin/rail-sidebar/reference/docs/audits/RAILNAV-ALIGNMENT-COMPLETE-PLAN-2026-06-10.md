# RailNav Alignment Plan — Complete Overview (2026-06-10)

## What the User Asked For

> *"look at the figma and see discrepencies with our documentation so we can then aligne them to avoid diferences and do a proper implementation"*

This document delivers exactly that: discrepancies identified, documentation improvements proposed, and code fixes ready.

---

## The Three Issues (Verified Against Figma)

### Issue #1: Tooltips Invisible — GR3 Violation (BLOCKER)

| Aspect | Figma | Documentation | Code | Status |
|--------|-------|---------------|------|--------|
| **Expected behavior** | Tooltips visible when hovering rail buttons | Golden Rule #3 exists but not enforced | Tooltips use `position: absolute` inside `overflow: clip` container | ❌ BROKEN |
| **Why it breaks** | N/A | Hard Rules don't cite GR3 in tooltip context | Line 452: `overflow: "clip"` clips lines 755, 915, 992 tooltips | Tooltips invisible |
| **Figma source** | Tooltips shown separated from rail in design frames | — | — | — |
| **Documentation gap** | — | No "Tooltips & Overlays" hard rule, no pre-commit checklist | — | — |
| **Fix** | — | Add hard rule + checklist | Convert to portal + fixed, remove overflow: clip | Ready to apply |

### Issue #2: NavRow Active State Background — Visual Differentiation Missing (MEDIUM)

| Aspect | Figma | Documentation | Code | Status |
|--------|-------|---------------|------|--------|
| **State visual contract** | Hover=hoverBg, Active=bgSubtle (different fills) | Doesn't exist; no NavRow states documented | Both use `tokens.hoverBg` | ❌ INDISTINGUISHABLE |
| **Why it breaks** | Figma shows two distinct backgrounds | Code reader can't know what active should look like | Lines 1278: hover and active both → hoverBg | No visual difference |
| **Figma source** | NavRow 207:3406 state variants | — | — | — |
| **Documentation gap** | — | No NavRow States Contract in AGENTS.md | — | — |
| **Font weight** | Active also bumps to 500 | Should be documented | Correctly uses 500 on selected (line 1280) | ✓ Partial correct |
| **Fix** | — | Add NavRow States Contract table | Change line 1278: `selected ? tokens.bgSubtle` | Ready to apply |

### Issue #3: RailNav Outer Gap — 4px Instead of 16px (MEDIUM)

| Aspect | Figma | Documentation | Code | Status |
|--------|-------|---------------|------|--------|
| **Outer gap value** | 16px (SPACE[4]) between LogoSlot/NavColumn/FooterSlot | railnav.spec.md says 16px, but unclear | Line 428: `gap: SPACE[1]` = 4px | ❌ WRONG |
| **Why it breaks** | Main vertical rhythm collapses | Spec is unclear which gap is which (outer vs inner) | Code uses SPACE[1] for outer container | Spacing too tight |
| **Figma source** | RailNav 166:4494 gap: 16px property | — | — | — |
| **Documentation gap** | — | Confusing notation, doesn't clearly map to code | — | — |
| **Inner gaps** | Inner nav=4px ✓, footer=4px ✓ | Documented but unclear which is which | Both correctly use SPACE[1] | ✓ These are right |
| **Fix** | — | Add clear Gap Contract table mapping each gap | Change line 428: `gap: SPACE[4]` | Ready to apply |

---

## Documentation Improvements Prepared

Three documents are ready for your review:

### 1. `docs/audits/figma-alignment-analysis-2026-06-10.md`
**Contains:** The three issues with exact code locations, Figma sources, and specific fixes

### 2. `docs/audits/agents-md-updates-for-approval-2026-06-10.md`
**Contains:** Five proposed updates to AGENTS.md:
- Section 1: Tooltips, Menus & Overlays (hard rule) — GR3 enforcement with code template + checklist
- Section 2: NavRow States Contract (new) — Visual table + implementation pattern
- Section 3: RailNav Gap Contract (update railnav.spec.md) — Clarifies all three gaps
- Section 4: Scroll Regions (update) — Adds caution about overflow clipping with overlays
- Section 5: component-builder skill (update) — Adds overlay safety checklist

---

## Code Fixes Ready to Apply

### Fix #1: Tooltips (3 locations)

**Lines:** 452, 755, 915, 992

**Current problem:** Tooltips use `position: absolute` inside `overflow: "clip"` container

**Fix approach:**
1. Remove `overflow: "clip"` from line 452 (no longer needed once tooltips are portaled)
2. Convert tooltip rendering at lines 755, 915, 992 to use `ReactDOM.createPortal` + `position: fixed`
3. Add GR3 citation comment block

**Code template:**
```typescript
// Instead of:
// {showTooltip && <span style={{ position: "absolute" }}>...</span>}

// Use:
// Tooltip positioned via ReactDOM.createPortal per Golden Rule #3
// Portal + position:fixed escapes overflow: clip/hidden ancestors
const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);
// ... inside render:
{tooltipAnchor && ReactDOM.createPortal(
  <Tooltip anchorRect={tooltipAnchor} ... />,
  document.body
)}
```

### Fix #2: NavRow Active Background (1 location)

**Line:** 1278

**Current:** `background: selected ? tokens.hoverBg : hovered ? tokens.hoverBg : "transparent"`

**Fix:** `background: selected ? tokens.bgSubtle : hovered ? tokens.hoverBg : "transparent"`

**One-line change:** Replace `selected ? tokens.hoverBg` with `selected ? tokens.bgSubtle`

### Fix #3: RailNav Outer Gap (1 location)

**Line:** 428

**Current:** `gap: SPACE[1],  // 4px`

**Fix:** `gap: SPACE[4],  // 16px`

**One-line change:** Replace `SPACE[1]` with `SPACE[4]`

---

## Implementation Order (Recommended)

1. **Approve documentation improvements**
   - Review the AGENTS.md updates in `agents-md-updates-for-approval-2026-06-10.md`
   - Confirm the three gaps are understood (outer=16px, inner nav=4px, footer=4px)
   - Confirm NavRow hover vs active visual contract

2. **Apply code fixes**
   - Fix #3 (gap): 1-line change, lowest risk
   - Fix #2 (NavRow background): 1-line change, low risk
   - Fix #1 (tooltips): Most complex, requires portal refactor + GR3 comments

3. **Update AGENTS.md**
   - Add new hard rules and update sections as proposed
   - This locks in the documentation so future implementations won't have these issues

4. **TypeCheck + Storybook verification**
   - Run `npm run test:typecheck`
   - Visual verification in Storybook to confirm fixes
   - Verify tooltips are now visible (no longer clipped)

5. **Audit check**
   - Run `npm run health` to validate all changes
   - Confirm all audit IDs pass

---

## Why This Prevents Future Issues

### Before (Current State)
- Figma shows the right design
- Documentation is incomplete/unclear
- Code gets it wrong
- Mistakes repeat

### After (With These Changes)
- Figma is the source of truth ✓
- Documentation explicitly cites Figma (node IDs, values, visual contracts) ✓
- Code comments cite the documentation rule ✓
- Pre-commit checklist catches mistakes ✓

**The three-layer approach:**
```
Figma (source of truth)
  ↓ (referenced explicitly)
AGENTS.md (hard rules + specifications)
  ↓ (cited in code comments)
Code (implementation with guards)
  ↓ (validated by)
Audits (component-builder checklist)
```

---

## Files to Review/Approve

| File | Purpose | Action |
|------|---------|--------|
| `docs/audits/figma-alignment-analysis-2026-06-10.md` | Analysis of the three issues + exact code locations | Review for accuracy |
| `docs/audits/agents-md-updates-for-approval-2026-06-10.md` | Proposed AGENTS.md sections to add/update | Review content before merging into AGENTS.md |
| RailNav.tsx (lines 428, 452, 755, 915, 992, 1278) | Code fixes (5 locations total) | Apply after approval |

---

## Next Steps

**User decision required:**

1. Review the two audit documents above
2. Confirm understanding of:
   - Tooltips → portal + fixed (GR3)
   - NavRow hover vs active differentiation (bgSubtle vs hoverBg)
   - RailNav three gaps (outer=16, inner nav=4, footer=4)
3. Approve the AGENTS.md updates
4. Say "ready to fix" and I'll apply all code changes + update docs

**Estimated completion time:** ~15 minutes for code fixes + doc updates

---

## The Core Message to Prevent Recurrence

Every time a component has a tooltip, menu, or popover, ask:
> **"Is this overlay rendered via `ReactDOM.createPortal(..., document.body)` with `position: fixed`?"**

If the answer is not yes, you'll break Golden Rule #3. The AGENTS.md updates make this explicit so it's never a surprise.

