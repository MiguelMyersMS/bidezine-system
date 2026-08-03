# Dialog — Step 3: Observations

**Protocol:** CDP step 3 (Phase A) · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> **Observations, issues and gaps only.** No proposals — those are step 5. No comparison to v1 — that
> is step 6. Where an observation implies an obvious fix, the fix is deliberately not written down.

---

## 0. A correction to step 2

**The step-2 board tagged `DialogTitle`'s colour as covered by `foreground`. That was an inference, not
a fact.** `dialog.tsx` sets **no text colour at all** on `DialogTitle` — it inherits from whatever
ancestor the consumer provides. The only colour tokens genuinely referenced by the component are
`background`, `border`, `ring`, `accent`, and `muted-foreground`.

Corrected counts are in §1.4. The board's "6 of 27" headline survives, but for a different reason than
it stated.

---

## 1. Token coverage

### 1.1 Values with a token behind them (6)

| Value | Token | Where |
|---|---|---|
| Surface fill | `background` | `DialogContent` · also `ring-offset-background` on the close control |
| Border colour | `border` | `DialogContent` |
| Corner radius | `radius-lg` | `DialogContent` (`rounded-lg`) |
| Focus ring colour | `ring` | close control |
| Open-state tint | `accent` | close control `data-[state=open]` |
| Secondary text | `muted-foreground` | `DialogDescription`, close control `data-[state=open]` |

### 1.2 Values with no token (grouped by the scale they would belong to)

**O-01 · No spacing scale.** `p-6` (24), `gap-4` (16), `gap-2` (8, twice), `top-4 right-4` (16).
Five spacing decisions, three distinct values, nothing behind any of them.

**O-02 · No typography scale.** `text-lg` (18), `text-sm` (14), `font-semibold` (600),
`leading-none` (1). Every type decision in the component is an untokenised literal.

**O-03 · No shadow scale.** `shadow-lg` on the dialog surface — the single most identity-carrying
visual property of a floating panel, and it is unowned.

**O-04 · No sizing scale.** `sm:max-w-lg` (512), `max-w-[calc(100%-2rem)]`, icon `size-4` (16).

**O-05 · No border/ring width tokens.** `border` (1px), `ring-2`, `ring-offset-2`. Only the ring
*colour* is tokenised; every *width* is a literal.

**O-06 · No motion tokens.** `duration-200`, `zoom-in-95` / `zoom-out-95`, `fade-in-0` / `fade-out-0`.
All enter/exit behaviour is untokenised.

**O-07 · No z-index tokens.** `z-50` appears on both `DialogOverlay` and `DialogContent`.

**O-08 · No breakpoint token.** `sm` drives four separate layout changes (content max-width, header
alignment, footer direction, footer justification) and is referenced only as a Tailwind keyword.

**O-09 · No opacity tokens.** `opacity-70` → `opacity-100` is the close control's entire rest/hover
mechanism.

**O-10 · The overlay fill is a hard-coded literal.** `bg-black/50` — not a token, and not even
theme-aware: it is the same value in light and dark.

### 1.3 Values our current scale cannot express

**O-11 · `rounded-xs` is 2px; our smallest radius step is `radius-sm` at 6px.** This is not merely an
unmapped value — the scale as it stands has no room for it. Any mapping would either change the visual
or require extending the scale downward.

### 1.4 Coverage summary

| | Count |
|---|---|
| Distinct styled values in `dialog.tsx` | ~27 |
| Backed by a token | 6 |
| No token | ~21 |
| Not expressible in the current scale | 1 (`rounded-xs`) |

**O-12 · The pattern in the gap is not random.** Every covered value is a **colour** or a **radius** —
which is exactly the two scales we hold. Nothing about Dialog was under-tokenised through oversight;
the component is fully tokenised in the dimensions our system has, and untokenised in every dimension
it does not have. The gap is the shape of the token system, not of the component.

---

## 2. Structure

**O-13 · Two of the ten exports are unreachable in normal use.** `DialogPortal` and `DialogOverlay`
are rendered internally by `DialogContent`. A consumer following the documented composition never
places them, yet they are part of the public API surface.

**O-14 · There are two different close affordances with the same prop name.** `DialogContent` has
`showCloseButton` (default `true`, renders an icon control) and `DialogFooter` has `showCloseButton`
(default `false`, renders a text `Button`). Same name, opposite defaults, different output, different
component. *(Raised from the parking lot.)*

**O-15 · `DialogTrigger` and the exported `DialogClose` have no visual definition whatsoever.** They
carry no classes. Their appearance is entirely whatever the consumer slots in via `asChild`. A design
system that ships them ships two components with nothing to specify.

**O-16 · `DialogHeader` and `DialogFooter` are pure layout.** Their entire definition is flex
direction, gap and alignment. They hold no content and no identity of their own.

**O-17 · The component has no variant axis at all.** No CVA config, no size prop, no visual variants —
only booleans. Every documented variation (sticky footer, scrollable content, custom close) is achieved
by the consumer passing classes, not by the component offering an option.

**O-18 · An arbitrary-value escape hatch is already present in the source.**
`max-w-[calc(100%-2rem)]` uses Tailwind's arbitrary syntax, meaning the mobile inset is expressed as an
inline computation rather than any named value.

**O-19 · Two parts render no DOM and cannot be represented visually.** `Dialog` (Root) and
`DialogPortal`. They have no place in an atom/molecule/organism taxonomy, and no place in a Figma
library, yet they are half of what makes the component work.

---

## 3. States

**O-20 · Only one part in the entire component has interaction states.** The close control inside
`DialogContent` (rest / hover / focus / disabled / open). Every other part has only `data-state`
open/closed, which is animation, not interaction.

**O-21 · `DialogTrigger` defines no visual state despite carrying `aria-expanded`.** The component
tells assistive technology the trigger is expanded, but nothing visual distinguishes an open trigger
from a closed one.

**O-22 · Disabled on the close control is behaviour-only.** `disabled:pointer-events-none` with no
accompanying visual change — a disabled close control looks identical to an enabled one.

**O-23 · There is no error, loading, or busy state anywhere.** A dialog that submits a form has no
state vocabulary for the submission.

---

## 4. Behaviour

**O-24 · `aria-modal` is never set.** Inertness is achieved with `aria-hidden` on siblings via
`hideOthers()`. This works, but it means any behavioural spec or automated check written against
`aria-modal` would fail on a correctly functioning dialog.

**O-25 · The focus trap is conditional on `modal`.** With `modal={false}` there is no trap, no scroll
lock, and no outside-pointer blocking. The same component name covers two materially different
behavioural contracts.

**O-26 · Labelling is conditional on composition.** `aria-labelledby` is wired only if a `DialogTitle`
is present, and `aria-describedby` only if a `DialogDescription` is present. A consumer who omits the
title gets a dialog with no accessible name, and nothing in the type system prevents it.

**O-27 · Every dismissal path is preventable.** `onEscapeKeyDown`, `onPointerDownOutside`,
`onFocusOutside`, `onInteractOutside` can each be cancelled, as can `onOpenAutoFocus` and
`onCloseAutoFocus`. The component's behaviour is highly overridable by the consumer.

**O-28 · Scroll locking pulls in a third-party dependency.** `react-remove-scroll`, transitively.

---

## 5. Open questions for step 4

Recorded as questions, not answers.

1. Which of the missing scales (§1.2) are genuinely **system foundations** versus values that only this
   component happens to need?
2. Should tokenising a value ever be allowed to **change** the rendered result, or must the first pass
   be value-preserving?
3. Do `DialogTrigger` and `DialogClose` — components with no visual definition (O-15) — belong in a
   design system library at all, or are they code-only concerns?
4. What is the right home for `Dialog` and `DialogPortal` (O-19), which the atomic taxonomy cannot hold?
5. Is `modal={false}` (O-25) in scope for us, or do we support only the modal contract?
