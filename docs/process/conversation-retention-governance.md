# Conversation Retention Governance

## Purpose
Define a practical retention/deletion process for repo-visible artifacts and agent-accessible memory/workspace data used during implementation/governor workflows.

## Scope Boundary

This governance process covers only:
1. Repo-visible files.
2. Agent-accessible workspace artifacts and memory scopes.

This governance process does not control:
1. Platform backend conversation retention.
2. Product-level history retention.
3. Organization legal/compliance retention policy.

## Data Classes and Default Disposition

1. User memory (`/memories/`)
   - Purpose: long-term preferences and standing rules.
   - Default: retain while valid.

2. Session memory (`/memories/session/`)
   - Purpose: temporary session context.
   - Default: temporary; clear at conversation close.

3. Repo memory (`/memories/repo/`)
   - Purpose: repository conventions and durable implementation practices.
   - Default: retain while valid; revise/remove when obsolete.

4. Audit/process records (`docs/audits/`, `docs/process/`)
   - Purpose: governance evidence and process history.
   - Default: retain.
   - Exception: only delete/archive when explicitly marked draft/superseded/single-use and user approves.

5. Handoff/scratch artifacts (`sync/`, task scratch files)
   - Purpose: operational coordination or temporary work products.
   - Default: classify per deletion levels below.

## Deletion Levels

1. `retain`
   - Use for canonical decisions, audit evidence, release records, and active handoff files.

2. `archive`
   - Use for superseded but potentially useful governance records.

3. `delete`
   - Use for clearly disposable scratch artifacts.

## Safety Rules

1. Do not delete files or memory entries without explicit user approval, unless the artifacts are clearly generated scratch files created in the same task and already agreed as disposable.
2. On session restart, do not infer cleanup state from memory alone; inspect repo-visible files and active audit/process docs first.
3. Retained notes must summarize decisions/evidence and avoid unnecessary personal, credential, customer, or private operational detail.

## Lifecycle Actions

1. Conversation start:
   - Read `AGENTS.md`, active process docs, and active audit file.
   - Identify current retention state from repo-visible records.

2. After governor decision:
   - Implement only approved scope.
   - Record evidence and retention/deletion actions in completion report.

3. Task completion:
   - Classify generated artifacts as retain/archive/delete.
   - Request user approval when required.

## Required Reporting

For non-trivial work, completion/handoff reports must include:
1. `Retain:`
2. `Archive:`
3. `Delete:`
4. `Approval needed: yes/no`
