# Atoms Pass 1 — Step 3: Observations

**Components:** `Button` · `Input` · `Label`
**Protocol:** CDP step 3 · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> Observations, issues and gaps. **No proposals** — step 5. **No v1** — step 6. Where an observation
> implies an obvious fix, the fix is deliberately absent.

Owner requirements already captured at step 2 (A-D-011…A-D-016) are **not** repeated as observations.

---

## 1. Button

### 1.1 The matrix is larger than 48

**B-O-01 · 6 × 8 = 48 combinations, and that is before states.** The CVA has no state axis — hover,
focus-visible, disabled and aria-invalid are CSS pseudo-classes, invisible to the variant system. In
code that is free. **In Figma every state must be a drawn variant**, so the real authoring cost is
48 × (number of states we choose to draw). At four states that is 192.

**B-O-05 · Icon size varies in only one place.** `size-4` (16) everywhere except `xs` and `icon-xs`,
which use `size-3` (12). Four of the eight sizes carry an identical icon size.

**B-O-06 · The `has-[>svg]` padding rule applies to the four text sizes only.** Icon-only sizes are
square with no padding at all, so they cannot participate in that rule.

### 1.2 Inconsistencies inside the variant set

**B-O-02 · `destructive` uses a literal `text-white`.** Not `primary-foreground`, not any token — the
raw colour keyword. It is **the only hard-coded colour in all three components**, and it means a
destructive button's text cannot respond to theming at all.

**B-O-03 · `destructive` is the only variant with its own focus ring.** Every other variant inherits
`ring-ring/50`; destructive overrides to `ring-destructive/20` plus a dark-mode variant. So focus
appearance is variant-dependent for exactly one of six.

**B-O-04 · `link` is styled as a button that looks like text.** It keeps the size's height and
horizontal padding — a `link` at `size=lg` is 40px tall with 24px of side padding. Only the fill and
underline change. Whether a link-styled control should occupy button geometry is not addressed anywhere.

### 1.3 Behavioural gaps

**B-O-09 · No `type` default — inside a form, every Button is `type="submit"`.** This is the HTML
default and shadcn does not override it. A "Cancel" button placed in a dialog form **submits that form**
unless the consumer remembers `type="button"`. shadcn's own dialog demo does remember. The failure is
silent, and the component gives no signal.

**B-O-07 · There is no pressed/active state.** Hover and focus exist; the moment of the click has no
visual.

**B-O-13 · Button carries `aria-invalid` styling.** Buttons are not normally form-validated. It is
present in the base class string alongside Input's, suggesting it was applied as a shared convention
rather than because a button has a validity state.

**B-O-08 · `transition-all` animates every property.** Including layout-affecting ones, which is why a
size change or a wrap would animate rather than snap.

---

## 2. Input

**I-O-02 · Input's type size changes at a breakpoint.** `text-base md:text-sm` — 16px on mobile, 14px
from `md` up. It is the **only responsive value in any of the three components**, and a Figma component
cannot express "this size below `md`, that size above" in a single variant. Any Figma Input is a
half-truth about one viewport unless breakpoint variants are drawn.

**I-O-01 · No hover state at all.** The control gives no feedback on approach — only on focus.

**I-O-03 · A filled input is styled identically to an empty one.** The only difference is which colour
the text takes, via the `placeholder:` pseudo-element. There is no `hasValue` concept.

**I-O-04 · A second component is hiding inside the class string.** Six `file:` rules
(`file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium
file:text-foreground`) style the file-picker button of `type="file"`. It has its own height (28) that
matches no other value in the component, and it is invisible unless the consumer sets that type.

**I-O-05 · Input is the only one of the three styling text selection** (`selection:bg-primary
selection:text-primary-foreground`).

**I-O-08 · Input has no size axis.** One height, 36. Button has eight sizes; a form pairing the two has
no way to build a compact or comfortable row.

---

## 3. Label

**L-O-03 · Radix is a dependency for one mouse handler — which `select-none` already covers.**
Radix Label's entire implementation prevents double-click text selection; the class list also carries
`select-none`, which prevents selection outright in CSS. The dependency's only observable contribution
is redundant with a class already present.

**L-O-01 · Label has no state of its own.** Both its states are inherited — `peer-disabled` from a
sibling, `group-data-[disabled]` from an ancestor. It cannot be disabled; it can only be told that
something near it is.

**L-O-04 · Label is a flex row with `gap-2`, and nothing explains why.** The layout implies it is meant
to hold something beside the text — an icon, a badge, a required marker — but no documentation,
example or type says so.

**L-O-05 · There is no required-field affordance.** No asterisk, no "optional" treatment, no prop. In a
form system, required-vs-optional is a labelling concern, and the label component has nothing for it.

**L-O-06 · `items-center` with wrapped text centres the whole block.** Combined with L-O-04's implied
icon slot, a two-line label would centre against its icon rather than aligning to the first line.

---

## 4. Cross-cutting

**X-O-02 · Disabled is expressed three different ways across three components.** Button and Input use
their own `:disabled`; Label reacts to `peer-disabled` **and** `group-data-[disabled=true]`. Anything
composing all three — a form row — must coordinate a native attribute, a sibling selector and an
ancestor data-attribute to make one disabled field.

**X-O-01 · Three different transition strategies.** Button `transition-all`; Input
`transition-[color,box-shadow]`; Label none. Siblings in the same form row will animate differently.

**X-O-03 · The focus treatment is identical in Button and Input** — `border-ring` plus
`ring-[3px] ring-ring/50`. It is the one convention shared verbatim, and the strongest candidate for
something that should be named rather than repeated. Label correctly has none: it is not focusable.

**X-O-04 · Only Input can shrink.** `min-w-0` appears once across the three.

**X-O-05 · Size axes are inconsistent.** Button has eight; Input and Label have none. There is no shared
notion of "small", "default" or "large" that a form row could apply to all of its parts at once.

**X-O-07 · None of the three has a required/optional concept**, though all three appear in forms.

### 4.1 Token coverage

Same shape as Dialog's finding (`O-12`): **what is covered is exactly what our token system has.**

| Covered | `primary` · `primary-foreground` · `secondary` · `secondary-foreground` · `accent` · `accent-foreground` · `destructive` · `background` · `foreground` · `border` · `input` · `ring` · `muted-foreground` · `radius-md` |
|---|---|
| **No token** | every height (24/32/36/40) · every padding · every gap · every font size and weight · icon sizes · ring widths · opacity · the `file:` height (28) · **and one literal colour (B-O-02)** |

The one difference from Dialog: **Button contains a raw colour keyword**, so here the gap is not only
"no token for this value" but "a value that bypasses the token system entirely."

---

## 5. Questions for step 4

1. **How many Button states do we draw in Figma** (B-O-01)? Four states across 48 combinations is 192
   variants; the number is a design-system decision, not an extraction.
2. **Should `link` keep button geometry** (B-O-04), or is it a different kind of thing wearing the
   Button API?
3. **Is `type="submit"` by default acceptable** (B-O-09), given it silently breaks Cancel buttons?
4. **Does Input need breakpoint variants in Figma** (I-O-02), or do we accept Figma documents one
   viewport?
5. **Is the `file:` styling part of Input** (I-O-04), or a separate component wearing Input's classes?
6. **Does Label need Radix at all** (L-O-03)?
7. **Where does required/optional live** (X-O-07, L-O-05) — Label, Field, or both?
8. **Should the shared focus treatment be named** (X-O-03) rather than repeated per component?
