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

_None. Sandbox Milestone 1 is complete, verified against the real database, and committed._

### What's done (current state — not a history)

- **Sandbox Milestone 1 is complete and proven.** `docs/SANDBOX-SPEC.md` is the single source of
  truth for this project — read it before touching anything under `db/`.
  - Fabric SQL Database provisioned in the **biDezine** tenant. Microsoft's corporate tenant was
    deliberately abandoned: app registration there requires a Service Tree ID, and more importantly
    bidezine's own operational store should not sit in an employer's tenant where access is tied to
    employment. Workspace `bidezine-sandbox`, one SQL database, no other Fabric items.
  - `db/migrations/` 001–004 applied: schema, three roles with their real GRANT/DENY, the gate
    procedures. `db/bootstrap/` maps the four Entra service principals to those roles and is kept
    out of `migrations/` so the migrations stay portable to any SQL Server.
  - **`npm --prefix db run verify` passes 15/15 against the live database.** That script is M1's
    definition of done: it connects as each real principal and watches the denials fire, rather than
    reading the permissions and reasoning about them. It proves an agent cannot insert evidence,
    cannot set state, and cannot approve; that a reviewer cannot review its own build; that the gate
    refuses resolution and relents only as each requirement is genuinely met; and that reopening
    writes a false_completion row. **Re-run it after any change under `db/`.**
  - Two Fabric platform constraints, both found by executing rather than reading, now recorded in
    `SANDBOX-SPEC.md` §4.3 so nobody re-derives them. **`EXECUTE AS` is unsupported on Fabric** —
    procedures create without complaint and fail at call time, so the gate relies on ownership
    chaining instead, which requires one schema owner and no dynamic SQL anywhere in the procedures.
    And **Fabric's item RBAC gates connection only** — it maps into no SQL role and cannot override a
    SQL DENY, which is what makes the core invariant trustworthy on this platform.
  - Connection details and the four client secrets live in the local, **gitignored** `.env`. They do
    not travel through git; every other machine fills in its own from `.env.example`.
- **Rail Sidebar / `limbo-factory/` deliberately untouched, and must stay that way until M5.** Per the
  spec's sequencing constraint it remains running and authoritative through M1–M4; nothing there
  changes until M5 swaps the read path. Do not begin the Limbo → Sandbox rename before then.

### What's next

**Sandbox Milestone 2 — the verifier runner** (`SANDBOX-SPEC.md` §6). A check-spec format plus a
Node/Playwright runner that resolves a `data-divergence` anchor in the live render, exercises each
interaction state for real, measures, and writes the result itself under the `runner_evidence`
credential. Done when an agent can request a check by spec and cannot write the result, re-running a
spec reproduces the same numbers, and a deliberately wrong expected value produces a failing row
rather than a passing one.

Still genuinely open on Rail Sidebar, unrelated to the Sandbox build and not queued: divergence
categories I (elevation) and J (z-index); and four risk items that are honestly unfinished rather
than fabricated as done — R-3c/R-11c (no dedicated Independent Audit agent has ever run against the
whole component, only scoped diffs), R-5b (Sidebar/Rail Sidebar token-collision check, correctly
deferred to Promote time), and R-9b (Escalation-agent verification of Collapse's deterministic
unmount).

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
