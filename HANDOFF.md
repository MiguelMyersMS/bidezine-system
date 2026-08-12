# Handoff — current state only

> **This file is a live snapshot, not a log.** It is overwritten in place, never appended to. If you are
> an AI picking up work in a new/replacement chat, read this file first, then verify every claim in it
> against the real repo state (git log, git status, live code) before acting — never trust this file (or
> any prior chat transcript) blindly. See `CLAUDE.md`'s "Handoff protocol" section for the full rules
> this file follows.

> **One section per machine — only ever edit YOUR OWN.** Laptop A, Laptop B and the PC each own exactly
> one section below. Never edit, summarise, tidy or "fix" another machine's section, even when it looks
> stale — you cannot verify another machine's working tree from here, and overwriting it destroys the
> only record that machine has. If you need something from another machine, message its operator. Read
> every section (they tell you what the others are touching, so you can stay out of the same files), but
> write to one.
>
> **Keep the `---` dividers.** They are not decoration: they hold each machine's block far enough apart
> in the file that git merges concurrent edits automatically instead of raising a conflict on the one
> file every session is required to touch.

---

## Laptop A — Miguel  ·  PRIMARY

**Baseline** — branch `main`, last verified commit `9ea37de` plus this session's commit adding
`docs/SANDBOX-SPEC.md`, working tree clean once that commit lands, pushed to `origin/main`.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`). A formal
primary/satellite rename of all three machines is deliberately deferred to Sandbox Milestone 8 —
see `docs/SANDBOX-SPEC.md` §8. Renaming earlier would break Laptop B's local, gitignored `.env`,
which cannot be fixed from here.

### Active task

_None. Sandbox Milestones 1, 2 and 3 are complete and verified against the real database._

### What's done (current state — not a history)

Read `docs/SANDBOX-SPEC.md` before touching `db/`, `verifier/` or `mcp/`. It is the single
source of truth for this project.

- **M1 — the store and the gate.** Fabric SQL Database in the **biDezine** tenant (Microsoft's
  corporate tenant was deliberately abandoned: it requires a Service Tree ID for app registration,
  and bidezine's own store should not sit where access is tied to employment). Workspace
  `bidezine-sandbox`, one SQL database, no other Fabric items. Migrations 001–005 applied; four
  Entra service principals mapped to three roles by `db/bootstrap/`.
- **M2 — the verifier.** `verifier/` drives a real browser against a real render, measures, and
  writes evidence under the `runner_evidence` credential. Check specs are JSON files under
  `verifier/checks/`, committed to git on purpose: a weak spec is a real risk and the defence is
  that it shows up in a diff.
- **M3 — the MCP server.** `mcp/server.mjs`, standard stdio, registered for **both** Claude Code
  (`.mcp.json`) and Copilot (`.vscode/mcp.json`) — one server, both clients, neither able to
  sidestep what the other cannot. Ten tools; `sandbox_decisions` is the retrieval loop that
  replaces reading `CLAUDE.md` in full. `.github/copilot-instructions.md` carries the same protocol
  summary Claude gets from `CLAUDE.md`. Skills under `.claude/` are Claude-only and do NOT transfer
  — anything that must apply to both belongs in the MCP server or those two instruction files.

**Three proof scripts. Re-run ALL THREE after any change under `db/`, `verifier/` or `mcp/`:**

```
npm --prefix db run verify        # 15/15 — the gate and its permissions
npm --prefix verifier run verify  # 12/12 — the runner is worth trusting
npm --prefix mcp run verify       # 14/14 — the agent surface, over the real protocol
```

They connect as the real principals and watch things fail, rather than reading permissions and
reasoning about them. Between them: an agent cannot insert evidence, set state, or approve; a
reviewer cannot review its own build; a passing review citing failing evidence is refuted by its own
citation; the gate refuses and relents only as each requirement is genuinely met; reopening writes a
false_completion row; and the runner fails correctly on a wrong expectation, a missing anchor, an
ambiguous anchor, and a check that asserts nothing.

**Four things found by running rather than reading, each now guarded:**

- **`EXECUTE AS` is unsupported on Fabric.** Procedures create without complaint and fail at call
  time. The gate uses ownership chaining instead — which needs one schema owner and **no dynamic
  SQL anywhere in a gate procedure**. Adding `EXEC`/`sp_executesql` to one would silently break it.
- **Fabric's item RBAC gates connection only.** It maps into no SQL role and cannot override a SQL
  DENY. Verified against `sys.database_permissions`: app/agent/runner hold exactly `CONNECT`.
- **A screenshot asserted nothing but satisfied the gate.** Migration 005 now requires evidence of a
  kind that can fail on its own terms. Screenshots are still captured as supporting material.
- **`evidence_id` is a BIGINT the driver returns as a STRING.** The MCP server emitted string ids
  and then rejected those same ids when cited back, so no review could ever have cited evidence read
  through it. `sandbox_submit_review` now accepts both forms.

Also: `SUSER_SNAME()` on Fabric returns `<clientId>@<tenantId>`, not a display name — compare
against client IDs when checking provenance. Secrets and connection details are in the local,
**gitignored** `.env`; every machine fills in its own from `.env.example`. Installing Playwright
here needs `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` — corporate filtering blocks the browser CDN, though
the npm registry itself is reachable and Chromium is already present at the repo root.

- **Rail Sidebar / `limbo-factory/` deliberately untouched, and must stay that way until M5.** Per
  the spec's sequencing constraint it remains running and authoritative through M1–M4. Do not begin
  the Limbo → Sandbox rename before then.

### What's next

**Sandbox Milestone 4 — Rail Sidebar as the first occupant** (`SANDBOX-SPEC.md` §6). Import the
existing divergence rows from `limbo-factory/src/data/rail-sidebar.ts` into the database at
`legacy_unverified` — a state deliberately BEFORE `verified`, so migrated reasoning is retained for
retrieval without anything arriving pre-blessed. Enrich what the current shape lacks (category on the
row, owner, tier, scope, anchor id, evidence links, commit pins) and finalise the category enum
against real data. Done when every existing row is represented with no field lost; the migration is
the schema's proof. Reading that file is fine — the freeze is on modifying it.

Still genuinely open on Rail Sidebar, unrelated to the Sandbox build and not queued: divergence
categories I (elevation) and J (z-index); and four risk items honestly unfinished rather than
fabricated as done — R-3c/R-11c (no dedicated Independent Audit agent has run against the whole
component, only scoped diffs), R-5b (Sidebar/Rail Sidebar token-collision check, correctly deferred
to Promote time), and R-9b (Escalation-agent verification of Collapse's deterministic unmount).

### Open questions / blockers

_None._

---

## Laptop B — Blair

**Baseline** — branch `main`, last verified commit `a984c7b`, working tree clean and pushed to `origin/main`.

### Active task

_None. Nothing in progress._

### What's done (current state — not a history)

- **A-6 clear (X) button** shipped in two places: `CommandInput` (`src/ui/command.tsx`) gains a trailing
  clear button (reserved 24×24 `icon-xs` slot, hidden via `aria-hidden`/`tabIndex={-1}`/`invisible` so
  there's no layout shift, clears via the native `<input>` value setter + dispatched `input` event, `Escape`
  clears first and `stopPropagation()`s so it doesn't bubble into a parent `CommandDialog`); and a new
  general-purpose `SearchInput` primitive (`src/ui/search-input.tsx`, exported from `src/index.ts`, built
  from `InputGroup`/`InputGroupAddon`/`InputGroupInput`/`InputGroupButton`, showcased at
  `site/src/routes/components/SearchInputShowcase.tsx`). `SearchInput`'s `className` prop sizes the outer
  `InputGroup` (the actual visible box); `inputClassName` targets the inner `<input>` only. Verified:
  root+`site/` typecheck/build clean, hover→filled icon swap confirmed live via Playwright against both dev
  server and a real production/minified `vite preview` build, disabled-state propagation confirmed live.
- **Rail Sidebar Limbo transformation (`limbo-factory/`) — category F ("Layout / Sizing") fully closed.**
  All 11 rows (F-1 through F-11) are `status: "resolved"`, the first category in the divergence list to
  reach a full, uniform resolved state. Key resolutions: F-3 (`panelW` default 256px/min 240px,
  cross-checked against `min-w-60`), F-4 (`panelGap` 8px, cross-checked against `SidebarInset`'s own
  `m-2`), F-5/F-6 (unified ALL nav row heights — rail buttons, panel-tree rows/groups at every nesting
  depth, footer icons — to a single `h-8`/32px, eliminating three previously-separate row-height numbers so
  the rail and panel read as one consistent system regardless of depth), F-7 (footer 3-icon cap: the
  `122px` `FOOTER_MAX_HEIGHT` was genuinely NOT wired into code before this work — now implemented via
  `overflow-hidden` + inline `maxHeight` on the footer's flex column, derived from bidezine's own real
  `size-[38px]` rail buttons + `gap-1` spacing, not copied from origin's literal), F-8/F-9/F-11 (panel
  min-width, derived item-slot sizing, footer bottom-anchoring — all confirmed live in code, no changes
  needed), F-10 (rail must fill its container's height — a documentation-only deployment note confirming
  the real Build should use `h-full`/CSS sizing rather than the preview-tool-specific measured-height prop
  `limbo-factory`'s own `App.tsx`/`FillHeight` uses; no code change needed in `limbo-factory` itself). Full
  rationale for every row: `limbo-factory/src/data/rail-sidebar.ts` (rows F-1–F-11) and
  `LIMBO-PROTOCOL-LOG.md` (Updates 12–18, append-only). `CLAUDE.md`'s Primitive Fidelity Checklist item 26
  gained a fourth verification axis: an approved divergence-row CONCEPT is not the same as it being wired
  into real code — always re-check the live component source when a row moves to `"resolved"` (this caught
  F-7's implementation gap). Remaining open categories in the Rail Sidebar divergence list: H (motion), I
  (elevation), J (z-index), L (component gaps, 1 open item), M (naming/API conflicts) — 12 rows total, none
  touched this baseline.
- **Machine-identity protocol added**: `.env.example` now documents `MACHINE_NAME`/`MACHINE_OWNER`; the
  `SessionStart` hook in `.claude/settings.json` prints this machine's `HANDOFF.md` identity automatically;
  `CLAUDE.md`'s Recovery workflow gained a step 0 covering it. This machine's `.env` is set to
  `MACHINE_NAME=Laptop B` / `MACHINE_OWNER=Blair`.

### What's next

_Nothing queued. Awaiting new instructions._

### Open questions / blockers

_None._

---

## PC — third machine

_Not connected yet. Leave this section as-is until the machine is set up._

Setup notes for whoever brings it online:

- Cloning the repo brings the shared machinery with it — `.claude/settings.json` (the start-of-day,
  checkpoint and end-of-day hooks), skills, agents and commands all travel through git.
- Two things do **not** travel and must be done by hand on that machine:
  1. **`.env`** — copy `.env.example` to `.env` and fill it in. Generate a **new** Cloudflare API token
     for this machine at `dash.cloudflare.com/profile/api-tokens` rather than copying an existing one, so
     it can be revoked alone and the audit log stays per-machine. `CLOUDFLARE_ACCOUNT_ID` is not a secret.
     `FIGMA_API_KEY` is a personal token — each person generates their own.
  2. **VS Code `git.autofetch`** — set it to `true` (Settings → search `git.autofetch`). Without it the
     status bar never shows the ↓ arrow when another machine has pushed.
