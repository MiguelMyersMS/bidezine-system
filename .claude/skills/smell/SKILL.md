---
name: smell
description: "Git-diff-based pre-PR review using design system catalog IDs. Scans committed and working-tree changes for token, icon, layout, component, and accessibility violations before merge."
argument-hint: "[target-branch]"
allowed-tools: Bash(git:*), Read, Grep, Glob
---

# Smell Skill (Design System Diff Review)

> Adapted from zenvanriel's `/smell` command pattern. Replaces Clean Code / Gang of Four catalogs with design systemâ€“specific catalog IDs.

## When to Use
- Before creating a pull request
- Before merging design system changes
- After a batch of changes to verify compliance
- When reviewing someone else's contribution

Read first: `docs/process/SPEC_KERNEL_COMPACT.md`, `docs/process/TASK_BRIEF_TEMPLATE.md`,
`docs/process/VERIFIER_CHECKLIST.md`, and `AGENTS.md` (repo root).

## Catalog IDs (all design system catalogs apply)

This skill uses the full catalog from all audit skills:

- **Token IDs** (`TK.*`) â€” from token-audit
- **Icon IDs** (`IC.*`) â€” from icon-audit
- **Layout IDs** (`LY.*`) â€” from code-cleanup
- **Component IDs** (`CP.*`) â€” from audit:components / code-cleanup
- **Accessibility IDs** (`A11.*`) â€” from a11y-audit
- **Scroll & Container IDs** (`SC.*`) â€” scroll regions, scrollbar conventions
- **Layout & Overlay IDs** (`LAY.*`) â€” stacking contexts, viewport-aware positioning, overflow measurement

## Finding Schema

```json
{
  "primary_id": "TK.CSS-OPACITY",
  "related_ids": ["A11.LOW-CONTRAST"],
  "severity": "HIGH",
  "file": "src/gallery/Segmented.tsx",
  "line": 42,
  "evidence": "opacity: 0.5 applied to label text",
  "impact": "Text opacity via CSS property breaks theme consistency and may cause contrast failures.",
  "recommended_fix": "Use color alpha: `color: rgba(r,g,b,0.5)` or a semantic token with built-in opacity.",
  "autofixable": true,
  "confidence": "high"
}
```

## Audit Steps

### Step 1 â€” Ingest

Collect the diff. Read it carefully before proceeding.

```bash
BASE="$1"
if [ -z "$BASE" ]; then
  BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/@@')
  [ -z "$BASE" ] && BASE="origin/main"
  git rev-parse "$BASE" >/dev/null 2>&1 || BASE="main"
fi

echo "===== Committed diff (vs $BASE, -U10) ====="
git diff -U10 "$BASE"...HEAD || true

echo "===== Working-tree diff (staged + unstaged, -U10) ====="
git diff -U10 HEAD || true
```

### Step 2 â€” Classify

Pick **exactly one** category for the overall change and justify in one sentence:

- `token` â€” changes to tokens, palette, typography, spacing, or theme
- `icon` â€” new/modified icon components
- `component` â€” gallery component changes
- `layout` â€” spacing, radius, breakpoint changes
- `docs` â€” documentation only
- `config` â€” package.json, tsconfig, CI
- `mixed` â€” multiple categories; name the dominant one

### Step 3 â€” Route

Based on classification, select which catalog lens to emphasize:

| Classification | Primary lens | Secondary lens |
|---|---|---|
| `token` | TK.* | A11.* (contrast) |
| `icon` | IC.* | A11.* (alt text, contrast) |
| `component` | CP.* + A11.* | TK.* + LY.* |
| `layout` | LY.* | TK.* |
| `docs` | CP.MISSING-DOCS | â€” |
| `config` | â€” | â€” |
| `mixed` | All catalogs | â€” |

### Step 4 â€” Analyze

Walk every hunk. For each issue found, cite one primary catalog ID. Quote the smallest possible code excerpt.

Key checks per hunk:
- Direct PALETTE references in non-token files â†’ `TK.PALETTE-DIRECT`
- CSS `opacity` property on text â†’ `TK.CSS-OPACITY`
- Hardcoded colors/fonts/spacing/radius â†’ `TK.HARDCODED-*` / `LY.HARDCODED-*`
- Non-Fluent icons â†’ `IC.NON-FLUENT`
- Missing filled variant on new icon â†’ `IC.MISSING-FILLED`
- Interactive icon call site not wiring `filled` to hover/active state â†’ `IC.FILLED-NOT-WIRED`
- Regular and Filled SVG paths visually identical (truncated path) â†’ `IC.PATH-TRUNCATED`
- Gallery component (`src/gallery/`) changed without a fresh signed Evidence bundle â†’ run `/evidence-pipeline <slug>` (Evidence Gate, `npm run audit:evidence`)
- New interactive element missing keyboard handler â†’ `A11.NO-KEYBOARD`
- New interactive element below 24Ã—24px â†’ `A11.BAD-TARGET-SIZE`
- Component not using useTokens() â†’ `CP.MISSING-TOKENS`
- New radius value not in pill/rounded/soft â†’ `LY.FOURTH-RADIUS`
- Component-specific scrollbar class instead of `SCROLL.className` â†’ `SC.COMPONENT-SPECIFIC-SCROLLBAR`
- Bounded scroll region without outer-shell + inner-scroll pattern â†’ `SC.SCROLL-PATTERN-VIOLATION`
- Unnecessary `position: relative; z-index` trapping overlays â†’ `LAY.STACKING-CONTEXT-TRAP`
- Menu/popover/dropdown without viewport-aware flip/cap â†’ `LAY.VIEWPORT-UNSAFE-OVERLAY`
- Overflow measurement on element with unreliable clientHeight â†’ `LAY.OVERFLOW-MEASUREMENT-FRAGILE`
- Tooltip/menu clipped by parent overflow â†’ `LAY.TOOLTIP-CLIPPED-BY-CONTAINER`

### Step 5 â€” Report

Sort findings by severity (desc), then file path.

```markdown
# Smell Report
**Base:** `{BASE}`
**Classification:** `{category}`
**Primary lens:** `{lens}`

## Summary
- Files changed: N
- Findings: X blocker, Y high, Z medium, W low
- Top risk: <one sentence>

## Findings

### [BLOCKER] `TK.PALETTE-DIRECT` â€” `src/gallery/NewWidget.tsx:42`
**Evidence:** `color: PALETTE.iris9`
**Impact:** Component will not respond to theme changes.
**Fix:** Use `const t = useTokens(); color: t.accent`
**Autofixable:** yes | **Confidence:** high

### [HIGH] `A11.NO-KEYBOARD` â€” `src/gallery/NewWidget.tsx:55-60`
**Evidence:** onClick handler with no onKeyDown equivalent.
**Impact:** Keyboard users cannot activate this control.
**Fix:** Add `onKeyDown` handler for Enter/Space.
**Autofixable:** yes | **Confidence:** high

## Synthesis
<one paragraph: dominant theme of the diff and top 3 actions before merge>
```

If the diff has no findings, emit the same structure with an empty Findings section and "No catalog findings on this diff." plus the Synthesis paragraph.

## Guardrails
- **BLOCKER** findings = recommend blocking the PR
- **HIGH** findings = recommend fixing before merge
- **MEDIUM/LOW** = log and suggest as follow-up
- This skill is read-only â€” it does not auto-fix. It reports only.
- Changes touching â‰¥3 consumers: flag for human review
