# Component Development Protocol (CDP)

**Status:** Agreed · **Date:** 2026-08-03 · **Owner:** Miguel Myers (Laptop A)
**Governs:** how every v2 component is taken from shadcn source to a deployed, verified component.
**Sits under:** ADR-006 (shadcn foundation) · **Supersedes for component work:** the ad-hoc
"Step 4 golden path" sequence in `SHADCN-V2-FOUNDATION-HANDOFF.md` §12.

---

## 0. Why this exists

The handoff doc describes *what* the pipeline produces. It does not describe *how fast we are allowed
to move through it*. Without that constraint the work collapses into a race to a finished component,
where analysis, review, and comparison get compressed into assumptions made by whoever is building.

This protocol exists to prevent exactly that.

---

## 1. The governing rule

> ### Every step ends with a stop.
> The step's artifact is presented. The owner reviews it. **No work on the next step begins until the
> owner says so.** No step may be skipped, merged, reordered, or run ahead. No work belonging to a later
> step may be done "while we're here."

Three mechanisms enforce it:

**1.1 The stop phrase.** A step ends with exactly this and nothing more:

> *Step N complete. Artifact: `<path>`. Awaiting your review.*

No preview of the next step, no "meanwhile I also…", no recommendations that assume approval.

**1.2 The parking lot.** Anything noticed that belongs to a later step is written to
`docs/components/<slug>/PARKING-LOT.md` — never acted on. The owner decides when an entry is picked up.
An observation is not a task.

**1.3 The source fence.** Each step declares which sources may be consulted. Reading a fenced source is
a protocol breach and must be declared, not quietly absorbed.

---

## 2. Phase A — make Figma the source of truth

| # | Step | Purpose | Artifact | Fence |
|---|---|---|---|---|
| 0 | **Scope & fence** | Name the target; declare permitted sources; **declare prior contamination** | `00-scope.md` | — |
| 1 | **Select component** | One component, in isolation | (in `00-scope.md`) | — |
| 2 | **Dissect** | Document every part. Nothing overlooked. Classify per Atomic Design. Map in Figma | `02-anatomy.md` + Figma map | **v1 DS closed** |
| 3 | **Observations** | List observations, issues, gaps | `03-observations.md` | **v1 DS closed** |
| 4 | **Review & plan** | Review and discuss the observations; plan. Feasibility of adopting ideas fresh in shadcn | `04-review.md` | **v1 DS closed** |
| 5 | **Adjustments** | Analyse and propose the best adjustments and improvements | `05-adjustments.md` | **v1 DS closed** |
| 6 | **Compare to v1** | *Only now* — three-way compare: ours vs shadcn vs proposed | `06-comparison.md` | **v1 DS OPENS** |
| 7 | **Risk review** | Risks, concerns, gaps, issues, problems | `07-risks.md` | — |
| 8 | **Build & review** | Implement in Figma; review the outcome | Figma component + `08-build-review.md` | — |
| 9 | **Iterate** | Repeat 3–8 until complete | — | — |
| 10 | **Process retro** | Review the process; enrich the protocols | `10-retro.md` | — |

> **Note on step order.** Steps 3 and 4 are swapped relative to the original sketch: observations are
> *gathered* before they are *reviewed and planned against*. Agreed 2026-08-03.

### Step 2 — Dissect (the step most likely to be rushed)

**Step 2 produces an ANALYSIS BOARD, not components.** This is the single most important distinction in
this protocol. Step 2 documents and maps; **step 8 is the only step that authors production components.**
If step 2 built components, steps 3–7 would become a critique of something already committed to — which
is the failure this protocol was written to stop.

**What is dissected:** the shadcn component **exactly as it is, in its current form, as-is.** Not an
idealised version, not ours, not a merge. The vendored source in `reference/shadcn-ui/` is the subject.

#### Division of labour: markdown holds the words, Figma holds the thing

*(Added 2026-08-03 after the first run put the written inventories on the canvas.)*

| Artifact | Contains | Does **not** contain |
| --- | --- | --- |
| **`02-anatomy.md`** | All written analysis — the part tree, the three inventories, prop tables, ARIA, behaviour, source citations | — |
| **Figma board** | The **actual organism, molecules and atoms, drawn as they really look**, each annotated with the **tokens it uses**: font, size, weight, colour, gap, padding, radius, border, shadow | Prose. Bullet lists. Behaviour panels. Anything already written in the markdown |

**Do not restate the markdown on the canvas.** Figma's job at step 2 is to make the component *visible*
— the real thing at real size, decomposed by atomic level, with every value labelled either with the
token that supplies it or with an explicit **NO TOKEN** marker where none exists.

That annotation is not decoration: the gaps it exposes are the raw material for step 3's observations
and step 5's token-impact analysis. A value with no token behind it is a finding.

**Still not components.** Drawn representations are plain frames and text. No `COMPONENT` nodes, no
variant sets, no component properties — those are step 8.

**Three inventories, all required** — a part is not dissected until all three are documented:

1. **Structure** — every element, wrapper, slot, and data-attribute; the auto-layout/box model; the
   atomic classification (atom / molecule / organism) with the reason for it.
2. **States** — every state the component can be in, and what visually distinguishes each.
3. **Behaviour** — focus management, keyboard interaction, ARIA, portal/scroll behaviour, what the
   Radix primitive owns. **Figma cannot draw this**, so it is documented in writing. Without this,
   behaviour would arrive unexamined at step 11.

### Step 5 — Adjustments: token impact is mandatory

Every proposed adjustment states plainly **which tokens it requires** and whether they exist. A token
that does not exist is raised here, under the demand-driven rule in `TOKEN-PIPELINE.md` — never invented
mid-build at step 8.

### Step 7 — Risk review: accessibility is a named lens

Contrast, target size, focus visibility, keyboard reachability, and motion are checked explicitly at
step 7 (draw on the `a11y-audit` skill). Cheap here, expensive after build.

### Step 9 — Exit condition

The 3–8 loop exits when **a review round produces no new blocking observations AND the owner signs off.**
Without a stated exit, "repeat until complete" runs indefinitely.

---

## 3. Phase B — propagate from the source of truth

Once Figma is the agreed source of truth for the component, the change propagates outward. Figma leads;
everything else is brought into alignment with it.

| # | Step | Purpose | Artifact |
|---|---|---|---|
| 11 | **Code** | Revamp the component code to match the agreed Figma truth | `src/ui/<component>.tsx` |
| 12 | **Docs & behavioural spec** | Update documentation and the behavioural spec to match | `docs/components/<slug>/SPEC.md` |
| 13 | **Deploy** | Deploy to the Cloudflare site, applying the component in a **real usage example** | Live example |
| 14 | **Verify alignment** | Confirm Figma ↔ code ↔ behavioural spec all agree | `14-verification.md` |

Step 14 is a three-way check, not a two-way one: a component can match Figma visually while its
behaviour has silently drifted from spec.

---

## 4. Per-component workspace

Every component gets one folder. The presence of a file is the evidence a step completed.

```
docs/components/<slug>/
  00-scope.md          ← target, fence, contamination declaration
  02-anatomy.md        ← structure · states · behaviour
  03-observations.md
  04-review.md
  05-adjustments.md
  06-comparison.md     ← the first file allowed to reference v1
  07-risks.md
  08-build-review.md
  10-retro.md
  14-verification.md
  DECISIONS.md         ← running decision log (see §5)
  PARKING-LOT.md       ← noticed, not acted on
```

---

## 5. Decision log, ownership, and sync state

Each component's `DECISIONS.md` opens with a status block. It answers two different questions that are
easy to conflate: *how far along is the work* and *where does the work physically live*.

```markdown
---
component: dialog
lifecycle: dissecting        # see 5.1
sync: working                # see 5.2
owner-machine: Laptop A      # see 5.3
last-updated: 2026-08-03
---
```

### 5.1 `lifecycle` — position on the factory line

Reuses the existing vocabulary in `docs/FACTORY_LINE.md` so there is one lifecycle language:

`scoped` → `dissecting` → `reviewing` → `building` → `implemented` → `sealed` → `handed-off` →
`deployed` → `signed-off`

### 5.2 `sync` — where the work physically exists

This is the part that matters for three machines sharing `main`. Unpushed work does **not** travel.

| `sync` | Meaning | Still in hand-off? |
|---|---|---|
| `working` | Edited on the owner machine, uncommitted | **Yes** — stranded; nobody else can see or continue it |
| `committed` | Committed locally, **not pushed** | **Yes** — still stranded on the owner machine |
| `pushed` | On `origin/main`, visible to every machine | **No** — released |

> **The release rule:** once `sync: pushed`, the component **leaves the hand-off queue**. It is no
> longer pending work owned by one machine; any machine may pick it up. Work that is `working` or
> `committed` is still owned, and another machine must not start on it.

### 5.3 `owner-machine`

`Laptop A` (Miguel) · `Laptop B` (Blair) · `PC`. Records which machine holds the claim while `sync` is
`working` or `committed`. Set to `—` when `sync: pushed`, because the claim is released at that point.

### 5.4 Entries

Each decision records **what was decided, why, and at which step** — so a later session, or another
machine, can see the reasoning instead of re-litigating it.

---

## 6. Contamination declarations

The step-2 fence only works if breaches are visible. If v1 material has already been read for a
component — in this session or a previous one — it is declared in `00-scope.md` at step 0, naming
exactly what was seen. A declared breach is manageable; an undeclared one silently turns step 6 into
theatre, because the "independent" work of steps 2–5 was never independent.

---

## 7. Trial run

The first run of this protocol is the **Dialog organism**, decomposed to its molecules and their atoms,
with **every part stepped through the full process** — no part skipped as "obvious."

- **Decomposition** runs top-down: organism → molecules → atoms, to enumerate all parts (step 2).
- **The per-part loop** then runs bottom-up: atoms first, then molecules, then the organism — since a
  molecule cannot be honestly reviewed while its atoms are still unsettled.
  *(Order proposed 2026-08-03; confirm before step 2 begins.)*

---

## 8. What this protocol changes

| Previously | Now |
|---|---|
| Build first, review the result | Review first; step 8 is the only build step |
| v1 consulted whenever useful | v1 fenced until step 6 |
| Observations became tasks immediately | Observations go to the parking lot |
| Steps ran together toward a finished component | One step, one artifact, one stop |
| Progress tracked in conversation | Progress tracked as files in `docs/components/<slug>/` |
