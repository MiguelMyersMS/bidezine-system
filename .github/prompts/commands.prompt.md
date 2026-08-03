---
description: "Lists all available slash commands, skills, and roles for @miguel/design-system. Read this to know what you can invoke."
---

# Available Commands — @miguel/design-system

> Quick reference for all `/commands` available in this project.
> All command files live in `.github/prompts/<command>.prompt.md` — the filename = the command.
> To pick up session context, always start with: **`sync/HANDOFF.md`** then **`docs/DECISION_LOG.md`**.

---

## Session Commands

| Command | Prompt file | What it does |
|---|---|---|
| `/sync-step` | `sync-step.prompt.md` | Run one step of the Implementor↔Governor loop. Auto-detects role from `sync/HANDOFF.md` + `sync/REVIEW.md`. Say "loop" to drive continuously (max 10 steps). |
| `/weekly-cleanup` | `weekly-cleanup.prompt.md` | Friday hygiene protocol: health gate + decision log review + audit lifecycle check + waiver expiry + sync state. Produces a Weekly Hygiene Report. |

---

## Figma Pipeline Commands

| Command | Prompt file | What it does |
|---|---|---|
| `/figma-build <slug>` | `figma-build.prompt.md` | CREATE a component: extract the Figma node into a schema-complete spec (`docs/atomic/<level>/<el>.spec.md`, `npm run audit:specs`) **then** implement `<El>.tsx` + `<El>.stories.tsx` + icons → health |
| `/evidence-pipeline <slug>` | `evidence-pipeline.prompt.md` | VERIFY ONE component: capture → 3 independent reviews → adjudicate → fix-loop → record → sign → Evidence Gate (`PASS — 0 findings`); produces a signed evidence bundle (`doer≠checker`) |
| `/evidence-wave <level or slugs>` | `evidence-wave.prompt.md` | VERIFY MANY: auto-discover slugs by atomic level (atoms/molecules/organisms/all) or an explicit list → run the per-component pipeline on each → governor-vetted self-refinement retrospective → push |

> The three above are **multi-agent Claude skills** — their prompt file mirrors the executable
> at `.claude/skills/<command>/SKILL.md` (kept byte-identical, like `/figma-deploy`).

**Pipeline order:** BUILD (`/figma-build`) → VERIFY (`/evidence-pipeline` one · `/evidence-wave` many) → Governor GATE (via `/sync-step`)
**Spec location:** `docs/atomic/<atom|molecule|organism>/<element>.spec.md`
**Protocol:** `docs/atomic/PROTOCOL.md`

---

## Audit Skills

| Command | Prompt file | What it audits | Catalog IDs |
|---|---|---|---|
| `/token-audit` | `token-audit.prompt.md` | DTCG compliance, light/dark parity, naming, consumer usage, typography | `TK.*` |
| `/icon-audit` | `icon-audit.prompt.md` | Fluent UI compliance, SVG structure, filled variants, exports, size tiers | `IC.*` |
| `/a11y-audit` | `a11y-audit.prompt.md` | WCAG 2.2 AA — contrast, keyboard, focus, target size, ARIA, motion | `A11.*` |
| `/code-cleanup` | `code-cleanup.prompt.md` | TypeScript strict, dead exports, layout rules, convention drift | `CP.*, LY.*` |
| `/smell` | `smell.prompt.md` | Git-diff pre-PR review against DS catalog IDs — run before committing | `TK.*, IC.*, CP.*, GR1.*, GR2.*` |

---

## Builder / Maintenance Skills

| Command | Prompt file | What it does |
|---|---|---|
| `/registry-refresh` | `registry-refresh.prompt.md` | Regenerate `docs/registry/*.json` from source code |
| `/consumer-sync` | `consumer-sync.prompt.md` | Check all consumers for design system violations |

---

## Roles (sync loop)

| Role | Prompt file | When it runs |
|---|---|---|
| **Governor** | `governor.prompt.md` | When `sync/HANDOFF.md` cycle > `sync/REVIEW.md` cycle — auto-detected by `/sync-step` |
| **Implementor** | _(defined in `sync/ROLES.md`)_ | When `sync/REVIEW.md` status = `APPROVED` — auto-detected by `/sync-step` |

---

## Key Reference Files

| File | Purpose |
|---|---|
| `sync/HANDOFF.md` | **Start here** — current cycle state, what was done, what's next |
| `docs/DECISION_LOG.md` | Active decisions + tiered pending items (T1/T2/T3) with cleanup conditions |
| `docs/ROADMAP.md` | 4-phase milestone map to first-class design system |
| `AGENTS.md` | Canonical rules — Golden Rules, Hard Rules, compliance checklist |
| `CHANGELOG.md` | Per-version changelog |
| `docs/audits/LIFECYCLE.md` | Retention rules for audit artifacts (used by `/weekly-cleanup`) |
| `docs/atomic/PROTOCOL.md` | Figma→Storybook pipeline protocol |
| `docs/DECISION_LOG.md` | All decisions + tiered pending items |
| `docs/decisions/` | Architecture Decision Records (ADRs) |

---

## Current Priority (T1 items)

From `docs/DECISION_LOG.md` as of 2026-06-08:

1. **P-001** — ActionMenu submenus: `/figma-build 162:2959` (Sort by) + `/figma-build 141:3145` (Presets)
2. **P-005** — RailNav Figma spec: `/figma-build <railnav-node>`
3. **P-002** — Button atom: `/figma-build <button-node>`
