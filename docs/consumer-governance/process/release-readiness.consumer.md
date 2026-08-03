<!-- Generated from @miguel/design-system consumer governance kit. Do not edit directly. -->
<!-- governance-kit-version: {{kitVersion}} -->
<!-- governance-kit-hash: {{kitHash}} -->
<!-- generated-at: {{generatedAt}} -->

# Release Readiness Checklist — Design System Consumer

Run this checklist before a consumer release or any release-related tag.

## Pre-Release Gates

- [ ] `git status --short` is clean or only contains expected release artifacts.
- [ ] Current branch is correct for the release.
- [ ] Local override file reviewed:
  `docs/process/local-governance-overrides.md`.
- [ ] Consumer install uses the intended `@miguel/design-system` version/range.
- [ ] Typecheck passes using the consumer's local command.
- [ ] Build passes using the consumer's local command.
- [ ] Tests pass using the consumer's local command.
- [ ] Visual or component behavior changes have screenshots or equivalent visual
  evidence.
- [ ] Accessibility impact is reviewed for changed flows or components.
- [ ] No design-system internals were modified from the consumer repo.
- [ ] No unrelated branch changes are included in the release scope.
- [ ] Release notes state design-system changes and consumer impact accurately.
- [ ] User approves exact tag, push, publish, and release commands before they run.

## Baselines

Do not update visual baselines without screenshot review and explicit approval.
Build or TypeScript success is not visual approval.

## Stop Conditions

Stop and ask for a decision if:

- active release-scope findings remain unresolved or undeferred
- branch contains unrelated changes
- consumer working tree is unexpectedly dirty
- generated governance docs are outdated and release behavior depends on them
- a command failure is not clearly transient or an expected no-op
