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

_None. Sandbox Milestones 1–4 are complete and verified against the real database._

### What's done (current state — not a history)

Read `docs/SANDBOX-SPEC.md` first. It is the single source of truth for this project.

- **M1 — store and gate.** Fabric SQL Database in the **biDezine** tenant, workspace
  `bidezine-sandbox`. Migrations 001–006; four Entra service principals mapped to three roles.
- **M2 — verifier.** `verifier/` drives a real browser, measures, and writes evidence under the
  `runner_evidence` credential. Check specs are JSON files under `verifier/checks/`, committed to
  git so a weak spec shows up in a diff.
- **M3 — MCP server.** `mcp/server.mjs`, registered for **both** Claude Code (`.mcp.json`) and
  Copilot (`.vscode/mcp.json`). `.github/copilot-instructions.md` carries the protocol for Copilot.
  Skills under `.claude/` are Claude-only and do NOT transfer.
- **M4 — Rail Sidebar imported.** All **154** divergence rows are in the corpus, at
  `legacy_unverified` — a state deliberately BEFORE `verified`. The source calls 152 of them
  resolved; the corpus does not, because none has been through the gate (it did not exist when they
  were written). Reasoning came across so retrieval has substance; nothing arrived pre-blessed.

**Four proof scripts. Re-run ALL of them after any change under `db/`, `verifier/` or `mcp/`:**

```
npm --prefix db run verify         # 15/15 — the gate and its permissions
npm --prefix verifier run verify   # 12/12 — the runner is worth trusting
npm --prefix mcp run verify        # 14/14 — the agent surface, over the real protocol
npm --prefix db run verify-import  #   8/8 — the corpus still matches the source
```

They connect as real principals and watch things fail rather than reading permissions and reasoning
about them. `verify-import` re-reads the TypeScript source and diffs field by field; it does not
trust the importer's own success message, since that is an assertion by the thing that did the work.

**Findings that only appeared by running things — each now guarded:**

- **`EXECUTE AS` is unsupported on Fabric.** Procedures create fine and fail at call time. The gate
  uses ownership chaining, which needs one schema owner and **no dynamic SQL in any gate procedure**.
- **Fabric's item RBAC gates connection only** — it maps into no SQL role and cannot override a DENY.
- **A screenshot asserted nothing but satisfied the gate.** Migration 005 requires evidence of a kind
  that can fail on its own terms.
- **`evidence_id` is a BIGINT the driver returns as a STRING** — the MCP server emitted string ids
  and rejected those same ids when cited back.
- **`open` is a T-SQL keyword** and broke `sandbox_components` until bracketed.
- **Retrieval returned too much to be useful.** Rationale on a real row runs to thousands of words;
  three hits for "scrollbar" cost more context than the `CLAUDE.md` section the tool exists to
  replace. `sandbox_decisions` is now a search INDEX returning excerpts — scan, then call
  `sandbox_divergence` for the one that matters.
- **Real data demanded two categories the enum lacked** (`radius`, `interaction-state`) and a home
  for `visual`. `origin_record` now stores each source object verbatim, so losslessness is
  structural rather than dependent on someone having mapped every field they noticed.

Also: `SUSER_SNAME()` returns `<clientId>@<tenantId>`, not a display name. Secrets live in the
local, **gitignored** `.env`. Playwright installs here need `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` —
corporate filtering blocks the browser CDN, though npm itself is reachable and Chromium is already
at the repo root.

- **Rail Sidebar / `limbo-factory/` is still frozen until M5.** M4 only READ that file. Do not
  modify it, and do not begin the Limbo → Sandbox rename before M5.

### What's next

**Sandbox Milestone 5 — the Sandbox app** (`SANDBOX-SPEC.md` §6). `limbo-factory/` → `sandbox/`,
generalised from one hard-coded occupant to N components read from the database. Origin pane in a
quarantined iframe with a lint rule failing the build on any import crossing that boundary;
translation pane alongside it; divergence list with click-to-highlight via `data-divergence`, and
live interaction — hover, press, resize — so a decision can be checked by pointing rather than by
reading code. Done when clicking a divergence highlights the exact region in the live component, and
origin material provably cannot reach the translation pane. Delete `rail-sidebar.ts` only after the
database path returns equivalent content.

**Worth doing early in M5:** the 154 imported rows have no `anchor_id`/`anchor_file`, so the
verifier has nothing to measure for any of them. Anchors have to be added to the real markup before
any of those rows can leave `legacy_unverified`.

Still genuinely open on Rail Sidebar, unrelated to the Sandbox build: divergence categories I
(elevation) and J (z-index); and four risk items honestly unfinished — R-3c/R-11c (no dedicated
Independent Audit agent has run against the whole component), R-5b (token-collision check, deferred
to Promote time), R-9b (Escalation-agent verification of Collapse's deterministic unmount).

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
