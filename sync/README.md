# Sync Protocol — Self-driving Implementor↔Governor loop

Orchestration layer for the design-system Implementor↔Governor cycle. One AI drafts implementation work, another reviews it against `AGENTS.md`, the loop runs itself until something needs your attention.

---

## How to use it

### For the user

```text
/loop /sync-step    # run continuously until a stop condition fires
/sync-step          # run one step at a time
```

That's the whole command surface. The AI auto-detects which role to run based on the current `sync/HANDOFF.md` and `sync/REVIEW.md` state. You don't paste switch prompts. You don't choose a role.

The loop pauses and returns control when:

- A high-risk file edit is needed (package.json/lockfile, AGENTS.md, sync/PROTOCOL.md itself).
- Governor finds a Blocker or High severity issue, or sets status to `CHANGES_REQUESTED` / `NEEDS_DISCUSSION`.
- 10 consecutive steps complete in one session (safety cap).

See `sync/STOP_CONDITIONS.md` for the full list.

### When NOT to use the loop

The orchestrated loop is for **governed implementation cycles tracked in `sync/`**. For tasks that don't belong in the protocol cycle, skip the loop and ask directly in normal conversation:

- One-line tweaks to a component
- Reading code or searching
- Running a build, test, or storybook
- Quick visual checks
- Anything you can validate in under a minute

Invoking `/sync-step` for these wraps a 10-second edit in protocol ceremony. Use the loop when the work needs the Implementor↔Governor discipline (new features, refactors, dependency adds, accessibility-impacting changes).

### For the AI (any AI executing the loop)

1. Read `sync/PROTOCOL.md` for the role decision tree and rules.
2. Read `sync/ROLES.md` for the Implementor and Governor playbooks.
3. Read `sync/STOP_CONDITIONS.md` to know when to hand control back.
4. Read `AGENTS.md` at the repo root — that's the canonical rule source for governance.
5. Execute exactly one role's step per `/sync-step` invocation.
6. Report a one-sentence result; let the `/loop` wrapper handle continuation.

The full skill body is at `~/.claude/skills/sync-step/SKILL.md` and is invoked automatically when the user types `/sync-step`.

---

## What this is

Two roles working through `sync/HANDOFF.md` and `sync/REVIEW.md`:

- **Implementor** drafts a HANDOFF: what changed, files touched, what to review, status. Source-of-truth governance instruction is `AGENTS.md`.
- **Governor** writes a REVIEW: verify Implementor's work against AGENTS.md, identify findings (Blocker / High / Medium / Low), prioritize next steps, decide status.

The loop alternates roles. Each cycle is one Implementor turn + one Governor turn. Per the cadence directive captured in Cycle 51, the Governor prioritizes **blocker / high risk** (behavioral regressions, API contract breaks, a11y failures, dependency/security concerns) and batches low-risk refinements rather than micro-governing every small step.

---

## Files in this folder

| File | What it is |
|---|---|
| [README.md](README.md) | This file — front door |
| [PROTOCOL.md](PROTOCOL.md) | Protocol definition, formats, rules, role decision tree |
| [ROLES.md](ROLES.md) | Implementor and Governor playbooks |
| [STOP_CONDITIONS.md](STOP_CONDITIONS.md) | When the AI hands control back to the user |
| [INSTALL.md](INSTALL.md) | Detailed replication and installation instructions |
| HANDOFF.md | Current cycle's Implementor handoff (live state) |
| REVIEW.md | Current cycle's Governor review (live state) |
| history/ | Archived past-cycle snapshots |

---

## Resuming an in-progress project (this project's case)

This sync folder was added to a **live project** already at Cycle 51 APPROVED. The orchestration layer dropped in on top of existing cycle history without modifying `HANDOFF.md` or `REVIEW.md`.

When you run `/loop /sync-step`, the decision tree reads:

- `REVIEW.md` cycle = 51, status = `APPROVED`
- `HANDOFF.md` cycle = 51
- → next role is **Implementor**, advancing to Cycle 52

The Cycle 51 REVIEW Next Steps say: *"Implementor executes Cycle 52: `npm install @ariakit/react`, commit deps-only diff, open Cycle 52 HANDOFF."*

That work edits `package.json` + `package-lock.json` — which is a **STOP condition** per `STOP_CONDITIONS.md`. So the first `/sync-step` will start the Implementor turn, detect the dependency-file edit, and **pause for your authorization** before running the install. You confirm; the next `/sync-step` continues; the Governor reviews next.

---

## Replicating to another project

See [INSTALL.md](INSTALL.md). Short version: copy the 5 sync/*.md files (README, PROTOCOL, ROLES, STOP_CONDITIONS, INSTALL) to the new project, leave HANDOFF.md and REVIEW.md for that project to fill, and the user-global `/sync-step` skill works automatically.
