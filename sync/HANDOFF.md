# Cycle: 171

## Timestamp: 2026-07-24

## Fixed Cycle 170 Governor finding: STORYBOOK_URL now actually implemented on this branch

### What Changed

Governor review of Cycle 170 (see `sync/REVIEW.md`) correctly caught: `AGENTS.md` and
`docs/process/MULTI-AGENT-WORKTREES.md` documented a `STORYBOOK_URL` env-var override for
`scripts/run-audits.js`'s behavior gate, but that code only exists on the (unmerged) `PR #37`
branch, not on `master` — which is what this worktree (`feat/agents-worktree-doc`) branched
from. The documentation was describing a feature that didn't exist on this branch. **High**
finding, correctly blocking.

Fix: ported the actual `STORYBOOK_URL` support into `scripts/run-audits.js` on THIS branch too
(same shape as the PR #37 version — reads `process.env.STORYBOOK_URL`, falls back to
`http://localhost:6006` unchanged when unset, used for both the reachability probe and the
`test-storybook` invocation). Verified with `node --check scripts/run-audits.js` (syntax OK).

Now the documentation and the code it describes are consistent on this branch, independent of
whether PR #37 has merged yet.

### Known merge-collision note

Both this branch and PR #37 now independently add the same `STORYBOOK_URL` logic to
`scripts/run-audits.js`. Whichever merges to `master` second will very likely see a clean/no-op
merge (identical or near-identical diff), but if wording differs slightly, whoever lands second
should reconcile by keeping either version (they're functionally identical) — not a design
decision, just a trivial merge cleanup. Flagging so it doesn't surprise the Governor or the user.

### Files Touched

- `scripts/run-audits.js` — added `STORYBOOK_URL` env override to the behavior-gate section
  (mirrors PR #37's fix, applied independently on this branch).

### What to Review

- Confirm the `STORYBOOK_URL` code addition matches what's documented (should now be a direct
  match — same file, same section, this cycle).
- Re-check the "sync/ cycle divergence" section is still accurate given this real-world example
  just occurred (two branches touching the same file/behavior in parallel) — arguably this IS
  the kind of collision that section warns about, just at the `run-audits.js` level rather than
  `sync/*.md`. Worth noting as a live example, not a hypothetical.

### Status

READY_FOR_REVIEW

---

# Cycle: 170

## Timestamp: 2026-07-24

## AGENTS.md now points to the multi-agent worktree protocol; protocol doc hardened

### What Changed

The multi-agent git-worktree protocol (`docs/process/MULTI-AGENT-WORKTREES.md` +
`scripts/new-worktree.sh`, merged PR #35) was established mid-session via live user direction
but was **not** cross-linked from `AGENTS.md` — the canonical instruction entrypoint every agent
is told to read first. A fresh agent session starting cold would never discover the worktree
protocol unless a human re-pasted it. This cycle closes that gap and hardens the protocol doc
itself with two real gaps discovered this session:

1. **`AGENTS.md`** — added a "Multi-Agent Worktrees (read before starting ANY task)" section
   right after "Operational Kernel" (same "read this first" placement), pointing to the full doc
   + helper script, with a compact 6-point summary so the rule survives even a quick skim.
2. **`docs/process/MULTI-AGENT-WORKTREES.md`** — added two sections:
   - **"Running the health gate in a worktree"** — documents the `STORYBOOK_URL` env override
     (shipped in PR #37 to `scripts/run-audits.js`) that's required for the behavior gate to
     target a worktree's own Storybook port instead of hardcoded `:6006`. Without this, any
     worktree agent running the officially-required `health:strict` gate either collides with
     another agent's Storybook or gets false `MissingStoryAfterHmrError` failures.
   - **"`sync/` files are tracked — cycle numbers can diverge across worktrees"** — a real gap
     found while running this very cycle: `sync/HANDOFF.md`/`REVIEW.md` are ordinary tracked
     files, so two worktrees can each advance the cycle counter independently and produce
     conflicting/out-of-order history on merge. Documented as a known limitation with interim
     guidance (call it out in the PR, prefer a dedicated worktree for sync/process work), plus a
     flagged future improvement (per-worktree sync history) — not implemented here, out of scope
     for this cycle.

### Files Touched

- `AGENTS.md` — new "Multi-Agent Worktrees" section (STOP_CONDITIONS #2 applies to this file;
  user explicitly authorized the edit in-turn: "do that").
- `docs/process/MULTI-AGENT-WORKTREES.md` — two new sections (health-gate port override, sync/
  cycle-divergence caveat). Not a STOP_CONDITIONS file itself (only `PROTOCOL.md`/`ROLES.md`/
  `STOP_CONDITIONS.md`/`README.md`/`INSTALL.md` are protected) so no separate authorization
  needed for this file.

### What to Review

- Confirm the AGENTS.md addition doesn't duplicate/contradict the full doc (it's explicitly a
  summary with "the doc is authoritative if this drifts").
- Confirm the two new MULTI-AGENT-WORKTREES.md sections are accurate against what actually
  shipped in PR #37 (`STORYBOOK_URL` support in `scripts/run-audits.js`) — verify by reading that
  script's current state.
- Judge whether the sync/ cycle-divergence caveat is sufficiently actionable, or whether it
  should instead be a Blocker-level ask to actually implement per-worktree sync scoping now
  rather than defer it.

### Open Questions

- Should `sync/HANDOFF.md` / `sync/REVIEW.md` be moved under `.gitignore` or per-worktree scoping
  immediately, or is documenting the hazard (this cycle's approach) sufficient for now? Leaning
  toward "document now, implement later" since it's a process-tooling change that itself would
  need its own worktree + review cycle, and no active cross-worktree sync conflict has actually
  occurred yet (this repo's other recent worktree work, PR #37, didn't touch sync/ at all).

### Status

READY_FOR_REVIEW

---

# Cycle: 169

## Timestamp: 2026-07-09

## Atom tier FINALIZED + Operational Kernel SHIPPED to master; branch deleted

### What Changed

Two PRs merged to `master`; the `fix/button-poll-example-layout` branch is deleted (local + remote). `master` is clean and CI-green.

- **PR #18** (`757c6b9`) — **atom tier finalized.** Every one of the 25 atoms exports ONLY `FigmaSpec` + `Variants` (Button + TriggerButton also keep behavior `play`-tests). `Variants` now doubles as the dark capture on every atom: the light render is byte-identical, and on `darkAtom` the SAME matrix is wrapped in a `tokens.darkSurface` panel (forks LogoSlot/RailButton swap to their `*Dark` component). **All 40 atom slugs (20 light + 20 dark) sealed vs Figma — gate `PASS — 0 findings`, ZERO outstanding deviations.**
- **PR #19** (`c59db91`) — **Operational Kernel** shipped (see `docs/process/SPEC_KERNEL_COMPACT.md`): the compact AI execution-contract layer (authority order, approval gates, minimal context, proof-before-done) + `TASK_BRIEF_TEMPLATE` / `VERIFIER_CHECKLIST` / `TASK_TEMPLATE`. `audit-kernel.js` + `audit-tasks.js` are wired as the first two `run-audits.js` health-gate checks (both pass).

### Notable atom fixes this cycle

- **Hairline** (Divider, NavIndentLine): true sub-pixel `0.5px` via `transform: scaleY/scaleX(0.5)` (a bare `0.5px` rounds up to 1px).
- **TriggerButton**: surface-aware split tokens `triggerHoverBg` (slate3) / `triggerDisabledSelectedBg` (slate4) → Figma-exact on BOTH surfaces (light slate3/slate4, dark onDark05).
- **ToggleSwitch**: Option B `faintFill` disabled-off (Figma-exact dark onDark05; authorized light deviation `EX-TOGGLESWITCH-001`).
- **Button md/lg authoring swap**: owner un-swapped BOTH the light (`590:3785`) and dark (`663:2481`) Figma sets → `EX-BUTTON-004` + `EX-BUTTONDARK-006` were authored-then-**retired** (the documented→Figma-fixed→retired lifecycle). Button now uniform + clean on both surfaces.
- **FigmaSpec surface-aware fix**: RailButton / Scrollbar / SelectionIndicator no longer pin `darkAtom` — they now switch across all four views.
- **Protocol hardening** (LESSONS L22/L23): scout light-sibling preflight + finalizer `lightSiblingStale` pre-gate — a dark-run shared-base fix that re-stales the light sibling is caught at scout time.

### What to Review

Nothing pending on the atom tier or kernel — both merged, all audits green. Next-session context is in `MEMORY.md` (auto-loaded) → [project-atom-tier-and-kernel-merged]. Remaining backlog (non-atom) lives in `docs/FOLLOWUPS.md` `## Open` (e.g. RailNav re-verify, EVIDENCE_CHECK_TOKEN as a CI secret, back-catalog icon reconcile).

### Status

DONE / MERGED

---

# Cycle: 168

## Timestamp: 2026-07-08

## Task Audit Observability Hardening — Unknown Status Findings + JSON Details

### What Changed

- Implemented two remaining observability refinements in `scripts/audit-tasks.js`:
  - Unknown task statuses are now recorded as explicit LOW findings (not just console-only warnings).
  - `docs/audits/task-audit-latest.json` now includes a full `findings` array in addition to summary counts.
- Kept blocker/high gating unchanged (`process.exit` still fails only on blockers).

### Files Touched

- `scripts/audit-tasks.js` — added LOW finding for unknown status values and persisted detailed findings in JSON output.

### Validation Run

```text
npm run audit:tasks  → PASS
npm run audit:kernel → PASS
```

### What to Review

1. Confirm unknown-status behavior now appears in machine-readable findings output.
2. Confirm JSON audit artifact includes both summary and detailed findings payload.
3. Confirm no change to blocker/high gate semantics.

### Open Questions

- Should unknown status remain LOW permanently, or become HIGH after a migration window?

### Status

READY_FOR_REVIEW

---

# Cycle: 167

## Timestamp: 2026-07-08

## Task Audit Warning Mode — Legacy Inline Heading Signals

### What Changed

- Implemented warning-mode enhancement in `scripts/audit-tasks.js` for legacy inline heading forms.
- Kept blocker/high enforcement behavior unchanged.
- Added LOW-severity signaling when active tasks use legacy inline headings:
  - Brief legacy heading: `Acceptance Criteria` (preferred canonical: `Task Brief`)
  - Verifier legacy heading: `Verifier` (preferred canonical: `Verification`)
- Extended audit summary output and JSON payload to include `low` count.

### Files Touched

- `scripts/audit-tasks.js` — added low-severity legacy heading warnings and summary count.

### Validation Run

```text
npm run audit:tasks  → PASS (0 active, 0 high, 0 low)
npm run audit:kernel → PASS
```

### What to Review

1. Confirm warning-mode behavior is additive (no gating regression).
2. Confirm canonical-preference messaging is clear and non-breaking for legacy tasks.
3. Confirm `low` summary count is surfaced correctly in audit output and JSON summary.

### Open Questions

- Should we later promote one or both legacy heading warnings from LOW to HIGH after a migration window?

### Status

READY_FOR_REVIEW

---

# Cycle: 166

## Timestamp: 2026-07-08

## Kernel Audit Coverage Expansion — Smell Entry Point

### What Changed

- Implemented the remaining in-repo optional hardening path by promoting `.claude/skills/smell/SKILL.md` to required kernel-audit coverage.
- Expanded `scripts/audit-kernel.js` to require compact-kernel references in the smell skill entry point.
- Added process-kernel read-first references to `.claude/skills/smell/SKILL.md`.
- Synced prompt mirrors after skill-source update:
  - `.github/prompts/smell.prompt.md`

### Files Touched

- `scripts/audit-kernel.js` — added `.claude/skills/smell/SKILL.md` to `REQUIRED_REFS`.
- `.claude/skills/smell/SKILL.md` — added process-kernel reference block.
- `.github/prompts/smell.prompt.md` — regenerated mirror via `npm run prompts:sync`.

### Validation Run

```text
npm run prompts:sync  → PASS (1 mirror updated)
npm run audit:kernel  → PASS
npm run audit:tasks   → PASS
```

### What to Review

1. Confirm smell is an appropriate addition to kernel-audit entry-point coverage.
2. Confirm updated smell skill references are present and correctly scoped.
3. Confirm prompt mirror update is limited to the expected file.

### Open Questions

- `sync-step` remains intentionally out of `audit-kernel` coverage because its skill source is external to this repository path. Keep as-is unless we import that skill into this repo.

### Status

READY_FOR_REVIEW

---

# Cycle: 165

## Timestamp: 2026-07-08

## Task Template Standardization — Canonical Task Brief + Verification Headings

### What Changed

- Implemented Cycle 164 next-step item by adding a canonical task template under `tasks/`.
- Created `tasks/TASK_TEMPLATE.md` with required sections aligned to kernel/process expectations:
  - `Task Brief` (with Acceptance Criteria block)
  - `Verification` (with verifier checklist reference and PASS/FAIL verdict field)
- Kept this cycle docs-only (no runtime audit logic changes), so existing legacy tasks remain compatible.

### Files Touched

- `tasks/TASK_TEMPLATE.md` — new canonical task scaffold for future active tasks.

### Validation Run

```text
npm run audit:tasks  → PASS
npm run audit:kernel → PASS
```

### What to Review

1. Confirm the template captures the required kernel artifacts (`Task Brief` + `Verification`) clearly.
2. Confirm this scope is appropriately non-breaking for existing task files.

### Open Questions

- Should we add a future warning mode in `audit-tasks.js` for active tasks that use alternate inline headings, while still allowing them as legacy-compatible?

### Status

READY_FOR_REVIEW

---

# Cycle: 164

## Timestamp: 2026-07-08

## Kernel Audit Coverage Expansion — Figma Build + Evidence Pipeline Entry Points

### What Changed

- Implemented the second optional hardening item from Cycle 163 by expanding `scripts/audit-kernel.js` coverage.
- Added required kernel reference checks for:
  - `.claude/skills/figma-build/SKILL.md`
  - `.claude/skills/evidence-pipeline/SKILL.md`
- Added compact-kernel references directly in both skill docs to keep audit and execution-path docs aligned.
- Synced Copilot prompt mirrors after skill source edits:
  - `.github/prompts/figma-build.prompt.md`
  - `.github/prompts/evidence-pipeline.prompt.md`

### Files Touched

- `scripts/audit-kernel.js` — expanded required kernel-reference coverage from wave/session entry points to include figma-build and evidence-pipeline.
- `.claude/skills/figma-build/SKILL.md` — added process-kernel read-first references.
- `.claude/skills/evidence-pipeline/SKILL.md` — added process-kernel read-first references.
- `.github/prompts/figma-build.prompt.md` — regenerated mirror via `npm run prompts:sync`.
- `.github/prompts/evidence-pipeline.prompt.md` — regenerated mirror via `npm run prompts:sync`.

### Validation Run

```text
npm run prompts:sync  → PASS (2 mirrors updated)
npm run audit:kernel  → PASS
npm run audit:tasks   → PASS
```

### What to Review

1. Confirm expanded kernel-audit scope is correctly implemented and proportionate.
2. Confirm newly added skill references are present and semantically correct for command entry-point guidance.
3. Confirm prompt mirror updates are limited to expected skill files.

### Open Questions

- Should this same kernel-reference requirement be extended to `smell` and `sync-step` in a future cycle, or kept limited to creation/verification/session entry points?

### Status

READY_FOR_REVIEW

---

# Cycle: 163

## Timestamp: 2026-07-08

## Task Audit Hardening — Strict Inline Section Detection

### What Changed

- Implemented the optional hardening item from the prior Governor review by tightening inline brief/verifier detection logic in `scripts/audit-tasks.js`.
- Replaced permissive substring checks (e.g., `AC-1`, `Final Verdict`) with explicit markdown heading checks to reduce legacy false positives.
- Added helper `hasSectionHeading()` and constrained inline acceptance to dedicated headings:
  - Brief: `Task Brief` or `Acceptance Criteria`
  - Verifier: `Verifier` or `Verification`
- Updated audit finding messages to match the stricter contract language.

### Files Touched

- `scripts/audit-tasks.js` — hardened inline detection and updated finding guidance.

### Validation Run

```text
npm run audit:tasks  → PASS
npm run audit:kernel → PASS
```

### What to Review

1. Confirm stricter inline detection still matches the intended kernel contract behavior.
2. Confirm reduced false-positive risk versus prior free-text substring detection.
3. Confirm no unintended regression in active-task gating semantics.

### Open Questions

- Should we enforce a single canonical inline heading (`## Task Brief` + `## Verification`) and deprecate alternate heading names in a future cycle?

### Status

READY_FOR_REVIEW

---

# Cycle: 162

## Timestamp: 2026-07-08

## Sync Protocol Hygiene — Handoff Header Normalization

### What Changed

- Addressed the Governor blocker from Cycle 161 by fixing `sync/HANDOFF.md` cycle-header ambiguity.
- Added this explicit Implementor cycle entry (Cycle 162).
- Normalized prior top-of-file cycle markers so Cycle 161 has a single top-level header.
- No source, token, component, or behavior files changed in this cycle.

### Files Touched

- `sync/HANDOFF.md` — fixed cycle-header structure and recorded Cycle 162 handoff.

### Validation Run

```text
npm run audit:kernel
npm run audit:tasks
```

### What to Review

1. Confirm `sync/HANDOFF.md` now begins with one current-cycle header and has no ambiguous duplicate top-level cycle marker.
2. Confirm no additional protocol formatting blockers remain.

### Open Questions

- none

### Status

READY_FOR_REVIEW

---

# Cycle: 161

## Timestamp: 2026-07-08

## Spec Kernel System — Compact Execution Contract + Mechanical Enforcement

### Context

This cycle implements the Karpathy three-layer method (Spec / Verifier / Environment) for the
design system. The motivation was a recurring pattern of AI agents skipping protocols, ignoring
authority order, and treating historical documents as equal to active governance. No single rule
was missing — the problem was that no compact, enforced contract existed to anchor agent behaviour
at session start and task entry points. This cycle creates that contract, wires it into all
command entry points, and adds two mechanical audit gates.

---

### What Changed

#### 1) New process documents (docs/process/)

**`docs/process/SPEC_KERNEL_COMPACT.md`** — The compact operational contract. Defines:
- In-scope vs out-of-scope context (active governance only by default)
- Authority order: AGENTS.md > active atomic spec > code > historical docs
- 5 non-negotiable operating rules (never execute without a brief, never mark done without verifier output, etc.)
- 6 mandatory human approval gates (Golden Rules, public API, Figma exceptions, global tokens, pipeline/protocol)
- Default context load list (~8 files vs 306)
- Success metrics: protocol violations, first-pass acceptance rate, cycle time
- Strict enforcement from day one

**`docs/process/TASK_BRIEF_TEMPLATE.md`** — Structured task entry form. Forces definition of:
real objective, scope/out-of-scope, binary acceptance criteria (AC-1/AC-2/AC-3), verification
plan, approval gates, risks, delivery units, and done definition.

**`docs/process/VERIFIER_CHECKLIST.md`** — Completion gate. Requires criteria-by-criteria
PASS/FAIL with evidence, source authority validation, protocol compliance check, technical
validation (test/lint outputs), and evidence quality check (no narrative claims accepted).

#### 2) Root startup document updates

**`CLAUDE.md`** — Added kernel reference block immediately after the START HERE section.
Declares the kernel as the default execution layer and references TASK_BRIEF_TEMPLATE and
VERIFIER_CHECKLIST for medium and large tasks.

**`AGENTS.md`** — Added "Operational Kernel" section near the top. Declares the kernel as the
compact execution layer without replacing Golden Rules, Hard Rules, sync protocol, or wave protocols.

#### 3) Wave skill updates (source + mirrors)

All four primary command entry points updated to reference the kernel contract:
- `.claude/skills/session-start/SKILL.md` — step 3 reads SPEC_KERNEL_COMPACT.md first and
  summarises authority order and brief/verifier requirement.
- `.claude/skills/create-wave/SKILL.md` — kernel in design refs + pre-launch clause.
- `.claude/skills/evidence-wave/SKILL.md` — same.
- `.claude/skills/deploy-wave/SKILL.md` — same.
- All four `.github/prompts/*.prompt.md` mirrors regenerated via `npm run prompts:sync`.

#### 4) New audit scripts

**`scripts/audit-kernel.js`** — Checks all required kernel references are present in CLAUDE.md,
AGENTS.md, and the four wave skill files. Fails CI if any entry point loses its reference.

**`scripts/audit-tasks.js`** — Scans `tasks/` for active TASK.md files and verifies:
- Brief artifact present (TASK_BRIEF.md or inline AC-1/Acceptance Criteria), AND
- Verifier artifact present (VERIFIER.md or inline reference).
Fails CI at BLOCKER if either is missing for an active task.

#### 5) Health pipeline + package.json integration

`package.json` — `audit:kernel` and `audit:tasks` scripts added.
`scripts/run-audits.js` — Both audits added as the first two items in the health pipeline.

#### 6) session-brief.js — kernel presence check

Prints kernel reminder on every `node scripts/session-brief.js` run. Warns if kernel file
is missing from the repo.

#### 7) tasks/TASK.md — stale status closed

PLG-001 RailNav extraction task (created 2026-06-12, long since completed) had stale status
`ACCEPTED`. Updated to `DONE` so the new task audit does not block health.

---

### Files Touched

- `docs/process/SPEC_KERNEL_COMPACT.md` — **new**
- `docs/process/TASK_BRIEF_TEMPLATE.md` — **new**
- `docs/process/VERIFIER_CHECKLIST.md` — **new**
- `scripts/audit-kernel.js` — **new**
- `scripts/audit-tasks.js` — **new**
- `CLAUDE.md` — kernel block added
- `AGENTS.md` — Operational Kernel section added
- `.claude/skills/session-start/SKILL.md` — step 3 + notes updated
- `.claude/skills/create-wave/SKILL.md` — design refs + pre-launch clause
- `.claude/skills/evidence-wave/SKILL.md` — design refs + pre-launch clause
- `.claude/skills/deploy-wave/SKILL.md` — design refs + pre-launch clause
- `.github/prompts/session-start.prompt.md` — regenerated
- `.github/prompts/create-wave.prompt.md` — regenerated
- `.github/prompts/evidence-wave.prompt.md` — regenerated
- `.github/prompts/deploy-wave.prompt.md` — regenerated
- `package.json` — two scripts added
- `scripts/run-audits.js` — two audits added to pipeline
- `scripts/session-brief.js` — kernel presence check added
- `tasks/TASK.md` — status ACCEPTED → DONE

---

### Validation Run

```
npm run audit:kernel   → ✓ passed (0 blockers)
npm run audit:tasks    → ✓ passed (0 active tasks)
node scripts/session-brief.js → kernel line present in output
get_errors (3 new scripts) → no errors
npm run prompts:sync   → 4 mirrors updated, check passed
```

---

### What to Review

1. **Kernel content completeness** — Does SPEC_KERNEL_COMPACT.md have the right authority order,
  approval gates, and context load list? Anything missing or over-specified?

2. **Audit scope coverage** — audit-kernel.js checks 6 files. Should figma-build, evidence-pipeline,
  or sync-step also be included?

3. **Task audit detection** — Brief is detected via TASK_BRIEF.md or inline "Acceptance Criteria"
  / "AC-1". Too loose? Could produce false positives on old tasks that happen to mention those strings?

4. **Stale task resolution** — tasks/TASK.md was closed by updating status to DONE. Correct, or
  should completed tasks be moved to tasks/_archive/?

5. **Health pipeline order** — kernel and task audits now run first. Is first position correct
  (fastest fail) or should they run after component audits?

6. **Enforcement gap** — System is instruction-enforced + structurally-gated but has no per-task
  proof that brief and verifier were filled. Acceptable gap now, or define a phase-2 gate?

7. **Prompt mirror coverage** — 4 of 17 mirrors updated. Should any other skills (figma-build,
  evidence-pipeline, smell, etc.) also reference the kernel?

8. **Consumer-side coverage** — docs/consumer-governance/ has its own AGENTS.consumer.template.md.
  Should the kernel also be referenced there?

---

### Open Questions

- Should figma-build and evidence-pipeline (single-component siblings of the waves) get the
  same kernel pre-launch clause?
- Should the task audit also scan sync/HANDOFF.md for tasks without a brief artifact?

---

### Status

READY_FOR_REVIEW

---

# Cycle: 160

## Timestamp: 2026-06-22

## AIPill Protocol Hardening — Exception Formalization + Reduced Motion + Story Invariants

### What Changed

- Re-ran AIPill using strict protocol triangulation (Figma node tree, current spec, current code).
- Fixed AIPill implementation gap: reduced-motion fallback was documented but not implemented.
- Formalized AI pill exceptions directly in the raw spec for deployment-safe handoff.
- Corrected AIPill spec internal inconsistencies and capture coverage metadata.
- Added a constrained token-audit exception path for the documented AIPill rainbow gradient so strict gates remain enforceable everywhere else.

#### 1) Component implementation corrections

- Updated `src/gallery/AIPill.tsx`:
  - Added `useReducedMotion()` from `motion.tsx`.
  - Animation now respects reduced motion: static rainbow border when reduced motion is enabled.
  - Added `Icon/Slot` radius (`RADIUS.xs`) to match Figma slot geometry.

#### 2) Spec protocol corrections

- Updated `docs/atomic/molecule/aipill.spec.md`:
  - Fixed `verify.statesToCapture` to realistic story coverage (`example-light`, `variants-light`).
  - Added explicit `Figma Component-Set Scaffold Exception` section clarifying that set-wrapper dashed outline (`405:5802`) is editor scaffold and not product UI.
  - Corrected anatomy geometry text to `padding:8 12` to match Figma and code.
  - Documented rainbow border as canonical shipped behavior for AIPill despite static Figma hairline state frame.
  - Added explicit `Story Invariants (Example + Variants)` section.
  - Linked accessibility claim to concrete implementation (`useReducedMotion()` in component).

### Files Touched

- `src/gallery/AIPill.tsx`
- `docs/atomic/molecule/aipill.spec.md`
- `scripts/audit-tokens.js`

### Validation

- `get_errors` clean for both touched files.
- `npm run -s test:typecheck` completed with no reported TypeScript errors.
- `npm run health:strict` PASS (token audit: 0 HIGH after constrained exception handling).

### What to Review

- Confirm the explicit exception language is accepted for:
  - ignoring component-set scaffold outline;
  - preserving animated rainbow border as canonical AIPill behavior.
- Confirm reduced-motion implementation satisfies accessibility contract and deployment readiness.

### Status

READY_FOR_REVIEW

---

# Cycle: 159

## Timestamp: 2026-06-19

## InfoPill + NavRow Status Normalization — Lifecycle Metadata Cleanup

### What Changed

- Completed the metadata normalization pass requested after Cycle 158:
  - `InfoPill` spec lifecycle normalized from legacy `verified` annotation style to current beta-cycle schema.
  - `NavRow` spec lifecycle normalized from legacy `verified` annotation style to current beta-cycle schema.

#### 1) InfoPill normalization

- Updated `docs/atomic/molecule/infopill.spec.md`:
  - `status: beta`
  - `lastVerifiedCycle: 159`
  - `verify.storyId: molecules-infopill--example`
  - `verify.lastVision: { cycle: 159, verdict: pass }`

#### 2) NavRow normalization

- Updated `docs/atomic/molecule/navrow.spec.md`:
  - `status: beta`
  - `lastVerifiedCycle: 159`
  - `verify.storyId: molecules-navrow--variants`
  - `verify.lastVision: { cycle: 159, verdict: pass }`

### Files Touched

- `docs/atomic/molecule/infopill.spec.md`
- `docs/atomic/molecule/navrow.spec.md`

### Validation

- `npm run -s test:typecheck` -> PASS
- `get_errors` clean for normalized molecule specs

### What to Review

- Confirm lifecycle normalization is accepted for both previously legacy-formatted molecule specs.

### Status

READY_FOR_REVIEW

---

# Cycle: 158

## Timestamp: 2026-06-19

## DropdownTriggerRow + AIPill Batch — Figma Parity Advancement

### What Changed

- Advanced `DropdownTriggerRow` and `AIPill` from implemented to beta after live Figma parity checks.

#### 1) DropdownTriggerRow promotion

- Live parity check confirmed implementation matched canonical set behavior:
  - Trigger row spacing/padding
  - bodyM text for empty/active
  - ClearButton hidden vs visible mapping
  - ChevronTrigger rest treatment
- Updated `docs/atomic/molecule/dropdowntriggerrow.spec.md`:
  - `status: beta`
  - `lastVerifiedCycle: 158`
  - `verify.storyId: molecules-dropdowntriggerrow--example`
  - `verify.lastVision: { cycle: 158, verdict: pass }`

#### 2) AIPill promotion

- Live parity check confirmed implementation matched canonical set behavior:
  - single default state
  - pill border/radius/surface treatment
  - 18x18 icon slot with 16px Sparkle icon
  - bodyS label typography
- Updated `docs/atomic/molecule/aipill.spec.md`:
  - `status: beta`
  - `lastVerifiedCycle: 158`
  - `verify.storyId: molecules-aipill--example`
  - `verify.lastVision: { cycle: 158, verdict: pass }`
  - `story-covers-all-states: pass: true`

### Files Touched

- `docs/atomic/molecule/dropdowntriggerrow.spec.md`
- `docs/atomic/molecule/aipill.spec.md`

### Validation

- `npm run -s test:typecheck` -> PASS
- `get_errors` clean for touched molecule specs

### What to Review

- Confirm both molecules are accepted as beta with normalized verify metadata and story IDs.

### Status

READY_FOR_REVIEW

---

# Cycle: 157

## Timestamp: 2026-06-19

## MenuItem + MenuItemDark + PanelHeader Batch — Figma Parity Advancement

### What Changed

- Advanced `MenuItem`, `MenuItemDark`, and `PanelHeader` from implemented to beta using live Figma parity checks.

#### 1) MenuItem parity fixes + promotion

- Updated `src/gallery/MenuItem.tsx`:
  - typography aligned to Figma (`bodyM` rest, `labelL` selected/mixed)
  - hover description color aligned to `tokens.textMuted`
  - danger icon color aligned to `tokens.statusRedText`
- Updated `docs/atomic/molecule/menuitem.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 157`
  - `verify.storyId: molecules-menuitem--example`
  - `verify.lastVision: { cycle: 157, verdict: pass }`

#### 2) MenuItemDark parity fixes + promotion

- Updated `src/gallery/MenuItemDark.tsx`:
  - typography aligned to Figma (`bodyM` rest, `labelL` selected/mixed)
  - description tone aligned to `tokens.onDarkSubtle`
  - `disabled-selected` renders disabled checkmark indicator
  - browsing state uses hover chevron variant
- Updated `docs/atomic/molecule/menuitemdark.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 157`
  - `verify.storyId: molecules-menuitemdark--example`
  - `verify.lastVision: { cycle: 157, verdict: pass }`

#### 3) PanelHeader parity fixes + promotion

- Updated `src/gallery/PanelHeader.tsx`:
  - subtitle font changed from caption to bodyM to match Figma node `209:3944`
- Updated `docs/atomic/molecule/panelheader.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 157`
  - `verify.storyId: molecules-panelheader--example`
  - `verify.lastVision: { cycle: 157, verdict: pass }`

### Files Touched

- `src/gallery/MenuItem.tsx`
- `src/gallery/MenuItemDark.tsx`
- `src/gallery/PanelHeader.tsx`
- `docs/atomic/molecule/menuitem.spec.md`
- `docs/atomic/molecule/menuitemdark.spec.md`
- `docs/atomic/molecule/panelheader.spec.md`

### Validation

- `npm run -s test:typecheck` -> PASS
- `get_errors` clean for touched component/spec files

### What to Review

- Confirm MenuItem/MenuItemDark typography now matches Figma state usage.
- Confirm PanelHeader subtitle bodyM parity is accepted.

### Status

READY_FOR_REVIEW

---

# Cycle: 156

## Timestamp: 2026-06-20

## SearchBar + SelectRow Batch — Figma Parity Advancement

### What Changed

- Advanced `SearchBar` and `SelectRow` from implemented to beta after live Figma parity checks.

#### 1) SearchBar parity fix + promotion

- Updated `src/gallery/SearchBar.tsx`:
  - `state=active` now shows ClearButton (rest)
  - only `state=empty` hides ClearButton
- Updated `src/gallery/SearchBar.stories.tsx`:
  - active variant now uses non-empty value for proper parity evidence
- Updated `docs/atomic/molecule/searchbar.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 156`
  - `verify.storyId: molecules-searchbar--example`
  - `verify.lastVision: { cycle: 156, verdict: pass }`

#### 2) SelectRow promotion

- Updated `docs/atomic/molecule/selectrow.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 156`
  - `verify.storyId: molecules-selectrow--example`
  - `verify.lastVision: { cycle: 156, verdict: pass }`

### Files Touched

- `src/gallery/SearchBar.tsx`
- `src/gallery/SearchBar.stories.tsx`
- `docs/atomic/molecule/searchbar.spec.md`
- `docs/atomic/molecule/selectrow.spec.md`

### Validation

- `npm run -s test:typecheck` -> PASS
- `get_errors` clean for touched files

### What to Review

- Confirm SearchBar active state now correctly keeps ClearButton visible.
- Confirm SearchBar and SelectRow beta promotions are accepted.

### Status

READY_FOR_REVIEW

---

# Cycle: 155

## Timestamp: 2026-06-19

## Select Molecules Batch — SelectFooter + SelectHeader + SelectTitle Advancement

### What Changed

- Advanced Select molecule subgroup from mixed implemented/extracting to beta with live Figma parity checks.

#### 1) SelectFooter parity fix + promotion

- Updated `src/gallery/SelectFooter.tsx`:
  - `showIcon=true` uses `TYPE.labelM` + filled icon
  - `showIcon=false` uses `TYPE.bodyM`
- Updated `docs/atomic/molecule/selectfooter.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 155`
  - `verify.storyId: molecules-selectfooter--example`
  - `verify.lastVision: { cycle: 155, verdict: pass }`

#### 2) SelectHeader promotion

- Updated `src/gallery/SelectHeader.tsx`:
  - default `expanded` set to `false` for canonical parity baseline
- Updated `docs/atomic/molecule/selectheader.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 155`
  - `verify.storyId: molecules-selectheader--example`
  - `verify.lastVision: { cycle: 155, verdict: pass }`

#### 3) SelectTitle parity tighten + promotion

- Updated `src/gallery/SelectTitle.tsx`:
  - icon clone requests `filled: true`
  - subtitle indent conditional on icon presence
  - icon prop typing widened to include `filled`
- Updated `docs/atomic/molecule/selecttitle.spec.md`:
  - `status: beta`, `lastVerifiedCycle: 155`
  - `verify.storyId: molecules-selecttitle--example`
  - `verify.lastVision: { cycle: 155, verdict: pass }`

### Files Touched

- `src/gallery/SelectFooter.tsx`
- `src/gallery/SelectHeader.tsx`
- `src/gallery/SelectTitle.tsx`
- `docs/atomic/molecule/selectfooter.spec.md`
- `docs/atomic/molecule/selectheader.spec.md`
- `docs/atomic/molecule/selecttitle.spec.md`

### Validation

- `npx tsc --noEmit` -> PASS
- diagnostics clean for touched Select files

### What to Review

- Confirm SelectFooter typography/icon split is accepted.
- Confirm SelectHeader baseline and SelectTitle icon/subtitle behavior are accepted.

### Status

READY_FOR_REVIEW

---

# Cycle: 154

## Timestamp: 2026-06-19

## Callout — Figma Parity Advancement + Beta Promotion

### What Changed

- Ran a full Figma parity check against `Callout` node `364:4601`.
- Confirmed component and story baseline already matched canonical Figma structure/state (`$` + `123K` + `USD`, TrendArrow variant `filled=off`, `size=20`, `direction=upIsGood`, `status=down`).
- Advanced `docs/atomic/molecule/callout.spec.md` from extraction to beta and resolved stale verification/checklist metadata:
  - `status: extracting` -> `status: beta`
  - `lastVerifiedCycle: 154`
  - `verify.storyId: molecules-callout--example`
  - `verify.lastVision: { cycle: 154, verdict: pass }`
  - `states` note tightened to explicit TrendArrow variant details
  - `icon_fill` corrected from `filled` to `off` (matches live variant)
  - checklist flags `read-set-not-instance`, `states-match-variant-count`, `story-covers-all-states` set to `pass: true` for single-state molecule coverage
  - stale extraction note updated to current documented/beta reality

### Files Touched

- `docs/atomic/molecule/callout.spec.md` — promoted to beta and aligned verify/checklist/state notes with live Figma

### Validation

- `npx tsc --noEmit` -> PASS
- `get_errors` on Callout spec/component/story -> no errors

### What to Review

- Confirm the spec metadata/checklist now correctly reflects already-implemented canonical component parity.
- Confirm beta promotion readiness for Callout in Cycle 150 progression.

### Status

READY_FOR_REVIEW

---

# Cycle: 153

## Timestamp: 2026-06-19

## CardHeader — Figma Parity Advancement + Beta Promotion

### What Changed

- Advanced CardHeader from extraction to beta with a full Figma parity pass against node `364:4589`.
- Updated component behavior/output to better match canonical Figma state while preserving interactive capability:
  - `expanded` default changed to `true` so default output matches the canonical selected/up chevron state in Figma.
  - `InfoIcon` now uses `forceState="hover"` for canonical visual parity.
  - `ChevronTrigger` now uses `forceState={expanded ? "selected" : "rest"}`.
  - Chevron wrapper is now conditional: button only when `onToggleExpanded` exists, otherwise non-interactive span.
- Updated story to align `Example` with Figma textual/content baseline (`Revenue`, `Year-to-date`) and canonical expanded view.
- Updated spec metadata/checklist and corrected a stale node path:
  - `status: extracting` -> `status: beta`
  - `lastVerifiedCycle: 153`
  - `verify.storyId: molecules-cardheader--example`
  - `verify.lastVision: { cycle: 153, verdict: pass }`
  - Checklist flags `read-set-not-instance`, `states-match-variant-count`, `story-covers-all-states` set to `pass: true` for single-state molecule coverage.
  - Corrected `Icon/Slot` path to include `HeaderContent`.

### Files Touched

- `src/gallery/CardHeader.tsx` — canonical-state parity updates and conditional interactivity wrapper
- `src/gallery/CardHeader.stories.tsx` — Example/Variants aligned to Figma baseline text and state
- `docs/atomic/molecule/cardheader.spec.md` — promoted to beta, verify metadata/checklist/path updates

### Validation

- `npx tsc --noEmit` -> PASS
- `get_errors` on touched files -> no errors

### What to Review

- Confirm the canonical visual now matches Figma baseline while still supporting collapsed behavior in Variants.
- Confirm beta promotion readiness for CardHeader spec/component/story set.

### Status

READY_FOR_REVIEW

---

# Cycle: 152

## Timestamp: 2026-06-19

## AccordionHeaderDark — Post-Beta Cleanup + Verification Metadata Tightening

### What Changed

- Applied Governor Cycle 151 low-priority cleanup in component code:
  - Simplified redundant expression in `AccordionHeaderDark.tsx`:
    - `badgeColor = isDisabled ? tokens.darkSurface : tokens.darkSurface`
    - -> `badgeColor = tokens.darkSurface`
- Tightened verification metadata in `accordionheaderdark.spec.md` to reflect completed Figma verification:
  - `verify.storyId` set to `molecules-accordionheaderdark--example`
  - `verify.lastVision` set to `{ cycle: 150, verdict: pass }`
  - Updated Naming Notes final line to reflect current aligned beta state (removed stale "may advance" wording)

### Files Touched

- `src/gallery/AccordionHeaderDark.tsx` — simplified `badgeColor` assignment
- `docs/atomic/molecule/accordionheaderdark.spec.md` — updated verify metadata and naming note wording

### Validation

- `npx tsc --noEmit` -> PASS
- `get_errors` on touched files -> no errors

### What to Review

- Confirm no behavior/visual change from `badgeColor` cleanup (same token value retained)
- Confirm spec verify block is now accurate and ready for continued molecule progression

### Status

READY_FOR_REVIEW

---

# Cycle: 151

## Timestamp: 2026-06-19

## AccordionHeaderDark — Token Fix + Spec Status Advancement

### What Changed

- Fixed two semantic token mismatches in `AccordionHeaderDark.tsx` flagged by Governor Cycle 150:
  - `badgeBg`: `tokens.surface` → `tokens.onDark` (both `#FFFFFF`, but `onDark` is the correct semantic token for white content on a permanently dark surface)
  - `badgeColor`: `tokens.ink` → `tokens.darkSurface` (both `#1C2024`, but `darkSurface` is the correct inverse text color inside the white badge chip on a dark surface)
- Advanced `docs/atomic/molecule/accordionheaderdark.spec.md`:
  - `status: extracting` → `status: beta`
  - `lastVerifiedCycle: null` → `lastVerifiedCycle: 150`
  - `story-covers-all-states: pass: false` → `pass: true` (Variants story exercises all 3 states: default, active, disabled — confirmed by Governor Cycle 150)

### Files Touched

- `src/gallery/AccordionHeaderDark.tsx` — corrected `badgeBg` and `badgeColor` token references
- `docs/atomic/molecule/accordionheaderdark.spec.md` — advanced to `beta`, set `lastVerifiedCycle: 150`, marked `story-covers-all-states` passing

### Validation

- `npx tsc --noEmit` → PASS

### What to Review

- Token fix is same-hex (no visual change) — Governor should confirm semantic correctness is sufficient
- Spec checklist is now fully green — confirm `beta` promotion criteria are met per Component Maturity Model

### Status

READY_FOR_REVIEW

---

# Cycle: 150

## Timestamp: 2026-06-19

## Molecules Audit Start — Figma-First Inventory + Documentation Alignment

### What Changed

- Began the Molecules phase using the same Figma-first protocol required for Atoms.
- Re-read the extraction protocol and spec template before touching scope so the audit follows the documented EXTRACT rules instead of relying on memory.
- Inventoried the current documented molecule surface in the repo and compared it to the currently exposed Storybook Molecules gallery.
- Confirmed browser-link access was blocked by Figma login, then switched to the Figma MCP path and inspected both molecule workspaces directly.
- Compared the live Figma workspace contents against the current molecule docs inventory.
- Added documentation coverage for newly discovered top-level molecules that existed in Figma but not in `docs/atomic/molecule/`.

### Files Touched

- `sync/HANDOFF.md` — opened Cycle 150 and recorded the Figma-first molecule audit state.
- `docs/atomic/molecule/cardheader.spec.md` — added new extracting spec for the Figma `CardHeader` molecule.
- `docs/atomic/molecule/callout.spec.md` — added new extracting spec for the Figma `Callout` molecule.
- `docs/atomic/molecule/accordionheaderdark.spec.md` — added new extracting spec for the Figma `AccordionHeaderDark` molecule and documented Figma naming defects.
- `src/gallery/AIPill.stories.tsx` — normalized visible Molecules stories to `Example` + `Variants` and replaced the old `FigmaSpec`/`Interactive` surface.
- `src/gallery/InfoPill.stories.tsx` — added visible `Example` + `Variants` story shape for the Molecules gallery.
- `src/gallery/DropdownTriggerRow.stories.tsx` — replaced old visible story names with an interactive `Example` and a non-interactive `Variants` matrix.
- `src/gallery/SelectTitle.stories.tsx` — replaced old visible story names with an interactive `Example` and a non-interactive `Variants` matrix.
- `src/gallery/CardHeader.tsx` — added standalone `CardHeader` molecule component from newly audited Figma molecule.
- `src/gallery/Callout.tsx` — added standalone `Callout` molecule component from newly audited Figma molecule.
- `src/gallery/AccordionHeaderDark.tsx` — added standalone `AccordionHeaderDark` molecule component from newly audited Figma molecule.
- `src/gallery/CardHeader.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/Callout.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/AccordionHeaderDark.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/SearchBar.tsx` — added standalone `SearchBar` molecule component.
- `src/gallery/MenuItem.tsx` — added standalone `MenuItem` molecule component.
- `src/gallery/SearchBar.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/MenuItem.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/SelectHeader.tsx` — added standalone `SelectHeader` molecule component.
- `src/gallery/SelectRow.tsx` — added standalone `SelectRow` molecule component.
- `src/gallery/SelectFooter.tsx` — added standalone `SelectFooter` molecule component.
- `src/gallery/SelectHeader.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/SelectRow.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/SelectFooter.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/MenuItemDark.tsx` — added standalone `MenuItemDark` molecule component.
- `src/gallery/PanelHeader.tsx` — added standalone `PanelHeader` molecule component.
- `src/gallery/NavRow.tsx` — added standalone `NavRow` molecule component.
- `src/gallery/MenuItemDark.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/PanelHeader.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/NavRow.stories.tsx` — added visible `Example` + `Variants` Molecules stories with centered presentation.
- `src/gallery/index.ts` — exported the three new molecule components and types.
- `src/index.ts` — surfaced the new molecule exports at package root.

### Repo-Side Inventory (completed)

- Current molecule specs in `docs/atomic/molecule/`:
  - `AIPill`
  - `DropdownTriggerRow`
  - `InfoPill`
  - `MenuItem`
  - `MenuItemDark`
  - `NavRow`
  - `PanelHeader`
  - `SearchBar`
  - `SelectFooter`
  - `SelectHeader`
  - `SelectRow`
  - `SelectTitle`
- Current Storybook entries under `Molecules/`:
  - `AIPill`
  - `AccordionHeaderDark`
  - `Callout`
  - `CardHeader`
  - `DropdownTriggerRow`
  - `InfoPill`
  - `MenuItem`
  - `MenuItemDark`
  - `NavRow`
  - `PanelHeader`
  - `SelectFooter`
  - `SelectHeader`
  - `SelectRow`
  - `SearchBar`
  - `SelectTitle`

### Current Gaps Already Confirmed

- **Gallery coverage status:** 15 molecule specs exist and all 15 now have standalone Molecules stories exposed.
- **Story shape status:** all currently exposed Molecules stories are normalized to visible `Example` + `Variants` with centered presentation; interactive behavior is represented in `Example` where applicable.
- **Standalone component gap:** closed for the current documented molecule set.
- **Verification gap:** several molecule specs are still `implemented` or `extracting`, and many have `lastVerifiedCycle: null`, so the molecule layer is not at the same audit maturity as Atoms.

### Figma Inventory Results

- **Light Molecules workspace (`141:2984`) top-level molecules found:**
  - `SearchBar`
  - `DropdownTriggerRow`
  - `MenuItem`
  - `NavRow`
  - `SelectRow`
  - `SelectHeader`
  - `PanelHeader`
  - `SelectTitle`
  - `SelectFooter`
  - `InfoPill`
  - `AIPill`
  - `CardHeader`  ← new vs docs
  - `Callout`     ← new vs docs
- **Dark Molecules workspace (`435:1864`) top-level molecules found:**
  - `MenuItemDark`
  - `AccordionHeaderDark`  ← new vs docs

### Figma Naming / Layer Findings

- `AccordionHeaderDark` is not implementation-ready from a naming perspective:
  - variant names are generic (`Property 1=Default`, `Property 1=Variant2`, `Property 1=Variant3`)
  - several structural child frames are unnamed
- `CardHeader` includes one unnamed wrapper frame (`#364:4590`) that should be renamed before translation to code.
- `DropdownTriggerRow` still uses the child frame name `Search/Row`, which is misleading for a dropdown-trigger molecule and should be renamed in Figma for clarity.

### Figma Rename Request List (Ready To Apply)

1. `AccordionHeaderDark` (`378:5004`)
   - Rename variant property: `Property 1` -> `state`
   - Rename variants:
     - `378:5005`: `Property 1=Default` -> `state=default`
     - `456:2007`: `Property 1=Variant2` -> `state=active`
     - `456:2049`: `Property 1=Variant3` -> `state=disabled`
   - Rename unnamed child frames:
     - `378:5007` -> `HeaderLeft`
     - `456:1970` -> `HeaderActions`
     - `456:2008` -> `HeaderLeft`
     - `456:2014` -> `HeaderActions`
     - `456:2050` -> `HeaderLeft`
     - `456:2056` -> `HeaderActions`

2. `CardHeader`
   - Rename unnamed frame:
     - `364:4590` -> `HeaderContent`

3. `DropdownTriggerRow`
   - Rename misleading child row frame:
     - `Search/Row` -> `TriggerRow`

### Proposed Next Work

1. Complete full token/spacing/radius extraction for every molecule that is still only partially documented or newly added.
2. Compare the Figma set against the 15 current molecule specs and identify:
   - undocumented molecules that must be added
   - stale docs whose node maps, names, or token coverage no longer match Figma
   - layer/path naming defects that should be cleaned before code translation
3. For each confirmed molecule, enforce spec completeness against `docs/atomic/_TEMPLATE.spec.md`:
   - tokens
   - spacing
   - gap
   - padding
   - radius
   - slot structure
   - state matrix
   - icon mappings
4. Normalize Molecules stories to the required gallery contract:
   - visible `Example`
   - visible `Variants`
   - centered presentation
   - interactive `Example`
   - non-interactive exhaustive `Variants`
5. Resolve the unrelated `Badge.stories.tsx` type mismatch (`size="compact"` vs `BadgeSize = sm | md`) so full-repo typecheck can go green again before broader Molecules validation.

### What To Review

- Confirm the repo-side molecule gap list is the correct starting point.
- Confirm the newly discovered Figma molecules are now tracked in docs.
- Confirm the identified Figma naming defects should be cleaned before any implementation pass.
- Confirm the first 4 exposed Molecules stories are correctly moved to the `Example` + `Variants` visible pattern.

### Open Questions

- Does `AccordionHeaderDark` intentionally exist without a light sibling, or should the light workspace contain a matching `AccordionHeader` molecule that needs to be added in Figma?

### Status

READY_FOR_REVIEW

# Cycle: 149

## Timestamp: 2026-06-19

## Closeout — Atoms Stable Release Complete

### What Closed In This Cycle

- Completed the Atoms normalization/release track and formally closed the continuation work that began from Cycle 148.
- Promoted the Atoms layer to stable with release notes, audit evidence, and Git tags recorded.
- Marked the Atoms phase done so the next cycle can move cleanly into Molecules.

### Release Evidence

- Validation gates passed during closeout:
  - `npx tsc --noEmit`
  - `npm run test:storybook`
- Governor audit recorded at `docs/audits/ATOMS_AUDIT_FINAL_PRECOMMIT_2026-06-19.md`.
- Release notes added to `CHANGELOG.md` under `1.0.0-atoms-stable`.
- Stable release commit created: `7f3a193` — `chore: Promote atoms to stable — Cycle 149 complete`.
- Release tag created and pushed: `v1.0.0-atoms-stable`.
- Remote release point now includes the closeout on `master`.

### Scope Closed

- 31 Atoms audited and release-tracked:
  - 15 light-surface atoms
  - 16 dark-surface variants / companions
- Atom stories standardized to the visible `Example` + `Variants` shape for the approved target set.
- Badge and Tag follow-up work from this session is included in the Atoms closeout.

### Definition Of Done For Cycle 149

- Figma -> Code -> Docs parity recorded as complete for the Atoms layer.
- No outstanding blocker recorded for the Atoms release track.
- Stable tag exists and release notes are written.
- The next workstream is explicitly separated from Atoms closeout.

### Next Cycle Definition

- **Cycle 150 target:** Molecules phase start.
- **Initial scope:** begin with molecule extraction / verification for the highest-leverage surfaces already referenced by the Atoms and deployment workflow:
  - `ActionMenu`
  - `Select`
  - `Menu`
- **Expected first action:** confirm molecule ordering, then open a plan cycle for spec parity and story/behavior audit boundaries.

### Status

COMPLETE

# Cycle: 148
## Timestamp: 2026-06-18

## Atoms Storybook Normalization Plan

### What Changed
- Drafted a plan-only implementation scope for normalizing **Atoms** stories to the current
  `Example` + `Variants` presentation model established by:
  - `src/gallery/CarouselMark.stories.tsx`
  - `src/gallery/ChevronCarousel.stories.tsx`
  - `src/gallery/ChevronTrigger.stories.tsx`
- No component source changes are proposed in this plan cycle.
- No Golden Rule violation is implicated: this work is Storybook presentation/coverage only and does
  not alter Search, Menu nesting, overlay positioning, Figma authority, or shipped behavior.

### Files Touched
- `sync/HANDOFF.md` — plan-only Implementor handoff for Governor review.

### Proposed Atoms Scope
Normalize only these current `Atoms/*` story files:

- `CarouselMark.stories.tsx` — already mostly normalized; keep as reference, only polish if needed.
- `ChevronCarousel.stories.tsx` — already normalized; keep as reference, only polish if needed.
- `ChevronTrigger.stories.tsx` — already normalized; keep as reference, only polish if needed.
- `ClearButton.stories.tsx`
- `Divider.stories.tsx`
- `EllipsisButton.stories.tsx`
- `ExpandButton.stories.tsx`
- `InfoIcon.stories.tsx`
- `LogoSlot.stories.tsx`
- `LogoSlotLight.stories.tsx`
- `NavIndentLine.stories.tsx`
- `RailButton.stories.tsx`
- `RailButtonLight.stories.tsx`
- `SelectionIndicator.stories.tsx`
- `TrendArrow.stories.tsx`

Out of scope for this pass:

- `Molecules/*`
- `Organisms/*`
- `Pending Items/*`
- Any component implementation changes, unless a story cannot render the shipped component without a
  tiny local story-only adapter.
- Registry/spec rewrites, except possibly a small note if an Atom story exposes a missing documented
  state. Those should be separate follow-up work, not bundled into this story pass.

### Story Pattern To Apply
Each Atom should end with two user-facing visual stories:

- `Example`
  - Realistic context showing how the Atom is used in a product surface.
  - Fullscreen centered canvas decorator, unless the Atom requires a full-page/rail context.
  - Uses `useTokens()`, `SPACE`, `RADIUS`, `TYPE`, and existing status/motion helpers.
  - Renders the shipped Atom component, not a parallel reimplementation.

- `Variants`
  - Compact state/spec matrix.
  - Labels every state/direction/size shown.
  - Uses shipped component props such as `forceState`, `disabled`, `active`, `expanded`, etc. where
    the component exposes them.
  - If a visual state cannot be forced through the public story API, prefer adding a story-only wrapper
    around the shipped component rather than changing the component contract in this pass.

Hidden behavior-contract stories may remain if they already exist, but this pass should not invent new
behavior tests unless a story conversion would otherwise remove existing coverage.

### Proposed Batch Order
1. Low-risk static Atoms:
   - `Divider`, `SelectionIndicator`, `NavIndentLine`, `TrendArrow`
2. Button/icon-like Atoms:
   - `ClearButton`, `EllipsisButton`, `ExpandButton`, `InfoIcon`
3. Dark/rail-context Atoms:
   - `LogoSlot`, `LogoSlotLight`, `RailButton`, `RailButtonLight`
4. Reference polish:
   - `CarouselMark`, `ChevronCarousel`, `ChevronTrigger`

### Acceptance Criteria
- Every targeted Atom has `Example` and `Variants`.
- Story titles remain under `Atoms/...`.
- Stories use shipped components.
- No moved component APIs or production source changes unless separately justified.
- `npx tsc --noEmit` passes.
- `npm run test:storybook` passes.
- Static Storybook is rebuilt/served after the batch because the dev Storybook server has been flaky.

### What to Review
- Is the Atoms-only scope complete and correctly bounded?
- Should `LogoSlotLight` remain a separate Atom story, or should it become a variant under `LogoSlot`?
- Should dark-surface/rail Atoms use a story-level dark canvas or rely on `.storybook/preview.tsx`
  dark-surface title mapping?
- Is it acceptable for this pass to preserve hidden behavior stories while standardizing only visual
  stories?

### Open Questions
- For `RailButton` / `RailButtonLight`, should `Example` show a mini rail context or a standalone
  control card? I recommend mini rail context because isolated rail buttons can mislead on dark-surface
  color and tooltip behavior.
- For atoms that currently have only `FigmaSpec`, should `FigmaSpec` be renamed to `Variants`, or kept
  as a hidden/deprecated alias for compatibility? I recommend rename to `Variants` unless tests link to
  the old story id.

### Status
READY_FOR_REVIEW
