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

## Laptop A — Miguel

**Baseline** — branch `main`, last verified commit `83a2c5b`, working tree clean and pushed to `origin/main`.

### Active task

_None. Nothing in progress._

### What's done (current state — not a history)

- Rail Sidebar panel resize (`react-resizable-panels`) ships with correct shadow clearance on all four
  sides and no height regression (L-35/L-36/L-37, see `limbo-factory/src/data/rail-sidebar.ts` and
  `LIMBO-PROTOCOL-LOG.md` Update 9/10).
- Factory-line preview stage (`limbo-factory/src/App.tsx`) anchors the Rail+Panel composite
  (`justify-start`) instead of centering it, fixing the Rail being almost entirely clipped (L-38, see
  `limbo-factory/src/data/rail-sidebar.ts` and `LIMBO-PROTOCOL-LOG.md` Update 11). User-confirmed live.

### What's next

_Nothing queued. Awaiting new instructions._

### Open questions / blockers

_None._

---

## Laptop B — Blair

**Baseline** — branch `main`, last verified commit `c41db05`, working tree clean and pushed to `origin/main`.

### Active task

_None. Nothing in progress._

### What's done (current state — not a history)

- Machine synced to `main` and verified working: dependencies installed at the repo root and in
  `limbo-factory/`, `npm run typecheck` passes (42 tokens emitted with light/dark parity OK, 109 icons
  emitted, `tsc --noEmit` clean).
- Cloudflare infrastructure for `https://bs.bidezine.systems` (Pages project `bs-site`, custom domain,
  DNS, Access gate) — now superseded by the production deploy path Laptop A documents in
  `docs/infra/CLOUDFLARE.md`, which is the file to trust.

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
