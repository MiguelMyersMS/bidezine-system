# Deployment Verification Protocol (Assembled Figma → Deployed App)

> How an **assembled Figma prototype** — a frame that composes design-system
> components with real content + data (e.g. RailNav node `289-4585`) — reaches a
> **consumer-app deployment** (e.g. the PLG Rayfin dashboard) with the same
> near-zero-human-inspection guarantee the component pipeline gives. The human
> stays at exactly two gates: approving the Figma assembly as authoritative, and
> **signing off that the coverage matrix is complete.**
>
> This is **Phase 7 — DEPLOY** of the Figma → Storybook pipeline. It runs *after*
> a component is VERIFIED (`PROTOCOL.md` Phase 5). It does not replace any phase —
> it extends the audit's reach from Storybook to the deployed app.

## Why this exists (the missing layer)

`PROTOCOL.md` verifies a Figma node against **three** targets — the **spec**, the
**component** (`src/gallery/<El>.tsx`), and the **story** (`<El>.stories.tsx`). All
three live inside the design system. **None of them is the deployed consumer app.**

A consumer app (Rayfin/Fabric dashboards) is a **fourth parallel surface**. It
composes the verified component with:

- **app data** — `nav-config.ts` content (labels, badges, which sections/items),
- **wired props** — `panelMenuItems`, `searchable`, `activeItem`, `logo`, …,
- **app-side assets** — icons the app reaches for when the design system lacks one.

It can silently diverge from the Figma assembly **while the component AND the story
both pass every check** — the exact failure mode that Phase 2c (Figma→Story) was
created to close, now one level further out. The blind spot `story-uses-ds-constants`
caught a parallel surface inside the repo; the deployed app is that same parallel
surface *outside* the repo, and nothing audits it.

**Observed failure (the origin):** RailNav node `289-4585` deployed into the PLG
dashboard. The component matched Storybook perfectly. The **deployment** diverged on
**9 distinct items across 4 layers** — two icons improvised in the app, a missing
panel-header menu (unwired prop), wrong active-item semantics (data), a chevron
direction the component itself diverges on, plus rulings. An AI fixed the 1–2 items
it happened to notice and declared the task done. The other 7 stayed invisible —
because no protocol held the *deployment* to the *complete assembly*.

## The core principle (extends PROTOCOL.md)

Same philosophy as the component pipeline — **AI is a great translator, a poor
inspector** — so we never rely on it "remembering to look." Two rules carry it:

1. **Completeness is a MACHINE gate, not a human sign-off.** The required artifact is
   a structured **coverage matrix** (the ```yaml front-block of `docs/deploy/<app>/<assembly>.deploy.md`,
   schema: [`docs/deploy/_TEMPLATE.deploy.md`](../deploy/_TEMPLATE.deploy.md)) that routes
   EVERY Figma node to its layer. `scripts/audit-deployment.js` (in `npm run health`)
   computes a **set-difference against the recorded raw Figma fetch** and **fails the
   build** for any node present in ground truth but absent from the matrix. This is
   what makes "find all the pieces" mechanical — a forgotten node is a red build, not
   something an AI must remember to notice. **The human signs off JUDGMENT** (rulings,
   accepted deviations) — **never coverage.** "The AI stopped finding things" is not a
   gate; the set-difference is. **No fix may be applied while the audit is red.**

2. **Every gap lives in exactly one layer; the fix goes to that layer's repo —
   never improvised in the app.** Improvising an asset (icon/token) or authoring a
   component inside the consumer app is a protocol violation.

### The four layers (gap taxonomy)

| Layer | What lives here | Where the fix goes | Verified by |
|---|---|---|---|
| **L1 — DS Component** | structure, states, geometry, behavior | design system `src/gallery/<El>.tsx` + story | `PROTOCOL.md` Phases 1–5 + Storybook |
| **L2 — DS Asset** | icons, tokens, fonts the assembly references | design system `src/icons`, `tokens.ts` + Foundations story | `icon-protocol.md` + Storybook |
| **L3 — App Data/Config** | content (labels, badges, sections), wired props (`panelMenuItems`, `searchable`, `activeItem`, `logo`) | consumer app (`nav-config.ts`, `App.tsx`) — **DATA ONLY** | consumer `tsc` + deployed render |
| **L4 — Needs Ruling** | ambiguities the frame can't resolve (logo identity/clickability, intentional vs accidental divergence) | owner decision, **recorded** in the matrix | owner sign-off |

### What "done" means — the completeness bar

A single assembled Figma frame is a **snapshot**: it cannot contain a component's full
state space, its content (menu items behind a closed button), or its behavior. So the
deployment is NOT verified by node-routing a frame as if it were the whole spec — that
was a category error. Instead:

**The consumer app consumes the Storybook-verified component, so it *inherits* that
component's property / state / behavior fidelity** — it cannot diverge on a padding,
token, or state the component owns. Deployment completeness therefore does NOT
re-verify the component node-by-node (that is `/evidence-pipeline`'s job, Phase 5). It
reduces to a small, checkable surface plus one hard finish line:

- **L2 assets** exist in the DS (no app-side substitutes),
- **L3 data + props** wired to produce the intended composition + states,
- **L4 rulings** decided,
- **TRIANGULATION (the proof):** `app == Storybook` (configured with the deployment's
  data) **and** `app == Figma`. If the app renders identically to the verified Storybook
  story for the given data, fidelity is proven by transitivity (Storybook == Figma was
  verified in Phase 5).

**Component-internal nodes are routed `inherited`, never re-claimed `match`.** A
divergence in a component node (e.g. the active-expanded chevron direction) is
**escalated to the component evidence pipeline (`/evidence-pipeline`)** — it affects every consumer and is fixed in the
component pipeline, not patched in the deployment.

**Inheritance requires PROVEN behavior, not just static parity.** "Inherited fidelity"
holds ONLY if the component's behavioral suite (`npm run test:behavior`) passes — a static
Storybook screenshot proves *look*, never *behavior* (search filtering, expand/collapse,
scroll, elevation-not-clipped). A green static matrix with a red/absent behavior gate is a
**false "done"** (RailNav 2026-06-13: search/collapse/subtitle/elevation all looked right
statically but were broken). The Storybook story the deployment inherits from MUST render
the **shipped component** (never a parallel demo) and pass its behavior gate.

**Composition inventory — every slot, not just data.** The deployment must account for the
reference's FULL component prop/slot surface — `logo / sections / footerSections /
utilityItems / footer / overflow` — not only the nav data. A data-only replica silently
drops slots that are *rendered nodes, not data* (RailNav: the pinned `utilityItems` button
was missed because it isn't in the nav tree). Diff every prop the reference passes.

**Doc-gap net (the safety net):** a Figma property or state the deployment needs that
is NOT captured in the component spec family / `interaction-patterns.md` is a
`DOC-INCOMPLETE` finding — surfaced, never absorbed. Uncaptured states the data does
not yet ask for are *future capability*, not deployment gaps.

## The flow

```
(0) ASSEMBLY        (1) INVENTORY          (2) ROUTE            (3) GATE              (4) REMEDIATE         (5) TRIANGULATE
   approve the      exhaustive extract     each item → layer    owner signs off       fix L2 → L1 → L3 →    app == Figma ==
   assembled node   (reuse PROTOCOL §1)    + status (matrix)    the COMPLETE matrix   L4, lowest first      Storybook; matrix all ✅
   as truth                                                     ❗ NO fixes before
```

## Phase 0 — Assembly inputs

- Figma file key + the **assembled node id** (the prototype that composes the
  components — e.g. `289-4585` — not a single component node).
- The consumer app + its `@miguel/design-system` dependency. Confirm the dependency
  is a live symlink **and** the app's `vite.config` lists it in `optimizeDeps.exclude`
  (otherwise a stale Vite pre-bundle masks every change — see the Rayfin build method).
- The component specs (`docs/atomic/…`) the assembly composes — the contracts the
  components already encode.

## Phase 1 — Total spec inventory (reuse the Deep Figma Audit)

**STOP CONDITION — Figma MCP gate (inherited from PROTOCOL.md).** You MUST call
`get_figma_data` for the assembly node (depth ≥ 6) and present the raw extraction
**before** any comparison. Reading `nav-config.ts`, the spec, or session memory is
**not** a substitute for fetching the assembly node.

**STOP CONDITION — review the RENDERING, not just the tree (`rendered-image-reviewed`).** Before
trusting the node tree, **export the assembly to a PNG and look at it** — that is the deliverable.
The node tree includes **hidden** layers (`visible:false`: default placeholders, alternate states,
scratch). Treating a hidden node as content is the "looked complete, was wrong" failure (a hidden
default-subtitle placeholder was once surfaced as live copy). Therefore: **the ground truth and
matrix are built from the VISIBLE state.** Every `visible:false` node is routed `ignore` (reason:
"hidden in Figma"), NEVER `match`/`inherited`/`gap`/`ruling`. Record `visible:` per node in the
ground truth so `audit-deployment.js` enforces it (a hidden node routed as content is a blocker).

**Save the raw `get_figma_data` output VERBATIM** to
`docs/deploy/<app>/<assembly>.figma.yaml` and point `assembly.groundTruth` at it.
This file is the **machine's ground truth** for the Phase 3 coverage gate — the
audit diffs the matrix against the node ids in its `nodes:` tree. It is recorded
once and never hand-edited; re-fetch to update it.

Run `PROTOCOL.md` § "Deep Figma Audit Procedure" **Phase 1** on the assembly node —
the SAME exhaustive extraction (every instance, text, icon, token, dimension, and
**state**). The assembly adds four extraction targets the component-level audit does
not have:

| Assembly-specific category | What to extract | Maps to layer |
|---|---|---|
| **Content values** | every TEXT that is *data* — section/item labels, badges, header title, subtitle | L3 (app data) |
| **Composed instances + states** | every component instance + its variant/state (`RailButton state=active`, `NavRow depth=0 state=active-expanded`) | L1 (component) + L3 (active state from data) |
| **Icon identity per slot** | the exact Fluent icon in every Icon/Slot (`Arrow Trending Checkmark`, `Card UI Info`) | L2 (must exist in DS) |
| **Present-but-optional elements** | elements the assembly *shows* that are component options (EllipsisButton, search row, footer items) — each implies a **prop the app must wire** | L3 (wired prop) |

Output: the inventory table — **every assembly leaf node appears exactly once.**

## Phase 2 — Route each item to a layer (the coverage matrix)

For each inventory item, determine its **status** and its **layer**:

- Covered by the DS component as-is, and the app composes it correctly → ✅
- Needs a DS asset (icon/token) — does it exist in the DS? → **L2** gap if missing
- Driven by app data/props — is it wired and correct? → **L3** gap if not
- The component itself diverges from the assembly's state/geometry → **L1** gap
  (this affects Storybook too — escalate to `PROTOCOL.md`)
- Ambiguous / not resolvable from the frame → **L4** ruling

**The matrix IS the artifact.** Canonical format:

| # | Figma item (node) | State / variant | Layer | App / DS actual | Status |
|---|---|---|---|---|---|
| 1 | NavRow "Product-Led Growth" icon (`Arrow Trending Checkmark`) | active-expanded | L2 + L3 | `IconTrendUp` (substitute; icon missing from DS) | ❌ |
| 2 | PanelHeader `EllipsisButton` (action menu) | present | L3 | no `panelMenuItems` passed → not rendered | ❌ |
| … | … | … | … | … | … |

**Completeness reconciliation is machine-checked (Phase 3a).** Every node in the
ground-truth fetch MUST appear in the matrix — routed *or* explicitly `ignore`d with
a `reason`. `scripts/audit-deployment.js` enforces this set-difference and fails the
build on any orphan. The matrix is not "done" because findings stopped appearing; it
is done when the audit is green.

## Phase 3 — Completeness gate (machine) + judgment sign-off (human)

> ❗ **NO FIX may be applied while the audit is red.** This is the single rule that
> ends piecemeal patching — and it is enforced by a script, not by anyone's attention.

**3a — Machine coverage gate (the real gate).** Run `npm run audit:deployment` (also
in `npm run health`). `scripts/audit-deployment.js` parses the recorded ground-truth
Figma fetch (`assembly.groundTruth`), extracts every node id from its `nodes:` tree,
and **fails the build** for:

- any ground-truth node **absent** from the `matrix` (MISSED — the core check),
- any `matrix` row referencing a node **not** in ground truth (phantom/stale),
- any row with an invalid/missing `layer` / `status` / `severity`, an `ignore`
  without a `reason`, a `gap`/`ruling` without a severity, or a duplicate node,
- `signoff.complete: true` while any of the above hold.

Coverage is **green or it is not done.** "The AI stopped finding things" is not a
signal; the set-difference is. A node the agent forgot to route is a red build.

**3b — Judgment sign-off (human, AFTER 3a is green).** With coverage proven complete
by the machine, the owner reviews the **routed gaps and rulings** — *not* whether
everything was found (the machine guarantees that), only the **decisions**: accept a
deviation, confirm a severity, resolve an L4 ruling. The owner then sets
`signoff.complete: true` (the audit refuses it while 3a is red). Only then does
remediation begin.

> A real miss the machine *cannot* see (e.g. a behavior Figma doesn't encode) becomes
> a **new required category** in the schema + a new check in `audit-deployment.js` —
> exactly how `PROTOCOL.md`'s blind-spots table grows. Misses upgrade the machine, not
> just the matrix.

## Phase 4 — Layered remediation (lowest layer first)

Fix in this order — lower layers are dependencies of higher ones, so fixing top-down
forces re-improvising:

1. **L2 — DS assets first.** Add missing icons to the design system **by fetching the
   canonical SVGs from the official Microsoft `fluentui-system-icons` repo**
   (`raw.githubusercontent.com/.../assets/<Name>/SVG/ic_fluent_<name>_20_{regular,filled}.svg`)
   — the Figma `componentSets.name` IS the icon name. Follow
   [`../icon-protocol.md`](../icon-protocol.md) step-by-step: both Regular + Filled,
   `viewBox 0 0 20 20`, `#212121` → `{color}`, export from `index.ts`,
   `npm run registry:refresh`. **NEVER** take the icon from the Figma render (it is the
   wrong viewBox / a single variant) and **NEVER** substitute a similar icon in the
   app. Fixing app data before the asset exists guarantees a substitute. *(If you reach
   the asset step without already knowing to go to the official repo, that is itself a
   `DOC-INCOMPLETE` finding against this step — fix the wording so the next agent can't
   miss it.)*
2. **L1 — DS component.** Resolve component/spec divergences via `PROTOCOL.md`
   Phases 1–5 + Storybook. These propagate to *every* consumer.
3. **L3 — App data/config.** Point `nav-config.ts` / props at the now-correct assets
   and component options. **DATA ONLY — no component authored in the app.**
4. **L4 — Rulings.** Apply the owner's decisions; record each in the matrix and the
   relevant spec's discrepancy table.

After L1/L2 changes: design-system `tsc` + Storybook build, then consumer `tsc`. (The
consumer's stricter `tsc` is a useful extra gate — it has caught DS bugs the DS `tsc`
missed.)

## Phase 5 — Triangulated verification

The deployment is **done** only when all THREE sources agree:

1. **Render the app where it is actually viewable, then refresh.**
   - ⚠️ **Fabric / Power BI-embedded apps (e.g. PLG_dashboard) CANNOT be viewed at
     `localhost:5173`.** A local Vite dev server (and the `&devUri=localhost:5173`
     Fabric-shell trick) does **not** work in this environment. The **only** way to see
     the app is to **deploy it to the app's Power BI / Fabric artifact** (e.g.
     `PLG_dashboard - Power BI`) and **refresh that artifact**. The screenshot for this
     phase must come from the deployed Power BI artifact — never a localhost render.
   - The consumer builds against the **local `file:` symlink** to the design system, so a
     fresh `vite build` bundles the current on-disk (committed) DS source — the stale
     `node_modules/.vite` *optimize* cache is a **dev-server-only** concern and does not
     affect the production build that gets deployed. (For consumers that *can* run a local
     dev server, `rm -rf node_modules/.vite` before viewing still applies.)
2. **App render == Figma assembly** — screenshot the deployed surface; compare to the
   Figma export (vision, + pixel where feasible).
3. **App render == Storybook component** — the deployed surface must match the
   VERIFIED Storybook story.
4. **Re-run the Phase 2 matrix** — every row is now ✅ or a recorded L4 ruling.

Record the three screenshots as the deployment's verification artifact. A deployment
declared done without the triangulated check is **incomplete**. For Fabric/Power BI apps,
the `app.png` artifact is the **deployed Power BI artifact**, captured after deploy+refresh.

## Required artifacts

| Path | Role |
|---|---|
| `docs/deploy/_TEMPLATE.deploy.md` (this repo) | the schema (copy per deployment) |
| `<consumer>/docs/design-system-handoffs/<release>/<assembly>.figma.yaml` | raw Figma ground truth, verbatim (Phase 1) |
| `<consumer>/docs/design-system-handoffs/<release>/deploy.md` | inventory + coverage matrix front-block (Phases 2–3) |
| `scripts/audit-deployment.js` (this repo, run with `DEPLOY_DIR=<consumer handoff root>`) | machine completeness gate |
| `<consumer>/docs/design-system-handoffs/<release>/verify/{figma,storybook,app}.png` | triangulated screenshots (Phase 5) |

> **Artifacts live in the CONSUMER's own workspace** (`<consumer>/docs/design-system-handoffs/`), NOT
> in this design-language repo. Storing a consumer's ground-truth/wiring/snapshot here is what let a
> tool replicate the consumer app — never do it. This repo ships only the generic schema + the audit
> TOOL; the audit runs against the consumer's handoff via `DEPLOY_DIR`, and is NOT part of `npm run
> health` (DS health must not gate on per-project deploy data).

## Integration with the existing pipeline

- This is **Phase 7 — DEPLOY** in the `PROTOCOL.md` loop, after **GATE**. A component
  must be VERIFIED (Phase 5) before an assembly that uses it is deployed.
- **Completeness is enforced by `scripts/audit-deployment.js` in `npm run health`**
  (and `npm run audit:deployment`) — a red build blocks the deployment exactly as
  `audit-specs.js` blocks an incomplete spec. This is the machine analogue of the
  Governor's "verify, don't re-derive" rule: the Governor reads a green audit, it does
  not re-extract the Figma by eye.
- The Rayfin build method (`data-model-system/methods/rayfin-data-app-build-method.md`)
  Step 8 **"Design fidelity"** gate is *satisfied by* the signed-off coverage matrix +
  the triangulated screenshots. Update that gate to require this artifact.
- The **`/figma-deploy <assembly> <app>` skill** (`.claude/skills/figma-deploy/SKILL.md`) runs the
  design-system side end-to-end — triage → spec/verify → assemble → build the handoff folder at
  `lifecycle.status: handed-off` (Phases 1, 2, 5) — and **emits the paste-ready consumer prompt**,
  leaving `deployed`/sign-off (Phase 3) and fixes (Phase 4) to the consumer + owner. Sign-off is
  machine-gated (`audit-deploy-lifecycle.js`): the consumer must return `import_proof`, `no_fork`,
  and `app.png`. See `docs/deploy/DEPLOYMENT_HANDOFF_LIFECYCLE.md`.

## Blind spots (observed deployment failures → guards)

| Blind spot | What happened | Guard (checklist id) |
|---|---|---|
| **Deployment is a parallel surface never audited** | RailNav `289-4585` → PLG: the component matched Storybook, but the deployment diverged on 9 items across 4 layers. The component/story audit never walked the app's data/props. | `deployment-surface-audited` |
| **Asset improvised in the app** | Correct icons (`Arrow Trending Checkmark`, `Card UI Info`) were missing from the DS, so the app silently substituted `IconTrendUp` / `IconApps`. | `no-app-side-asset-improvising` |
| **Present-but-optional element dropped** | The Figma assembly shows the panel-header ellipsis menu; the app passed no `panelMenuItems`, so it never rendered — invisible in a "looks about right" review. | `optional-element-prop-wired` |
| **Composed state driven by data not verified** | `activeItem` was a *group* id, not a leaf; the active-expanded look the assembly shows never rendered. | `composed-state-matches-assembly` |
| **Fix-before-complete** | The AI fixed the 1–2 items it noticed, declared done; 7 stayed invisible. A passive "be thorough" instruction did not prevent it. | `no-fix-before-matrix-signoff` |
| **Behavior assumed inherited, never gated** | RailNav search/collapse/subtitle "looked done" in a static Storybook + green matrix, but were broken. Static parity ≠ behavior. | `behavior-test-gated` |
| **Composition slot dropped (data-only replica)** | The unification view mirrored the nav data but omitted the pinned `utilityItems` button — a rendered slot, not nav data. | `composition-slots-complete` |
| **Elevation clipped by an overflow ancestor** | The panel `boxShadow` was truncated by its collapse wrapper (component) and by the consumer's container (PLG) — shadow showed partially or not at all. | `elevation-not-clipped` |
| **Hidden layer treated as content** | Inventory was built from the raw Figma node tree, which includes `visible:false` layers; a hidden default-subtitle placeholder ("lorem ipsum") was surfaced as live content. The rendered design never showed it. Reading the *tree* is not reviewing the *rendering*. | `visible-only-ground-truth` (audit: a `visible:false` node routed as anything but `ignore` is a blocker) + `rendered-image-reviewed` |
| **Per-element asset approximated, not read** | The R2 nav-config applied ONE icon (`IconDataUsageSparkle`) as a blanket stand-in for all 6 panel items, but Figma showed 6 DISTINCT per-item icons. The DS generated its own approximation instead of reading each element's actual asset (each `Icon/Slot → <icon instance>`). PLG rightly rejected it (GR5). | `per-element-asset-read` — read EVERY element's actual asset (icon name, text, color) from Figma individually; NEVER a blanket/approximated value. Missing DS assets are added upstream (here: 5 Fluent icons), not substituted in the app. |
| **Proxy substituted for opening the image** | Asked to FIND a Figma change, the agent exported the assembly PNG and compared **byte size** (119,619 vs 119,452, within 0.1%) instead of opening it — declared "unchanged," deleted it, and missed a logo swap + two disabled icons. It invented a size proxy to avoid looking, in the very turn it had committed to look. | `no-proxy-for-render-compare` — a file size, hash, byte count, or node count is NEVER a substitute for opening and reading the rendered pixels. + `independent-verify-pass` — verification is done by a SEPARATE pass (`/deployment-verify`), not the builder, because the builder rationalizes its own shortcut (doer ≠ checker). |

## Anti-patterns (STOP CONDITIONS — hard stops, not suggestions)

1. **Fix before a complete, signed-off matrix.** If you are about to change ANY app
   or DS file before the coverage matrix is complete and the owner has signed off —
   STOP. Completeness is the deliverable; fixing is Phase 4. This is the exact failure
   that motivated the protocol: a passive table does not prevent it, only a hard gate
   does.
2. **Improvise an asset in the app.** If a Figma-specified icon/token is not in the DS
   and you're about to use a "close enough" substitute in the consumer — STOP. The
   asset goes in the DS (L2). A substitute requires an explicit, recorded L4 ruling.
3. **Author a component in the app.** If you're writing a sidebar/rail/menu/card
   component inside the consumer app — STOP. UI is authored once, in the design system.
4. **Declare done without triangulation.** If you're calling a deployment complete
   without `app == Figma == Storybook` screenshots — STOP. Phase 5 is mandatory.

> **Origin:** User direction 2026-06-12: *"there should be documentation, guidance,
> and protocol that manages every specification, reads the figma prototype with all
> its instructions and deploy it correctly based on the guidance … the system is
> incapable to find all the missing pieces because it is not fully understanding what
> they are … it is strange because in the Storybook the component has everything."*
> Codified after RailNav `289-4585` → PLG dashboard repeatedly deployed as a partial,
> drifted sidebar: the component was correct in Storybook, but no protocol held the
> *deployment* to the complete assembly, so an AI patched whatever it noticed and the
> rest stayed invisible. The 9-gap inventory that exposed the problem is this
> protocol's first worked example — to be run end-to-end once the protocol is signed off.
