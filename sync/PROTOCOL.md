# Agent Sync Protocol

## Mode Selector (Read First)
Choose exactly one mode at cycle start and keep it for the full cycle.

### Orchestrated mode (default for steady-state operation)

- AI auto-drives the loop via `/sync-step` skill; user invokes once (often via `/loop /sync-step`).
- The AI reads `sync/HANDOFF.md` and `sync/REVIEW.md`, determines the next role, and executes one step.
- See `sync/README.md`, `sync/ROLES.md`, `sync/STOP_CONDITIONS.md`, `sync/INSTALL.md`.
- This is the recommended mode for routine implementation cycles.

### Sync-file mode (manual switching)

- Implementor writes `sync/HANDOFF.md`.
- Governor writes `sync/REVIEW.md`.
- User pastes switch prompts in this file between roles.
- Use when you want explicit step-by-step control, or when the `/sync-step` skill isn't installed.

### Direct-audit mode (exception)

- Governor writes decision directly into a target audit file.
- Use this only when the user explicitly requests direct-in-audit handling.

### Tie-break rule

If multiple modes appear in active docs/prompts, Orchestrated mode wins unless the user explicitly requests a different mode.

## Orchestration (auto-driven loop)

Orchestrated mode lets the AI auto-decide role each step via the `/sync-step` skill. The user typically invokes `/loop /sync-step` to drive multiple steps; the AI self-paces between Implementor and Governor turns until a STOP condition fires.

### Orchestrated contract (authoritative)

- When the user invokes `/loop /sync-step`, role switching is automatic.
- The AI must alternate Implementor/Governor based on file state without asking the user to switch chats.
- The AI should continue until a STOP condition fires or the cycle reaches explicit closeout.
- Copy-paste switch prompts are not required in orchestrated mode outputs.

### Role decision tree

1. Read `sync/HANDOFF.md` (cycle number, status) and `sync/REVIEW.md` (cycle number, status).
2. If `sync/REVIEW.md` does not exist or its cycle < `sync/HANDOFF.md` cycle, run Governor (review pending).
3. If `sync/REVIEW.md` status is `APPROVED` and its cycle == `sync/HANDOFF.md` cycle, run Implementor (advance to next cycle).
4. If `sync/REVIEW.md` status is `CHANGES_REQUESTED` or `NEEDS_DISCUSSION`, STOP and return control.
5. Before any role executes, check `sync/STOP_CONDITIONS.md`. If any fires, STOP and return control.

### Roles

See `sync/ROLES.md` for the full Implementor and Governor playbooks: what each reads, what each writes, how each applies the `AGENTS.md` compliance checklist, and how each honors the Cycle 51 cadence directive.

## Purpose
Enables two isolated chat sessions to collaborate on the same workspace:
- **Copilot Chat** = Implementor (writes code, runs servers, interacts with browser)
- **Codex Chat** = Governor (reviews changes, audits compliance, suggests next steps)

## Communication Bridge
Both roles read/write files in `sync/`. In orchestrated mode, switching is automatic; manual triggering is fallback-only.

## Files

| File | Owner | Purpose |
|------|-------|---------|
| `PROTOCOL.md` | Shared | This file — protocol definition (do not modify) |
| `README.md` | Shared | Front door: how to use, when not to use, replication pointers |
| `ROLES.md` | Shared | Implementor and Governor playbooks (orchestrated mode) |
| `STOP_CONDITIONS.md` | Shared | When the AI hands control back to user (orchestrated mode) |
| `INSTALL.md` | Shared | Replication kit for other projects |
| `HANDOFF.md` | Implementor | Structured summary of completed work for Governor review |
| `REVIEW.md` | Governor | Findings, approvals, and prioritized next steps |

## Handoff Format (Implementor → Governor)

```markdown
## Cycle: N
## Timestamp: YYYY-MM-DD HH:MM

### What Changed
- bullet list of changes made

### Files Touched
- path/to/file.ts — brief description

### What to Review
- specific review requests

### Open Questions
- anything needing Governor judgment

### Status
READY_FOR_REVIEW | IN_PROGRESS | BLOCKED
```

## Review Format (Governor → Implementor)

```markdown
## Cycle: N
## Timestamp: YYYY-MM-DD HH:MM

### Findings
#### Blockers
- (none) or list

#### High
- list

#### Medium / Low
- list

### Approvals
- [ ] or [x] per item from handoff

### Next Steps (prioritized)
1. highest priority action
2. ...

### Governor Notes
- free-form observations

### Status
APPROVED | CHANGES_REQUESTED | NEEDS_DISCUSSION
```

## Rules
1. Always increment the Cycle number
2. Never overwrite the other agent's file — only your own
3. Read the other agent's file FIRST before writing yours
4. Implementor does not proceed past a BLOCKER finding without resolution
5. Both files are ephemeral — archive to `sync/history/` if needed
6. In orchestrated mode, do not require user-facing switch prompts.
7. Manual switch prompts are only for sync-file mode fallback.

## Switch Prompts (manual fallback only)

These prompts are only used when operating in **Sync-file mode (manual switching)**.
They are not required when `/loop /sync-step` is active.

After the Implementor writes `HANDOFF.md`, tell the user:

**Switch to Codex and paste:**

```text
Act as a Governor. Read .github/prompts/governor.prompt.md for your role. Then read sync/HANDOFF.md and review the work. Write your findings to sync/REVIEW.md.
```

After the Governor writes `REVIEW.md`, tell the user:

**Switch back to Copilot Chat and paste:**

```text
Read the review
```

The Implementor must always end a handoff with the exact switch prompt so the user knows where to go and what to say. The Governor must always end a review the same way. Both prompts must be in fenced code blocks so the user can copy them without selecting surrounding text.

If a review or handoff is missing a fenced switch prompt, treat it as incomplete and correct it before asking the user to switch sessions.
