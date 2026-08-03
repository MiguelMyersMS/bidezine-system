<!-- Generated from @miguel/design-system consumer governance kit. Do not edit directly. -->
<!-- governance-kit-version: {{kitVersion}} -->
<!-- governance-kit-hash: {{kitHash}} -->
<!-- generated-at: {{generatedAt}} -->

# {{consumerName}} — Design System Consumer Agent Instructions

This project consumes `@miguel/design-system`. The design-system governance kit
defines shared operating rules for local agents working in this consumer repo.

## Canonical References

- Design-system package: `@miguel/design-system`
- Governance source: `docs/consumer-governance/` in the design-system repo
- Consumer local overrides: `docs/process/local-governance-overrides.md`

## Local Responsibility

Keep local context in the override file, including:

- app owner and release owner
- local development, test, build, and deploy commands
- golden references or screenshots for visual review
- consumer-specific branch, PR, or deployment constraints
- accepted deviations from design-system defaults

Do not edit generated governance files directly. Update the design-system kit or
the local override file instead.

## Non-Negotiable Rules

1. Do not tag, push tags, publish packages, update visual baselines, or declare a
   component stable without explicit user approval.
2. Do not treat TypeScript/build success as visual approval.
3. For visual or component behavior changes, require screenshots or equivalent
   visual evidence before acceptance.
4. If a finding affects the active release scope, pause tagging until resolved or
   explicitly deferred.
5. If this branch contains unrelated changes, stop and recommend branch cleanup
   before push or PR.
6. Do not modify design-system internals from the consumer repo.

## Operating Modes

Use the generated process docs in `docs/process/`:

- `design-system-governor.md`
- `release-readiness-checklist.md`
- `external-review-report-template.md`
- `next-step-decision.md`

Local overrides supplement these files but do not replace design-system release
and visual-governance rules.
