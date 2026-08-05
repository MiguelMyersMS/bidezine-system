# RailNav Panel Unification + Behavioral Verification — Initiative Ledger

> **Status:** PROPOSED (awaiting first Governor ratification at Cycle 132).
> **Owner ratified the framing** on 2026-06-12: fix the *fundamental* cause, not symptoms
> (see memory `feedback_fix_root_cause_not_symptoms`). This ledger is the single source of
> truth for the initiative; the `/sync-step` loop refines + executes it phase by phase.
> Provenance: PLG_dashboard live-app review (2026-06-12) surfaced behavior bugs that a
> green static deployment matrix missed.

---

## 1. The disease (two root causes — fix THESE, the bugs fall out)

The recurring project disease is piecemeal drift-and-patch (notice a few things, fix them,
declare done). It reappeared at the **behavior** layer in RailNav. Two structural causes:

### Root cause A — Duplication: the complete implementation lives in a DEMO, not the PRODUCT
- `SidebarPanelSpec` (a **Storybook story** in `src/gallery/RailNav.stories.tsx`) has the
  full behavior: search **filtering**, expand/collapse state, subtitle **wrap**, scroll.
- The **built-in panel inside `src/gallery/RailNav.tsx`** — what consumers actually ship
  (PLG uses it) — is missing those.
- Commit `49b3dee` unified the **rows** (`NavRowShell`) but left **panel-level behavior**
  duplicated + divergent. A demo being ahead of the product *guarantees* drift.

### Root cause B — Verification certifies STRUCTURE, never BEHAVIOR
- The machine gate proves: every Figma node maps to something + static render matches a
  static frame. **Nothing proves** search filters, expand/collapse works, lists scroll,
  empty sections behave. So "machine-green / inherited fidelity" is a false guarantee —
  the exact disease the project exists to kill, one level deeper. A green 289 matrix
  shipped a broken panel.

### Evidence (PLG live review 2026-06-12)
| # | Symptom | Cause | Layer |
|---|---|---|---|
| 1 | Subtitle truncates to 1 line (Figma/Storybook wrap) | built-in panel `whiteSpace:nowrap` (RailNav.tsx subtitle span) | A |
| 2 | Expand all / Collapse all do nothing | auto-expand effect re-opens the active group every render (RailNav.tsx ~L287–306) | A |
| 3 | Parent expand/collapse broken | same as #2 | A |
| 4 | Search box doesn't filter | input value captured (~L714–765) but `panelSection.items` never filtered (~L779) | A |
| 5 | No elevation shadow | component sets `boxShadow: elev.mid` (L617) → app container clips it | **B/C (consumer)** |
| 6 | Settings/Data don't open a panel | `items: []` + empty-section behavior | config + A |

Environment (fonts, theme provider, tokens, dimensions) is **correct** — proven by the
screenshot. The bugs are NOT integration; they are component-behavior + verification gaps.

---

## 2. The principle (ratified)

1. **One implementation.** The shipped RailNav panel is the single source of truth for ALL
   panel behavior. The `SidebarPanelSpec` story must **consume the real component**, not
   reimplement it. A demo can never again be ahead of the product.
2. **Behavior is verified, not assumed.** The component declares behaviors as testable
   assertions; interaction tests exercise them; the health gate fails on regression. Only
   then does a deployment genuinely *inherit* fidelity.
3. **Generalize.** Both fixes are encoded in the **spec template + protocol** so EVERY
   future component benefits — this is the scalable part, not a one-off RailNav patch.

Definition of done for the initiative = **single implementation + behavior verified**, NOT
"the 6 symptoms fixed." Guardrail: if the Implementor finds itself patching individual
behaviors without consolidating the implementation, **STOP** — that is the anti-pattern.

---

## 3. Phases (loop executes in order; each is a reviewable cycle)

### Phase 0 — Ratify + design the unified panel API  *(Governor + user; little/no code)*
- Governor ratifies this ledger's sequencing + the principle.
- Decide the component API for behaviors currently only in `SidebarPanelSpec`:
  - **Search filtering** — built-in; filters the rendered tree by query (recursive).
  - **Search visibility** — session preference surviving collapse + section-switch
    (see `docs/interaction-patterns.md` § Search box behavior). Today `searchable` is a
    static prop; reconcile who owns visibility (component vs consumer + menu toggle).
  - **Expand/collapse state model** — `expandedGroups` is the SINGLE source of truth;
    auto-expand only **seeds** on mount / when `activeItem` changes and must **never**
    override an explicit user collapse. (⚠️ This effect has an infinite-loop history —
    `allSections` is recreated each render; see the guard comment ~L294. Likely fix:
    memoize `allSections` + seed-once semantics. Governor must ratify.)
  - **`initialExpandedIds` per section** (SidebarPanelSpec has it; built-in doesn't).
- **Open items requiring user authorization (STOP-gated)** — surface, don't auto-do:
  - Behavioral test infra = **package.json change** (STOP #1): Storybook test-runner
    (`@storybook/test-runner` + Playwright) vs reuse existing `test:visual` Playwright.
  - Spec-template + protocol + possibly `AGENTS.md` Golden Rule edits (STOP #2/#3).

#### Phase 0 — DECIDED (owner, 2026-06-13)
- **D1 — Test infra:** **Storybook test-runner** (`@storybook/test-runner` + Playwright).
  Owner authorized the dev-dependency by selecting *"Storybook test-runner (recommended) —
  Add @storybook/test-runner + Playwright … Adds a dev dependency."* — verbatim STOP #1
  authorization to add those dev deps to `package.json`.
- **D2 — Phase 3 STOP-gated edits:** **Per-instance approval.** The loop STOPs and surfaces
  each STOP-gated edit (`_TEMPLATE.spec.md`, `DEPLOYMENT_VERIFICATION_PROTOCOL.md`, the Rayfin
  build method, any `AGENTS.md` Golden Rule) for explicit OK. No batch pre-auth.
- **D3 — `<SidebarPanel>` visibility:** **Internal-first.** RailNav renders it; NOT exported
  from the barrel. Revisit only if a consumer needs it standalone.
- **State model (ratified, carry into 1b):** `expandedGroups` single source of truth;
  auto-expand seeded once (memoize `allSections` + a "seeded" ref); never overrides user collapse.
- **a11y assertions added to Phase 2 scope:** `aria-expanded` on toggles, focus management on
  collapse, search result-count/empty announced to AT.

### Sequencing note — Phases 1 & 2 run TEST-FIRST and INTERLEAVED  *(ADDITION 2, ratified to fold in)*
Author the behavioral contract + **failing** interaction tests (Phase 2) **first**, against
the *target* behavior, then let the Phase 1 unification refactor turn them green. The risky
refactor lands test-protected, not test-after. Governor ratifies this ordering.

### Phase 1 — Unify the panel: extract ONE `<SidebarPanel>` component  *(ADDITION 1, ratified to fold in)*
> **Progress:** ✅ **1a DONE (Cycle 133, 2026-06-13)** — internal `SidebarPanel` extracted in
> `RailNav.tsx` (not exported); RailNav renders it; pure refactor, `Deployed289` pixel-identical,
> `tsc` + `audit:deployment` green; `@storybook/test-runner` dev-dep + `test:behavior` script added.
> **1b DONE (Cycle 134, 2026-06-13)** — expand/collapse state model fixed test-first:
> harness operational (chromium + smoke), `ExpandCollapseContract` test failed pre-fix / passes
> post-fix; `allSections` memoized + `autoExpandSeededRef` seed-once; collapse now persists; no
> regression (Deployed289 initial render unchanged). `test:behavior`→`health` wiring still
> deferred — blocked by a pre-existing `Dialog.stories.tsx` failure (own cycle to fix, then wire).
> **GATE LIVE (Cycle 135, 2026-06-13, slotted by owner):** fixed the Dialog test
> (`pointerEventsCheck:0`) → full `test:behavior` suite green (37 suites / 148 tests); wired a
> dep-free `[behavior]` step into `npm run health` (`run-audits.js` — probes :6006, runs
> `test-storybook` as a blocker, `--skip-behavior` escape). Component BEHAVIOR is now
> machine-enforced. Contract change: `health` now requires Storybook running (or --skip-behavior).
> **Progress visibility (owner-requested):** ONE Storybook view — `Deployed289` ("Deployment —
> PLG 289:4585") — renders the live panel + a `UNIFICATION_PROGRESS` checklist (✓/○). **Each
> cycle, flip its item to `true`.** The behavioral test story is hidden from the sidebar
> (`tags: ['!dev']`) but still gates in test-storybook. Capture:
> `node scripts/capture-289-progress.mjs` → `railnav-289-4585-verify/progress/289-progress.png`.
> **PHASE 1 — behavior goals COMPLETE (2026-06-13, continuous run):** 1c search filtering
> (`filterRailItems`, ported) ✓ · 1d subtitle wrap + elevation/scroll/overflow parity ✓. The
> shipped `<SidebarPanel>` now reaches **full parity with the perfected Default** (verified
> side-by-side on identical Figma data). behavior gate green; `audit:deployment` green.
> **⚠ 1e dedup was REVERTED per owner (2026-06-13):** the owner wants BOTH the `Default`
> (reference) and `Deployed289` (unification) views kept for ongoing side-by-side comparison, so
> the duplicate `SidebarPanelSpec` stays for now. Checklist item reframed "dedup" → "Matches the
> Default reference (compare side-by-side)" ✓. Visible RailNav stories = `Default` + `Deployed289`
> (+ 3 hidden contract tests). **Dedup deferred** until the owner is done comparing — re-run 1e then.
> **Dead-code tidy DONE (2026-06-13):** pruned ~552 lines of pre-existing dead test-data from the
> story (1780→1228); tsc + behavior gate 6/6 green.
> **PHASE 3 — design-system substance COMPLETE (2026-06-13, owner-authorized continuous run):**
> `_TEMPLATE.spec.md` gained a `behaviors:` block + a Behaviors section + 4 guards
> (behavior-test-gated, story-renders-shipped-component, composition-slots-complete,
> elevation-not-clipped); `DEPLOYMENT_VERIFICATION_PROTOCOL.md` gained the behavioral-inheritance +
> composition-inventory clauses + 3 blind-spot guards; `ADR-005` records the decision. Two boundary
> items (both NOW APPLIED, owner-authorized 2026-06-13): **AGENTS.md Golden Rule #5** (+ DECISION_LOG
> D-006) and the **Rayfin build-method Step-8** gate (`data-model-system` commit `0003003`, local).
> Also fixed along the way: bottom-rail `utilityItems` miss, the elevation-clip bug (+ `ElevationContract`
> test), and the nested expand/collapse single-source finding (+ `NestedExpandAllContract`).
> **✅ INITIATIVE COMPLETE.** PLG **289 deployed to Power BI**, `signoff.complete: true`, verified clean.
> Behavior gate 7/7 (RailNav) / 151/151 (full); one shipped `<SidebarPanel>`; lessons generalized
> (template + protocol + ADR-005 + GR5). Nothing open.
- **Make "one implementation" literal:** extract a single, exported `<SidebarPanel>`
  component that owns ALL panel behavior (subtitle wrap, search filtering, expand/collapse
  per the ratified state model, elevation, scroll, overflow, empty-section, disabled).
  - `RailNav`'s built-in panel **renders `<SidebarPanel>`** (no inline panel logic).
  - The `SidebarPanelSpec` story **renders the real `<SidebarPanel>`** — delete the duplicate
    `renderSpecNodes` / `expandedIds` / filtering logic. Any remaining wrapper configures
    props only, never reimplements behavior.
  - So the demo, the built-in panel, and any standalone consumer all render the SAME
    component — duplication is structurally impossible, not just "converged this once."
- **Regression guard:** the `Deployed289` story + `docs/deploy/plg-dashboard/railnav-289-4585.deploy.md`
  matrix must still pass; `npm run audit:deployment` stays green; `tsc` passes.

### Phase 2 — Behavioral contract + interaction tests  *(authored first per the sequencing note)*
- Add a **Behaviors** section (testable assertions) to `railnav.spec.md` /
  `sidebarpanel.spec.md`: search filters; expand/collapse incl. active-descendant
  reconciliation; collapse-all closes even the active group's parent; empty section shows
  an empty panel; many items scroll (SCROLL convention); rail overflow collapses extra
  icons; disabled rows; subtitle wraps.
- Add interaction tests (play functions or Playwright) exercising each; wire into
  `npm run health`. The gate must FAIL on regression.

### Phase 3 — Generalize: spec template + protocol + the Rayfin build method
- `docs/atomic/_TEMPLATE.spec.md`: add a required **Behaviors** section.
- `docs/atomic/DEPLOYMENT_VERIFICATION_PROTOCOL.md` Phase 5 + `scripts/audit-*`: require the
  behavioral suite; state plainly that a static frame **cannot** certify behavior; inherited
  fidelity = the component's passing interaction suite.
- **Propagate to data-model-system** *(ADDITION 3, ratified to fold in)*: update the Rayfin
  build method's **Step 8 "Design fidelity"** gate (`data-model-system/methods/rayfin-data-app-build-method.md`)
  so it requires the component's passing behavioral suite, not just the signed-off static
  matrix. (data-model-system is a separate repo — this is a STOP-gated cross-repo edit;
  surface for authorization, or hand off as a brief to that repo's own sync loop.)
- Write an **ADR** in `docs/` capturing the *why* (demo-consumes-product; behavior-verified)
  so the rationale is durable beyond this loop.

### Phase 4 — Consumer fix (PLG, minimal)
- Fix the elevation **clip** in PLG `App.tsx` (container `overflow`). This is the ONLY
  genuine consumer-side change. Do NOT author component behavior in the consumer.

### Phase 5 — Capstone: deploy the unified `Default` view live (efficiency test)
- After unification, `Default` (= `SidebarPanelSpec`) renders the REAL component, so
  deploying it live is a true end-to-end test of the new system + protocol.
- Deploy to the **`PLG_dashboard - Power BI`** artifact (NOT localhost — see memory
  `project_plg_viewable_only_in_power_bi`), exercise the behaviors live, and confirm the
  behavioral suite **predicted reality** (no live-only bugs). Any live-only bug = a protocol
  miss → feed back into Phase 2/3. Capture `app.png`; set the matrix `signoff.complete: true`.

---

## 4. Context map (where everything lives)

- **Shipped panel (target):** `src/gallery/RailNav.tsx` — subtitle span (`whiteSpace:nowrap`),
  search input (~714–765, no filter), `panelSection.items.map` (~779), auto-expand effect
  (~287–306), panel `boxShadow: elev.mid` (617), `collectGroupIds` (added this session),
  `panelMenuItems` reserved-id handling (expand/collapse-all).
- **Duplicate behavior (to absorb then delete):** `src/gallery/RailNav.stories.tsx` —
  `SidebarPanelSpec`/`PanelShell`, `renderSpecNodes`, `getAllGroupIds`, `handleToggle`,
  rawTree search filtering, `searchVisible` lifted to shell, `initialExpandedIds`.
- **Deployment twin + regression guard:** `Deployed289` story (built-in panel) +
  `docs/deploy/plg-dashboard/railnav-289-4585.deploy.md` + `…-verify/{figma,storybook}.png`.
- **Specs:** `docs/atomic/organism/railnav.spec.md`, `organism/sidebarpanel.spec.md`,
  `molecule/navrow.spec.md`; template `docs/atomic/_TEMPLATE.spec.md`.
- **Protocol/gate:** `docs/atomic/PROTOCOL.md`, `DEPLOYMENT_VERIFICATION_PROTOCOL.md`,
  `scripts/audit-deployment.js`, `scripts/run-audits.js` (`npm run health`).
- **Behavior reference:** `docs/interaction-patterns.md` (§ Search box behavior).
- **Test infra:** `package.json` → `test:storybook`, `test:visual` (Playwright), `test:unit`
  (vitest TODO). Picking one is a STOP-gated dependency decision.

## 5. Guardrails / out of scope
- Do NOT symptom-patch the 6 bugs independently — consolidate the implementation (Phase 1).
- Do NOT break the 289 deployment (regression guard above).
- Elevation/overflow is a CONSUMER fix (Phase 4), not a component change.
- STOP-gated edits (package.json, AGENTS.md, sync/*, Golden Rule) must be surfaced for
  per-instance user authorization — never auto-applied.

## 6. Open questions for the first Governor review
1. Ratify the principle + phase sequencing — **including the three folded-in additions**:
   ADDITION 1 (extract one `<SidebarPanel>` component, Phase 1), ADDITION 2 (test-first /
   interleaved Phases 1&2), ADDITION 3 (propagate the behavioral gate to the Rayfin build
   method, Phase 3)?
2. Which behavioral test infra (Storybook test-runner vs Playwright) — and authorize the
   package.json change?
3. Ratify the expand/collapse state model (single source of truth + seed-once auto-expand)?
4. Confirm the `<SidebarPanel>` extraction is the right anti-duplication shape (vs RailNav
   owning panel logic that a wrapper mimics), and the fate of the `SidebarPanelSpec` story
   name (becomes a thin config story over the real component).
5. Confirm Phase 3 will touch `_TEMPLATE.spec.md` + protocol + the data-model-system build
   method (+ possibly AGENTS.md Golden Rule) — all STOP-gated; pre-authorize or per-instance?
