---
name: a11y-audit
description: "Audit all design system components for WCAG 2.2 AA accessibility compliance â€” contrast, keyboard, focus, target size, ARIA, motion, and forced-colors. Run after adding or modifying components."
allowed-tools: Read, Grep, Glob
---

# Accessibility Audit Skill

## When to Use
- After adding or modifying gallery components
- After changing tokens that affect contrast (ink, bg, accent, status colors)
- Periodic compliance check
- Before promoting a component from beta â†’ stable
- When a consumer reports accessibility issues

## Baseline Standard
**WCAG 2.2 AA.** Use native HTML elements before ARIA. Reference WAI-ARIA Authoring Practices Guide (APG) only when native HTML is insufficient for the interaction pattern.

## Catalog IDs

| ID | Rule | Default Severity |
|---|---|---|
| `A11.LOW-CONTRAST` | Text contrast below 4.5:1 (normal) or 3:1 (large text, â‰¥18pt/14pt bold) | BLOCKER |
| `A11.NO-KEYBOARD` | Interactive component cannot be fully used by keyboard alone | BLOCKER |
| `A11.BAD-DIALOG-FOCUS` | Dialog/modal fails: initial focus inside, Tab/Shift+Tab trapped inside, Escape closes, focus returns to trigger, dialog is labelled | BLOCKER |
| `A11.BAD-TARGET-SIZE` | Click/tap target below 24Ã—24 CSS px (AA minimum) | HIGH |
| `A11.NON-TEXT-CONTRAST` | Icon, border, focus ring, or control state below 3:1 against adjacent colors | HIGH |
| `A11.BAD-FORM-LABEL` | Input lacks accessible label, help text, or error relationship | HIGH |
| `A11.BAD-NAME-ROLE-VALUE` | Custom interactive component lacks correct accessible name, role, state, or value. Native HTML should be preferred before adding ARIA attributes. | HIGH |
| `A11.DRAG-ONLY` | Drag interaction has no single-pointer or keyboard alternative | HIGH |
| `A11.FOCUS-OBSCURED` | Focused element can be hidden behind sticky/floating UI | HIGH |
| `A11.BAD-LABEL-IN-NAME` | Visible label text does not match the accessible name | HIGH |
| `A11.NO-FOCUS` | Interactive component missing focus-visible styles | HIGH |
| `A11.ICON-NO-ALT` | Standalone meaningful icon missing aria-hidden or accessible name | MEDIUM |
| `A11.MOTION-NO-REDUCE` | Animation/transition has no `prefers-reduced-motion` alternative | MEDIUM |
| `A11.FORCED-COLORS` | Component breaks in Windows High Contrast / forced-colors mode | MEDIUM (HIGH for stable core controls) |

## Finding Schema

```json
{
  "primary_id": "A11.BAD-DIALOG-FOCUS",
  "related_ids": ["CP.MISSING-DOCS", "TK.MISSING-STATE"],
  "severity": "BLOCKER",
  "file": "src/gallery/DateChip.tsx",
  "line": 85,
  "evidence": "Focus does not return to trigger element after menu close.",
  "impact": "Keyboard and screen-reader users lose context after closing the date picker.",
  "recommended_fix": "Store trigger ref before open. On close, call triggerRef.current?.focus().",
  "autofixable": false,
  "confidence": "high"
}
```

## Audit Steps

### Step 1 â€” Ingest
- Read all `src/gallery/*.tsx` component files
- Read `src/status.ts` for FOCUS, MOTION, DISABLED definitions
- Read `src/tokens.ts` for color values (contrast checking)
- Read `docs/registry/components.json` for component metadata

### Step 2 â€” Scope
- **Full audit:** All components
- **Diff audit:** Only components changed in the diff
- **Promotion audit:** Specific component being promoted to stable

### Step 3 â€” Analyze
Walk every component. For each issue, cite one primary catalog ID.

**Check sequence:**

1. **Contrast â€” Text** (`A11.LOW-CONTRAST`)
   - Check foreground/background color pairs used in components
   - Normal text: â‰¥4.5:1 ratio
   - Large text (â‰¥18pt or â‰¥14pt bold): â‰¥3:1 ratio
   - Check both light and dark themes

2. **Contrast â€” Non-Text** (`A11.NON-TEXT-CONTRAST`)
   - Icons, borders, focus rings, control states: â‰¥3:1 against adjacent colors
   - Check active/inactive/disabled visual states

3. **Keyboard** (`A11.NO-KEYBOARD`)
   - All interactive elements reachable via Tab
   - All actions triggerable via Enter/Space (buttons) or Arrow keys (menus, tabs)
   - No mouse-only interactions (hover-only tooltips, drag-only reorder)

4. **Target Size** (`A11.BAD-TARGET-SIZE`)
   - All click/tap targets â‰¥24Ã—24 CSS px
   - Check padding contributes to hit area, not just visual size

5. **Focus Management** (`A11.NO-FOCUS`, `A11.FOCUS-OBSCURED`)
   - Focus-visible styles present on all interactive elements
   - Focused elements not hidden behind sticky headers/floating UI
   - Focus indicator meets 3:1 contrast

6. **Dialog/Modal** (`A11.BAD-DIALOG-FOCUS`)
   - Initial focus moves inside dialog on open
   - Tab/Shift+Tab cycle stays within dialog
   - Escape closes the dialog (when appropriate)
   - Focus returns to trigger element on close
   - Dialog has accessible label (aria-labelledby or aria-label)

7. **Name/Role/Value** (`A11.BAD-NAME-ROLE-VALUE`)
   - Custom interactive components have correct accessible name
   - Role matches behavior (button, menu, dialog, tab, etc.)
   - State conveyed (aria-expanded, aria-selected, aria-checked, etc.)
   - Prefer native HTML elements before ARIA

8. **Labels** (`A11.BAD-FORM-LABEL`, `A11.BAD-LABEL-IN-NAME`)
   - Inputs have associated labels (htmlFor or aria-labelledby)
   - Visible label text matches accessible name
   - Help text and error messages linked via aria-describedby

9. **Dragging** (`A11.DRAG-ONLY`)
   - Any drag interaction has a single-pointer or keyboard alternative

10. **Motion** (`A11.MOTION-NO-REDUCE`)
    - All CSS animations/transitions check `prefers-reduced-motion`
    - MOTION tokens from status.ts are used (they include reduced-motion support)

11. **Forced Colors** (`A11.FORCED-COLORS`)
    - Components don't rely solely on color to convey meaning
    - Borders/outlines visible in Windows High Contrast mode
    - Use `forced-colors: active` media query where needed

### Step 4 â€” Report
Output to `docs/audits/a11y-audit-{YYYY-MM-DD}.md`:

```markdown
# Accessibility Audit Report
**Baseline:** WCAG 2.2 AA
**Scope:** [full | diff | promotion:{ComponentName}]
**Timestamp:** YYYY-MM-DD HH:MM

## Summary
- Components scanned: N
- Findings: X blocker, Y high, Z medium
- Health score: NN/100

## Findings
### [BLOCKER] `A11.LOW-CONTRAST` â€” `src/gallery/Segmented.tsx:65`
**Evidence:** Inactive segment text `rgba(0,0,0,0.4)` on `#F5F5F5` bg = 2.1:1 ratio
**Impact:** Users with low vision cannot read inactive options.
**Fix:** Increase to at least `rgba(0,0,0,0.55)` for 4.5:1 ratio.
**Autofixable:** no | **Confidence:** high

## Component Status
| Component | a11y Status | Findings |
|---|---|---|
| DateChip | âš ï¸ 1 high | A11.BAD-DIALOG-FOCUS |
| Segmented | âŒ 1 blocker | A11.LOW-CONTRAST |
| DarkPillButton | âœ… pass | â€” |
| Dots | âœ… pass | â€” |
| Placeholder | âœ… pass (non-interactive) | â€” |

## Synthesis
<one paragraph: overall a11y health + top 3 actions>
```

### Step 5 â€” Reflect
If BLOCKER findings exist:
1. For contrast issues: calculate the minimum color value needed and suggest
2. For keyboard issues: identify the missing handler pattern
3. Maximum 3 retry cycles for auto-fixable items
4. Non-auto-fixable BLOCKERs block component promotion to stable

## Guardrails
- **BLOCKER** findings in stable components = immediate action required
- **BLOCKER** findings block beta â†’ stable promotion
- `A11.FORCED-COLORS` severity upgrades to HIGH for stable core controls
- All a11y fixes must be verified by re-running the affected checks
- Native HTML is always preferred over ARIA â€” do not add ARIA to elements that already have native semantics
