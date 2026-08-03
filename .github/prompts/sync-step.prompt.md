---
description: "Run the Implementor↔Governor sync loop. One invocation = one step (Implementor OR Governor turn). The agent auto-detects the correct role from sync/HANDOFF.md and sync/REVIEW.md state. For continuous operation say '/sync-step loop' or invoke multiple times."
---

# /sync-step — Implementor↔Governor Sync Loop

Runs one step of the design system's self-driving development loop.
One invocation = one role turn (either Implementor or Governor, never both).

Read first: `sync/PROTOCOL.md`, `sync/ROLES.md`, `sync/STOP_CONDITIONS.md`

---

## Role decision (auto-detected)

1. Read `sync/HANDOFF.md` (cycle number, status) and `sync/REVIEW.md` (cycle number, status).
2. If `REVIEW.md` does not exist OR its cycle < `HANDOFF.md` cycle → **run Governor** (review pending).
3. If `REVIEW.md` status = `APPROVED` and its cycle == `HANDOFF.md` cycle → **run Implementor** (advance to next cycle).
4. If `REVIEW.md` status = `CHANGES_REQUESTED` or `NEEDS_DISCUSSION` → **STOP**, return control to user.
5. Before any role executes, check `sync/STOP_CONDITIONS.md`. If any condition fires → **STOP**.

---

## Implementor turn

**Runs when:** last review is `APPROVED`

1. Read `sync/REVIEW.md` Next Steps — these are the instructions for this cycle.
2. Execute the work (code, docs, stories, icons, config).
3. Validate against `AGENTS.md` compliance checklist (tokens, icons, a11y, components).
4. Increment cycle counter.
5. Write `sync/HANDOFF.md` with: What Changed, Files Touched, What to Review, Status = `READY_FOR_REVIEW`.

**Full playbook:** `sync/ROLES.md` → Implementor Playbook

---

## Governor turn

**Runs when:** `HANDOFF.md` cycle > `REVIEW.md` cycle (or REVIEW doesn't exist yet)

1. Read `sync/HANDOFF.md`. Confirm status = `READY_FOR_REVIEW`.
2. Read every file listed in Files Touched. Verify changes match the description.
3. Apply `AGENTS.md` compliance checklist.
4. Classify findings: Blocker / High / Medium / Low.
5. Decide status: `APPROVED` / `CHANGES_REQUESTED` / `NEEDS_DISCUSSION`.
6. Write `sync/REVIEW.md` with: Findings, Approvals, Next Steps (prioritized), Governor Notes, Status.

**Full playbook:** `sync/ROLES.md` → Governor Playbook

---

## Continuous mode

To run multiple steps without stopping between each:

> "Run /sync-step continuously until a stop condition fires"

The agent will alternate Implementor/Governor turns automatically (up to 10 steps per session).
Stop conditions: `sync/STOP_CONDITIONS.md`

---

## Stop conditions (always checked)

- Dependency change needed (`package.json` / `package-lock.json`)
- `AGENTS.md` edit needed
- `sync/PROTOCOL.md`, `sync/ROLES.md`, `sync/STOP_CONDITIONS.md`, or sync skill edit needed
- Governor finds a Blocker
- Governor finds a High severity finding
- Governor sets `NEEDS_DISCUSSION`
- Governor sets `CHANGES_REQUESTED`
- Golden Rule violation proposed
- 10 consecutive AI steps reached

---

## Key files

| File | Role |
|---|---|
| `sync/HANDOFF.md` | Implementor writes; Governor reads |
| `sync/REVIEW.md` | Governor writes; Implementor reads |
| `sync/PROTOCOL.md` | Protocol definition (do not modify without Stop Condition authorization) |
| `sync/ROLES.md` | Full Implementor + Governor playbooks |
| `sync/STOP_CONDITIONS.md` | When to pause and return control to user |

---

## Related commands

- `/weekly-cleanup` — Friday hygiene report (does not advance a cycle)
- `/figma-build` (BUILD), `/evidence-pipeline` (verify one), `/evidence-wave` (verify many) — Figma pipeline (Implementor phases 3–5)
- `/commands` — full index of all available commands
