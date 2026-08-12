# RailNav Icon Fill Regression Investigation (Governor Review)

Date: 2026-05-26
Scope: Rail primary icon interaction states (hover + pre-select/browsing)
Component: `RailNav`

## Findings (ordered by severity)

### 1) BLOCKER — Contract regression in primary rail icon fill behavior
- What is broken:
  - Primary rail icons no longer switch to filled on hover.
  - Pre-select/browsing rail state (`openPanel === id && activeSection !== id`) also remains regular.
- Current implementation evidence:
  - `src/gallery/RailNav.tsx` line with rail icon wiring:
    - `<Icon size={20} color="currentColor" filled={active || pressed} />`
- Expected by governing icon principle:
  - Interactive icon rule in repo instructions requires Regular -> Filled on hover.
  - This principle is also documented in process checklist as hover/pressed fill behavior.
- Impact:
  - Breaks the DS-wide interactive icon contract.
  - Creates visible inconsistency between RailNav and other interactive icon surfaces.

### 2) HIGH — Conflicting source-of-truth documents caused the regression to be intentionally introduced
- Commit-level evidence:
  - Commit `9cf328b` explicitly changed rail icon fill from:
    - `filled={active || hovered || pressed}`
    - to `filled={active || pressed}`
  - Commit message states: "Keep rail icons regular on hover per documented state model".
- Documentation conflict evidence:
  - `AGENTS.md` icons rule: interactive icons use Regular -> Filled on hover.
  - `docs/process/component-standardization-playbook.md`: verify hover pattern Regular -> Filled (hover/pressed).
  - `docs/patterns/navigation-rail.md` and `docs/interaction-patterns.md` rail table currently say hovered and browsing icons are Regular.
- Impact:
  - Reviewer could approve either direction depending on which doc they read.
  - Governance drift can reintroduce regressions after future visual refactors.

### 3) MEDIUM — No automated guard for call-site hover wiring on `filled`
- Current state:
  - Icon audits verify icon component branching (`filled ? ... : ...`) and catalog usage.
  - There is no CI rule ensuring interactive call sites include hover/preselect states where required.
- Impact:
  - Regressions can pass CI if icons themselves are valid but wiring conditions are narrowed.

## Root Cause

Primary cause:
- A deliberate visual-spec alignment in `9cf328b` updated rail icon behavior to match `navigation-rail.md`, which currently conflicts with higher-level DS icon principles.

Systemic cause:
- Governance hierarchy for interaction-state rules is not encoded or enforced. Rail-specific docs diverged from global icon rules without a blocking check.

## Proposed Remediation Plan

### Phase 1 — Behavior fix in code (narrow, low-risk)
1. Update primary rail icon condition in `src/gallery/RailNav.tsx`:
   - from: `filled={active || pressed}`
   - to: `filled={active || browsing || hovered || pressed}`
2. Validate in Storybook on key stories:
   - `Gallery/RailNav/WithAllIcons`
   - `Gallery/RailNav/OneLevelNesting`
   - `Gallery/RailNav/MaxDepthNesting`
3. Run baseline technical checks:
   - `npm run health:strict`
   - `npm run test:storybook`

### Phase 2 — Spec alignment and governance correction
1. Make one authoritative interaction-state contract for RailNav icons.
2. Update conflicting docs to match the chosen contract:
   - `docs/patterns/navigation-rail.md`
   - `docs/interaction-patterns.md`
   - keep `AGENTS.md` + `docs/process/component-standardization-playbook.md` aligned.
3. Add an ADR note if RailNav intentionally departs from global icon rules (if that decision is kept).

### Phase 3 — Regression prevention guardrail
1. Add a CI audit check in `scripts/audit-components.js` for RailNav call-site wiring:
   - fail when `RailButton` icon does not include hover state in `filled` condition.
2. Add/expand visual test assertion for rail hover and browsing icon fill.
3. Record catalog finding ID for call-site wiring drift (proposed): `IC.CALLSITE-FILLED-WIRING`.

## Verification Checklist for Governor Approval

- [ ] Rail primary icon fills on hover.
- [ ] Rail pre-select/browsing icon fills while border browsing state remains visible.
- [ ] Active and pressed states still fill.
- [ ] Storybook screenshots reviewed before any visual baseline update.
- [ ] Docs no longer conflict on hover/browsing icon fill rule.
- [ ] CI contains at least one call-site guard against this regression class.

## Suggested Next Action

Approve Phase 1 + Phase 2 together in a single PR (small code diff, explicit doc reconciliation), then Phase 3 guardrail in a follow-up PR if timeboxing is needed.

## Copy/Paste Handoff Blocks

### A) User -> Governor (copy/paste)

Use this exact prompt:

```text
Governor review request:

Please review this investigation document and approve/reject the remediation plan:
docs/audits/railnav-icon-fill-investigation-2026-05-26.md

Review requirements:
1) Validate findings severity and root cause.
2) Validate whether Phase 1 code fix is correct and minimal-risk.
3) Confirm Phase 2 doc reconciliation scope is complete.
4) Confirm Phase 3 guardrail is sufficient or propose stronger CI checks.
5) Return a decision: APPROVE / APPROVE WITH CONDITIONS / REJECT.

Required governor output format:
- Decision:
- Why:
- Required changes before implementor starts:
- What governor wrote back into the document:
- Implementor handoff message (copy/paste):
```

### B) Governor -> User and Document (required output)

Governor should return and also append this section in this same file:

```text
## Governor Review (YYYY-MM-DD)

Decision: APPROVE | APPROVE WITH CONDITIONS | REJECT

Why:
- ...

Required changes before implementation:
1. ...
2. ...

Plan status by phase:
- Phase 1: approved / changes required
- Phase 2: approved / changes required
- Phase 3: approved / changes required

Risk notes:
- ...

Governor sign-off:
- Reviewer:
- Date:
```

### C) User -> Implementor (copy/paste after governor review)

Use this exact prompt after governor review is complete:

```text
Implementor execution request:

Governor has completed review in:
docs/audits/railnav-icon-fill-investigation-2026-05-26.md

Please execute only what governor approved, including all required conditions.

Execution requirements:
1) Implement Phase 1 code changes first (or the governor-adjusted equivalent).
2) Apply Phase 2 doc reconciliation updates required by governor.
3) Run required validation commands and report results.
4) Do not perform any unapproved scope expansion.
5) Post an implementation summary with changed files and any residual risks.
```

## Governor Review (2026-05-26)

Decision: APPROVE WITH CONDITIONS

Why:
- The BLOCKER finding is valid. `src/gallery/RailNav.tsx` currently wires the primary rail icon as `filled={active || pressed}`, which omits both hover and browsing/pre-select states.
- The HIGH documentation-conflict finding is valid. `AGENTS.md` and `docs/process/component-standardization-playbook.md` require the interactive icon pattern Regular -> Filled on hover, while `docs/patterns/navigation-rail.md` and `docs/interaction-patterns.md` currently describe rail hover/browsing icons as Regular.
- The MEDIUM guardrail finding is valid. Existing icon audits can verify icon components branch on `filled`, but they do not protect this RailNav call-site condition.
- The proposed Phase 1 behavior fix is the correct direction because RailNav should align with the global interactive icon contract instead of creating a rail-specific exception.

Required conditions for implementor:
1. Implement Phase 1 and Phase 2 together in the same pass. Do not change code without also reconciling the conflicting RailNav docs.
2. Update the primary rail icon call site to include every relevant state:
   `filled={active || browsing || hovered || pressed}`.
3. Preserve the browsing visual distinction: browsing must keep the outlined border treatment while also using the filled icon.
4. Update `docs/patterns/navigation-rail.md` and `docs/interaction-patterns.md` so rail Active, Browsing, Hovered, and Pressed icon-fill states no longer conflict with the global icon rule.
5. Do not add an ADR for a rail exception, because this decision rejects the exception and reaffirms the global interactive icon rule.
6. Provide Storybook visual evidence for the affected RailNav stories before any visual baseline update. Do not update visual baselines unless the user explicitly approves after screenshot review.
7. Phase 3 guardrail work is approved only if kept narrow. A targeted audit check for the RailNav primary icon `filled` condition is acceptable; broad audit-framework refactors are not approved in this pass.

Implementation instructions:
1. First change `src/gallery/RailNav.tsx` primary rail icon fill wiring from `active || pressed` to `active || browsing || hovered || pressed`.
2. Then update the two conflicting docs:
   - `docs/patterns/navigation-rail.md`
   - `docs/interaction-patterns.md`
3. If implementing the Phase 3 guardrail now, add the smallest practical check in the existing component audit path and document the catalog ID `IC.CALLSITE-FILLED-WIRING`.
4. Run required validation:
   - `npm run health:strict`
   - `npm run test:storybook`
5. Capture or provide Storybook review evidence for:
   - `Gallery/RailNav/WithAllIcons`
   - `Gallery/RailNav/OneLevelNesting`
   - `Gallery/RailNav/MaxDepthNesting`
6. Report changed files, validation results, visual evidence status, and residual risks.

Plan status by phase:
- Phase 1: approved with required Storybook visual evidence.
- Phase 2: approved and required in the same implementation pass as Phase 1.
- Phase 3: approved with scope limit; may be same pass if small, otherwise defer to follow-up without blocking Phase 1/2.

Risk notes:
- This is a visual interaction-state change, so TypeScript and audit success alone are not acceptance evidence.
- The highest regression risk is preserving the visual difference between active and browsing states once browsing also uses a filled icon.
- Existing unrelated working-tree changes are present; implementor must avoid expanding scope or reverting unrelated files.

Evidence required after implementation:
1. Changed files list.
2. Validation command results for `npm run health:strict` and `npm run test:storybook`.
3. Storybook visual evidence status for the three named RailNav stories.
4. Confirmation that no visual baselines were updated without explicit approval.
5. Residual risks or deferred Phase 3 work, if any.

Governor sign-off:
- Reviewer: Codex acting as Design System Governor
- Date: 2026-05-26
