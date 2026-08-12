# Handoff — this machine's open work

> ## Ownership is no longer written here. Ask the database.
>
> **Sandbox Milestone 8 moved cross-machine state out of this file.** Who owns which component, what
> state it is in, how much of its evidence has gone stale, and every hand-over that ever happened are
> now rows in `sandbox.machine`, `sandbox.component.owner_machine_id` and
> `sandbox.ownership_transfer` — not prose someone remembered to update.
>
> ```
> node scripts/machines.mjs        # who owns what, and the recent hand-overs
> npm --prefix sandbox run dev     # the same thing on screen: the "Machines" tab, port 4199
> ```
>
> **This is enforced, not advertised.** A machine cannot resolve a divergence or promote a component
> owned by another machine — `usp_resolve_divergence` and `usp_promote_component` require the calling
> machine to name itself and refuse when it is not the owner (migration 016), and ownership itself can
> only move through `usp_transfer_component`, which demands a stated reason and writes an audit row
> (migration 015). `npm --prefix db run verify-ownership` watches all of that be refused, as real
> principals. It stops the ACCIDENT — a session reading a stale file and helpfully finishing another
> machine's work — which is the failure this file's "only edit your own section" rule existed to
> prevent. It does not stop a machine that lies about which machine it is; all three still share one
> `app_rw` principal. Migration 015's header says so in full.
>
> **What is still written here, and why.** "I was midway through X, and Y looked wrong" is not a
> component, a divergence or an ownership record, so the database has nowhere to put it. Each machine
> keeps a short section below for exactly that. It is no longer where you look to find out what another
> machine OWNS — that question now has an authoritative answer.

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

## Laptop A (main)

**Baseline** — branch `main`, last verified commit `a4656fd`, working tree clean, in sync
with `origin/main`. Verify this yourself (`git log --oneline -1`, `git status`) before trusting
anything below it.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`), and now also owns
`rail-sidebar` as a real, audited fact — `node scripts/machines.mjs`. A rename of the three machines
(Alpha/Beta/Gamma or similar) is still an open decision in `docs/SANDBOX-SPEC.md` §8, but it is no
longer a rewrite of markdown headings: it is one `UPDATE` on `sandbox.machine` plus each machine's own
gitignored `.env`. Laptop B's `.env` still cannot be fixed from here, so the rename still needs all
three machines present.

### Active task

**M1–M8 are complete and verified.** Nothing is in progress on this machine.

**First thing to do on this machine: reconnect the sandbox MCP server.** Its tools (`mcp__sandbox__*`)
did not attach to the last session — `ToolSearch` found none of them. The server itself is fine: driven
directly over stdio it returns `rail-sidebar` / 154 divergences with the `open` column intact (no T-SQL
keyword error), and `npm --prefix mcp run verify` passes 14/14. This is a client-side attach problem,
not a server problem — try `/mcp` in an interactive session.

### What's done (current state — not a history)

Read `docs/SANDBOX-SPEC.md` first. It is the single source of truth for this project.

**Milestones 1–8 are done.** The narrative of how each was built used to live here and has been
removed on purpose — it is durably recorded in the commit messages and in
`SANDBOX-PROTOCOL-LOG.md`'s flaws log, and this file is a snapshot of *now*, not an archive. What
stays below is the operational knowledge a fresh session needs and cannot get from either.

**Eleven proof scripts, plus one that needs the app running. Re-run ALL of them after any change
under `db/`, `verifier/`, `mcp/` or `sandbox/server/`:**

```
npm --prefix db run verify                 # 15/15 — the gate and its permissions
npm --prefix verifier run verify           # 18/18 — the runner is worth trusting, incl. batch re-verification
npm --prefix mcp run verify                # 14/14 — the agent surface, over the real protocol
npm --prefix db run verify-import          #   9/9 — corpus vs the FROZEN snapshot (drift detection)
npm --prefix db run verify-system-change   # 17/17 — the higher-ceremony lifecycle + the sweep, as real principals
npm --prefix db run verify-ownership       # 16/16 — M8: a machine cannot finish another machine's work
npm --prefix sandbox run verify            # 18/18 — M6: the gate refuses, approves, and cascades
npm --prefix sandbox run verify-readonly   # 12/12 — M8 over real HTTP: a foreign approve is 403, an owner's is 409
node scripts/check-declarations.mjs        #   5/5 — declarations agree with the evidence
node scripts/check-scope-detection.mjs     # 17/17 — system vs component classification
node scripts/check-corpus-equivalence.mjs  # 154/154 — what the APP renders vs that same snapshot

# needs `npm --prefix sandbox run dev` in another terminal; REFUSES to run without it
npm --prefix sandbox run verify-ui         # 11/11 — the machine switcher, rendered
```

**`verify-readonly` and `verify-ui` exist because M8 was first reported with both checks run from a
session scratchpad.** That made the milestone's strongest claim — that a foreign machine's approve is
refused by the server rather than by a disabled button — an unrepeatable assertion by the agent that
made the change, which is invariant 1 turned on this system's own construction. An independent review
caught it. Any check worth citing in a report is worth committing; if it is genuinely one-off, say so
in the report rather than quoting its score.

**Run the whole set, not the one you changed.** M6's own work reverted migration 005 and every M6
check still passed — only `verify-runner` went red. A suite you did not touch is exactly the one most
likely to notice what you broke.

They connect as real principals and watch things fail rather than reading permissions and reasoning
about them. None trusts a writer's own success message, since that is an assertion by the thing that
did the work.

**`verify-import` changed meaning at M5 step 4 — worth knowing before you read its name.** It used to
re-read the hand-written TypeScript source and prove the import was lossless. That array is now
deleted (the corpus is authoritative), so it diffs the **live corpus against
`db/snapshots/rail-sidebar.json`**, the frozen snapshot committed in git: it detects **drift**, not
import fidelity. `check-corpus-equivalence` asks a genuinely different question — the app's
**rendered** view vs that same snapshot, because a field can sit in the database perfectly and still be
dropped on the way out.

**The snapshot must stay frozen or both checks become meaningless.** It is regenerated only by
deliberately running `scripts/emit-corpus-snapshot.mjs`. If you find yourself regenerating it to make a
check pass, stop — the check is working, and the question is why the corpus changed.

**Fabric/driver facts that only appeared by running things — each now guarded:**

- **`EXECUTE AS` is unsupported on Fabric.** Procedures create fine and fail at call time. The gate
  uses ownership chaining, which needs one schema owner and **no dynamic SQL in any gate procedure**.
- **Fabric's item RBAC gates connection only** — it maps into no SQL role and cannot override a DENY.
- **`mssql.connect()` returns the PROCESS-GLOBAL pool.** Holding two roles at once gives you one
  identity twice, and the handle you are still holding fails in ways that look like a permissions bug.
  Every multi-role suite opens one role, uses it, closes it.
- **`evidence_id` is a BIGINT the driver returns as a STRING** — the MCP server emitted string ids and
  rejected those same ids when cited back.
- **`open` and `top` are T-SQL keywords.** The first broke `sandbox_components` until bracketed; the
  second broke a `MAX(evidence_id) top` alias. Anything that reads like a keyword needs a different
  alias or brackets.
- **`ref_code` is NVARCHAR(20)**, and `LIKE '__SC%'` is not a prefix test — `_` is a wildcard. Use
  `LEFT(ref_code, 7) = '...'`.
- **`SUSER_SNAME()` returns `<clientId>@<tenantId>`**, not a display name. Compare against the client
  ID, which is stricter than a name match anyway.

### What's next

**Nothing is queued. The list below is genuinely-open work, not a plan.**

**M9 is the next milestone** — executable enforcement and the learning loop. See `docs/SANDBOX-SPEC.md`
§6. Its input is the false-completion data the system has been collecting since M1.

**Open decisions that need a human, not more building:**

1. **Per-machine Fabric authentication.** All three machines share one `app_rw` service principal, so
   `@machine` is asserted by the caller rather than proven by the connection (migration 015's header
   states this in full). Closing it means one service principal per machine plus per-machine roles —
   real Fabric portal work that cannot be done from a migration. Worth deciding deliberately; the
   current guard already stops the accidental case, which is the one P6 is about.
2. **The machine rename** (`docs/SANDBOX-SPEC.md` §8), now cheap — see the note under Baseline.
3. **F-3's row title still reads `panelW = 300px`** while its own detail explains the decision resolved
   to **256** — the card contradicts itself on screen. Correcting an imported record is a policy call,
   and only L-34's correction was ever authorised.

*The untracked `scripts/icon-comparison-server.mjs` is gone* — deleted rather than committed, on the
owner's instruction. It had no caller and had survived two `git add -A` sweeps by being manually split
out. `sandbox/vite.config.ts`'s port comment, its only remaining mention, was corrected in the same
change.

**It is not recoverable from git, and that is worth stating rather than assuming otherwise.** The file
was never tracked, so no commit ever contained it — `git rm` refused it as an unknown pathspec, and
the deletion appears in no diff. 187 lines, gone. That was the instruction and it was a reasonable one
for a tool nothing referenced, but "git keeps it if we ever want it" is only true of files git has
seen at least once.

**Known gaps, each real and none blocking:**

- **The M2 runner cannot express two whole classes of check**, found by anchoring category F end to
  end: **relational geometry** (F-4 rail-to-panel gap, F-9 rail item pitch, F-11 footer
  bottom-anchoring — each asserts a relationship *between two elements*, while a spec addresses exactly
  one anchor) and **scripted interaction** (F-8 is a drag clamp, only observable by resizing; the state
  vocabulary is `rest`/`hover`/`active`/`focus`/`focus-visible`/`disabled` and nothing drives a
  sequence). Both now have a declaration to read (M7 step 1). Anchoring the remaining ~147 rows before
  fixing this would mean discovering mid-way that a large share has nowhere to land.
- **The evidence widget's five property-type renderers** are still unbuilt. This is the visual-selection
  work — showing *which exact element and property* a divergence is about, rather than describing it in
  prose. Unblocked by M7 step 1; nothing about it needs re-deciding.
- **A review's citation can never be cleared by re-running.** `review.citations_support` names a
  specific `evidence_id`, and a fresh measurement is always a NEW row — so after a system change lands,
  the measurement can be restored automatically but the *judgement* has to be redone by a human.
  Correct, but it means `--stale` leaves a permanent residue that only a review clears.
- **`usp_promote_component` has no caller anywhere in the repo** (grep across `db/`, `mcp/`, `sandbox/`,
  `site/`, `verifier/`). It is exercised only through migrations, so component promotion — as opposed to
  divergence resolution — is not reachable by a human or an agent. Pre-existing; M8 is when it became
  visible.
- **UNVERIFIED — does the Sandbox app's Tailwind scan `origin/`?** The quarantine is proven for
  imports, bundles, CSS cascade and JS realm, but this one question was raised and deliberately not
  answered. `origin/` is **committed** rather than gitignored, so Tailwind v4's auto-detection would not
  skip it on that basis. If it IS being scanned, origin's class names are compiling utilities into the
  Sandbox's stylesheet — bloat and a drift risk rather than a rendering bug, but unmeasured. Cheap to
  settle: grep the built `sandbox/dist/assets/*.css` for a utility only origin uses.
- **The independence check is weaker than it looks — a candidate for M9's enforcement list.**
  `sandbox_submit_review` takes `author_agent_id` AND `builder_agent_id` as **caller-supplied strings**.
  The database enforces they *differ*, not that they correspond to genuinely different actors.
- **`sandbox/src/App.tsx`'s `RailSourceToggle` renders raw `<button>` elements** styled to look like
  real ones — a "no hand-rolled components" violation, which `CLAUDE.md` explicitly does not waive for
  sandbox tooling.
- **The corpus holds a stray `__dbg__` component** (state `build`, 1 divergence, unowned). Leftover
  debug data, left in place rather than deleted unilaterally.
- **Still open on Rail Sidebar itself**, unrelated to the Sandbox build: divergence categories I
  (elevation) and J (z-index); and four risk items honestly unfinished — R-3c/R-11c (no dedicated
  Independent Audit agent has run against the whole component), R-5b (token-collision check, deferred to
  Promote time), R-9b (Escalation-agent verification of Collapse's deterministic unmount).

**Review has a termination rule — apply it, don't re-review by default.** One round per batch of work;
fix what it finds; **re-review only if a fix touched code shared by other rows.** A round that finds
nothing new ends it. Without this the anchor → measure → review → fix cycle has no exit and reads as a
loop rather than progress.

### Open questions / blockers

_None._

---

## Laptop B

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
- **Rail Sidebar Sandbox transformation (`sandbox/`) — category F ("Layout / Sizing") fully closed.**
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
  `sandbox`'s own `App.tsx`/`FillHeight` uses; no code change needed in `sandbox` itself). Full
  rationale for every row: `sandbox/src/data/rail-sidebar.ts` (rows F-1–F-11) and
  `SANDBOX-PROTOCOL-LOG.md` (Updates 12–18, append-only). `CLAUDE.md`'s Primitive Fidelity Checklist item 26
  gained a fourth verification axis: an approved divergence-row CONCEPT is not the same as it being wired
  into real code — always re-check the live component source when a row moves to `"resolved"` (this caught
  F-7's implementation gap). Remaining open categories in the Rail Sidebar divergence list: H (motion), I
  (elevation), J (z-index), L (component gaps, 1 open item), M (naming/API conflicts) — 12 rows total, none
  touched this baseline.
- **Machine-identity protocol added**: `.env.example` now documents `MACHINE_NAME`; the
  `SessionStart` hook in `.claude/settings.json` prints this machine's `HANDOFF.md` identity automatically;
  `CLAUDE.md`'s Recovery workflow gained a step 0 covering it. This machine's `.env` is set to
  `MACHINE_NAME=Laptop B`.

### What's next

_Nothing queued. Awaiting new instructions._

### Open questions / blockers

_None._

---

## PC

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
