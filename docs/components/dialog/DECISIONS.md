---
component: dialog
lifecycle: dissecting
sync: pushed
owner-machine: —
last-updated: 2026-08-03
figma-analysis-board: "Dialog · Step 2 — Dissection" (node 27:3)
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
