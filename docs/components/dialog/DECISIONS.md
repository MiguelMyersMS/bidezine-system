---
component: dialog
lifecycle: reviewing
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
