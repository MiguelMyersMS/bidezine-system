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
