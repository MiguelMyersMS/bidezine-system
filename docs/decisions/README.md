# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the design system.
ADRs capture important decisions, their context, and consequences.

> **Note:** The founding decisions (token system, icon system, typography, radius, fonts)
> are codified in `AGENTS.md` "Hard Rules" as enforced rules rather than ADRs. ADRs here
> capture the architectural choices made during the project's evolution that needed
> explicit reasoning records.

## Format

Each ADR follows this template:

```markdown
# ADR-{NNN}: {Title}

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | deprecated | superseded by ADR-{NNN}

## Context
{What is the issue we're deciding on?}

## Decision
{What did we decide?}

## Consequences
{What are the positive and negative effects?}
```

## Index

| ADR | File | Title | Status | Date |
|-----|------|-------|--------|------|
| 001 | `001-dtcg-token-format.md` | DTCG Token Format as registry standard | accepted | 2025-01-01 |
| 002 | `002-storybook-10.md` | Storybook 10 upgrade | accepted | 2025-01-01 |
| 003 | `ADR-003-railnav-panel-density.md` | RailNav Panel Density and Item Contrast | accepted | 2026-05-24 |
| 004 | `ADR-004-scroll-overlay-automation-backlog.md` | Scroll & Overlay Audit Automation Backlog | backlog | 2026-05-24 |

> **See also:** `docs/DECISION_LOG.md` for in-cycle decisions and pending items that
> don't rise to ADR level but need a durable rationale record.
