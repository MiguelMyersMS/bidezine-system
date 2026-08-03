# bidezine-system — Setup Manifest

**Created:** 2026-08-02 by Blair on Laptop B, per Miguel's direction. Transparent record of what was
brought over from `../design-system` when scaffolding this v2 repo — so anyone can see exactly what was
copied, adapted, skipped, or referenced-in-place, and adjust it.

## ✅ Copied as-is (foundation-agnostic machinery)

- `.claude/settings.json` — the three git-sync hooks (SessionStart pull, 45-min checkpoint, Stop unpushed-check).
- `.claude/agents/design-system-auditor.md` — Figma-parity auditor.
- `.claude/skills/` — **all skills except `consumer-sync`** (deferred — no consumers yet). Present:
  a11y-audit, code-cleanup, create-wave, deploy-wave, deployment-verify, evidence-pipeline, evidence-wave,
  example-wave, figma-author-screen, figma-build, figma-deploy, figma-reconcile-design-system, figma-use,
  icon-audit, registry-refresh, session-start, smell, token-audit, weekly-cleanup.
- `.mcp.json` — Figma MCP registration.
- `.gitattributes`.
- `.github/copilot-instructions.md`, `.github/prompts/*` (except `consumer-sync.prompt.md`), `.github/CODEOWNERS`.
- `docs/process/*` (16 files) — method, spec kernel, verifier checklist, governance, two-laptop docs, playbooks.
- `docs/decisions/` — ADR-001 (DTCG tokens), ADR-002 (Storybook), ADR-005 (behavioural verification),
  ADR-006 (founding), README.
- `docs/consumer-governance/` — deploy-phase communication protocol.
- `docs/atomic/_TEMPLATE.spec.md` — the spec template only (not instance specs).

## ✏️ Copied but MUST be adapted (legacy architecture; ADR-006 reverses parts)

- `CLAUDE.md` — **rewritten fresh** for the v2 foundation (build step, Tailwind/CVA, CSS-var tokens, dual
  source of truth). The legacy version is NOT used.
- `AGENTS.md`, `.github/copilot-instructions.md` — carry a v2 banner pointing to `CLAUDE.md` + ADR-006;
  full reconciliation of architecture-specific rules (GR4 → dual truth, build step) is a follow-up.
- Skills tied to legacy architecture — adapt when reached: `token-audit` (references legacy tokens.ts),
  `icon-audit` (legacy Fluent-only rule; shadcn defaults to Lucide — icon decision pending),
  `registry-refresh` (legacy source), `smell` (legacy catalog IDs).

## 🆕 Created fresh

- `reference/shadcn-ui/` — the ENTIRE shadcn repo, vendored read-only (nested `.git` stripped).
- `THIRD-PARTY-LICENSES.md` — MIT attribution (shadcn + Radix). `reference/shadcn-ui/LICENSE.md` preserved.
- `.gitignore` (adapted), `README.md`, `.env.example`, `.env.copilot.example`, this manifest.

## 🚫 Deliberately NOT copied

- **Secrets:** `.env`, `.env.copilot` — recreate locally per machine from the `.example` templates.
- **Old source & configs:** `src/`, `tsconfig.json`, `vite.umd.config.ts`, `sb-shot*.mjs`,
  `package.json`/`package-lock.json`, `CHANGELOG.md` — v2 gets its own new-foundation configs.
- **CI:** `.github/workflows/*` — tied to the legacy build/tests; deferred until v2 has its own build.
- **Instance data:** `docs/atomic/*` (specs), `docs/audits`, `docs/evidence`, `docs/migrations`,
  `docs/qa`, `docs/registry`, `docs/_archive`, and the legacy-instance plans
  (`ORGANISM-FINALIZATION-PLAN`, `PRIMITIVES-MIGRATION-PLAN`, `PRIMITIVES-REPLACE-LIST`) —
  regenerated fresh here as we build; the originals stay readable in `../design-system`.
- `docs/decisions/ADR-003`, `ADR-004`, `phase3-boundary-drafts` — legacy-instance-specific.
- `.claude/commands/cloudflare-brief.md` — legacy DS hosting.

## 🔗 Referenced in place (sibling, never edited from here)

- `../design-system` — legacy specs, registry, patterns, and Figma files, read for reference/harvest.

## Addendum — second pass (exhaustive audit, 2026-08-02)

A full repo sweep found process infrastructure the first pass missed. Added:

- **`scripts/` (65 files, wholesale)** — the engine the skills/waves actually invoke (`audit-*`,
  `evidence-*`, `workflows/*`, `lib/*`, `registry-refresh`, `session-brief`, `git-stages`, `run-audits`,
  etc.). **Tied to the legacy architecture — adapt as each skill is activated.** They also need to be
  re-wired as npm scripts in v2's future `package.json` (the legacy `package.json` was intentionally not copied).
- **`.githooks/`** — `pre-commit`, `pre-push`. ⚠️ **Do NOT install yet** — they run legacy audits against
  the old source and would block commits/pushes until adapted to the v2 build. Inert unless installed.
- **`docs/process/TEAM-SYNC-DISCIPLINE.md`** — NEW canonical daily-sync guide; wired into all three
  `.claude/settings.json` hook messages (session start / ~45 min / end).
- **docs-root method/process docs:** `FACTORY_LINE.md` (read by /session-start), `GIT_WORKFLOW.md`,
  `Ambiguity-in-protocols.md`, `CLOUD_WAVES.md`, `PARALLELISM-AND-UNATTENDED-RUNS.md`,
  `STABLE_READINESS.md`, `interaction-patterns.md`, `icon-protocol.md` (adapt — icon decision pending),
  `FIGMA_MAKE_REFERENCE.md`, `THEME_AND_SURFACES.md`, `THEME_AND_ATOM_SURFACES.md`,
  `DECISION_LOG.md` + `FOLLOWUPS.md` (**RESET to fresh bidezine versions 2026-08-02** — legacy entries
  removed; they were pure design-system history that would have misled `/session-start`).
- **docs/atomic protocols + templates:** `PROTOCOL.md`, `DEPLOYMENT_VERIFICATION_PROTOCOL.md`,
  `TOKEN_CHANGE_PROPAGATION_PROTOCOL.md`, `_TEMPLATE.lean.spec.md`, `animations/_TEMPLATE.anim.spec.md`.
- **More templates/guides:** `docs/deploy/_TEMPLATE.deploy.md`, `docs/examples/_TEMPLATE.md`,
  `docs/evidence/GUIDE.md` + `README.md`, `docs/followups/MOLECULE-FEEDBACK-CHECKLIST.md`,
  `tasks/TASK_TEMPLATE.md`.
- **`sync/` multi-agent SYSTEM files** (`PROTOCOL`, `ROLES`, `STOP_CONDITIONS`, `README`, `INSTALL`,
  `HANDOFF`, `REVIEW`) — the governor/implementor ledger templates. Instance ledgers (RAILNAV, SELECT) and
  `sync/history/` were left as reference.

Still deliberately excluded (reference in `../design-system`): `src/`, `app/` (demo), `dist-browser`,
`.storybook`, `tests/`, `docs/evidence/*` (1,639 instance captures), `docs/atomic/*` instance specs,
`docs/audits/*`, `docs/registry/*`, `docs/migrations|proposals|qa|patterns|infra|_archive`,
`prompts/consumer-build/*`, `docs/actionmenu-figma-spec.md`, `docs/ROADMAP.md`, `CHANGELOG.md`.
