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

**Baseline** — branch `main`, last verified commit `ecd9939`, working tree clean, in sync with
`origin/main`. Verify this yourself (`git log --oneline -1`, `git status`) before trusting anything
below it.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`). A formal
primary/satellite rename of all three machines is deliberately deferred to Sandbox Milestone 8 —
see `docs/SANDBOX-SPEC.md` §8. Renaming earlier would break Laptop B's local, gitignored `.env`,
which cannot be fixed from here.

### Active task

**Sandbox Milestone 5 is COMPLETE.** M1–M5 are built and verified. All four of M5's own "done when"
criteria are met: origin material provably cannot reach the translation pane (a deliberate crossing
import fails the build), clicking a divergence highlights the exact region in the live component, that
region stays hoverable/clickable/resizable while highlighted, and the hand-written data file was
deleted only after the database path was proven equivalent.

**Nothing is in progress.** See "What's next" for where M6 starts and what it needs first.

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

**Four proof scripts. Re-run ALL of them after any change under `db/`, `verifier/` or `mcp/`:**

```
npm --prefix db run verify                 # 15/15 — the gate and its permissions
npm --prefix verifier run verify           # 12/12 — the runner is worth trusting
npm --prefix mcp run verify                # 14/14 — the agent surface, over the real protocol
npm --prefix db run verify-import          #   8/8 — corpus vs the FROZEN snapshot (drift detection)
node scripts/check-corpus-equivalence.mjs  # 154/154 — what the APP renders vs that same snapshot
```

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

### What's next

**Milestone 5 is complete** (`SANDBOX-SPEC.md` §6): all four steps done and verified. **M6 is next —
the evidence widget and the approval gate.** Read §6's M6 section before starting; the notes below are
what this session learned that its "done when" list does not say.

**Two things M6 needs before its own work makes sense:**

1. **Submit the four outstanding review verdicts.** F-2/F-3/F-7/L-34 have passing evidence; the gate
   lists only `review.present` as unmet. The reviewer must not be the builder — the database enforces
   that, it is not a convention. **A weakness worth knowing:** `sandbox_submit_review` takes
   `author_agent_id` AND `builder_agent_id` as caller-supplied strings. The database enforces they
   *differ*, not that they are genuinely different actors. Independence is structural on the values,
   self-declared on the reality. That belongs in the flaws log, and possibly in M9's enforcement list.
2. **Extend the M2 runner, before anchoring at scale.** Anchoring category F end-to-end found that the
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
