# Stable Readiness — v0.1.0

This document defines the release criteria, waiver policy, and deferred-work
rules for the v0.1.0 stable release of `@miguel/design-system`.

---

## Release Criteria

### DS Repo Gates (all must pass)

| Gate | Command | Threshold |
|------|---------|-----------|
| Health audit | `npm run health:strict` | 0 blocker, 0 high, 0 medium, 0 low |
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Storybook tests | `npm run test:storybook` | All stories pass |
| Docs app build (consumer gate) | `cd app && npm run build` | exit 0 |
| Evidence | `npm run audit:evidence` | PASS — 0 findings |
| Consumer sync | `npm run consumer:sync` | Report only — no CI gate yet |

### Consumer Adoption Criteria

| Criterion | Threshold |
|-----------|-----------|
| Consumers migrated | ≥ 2 (bloodwork-dashboard-prototype, my-lyra-app-v2) |
| Consumer status (unwaived) | No BLOCKER or HIGH active findings |
| Consumer typecheck | Each consumer typechecks on its own (DS does not gate on this) |

---

## Waiver Policy

### What is a waiver?

A waiver marks a consumer-sync finding as **acknowledged and deferred**.
Waivers do NOT hide findings — waived findings are still reported in the
consumer-sync output alongside active findings. Status is derived from
**active (unwaived) findings only**.

### Waiver file

Waivers are **owned by the consumer** and live in **that consumer's own workspace docs** —
`<consumer>/docs/design-system-waivers.json` — never in the DS repo (the DS repo stores only the
design language, not per-project data). `consumer-sync` reads each consumer's file from the consumer
during the scan. Each entry:

```json
{
  "finding_id": "CS.RULE-ID",
  "file": "src/path/to/file.tsx",
  "reason": "Why this finding is waived",
  "owner": "who approved",
  "expires": "YYYY-MM-DD",
  "status": "active"
}
```

(`project` is optional — the file is inherently that consumer's; `consumer-sync` stamps the owning
project name automatically when reporting.)

### Waiver rules

1. **Every waiver must have a reason** — "not important" is not valid.
2. **Every waiver must have an expiry date** — no permanent waivers.
3. **Expired waivers are flagged** in the console summary. They revert the
   finding to active status automatically.
4. **Waivers are scoped** to a specific project + finding ID + file path.
5. **False positives** (e.g., `fontFamily: "inherit"`) are waived with
   a note explaining why the detector is wrong. These should be fixed in
   the detector long-term, not permanently waived.
6. **Deferred work** (e.g., Tailwind-to-DS token bridge) is waived with
   an expiry aligned to the target milestone (v0.2.0, Q1 2027, etc.).

### Who can add waivers?

The DS maintainer (currently: miguel). Consumer teams can request waivers
by filing a GitHub issue or during migration reviews.

---

## Deferred Work Rules

### What can defer to v0.2.0?

| Category | Example | Deferral OK? |
|----------|---------|-------------|
| False positives in detector | `fontFamily: "inherit"` flagged as hardcoded | Yes — waive + fix detector |
| Architectural gaps | Tailwind @theme uses Segoe UI, no DS bridge | Yes — requires design work |
| App-specific surfaces | Sidebar dark-surface hardcoded colors | Yes — DS lacks dark-surface tokens |
| Missing DS tokens | Dark-surface semantic tokens | Yes — not in scope for v0.1.0 |
| Low-priority inline styles | Token-expired banner inline colors | Yes — non-critical UI |

### What blocks v0.1.0?

| Category | Example | Blocks? |
|----------|---------|---------|
| PALETTE leak in consumer | Consumer imports PALETTE directly | Yes |
| Non-Fluent icon in consumer | Consumer uses lucide-react | Yes |
| DS health audit failure | Any finding at any severity | Yes |
| DS typecheck failure | Type error in DS source | Yes |
| Storybook/visual regression failure | Broken story or snapshot drift | Yes |

---

## Current Waiver Inventory

### bloodwork-dashboard-prototype (2 waivers)

| Finding | File | Reason | Expires |
|---------|------|--------|---------|
| CS.HARDCODED-FONT | LabResultsTable.tsx | `fontFamily: "inherit"` — CSS keyword, false positive | 2026-12-31 |
| CS.HARDCODED-FONT | MarkerCard.tsx | `fontFamily: "inherit"` — CSS keyword, false positive | 2026-12-31 |

### my-lyra-app-v2 / fabric-app-data-template (1 waiver)

| Finding | File | Reason | Expires |
|---------|------|--------|---------|
| CS.HARDCODED-FONT | FabricDatabasesApp.tsx | Inline banner fontFamily — low-priority, deferred | 2027-03-31 |

---

## Post-Stable Roadmap (v0.2.0 targets)

- Fix `CS.HARDCODED-FONT` false positive for CSS keywords (`inherit`, `unset`, `revert`)
- Add dark-surface semantic tokens to DS
- Tailwind-to-DS token bridge strategy
- Consumer-sync CI gate (fail on BLOCKER/HIGH active findings)
- Consumer-sync autofix mode (opt-in)
