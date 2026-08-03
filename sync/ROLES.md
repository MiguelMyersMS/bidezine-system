# Sync Roles — Implementor and Governor Playbooks

This file documents the two roles in the sync protocol for `@miguel/design-system`. In orchestrated mode, the `/sync-step` skill executes one role per invocation per the decision tree in `sync/PROTOCOL.md`. In manual mode, the user pastes the switch prompts to indicate which role is active.

Under `/loop /sync-step`, orchestrated mode is authoritative: the agent automatically alternates roles based on `HANDOFF.md`/`REVIEW.md` state and does not ask the user to manually switch sessions between steps.

Both roles share these invariants:

- Cycle number increments every Implementor cycle (PROTOCOL rule 1).
- Never overwrite the other role's file (PROTOCOL rule 2).
- Read the other role's file before writing your own (PROTOCOL rule 3).
- Canonical rule source is `AGENTS.md` at the repo root. ROLES.md does NOT duplicate it — read AGENTS.md fresh each cycle.
- Cadence directive (captured Cycle 51): prioritize blocker / high risk (behavioral regressions, API contract breaks, a11y failures, dependency/security concerns). Batch low-risk refinements into fewer cycles rather than micro-governing each step.

## Implementor Playbook

The Implementor takes a fresh cycle when the prior Governor review is `APPROVED`.

### Inputs

- `sync/REVIEW.md` — last Governor review (must be `APPROVED` to proceed).
- `sync/HANDOFF.md` — previous cycle's handoff (read for state continuity).
- `AGENTS.md` (repo root) — canonical rule source; re-read each cycle.
- Any project files referenced by Next Steps in the latest REVIEW.

### Steps

1. Read the latest `sync/REVIEW.md`. Confirm status is `APPROVED`.
2. For each item in the REVIEW's `Next Steps`, perform the action. **STOP** for any file edit covered by `STOP_CONDITIONS.md` (especially: package.json/lockfile, AGENTS.md, sync/PROTOCOL.md, sync/ROLES.md). Surface the file-edit intent to the user and wait for authorization.
3. Validate implementation against `AGENTS.md`:
   - Tokens: no direct PALETTE refs in components; opacity via color alpha; approved fonts only; TYPE tokens, no hardcoded font-family/font-size
   - Icons: Fluent UI System Icons only; fill-based inline SVGs; viewBox `0 0 20 20`; `filled` prop on interactive icons
   - Components: gallery = reusable only; scroll regions use `SCROLL` convention; 3-tier border radius (99/12/8)
   - Accessibility: text contrast ≥4.5:1, non-text ≥3:1; keyboard accessible; click targets ≥24×24 CSS px; focus-visible
4. Advance the cycle counter (next cycle = current + 1).
5. Write a new `sync/HANDOFF.md` using the Handoff Format in `PROTOCOL.md`. Required sections: `What Changed`, `Files Touched`, `What to Review`, `Status`. Recommended: `Out-of-Scope Dirty Tree`, `Validation`, `Open Questions`.
6. Be specific in `Files Touched`: every modified file listed with one-line description.
7. If a Bucket / Phase scope was approved, include explicit scope-boundary notes (e.g., "no source changes, deps-only").
8. Set status to `READY_FOR_REVIEW`.

### Batching (low-risk only)

Per the cadence directive, batch low-risk refinements (typos, comment updates, minor token tweaks within an approved scope) into a single HANDOFF rather than firing per-edit cycles. High-risk work (new components, API changes, dependency adds, accessibility-impacting changes) gets its own HANDOFF per the protocol.

## Governor Playbook

The Governor takes a turn when `sync/HANDOFF.md` is at a cycle newer than `sync/REVIEW.md` (or REVIEW does not exist yet at that cycle).

### Inputs

- `sync/HANDOFF.md` — current Implementor handoff awaiting review.
- `sync/REVIEW.md` — previous review (if any; for continuity).
- `AGENTS.md` — canonical rule source.
- `.github/prompts/governor.prompt.md` — the original Governor checklist; included here, but read fresh as it may have evolved.
- Files listed in the HANDOFF's `Files Touched` — read each one and verify the change is real and compliant.

### Steps

1. Read the latest `sync/HANDOFF.md`. Confirm status is `READY_FOR_REVIEW` and cycle is newer than the last `sync/REVIEW.md`.
2. **Don't re-litigate previously-reviewed handoffs**: if HANDOFF.cycle is unchanged from a prior REVIEW (no progression), respond with a brief carry-forward review (status `APPROVED (carry-forward from Cycle N)`) and recommend Implementor advance. Don't repeat full review on the same surface.
3. For each file in `Files Touched`, **read the file** and verify the change matches the HANDOFF description.
4. Apply the AGENTS.md compliance checklist:
   - Tokens (PALETTE direct refs, opacity method, font system, TYPE token usage)
   - Icons (Fluent only, fill-based, viewBox, `filled` prop)
   - Components (gallery scope, scroll convention, border radius tier)
   - Accessibility (contrast, keyboard, click targets, focus-visible)
   - Process (component maturity status, registry JSON updated, no breaking changes without version bump)
5. Identify findings, classified per the cadence directive:
   - **Blocker** — behavioral regression, broken build, broken acceptance criterion, security risk. Stops progression.
   - **High** — API contract break, a11y failure, dependency/security concern, undocumented breaking change. Requires explicit resolution before next cycle.
   - **Medium / Low** — convention drift, comment improvements, minor cleanups. **Batch these** rather than blocking on them. List for awareness but don't gate.
6. Decide status:
   - `APPROVED` — substance is sound, no Blocker, High findings are accepted with documented mitigation. Cycle may advance.
   - `CHANGES_REQUESTED` — Blocker present OR High finding requires rework before advance.
   - `NEEDS_DISCUSSION` — scope question, architectural fork, or AGENTS.md ambiguity that the user should weigh in on.
7. Write `sync/REVIEW.md` using the Review Format in `PROTOCOL.md`.
8. Populate `Approvals` and `Next Steps` precisely; the Implementor will execute Next Steps verbatim.
9. In `Governor Notes`, capture any cadence observations or scope-prep guidance for upcoming cycles.

### Validation surfaces (what to check against)

- **Storybook** is the primary visual validation surface for tokens and components.
- **Foundation stories** (`src/foundations/*.stories.tsx`) document the token API; they use semantic tokens via `useTokens()`, never raw PALETTE.
- **Docs app** (`cd app && npm run build`) is a consumer build gate, not a visual review surface — flag build failures, but don't visual-review there.
- **Read-only**: Governor never modifies source files. Findings are documented, not patched.

## Switch prompts (manual mode only)

In orchestrated mode the skill handles role selection automatically. The original copy-paste switch prompts in `PROTOCOL.md` still work if you want to drive a cycle by hand.
