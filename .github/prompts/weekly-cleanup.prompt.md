---
name: weekly-cleanup
description: "Weekly hygiene protocol — health gate, decision log review, audit lifecycle check, waiver expiry, and sync-state review. Produces a Weekly Hygiene Report. Run Friday, or at the start of a new session after a week gap."
---

# Weekly Cleanup Skill

**Trigger:** User invokes `/weekly-cleanup` or "run Friday cleanup"  
**Frequency:** Every Friday (or at start of any new work session after a week gap)  
**Role:** Can be run by Implementor or Governor â€” produces a report, does not make changes

---

## Purpose

Keep the project documentation, audit artifacts, and pending items from accumulating
unchecked. This skill surfaces what can be cleaned â€” the human decides what to execute.
It does NOT modify files unless the user explicitly approves each action.

---

## What This Skill Does

Produces a **Weekly Hygiene Report** covering 5 sections:

1. **Health Gate Status** â€” run `npm run health` and report pass/fail counts by severity
2. **Decision Log Review** â€” scan `docs/DECISION_LOG.md` for stale pending items
3. **Audit Lifecycle Check** â€” scan `docs/audits/` for files eligible for archival per `docs/audits/LIFECYCLE.md`
4. **Waiver Expiry Check** â€” scan `docs/STABLE_READINESS.md` and `docs/registry/consumer-waivers.json` for expired or near-expiry waivers
5. **Sync State Check** â€” check `sync/HANDOFF.md` and `sync/REVIEW.md` for open cycles or stale state

---

## Step-by-Step Protocol

### Step 1 â€” Health Gate

```bash
npm run health
```

Report as:
```
HEALTH: {pass|fail}
  Blockers: N
  High:     N
  Medium:   N
  Low:      N
  TypeScript errors: N
```

If any Blocker: flag as **ACTION REQUIRED** before any cleanup proceeds.

---

### Step 2 â€” Decision Log Review

Read `docs/DECISION_LOG.md`. For each entry in `## Pending Items`:

- **T1 items not `in-progress`** â†’ flag: "T1 item has been pending for {N} days â€” should this be started?"
- **T3 items pending >30 days** â†’ flag: "T3 item may be stale â€” still relevant?"
- **Items with `status: resolved`** â†’ flag: "Cleanup condition met â€” ready to archive"
- **Items with `status: deprecated`** â†’ flag: "Mark for archival on next pass"

Report format:
```
DECISION_LOG:
  T1 pending (not in-progress): {list IDs}
  T3 stale (>30 days): {list IDs}
  Ready to archive: {list IDs}
  Action items: {count}
```

---

### Step 3 â€” Audit Lifecycle Check

Read `docs/audits/LIFECYCLE.md`. Check:

1. **Process docs misplaced in `docs/audits/`** â€” are `governor-implementor-flow-evaluation-*` and `conversation-retention-governance-plan-*` still there?
2. **`-cycle{N}` PNGs** â€” check if their component's spec has reached `status: verified` since last check
3. **Dated `.md` audit narratives** â€” check if their component has been promoted to `stable` since last check
4. **`component-absorption-batch1-intake/`** â€” is it superseded by the Figma pipeline yet?

Report format:
```
AUDIT_LIFECYCLE:
  Files eligible for archival: {list}
  Misplaced process docs: {count}
  No action needed: {count files}
```

---

### Step 4 â€” Waiver Expiry Check

Read `docs/STABLE_READINESS.md` waiver inventory. For each waiver:

- **Expired** (`expires` date < today): flag as "EXPIRED â€” reverts to active finding"
- **Expiring within 30 days**: flag as "NEAR EXPIRY â€” review and renew or resolve"

Report format:
```
WAIVERS:
  Expired: {list project + finding_id}
  Near expiry (30d): {list}
  Active + valid: {count}
```

---

### Step 5 â€” Sync State Check

Read `sync/HANDOFF.md` and `sync/REVIEW.md`.

- **HANDOFF cycle > REVIEW cycle**: Governor review is pending. Flag if it has been >3 days.
- **HANDOFF status = READY_FOR_REVIEW + age > 7 days**: "Stale handoff â€” needs Governor review"
- **HANDOFF status = IN_PROGRESS + age > 3 days**: "In-progress handoff stalled?"
- **sync/history/** â€” if the current cycle minus the latest archived cycle > 10: "Consider archiving recent cycles to sync/history/"

Report format:
```
SYNC_STATE:
  Current cycle: {N}
  HANDOFF status: {status}
  REVIEW status: {status}
  Pending Governor review: {yes|no}
  Days since last archive: {N}
  Action items: {list}
```

---

## Output Format

The skill produces a single **Weekly Hygiene Report**:

```markdown
# Weekly Hygiene Report â€” {YYYY-MM-DD}

## Summary
{pass|needs-attention|action-required}
{N action items identified}

## 1. Health Gate
{output}

## 2. Decision Log
{output}

## 3. Audit Lifecycle
{output}

## 4. Waivers
{output}

## 5. Sync State
{output}

## Recommended Actions (ranked by urgency)
1. {action} â€” {reason}
2. ...

## No-Action Items
{what was checked and found clean}
```

---

## What the Skill Does NOT Do

- Does NOT delete or move files without explicit user approval per recommended action
- Does NOT modify `AGENTS.md`, `sync/PROTOCOL.md`, or `sync/ROLES.md`
- Does NOT trigger a new Implementor cycle â€” cleanup actions are separate from implementation work

---

## When to Escalate to a Full Sync Cycle

If the cleanup report reveals:
- Any Blocker finding from health gate
- An expired waiver that reinstates a BLOCKER/HIGH active finding
- A T1 pending item that has been blocked for >2 weeks
- A sync/HANDOFF that is READY_FOR_REVIEW but unreviewed for >7 days

â†’ Run `/sync-step` (or `/loop /sync-step`) to process through the Implementor/Governor loop before proceeding with cleanup.

---

## Relationship to Other Files

| File | Role |
|------|------|
| `docs/DECISION_LOG.md` | Source for Step 2 â€” pending items and cleanup conditions |
| `docs/audits/LIFECYCLE.md` | Source for Step 3 â€” retention rules |
| `docs/STABLE_READINESS.md` | Source for Step 4 â€” waiver inventory |
| `sync/HANDOFF.md` + `sync/REVIEW.md` | Source for Step 5 â€” loop state |
| `npm run health` | Source for Step 1 â€” automated audit results |

---

_Last updated: 2026-06-08 (Cycle 128)_

