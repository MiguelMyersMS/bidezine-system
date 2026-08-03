# Stop Conditions (orchestrated mode)

In orchestrated mode the `/sync-step` skill checks these conditions before and after each step. If any condition fires, the skill stops, surfaces the situation, and returns control to the user.

## Permissive set (current configuration)

The design-system project is configured for **permissive stopping** per the Cycle 51 cadence directive: prioritize blocker / high risk; batch low-risk refinements; minimize interruptions for routine implementation. The AI stops only at the conditions below.

### Always stop (cannot be auto-resolved)

1. **Dependency change** — Implementor needs to edit `package.json` or `package-lock.json`. Dependency adds, removes, or version bumps always require user authorization. Includes any `npm install <name>` operation.
2. **`AGENTS.md` edit needed** — Implementor or Governor wants to change the canonical rule source. Rule changes are user-driven.
3. **Sync protocol or skill edit needed** — Implementor or Governor wants to edit `sync/PROTOCOL.md`, `sync/ROLES.md`, `sync/STOP_CONDITIONS.md`, `sync/README.md`, `sync/INSTALL.md`, or the `/sync-step` skill file itself.
4. **Blocker finding** — Governor identifies a Blocker-level finding (behavioral regression, broken build, security risk).
5. **High finding** — Governor identifies a High-severity finding per the cadence directive (API contract break, a11y failure, dependency/security concern, undocumented breaking change). The Implementor should not auto-attempt a fix without user authorization.
6. **NEEDS_DISCUSSION** — Governor sets status to `NEEDS_DISCUSSION` (scope question, architectural fork, AGENTS.md ambiguity).
7. **CHANGES_REQUESTED** — Governor sets status to `CHANGES_REQUESTED`. Implementor should not auto-retry without user direction.
8. **Bucket / scope ambiguity** — Implementor needs to interpret an approved scope (e.g., what counts as "deps-only" or "source-only") in a non-obvious way. Surface to user rather than guess.
9. **Golden Rule violation requested** — Implementor or Governor proposes a change (code, doc, story, token, scope decision, or "minor cleanup") that violates any Golden Rule in `AGENTS.md` ("## Golden Rules" section). Always stop. The agent MUST surface the violation to the user verbatim per the violation-handling protocol in `AGENTS.md` — *"This change would violate Golden Rule #N — {rule name}. {Brief explanation}. Do you authorize this Golden Rule violation?"* — and wait for an explicit per-instance authorization in the same turn. Implicit, downstream, or "earlier-cycle" authorization is **not** sufficient. The authorization (or refusal) MUST be quoted verbatim in HANDOFF / REVIEW as the durable trail. This condition applies regardless of `/loop` continuity, scope cap status, or cadence directives.

### Soft signals (continue, but document)

These are NOT stop conditions; the loop continues. But they should appear in HANDOFF or REVIEW for the audit trail:

- Out-of-scope dirty tree (already a HANDOFF section)
- Re-review (no progression) — Governor issues a brief carry-forward review per ROLES.md and recommends Implementor advance
- Medium / Low findings — listed for awareness, not gating

### Budget guards

10. **Auto-loop iteration cap** — Stop after **10** consecutive AI-driven steps in a single `/loop /sync-step` session (≈ 5 cycles). Reports a summary and waits for user direction to continue.

### Not for this project

Conditions present in the data-model-system kit but **not applicable here** (no equivalent in design-system):

- ~~Cycle log mismatch~~ — design-system doesn't maintain a KPI cycle log
- ~~Standards/* change~~ — design-system uses `AGENTS.md` (covered by condition 2 above), not a `standards/` folder
- ~~Recalibration cycle~~ — design-system doesn't run recalibration cycles
- ~~Per-cycle scope cap~~ — implementation work often spans multiple file edits within an approved Bucket / Phase scope; gating on count would conflict with the cadence directive

## What "stop" means

When a stop condition fires, the skill:

- Writes the appropriate file (HANDOFF or REVIEW) to a clean state, OR stops before starting if the condition is detected at step entry.
- Returns a concise text summary to the user describing the trigger.
- Does NOT continue iterating, even if invoked under `/loop`.

## Explicit non-stop rule

- Automatic role switching between Implementor and Governor while `/loop /sync-step` is active is **not** a stop condition.
- Do not stop just to ask the user to switch chats or paste prompts.

## Resuming

The user resumes by either:

- Invoking `/sync-step` again (once the blocking condition is addressed, e.g., dependency change authorized).
- Re-invoking `/loop /sync-step` for continuous mode.
- Switching to manual mode (paste the role switch prompt directly from `PROTOCOL.md`).

## Tightening the stop set

If you want more frequent oversight (e.g., during a risky refactor), replace this file's permissive set with one of:

- **Conservative**: also stop at every source-code edit (not just deps/AGENTS), every Medium finding.
- **Aggressive**: also stop after every 3 steps for status summary.

Edit this file and restart the loop. No code change to the skill is needed.

## Cadence-directive alignment

This permissive set was deliberately chosen to honor the Cycle 51 cadence directive:

> *"Please govern at a level worth governing: prioritize blocker/high risk, behavioral regressions, API contract breaks, a11y failures, and dependency/security concerns. Avoid micro-governing every small step unless risk justifies it. Prefer batching low-risk refinements into fewer cycles so implementation velocity stays high."*

If the cadence directive is later revised, this STOP_CONDITIONS file should be revised alongside it. The protocol change itself is a stop condition (3 above), so the loop pauses naturally when this file needs editing.
