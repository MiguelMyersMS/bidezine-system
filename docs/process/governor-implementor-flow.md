# Governor-Implementor Flow

## Purpose
Define one stable, restart-safe communication flow between:
- Governor (review authority)
- Implementor (execution authority)

This file is the canonical contract for user prompts, expected outputs, and handoff sequence.

## Transport Mode (Canonical)

1. Default transport is sync-file mode using `sync/HANDOFF.md` and `sync/REVIEW.md`.
2. Direct-in-audit mode is allowed only when explicitly requested by the user for a specific cycle.
3. For sync-file mode, follow `sync/PROTOCOL.md` for cycle formatting and switch prompts.
4. When both modes appear in active docs, sync-file mode takes precedence unless the user says otherwise.

## Single Trigger (User -> Governor)

Copy/paste this exact message:

```text
Act as a Governor. Please review and decide on [audit-file]. Add your decision, required conditions, and implementation instructions directly in that file.
```

Role-prefix rule:
- All handoff triggers must begin with `Act as a [Role].`

## Matching Trigger (User -> Implementor)

Copy/paste this exact message:

```text
Act as an Implementor. Governor has completed review in [audit-file]. Execute only the approved scope and required conditions documented in that file.
```

## Governor Output Contract

Governor must append this section inside the reviewed audit file:

```text
## Governor Review (YYYY-MM-DD)

Decision: APPROVE | APPROVE WITH CONDITIONS | REJECT

Required conditions for implementor:
1. ...
2. ...

Implementation instructions:
1. ...
2. ...

Evidence required after implementation:
1. Changed files list
2. Validation command results
3. Residual risks

Governor sign-off:
- Reviewer:
- Date:
```

## Implementor Start Condition

Implementor starts only when both are true:
1. A governor review section exists in the target audit file.
2. Decision is `APPROVE` or `APPROVE WITH CONDITIONS`.

If decision is `REJECT`, implementor does not execute changes.

Idempotency rule:
1. If multiple governor review sections exist, the current decision is the latest dated governor review section.
2. If dates are equal or ambiguous, stop and ask the user which review section is authoritative.

Duplicate-review rule:
1. Do not append a second governor review for the same request unless explicitly asked.
2. Any additional review must be labeled as a superseding review and must state what changed.

## Implementor Execution Contract

Implementor must execute only the approved scope and then report:
1. Files changed
2. Validation run and outcomes
3. Any unmet condition and why
4. Residual risks
5. Retention/Deletion Actions:
	- Retain
	- Archive
	- Delete
	- Approval needed: yes/no

## Restart-Safe Checklist (new session or reopened workspace)

At session start, any agent must:
1. Read `AGENTS.md`.
2. Read this file.
3. Read the current audit file under review.
4. Detect whether a governor review section already exists.
5. If no governor review section exists, provide only the governor trigger message and stop execution planning.

Authoritative-source rule:
1. Authoritative restart sources are `AGENTS.md`, this file, and the target audit file.
2. Memory notes are supplemental only and must not override repository-documented process rules.

## Governor Handoff Rule

After appending a decision, governor must give the user a short copy/paste implementor trigger that points to the reviewed audit file.

Prompt formatting rule:
1. Any user-facing switch instruction must be in a fenced code block.
2. Do not provide switch instructions as plain prose or blockquotes.
3. If missing, the handoff/review is incomplete and must be corrected.

## Scope Rule

No implementation work may be performed before governor decision is documented in the audit file.

## Sync Handoff Rule

When using sync-file mode:
1. Implementor must end `sync/HANDOFF.md` with the exact switch prompt from `sync/PROTOCOL.md`.
2. Governor must end `sync/REVIEW.md` with the exact switch-back prompt from `sync/PROTOCOL.md`.
3. Both prompts must be rendered inside fenced code blocks for one-click copy/paste.
