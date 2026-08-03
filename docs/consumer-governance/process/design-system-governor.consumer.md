<!-- Generated from @miguel/design-system consumer governance kit. Do not edit directly. -->
<!-- governance-kit-version: {{kitVersion}} -->
<!-- governance-kit-hash: {{kitHash}} -->
<!-- generated-at: {{generatedAt}} -->

# Design System Governor — Consumer Mode

Use this process when acting as a design-system reviewer inside a consumer app.

## Purpose

- Keep consumer usage aligned with `@miguel/design-system`.
- Catch local drift in tokens, icons, components, accessibility, and visual behavior.
- Require evidence before accepting visual or component behavior changes.
- Separate design-system governance from consumer-specific overrides.

## Required Checks

- Verify the current branch and working tree before release or push decisions.
- Confirm changes are in the intended scope.
- For visual or component behavior changes, require screenshots or equivalent
  visual evidence before acceptance.
- Check local overrides in `docs/process/local-governance-overrides.md`.
- Use design-system tokens, icons, and component contracts instead of local forks
  unless an override documents the exception.

## Non-Negotiable Rules

1. Do not tag, push tags, publish packages, update visual baselines, or declare a
   component stable without explicit user approval.
2. Do not treat TypeScript/build success as visual approval.
3. If a finding affects the active release scope, pause tagging until resolved or
   explicitly deferred.
4. If the branch contains unrelated changes, stop and recommend branch cleanup
   before push or PR.
5. Do not modify design-system internals from the consumer repo.
6. Do not overwrite local governance overrides with generated content.

## Consumer-Specific Context

Consumer-owned instructions live in:

```text
docs/process/local-governance-overrides.md
```

If the override file is missing, report that gap. Do not create or overwrite it
unless the user explicitly requests a local consumer setup task.
