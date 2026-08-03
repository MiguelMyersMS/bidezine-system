# Dialog — Step 4: Review & Plan

**Protocol:** CDP step 4 (Phase A) · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> Reviews and discusses step 3's observations, answers the questions it raised, assesses which shadcn
> ideas are worth adopting, and plans steps 5–8. **Recommendations here are for ratification, not
> execution.** Concrete scales are step 5; building is step 8.

**Step 3 signed off by the owner, 2026-08-03** — observation list accepted as complete, no disagreement.

---

## 1. Twenty-eight observations, six themes

| Theme | Observations | The single question underneath |
|---|---|---|
| **A · The token system has nine holes** | O-01…O-12 | Which of these are foundations, and what are their scales? |
| **B · Public API exposes things with nothing to specify** | O-13, O-15, O-19 | What belongs in a design system library, and what is code-only? |
| **C · A naming collision** | O-14 | Do we inherit shadcn's API verbatim, or correct it? |
| **D · No variant axis; variation is consumer-side** | O-16, O-17, O-18 | Is "pass your own classes" an acceptable variation model for us? |
| **E · State vocabulary is nearly absent** | O-20…O-23 | Which states must a dialog in our system actually have? |
| **F · Behaviour is correct, but conditional and overridable** | O-24…O-28 | Which behaviours do we guarantee versus leave to the consumer? |

Themes **A** and **B** are system-wide questions that Dialog merely surfaced. **C**, **D**, **E**, **F**
are genuinely about this component.

---

## 2. The radius finding, extended

**Owner decision (2026-08-03): the scale needs room at 2px and 4px, named `xxs` and `xs`.**

That resolves O-11, and it fits the existing arithmetic rather than bolting onto it:

| Step | Multiple of base (10) | Value |
|---|---|---|
| `radius-xxs` | ×0.2 | 2 |
| `radius-xs` | ×0.4 | 4 |
| `radius-sm` | ×0.6 | 6 |
| `radius-md` | ×0.8 | 8 |
| `radius-lg` | ×1.0 | 10 |
| `radius-xl` | ×1.4 | 14 |

A clean `0.2 · 0.4 · 0.6 · 0.8 · 1.0` run before the jump to `1.4`.

**A related discovery worth recording.** shadcn's `@theme` defines `--radius-sm` through `--radius-4xl`
but **no `--radius-xs`**. So the close control's `rounded-xs` was never resolving through shadcn's
radius system at all — it falls through to Tailwind's raw default of `0.125rem`. It is not a value
shadcn chose; it is a value shadcn *didn't notice*. Adding `radius-xxs` therefore brings a stray literal
under management rather than merely renaming something.

---

## 3. The five questions from step 3

### Q1 — Which missing scales are foundations, and which are just this component's values?

**Recommendation: separate them, and only build scales for the foundations.**

| Genuinely a foundation (every component needs it) | Arguably local to Dialog |
|---|---|
| spacing · typography · radius · shadow · border/ring width · motion · z-index · breakpoint · opacity | content max-width (512) · the zoom-95 enter scale · the `calc(100%-2rem)` mobile inset |

Building scales for the first column is system work Dialog happened to expose. The second column are
composition decisions that belong in the component's own spec — inventing a "dialog width scale" from a
sample size of one would be a scale designed around a single data point.

### Q2 — May tokenising change the rendered result?

**Recommendation: the first pass is value-preserving. Changes are a separate, explicit decision.**

If naming a value and changing it happen in the same move, no one can tell whether a visual regression
came from the rename or the change. Keeping them apart means the tokenisation diff is reviewable by
inspection: same pixels, new names.

Note this does **not** block improvement — it sequences it. The `radius-xxs` addition is a good example
of the allowed shape: it preserves the rendered 2px while bringing it under management.

### Q3 — Do `DialogTrigger` and `DialogClose` belong in a design system library?

**Recommendation: code-only. Not in the Figma library.**

They carry no classes; their appearance is entirely whatever is slotted in via `asChild`. There is
nothing for Figma to own and nothing for Code Connect to bind, because there is no visual to bind.

**But they still need documentation** — they are part of the public API and carry real ARIA behaviour.
"Not in the library" must not become "undocumented."

### Q4 — Where do `Dialog` and `DialogPortal` live, given they render no DOM?

**Recommendation: name a new tier in our taxonomy rather than force-fitting or hiding them.**

This is not a Dialog problem — it will recur on every Radix root, every portal and every context
provider in the system. Two options considered:

- *Hide them as implementation detail of the organism.* Cheapest, but it makes the component's own
  documentation incomplete and gives us nowhere to record provider-level API (`modal`, `open`,
  `onOpenChange`) which is genuinely part of the contract.
- *Add a tier* — e.g. **provider** — sitting outside atom/molecule/organism, for parts that render no
  DOM and carry only behaviour or structure.

The second is recommended. It is a system-wide taxonomy decision and should be ratified as one.

### Q5 — Is `modal={false}` in scope?

**Recommendation: support the modal contract only, for now — and say so explicitly.**

`modal={false}` removes the focus trap, the scroll lock and outside-pointer blocking. That is a
materially different behavioural contract wearing the same component name, and it would need its own
verification and its own accessibility review.

Being precise about what "not supported" means here: it is a **documentation stance**, not a code
restriction — the prop still exists and still works. We are declining to *guarantee* it, not removing it.

---

## 4. Feasibility — which shadcn ideas are worth adopting

| Idea | Assessment |
|---|---|
| **`data-slot` on every part** | **Adopt.** Zero runtime cost, gives stable selectors for evidence capture, Code Connect and consumer overrides — without exposing class names as API. |
| **`asChild` / Slot polymorphism** | **Adopt.** It is Radix, already borrowed under ADR-006, and it is what lets a trigger be any element. |
| **`forceMount`** | **Adopt.** Needed for any externally-driven enter/exit animation. |
| **Conditional ARIA wiring** | **Adopt the mechanism, not the leniency.** Wiring `aria-labelledby` from a real Title is right; silently producing an unnamed dialog when the Title is omitted (O-26) is not. Worth tightening. |
| **Boolean-only variation** (O-17) | **Open question.** It suits Dialog, which genuinely has no visual variants. It should not become a system-wide habit — deciding "no variant axis" per component must be a finding, not a default. |
| **Arbitrary values in source** (O-18) | **Do not adopt.** `max-w-[calc(100%-2rem)]` is precisely the escape hatch that bypasses the token system. If a value is needed, it should be named. |
| **Three primitive backends** (`aria`/`base`/`radix`) | **Not now.** ADR-006 chose Radix. Re-opening it is a foundation decision, not a component one. Stays parked. |

---

## 5. Plan for steps 5–8

| Step | Scope for Dialog |
|---|---|
| **5 · Adjustments** | Propose the foundation scales (Q1 column one) with concrete values, value-preserving per Q2. Declare full token impact. Propose the fixes for themes C, E, F. Label anything plausibly downstream of my declared v1 contamination. |
| **6 · Compare to v1** | Open v1. Compare our proposed scales against its `TYPE`, `layout.ts` and shadow scales; compare its dialog against this one. Record convergence and divergence honestly, including where v1 is better. |
| **7 · Risks** | Accessibility lens (O-22, O-26 especially), breaking-change risk, and the risk that a foundation scale designed from one component does not generalise. |
| **8 · Build** | Create the ratified tokens as Figma Variables **and** in the DTCG source together, then author the components. |

**Sequencing note.** The foundation scales are needed *by* step 8 but are *system* artifacts, not
Dialog's. They will be created in the DTCG source and Figma at step 8, but recorded as system-level
decisions in `docs/DECISION_LOG.md` rather than buried in this component's log.

---

## 6. What did not get decided here

Held open deliberately, to avoid step 4 becoming step 5:

- No concrete scale values (spacing ramp, type ramp, shadow steps) — step 5.
- No decision on the O-14 `showCloseButton` collision beyond "theme C exists" — needs the API
  discussion in step 5.
- No v1 comparison of any kind — step 6.
