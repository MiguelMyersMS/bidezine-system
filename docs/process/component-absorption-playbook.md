# Component Absorption Playbook

## Purpose
Define a safe, repeatable process for absorbing external component patterns into this design system, then refining them to match tokens, accessibility, and governance rules.

## Non-Negotiable Intake Rules

1. License must be permissive and compatible with project usage.
2. Source must be attributable and documented in intake notes.
3. Do not copy proprietary branding, assets, or protected design language.
4. Import behavior/anatomy patterns, then re-tokenize and re-style for this system.
5. Promotion never bypasses governor review.

## Intake Pipeline

### Phase 0: Candidate Triage
1. Identify component gap and target maturity.
2. Collect 1-3 candidate sources.
3. Record source links, license, and rationale.

### Phase 1: License and Risk Check
1. Verify license text and attribution requirements.
2. Flag blocked sources (unknown, restrictive, or incompatible license).
3. Keep only compliant candidates.

### Phase 2: Technical Intake
1. Extract component anatomy and interaction model.
2. Evaluate state completeness: resting, hover, pressed, focused, disabled, selected, loading.
3. Evaluate keyboard and ARIA quality.
4. Define API adaptation into design-system conventions.

### Phase 3: Tokenization and Styling Rewrite
1. Replace foreign styles with design-system tokens.
2. Enforce typography via TYPE tokens.
3. Enforce spacing/radius/motion/status tokens.
4. Enforce icon rules (Fluent, filled wiring, size tiers).

### Phase 4: Storybook and Evidence
1. Add full Storybook matrix (variants, states, edge cases).
2. Capture visual evidence in light/dark and responsive breakpoints if relevant.
3. Run required checks (`health:strict`, `test:storybook`).

### Phase 5: Governor Gate
1. Governor validates intake quality and legal hygiene.
2. Governor validates token/a11y/state contracts.
3. Governor decides: APPROVE, APPROVE WITH CONDITIONS, or REJECT.

## Required Intake Record (per component)

1. Component name and priority.
2. Source candidate(s) and license.
3. Intake risks and mitigations.
4. API mapping plan.
5. Token mapping plan.
6. Accessibility notes.
7. Storybook evidence checklist.
8. Proposed maturity status after first pass.

## Approved Behavioral Sources

For components requiring headless behavior + accessibility foundations, use these sources.
All are MIT-licensed and have zero style coupling — DS tokens own 100% of the visual layer.
These are default sources for new primitives; specific components may still use native HTML when a headless package adds no meaningful value, and that decision must be documented in intake.

| Package | Use for | Why chosen over alternatives |
|---------|---------|-----------------------------|
| `@radix-ui/react-slot` | Button (asChild) | Radix per-component granularity; MIT; no style coupling |
| `@radix-ui/react-label` | Input label association | Same; WAI-ARIA label contract built in |
| `@radix-ui/react-select` | Select / Menu trigger | Same; focus/keyboard/ARIA fully handled |
| `@radix-ui/react-dialog` | Dialog / Modal shell | Same; focus-trap, escape, portal handled |

Radix Primitives was chosen over React Aria (Apache-2.0, monorepo coupling) and MUI Base (heavier abstraction)
as the standard behavioral source for Batch 1. All future primitive components should default here unless
there is a specific capability gap, which must be documented in the intake.

## Pattern Inspiration Sources

These are **reference-only** catalogs — used for layout ideas, state coverage, and interaction patterns.
They are NOT code dependencies and must NOT be installed as packages.

| Source | What it offers | Scope |
|--------|---------------|-------|
| **ui.mantine.dev** | 123 styled layout patterns (navbars, stat cards, tables, auth forms) — MIT, community-driven | Composite patterns only (Batch 2+). Not applicable to primitive components. |
| **radix-ui.com/themes** | Styled Radix Themes gallery | Visual reference only; use Radix Primitives (unstyled) as code source |

### Rule
If a pattern is inspired by one of these sources, record the source URL in the intake § 2 under
"Pattern reference" — not as a license candidate. No code, token names, or prop names may be
copied verbatim without a proper license intake entry.

## Rejection Criteria

1. License cannot be verified.
2. Keyboard or ARIA behavior is fundamentally broken and cannot be corrected within scope.
3. Component cannot be tokenized without large architectural rewrite.
4. Candidate introduces visual/system drift from DS principles.

## Governor Handoff Trigger

Copy/paste:

```text
Act as a Governor. Please review and decide on [audit-file]. Evaluate intake quality, license/risk checks, tokenization completeness, and promotion readiness. Append your decision and required implementation conditions in that file.
```
