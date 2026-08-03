---
component: dialog
lifecycle: paused-at-step-7
sync: pushed
owner-machine: —
last-updated: 2026-08-03
figma-analysis-board: "Dialog · Step 2 — Dissection" (node 28:2)
---

# Dialog — Decision Log

> **Status field convention.** `sync` records where the work physically lives, and is set in the commit
> that carries it. It reads `pushed` only when that commit reaches `origin/main` — at which point the
> component **leaves the hand-off queue** and `owner-machine` is released to `—`. If a session ends
> without pushing, `sync` must be corrected to `working` or `committed` and `owner-machine` re-claimed,
> because unpushed work does not travel between the three machines.

Entries record **what was decided, why, and at which step**, so a later session or another machine can
see the reasoning instead of re-litigating it.

---

## Step 0 — Scope & Fence

**D-000 · Dialog is the CDP trial component, run over its whole part tree.** *(Owner, 2026-08-03)*
Rather than a single atom. Rationale: the trial has to prove the process across all three atomic levels,
and a lone atom would leave the molecule/organism half of the protocol untested.

**D-001 · Decomposition top-down, per-part loop bottom-up.** *(Owner-confirmed, 2026-08-03)*
Step 2 enumerates the tree from the organism downward; steps 3–8 then run per part starting at the
atoms. Rationale: a molecule cannot be honestly reviewed while its atoms are still unsettled.

**D-002 · The part list is an output of step 2, not an input.** *(Step 0)*
Not pre-declared in `00-scope.md`, so the dissection enumerates the parts rather than confirming a list
written in advance.

**D-003 · Contamination declared rather than worked around.** *(Step 0)*
v1's `tokens.ts` (including the `TYPE` system) and the `InputTrigger` six-state spec have been read this
session, and a pre-protocol version of this component tree was already built and reverted. Both are
recorded in `00-scope.md` §3. Step-5 proposals plausibly downstream of v1 exposure will be labelled
`[possibly v1-influenced]` so step 6 does not mistake contaminated agreement for independent convergence.

**D-006 · Radix is inside the fence at step 2.** *(Owner, 2026-08-03)*
Nearly all of Dialog's behaviour — focus trap, portal, Escape, scroll lock, ARIA wiring — lives in the
Radix primitive, not in shadcn's wrapper. Step 2 requires behaviour documented; excluding Radix would
mean describing that behaviour from memory. Permitted as the component's own dependency.

**D-007 · shadcn's prose docs are permitted, but marked.** *(Owner, 2026-08-03)*
Source is primary. Observations drawn from prose are tagged `[prose]` so step 4 can weigh a documented
intention differently from an observed fact.

## Step 2 — Dissect

**D-008 · The Figma board shows the thing, not the write-up.** *(Owner, 2026-08-03 — protocol updated)*
The first board restated the markdown on the canvas: part-tree text, state tables, a behaviour panel.
Rejected. Markdown holds the words; **Figma holds the actual organism, molecules and atoms, drawn as
they really look, annotated with the tokens behind each value** — font, size, weight, colour, gap,
padding, radius, border, shadow. Where no token supplies a value it is marked **NO TOKEN**, because
that gap is itself a finding and feeds step 5's token-impact analysis. Recorded in CDP §2.

**D-009 · Token coverage of Dialog is 6 of 27 values.** *(Step 2, observed)*
Covered: `background` · `border` · `radius-lg` · `foreground` · `muted-foreground` · `ring` · `accent`.
Uncovered: every spacing value, every font size and weight, line-height, shadow, the overlay fill,
opacity, widths, icon size, and `rounded-xs` (2px — below our smallest radius step). The 26 tokens we
hold are colour and radius only: there is no spacing scale, no typography scale, no shadow scale and no
sizing scale. Recorded as fact at step 2; what to do about it is step 3/5.

## Step 3 — Observations

**D-010 · Missing tokens go through steps 3→8, not straight to Figma.** *(Owner, 2026-08-03)*
The token gaps are real and will be filled, but v1 already holds settled answers for most of them (a
9-token `TYPE` system, `src/layout.ts`, a 7-step shadow scale) and those are fenced until step 6.
Authoring our scales first, then opening v1, means we learn whether we converge or differ — rather than
only ever seeing one answer. Creating tokens now would have repeated the typography mistake of
2026-08-02.

**D-011 · Every stop names its step and states what is needed.** *(Owner, 2026-08-03 — CDP §1.1)*
A bare "awaiting your review" puts the burden on the owner to work out what is being asked. Each stop
block now carries the step **number and name** plus a specific list of decisions, answers or
confirmations required to close it.

**D-012 · Step 2 overstated token coverage by one.** *(Step 3, self-correction)*
The board tagged `DialogTitle`'s colour as covered by `foreground`. `dialog.tsx` sets **no text colour
at all** — it inherits. The genuinely referenced colour tokens are `background`, `border`, `ring`,
`accent`, `muted-foreground`.

## Step 4 — Review & plan

**D-013 · The radius scale gains `xxs` (2px) and `xs` (4px).** *(Owner, 2026-08-03)*
Resolves O-11. Extends the existing arithmetic rather than bolting on: the scale becomes ×0.2, 0.4,
0.6, 0.8, 1.0, 1.4 of the 10px base → 2 · 4 · 6 · 8 · 10 · 14.

Related discovery: shadcn's `@theme` defines `--radius-sm` through `--radius-4xl` but **no
`--radius-xs`**. The close control's `rounded-xs` was therefore never resolving through shadcn's radius
system at all — it fell through to Tailwind's raw `0.125rem` default. It is not a value shadcn chose;
it is one shadcn did not notice. Adding `radius-xxs` brings a stray literal under management.

**D-014 · Step 3 signed off.** *(Owner, 2026-08-03)* Observation list accepted as complete; no
observation disputed.

**D-015 · R-01 … R-06 all ratified.** *(Owner, 2026-08-03)* Including R-04 — the **`provider` tier is
added** to the taxonomy. Owner deferred to the recommendation; the reasoning is in `04-review.md` Q4 and
the decision is recorded system-wide in `docs/DECISION_LOG.md`, since it governs every Radix root,
portal and context provider, not just Dialog.

## Step 5 — Adjustments

**D-016 · Step 5 proposals must be SHOWN in Figma, not only described.** *(Owner, 2026-08-03 — CDP §2)*
Owner's words: *"I hope to see the real components assembled in Figma to provide real feedback on what
to change — I cannot do it before."* A spacing ramp or a type ramp is a **visual artifact**; proposing
eight of them as numbers in a markdown table asks the owner to simulate a rendering mentally and approve
it unseen, and an approval given that way is not a real approval. Step 5 now produces both the written
proposal and a Figma **proposal board** — drawn, not components, so it can be rejected cheaply.

**D-017 · Nothing in the step-5 proposal is invented.** *(Step 5)*
Every value is labelled `[observed]` (used by Dialog today, must be preserved) or `[extracted]` (a step
of the Tailwind scale the component already sits on). Where a scale would need invention to be
complete — z-index, icon sizing, content width — it is **left incomplete and flagged** rather than
padded out, per R-01.

### Recommendations ratified 2026-08-03 (see D-015)

- **R-01** Build scales only for genuine foundations; treat Dialog-only values (512 width, zoom-95,
  the `calc(100%-2rem)` inset) as component decisions, not scales derived from one data point.
- **R-02** Tokenising is **value-preserving**; changing a value is a separate explicit decision. Keeps
  the diff reviewable — otherwise a regression cannot be attributed to the rename or the change.
- **R-03** `DialogTrigger` / `DialogClose` are **code-only**, excluded from the Figma library but still
  documented. Nothing visual exists to bind.
- **R-04** Add a **provider** tier to the taxonomy for parts that render no DOM (`Dialog`,
  `DialogPortal`). System-wide: it recurs on every Radix root, portal and context provider.
- **R-05** Support the **modal contract only** for now. `modal={false}` is a different behavioural
  contract under the same name. A documentation stance, not a code restriction.
- **R-06** Adopt from shadcn: `data-slot`, `asChild`, `forceMount`, and the ARIA-wiring mechanism.
  Do **not** adopt arbitrary-value escape hatches. Backend choice stays parked (ADR-006 chose Radix).

**D-018 · The close control is an atom, not part of DialogContent.** *(Owner, 2026-08-03 → C-06)*
Corrects a step-2 misclassification. It has its own radius, icon size, offset and the only complete
interaction state set in the component — which is why O-20 read as an anomaly instead of as evidence
that an atom was hiding inline. Confirmed at step 6: v1 already treats it as a real control (32×32,
`RADIUS.soft`, `aria-label`).

**D-019 · New variables AND effect styles both land in Figma at step 8.** *(Owner, 2026-08-03)*
Explicitly includes the shadow **effect styles**, which cannot be Figma Variables (pending T3).

## Step 6 — Compare to v1

**D-020 · The fence produced a real result: typography did NOT converge.** *(Step 6)*
The step-5 typography proposal was labelled `[possibly v1-influenced]`. Comparison shows different
values (v1 has 13/22/28/48, we do not), a different model (v1 bundles family+size+weight+leading+
tracking per semantic role; ours keeps size and leading separable) and a different family strategy
(v1 has three faces, we have one). **The contamination did not bias the proposal.** Had the two matched
we could never have known whether that was agreement or contamination.

**D-021 · Four defects found that we would otherwise have shipped.** *(Step 6)*
No `prefers-reduced-motion` handling (shadcn has none at all); theme-blind shadows; the overlay/content
z-index collision; and a dialog that can silently ship with no accessible name. **v1 had already solved
three of them.** Running steps 1–5 with v1 open would very likely have meant copying its answers without
forming an independent view.

**D-022 · Two index-translation traps between v1 and v2 naming.** *(Step 6)*
`SPACE[5]` is **24px** in v1; `space-5` is **20px** in ours. And every breakpoint name is shifted one
step — v1's `sm` (768) is our `md`. Translating either by index silently produces the wrong value. A
v1→v2 mapping table is required, not optional.

### Recommendations from step 6 awaiting ratification

- **R-07** Adopt v1's **z-index scale** wholesale (7 steps). Resolves C-04 and R-01's objection.
- **R-08** Adopt v1's **motion** durations *and easings* — dropping easing at step 5 was my error;
  Figma's inability to hold it is a round-trip note, not a reason to omit it.
- **R-09** Adopt v1's **theme-aware elevation** model. Fixed-alpha shadows are a dark-mode defect.
- **R-10** Adopt v1's **required `title`** prop. Makes the unnamed-dialog failure structurally
  impossible; supersedes C-03's three options.
- **R-11** Extend radius with v1's container tiers and `pill` 99.
- **R-12** Add 64 to spacing; keep Tailwind naming; publish the v1→v2 mapping table.
- **R-13** *(open — needs the owner)* Typography: add a **semantic layer on top of** the raw scale,
  rather than choosing between them.

**D-023 · R-07 … R-13 ratified.** *(Owner, 2026-08-03)* Including R-13 — typography gets a **semantic
layer on top of** the raw scale, not one or the other — and breakpoints keep Tailwind's names. No step-6
comparison board required.

## Step 7 — Risk review

**D-024 · Two ratified recommendations are NOT value-preserving, and I hid that.** *(Step 7)*
R-09 (theme-aware elevation) changes the dialog's shadow; R-11 (v1's radius tiers) would take the
dialog corner from 10px to 18px. Both were framed at step 6 as "adopt v1's answer", which concealed a
visual consequence inside what read as a naming decision — the exact failure R-02 exists to prevent.
**Blocks step 8** until the owner chooses: ship value-preserving and change the look separately, or
adopt v1's look as a deliberate, recorded visual change.

**D-025 · Two MEASURED accessibility failures in the close control.** *(Step 7)*

- **A-1** `muted-foreground` at `opacity-70` over `background` composites to `#9d9d9d` — **2.71:1**
  against WCAG 1.4.11's 3.0:1 for non-text UI. It only becomes conformant **on hover**, which keyboard
  and touch users never trigger.
- **A-2** The close control carries no width/height/padding, so its hit area is its `size-4` icon:
  **16×16**, against WCAG 2.2 AA 2.5.8's **24×24** minimum. v1's is 32×32 and passes.

Both change the C-06 atom's design, so they must be settled before it is built.

**D-026 · The token pipeline rule and the plan contradict each other.** *(Step 7 — G-3)*
`TOKEN-PIPELINE.md` says add a token *when a shipping component needs one, never in bulk*. Steps 5–6
propose ~46+ at once. The justification is real, but the rule as written does not permit it. **Either
the rule or the practice must change** — leaving it unresolved means the rule stops meaning anything.

### Step 7 blockers — all five resolved by the owner, 2026-08-03

**D-027 · Follow v1's look. Recorded as a deliberate visual change, not tokenisation.**
The v2 dialog takes v1's radius (`RADIUS.container`, **18px**, not shadcn's 10px) and v1's theme-aware
elevation. This is option (b) from `07-risks.md` §1: R-02 is not violated, because the change is being
made **knowingly and on the record** rather than smuggled inside a rename.

**D-028 · A-1 contrast — drop `opacity-70` as the rest mechanism.**
The close icon gets a colour that clears 3:1 at full opacity; hover is expressed with opacity or a
background tint instead. Fixes the 2.71:1 failure at rest.

**D-029 · A-2 target size — follow v1: 32×32 hit area, 16px icon.**
Clears WCAG 2.2 AA 2.5.8's 24×24 minimum. Sets the dimensions of the C-06 atom.

**D-030 · Token rule amended: migrating a v1 scale is not "bulk adding".**
`TOKEN-PIPELINE.md` now distinguishes **invention** (still demand-driven, still one component at a
time) from **migration** of a scale v1 already designed and proved in a shipped product. A scale
adopted piecemeal is worse than one adopted whole — it produces a ramp with holes that get filled
ad-hoc later, which is the very drift the rule guards against. Adoption is *not* a licence to round out
a v1 scale with steps v1 never had.

**D-031 · Dialog PAUSES at step 7. Atoms go first.**
Button, Input, Label and Field each run their own CDP pass before Dialog reaches step 8, so the
assembled modal form is real rather than a shell with a placeholder. Consistent with D-001's
bottom-up loop order: a molecule cannot be honestly reviewed while its atoms are unsettled, and an
organism cannot be assembled from parts that do not exist.

---

## Prior decisions inherited from before the protocol

These were taken earlier and still stand; recorded here because they constrain this component's work.

**D-004 · Token naming contract: shadcn's vocabulary, our values, extensions on demand.**
*(Owner, 2026-08-02 — see `docs/process/TOKEN-PIPELINE.md`)*
Borrowed Radix behaviour is written against shadcn's token names, so keeping them means a pulled-in
component compiles unmodified and only its **behaviour** needs review. Extensions are added when a
shipping component needs one, never in bulk.

**D-005 · All component work built before the protocol was reverted, not grandfathered.**
*(Owner, 2026-08-03 — commit `12b997d`)*
Figma is back to a single `Foundations` page; tokens 48 → 26, keeping only what is a faithful extraction
of shadcn's own contract. The build pipeline was kept — it is infrastructure, not a component.
