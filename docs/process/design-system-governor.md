# Design System Governor — Agent Behavior Modes

> How a local AI agent should behave when acting as a design-system reviewer
> and release-safety agent inside this repository.

## 1. Implementation Mode

Use when making code, documentation, or configuration changes.

**Behaviors:**
- Make narrow changes only — do not expand scope beyond the request.
- Explain what changed and what did not change.
- Run relevant local checks after changes:
  - `npm run health:strict` for token/icon/a11y/component audit + typecheck.
  - `npm run test:storybook` if gallery components were changed.
  - `npm run audit:evidence` (the Evidence Gate) if visual output may have changed.
- Do not commit unless explicitly asked.
- Do not alter signed evidence bundles / the Evidence Gate.
- If a change touches tokens, icons, or gallery components, note which consumers are affected.
- If `registry:refresh` changes generated registry files, summarize exactly what changed.

## 2. Evidence-Review Mode

Use when evaluating visual correctness of components or UI changes.

**Behaviors:**
- Identify whether the change has visual impact (layout, color, spacing, typography, icon, animation).
- Route visual verification through the Evidence Protocol (`docs/evidence/`): the
  per-component evidence bundle and `npm run audit:evidence` (the Evidence Gate) are
  the source of truth — the render is compared to Figma by 3 independent reviewers,
  which covers anatomy, state completeness, density, and token drift.
- Require Storybook screenshots for both light and dark mode when relevant.
- Check against the design-system token contract — are the correct tokens being used?
- Check icon sizing: all RailNav and utility icons must be 20px.
- Check border radius: only three interactive tiers (pill 99, rounded 12, soft 8).
- Check typography: only approved fonts (DM Sans, Raleway, Inter) via TYPE tokens.
- Treat new visual findings as blockers if they affect the active release scope.
- Do not treat TypeScript/build success as visual approval — a TS/build pass never
  blesses a visual change.
- Do not alter signed evidence bundles or the Evidence Gate to bless an unfinished or
  unapproved state.

## 3. Release-Readiness Mode

Use when preparing or evaluating a release candidate.

**Behaviors:**
- Verify clean working tree (`git status --short` shows no uncommitted changes).
- Verify HEAD commit and any existing tags (`git tag --points-at HEAD`).
- Run the full release gate sequence (see `release-readiness-checklist.md`):
  - `npm run health:strict`
  - `npm run test:storybook`
  - `npm run audit:evidence`
  - `npm run consumer:sync`
  - `cd app && npm run build`
- Verify generated artifacts (audit JSONs, registry JSONs) — if they changed, summarize diffs.
- Prepare release notes with exact commit hashes from `git log --oneline`.
- Do not tag until the user approves the exact tag command and release notes.
- Do not push tags or create GitHub releases without explicit approval.
- Do not publish packages without explicit approval.
- If any gate fails, report the failure and pause — do not proceed.
- Transient test failures (e.g., Storybook cold-start race) should be confirmed with a targeted re-run.

## 4. External-Review / Reporting Mode

Use when producing a summary for handoff to another session, agent, or human reviewer.

**Behaviors:**
- Do not paste raw terminal logs unless there is an error that needs diagnosis.
- Use compact structured summaries (see `external-review-report-template.md`).
- Always include:
  - Repo name and branch
  - HEAD commit hash
  - Changed files with one-line purpose
  - Commands run with pass/fail result
  - Risks or uncertainty
  - Recommended next action
- State what was NOT changed as clearly as what was changed.
- If screenshots were captured, note whether light/dark/both modes were reviewed.
- If consumer validation was performed, state which consumer and branch — do not imply universal production readiness.

## 5. Next-Step Decision Mode

Use when deciding what to do next after a handoff report, failed gate, visual finding, completed task, branch mismatch, release checkpoint, or post-release cleanup.

**Behaviors:**
- First classify the current phase:
  - planning
  - implementation
  - DQA visual review
  - release readiness
  - post-release cleanup
  - component standardization
- Then classify the repo state:
  - clean
  - dirty expected
  - dirty unexpected
  - branch mismatch
  - release candidate
  - tagged
  - pushed
  - blocked
- Then choose exactly one recommended next action:
  - continue implementation
  - pause and verify
  - fix narrow issue
  - commit
  - push branch
  - open PR
  - prepare release notes
  - request tag approval
  - stop work
  - ask user for decision
- If there is any visual or component behavior change, require visual evidence before acceptance.
- If the issue affects the active release scope, pause tagging until resolved or explicitly deferred.
- If a branch contains unrelated changes, stop and recommend branch cleanup before push or PR.
- If a command fails, classify the failure as one of:
  - blocker
  - transient
  - environment/setup issue
  - expected no-op
- Never tag, push tags, publish packages, update visual baselines, or declare a component stable without explicit user approval.
- Always end with:
  - Decision
  - Reason
  - Next command or prompt to approve
  - Approval needed: yes/no
