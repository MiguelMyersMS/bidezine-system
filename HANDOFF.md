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

**Baseline** — branch `main`, last verified commit `5879dd7`, working tree clean, in sync
with `origin/main`. Verify this yourself (`git log --oneline -1`, `git status`) before trusting
anything below it.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`), and now also owns
`rail-sidebar` as a real, audited fact — `node scripts/machines.mjs`. A rename of the three machines
(Alpha/Beta/Gamma or similar) is still an open decision in `docs/SANDBOX-SPEC.md` §8, but it is no
longer a rewrite of markdown headings: it is one `UPDATE` on `sandbox.machine` plus each machine's own
gitignored `.env`. Laptop B's `.env` still cannot be fixed from here, so the rename still needs all
three machines present.

### Active task

**M1–M9 are complete.** M9's two data-driven deliverables (the false-completion ranking and the tier
criteria) are built but cannot yet produce a queue or a fast lane — the corpus has zero resolutions and
one false completion, and both scripts say so rather than inventing thresholds. See "What's next".

**The divergence review card rebuild is BUILT and green** (`1b86c7f`). `sandbox/REVIEW-CARD-SPEC.md` is
the contract — read it before touching any file it names. Driven by a read-only corpus audit: 147 of 154
rail-sidebar rows have no anchor, no declaration, no evidence and no review, and exactly **one** row's
gate is open, so the old evidence widget rendered empty scaffolding for almost every row and stated the
gate's requirements twice in two vocabularies.

What shipped, in four commits (`70d821a` spec, `7b1b0a3` card + queue, `117693e` two defects, `1b86c7f`
reveal):

- **`ReviewCard`** — four-row checklist, four badge states plus a stale marker, and a gate-computed
  `Switch`. The checklist reads the gate's OWN `fn_divergence_unmet` through an `OUTER APPLY` rather
  than re-deriving its rules in JavaScript.
- **`ReviewQueue`** — grouped by who owes the next move, not by category. Measured live: 1 waiting on
  you, 0 blocked, 153 waiting on a machine, 0 done. Category survives as a filter.
- **The evidence panel no longer replaces the live preview.** The component stays on screen for the
  whole decision.
- **Reveal in canvas** dims the rest of the preview and names the property — the rendering half of
  migration 010, which had been left unbuilt.
- **`RailSourceToggle`** is a real `ToggleGroup`. That standing violation is closed.

**Four defects were found by measuring, none by reading** — worth knowing because three of them looked
correct in source:

1. `evidence.current` is vacuously satisfied for the 147 rows whose `anchor_file` is NULL. The chain
   rule keeps the tick off screen, but the FRACTION still counted it, so a row with nothing done read
   `1/4`. The number now derives from the chain too.
2. `text-muted-foreground/60` never reached the compiled stylesheet; locked rows measured
   `oklch(0 0 0)`, identical to active ones.
3. Collapsing approve and reopen into one `Switch` silently removed an observer's ability to reopen a
   foreign-owned component — the exact thing migration 016 leaves ungated on purpose. Ownership now
   disables the ON direction only.
4. Ownership was read once at page load and remembered, so a hand-over left the control live.
   `useCorpus` refetches on `visibilitychange`.

**`verify-ui` has an intermittent first-run failure, and it is the harness, not the app.** Measured
here: one run died at `verify-machines-ui.mjs:87` with `locator.waitFor: Timeout 30000ms` before any
check printed (`0/1`); a direct probe seconds later found the Machines tab present and the app serving
the rebuilt two-tab shell; the immediate re-run was **16/16**. Line 88's reload-and-retry — added
because a dev server mid-reload answers HTTP 200 before the document is interactive — wraps the
*click*, while line 87's `waitFor` runs before it, unguarded. It will red CI at random until that wait
is inside the same retry. Not fixed from here: `sandbox/` is the UI agent's.

**Suites, current** (three counts moved when 020 landed — the rebuild's own numbers were 9/9, 154/154
and 5/5): `verify-ui` 16/16, `verify-readonly` 12/12, `sandbox verify` 18/18, `verify-import`
**10/10**, `check-corpus-equivalence` **169/169**, `check-declarations` **7/7**, `check-rules` 0
violations, clean production build.

**Seven tabs became two — `Review` and `Machines`.** Four of the seven read hardcoded per-occupant
arrays from `sandbox/src/data/rail-sidebar.ts` while three read the corpus, so component #2 would have
arrived to four tabs that were empty or wrong. Source records is now a per-card **Imported record**
disclosure; the colour and typography labs are per-card decision surfaces keyed by `category`, the same
way the reveal renderers are keyed by `property_type`; blocking questions and risks are sections inside
Review, deliberately OUTSIDE the buckets because neither is in the corpus and neither has a gate.

**Do not "finish the job" by importing questions and risks as divergences.** An earlier plan said to,
and it was wrong: a question carries enumerated `options` with one chosen, a risk carries `actionItems`
with done flags and cross-references, and `divergence` has neither shape — an import would flatten both
into prose and break M4's own lossless rule. Some risks are not divergences at all (`R-3c`/`R-11c` are
process gaps about the component's audit state). Giving them a real home is a schema question, not a UI
one. Full reasoning in `REVIEW-CARD-SPEC.md` §3.8.

**F-3 is resolved, and it carries TWO approval rows four seconds apart.** Both at commit `58d1c8a`,
both `human:Laptop A`. Cause: `busy` cleared when the POST returned, but the corpus refetch it triggers
takes seconds longer — so the switch re-enabled while still rendering the pre-write state, and a second
click approved an already-resolved row. `usp_resolve_divergence` accepted it; **nothing in the database
refuses re-approving a resolved divergence**, which is worth a decision of its own. The UI side is
fixed (the control now stays disabled until the refetched row reports the state the write was aiming
at). The duplicate approval row is still there.

**Known, deliberate gaps:** `color`, `time` and `layer` renderers are unbuilt because those property
types have zero declared rows. `review_label`/`review_prompt` are empty on all 154 rows; the card falls
back to `title`/`detail`, and backfill remains scoped to the live rows only. No divergence-to-token
relation exists, so the colour lab shows the component's whole candidate set and says so. When no row
has a clean gate, `verify-machines-ui` asserts ownership against an OPEN row and prints a `note` saying
`disabled` alone is not sufficient there — the title is the real assertion.

**Three agents are working this machine concurrently — stay in your lane:**

- **UI/UX agent** owns `sandbox/src/**` and `sandbox/server/corpus-api.mjs`, plus
  `sandbox/verify-readonly.mjs` and `sandbox/verify-machines-ui.mjs` for as long as the rebuild
  breaks them. This includes `App.tsx`'s `RailSourceToggle` raw-`<button>` violation, which is fixed
  as part of the rebuild rather than as a drive-by.
- **Data-model agent** owns `db/**`. Migration `018_review_prompt.sql` (two nullable columns on
  `sandbox.divergence`: `review_label NVARCHAR(80)`, `review_prompt NVARCHAR(280)`) is in flight.
  Both stay empty by design — the card falls back to `title`/`detail`, and backfill is a later,
  human-reviewed step for the 7 live rows only, never all 154.
- **Milestone owner** owns `docs/SANDBOX-SPEC.md` and this file, and picks up §5.1's entity bullet
  once `018` lands.

**The Sandbox app is being rebuilt by a second agent** (`sandbox/REVIEW-CARD-SPEC.md`, commits
`7b1b0a3` → `cb71f26`). `sandbox/src/` and `sandbox/server/corpus-api.mjs` are **claimed by that
agent** — do not edit them from here. Seven tabs became two; the evidence widget became a
per-divergence review card driven by `fn_divergence_unmet` rather than by re-deriving the gate's rules.

**Migrations since M9, and who wrote them:** `018_review_prompt.sql` (the UI agent) adds
`review_label` NVARCHAR(80) / `review_prompt` NVARCHAR(280), nullable and NULL on all 154 rows; the
card falls back to `title`/`detail`. `019_resolve_once_and_explicit_denies.sql` (this machine) is
described under "What's done". **Next free migration number: 020.**

**Three decisions taken on this machine, so they are not re-litigated:**
1. **Questions and risks do NOT become divergence rows**, and do not get their own entity yet. They
   carry shapes `divergence` has not (`options` with one chosen; `actionItems` with done flags and
   cross-references), so importing them would flatten them and break M4's lossless rule — and
   `R-3c`/`R-11c` is a process gap about the component's own audit state, which would pollute the
   corpus M9's ranking reads. **Trigger for revisiting: the second occupant's intake.** If component #2
   produces questions and risks of the same shape, the schema is derived from two rather than one and
   is worth building. If it produces none, we learn they were an artifact of one intake.
2. **No divergence→token relation.** It would have pointed at nothing: proposed tokens are not corpus
   data at all — `proposedDarkRailTokens` is a hardcoded array in `sandbox/src/data/rail-sidebar.ts`
   and no token table exists in any migration. The real prerequisite is making tokens an entity, which
   has the same one-occupant problem as (1). The colour lab showing the component's whole candidate set
   **and saying so on screen** is correct today, not a placeholder.
3. **The F-3 duplicate approval row stays.** See "What's done".

**First thing to do on this machine: reconnect the sandbox MCP server.** Its tools (`mcp__sandbox__*`)
did not attach to the last session — `ToolSearch` found none of them. The server itself is fine: driven
directly over stdio it returns `rail-sidebar` / 154 divergences with the `open` column intact (no T-SQL
keyword error), and `npm --prefix mcp run verify` passes 14/14. This is a client-side attach problem,
not a server problem — try `/mcp` in an interactive session.

### What's done (current state — not a history)

Read `docs/SANDBOX-SPEC.md` first. It is the single source of truth for this project.

**`check-declarations` is 6/7, and it is no longer transient.** The red check is *"every bidezine subject
names an anchor a real check spec measures"*, and the seven orphans are `B-2 → rail-item-data`,
`B-3 → rail-item-slides`, `B-4 → rail-item-overview`, `B-6 → rail-item-slides-icon`,
`B-7 → rail-item-savings-icon`, `B-8 → rail-item-data-icon`, `B-9 → rail-profile-disabled`. Those rows
are anchored and declared; **their check specs under `verifier/checks/rail-sidebar/` have not been
written.** While the anchoring batch was running this was an in-flight state; the batch is confirmed
done, so it is now a real standing gap — an anchor with no spec IS incomplete, and the check is right to
say so. **It clears when the eight B-row specs are written, and not before.** Do not silence it: it is
the only thing distinguishing "declared and measurable" from "declared".

**Migration 022 — `subject_state` gained the persistent states it never had, and lost a word that meant
two things.** `active` → `pressed`; `selected` and `expanded` added. Landed whole, because the runner
case and the fixture spec had to move with the constraint or `verify-runner` breaks.

- **Why a rename rather than a comment.** In this vocabulary `active` meant CSS `:active`; in the rail
  and in seven `src/ui` primitives it means *current*. That collision had already bent a real
  declaration — B-4 declared `active`, B-3 routed to `rest` to dodge it — by someone who had read the
  component's own warning comment and still had to route around. A comment is the weakest fix for a
  failure mode already demonstrated.
- **`browsing` was not added.** It was the rail's word for `expanded`, which 13 primitives already name
  (`data-[state=open]`); `selected` is named by 7 (`data-active`/`aria-pressed`). Test 1 of the enum rule.
- **Verified by probe, not assumption:** `expanded` accepted, `active` refused, `browsing` refused.
- B-3 and B-6 moved from `rest` to `selected` — `rest` was truthful only because the demo happens to
  select Slides. **B-5 is now declarable as `expanded`**, which unblocks the forcible-state mechanism
  that was deliberately not built while no row could legally address it.

**`db/verify-review-prompt-fidelity.mjs` now covers F-3/F-5/F-6 too** — `npm --prefix db run
verify-review-prompt-fidelity`, **12/12**. The three corrected prompts quote real numbers (256px, 32px),
which reads better than a paraphrase but was the exact combination §3.10's blanket ban existed to
prevent: a quoted value goes stale silently. **The rule is now "quoting is allowed when a check pins
it"**, and this is that check. F-3 pins `PANEL_DEFAULT_WIDTH` by NAME, not line number. F-5/F-6 pin the
panel-tree row height by finding every row carrying the shared recipe and requiring one height — which
checks both halves of what those prompts claim, the value AND the uniformity. Comment lines are skipped,
because this component's only `h-9` mentions are comments explaining the change away from it.
**Proven able to fail, in both halves:** 256→260 failed F-3; making one row `h-9` failed F-5 and F-6 as
non-uniform. Source restored byte-identical afterwards. One residual assumption stated in the file
rather than hidden: `h-8 = 32px` is Tailwind's 4px scale, which this pins the class against, not the
scale itself.

- **Rename `subject_state`'s `active` → `pressed`.** The vocabulary's `active` means CSS `:active`
  (pressed); the rail's `active` means *current*; and seven `src/ui` primitives model "current" as
  `data-active`/`aria-pressed`. Same word, opposite meanings, already in one system — and it had already
  bent a declaration before anyone named it: **B-4 (`darkPressedBg`) is declared `active` and B-3
  (`darkActiveBg`) was routed to `rest`** to dodge the collision. Blast radius measured, not guessed:
  one CHECK, one row (B-4 is the only `active` in the corpus), one case in `verifier/run-checks.mjs:149`
  (which does `mouse.down()` — the rename makes it read as what it already does), and one fixture line,
  `verifier/checks/__verifier_test__/T-1.json:26`. **No real check spec uses `active`.** The runner case
  and the fixture must move in the SAME commit or `verify-runner` breaks.
- **Add `selected` and `expanded`.** Not `browsing` — that was the rail's word for `expanded`. `selected`
  = persistent current (7 primitives). `expanded` = disclosure open (13 primitives, `data-[state=open]`).
  B-5 (`darkBorderStrong`, the browsing ring) becomes declarable as `expanded`; the forcible mechanism
  for it was deliberately not built while no row could legally address it.
- **Then re-declare B-3 and B-6 from `rest` to `selected`.** `rest` is truthful today only because the
  demo happens to select Slides — if the demo's default section changes, those two checks fail for a
  reason unrelated to the token.

**Enum policy, decided once so it is not answered a third time.** Two vocabulary gaps in a row
(`derives`, then `browsing`) had the same cause: an enum drawn from what the first occupant needed.
Enums EXTEND, but only with the general concept, never the occupant's word — and `CLAUDE.md` item 26's
rule governs it, because a vocabulary term is a constant like any colour or size. Three tests, in
migration 021's header in full: (1) does an existing value already cover it — if the occupant merely
uses a different word, rename it in the declaration; (2) do bidezine's own primitives already name the
concept — checkable by counting files, not speculation; (3) adding a value promises something renders it
DISTINCTLY, and a value nothing distinguishes is worse than none.

**Migration 021 — `derives`, the third relation kind.** `F-7` and `F-9` both compute from `F-2`'s
`RAIL_BUTTON_SIZE`; `FOOTER_MAX_HEIGHT` is a literal expression over it at
`FunctionalRailSidebar.tsx:454`. Neither is an answer or a risk, and forcing one would have put a false
claim in the corpus. **`derives` is a DEPENDENCY, not a satellite — it must not nest.** `answers`/`risks`
are satellites of one decision; `derives` links two independent decisions, and nesting F-7 under F-2
would hide a decision someone still has to make. It renders as "changes with F-2" or it does not render.
It is also `divergence_dependency` (013) at row granularity — if F-2's measured value changes, F-7's and
F-9's evidence is suspect for the same reason — which is where enforcement would eventually live.

**Three stale titles corrected — F-3, F-5 and F-6, not just F-3.** Measured against the live component:
`PANEL_DEFAULT_WIDTH = 256` (line 424) against a title saying 300; panel-tree rows are `h-8` at 950/979/
1073 against titles saying 40px and 28px, with the three remaining `h-9` mentions all inside comments.
**Authorised because `title` is not the archive:** `origin_record.what` still holds each original
verbatim and was untouched, so M4's lossless rule was never at risk — which is also why L-34's correction
was authorised, though nobody had noticed that was the actual reason. Their three `review_prompt`s moved
with them: each had ended by asking the reviewer to confirm the title was stale, which becomes false the
moment it is not.

**Migration 020 — a divergence can be about another divergence.** `sandbox.divergence_relation`, typed
(`answers` | `risks`) and directional, plus `fn_divergence_relations(@id)` returning both directions with
the other row's ref resolved. Populated by `node scripts/declare-relations.mjs`.

- **Why this was not the n=1 case that question/risk entity schemas were refused for:** those would have
  invented an entity SHAPE from one occupant. These rows already share one table, already carry a gate
  (`Q1`, `A-9` and `R-1` each reported two unmet requirements), and are already treated identically
  downstream. The edge describes the TABLE's semantics, not this occupant's content.
- **The cost it removes:** one decision counted as three pieces of work — three rows, six unmet
  requirements, three cards. Every count M9's ranking reads was inflated by that fan-out.
- **Four edges recorded, not forty.** Only Q1, Q3, Q4 and R-1 carry a `review_prompt` naming their
  related row — a sentence a human wrote and reviewed. The other risk rows have candidate refs sitting
  in `origin_record` (R-3 cites ten, R-6 six) and are deliberately NOT imported: "R-3 mentions H-1" and
  "R-3 is a risk against H-1" are different claims. **The next step is not a bulk import** — it is that
  as each row's `review_prompt` gets written, its relation gets declared in the same pass.
- **Those four prompts were rewritten** so the first sentence no longer spends itself naming a row the
  schema now carries. `mcp/server.mjs`'s `sandbox_divergence` gained a `relations` block in the same
  change, so the agent surface never lost the pointer. **The card has NOT been wired to
  `fn_divergence_relations` yet** — until `sandbox/` does that, the relation is in the schema and the
  MCP surface but not on screen.
- Relations sit OUTSIDE the frozen snapshot, matching `divergence_subject`/`divergence_property`:
  script-populated declaration tables are covered by `check-declarations.mjs`, which gained two checks
  the table's constraints cannot express — same-component, and no cycles (a cycle makes "nest satellites
  under their subject" undefined and breaks rendering silently rather than erroring).

**Migration 019 — two protections that existed only by absence.** Both were real; neither was
declared, and a rule nothing states is one the next change can remove unnoticed.

- **`usp_resolve_divergence` now refuses a `resolved` row** (error 51007), checked before ownership and
  before the gate. `F-3` was approved twice, four seconds apart, because the UI raced AND the procedure
  accepted the second call — a resolved row still has its passing evidence and review, so the gate said
  yes again. **Not a `UNIQUE` constraint on `approval`:** reopen → fix → re-resolve produces a second
  approval legitimately, and that loop is what M9's ranking is built on. The defect was "two approvals
  with no intervening reopen", which only a state check expresses.
- **The duplicate approval row was NOT deleted.** It is a true record in an audit table; deleting it
  would destroy the evidence of the defect and needs `ADMIN`, since `app_rw` holds `INSERT` only — the
  permission model is the argument. Explained in the flaws log instead.
- **`app_rw` now carries explicit `DENY` on `evidence`, `review` and `review_citation`.** It could not
  write them before either, but only because no `GRANT` existed — and Fabric's RBAC guarantee this
  project relies on protects a DENY, not an absence. **The risk was checked, not assumed:**
  `usp_reopen_divergence` runs as `app_rw` and updates `review.invalidated_at`; ownership chaining skips
  DENY on referenced objects, confirmed by `db/verify` (15/15) and `sandbox/verify` (18/18) both driving
  a real reopen afterwards.

**Milestones 1–8 are done.** The narrative of how each was built used to live here and has been
removed on purpose — it is durably recorded in the commit messages and in
`SANDBOX-PROTOCOL-LOG.md`'s flaws log, and this file is a snapshot of *now*, not an archive. What
stays below is the operational knowledge a fresh session needs and cannot get from either.

**Twelve proof scripts, plus one that needs the app running. Re-run ALL of them after any change
under `db/`, `verifier/`, `mcp/` or `sandbox/server/`:**

```
npm --prefix db run verify                 # 15/15 — the gate and its permissions
npm --prefix verifier run verify           # 18/18 — the runner is worth trusting, incl. batch re-verification
npm --prefix mcp run verify                # 14/14 — the agent surface, over the real protocol
npm --prefix db run verify-import          #  10/10 — corpus vs the FROZEN snapshot (drift detection), now incl. review_prompt/review_label
npm --prefix db run verify-review-prompt-fidelity  # 9/9 — each B-1..B-9 prompt's final sentence still matches its live proposedDarkRailTokens value
npm --prefix db run verify-system-change   # 17/17 — the higher-ceremony lifecycle + the sweep, as real principals
npm --prefix db run verify-ownership       # 16/16 — M8: a machine cannot finish another machine's work
npm --prefix sandbox run verify            # 18/18 — M6: the gate refuses, approves, and cascades
npm --prefix sandbox run verify-readonly   # 12/12 — M8 over real HTTP: a foreign approve is 403, an owner's is 409
node scripts/check-declarations.mjs        #   5/5 — declarations agree with the evidence
node scripts/check-scope-detection.mjs     # 17/17 — system vs component classification
node scripts/check-corpus-equivalence.mjs  # 154/154 — what the APP renders vs that same snapshot
node scripts/check-rules.mjs               #  M9 — the prose rules, executable. No DB.
node scripts/check-rules-test.mjs          # 11/11 — every rule can FAIL, and stays quiet on a near-miss

# These two need a server, and REFUSE to run without one rather than skipping.
npm --prefix sandbox run dev   → npm --prefix sandbox run verify-ui        # 16/16 — the machine switcher + review card
npm run build && npm --prefix site run build && npm --prefix site run preview
                               → npm --prefix site run verify-sidebar      #  9/9 — SidebarContent's ScrollArea
```

**`verify-sidebar` needs the ROOT build first, not just the site's.** `site/` imports the built
`@bidezine/system`, so editing `src/ui/` and rebuilding only the site measures stale `dist/`. That is
not hypothetical — the first run of that check reported `overflow: auto` and no viewport, and the
source change was already correct.

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
