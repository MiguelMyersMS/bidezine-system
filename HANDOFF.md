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

## Laptop A (main)

**Baseline** — branch `main`, last verified commit `78bbf0d`, working tree clean, in sync with
`origin/main`. Verify this yourself (`git log --oneline -1`, `git status`) before trusting anything
below it.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`). A formal
primary/satellite rename of all three machines is deliberately deferred to Sandbox Milestone 8 —
see `docs/SANDBOX-SPEC.md` §8. Renaming earlier would break Laptop B's local, gitignored `.env`,
which cannot be fixed from here.

### Active task

**M1–M7 are complete and verified. M8 is IN PROGRESS — steps 1, 2 and 3 of 5 are done.**

**Done so far:** ownership is real in the database. `sandbox.machine` and
`component.owner_machine_id` have existed since migration 001 and had never held a row — the same
shape `affected_paths` was in before M7 used it. Migrations **015** and **016** make them
load-bearing, and `npm --prefix db run verify-ownership` proves it at **16/16** against real
principals. `rail-sidebar` is now genuinely owned by Laptop A, with an audit row saying so.

**Next: M8 step 4 — the machine switcher in the Sandbox app** (observe another machine read-only),
then step 5, shrinking `HANDOFF.md` itself to a pointer. See "What's next".

**First thing to do on this machine: reconnect the sandbox MCP server.** Its tools
(`mcp__sandbox__*`) did not attach to the last session — `ToolSearch` found none of them. The server
itself is fine: driven directly over stdio it returns `rail-sidebar` / 154 divergences with the
`open` column intact (no T-SQL keyword error), and `npm --prefix mcp run verify` passes 14/14. This
is a client-side attach problem, not a server problem — try `/mcp` in an interactive session.

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

**Ten proof scripts. Re-run ALL of them after any change under `db/`, `verifier/`, `mcp/` or
`sandbox/server/`:**

```
npm --prefix db run verify                 # 15/15 — the gate and its permissions
npm --prefix verifier run verify           # 18/18 — the runner is worth trusting, incl. batch re-verification
npm --prefix mcp run verify                # 14/14 — the agent surface, over the real protocol
npm --prefix db run verify-import          #   9/9 — corpus vs the FROZEN snapshot (drift detection)
npm --prefix db run verify-system-change   # 17/17 — the higher-ceremony lifecycle + the sweep, as real principals
npm --prefix db run verify-ownership       # 16/16 — M8: a machine cannot finish another machine's work
npm --prefix sandbox run verify            # 18/18 — M6: the gate refuses, approves, and cascades
node scripts/check-declarations.mjs        #   5/5 — declarations agree with the evidence
node scripts/check-scope-detection.mjs     # 17/17 — system vs component classification
node scripts/check-corpus-equivalence.mjs  # 154/154 — what the APP renders vs that same snapshot
```

**Run the whole set, not the one you changed.** M6's own work reverted migration 005 (see below) and
every M6 check still passed — only `verify-runner` went red. A suite you did not touch is exactly the
one most likely to notice what you broke.

They connect as real principals and watch things fail rather than reading permissions and reasoning
about them. Neither trusts a writer's own success message, since that is an assertion by the thing
that did the work.

**`verify-import` changed meaning at M5 step 4 — worth knowing before you read its name.** It used to
re-read the hand-written TypeScript source and prove the import was lossless. That array is now
deleted (the corpus is authoritative), so it diffs the **live corpus against
`db/snapshots/rail-sidebar.json`**, the frozen snapshot committed in git: it detects **drift**, not
import fidelity. `check-corpus-equivalence` is the fifth check and asks a genuinely different
question — the app's **rendered** view vs that same snapshot, because a field can sit in the database
perfectly and still be dropped on the way out.

**The snapshot must stay frozen or both checks become meaningless.** It is regenerated only by
deliberately running `scripts/emit-corpus-snapshot.mjs`. If you find yourself regenerating it to make
a check pass, stop — the check is working, and the question is why the corpus changed.

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

- **M5 rename landed.** The old `limbo-factory/`, `limbo/` and `LIMBO-PROTOCOL-LOG.md` are now
  `sandbox/`, `origin/` and `SANDBOX-PROTOCOL-LOG.md`. Every move was 100% similarity — **no file
  contents were altered**. Paths and forward-looking prose were updated; **historical entries were
  not**. The protocol log's own entries still use the old names deliberately: they record what was
  true when written. (The same once applied to `sandbox/src/data/rail-sidebar.ts`, whose divergence
  array was stored verbatim in `origin_record`; that array was deleted at M5 step 4, and its verbatim
  text now lives in `db/snapshots/rail-sidebar.json` instead.) `sandbox/` builds clean.
- **Laptop B's and the PC's sections were path-renamed too, at the owner's explicit instruction**, as an
  exception to the "only edit your own section" rule. Strictly a mechanical path substitution — no
  claim either machine made was altered, only strings pointing at directories that no longer exist.
  Laptop B: if this conflicts with local edits, keep yours and re-apply the paths.
- **The dev server command changed**: `npm --prefix sandbox run dev` (port 4199, unchanged).

**M5 step 1 — the origin quarantine — is done and verified.** The contamination was real and larger
than the single import that advertised it: 17 files / ~6,834 lines of origin source were living at
`sandbox/src/reference/origin-design-system/`, inside the app's own `src/`, behind its `@/reference/*`
alias, compiled into the app's bundle. The old `OriginRailNavLive.tsx` mounted it into an
`about:blank` iframe, which separated the **DOM** but never the **code**.

- **Where it lives now:** `origin/rail-sidebar/app/` — its own npm + TypeScript project, own
  `package.json` / `tsconfig.json` / `vite.config.ts` / bundle. All 16 runtime files moved by
  `git mv` at 100% similarity; contents unaltered. It builds into `sandbox/public/origin/rail-sidebar/`
  (gitignored build artifact) and the app embeds it with `<iframe src>` and nothing else. A crossing
  import no longer resolves at all — the boundary is structural, not just policy.
- **Enforcement:** `scripts/check-quarantine.mjs`, wired as the first step of `npm --prefix sandbox
  run build`. Proven against three deliberate violations: a name-matched import, a relative
  `../../origin/...` climb into a hypothetical *future* occupant that no name rule knows about, and
  drift between the two duplicated halves of the embed contract. Each failed the real build, exit 1.
- **Proven absent from the shipped bundle, not assumed:** 25 string literals present only in origin
  source and surviving origin's own production build were checked against the Sandbox app's own
  production bundle — zero present. (Three earlier apparent hits were false positives traced to
  `@bidezine/system`'s own `dist`, a shared Radix ARIA role, and a doc comment.)
- **Verified live, 8/8, against BOTH the dev server and a real `vite preview` production build**
  (`node scripts/verify-origin-quarantine.mjs`, with the server running): the framed document is the
  origin page, it is the real origin rail (`.ds-scroll-region`, its own `#1c2024` surface), **no**
  Tailwind class exists inside the frame, the frame is a separate window/document/realm with no app
  marker visible inside it, the app's theme toggle reaches it over `postMessage` (`#1c2024` →
  `#111113`) **without** re-navigating the frame, and the panel still drag-resizes (300px → origin's
  own `PANEL_MIN_WIDTH` of 240px).
- **Two things deliberately removed, each because the boundary made them unnecessary:** the
  hand-written `mousemove`/`mouseup` relay (RailNav's listeners now attach to the frame's own window
  and receive those events directly) and the `document.write()` bootstrap (its CSS now lives in the
  origin page's own `index.html`).
- **One real behavioural change, and it is an improvement:** RailNav's resize clamp reads
  `window.innerWidth`, which used to be the OUTER page's width and is now the frame's. At a 372px
  embed the panel now widens to exactly `396 - 54 - 8 - 32 = 302px` — matching what the user can
  actually see, and matching real Storybook, where every story renders in an iframe.
- **Two failure classes found doing this, both logged** in `SANDBOX-PROTOCOL-LOG.md` and folded into
  `CLAUDE.md` (checklist item 10 gained a document-level extension). The sharper one: a live check
  reading "an `<aside>` renders inside the origin iframe" **passed while the iframe was serving a
  nested copy of the Sandbox app** — Vite's dev server applies its SPA fallback to a bare directory
  URL, so `/origin/rail-sidebar/` returned the app's own `index.html` with HTTP 200 and no error. The
  app has an `<aside>` too. Hence `ORIGIN_EMBED_PATH` spells out `index.html`, and every identity
  check is now two-directional (assert a marker only origin can produce AND the absence of one only
  our code could produce).

**The full loop has now run once: anchor → measure → independent review → fix → re-measure.** Four
adversarial reviewers ran against the first four measured rows. **Two passed, two failed, and both
failures were real** — re-verified independently before being accepted, since an agent's report is a
lead to re-check, not a verdict.

- **F-7 — FAIL, confirmed, now fixed.** The fix that closed F-7's own documented-but-never-implemented
  gap had itself introduced two defects, and the check certified them as fine because it asserted
  property values at one viewport. (1) The shipped 2-item footer **silently collapsed**: `overflow:
  hidden` flips a flex item's automatic minimum size to 0 and the column had no `shrink-0` — measured
  80px at viewport heights 900/560, 46.83px at 380, **0px at 300, both buttons gone, no error**.
  (2) It **clipped both footer buttons' focus rings** — zero slack left/right on both, against
  `Button`'s own real `ring-[3px]`. L-31 / checklist item 21 reintroduced verbatim. Fixed per item 21's
  own prescription (remove the redundant tighter wrapper rather than pad it); re-verified 80px at every
  height tested and the ring now paints. The spec's `overflow: hidden` justification was mine and was
  empirically false — replaced, plus a `box` check, since a computed-style check alone **passes on a
  `display:none` element**.
- **L-34 — FAIL on the record, not the code.** The row cited a before/after screenshot of *"the 'g' in
  'Schedules'"*. **"Schedules" contains no descender at all**, so that observation cannot have been
  made. Checklist item 18's failure class one level up from icon paths: plausible prose that passes
  typecheck, build and every automated check because nothing verifies prose. It had propagated into
  three files **including the check spec, which was written by copying the record instead of checking
  it**. Corrected in all three by appending a `CORRECTION` rather than erasing (rail-sidebar.ts is
  append-only history); corpus re-imported, `verify-import` back to 8/8 byte-identical.
- **F-2 — pass**, but its "20px icon" half was unguarded; now covered by a second spec.
- **F-3 — pass**, viewport-conditional: below ~1180px the card measures 244.98. The runner hard-codes
  1440×900; the spec now records the dependency it silently relied on.

**Category F is now 7 of 11 anchored** (F-1, F-2 + F-2-icon, F-3, F-5, F-6, F-7) plus L-34 — **8 anchors,
14/14 checks passing, 14 evidence rows.** F-5/F-6 are deliberately a *pair*: one row proves a height,
but only its own child row proves the absence of a shrink-with-depth.

**A real limit of the M2 runner, found by trying to finish the category.** Four rows cannot be anchored
at all today, and the reason is structural rather than incidental:

- **F-4, F-9, F-11** each assert a **relationship between two elements** (rail-to-panel gap, rail item
  pitch, footer bottom-anchoring). A check addresses exactly one anchor and `box` returns that one
  element's rect. There is no way to express "these two are 8px apart" — yet checklist item 4 already
  requires alignment claims be measured on **both** elements.
- **F-8** is a drag clamp, only observable by resizing. The state vocabulary is
  `rest`/`hover`/`active`/`focus`/`focus-visible`/`disabled` — nothing scripts an interaction.
- **F-10** is a deployment note about the future `src/ui/` component; nothing exists to anchor.

Layout-sizing is the category **most** friendly to mechanical measurement, and the runner reaches
roughly two thirds of it. **Recommendation: extend M2 with a relational check kind and a scripted
interaction state before anchoring at scale**, or a large share of the remaining ~150 rows will have
nowhere to land.

**Reviews are deliberately NOT submitted to the corpus yet.** The reviewers examined the pre-fix code;
a passing verdict now would cite evidence from a different commit. A second review round against the
fixed code is the correct next step — that is the loop working, not a blockage.

**M7 step 1 is done — every divergence can now say what it is actually about.** Migration 010 adds
`divergence_subject` and `divergence_property` as tables, plus `subject_state` and `relation` on
`divergence`. **10 divergences declared: 8 subjects, 24 properties.**

Until now a row carried a title, prose, sometimes an image, and — for 7 of 154 — one anchor. It never
carried a machine-readable statement of *which elements, which properties, in which state*. That one
absence starved three consumers at once, which is why it came before the rest of M7:

- **The human** — the reason it exists. A row could be *located* but not *explained*: the widget knew
  which element, never which property, so it could not call the thing out.
- **The runner** — its two structural gaps are exactly the two fields a single anchor cannot express:
  `relation` (F-4 gap, F-9 pitch, F-11 containment — each a claim about **two** elements) and a
  scripted `state` (F-8, a drag clamp).
- **The M7 sweep** — "mark stale every evidence row whose check touches the affected property" needs
  an affected property to match against.

**The shape is uniform across every category** — *these subjects, in this state, differ on these
properties* — and only the **rendering** varies, keyed by property type (`length` → dimension overlay,
`color` → swatch in situ, `text` → line box drawn, `time` → replay, `keyword` → both literals,
`layer` → stacking). Five renderers for 154 rows is what stops this becoming 154 bespoke
visualisations.

Two design points worth not re-litigating:

- **Origin gets a selector; the adjusted side gets an attribute.** §5.5 prefers attributes because
  selectors rot on refactor. That holds for bidezine. It does **not** hold for origin — vendored
  material we may not edit, so no attribute can be added, and frozen by that same rule, so a selector
  cannot rot. The exception is safe for exactly the reason the rule exists.
- **The state vocabulary is the runner's own, exactly.** A declaration naming states the runner cannot
  drive would describe checks nobody can perform. `transition` is absent deliberately, not forgotten.

Properties and state are **derived** from the committed check specs — a divergence's properties are by
definition what its checks assert — and `property_type` comes from `scripts/lib/property-type.mjs`,
the single source of that mapping. **`node scripts/check-declarations.mjs` (5/5)** is what stops the
declaration becoming decoration: stored types are re-derived and compared, declared and asserted
properties must match **in both directions**, no relation may concern exactly one subject, and every
bidezine subject must name an anchor a real spec measures.

F-4/F-9/F-11 declare their relation with **no subjects yet** — true today, since no anchors exist for
claims the runner cannot measure, and inventing anchor ids would put a falsehood in the table.

**Milestone 6 is COMPLETE — the evidence widget and an approval gate no actor can open.**
All three acceptance criteria met, verified against a real production build.

- **The toggle is computed, not asserted.** `app_rw` is DENIED `UPDATE` on `divergence.state`, so
  `usp_resolve_divergence` is the only path and it recomputes the gate itself. The greyed-out button
  is a courtesy — **POSTing anyway returns 409 with the gate's own refusal text.** Verified by
  *attempting* it, at two different unmet requirements.
- **Approving takes 3.3s** from click to a legible verdict, measured in a real browser. M6's hard
  requirement is "about a minute".
- **Reopen cascades**, requires a reason, and writes a `false_completion` attached to the requirement
  type that was falsely passed.
- **`npm --prefix sandbox run verify` — 18/18**, on a fixture it creates and removes. Every other
  milestone has a proof suite; this is M6's.

**Four real defects, every one found by running it rather than reading it:**

1. **The gate let a reopened row be re-approved on the very review that wrongly passed it.** Reopen
   wrote the record and moved the state correctly, then reported **zero** unmet requirements. M6's own
   spec text requires "the review based on the old state is invalidated" and the procedure did not do
   it. **Migration 007** adds `review.invalidated_at`; **008** backfills already-reopened rows.
2. **I reverted migration 005 while writing 007.** `CREATE OR ALTER FUNCTION` replaces the whole
   object, and 007 restated the body by copying it from **003** — the version before 005 amended it.
   005's rule is that evidence must be able to FAIL on its own terms; without it **a passing
   screenshot satisfies the gate**. That hole was live between 007 and 009. Caught by
   `verify-runner.mjs`, the suite that exists for exactly this — **nothing else would have noticed**,
   because every M6 check still passed on `measurement` evidence. **Migration 009** restores it and
   states its lineage. **Lesson for any future migration: derive a `CREATE OR ALTER` body from the
   LIVE object, never from the migration you happen to remember. The diff cannot show what is
   missing — 007's looked like a clean one-clause addition.**
3. **The widget showed the previous row's evidence while the next one loaded** — gate verdict,
   evidence and Approve state under the new row's heading, every control live. In a tool for deciding
   whether something is proven, that is the worst failure available. It clears first now, and ignores
   responses that arrive after the operator moved on.
4. **The M6 suite passed 18/18 while failing to clean up.** `mssql.connect()` returns a
   process-global pool, so closing the RUNNER connection closed ADMIN's too and left the fixture in
   the real database. It reconnects for cleanup now.

**`verify-import`'s "every row sits at `legacy_unverified`" check was retired for a stronger one.** It
was right for M4 and became wrong the moment a row legitimately reached `resolved` — a check that goes
red the first time the system is used as designed protects nothing. It now asserts every row is in a
real lifecycle state, and that **no row is `resolved` without the human approval only the gate can
write**.

**Real corpus data was touched, deliberately and traceably.** F-2 was approved and then reopened
during M6's acceptance run, before the permanent fixture-based suite existed. Both records stand —
the `false_completion` reason says exactly what it was — because deleting an approval or a
false-completion is precisely the history-erasure this system forbids. **Four review verdicts were
also submitted** for F-2/F-3 (pass) and F-7/L-34 (fail), recording what the four adversarial
reviewers actually found. F-3 is currently the one row with an open gate.

**M5 step 4 — the hand-written divergence data is gone; the corpus is authoritative.** The app renders
all 154 rows from Fabric alone, verified **9/9 against a real production build** with the array removed.

- **Step 4 could not be done literally, and this matters for anyone reading the spec.**
  `sandbox/src/data/rail-sidebar.ts` exports **27 things**; only `divergenceCategories` was ever
  migrated. Phases, blocking questions, risks, proposed tokens, logo paths and every shared **type**
  are used across 8 files and have nowhere in the schema to live. Only the 235-line migrated array was
  removed; a comment in its place records why and what stayed.
- **The frozen snapshot is run EARLY, on purpose.** Deleting the array would otherwise have left 154
  hand-written decision records in exactly one Fabric database — and Rail Sidebar is at **0 of 154 rows
  resolved**, nowhere near the promotion at which SANDBOX-SPEC §4.1 expects a snapshot. So
  `scripts/emit-corpus-snapshot.mjs` emits **`db/snapshots/rail-sidebar.json`** — 154 rows, each with
  its verbatim `originRecord` — committed to git.
- **Because that snapshot is FROZEN, the two scripts that read the deleted file were RE-POINTED rather
  than retired** (which is what the spec prefers). All four proof suites survive:
  - `verify-import` now diffs the **live corpus** against the frozen snapshot. Its meaning changed
    honestly: it no longer proves the import was lossless (settled, and the source is gone) — it
    detects **corpus drift**. Still 8/8.
  - `import-rail-sidebar` now rebuilds the corpus **from** the snapshot. It stops being a spent
    one-off migration tool and becomes the **restore path** — the corpus is authoritative, which means
    the corpus is also the thing that can be lost. Dry-run rebuilds all 154 rows from git.
  - `check-corpus-equivalence` compares the app's **rendered** view against the snapshot — a different
    claim from `verify-import`'s stored-row check, since a field can sit in the database perfectly and
    still be dropped on the way out.
- **None of this is circular, and that rests entirely on the snapshot staying frozen.** It is
  regenerated only by deliberately running the emitter. **If anyone regenerates it to make a check
  pass, the check was working** and the real question is why the corpus changed. Noted in each file.

**M5 step 2 — N components from the corpus — is done and verified.** The app no longer imports one
occupant's divergences from a TypeScript file; it reads components, categories and rows from Fabric
and offers a picker. **9/9 live checks against a real `vite preview` production build**, not only the
dev server.

- **`sandbox/server/corpus-api.mjs`** holds the `app_rw` credential and serves `/api/corpus`. It runs
  inside the Vite process (not a second server), and is mounted on the **preview** server too — a
  dev-only data path would leave the production build never exercised against real data, which is
  precisely the gap checklist item 15 was written about. `app_rw` and nothing else: if a query is
  refused, that refusal is the system working, and the fix is a deliberate grant in a migration.
- **Offline behaviour — the spec's deferred M5 decision, now settled.** Every successful read writes
  `sandbox/.corpus-cache.json` (gitignored). When Fabric is unreachable the API serves it flagged
  `stale: true`, and the app shows a banner with the snapshot's age and the real failure reason.
  **Proven by pointing the connection at an unreachable host:** 154 rows still served from a 534KB
  snapshot. With no connection *and* no cache it errors rather than rendering an empty list, which
  would be indistinguishable from a corpus that genuinely has no rows.
- **Previews stay per-occupant code** (`PREVIEW_REGISTRY`) — a renderer that draws an arbitrary
  component from a database row is not a thing. A component with no entry still shows its phases and
  full divergence list with an explicit "no preview registered" panel, so the app's view of the corpus
  matches the corpus, stray `__dbg__` row included.
- **`scripts/check-corpus-equivalence.mjs` — 154/154 rows equivalent**, field by field including every
  `visual` payload. This is what step 4 needs, and it is a **different claim** from `verify-import`:
  that proves the corpus is a lossless copy of the file; this proves the app's *rendered view* is
  unchanged by swapping the source. A field can round-trip into the database perfectly and still be
  dropped on the way back out, so both are needed before the file goes.
- Two bugs found while verifying rather than after: the app defaulted to the stray `__dbg__` fixture
  (it sorted first alphabetically — real occupants now sort ahead of `__`-prefixed fixtures, still
  listed rather than filtered), and backticks inside a SQL comment terminated the JS template literal,
  producing a parse error far from its cause.

**M5 step 3 — click-to-highlight — is done and verified.** Clicking "Highlight in preview" on a
divergence row draws a ring over that exact region in the live component, labelled with the ref.
**7/7 live checks**, including the two that are M5's own "done when" criteria: the overlay sits over
the anchored region with **0.00px delta on all four edges**, and the region is **still the hit-test
target** while highlighted, so it stays hoverable, clickable and resizable.

- **`sandbox/src/components/DivergenceHighlight.tsx`** — a `position: fixed`, `pointer-events: none`
  overlay drawn *beside* the anchored element, never on it. Styling the element itself would change
  the very computed styles and box the verifier measures, so the UI and the evidence would disagree
  about the same element. It re-measures on `resize`, on `scroll` (with `capture: true` — the
  scrolling element is a descendant `ScrollArea` viewport, so a plain window listener never fires),
  via `ResizeObserver` on the target, and via `MutationObserver` for rows that genuinely unmount
  (a tree row inside a collapsed group). An ambiguous anchor highlights **nothing**, matching how the
  runner treats it — showing whichever matched first is how a human ends up confidently looking at
  the wrong element.
- **`useAnchoredRefs()`** reads which refs exist from the **live DOM**, so the list cannot advertise a
  region it can't show, and the coverage gap (7 rows offer the control, ~147 don't) is visible in the
  UI for free rather than needing separate reporting.
- The divergence row was a raw `<div>` wearing `Card`'s own classes — a hand-rolled approximation of a
  primitive the same file already imports. Swapped to the real `Card`/`CardHeader`/`CardContent` and a
  real `Button` while adding the control, rather than layering new behaviour onto a fake one.

**Found by rendering it, which a code read would not have caught:** F-3's row title still says
`panelW = 300px (default panel width)` while its own detail explains the decision resolved to **256**
— visibly contradicting itself on screen. Same class as L-34's false "Schedules" claim, on a different
row. **Not corrected** — flagged for a decision, since correcting an imported record is a policy
choice, not a typo fix.

**Mechanics of anchoring, needed by anyone adding more — each found by measuring, not by reading:**

- **`FunctionalRailSidebar` is mounted twice** (a `dark:hidden` copy and a `hidden dark:block` copy,
  both always in the DOM, one merely `display:none`). A `data-divergence` written straight into the
  markup matches two elements, and the runner fails an ambiguous anchor by design. Anchors are
  therefore opt-in per instance (`anchors` prop → `lib/divergence-anchors.tsx`), enabled on the light
  copy only.
- **A `useContext` call in the component that RENDERS the provider reads the value above it**, not its
  own — it would silently emit no attributes, with no error. `FunctionalRailSidebar` passes its own
  prop to `anchorAttrs`; only descendants use the hook. Both share one implementation so they cannot
  drift.
- **`spec.anchor` and `spec.divergence` are SEPARATE fields.** Only `divergence` is looked up in the
  database; the anchor is just a DOM string. So several specs can measure different elements and write
  evidence to the same row (that is how `F-2-icon` works) — a divergence asserting several things is
  fully checkable, contrary to what the one-anchor-per-spec shape first suggests.
- **An anchor must resolve to exactly one element**, so evidence proves that instance, not the class:
  F-2 proves the first rail button is 38×38, not that all 27 are.
- **`getComputedStyle().width` reports the BORDER box under `box-sizing: border-box`** (Tailwind sets it
  globally), not the content box. An F-1 expectation written the other way round produced a failing
  evidence row — the runner catching a genuinely wrong expectation, which is the property M2 exists to
  have.

**Two loose ends noticed while doing step 1, neither touched:**

- The corpus holds a stray `__dbg__` component (state `build`, 1 divergence) alongside `rail-sidebar`.
  Leftover debug data; left in place rather than deleted unilaterally.
- `sandbox/src/App.tsx` (the `RailSourceToggle`, ~lines 180–203) renders raw `<button>` elements
  styled to look like real ones — a "no hand-rolled components" violation, which CLAUDE.md explicitly
  does **not** waive for sandbox tooling. Out of scope for the quarantine work; worth its own pass.

**Worth doing early in M5:** the 154 imported rows have no `anchor_id`/`anchor_file`, so the
verifier has nothing to measure for any of them. Anchors have to be added to the real markup before
any of those rows can leave `legacy_unverified`.

**M7 step 4 — the invalidation sweep.** Migration **013** adds `divergence_dependency` and
`fn_system_change_blast_radius`, and puts the sweep inside `usp_land_system_change` so it fires on
landing rather than on remembering to run it. `scripts/lib/dependencies.mjs` +
`scripts/scan-dependencies.mjs` resolve each divergence's real import graph
(`buildExportMap` expands the wildcard re-exports in `src/index.ts`, 194 declared names → **460**
resolvable ones — without that expansion almost every `@bidezine/system` import resolves to nothing).
Proven end to end: landing a change touching `src/ui/**` swept exactly the 7 divergences that genuinely
depend on a primitive and marked their 40 evidence rows stale.

**Three things step 4 found that were not what it went looking for** — all three are now written up
durably in `SANDBOX-PROTOCOL-LOG.md`'s flaws log, so this summary can be deleted from here whenever
someone is tidying:

- **`evidence.current` has been vacuously passing since M1.** The gate's requirement reads
  `JOIN sandbox.source_file sf ON sf.path = d.anchor_file` — and `anchor_file` was **NULL on all 155
  rows**, so the join matched nothing, no unmet row was emitted, and "this measurement is not older
  than the code it describes" was satisfied by having nothing to compare. `source_file` was empty too.
  Found only because the sweep needed the same column. Fixed: `declare-divergences.mjs` now locates
  each anchor in the real markup and populates `anchor_id`/`anchor_file`, and `sync-source` fills
  `source_file`. **A requirement that cannot fail is not a requirement** — worth grepping the other
  four for the same shape.
- **Migration 014 exists because 013 was right for the wrong reason.** Every swept row came back
  labelled *"no recorded dependencies — swept because unscanned is not the same as unaffected"* when
  all 7 had in fact matched by real dependency, caused by a leftover `LEFT JOIN ... ON 1 = 0`. The
  reason is not decoration: "re-verify this" and "go and add an anchor" are different jobs, and a
  sweep that always says the second trains people to ignore it.
- **The proof suite was contaminating the corpus while reporting 17/17.** Its fixtures used realistic
  `affected_paths` (`src/ui/**`, `src/lib/**`) and one of them LANDS mid-suite — so every run silently
  marked all 40 real evidence rows stale. Both fixtures now use `__fixture__/` paths that nothing real
  depends on; the sweep section moved from `swept_divergences: 8` to `1`, and a post-run count confirms
  **40 evidence rows, 0 stale**. A fixture that mutates production data is worse than no fixture — it
  passes, so nobody looks.

**M7 step 5 — batch re-verification.** `run-checks.mjs --stale [--component=<slug>]`, wired as
`npm --prefix verifier run recheck`. It asks the database which divergences carry stale evidence and
re-runs exactly their specs. Two design choices are what make it worth having rather than a loop:

- **It reports the part of its own work it cannot reach, and exits non-zero for it.** A stale
  divergence with no check spec cannot be re-verified by this runner at all — and with 154 rows against
  8 specs, that is most of the corpus. A batch that skipped them silently would print "13/13 passed"
  while leaving the corpus as stale as it found it. `verify-runner.mjs` proves this with a fixture row
  (`T-NOSPEC`) that deliberately has no spec on disk.
- **It re-reads the gate afterwards, because clearing staleness is not clearing the gate.** Shown live:
  after a clean re-run all 7 rail divergences were still UNMET — six on `review.present`, and **F-3 on
  `review.citations_support`, naming evidence #129 which is stale**. That one is structural and worth
  knowing: a citation points at a specific `evidence_id`, a fresh measurement is a NEW row, so
  re-running can never clear it. **A human has to re-review.** Correct — a system change invalidated
  the measurement the judgement rested on — but it means "one command" restores the measurements, not
  the verdicts.

**Proven end to end against the real corpus, then rolled back:** landed a `src/ui/**` change → 7
divergences swept, 40 evidence rows stale → `--stale` re-ran all 7, **13/13 passed**, 13 fresh rows →
restored to **40 rows, 0 stale, same max evidence id, component state unchanged**.

### What's next

**M8 is in progress — multi-machine ownership and visibility.** Its five steps:

1. ~~**Migration 015 — ownership becomes real**~~ — **done.** `machine` seeded with the three real
   names, `owner_name` dropped (commit `277ecf9` decided machines are identified by machine, not by
   person, and a NOT NULL column would force back exactly what that removed), `ownership_transfer`
   audit table, `usp_transfer_component`, and a `DENY UPDATE` on `owner_machine_id` so the audit row
   and the ownership change cannot come apart.
2. ~~**Migration 016 — the write guard**~~ — **done.** `usp_resolve_divergence` and
   `usp_promote_component` now require a `@machine` argument and refuse when it is not the owner.
3. ~~**`db/verify-ownership.mjs`**~~ — **done, 16/16.**
4. **The machine switcher in the Sandbox app** ← **START HERE.** §6's first done-when is "you can watch
   another machine's component progress and cannot write to it" — the second half is now enforced in
   the database, and the first half needs the app to actually let you look.
5. **`HANDOFF.md` shrinks to a pointer.** §6's third done-when: "nothing depends on hand-maintained
   markdown for cross-machine state." Not to be done before step 4 — deleting the only cross-machine
   record before its replacement is visible would leave a gap rather than close one.

**Three things worth knowing before continuing M8:**

- **The database cannot tell the three machines apart, and this is written into migration 015 rather
  than left to be discovered.** All three authenticate as the SAME `app_rw` service principal — the
  four principals are divided by ROLE, not by machine (`.env.example`). So `@machine` is asserted by
  the caller, not proven by the connection. What the guard buys is real but bounded: an honest machine
  cannot write to another's component **by accident**, which is the failure `HANDOFF.md`'s "only edit
  your own section" rule actually exists to prevent, and every transfer is audited. It does not stop a
  caller that lies. Closing that needs one service principal per machine plus per-machine roles — real
  Fabric portal work that cannot be done from a migration, so it is a decision to take deliberately,
  not something to half-build.
- **Reopen and block are deliberately NOT ownership-gated.** They RAISE a concern rather than settle
  one, and gating them would mean the machine most likely to spot a defect is the only one forbidden
  from saying so. `verify-ownership` checks this directly, because "read-only observer" quietly
  becoming "silent bystander" is the kind of regression nothing else would catch.
- **`usp_promote_component` has no caller anywhere in the repo.** Confirmed by grep across
  `db/`, `mcp/`, `sandbox/`, `site/` and `verifier/`. It is exercised only through migrations, so
  component promotion — as opposed to divergence resolution — is not yet wired to anything a human or
  an agent can reach. Pre-existing, not introduced by M8, but M8 is when it became visible.

---

**M7 is COMPLETE.** All three "done when" criteria are closed and demonstrated. The notes below record
what the work learned that §6's list does not say — keep them for M9, they are not a to-do list.

**The five steps, all done:**

1. ~~**The divergence declaration** — subject, property, state, relation~~ — **done.** See "What's
   done". It went first because the other steps had nowhere precise to land without it.
2. ~~**Scope detection from the diff**~~ — **done.** `scripts/lib/scope.mjs` (the rule),
   `scripts/detect-scope.mjs` (the command), `.github/workflows/scope-detection.yml` (runs on every
   PR and push). **17/17.** Two things to know before extending it:
   - **The rule set is wider than §5.7's two examples, deliberately.** `tokens/` and `src/ui/` alone
     would classify a change to `src/lib/action-icons.tsx` as component-local — and checklist item 15
     records that a change there silently stopped **every** icon filling on hover in production. Each
     added path carries the evidence that put it there. This is a judgement about the **rule**, made
     once and recorded — not the per-change judgement §5.7 forbids.
   - **Tooling deliberately does NOT escalate** (`db/`, `mcp/`, `scripts/`, `sandbox/`, `site/`,
     `origin/`). A rule set where everything is system-wide makes escalation meaningless (§9's
     over-ceremony risk). Verified against real history too: run on commit `0c58cd3` it reports
     SYSTEM, picking the two `src/ui/` files out of 126 changed.
   - **The CI job reports; it does not block.** It could now route to a system_change (step 3 exists),
     and a gate blocking with nowhere to go only teaches people to bypass it. Exit code **10** means
     system-wide — not 1, so a real crash stays distinguishable from a detection.
3. ~~**`system_change` lifecycle**~~ — **done.** Migrations 011 + 012, four MCP tools, **13/13**.
   - **A real hole closed:** `system_change.state` had no `DENY`, and 002 grants `agent_rw` UPDATE on
     the table — so an agent could `UPDATE ... SET state='approved'` and approve its own proposal.
     Invariant 1 with nothing behind it, on the entity §5.6 calls a multiplier.
   - **Agents propose and assess; humans approve, land and reject.** Mirrors the divergence split
     exactly (an agent may reopen; only `app_rw` may resolve).
   - **012 fixed a design error in 011, caught by the schema itself.** `block_divergence` set
     `blocked_by` without `state`, and `ck_divergence_blocked` refused it — *"'blocked' is not a
     mood."* Blocking now also moves the state, and `blocked_from_state` remembers what to restore,
     so unblocking is lossless.
4. ~~**The invalidation sweep**~~ — **done.** Migrations 013 + 014, `scripts/lib/dependencies.mjs`,
   `scripts/scan-dependencies.mjs`, **17/17**. Both halves of §6's first "done when" are covered:
   landing marks affected evidence stale AND drops an already-`promoted` component back to `reopened`
   with its `promoted_commit` cleared (`fn_component_unmet` would refuse a *future* promotion, but it
   has no opinion about one that already happened). Details in "What's done".
5. ~~**One-command batch re-verification**~~ — **done.** `npm --prefix verifier run recheck`
   (`run-checks.mjs --stale [--component=<slug>]`), proven in `verify-runner.mjs`, now **18/18**.
   Blocking was already working — `usp_block_divergence` plus the `sandbox_block_divergence` MCP tool,
   and the gate reports `divergence.blocked` naming the change. Details in "What's done".

**Step 4's design question, decided and now implemented:** *how does the sweep know which evidence a
system change affects?* **Derive the dependency from imports, and default to over-invalidating.** For
each divergence, resolve its `anchor_file` through its own import graph down to which `src/ui/*`
primitives and `tokens/*` it depends on — `FunctionalRailSidebar.tsx` imports `Button`, so F-2 provably
depends on `src/ui/button.tsx`. Mark stale any evidence whose divergence's dependency set intersects
the change's `affected_paths`.

**And when the scan is unsure, mark it stale.** A false "stale" costs one batch re-run; a false
"current" is a false green. The asymmetry is not close. *(Rejected: matching on `anchor_file` alone —
F-2's anchor lives in `sandbox/`, so a `Button` change would not touch it, missing the exact case M7
exists for.)*

**What M7 already has waiting for it.** `evidence.is_stale` exists and the gate already honours it —
the sweep has a column to write to and a gate that will react. `review.invalidated_at` (migration 007)
is the same idea for reviews, and is likely right when a system change invalidates a *judgement*
rather than a *measurement*. `sandbox.system_change` has carried `affected_paths` since migration 001,
with a comment reading *"JSON array of path globs this change touches. Drives the staleness sweep"* —
M7 was designed into the schema from the start. `db/snapshots/rail-sidebar.json` is the frozen
snapshot its "mark the snapshot stale" step refers to. CI exists (`.github/workflows/`), so
"automatically" has somewhere to live.

**Riding on step 1, whenever wanted, without re-deciding anything:** the widget's renderers (five,
keyed by property type) and the runner's two missing capabilities (relational geometry, scripted
interaction). Both now have a declaration to read.

**Two things worth doing regardless of milestone order:**

1. **Extend the M2 runner, before anchoring at scale.** Anchoring category F end-to-end found that the
   runner cannot express two whole classes of check — and layout-sizing is the category *most*
   friendly to mechanical measurement, yet it reaches only about two thirds of it:
   - **Relational geometry.** F-4 (rail-to-panel gap), F-9 (rail item pitch) and F-11 (footer
     bottom-anchoring) each assert a relationship **between two elements**. A spec addresses exactly
     one anchor and `box` returns that one element's rect. Meanwhile checklist item 4 already requires
     alignment claims be measured on *both* elements.
   - **Scripted interaction.** F-8 is a drag clamp, only observable by resizing. The state vocabulary
     is `rest`/`hover`/`active`/`focus`/`focus-visible`/`disabled` — nothing drives a sequence.

   Anchoring the remaining ~147 rows first would mean discovering mid-way that a large share has
   nowhere to land.

2. **UNVERIFIED — does the Sandbox app's Tailwind scan `origin/`?** The quarantine is proven for
   imports, bundles, CSS cascade and JS realm (see "What's done"), but this one question was raised
   and deliberately not answered. `CLAUDE.md`'s `source(none)` pin protects `reference/shadcn-ui/` for
   the **main** stylesheet; the Sandbox app has its own Tailwind setup, and `origin/` is **committed**
   rather than gitignored — so v4's auto-detection would not skip it on that basis. If it IS being
   scanned, origin's class names are compiling utilities into the Sandbox's stylesheet. That is
   stylesheet bloat and a drift risk rather than a rendering bug, but it is unmeasured and should not
   be described as covered until someone checks. Cheap to settle: grep the built
   `sandbox/dist/assets/*.css` for a utility only origin uses.

3. **The independence check is weaker than it looks — a candidate for M9's enforcement list.**
   `sandbox_submit_review` takes `author_agent_id` AND `builder_agent_id` as **caller-supplied
   strings**. The database enforces they *differ*, not that they correspond to genuinely different
   actors. Independence is structural on the values, self-declared on the reality. Worth a
   flaws-log entry.

**Review has a termination rule — apply it, don't re-review by default.** One round per batch of work;
fix what it finds; **re-review only if a fix touched code shared by other rows.** A round that finds
nothing new ends it. Without this the anchor → measure → review → fix cycle has no exit and reads as a
loop rather than progress. Applied to round one: the F-7 fix touched only the footer and the L-34 fix
touched only records, so **no second round is owed**.

**Left deliberately undecided, flagged rather than fixed:** F-3's row title still reads
`panelW = 300px` while its own detail explains the decision resolved to **256** — the card contradicts
itself on screen. Same class as L-34's false "Schedules" claim, on a different row. Correcting an
imported record is a policy call, and only L-34's correction was authorised.

Still genuinely open on Rail Sidebar, unrelated to the Sandbox build: divergence categories I
(elevation) and J (z-index); and four risk items honestly unfinished — R-3c/R-11c (no dedicated
Independent Audit agent has run against the whole component), R-5b (token-collision check, deferred
to Promote time), R-9b (Escalation-agent verification of Collapse's deterministic unmount).

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
