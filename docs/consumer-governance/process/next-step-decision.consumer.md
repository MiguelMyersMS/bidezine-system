<!-- Generated from @miguel/design-system consumer governance kit. Do not edit directly. -->
<!-- governance-kit-version: {{kitVersion}} -->
<!-- governance-kit-hash: {{kitHash}} -->
<!-- generated-at: {{generatedAt}} -->

# Next-Step Decision Mode — Design System Consumer

Use this mode after a handoff report, failed gate, visual finding, completed task,
branch mismatch, release checkpoint, or post-release cleanup.

## Decision Flow

1. First classify the current phase:
   - planning
   - implementation
   - DQA visual review
   - release readiness
   - post-release cleanup
   - component standardization
2. Then classify the repo state:
   - clean
   - dirty expected
   - dirty unexpected
   - branch mismatch
   - release candidate
   - tagged
   - pushed
   - blocked
3. Then choose exactly one recommended next action:
   - continue implementation
   - pause and verify
   - fix narrow issue
   - commit
   - push branch
   - open PR
   - prepare release notes
   - request tag approval
   - stop work
   - ask user for decision

## Required Rules

- If there is any visual or component behavior change, require visual evidence
  before acceptance.
- If the issue affects the active release scope, pause tagging until resolved or
  explicitly deferred.
- If a branch contains unrelated changes, stop and recommend branch cleanup
  before push or PR.
- If a command fails, classify it as blocker, transient, environment/setup issue,
  or expected no-op.
- Never tag, push tags, publish packages, update visual baselines, or declare a
  component stable without explicit user approval.

## Required Ending

Always end with:

- Decision
- Reason
- Next command or prompt to approve
- Approval needed: yes/no
