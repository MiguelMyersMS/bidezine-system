# Follow-ups — parked backlog

> ## ⛔ Nothing in this file blocks new work — read this before treating it as a to-do list
>
> **The only REQUIRED gate is CI (`.github/workflows/ci.yml` → `npm run health:strict`).** If that is
> green and `master` is pushed, you are done and free to start the next thing.
>
> - **The evidence gate is ADVISORY BY DESIGN** — `.github/workflows/evidence.yml` line 7 says so in
>   writing: *"STATUS: ADVISORY (non-required)"*. An unsigned or stale evidence bundle is **not a
>   defect and not a blocker**. It means a component shipped and works, and an *optional* pixel-diff
>   against Figma has not been re-run since it last changed. RailNav is the canonical example: it is
>   deployed and working in production, and its bundle is merely unsigned.
> - **`consumer-sync.yml` is `continue-on-error: true`** — informational only.
> - **Re-seal ON TOUCH, not as backlog.** A component's bundle gets refreshed when you next edit that
>   component, as part of that work. Unsigned bundles are therefore **zero tasks** until then. Do not
>   schedule seal-only work; do not let a seal block a release.
>
> **Why this header exists (2026-08-02):** three days went into treating this advisory list as a debt
> gate that had to be paid before new work could start. It never could be — the waves append follow-ups
> faster than they close, and a single sweep found seven items that were already DONE and never checked
> off. Items below are **parked**, not pending-on-you-today. Add to `## Blocking` ONLY something that
> genuinely stops a merge or a deploy.

The committed, branch-traveling list of parked items: deferred decisions, owner actions, notes recorded
for later, and known gaps. `/session-start` reports the count but must present it as **parked**, never
as work standing between you and shipping.

**Conventions (so this stays the single source, not a fourth drifting copy):**

- **Owner/actionable items live HERE only.** Other docs (e.g. `FACTORY_LINE.md`) *link* to this file —
  they must not restate an action, or the copies drift.
- **Record:** add a `- [ ]` line immediately under `## Open` (the AI appends + commits it when you say
  "record a follow-up: …"). Recording is committed so it can't be silently reverted.
- **Close:** when the commit that finishes an item lands, check it off (`- [x] … (done <sha> <date>)`)
  and move it to `## Done (recent)` in the same commit. Owner-decision items stay open until the owner
  closes them.
- **Prune:** keep `## Done (recent)` to entries since the last push; older done items live in git
  history, not here.

> **This file vs `MEMORY.md`:** this is the in-repo, branch-traveling, team-visible **backlog** (the
> actionable list). The local auto-memory `MEMORY.md` is the **cross-session pointer index** (orientation
> that loads automatically, not a task list). Actions go here; pointers go there.

## Blocking

Things that genuinely stop a merge or a deploy. **Keep this section empty.** If something lands here it
means CI is red or a release is stuck — fix it, then empty it again. An advisory audit finding, an
unsigned evidence bundle, or a stale Figma seal does **not** belong here.

- _(none — verified 2026-08-02: CI's `health:strict` is the only required gate, and `master` is green
  and pushed)_

## Parked

Everything below is optional, deferred, or an owner decision. **None of it stands between you and new
work.** Do not work this list top-to-bottom; pull from it only when it intersects something you are
already building.

- [x] ✅ CLOSED 2026-08-02 — **not a backlog item; promoted to DOCTRINE.** Moved to
  `docs/audits/LIFECYCLE.md` § 5b ("Evidence bundles — RE-SEAL ON TOUCH"), which is where a standing
  policy belongs. An unsigned or stale bundle is NOT a defect: the component shipped and works, and an
  optional pixel-diff has not been re-run since it last changed. Bundles are re-sealed when the
  component is next EDITED, as part of that work — never as scheduled seal-only sweeps. The current
  unsigned list lives in § 5b as INFORMATION, not as tasks.
### Everything else

- [x] ✅ CLOSED 2026-08-02 — **neither option; the premise was wrong.** Analysed the code rather than
  picking from the two offered options. `status:` was DELIBERATELY decoupled from verification, not
  accidentally left behind: `scripts/migrate-evidence-normalize.js:1-6` documents the "verified-flip
  decoupling" — status/lastVerifiedCycle/lastVision/checklist values **no longer contribute to the seal
  hash**. The verification record is the signed evidence bundle. Many specs also carry explicit comments
  like `# was verified but lastVision never ran to current bar — honest status`, i.e. they were
  downgraded ON PURPOSE for honesty (see the 2026-06-15 downgrade, `7f5af2f`).
  **Option (a) would REDDEN the required gate.** `audit-specs.js:350` makes a `verified` spec a BLOCKER
  unless every checklist item passes, all discrepancy verdicts are settled, AND `verify.lastVision`
  verdict is `pass` — those specs have `lastVision: {cycle: null, verdict: pending}`, which is exactly
  why they were downgraded. Flipping them = ~86 blockers = `health:strict` RED, for zero gain.
  **Option (b) already happened in the code.** Actual counts: 86 `implemented`, 73 with a signed bundle.
  Only real action taken: reworded the misleading `info` line that manufactured this item.
- [ ] **Two-laptop sync gap — narrowed 2026-08-02 to `databases-dashboard` ONLY.** Owner decision:
  `systems/data-model-system` and `apps/bloodwork-dashboard` are **declared single-laptop-only** and do
  NOT need a remote — that clause is closed, do not re-raise it. **Remaining:** `apps/databases-dashboard`
  has 9 unpushed commits and its only remote is the shared template org
  (`azure-data-intelligence-platform/Lyra-template`) which it must NOT be pushed to. Give it its OWN
  private repo, `git remote add origin <url>`, push all branches — or declare it single-laptop too.
  Protocol + live repo table: `docs/process/TWO-LAPTOP-WORKFLOW.md`.
- [x] ✅ **DONE 2026-07-26 — committed + pushed the `PRIMITIVES-FIRST-METHOD.md` doctrine addition** (real
  content, not scratch; resolves the earlier commit-or-revert decision). A real +10-line §3 paragraph (NOT scratch): *"In Figma, bind EVERY
  fill and stroke to a design-token VARIABLE — never a raw hex."* Discover vars via
  `figma.variables.getLocalVariablesAsync()`, match by name (`bgSubtle`/`ink`/`hairline`/`surface`/`accent`/
  `status*`/…), bind via `figma.variables.setBoundVariableForPaint(paint,"color",variable)`; before "done",
  flip the collection to Dark mode (`setExplicitVariableModeForCollection`), confirm re-color, then clear the
  override. Raw hex in a reflected node = a defect, same as a hardcoded color in code. It is intentional
  content that simply never got committed → should be **committed, not reverted**. Owner: confirm + I'll
  `git commit docs/process/PRIMITIVES-FIRST-METHOD.md`, or say revert. Recorded 2026-07-26.
- [x] ✅ **NARROWED 2026-08-02 — the scale-token-audit (PR #40/#41) re-seal item is now the 2-slug item at the
  top of this list.** Verified against master: `contenttitle`, `slider`, `panelheader`, `menuitem`,
  `menuitemdark` all carry `signature.json` + `verdict.md` and are DONE; only `selectbutton` +
  `tablecolumnheader` remain unsigned. The `select` clause was already resolved 2026-07-26 (see below).
  Slider's full-seal caveat is preserved here for the record: a *complete* Slider seal would also need
  per-interaction-state variants added to the Figma `Atom.Slider` (currently `type=range/single` only).
- [x] ✅ **DONE 2026-07-26 — `select`/`SelectDropdown` evidence gap CLOSED** (rebuilt + sealed this session:
  `SelectDropdown` panel pixel-sealed vs 783:4815 PR #45 `0def396`; `SelectField` control pixel-sealed vs
  783:4809 PR #46 `e72a48b`; old `Select.tsx` DELETED PR #44 `795638a` → the `slugForFile()` mismatch is
  dissolved; doer≠checker verdicts pass; exemption dropped; flexibility principle preserved via
  `feedback_figma_is_example_not_mandate`). Historical detail retained for the record: **`select`/
  `SelectDropdown` evidence gap** — no real evidence bundle ever existed, and the Figma node it was bound
  to no longer resolved. Root cause:
  `scripts/lib/evidence.js`'s `slugForFile()` derives the slug `select` from `Select.tsx`'s basename,
  but the actual spec file is `docs/atomic/organism/selectdropdown.spec.md` — a naming mismatch that
  means `select` was only ever covered by the coarser baseline-grandfather mechanism, never a real
  sealed bundle. A token-hygiene edit broke that grandfather clause (`EV.BASELINE-DRIFT`), and
  attempting a real capture failed: Figma node `296:3919` in file `EyYETHXMDDURPGK4PXTU5C` no longer
  resolves (confirmed independently two ways — the `evidence:capture:figma` script errored, and
  `figma-write-get_metadata` with no nodeId shows the file's only top-level pages are now `Atoms`
  (`0:1`) and `Molecules` (`597:3409`) — **no Organisms page exists in the file at all currently**).
  This is Golden Rule #4 territory (Figma is source of truth) — needs owner/scout action to locate or
  re-author the SelectDropdown node in Figma before any capture can proceed; the builder should not
  guess-fix a replacement node. **Next attempt checklist:** (1) confirm an Organisms page (or renamed
  equivalent) exists in `EyYETHXMDDURPGK4PXTU5C`, (2) get the current SelectDropdown node id, (3) fix
  the `slugForFile()` mismatch or add an explicit slug alias so `select` maps to
  `selectdropdown.spec.md`, (4) re-run `/evidence-pipeline selectdropdown`. Recorded 2026-07-25 per
  owner direction to track this durably rather than let it silently block again.
  **UPDATE (this session):** the owner's newest Figma payload supplies a fresh composed reference
  frame for this exact organism — `Select` (organism example) at node `783:4808`, page `783:4532`,
  same file `EyYETHXMDDURPGK4PXTU5C`. An Organisms page DOES exist again (contra the note above,
  which is now stale). Full anatomy fetched and mapped this session:
  - `SelectContainer` (783:4809): `Molecule.ContentTitle` + `Molecule.SelectTrigger` +
    `Molecule.FeedbackText` — all 3 already audited, no drift.
  - `SelectDropdown` (783:4815): `SearchBar` → `Divider` → `ListSection` wrapping a scrollable
    `SelectPanel` (783:4821) + `Atom.Scrollbar`.
  - `SelectPanel` (783:4821) is a genuine 2-level tree: `Molecule.SelectHeader` group headers
    ("Selected"/"Available", `296:4796`) each containing `Molecule.SelectRow` (`292:4166`) at
    `depth=0` (expandable parent, e.g. "America") and `depth=1` (nested leaf, e.g. "Canada"/"USA"/
    "Mexico", indented via `Atom.NavIndentLine` `207:3584`). Rows use `Atom.ChevronTrigger`
    (`292:3970`) + `Atom.SelectionIndicator` (`292:3716`, multi-checkbox incl. mixed state) +
    optional `Atom.Badge` (`433:1699`) count pill.
  - `ActionMenu` (783:4834 → `ScrollableContent` 783:4837): a FLAT 3-item `Molecule.MenuItem`
    (`139:3594`) list — "Search box" (checkmark toggle), "Selected group" (checkmark toggle),
    "Preset selections" (chevron nav item, `bodyS`/muted, no rows expand under it in this static
    frame). **No 3rd-level menu nesting — Golden Rule #2 is NOT violated** (chevron here indicates
    a separate popover on activation, not inline sub-rows).
  - **Code reality check:** `SelectRow.tsx`, `SelectHeader.tsx`, `SelectionIndicator.tsx`,
    `NavIndentLine.tsx`, `ChevronTrigger.tsx`, `Badge.tsx`, `Menu.tsx`/`MenuItem.tsx` all already
    exist and are sealed — these are reusable as-is. BUT the container that assembles them into
    the grouped, hierarchical, expand/collapsible tree (`SelectDropdown`) does **not exist as a
    component** — `SelectMultiList.tsx` (591:4634) only renders a FLAT depth-0 list (no group
    headers, no depth-1 children, no expand/collapse) and `Select.tsx` (the sealed single/multi
    dropdown documented throughout AGENTS.md) is a different, simpler flat-options component. The
    spec's `status: implemented` for `SelectDropdown` is inaccurate — no `SelectDropdown.tsx` file
    exists in `src/gallery/`. This is a genuine net-new organism build (grouped headers + 2-level
    expand/collapse tree + search + the flat ellipsis ActionMenu), not a quick drift fix.
  - Per owner direction in this same session ("I agree... we don't have evidence to support the
    select dropdown yet... let's track it and don't forget it"), this build was deferred rather
    than started immediately, to keep the already-audited molecule/atom fixes (dark atoms, Slider,
    ContentTitle, InputTrigger, SelectTrigger, SelectButton) unblocked for merge. **Next attempt
    checklist (superseding the stale one above):** (1) build `SelectDropdown.tsx` composing
    `SelectHeader` + `SelectRow` (depth 0/1) + `NavIndentLine` + `SearchBar` + `Atom.Scrollbar`
    per node `783:4808`/`783:4821`, (2) build/verify the ellipsis `ActionMenu` via the existing
    `Menu`/`MenuItem` components per node `783:4834`, (3) update `selectdropdown.spec.md`'s
    `figma.thisNode`/`nodeMap` from the stale `296:3919` to `783:4808` (+ children), (4) run
    `/evidence-pipeline selectdropdown` for a real sealed bundle. Updated this session, still open.
- [x] ✅ CLOSED 2026-08-02 (owner) — **accepted Figma deviation, no action.** Code and spec agree and
  are correct; only the two Figma state nodes (`341:4478`, `1114:681`) show a stale unrotated chevron.
  That is the signature of an unauthored Figma state, not a design decision. Recorded permanently in
  `accordionbardark.spec.md` as EX-ACCORDIONBARDARK-002 — it does not need to be "fixed" to be correct.
- [x] ✅ **CLOSED 2026-08-02 — `selectslicercompact` / `metricsummarycard` are COMPOSITION-VERIFIED TERMINAL; nothing
  left to do.** Owner confirmed this was a stale pending item. Verified on master: both carry permanent-keep advisory
  entries in `docs/evidence/exemptions.json` that already record the completed work — `selectslicercompact` "DONE
  2026-07-22: play-story GATES §D5/§D6/§D7 … all 3 verified via Playwright", re-bound off the deleted 867:1419 to the
  live 577:2189; `metricsummarycard` "DONE 2026-07-23: §A fixed-identical-height (406/406/406) + §B2 view-persistence
  gates … verified via Playwright", with radius fixed and trendRowGap 4 / viewHeight 197 recorded as owner-adjudicated
  DS-rhythm deviations. Neither is pixel-sealable (`kind:frame`, no single Figma node) and dropping the exemptions would
  only trade exempt → advisory `EV.UNSIGNED`, so **keep them**. The escalated tooling refinements R1/R3/R4 shipped
  separately (PR #29 `87b01a7`).
- [x] ⭐⭐ **MERGE-`chore/molecule-foundation`-TO-MASTER ROADMAP — DONE 2026-07-23.** Squash-merged to master via
  **PR #27 = `61c9c01`** ("feat: molecule-foundation — MetricCard redesign, TrendRow, charts, table gates + re-seals").
  All ④ builder items complete + branch green (tsc 0 · spec/token/component/a11y/icons all PASS). The branch had
  diverged (master had the #26 squash, branch had individual commits) → resolved with a `-s ours` merge (branch is a
  strict superset of master; 3 stale pre-② signatures on master were correctly superseded by the branch re-records).
  ONLY remaining = the OPTIONAL owner **⑤ evidence-signing** (advisory gate — does NOT block anything; master is
  green + merged). PLG `App.tsx` migrated + committed locally (`21c04a1`, no remote — deploys via Power BI). The
  branch `chore/molecule-foundation` is KEPT. Original plan (kept as the record of what shipped):
- [x] ✅ CLOSED 2026-08-02 — superseded by the DONE roadmap item directly above it (PR #27, 61c9c01). Original text: (superseded — above is DONE) ⭐⭐ original roadmap detail — get every branch-changed
  component READY (sealed), then merge ALL together to master and free the branch. Required gate `health:strict`
  is already GREEN on the committed state (the button `EX.FIGMA-RAW-TAMPERED` is a Windows-only FP; Linux CI passes).
  The evidence signature gate is ADVISORY/non-required (`.github/workflows/evidence.yml`), so none of the below
  blocks the merge — this is about landing a fully-sealed branch, not unblocking. Work items (branch-scoped via
  `audit-evidence --range origin/master..HEAD`):
  - [ ] **① Table subsystem (10) — recorded + independently verified; owner SIGN pending.** `treedatatable,
    tabletoolbar, tablecolumnheader, tablerowheader, tablecell, tablefooter, tablecolumnmenu, sorttableindicator,
    filtertableicon, disclosuretabletoggle`. Bundles at `docs/evidence/<slug>/` (verdict:pass). Sign =
    `EVIDENCE_CHECK_TOKEN=<token> node scripts/evidence-sign.js <slug>` (checker≠builder; token lives in the repo's
    GitHub Actions secret `EVIDENCE_CHECK_TOKEN`). Then remove the now-redundant `treedatatable` +
    `disclosuretabletoggle` entries from `docs/evidence/exemptions.json`.
    **`treedatatable` play-gates DONE 2026-07-22:** added expand/collapse · sort · filter · paginate play-story
    gates to `TreeDataTable.stories.tsx` (lean spec already exists), all 4 verified via Playwright — the
    exemption's behavior-gate TODO is resolved; removal is the ⑤ owner cleanup.
    **`disclosuretabletoggle` SEALED 2026-07-22 (`4b1e26e9`):** its spec was already complete + a bundle was
    recorded; sealed it via evidence-wave (pilot-signed, gate PASS — 0 findings). Its exemption is now redundant —
    drop it at ⑤ alongside the real-key re-sign. So of the table subsystem, disclosuretabletoggle is now pilot-SEALED
    (like the ②/②b/②c set); the other 9 remain recorded-but-unsigned pending your ⑤ sign.
  - [x] **② Re-seal 3 STALE: `SelectTrigger`, `SelectButtonCompact`, `TriggerButton` — DONE 2026-07-21.**
    Re-captured + independently re-verified + re-recorded. SelectTrigger's living-chevron change was BLOCKED by the
    checker (inked/rotated vs Figma grey-static) → owner ruling: keep rotate-on-open, revert to grey at rest
    (EX-SELECTTRIGGER-002). Owner sign still pending (⑤).
  - [x] **②b Re-seal `Badge` + `CardHeader` + `Callout` (2026-07-22 re-design) — DONE 2026-07-22 (3 evidence-wave rounds).**
    Badge sealed `d151b807` (EX-BADGE-005 one-line/ellipsis). CardHeader sealed `25f649cb` after a bare single-instance
    capture story replaced the in-context-card target (L24; the design always matched Figma 364:4589). Callout sealed
    `4ae2aacf` after two owner/doc reconciliations the reviewers surfaced: outer row **gap 4→0** (owner chose match-Figma
    `itemSpacing` 0) and a stale frontmatter **`container.width` hug→fill** doc-sync. All three independently gate-verified
    `PASS — 0 findings` (pilot token). Wave hardened the protocol: lessons L24/L25/L26 + a new `audit-specs.js`
    container-vs-Anatomy consistency check (caught before future waves). **Owner sign with the real `EVIDENCE_CHECK_TOKEN`
    still pending (⑤)** — bundles are pilot-signed; CI's advisory evidence gate wants the real key. Also escalated,
    awaiting owner: **REF-1/R3** governor-approved scout+reviewer DIMENSIONS tightenings (container-sizing as a first-class
    check) that edit `evidence-pipeline.js` — not auto-applied (owner-only protected region).
  - [x] **②c NEW molecule `TrendRow` (Figma 1086:5005) — built + sealed 2026-07-22 (`6832bc38`).** Owner re-design of
    the MetricCard trend section (783:4640): the old inline 28px number clipped mid-number; TrendRow renders the delta
    as a Badge (never truncates). 3 `style` variants (default/classic/tabular); composes TrendArrow+Badge+InfoIcon.
    Wired into MetricSummaryCard (`MetricTrendRow` is now `{status,label,delta,subtitle}`). Gate-verified `PASS — 0
    findings` (pilot token). Reseal caught + fixed a real bug (tabular meta badge variant neutral→**default** to match
    the borderless Figma instance). **PLG `App.tsx` migrated** to the new trendRows shape (type-clean) but left
    UNCOMMITTED in the PLG repo — owner commits/deploys PLG (Power BI) on their cadence. Owner real-key sign pending (⑤).
    Escalated, awaiting owner: **R2** governor-approved reviewer-prompt tightening (resolve a composed-atom INSTANCE's
    variant + fills/strokes overrides, not just the named variant) — edits `evidence-pipeline.js` (owner-only).
  - [x] **③ Chart work (2): `LineWithPreviousChart` + `ChartTooltip` — committed + DS-clean 2026-07-22 (`f261b88`/`b19bac8`).**
    All 4 `TK.CSS-OPACITY` HIGH fixed: halo → `tokens.accentSubtle` (solid, no opacity/rgba), cursor → `tokens.textMuted`,
    dot pop-in keyframe → transform-only, tooltip muted text → `tokens.onDarkMuted`. Registered; `audit-tokens/components/
    a11y/icons` all clean; renders verified. Specs authored as **`status: draft`** — a borrowed recharts chart is verified
    by its TOKEN contract + a render check, NOT the 8-dimension pixel-seal (marking a false `implemented`+checklist would be
    the exact false-verification L27 warns about). This CLEARED the 13-blocker stub → **local `spec-audit` is now fully green**.
    A real `LineWithPreviousChart` is wired into the MetricCard chart slot (Default + Playground stories). **OWNER DECISION pending:**
    whether charts get a formal verification (a token-parity seal variant, or an evidence exemption like the exempt organisms)
    — until then they ship `draft` (honest, non-blocking; the evidence gate is advisory).
  - [ ] **④ Resolve 5 exempt organisms** (each has a TODO in `docs/evidence/exemptions.json`):
    - [x] **`pageheadertitle` — DONE 2026-07-21.** Old node 338:4598 was deleted (owner moved organisms); re-bound
      to current node **783:4708**, re-captured + independently re-verified (design unchanged) + re-recorded.
    - [x] **`actionmenu` (main menu) — DONE 2026-07-21.** Added a `--target <selector>` flag to
      `evidence-capture-story.js` (crops to a portal element instead of #storybook-root) → the ActionMenu portal is now
      capturable. Re-bound to the current main-menu node **783:4539** + storyId **`organisms-actionmenu--figma-spec`**,
      captured via `--target '[role="menu"]'`, independently re-verified 8/8 + re-recorded. `ActionMenu.tsx` gates only
      this slug, so this resolves the merge gate. OPTIONAL follow-up (NOT gated, never sealed on master): seal the 2
      submenu specs `actionmenu-sort-submenu` (**783:4589**) + `actionmenu-presets-submenu` (**783:4565**) — needs a play
      that opens each submenu + `--target` the right `[role="menu"]`.
    - [x] **`railnav` — DONE 2026-07-21 (rail-scoped, EX-RAILNAV-SCOPE).** Re-bound the seal to the rail sub-node
      **783:4716** (matches the collapsed-rail story); panels/menus verified compositionally via their own specs.
      Independently re-verified 8/8 + re-recorded. Owner sign pending.
    - [x] **`metricsummarycard` — play-gates DONE 2026-07-23.** Added §A (identical fixed height across all 3
      views — verified 406/406/406) + §B2 (lifted `view` persists across a data-swap remount — card stays on trend,
      not reset to chart) play-story gates to `MetricSummaryCard.stories.tsx`; both Playwright-verified (auto-run
      plays, 0 errors). Behavior-gate TODO resolved; exemption removal is the ⑤ owner cleanup.
    - [x] **`selectslicercompact` — play-gates DONE 2026-07-22.** Added §D5 (one popover open at a time) / §D6
      (clean trigger toggle + real-outside-click closes) / §D7 (both popovers at Z.modal, above the sticky band)
      play-story gates to `SelectSlicerCompact.stories.tsx`; all 3 verified via Playwright. Exemption TODO resolved;
      its actual REMOVAL is a ⑤ call (kind:frame → dropping it trades exempt→advisory EV.UNSIGNED; the play gates are
      the verification of record). NOTE: the SB test-runner couldn't init its browser in this env — gates are valid
      (tsc-clean) + behavior-verified, just not run through `test:behavior` here.
  - [ ] **⑤ Final (OWNER — needs the real `EVIDENCE_CHECK_TOKEN`). RUNBOOK (builder queue is DRAINED as of 2026-07-23; all ④ done, branch green):**

    ```bash
    # from repo root, on chore/molecule-foundation:
    export EVIDENCE_CHECK_TOKEN='<real token — the GitHub Actions secret>'
    # 1. Real-key sign every recorded/pilot-sealed bundle (idempotent; 92 bundles have a verdict.md):
    for d in docs/evidence/*/; do s="$(basename "$d")"; [ -f "${d}verdict.md" ] || continue;
      node scripts/evidence-sign.js "$s" || echo "STALE/FAIL: $s → re-record via /evidence-wave $s"; done
    # 2. Confirm the branch range verifies under the real key:
    node scripts/audit-evidence.js --range origin/master..HEAD    # expect PASS — 0 findings
    # 3. Remove the 5 NOW-REDUNDANT exemptions from docs/evidence/exemptions.json (each has a signed bundle):
    #      actionmenu · pageheadertitle · railnav · disclosuretabletoggle · treedatatable
    # 4. Land it:
    npm run health:strict     # required gate — green
    git add docs/evidence && git commit -m "chore(evidence): owner sign-off + drop resolved exemptions" && git push
    ```

  **KEEP these 5 exemptions** (they legitimately can't be pixel-sealed — verified another way):
  `selectslicercompact` + `metricsummarycard` (kind:frame organisms with NO single Figma node → verified by the
  play-story GATES added 2026-07-22/23, not a seal — they have NO evidence bundle, so removing them would only add an
  advisory `EV.UNSIGNED`); `moleculespecharness` + `surfacespeccanvas` + `compacttriggershell` (permanent Storybook
  helpers). Pre-existing unsealed organisms on master (`overflowmenu`, `sidebarpanel`, `selectdropdown`, …) are NOT
  touched by this branch and do not gate this merge. Then squash-merge the PR to master + delete the branch.

- [x] ✅ **DONE 2026-07-09 — molecule Figma renames APPLIED via `use_figma` + read-only verified + spec NAMING reconciled.**
  (1) Applied all 24 sets in Figma `EyYETHXMDDURPGK4PXTU5C` (22 in `597:3414` + 2 in `597:3415`) incrementally,
  one set at a time, under the `figma-use` guardrails: set → `Molecule.<Name>`, variant `state=` normalized
  (rest→default, kebab→camelCase, `style=`/`State=Default`→`state=default`, placeholders resolved), own-frames →
  `Slot./Row./Region.`; composed `Atom.*`/instance layers left untouched (~293 nodes mutated). (2) Read-only
  re-fetch of `597:3414`+`597:3415` diffed clean — **0 deviations** (no leftover `style=`/`state=rest`/kebab/
  placeholder/old own-frame names). (3) **Phase A NAMING** reconcile of all 14 built molecule specs to the new
  Figma names committed (`2a39a6f` searchbar+aipill, `63e3064` remaining 12): `Molecule.*` in the Figma-binding
  fields, states normalized, own-frames renamed; `element:`/tokens/geometry/story-ids unchanged; `audit:specs`
  green. All 14 now correctly trip EV.STALE-EVIDENCE (spec hash changed; geometry did not) → re-seal in Phase B.
  REMAINING (see next items): structural "Figma wins" reconcile of the stale specs, Phase-B re-verify/re-seal,
  held gate tightenings, and Stream-2 `/create-wave` of the 10 uncovered. Branch `chore/molecule-foundation`.
- [x] ✅ CLOSED 2026-08-02 — **the 10 needs-human molecules were reconciled AND sealed; the item just never
  got checked off.** Its own text already recorded completion: *"★★★ PHASE B SEALED — 14/14 MOLECULES
  VERIFIED vs live Figma"* and *"★★ STREAM-2 BUILT — 10 components at status: implemented"*. All 19 commits
  it cites are on master. This is the exact debt pattern the owner called out on 2026-08-02: work reached
  master and nothing flipped the status, so the item kept reading as pending for three weeks.
- [x] ✅ CLOSED 2026-08-02 — **the HELD molecule-wave gate tightenings are ABANDONED (owner decision).**
  Held unmerged since 2026-07-09 on `chore/molecule-gate-tightenings`, waiting on a molecule reconciliation
  that has since happened. Owner chose to drop it rather than carry a branch to preserve one unwired script.
  **Deleted:** the branch (local + remote) and its `scripts/audit-story-shape.js` (327 lines). The stale
  reference in `scripts/run-audits.js` was rewritten so its orphan-guard comment no longer points at a
  branch that does not exist. Nothing references it now. If the story-shape check is ever wanted again,
  re-author it — do not go looking for the branch.
- [x] ✅ **BUILT + 8/10 SEALED — verified 2026-08-02; only the seals of `selectbutton` + `selectbuttoncompact`
  remain** (tracked by the 2-slug item at the top of this list; `selectbuttoncompact` is the same kind of
  unsigned-bundle gap). All 10 `.tsx` files exist on master. Sealed (have `signature.json`): `filterbutton`,
  `selecttrigger`, `inputtrigger`, `selecttoggle`, `selectmultilist`, `selecttriggercompact`,
  `inputtriggercompact`, `selecttogglecompact`. The two REMAINING sub-tasks named in the item below are also
  DONE: the carved notched-outline caption shipped in `src/gallery/CompactTriggerShell.tsx`, and
  `feedbacktext` is sealed (`signature.json` present). Original scope kept for the record:
- [x] ✅ CLOSED 2026-08-02 — superseded by the line above it — the build is DONE; the 2 seals are covered by the consolidated evidence item. Original text: ⭐ (superseded by the line above — build DONE, 2 seals outstanding) **Build the 10 uncovered molecules
  (Stream 2, `/create-wave`)** (added 2026-07-09) — they exist in
  Figma (section `Molecules` `597:3414`, all LIGHT) but have NO spec/code on our side, so the molecule
  VERIFY wave (the 14 built molecules) does not touch them: **FilterButton** `555:1970` · **SelectTrigger**
  (the FULL assembly `299:4077` = ContentTitle + TriggerRow + FeedbackText, 6 states — our old
  `DropdownTriggerRow` was only its inner-row fragment and was retired `74dd5f2`) · **InputTrigger**
  `590:3553` · **SelectButton** `590:4187` · **SelectToggle** `590:4466` · **SelectMultiList** `591:4634` ·
  **SelectTriggerCompact** `577:2189` · **InputTriggerCompact** `584:2436` · **SelectToggleCompact**
  `584:2983` · **SelectButtonCompact** `579:2195`. Do the **Figma-first structural decomposition FIRST**
  (the Select/Input family + Compact variants likely share parts — decide molecule vs organism-internal per
  `docs/atomic/PROTOCOL.md` § Figma-First Structural Inspection). Runs AFTER the molecule verify wave (14
  built molecules, branch `chore/molecule-foundation`). Figma is the source of truth — fetch each node
  before building. (24 Figma molecules = 14 built + these 10.)
- [x] ✅ **DONE 2026-07-09 — ATOM TIER + OPERATIONAL KERNEL both MERGED to `master`; branch `fix/button-poll-example-layout` deleted.**
  **PR #18** (`757c6b9`): all 25 atoms = `FigmaSpec` + `Variants` only (Button/TriggerButton keep play-tests); all **40 atom slugs sealed vs Figma, gate PASS 0 findings, ZERO deviations** (hairline sub-pixel, TriggerButton surface-aware tokens, ToggleSwitch Option B, Button md/lg swap fixed on BOTH light+dark Figma → EX-BUTTON-004 + EX-BUTTONDARK-006 retired, FigmaSpec surface-aware for RailButton/Scrollbar/SelectionIndicator, Tag truncation). **PR #19** (`c59db91`): Operational Kernel (`docs/process/*` + `audit-kernel`/`audit-tasks` wired into the health gate). Protocol hardened: scout light-sibling preflight + finalizer pre-gate (LESSONS L22/L23). The remaining `- [ ]` items below are the **non-atom backlog** (RailNav re-verify, CI secret, back-catalog icon, etc.).
- [x] ✅ **DONE 2026-07-09 — owner un-swapped the dark Figma `AtomDark.Button` 663:2481 md/lg; EX-BUTTONDARK-006 RETIRED + button-dark re-sealed clean (0 deviations).**
  The dark set still has the SAME md/lg `disabled`↔`disabledSelected` authoring swap the light set (590:3785)
  had before you fixed it (verified live 2026-07-09: disabled-md `663:2573` + disabled-lg `663:2622` = onDark05
  should be transparent; disabledSelected-md `663:2566` + disabledSelected-lg `663:2615` = transparent should be
  onDark05; md/lg grid order also swapped). To unblock "all atoms → master" while you were away, button-dark was
  sealed via the reversible **EX-BUTTONDARK-006** deviation (mirror of the light EX-BUTTON-004 pre-fix state).
  **Action:** un-swap 663:2481 md/lg (disabled→transparent, disabledSelected→onDark05, matching small) → then
  I REMOVE EX-BUTTONDARK-006 from `button-dark.spec.md`, restore the disabled/disabledSelected state notes to a
  clean match, and re-seal `button-dark` (same lifecycle EX-BUTTON-004 had). One `/create-wave`-free lean re-seal.
- [x] **ToggleSwitch disabled-off track — REVERSED to Option B `faintFill` (2026-07-08).** SUPERSEDES the
  earlier "surface accepted" decision below. During the toggleswitch re-seal wave the reviewers flagged that
  `tokens.surface` on dark resolves to `darkSurface` (a hair off Figma-dark `onDark05`); the owner chose
  **Option B — Figma-exact on dark**: disabled-off track now reads `tokens.faintFill` (remaps to `onDark05`,
  Figma-dark exact). Cost accepted: on LIGHT `faintFill = slate2` (near-white faint grey) DIVERGES from
  Figma-light white — authorized deviation **EX-TOGGLESWITCH-001** (light spec) — rationale: consumers run
  DARK, so dark parity outranks the sub-perceptual light shift. Option C (a new surface-aware white/onDark05
  token) declined for this atom to avoid a tokens.ts change. Code `ToggleSwitch.tsx` disabled-off
  `surface->faintFill`; light spec `bgDisabledOff -> faintFill` + EX-001; dark spec already expected
  `faintFill`. Both siblings being re-sealed against the new code.
  - ~~OWNER-APPROVED as-is (2026-07-05/edcf18e): disabled-off uses `tokens.surface`~~ — SUPERSEDED 2026-07-08.
- [x] ✅ **SURFACE-AWARE TOKEN BATCH (2026-07-08) — TriggerButton bg DONE** (owner: "follow Figma specifications").
  Added two surface-aware split tokens `triggerHoverBg` (light slate3 `#F0F0F3`) + `triggerDisabledSelectedBg`
  (light slate4 `#E8E8EC`), each remapping via the darkAtom decorator to `onDarkFaintest` (onDark05). So LIGHT
  is Figma-light exact (slate3/slate4) AND darkAtom is Figma-dark exact (onDark05 for both — the coarse dark
  palette collapses them). Supersedes the 2026-07-04 `faintFill` (dark-exact but light slate2). No deviation
  needed on either surface. Code (`TriggerButton.tsx`) + tokens.ts (LIGHT+DARK) + `.storybook/preview.tsx`
  decorator + both specs updated; being re-sealed as `triggerbutton` + `triggerbutton-dark`.
  (Lesson preserved: don't wave-seal a surface-aware-bg atom on light before the tokens exist — the wave
  applies a light-only fix that breaks dark, exactly what happened to ToggleSwitch.) AI-INTEGRITY Case 7 lineage.
- [x] ✅ **(DONE 2026-07-09, PR #18) TriggerButton centering + truncation (EX-TRIGGERBUTTON-003) — SEALED together with the surface-aware bg tokens.**
  Icon+label center as a group (equal L/R) + single-line ellipsis truncation with the icon pinned left; FigmaSpec
  gained a "Long text" checkbox in a 180px frame. Verified in-render. It stays WIP because sealing TriggerButton
  on light alone makes the wave apply a light-only bg fix that regresses dark — so it SEALS TOGETHER with the
  surface-aware bg fix below (one triggerbutton + triggerbutton-dark re-seal covering both changes).
- [x] ✅ **(DONE 2026-07-09, PR #18) TriggerButton bg surface-aware token fix + re-seal.** Shipped: `triggerHoverBg`/`triggerDisabledSelectedBg`, Figma-exact both surfaces, both slugs sealed. (Original note kept below for history.) The variant-parity
  gate found 5 bg divergences vs light Figma `579:2363`: hover renders `#f9f9fb` (should be `#f0f0f3`),
  disabledSelected `#f9f9fb` (should be `#e8e8ec`), and default/focus/disabled render `tokens.surface #ffffff`
  (Figma transparent — visually equal on the light surface). Root: `faintFill` is right on dark (`onDark05`)
  but wrong on light; `hoverBg`/`activeBg` are the inverse. **Fix (owner chose "fix hover+disabledSelected;
  allow surface≡transparent"):** add TWO surface-aware tokens — light `#f0f0f3`/`#e8e8ec`, darkAtom→`onDark05`
  — wire the darkAtom decorator remaps, use them in `TriggerButton.tsx`, teach the gate that `tokens.surface`
  satisfies an expected-transparent cell, verify ALL 4 theme×surface combos, then re-seal BOTH `triggerbutton`
  + `triggerbutton-dark`. Icon fix already landed (`87e3403`, WIP — not sealed). Dark Figma `663:3169`: hover/
  disabledSelected = `onDark05`, pressed = `onDark15`, selected = `#fff`. AI-INTEGRITY Case 7 lineage.
- [x] ✅ **(DONE 2026-07-09, PR #18) Figma-Spec final review of ALL atoms — COMPLETE.** Every atom reviewed vs its real Figma node on both surfaces + sealed (40 slugs, 0 deviations), merged to master. Original scope below for history.
- ~~[ ] ⭐ **ACTIVE (2026-07-07) — Figma-Spec final review of ALL 24 atoms**~~ vs their actual Figma nodes, on
  atom + dark-atom surfaces. Tracker + PROTOCOL + per-atom status: **`docs/atomic/FIGMA_SPEC_AUDIT.md`**
  (read it first). All atoms now have a `FigmaSpec` story in `SurfaceSpecCanvas` (branch
  `fix/button-poll-example-layout`); the review compares each to Figma and fixes mismatches. **In progress:**
  Badge (missing neutral/color/bold + priority size) + Button (owner: not Figma-aligned). **PROTOCOL
  REMINDER:** always fetch + read the actual Figma node (and export its image) BEFORE building/fixing — never
  skip Figma-as-source. Then walk the ⬜ pending list in the tracker top-to-bottom.
- [x] **Dark-atom sweep: rewire alpha-white stand-ins to `darkText*`** — DONE (audited 24/24 dark atoms
  vs their Figma AtomDark nodes, 5 parallel read-only agents, 2026-07-06). **ToggleButtonDark was the SOLE
  opaque-grey case** (already fixed). The other 23 genuinely use alpha-white fills in Figma (0.2/0.4/0.5/
  0.6/0.7/0.85/#FFF), so their `onDark*` tokens are correct — no swaps, no re-seals. The systemic concern
  is ruled out; ToggleButton is unique because its translucent-0.05 / white pills would wash out an
  alpha-white glyph, so the designer used opaque greys there only.
- [x] **ToggleButtonDark `disabled/on` icon fill-style** — DONE (2026-07-06): matched Figma `663:3012`
  (Filled IconSlot for disabled-on; disabled-off stays Regular). `iconFilled` now includes `disabled && checked`.
- [x] **FilterIconDark spec — corrected fabricated Figma fills** — DONE (2026-07-06): rewrote the state-matrix
  notes + Notes §"Figma reuses light icon fills" → white-alpha (`0.7 / #FFFFFF / 0.2`); every light-hex mention
  now explicitly negates the old false claim. Render was already correct (doc-only fix).
- [x] ✅ CLOSED 2026-08-02 (owner) — **dropped; not blocking anything.** The concern was that
  dark-pair story captures fail because a story render cannot read the non-toolbar `atomSurface` global.
  In practice 30 dark-pair bundles are signed today, so the single-component re-theme path works. This
  is a refactor in search of a symptom; re-raise if a dark capture actually blocks a wave.
- [x] ✅ CLOSED 2026-08-02 — folded into the single consolidated evidence-seal item at the top of Parked (re-seal ON TOUCH). RailNav is deployed and working in production. Original text: **RailNav re-verify after RailButton rest-icon tint** (2026-07-01): EX-RAILBUTTON-002 tinted the rest rail icon textMuted #60646C -> textSubtle #8B8D98 to match Figma (Atom.RailButton 410:4773, owner-approved). RailNav composes RailButton, so its rest rail icons now render fainter — re-verify/re-seal RailNav (organism) against Figma before the next deploy.
- [x] ✅ CLOSED 2026-08-02 — **light-atom tail DONE.** Verified: `tag`, `badge`, `trendarrow` and
  `iconslot` each have an atom spec AND a signed evidence bundle. Nothing outstanding.
- [x] ✅ **(DONE 2026-07-09, PR #18) Atom sweep — pending RE-SEALS resolved** — all atom slugs (incl. triggerbutton) re-sealed to master. Original note: (a) **triggerbutton** — code+spec fully fixed
  (rebuilt to owner's Figma; engaged-state labels hover/pressed/focus → ink, committed `18fcfe4`); just
  needs a re-seal `/evidence-wave triggerbutton` (clear `docs/evidence/triggerbutton/{manifest,signature,
  verdict}.json` first if a stale capture blocks). (b) **chevrontrigger** — migrated + committed, but the
  re-seal wave returned `needs-human` with EMPTY escalations = the known poisoned-seal *deadlock*; clear
  `docs/evidence/chevrontrigger/{manifest,signature,verdict}.json` + re-run; if it re-deadlocks,
  investigate the `size=16` variantStates vs the story's rendered 24 variants (states-match-variant-count).
- [x] ✅ CLOSED 2026-08-02 — **all three care-group atoms resolved.** (a) `iconslot`: the axis is
  documented as `iconStyle` in the spec (39 refs) while the code keeps the widely-used `filled` boolean
  prop — the "document rather than rename" resolution the item asked for. (b) `ellipsisbutton` +
  `expandbutton`: the `EX-` entries for Figma's uncoded `hidden` variant are present in both specs.
  (c) `trendarrow`: now binds all 36 variantStates. All four are signed.
- [x] ✅ CLOSED 2026-08-02 — **written up as `L33` in `docs/evidence/LESSONS.md`.** Both halves: (1) a
  new atom MUST ship `Example` + `Variants`, never a lone interactive `FigmaSpec` (which is a demo
  harness, not a capture target); (2) the `Example` must render a VISIBLE, sizable target — a bare
  transparent component captured a null-bbox blank 251-byte PNG, which passes vacuously. L33 also names
  why it recurred: a lesson parked in a backlog is not a lesson, it is a recurring cost.
- [x] ✅ CLOSED 2026-08-02 (owner) — **half shipped, half dropped.** (1) git-worktree parallelism is
  DONE: `scripts/new-worktree.sh` + `docs/process/MULTI-AGENT-WORKTREES.md`. (2) The unattended/scheduled
  path for long waves is a FEATURE REQUEST, not debt — no `schedule:` trigger exists in any workflow and
  nothing is waiting on one. Re-raise when you actually want waves running unattended.
- [x] ✅ CLOSED 2026-08-02 (owner) — **dropped.** The evidence gate is ADVISORY by its own declaration
  (`.github/workflows/evidence.yml:7`), and under the re-seal-ON-TOUCH policy seals happen as part of a
  component edit. Pilot signatures are sufficient for that. If the evidence gate is ever promoted to
  REQUIRED, provisioning the secret becomes a prerequisite of that promotion — raise it then, not before.
- [x] ✅ CLOSED 2026-08-02 — **icon mismatches are gone.** `node scripts/audit-icons.js` reports
  `PASS — 0 findings`. Making icon-existence a STATIC gate was the stated motive; with zero mismatches
  there is nothing to reconcile. Re-raise only if the audit starts finding drift again.
- [x] ✅ CLOSED 2026-08-02 (owner) — **dropped.** No incident has ever traced to an unpinned Figma node
  version. Stale/moved node BINDINGS have caused real failures and are already covered (L28 + the scout
  preflight). Speculative machinery; re-raise only if a version-drift incident actually occurs.
- [x] ✅ CLOSED 2026-08-02 (owner) — **dropped; the underlying problem was solved differently.** The
  real harm was a growing list read as a debt gate. That is fixed structurally: `## Blocking` vs
  `## Parked`, the CLOSE-ON-LAND rule in AGENTS.md, and the re-seal-ON-TOUCH policy. A cap on checklist
  count would have been a proxy metric for a problem that no longer exists.
- [x] ✅ **RESOLVED — verified 2026-08-02: `menuitem` / `menuitemdark` are NO LONGER duplicated.** Each now
  has exactly one spec, both at molecule level (`docs/atomic/molecule/menuitem.spec.md`,
  `docs/atomic/molecule/menuitemdark.spec.md`); no organism-level copies remain. The stale duplicates were
  removed at some point after the spec-schema migration without this line being closed.

### Atoms create-wave prep — fix in the FREE tab BEFORE the paid /evidence-wave (from the 2026-06-29 trial)

> Each is cheap to fix on free tokens; running the paid verify wave over them first would just burn
> tokens on fix-loops over known debt. Independently confirmed (specs grepped), not just relayed.

- [x] ✅ CLOSED 2026-08-02 — **the premise no longer holds.** The item flagged `pass:true` as suspect
  BECAUSE `lastVision`/`lastPixelDiff` were pending. Checked all ten named atoms (button, carouselmark,
  chevroncarousel, chevrontrigger, clearbutton, divider, ellipsisbutton, expandbutton, infoicon,
  navindentline): every one is SIGNED with `lastVision=pass`. Each was sealed through the 3-reviewer
  evidence wave, which independently verifies exactly this checklist row — so the claims are earned,
  not self-asserted. Nothing to adjudicate.
- [x] ✅ **RESOLVED — verified 2026-08-02: `TrendArrow` now binds all 36 variantStates**, matching Figma set
  `350:5012` exactly (counted in `docs/atomic/atom/trendarrow.spec.md`). The under-binding was fixed without
  this line being closed; `states-match-variant-count: pass:true` is now truthful.
- [x] ✅ **RESOLVED — verified 2026-08-02: zero dark atom specs remain `status: draft`.** All 30
  `docs/atomic/atom/*-dark.spec.md` files are past draft (checked every one); the 12 stubs named here
  (carouselmark-dark, chevroncarousel-dark, …) were built out. The dark-pair gap this tracked is closed.
- [x] ✅ CLOSED 2026-08-02 — **obsolete.** This was prep for the atom create-wave extraction, which
  completed and merged (PR #18). Atom tier today: 69 specs, 67 with a signed bundle.
- [x] ✅ CLOSED 2026-08-02 — **obsolete.** Same as the rename-convention item: prep for an extraction
  that already completed (PR #18).
- [x] **Button — verified + sealed** (done `07fe002`, 2026-06-29). The wave independently verified the
  build (all 8 dims vs Figma 590:3785) AND caught a fabricated seal (free-tab self-signed + a false
  `TYPE.bodyS` verdict); re-sealed with an honest verdict. EX-BUTTON-001 codified; owner decisions
  settled (no-icon `+SPACE[2]` fires when a side's slot renders nothing; loading spinner counts as an
  icon → no extra padding on its side). Remaining free-tab-built atoms still need the same wave pass.
- [x] ✅ CLOSED 2026-08-02 (owner) — **dropped; superseded by the governor loop.** Adversarial
  second-opinion review is now a first-class capability (3 independent governors, unanimous-or-reject,
  each biased to reject). It found a fatal flaw in a plan on 2026-08-02 that a single reviewer missed.
  Running the same prompt through another vendor's model adds nothing that harness does not.
- [x] ✅ CLOSED 2026-08-02 — **obsolete.** The atom tier shipped via PR #18; nothing is uncommitted.
## Considered + deliberately deferred (revisit only if the need appears)

- [ ] **Pipeline can't self-heal a fabricated/stale PRE-EXISTING seal** — if a component arrives with a
  bad bundle (e.g. a free-tab self-signed bundle whose source later changed), the wave's reviewers fail
  `figma-fetched`/`story-rendered` on the stale seal, so `allPass` never becomes true, so the finalizer
  (record+sign) never runs to fix it — a deadlock that returns `needs-human` with empty escalations.
  Workaround: clear the poisoned seal (`manifest/signature/verdict`) before re-running. Consider teaching
  the pipeline to detect "build verifies but bundle is merely stale → re-seal" so it self-recovers.
  (Surfaced 2026-06-29 finishing Button; reinforces the `EVIDENCE_CHECK_TOKEN`-as-CI-secret item — a
  readable token is what let the free tab forge the seal in the first place.)
- [ ] **Automate cross-VENDOR verification inside the wave (`cross-check.js`)** — the manual CHAT↔CODEX
  relay proved unreliable + slow (CL7); the wave's 3 reviewers give multi-agent independence but are the
  same vendor. If true cross-vendor independence is wanted, build a `scripts/cross-check.js` agent that
  POSTs the artifact + checker prompt to a different-vendor API and returns a structured verdict the
  evidence/create pipeline consumes — never a human copy-paste. Build only if same-vendor reviewers prove
  insufficient.
- [ ] **Machine-enforce "no silent decisions" in the create stage** — `/figma-build` now (hardened
  2026-06-29) requires a DECISIONS LOG + an `EX-<slug>-NNN` entry for ANY departure from a literal Figma
  value, and forbids self-certifying. That's prompt-level. Consider whether a gate can detect a spec
  value tracing to neither Figma nor an `EX-` entry — hard without a live Figma fetch in the gate, and
  the paid `/evidence-wave` already catches pixel-level drift. Revisit only if silent-decision drift
  recurs despite the hardened prompt. (Root cause: the free single-agent create path has no in-loop
  governor; the multi-agent `/create-wave` does.)
- [ ] **Generalize `evidence-sign.js` digest target + a dimension-registry** for cross-stage reuse —
  deferred as premature abstraction: deploy/create sign different artifacts (renders vs specs), so a
  shared signer isn't warranted yet. Revisit only if a real shared signing need shows up.

## Done (recent)

- [x] ✅ CLOSED 2026-08-02 — **armed gate landmine removed: `scripts/audit-figma-measurements.js` DELETED.**
  Found during the audit-churn work. It wrote `figma-measurement-audit-latest.json`, a name absent from
  `KNOWN_ARTIFACTS` in `scripts/run-audits.js`, and NOTHING called it (0 callers in `scripts/`,
  `package.json`, `.github/`). The first person to ever run it would have turned the required gate into
  an UNCLEARABLE blocker — an exact repeat of incident `21907be`, which reddened master for a day.
  Owner chose DELETE (the zero-coupling option; keeps `run-audits.js` untouched). If the measurement
  audit is ever wanted, re-author it and wire it into BOTH the `audits` array AND `KNOWN_ARTIFACTS`
  together — never add a name to `KNOWN_ARTIFACTS` alone, and never emit an artifact without both.

- [x] ✅ **CLOSED 2026-08-02 — `feat/filter-fields` recovered + pushed, and it is ALREADY FULLY IN MASTER.
  ⛔ NEVER MERGE IT.** The prior entry ("22 commits exist ONLY on this laptop", 🔴🔴 NEXT UP) was written from
  commit *counts* without diffing content, and was wrong on both halves.
  - **Recovery (done):** the branch REF had been lost entirely — gone from local and origin, its 22 commits
    dangling and reachable only via reflog (`8461bc5 checkout: moving from feat/filter-fields to
    feat/filter-organisms`, 2026-07-28), i.e. one `git gc` from permanent loss. Recreated from the tip
    (`git branch feat/filter-fields ca1cea3`) and pushed → **`origin/feat/filter-fields`**. Preserved as an
    ARCHIVE only.
  - **Every "real source change" it listed is already on master, byte-identical:** `Slider.tsx`
    (`activeThumb` per-thumb state) · `Button.tsx` · `SliderField.tsx` · `ButtonField.tsx` ·
    `InputTrigger.tsx` (`clearable`) · `TreeDataTable.tsx` + `TableCell.tsx` (inline magnitude bar) ·
    `CalendarField.tsx` · `SelectField.tsx` · and the `1b5785a` tooling commit (`scripts/lib/evidence.js`).
    `FilterPane.tsx` on master is a NEWER v2 (Figma 1356:7070). Landed via PR #54 and the later PRs.
  - **⛔ Merging would REGRESS master.** `git diff master feat/filter-fields` = 540 deletions in `src/` and
    **16,718 deletions in `docs/evidence/`**. It would DELETE `scripts/audit-export-parity.js` (the DS-2
    parity gate), `scripts/build-umd.mjs`, `check-umd-fresh.mjs`, `gen-umd-api.mjs`,
    `scripts/lib/umd-source-hash.mjs`, `src/umd-entry.ts`, `src/umd-jsx-runtime-shim.ts` — the whole UMD
    bundle system — plus the calendar dark atoms, the RailNav work, and `src/tokens.ts` additions.
  - **Its only unique line is dead:** `src/gallery/index.ts` exports the type `FilterPaneDividerItem`, which
    master's FilterPane v2 does not define — landing it would break `tsc`.
  - **Lesson:** compare branches by CONTENT (`git diff <a> <b> -- src/`), never by commit count. A branch can
    be 24 ahead and still be a strict subset.

- [x] ✅ **DONE 2026-08-01 (six seals; last = c3304f9) — CalendarField Phase 2 COMPLETE.** Branch **`feat/calendar-dark-and-export-parity`**
  (⚠ `feat/calendar-slicer` was merged + DELETED; do not look for it). Audited 2026-07-31 — the organism
  itself shipped to master via **PR #49** (`881a272`) with fixes **#50** `3e69141` / **#51** `796cb2f` /
  **#53** `8461bc5`. Phase-2 checklist status:
  - ✅ atoms `CalendarDay` (1259:5274) · `CalendarWeekdayHeader` (1266:1275) · `ChevronCircleCarousel`
    (1268:4522) — built, spec'd, signed light evidence bundles.
  - ✅ `ContentTitle` `type=bodyM` (`titleType` prop, node 1273:4854) · `Slider` re-verified + sealed
    (1187:699) · two-slicer taxonomy documented (`docs/atomic/SLICERS.md`).
  - ✅ BONUS beyond plan: molecules `CalendarPanel` (1291:9904, sealed) + `CalendarConfigPanel` (1291:9962,
    composition-terminal exemption, expires 2026-09-27).
  - ✅ **"+ dark renderings" — the clause was REAL, not boilerplate.** All 3 AtomDark nodes are fully
    authored in Figma: **`AtomDark.CalendarDay` 1294:4382** (40 variants), **`AtomDark.CalendarWeekdayHeader`
    1294:4348**, **`AtomDark.ChevronCircleCarousel` 1294:4353**. No owner Figma action needed.
    ⚠ Do NOT judge these from a standalone PNG export — white-on-transparent renders as blank/black and
    reads as "unauthored". Read the node fills.
  - ✅ Owner-approved surface-aware tokens added (`d3dc0e4`): `carouselPillBg/HoverBg/FocusBg` (light #FFF →
    dark 0.05/0.10/0.15) + `calendarBandBg` (light slate4 → dark onDark10). Light AND full-dark-theme
    renders provably unchanged — each mirrors the PALETTE entry it replaced.
  - ✅ The 3 Variants stories made dark-surface capturable (`9eccce7`) — they previously rendered a light
    canvas under `--surface darkAtom`, which would have sealed an invalid image.
  - [x] ✅ **DONE 2026-08-01 — all six slugs sealed, gate-verified PASS, render-verified.**
    `calendarday` `16b3ad2` · `calendarweekdayheader` `6e4a532` · `chevroncirclecarousel` `de4ef5e` ·
    `calendarday-dark` `c3304f9` · `calendarweekdayheader-dark` `7a1e78b` · `chevroncirclecarousel-dark`
    `d0f0f37`. Each re-checked independently with `audit-evidence --slug` (PASS, 0 findings) and each dark
    bundle carries manifest + signature + independent finalizer verdict. `npm run health` green.
    Took SIX slugs, not five — two corrections worth remembering:
    (a) I wrongly excluded `calendarweekdayheader` as "untouched"; commit `9eccce7` had edited its
    **stories** file, which `slugForFile` maps to the LIGHT slug, so it was stale and its staleness BLOCKED
    all three dark seals (the dark pipeline refuses to seal over a stale light sibling). **Lesson: editing a
    shared `*.stories.tsx` stales the LIGHT slug — always include it in the run list.**
    (b) Light and dark must be sealed in SEPARATE, SEQUENTIAL waves. Putting both in one wave races: the
    dark scouts evaluate light-sibling freshness before the light seals commit, so every dark blocks.
    The wave also caught three real defects invisible until dark evidence existed — see the Done section.

- **⭐ (2026-07-26) STRICT-ROUTE SELECT REBUILD — COMPLETE + SEALED (master @ `e72a48b`, all pushed).**
  `SelectDropdown` (hierarchical multi-select tree panel on a Radix Popover — search + Selected/Available
  grouping + mixed/indeterminate parents + expand/collapse + roving keyboard nav; pixel-sealed vs Figma
  783:4815) shipped PR #43 `3a25f6b`, sealed PR #45 `0def396`. `SelectField` (the full control = ContentTitle
  + SelectTrigger + FeedbackText + a config ActionMenu; default state pixel-sealed vs 783:4809) sealed PR #46
  `e72a48b`. Both REPLACE the deleted monolithic `Select.tsx` (PR #44 `795638a`). The independent (doer≠checker)
  verdict caught a real feedback-icon bug 4 owner-review rounds missed → fixed as a flexible `feedbackShowIcon`
  prop. Established the system-wide **FLEXIBILITY principle** (Figma frames are ILLUSTRATIVE examples, not
  mandates; expose variability as props; AI configures per data/context/user) — MEMORY
  `feedback_figma_is_example_not_mandate` + each spec's `## ⚠️ FLEXIBILITY` section.

- **⭐⭐ (2026-07-23) MERGED TO MASTER — PR #27 (`61c9c01`).** The whole molecule-foundation continuation since #26:
  MetricCard redesign (CardHeader/Callout/Badge/MetricSummaryCard), the new `TrendRow` molecule, the charts
  (`LineWithPreviousChart`/`ChartTooltip`/`LineSeriesTooltip`), the table subsystem (TreeDataTable + 9 parts), the
  §-play-gates (selectslicercompact/treedatatable/metricsummarycard), the re-seals (Badge/Callout/CardHeader/TrendRow/
  disclosuretabletoggle), and the DS thin-scrollbar/carousel-gap/theme fixes. 14 new + 10 modified components. Branch
  green; resolved the squash-divergence with `-s ours`. PLG `App.tsx` trendRows migration committed (`21c04a1`). Only
  the optional ⑤ evidence-signing (advisory) remains.

- [x] Three-stage factory line (create/verify/deploy) sharing one governor retrospective — built +
  2-governor-red-teamed + pushed 2026-06-29 (`66e78f8` / `51488cd` / `eac1eb0`); runbook `6028792`.
