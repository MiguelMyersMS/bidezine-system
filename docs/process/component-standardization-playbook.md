# Component Standardization Playbook

> Template for bringing a component from experimental/ad-hoc implementation
> to a fully standardized, documented, and tested design-system component.
> Based on the RailNav standardization process used during v0.1.3–v0.1.4.

## Standardization Checklist

### 1. Anatomy
- [ ] Document the component's structural elements (shell, content areas, slots, regions).
- [ ] Identify which elements are required vs optional.
- [ ] Define the DOM hierarchy and landmark roles (if applicable).

### 2. API Contract
- [ ] Define all public props with types, defaults, and descriptions.
- [ ] Identify required vs optional props.
- [ ] Define callback signatures (`onSelect`, `onClick`, etc.).
- [ ] Document render props or slot patterns (if applicable).
- [ ] Define `children` expectations.

### 3. Token Contract
- [ ] Map every visual property to a design-system token:
  - Colors → `useTokens()` semantic tokens
  - Typography → `TYPE.*` tokens
  - Spacing → `SPACE[n]`
  - Border radius → `RADIUS.*` (three interactive tiers only)
  - Elevation → `elevation()` from status.ts
  - Motion → `MOTION.*` from status.ts
- [ ] Verify no hardcoded colors, font sizes, or spacing values.
- [ ] Document which tokens are consumed and from which module.

### 4. Variant Contract
- [ ] Define all visual variants (size, density, orientation, emphasis).
- [ ] Document which props control variants.
- [ ] Verify each variant uses the correct token set.

### 5. State Contract
- [ ] Define all interaction states:
  - Default / resting
  - Hover
  - Pressed / active
  - Focused (keyboard)
  - Selected / active (for toggles, nav items)
  - Disabled
  - Loading (if applicable)
- [ ] Map each state to token values (background, text, border, icon fill).
- [ ] Verify icon hover pattern: Regular (default) → Filled (hover/pressed).

### 6. Accessibility Contract
- [ ] WCAG 2.2 AA baseline:
  - Text contrast ≥4.5:1 (normal) or ≥3:1 (large text)
  - Non-text contrast ≥3:1 (icons, borders, focus rings)
  - Click/tap targets ≥24×24 CSS px
  - Focus-visible styles on all interactive elements
- [ ] Keyboard navigation:
  - Tab order
  - Arrow key behavior (if applicable)
  - Enter/Space activation
  - Escape behavior (if applicable)
- [ ] ARIA roles and properties:
  - Native HTML preferred before ARIA
  - Role, aria-label, aria-selected, aria-expanded (as applicable)
  - Live regions for dynamic content (if applicable)
- [ ] Screen-reader considerations documented (even if not yet tested).
- [ ] Motion respects `prefers-reduced-motion`.

### 7. Keyboard / Mouse / Touch Behavior
- [ ] Document expected behavior for each input method.
- [ ] Keyboard shortcuts (if any).
- [ ] Touch gesture handling (if applicable).
- [ ] Drag behavior with single-pointer/keyboard alternative (if applicable).

### 8. Storybook Story Matrix
- [ ] Default story (happy path).
- [ ] All variants (one story per variant or controls-driven).
- [ ] All states (hover, pressed, focused, disabled, selected).
- [ ] Edge cases (empty, overflow, long text, many items).
- [ ] Light + dark theme.
- [ ] Responsive breakpoints (if applicable).

### 9. Evidence Gate
- [ ] Capture Figma + Storybook renders into `docs/evidence/<slug>/`.
- [ ] Light + dark theme captured.
- [ ] 3 independent reviews compare the render to Figma; discrepancies adjudicated.
- [ ] Evidence bundle signed.
- [ ] `npm run audit:evidence` — PASS (0 findings).

### 10. Evidence Protocol Checklist
- [ ] Component verified through the Evidence Protocol (`docs/evidence/<slug>/`).
- [ ] Render-vs-Figma comparison completed by the 3 independent reviewers.
- [ ] Discrepancies resolved (`resolved` / `accepted` / `story-setup`) and recorded.
- [ ] Evidence Gate passes (`npm run audit:evidence`).

### 11. Consumer Usage Guidance
- [ ] Import example with correct deep-import path.
- [ ] Props example (minimal and full).
- [ ] Integration pattern (how it fits in a typical layout).
- [ ] Common customization patterns.
- [ ] Anti-patterns to avoid.

### 12. Maturity Status
- [ ] Current status: `experimental` / `beta` / `stable`
- [ ] Promotion blockers documented.
- [ ] Next promotion criteria defined.

### 13. Known Limitations
- [ ] Document known limitations honestly.
- [ ] Workarounds documented (if any).
- [ ] Link to issues or ADRs for planned fixes.

---

## Recommended First Standardization Batch (post-v0.1.4)

| Component | Priority | Rationale |
|-----------|----------|-----------|
| **Button** | P1 | Foundational control, used in every consumer |
| **Badge** | P1 | Simple anatomy, good first standardization exercise |
| **Card** | P1 | Container primitive, establishes token/radius/elevation patterns |

These three components have the highest reuse across consumers and the simplest
anatomy, making them ideal candidates for establishing the standardization workflow
before tackling more complex components like RailNav or DateChip.

---

## Reference: RailNav Standardization History

RailNav was the first component to go through a multi-session standardization process:
- **v0.1.3:** Navigation spec, Storybook stories, visual regression baselines, accessibility audit.
- **v0.1.4:** Consumer validation (Bloodwork), utility-zone guidance, DQA process rules.
- **Status:** Beta. Not yet stable — needs screen-reader testing, additional consumer validation, and stable promotion review.
