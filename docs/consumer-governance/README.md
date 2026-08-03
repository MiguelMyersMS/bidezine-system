# Design System Consumer Governance Kit

Reusable governance templates for projects that consume `@miguel/design-system`.

Phase 1 is design-system-local only. It defines canonical templates and a sync
script, but does not modify any consumer repository unless apply mode is
explicitly approved and targeted.

## Ownership

The design-system owns the canonical files in this directory:

- `AGENTS.consumer.template.md`
- `process/design-system-governor.consumer.md`
- `process/release-readiness.consumer.md`
- `process/external-review-report-template.consumer.md`
- `process/next-step-decision.consumer.md`
- `manifests/consumer-governance-manifest.json`

Consumers own their local context and overrides. The sync script must never
overwrite `docs/process/local-governance-overrides.md`.

## Consumer Local Files

Each consumer should keep the smallest possible local layer:

- `AGENTS.md` — generated from the consumer template, plus links to local overrides
- `docs/process/design-system-governor.md` — generated consumer governor behavior
- `docs/process/release-readiness-checklist.md` — generated release checklist
- `docs/process/external-review-report-template.md` — generated handoff template
- `docs/process/next-step-decision.md` — generated next-step decision contract
- `docs/process/local-governance-overrides.md` — consumer-owned overrides, never generated

Generated files include a marker and kit metadata so drift can be audited safely.

## Commands

From the design-system repo:

```bash
npm run consumer:governance:audit
npm run consumer:governance:audit -- --consumer ../path-to-consumer
npm run consumer:governance:apply -- --consumer ../path-to-consumer
```

`--check` is the default and is read-only. `--apply` requires `--consumer`, refuses
dirty consumer working trees, reports exact files that would be written, and only
writes generated governance docs. It does not commit, push, tag, publish, update
visual baselines, or modify app/source/component code.

## Registration

Phase 1 does not introduce a broad consumer registry. Until a registry is
approved, pass a local path with `--consumer`. Existing consumer discovery in
`consumer:sync` remains separate and unchanged.

## Safety Rules

- Never overwrite files without the generated marker.
- Never overwrite `docs/process/local-governance-overrides.md`.
- Never run apply mode implicitly from `consumer:sync`.
- Treat governance sync as documentation drift detection, not release approval.
