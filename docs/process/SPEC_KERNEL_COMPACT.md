# Spec Kernel Compact

Status: active
Owner: miguelmyers
Last updated: 2026-07-08
Language: English

## 1) Purpose

This kernel defines the minimum operational contract for AI work in this repository.
It exists to reduce protocol violations, increase first-pass acceptance, and improve cycle time without sacrificing quality.

This is not a full handbook. It is the strict executable layer.

## 2) Scope

In-scope by default:
- Active governance documents
- Active protocols
- Active atomic specs

Out-of-scope by default:
- Archived audits
- Historical sync cycles
- Historical deploy archives
- Per-component historical evidence logs

Historical docs may be loaded only on demand for investigations.

## 3) Authority Order

When sources disagree, apply this precedence exactly:
1. AGENTS.md
2. Active atomic spec for the component
3. Current source code
4. Historical docs

No case-by-case override is allowed at runtime.
If a conflict remains unresolved after applying the order, stop and request owner guidance.

## 4) Three-Layer Method

### Layer A: Spec
Define the real objective before execution.
Break work into small units.
Define explicit acceptance criteria.

### Layer B: Verifier
Validate output against binary criteria.
Use independent critique when possible.
Require external signals when available (tests, lint, evidence, Figma data).

### Layer C: Environment
Persist rules, constraints, and working memory.
Reuse templates and checklists.
Avoid restarting from zero context each session.

## 5) Non-Negotiable Operating Rules

1. Never execute a medium or large task without a Task Brief.
2. Never mark done without verifier output.
3. Never treat narrative claims as proof.
4. Never bypass Golden Rules.
5. Never treat historical docs as equal to active governance.

## 6) Required Human Approval Gates

Always ask before:
- Changing Golden Rules
- Changing public API contracts
- Approving exceptions to Figma source of truth
- Changing global tokens
- Changing sync/evidence/deploy protocol behavior

## 7) Strictness Policy

Strict from day one.
A failed mandatory criterion is a stop, not a warning.

## 8) Mandatory Inputs Before Work

For each task, the agent must have:
- Objective
- Scope
- Acceptance criteria
- Risks and forbidden actions
- Required evidence

Use: docs/process/TASK_BRIEF_TEMPLATE.md

## 9) Mandatory Verification Before Done

For each task, verification must include:
- Criteria-by-criteria pass or fail
- Evidence artifacts or command outputs
- Residual risk statement

Use: docs/process/VERIFIER_CHECKLIST.md

## 10) Default Context Load (Minimal)

Load by default:
- AGENTS.md
- CLAUDE.md
- sync/PROTOCOL.md
- sync/ROLES.md
- sync/STOP_CONDITIONS.md
- docs/atomic/PROTOCOL.md
- docs/atomic/_TEMPLATE.spec.md
- docs/DECISION_LOG.md active section only

Load on demand:
- docs/audits/**
- docs/evidence/**
- docs/deploy/** (generic lifecycle guidance; per-project deploy records live in each consumer's workspace docs)
- sync/history/**

## 11) Success Metrics

Track weekly:
1. Protocol violations per cycle
2. First-pass acceptance rate
3. End-to-end cycle time

Targets:
- Violations: decreasing trend
- First-pass acceptance: increasing trend
- Cycle time: decreasing trend without quality regressions

## 12) Adoption Rule

If this kernel conflicts with older process wording, this kernel applies until the older doc is reconciled.

## 13) Execution Contract

The agent should behave as follows:
- Always: plan briefly, execute in small increments, verify explicitly
- Ask-first: all approval-gated actions in section 6
- Never: skip verification, invent authority, override precedence

## 14) Versioning

This kernel may be updated only when:
- A recurring failure pattern is observed, and
- The change is written as a binary and testable rule.
