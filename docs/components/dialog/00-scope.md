# Dialog — Step 0: Scope & Fence

**Protocol:** `docs/process/COMPONENT-DEVELOPMENT-PROTOCOL.md` · **Step:** 0 of 10 (Phase A)
**Date:** 2026-08-03 · **Owner machine:** Laptop A (Miguel)

---

## 1. Target

**The Dialog organism, and every part it composes**, run as the first trial of the CDP.

Per the agreed trial scope (§7 of the protocol):

- **Decomposition** (step 2) runs **top-down**: Dialog → its molecules → their atoms, to enumerate
  every part with nothing overlooked.
- **The per-part loop** (steps 3–8) then runs **bottom-up**: atoms first, then molecules, then the
  organism — a molecule cannot be honestly reviewed while its atoms are unsettled.

No part is skipped as "obvious."

**The part list is an output of step 2, not an input.** It is deliberately not pre-declared here, so
the dissection enumerates it rather than confirming a list I wrote in advance.

---

## 2. Source fence

### Permitted for steps 2–5

| Source | Path | Why |
|---|---|---|
| Vendored shadcn source | `reference/shadcn-ui/` | The subject of the dissection — the component **exactly as it is, as-is** |

### Fenced until step 6

| Source | Path |
|---|---|
| **v1 design system — entirely** | `../design-system/` — code, `docs/atomic/*` specs, `src/tokens.ts`, evidence, registry |
| Our own reference map of v1 | `docs/reference/REFERENCE-MAP.md` (it summarises v1 by name and category) |

### Open fence questions — need answering before step 2 begins

1. **Does "shadcn as-is" include the Radix primitive underneath it?**
   Step 2 requires behaviour to be documented, and for Dialog nearly all behaviour (focus trap, portal,
   Escape, scroll lock, ARIA wiring) lives in Radix, not in shadcn's wrapper. Documenting behaviour
   without reading Radix would mean describing it from memory — which is exactly the guessing this
   protocol exists to stop. **Proposed:** Radix source and docs are permitted at step 2, as the
   component's own dependency. Confirm or reject.

2. **Does it include shadcn's documentation, or only the component source?**
   The vendored repo contains the docs site — prose, prop tables, usage examples, and their own stated
   intent. That is arguably part of "the component in its current form," and arguably a second-hand
   interpretation of it. **Proposed:** source is primary; docs permitted but every observation drawn
   from prose is marked as such, so step 4 can weigh it differently. Confirm or reject.

---

## 3. Contamination declaration

The fence only works if breaches are visible. Two disclosures, both material.

### 3.1 v1 design system — I have read the following

| What | Where | Affects |
|---|---|---|
| Full token source: `PALETTE`, `TOKENS_LIGHT`, `TOKENS_DARK`, and the `TYPE` typography system (9 tokens, families Inter / DM Sans / Raleway) | `../design-system/src/tokens.ts` | **All colour and typography work**, at every step |
| `InputTrigger` molecule spec: its six-state model (`empty` · `active` · `hasValue` · `activeHasValue` · `disabled` · `error`), the state-by-state notes, and its layer anatomy | `../design-system/docs/atomic/molecule/inputtrigger.spec.md` | **Input**, **Field**, and any state modelling |
| Component and spec inventory (names only, via directory listings and `REFERENCE-MAP.md`) | various | Low — names, not decisions |

**Consequence, stated plainly:** for **Input**, **Field**, and anything touching **tokens or
typography**, my steps 2–5 cannot be genuinely independent. Where a step-5 proposal is plausibly
downstream of something I saw in v1, I will label it `[possibly v1-influenced]` so step 6 can treat it
as a comparison already contaminated rather than a fresh convergence.

Not contaminated: **Dialog**, **Button**, **Label** — I have not read v1's versions of these.

### 3.2 I have already built a version of this component

Before this protocol existed, I ported Dialog, Field, Input, Label and Button into `src/ui/` and authored
them in Figma (since reverted, commit `12b997d`). So I carry preconceptions about the anatomy, the
atomic classification, and which states matter.

This is a weaker breach than 3.1 — that work was built *from* shadcn, which is the permitted source —
but it is not nothing: my step-2 dissection will be a **second look, not a fresh one**, and second looks
tend to confirm the first rather than re-derive it.

**Mitigation:** step 2 is written from the source files read again in full, not from recall, and any
classification that matches my earlier build is re-justified from the source rather than carried over.

---

## 4. Working state

Recorded in `DECISIONS.md`; summarised here.

- **lifecycle:** `scoped`
- **sync:** see `DECISIONS.md` (release rule: work leaves the hand-off queue only once pushed to `main`)
- **owner-machine:** Laptop A

---

## 5. Workspace

```
docs/components/dialog/
  00-scope.md       ← this file
  DECISIONS.md      ← status block + running decision log
  PARKING-LOT.md    ← noticed, not acted on
```

Remaining step artifacts are created as their steps complete. The presence of a file is the evidence
that its step ran.
