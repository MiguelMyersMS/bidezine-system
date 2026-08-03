# Atoms Pass 1 — Step 7: Risk Review

**Components:** `Button` · `Input` · `Label` · **Date:** 2026-08-03

> Accessibility is a named lens (CDP §2). Everything below is **measured** from our own token values,
> not estimated.

---

## 1. 🚨 Three measured WCAG failures in the inherited theme

All three come from shadcn's default palette, which we adopted as the seed. They are **not** caused by
anything we changed.

| # | Pair | Measured | Needs | |
|---|---|---|---|---|
| **A-1** | Input border `#e5e5e5` on `background` | **1.26 : 1** | 3.0 (WCAG 1.4.11) | ❌ |
| **A-2** | Focus halo `ring` `#a1a1a1` on `background` | **2.58 : 1** | 3.0 (WCAG 1.4.11) | ❌ |
| **A-3** | Button destructive text on dark fill `#ff6467` | **2.77 : 1** | 4.5 (WCAG 1.4.3) | ❌ |

### A-1 — the input border is effectively invisible

**1.26 : 1 is not a marginal miss.** The border *is* the affordance that identifies an input as an
input — WCAG 1.4.11 exists precisely for this. At that ratio a low-vision user sees a blank rectangle.

**Threshold:** a grey must be **`#949494` or darker** to clear 3:1 on white. Our `input` is `#e5e5e5`,
which is nowhere near.

### A-2 — the focus indicator itself fails contrast

The focus halo is the mechanism keyboard users navigate by, and it does not meet the minimum for a
non-text indicator. Same `#949494` threshold applies.

Note the halo is drawn at 50% (`focus-ring`), so its *effective* contrast is lower still than the 2.58
measured for solid `ring`.

### A-3 — destructive fails in dark, and my step-5 fix only solved light

C-A04 redefined `destructive-foreground` to near-white in both modes. That gives **4.57 : 1 in light** —
a pass, but only just. **In dark it gives 2.77 : 1**, a clear fail, because the dark destructive fill
`#ff6467` is far lighter than the light one.

Two ways out, both computed:

- **Black text on the dark fill scores 7.27 : 1** — comfortably passing. But it means
  `destructive-foreground` must *invert* by mode rather than being one near-white value.
- **Or darken the dark fill** to `rgb(195,76,78)` or lower, at which point near-white passes.

**This one is my error to own:** I redefined the token in step 5 having checked light and not dark.

---

## 2. Risks in what we chose

**R-1 · The Button radius decision is unresolved and it is the largest visual fork in the project.**
v1 is a pill (99); shadcn is 8. D-027 committed to v1's look for Dialog. Whether that extends to Button
was explicitly left to the owner (step 6 §5), and step 8 cannot draw a button without an answer.

**R-2 · Adding `pressed` and `selected` (step 6) enlarges the drawn matrix.** A-D-022's grouping keeps
it manageable — variant × state at default size — but 6 variants × 6 states is 36 frames, not 24.

**R-3 · `loading` ≠ `disabled` is a behavioural contract with no visual in shadcn.** Adopting v1's
distinction means designing a state shadcn never drew.

**R-4 · C-A05's min-height change touches all eight sizes at once.** Converting `h-*` to `min-h-*` plus
real vertical padding is the highest-blast-radius change in this pass, and it cannot be done partially —
a fixed height and a wrapping label are mutually exclusive.

**R-5 · Divergences now number four** (type default, no Radix on Label, no `file:` styling, redefined
`destructive-foreground`). Each is defensible; together they are enough that "we are shadcn-based" needs
qualifying in the docs, or a future reader will treat the differences as bugs.

---

## 3. Accepted without mitigation

- Icon sizing stays untokenised (sample of one).
- Figma documents Input at ≥`md` only; the mobile 16px lives in the spec (Q4).
- Label has no v1 counterpart, so its comparison was two-way — it has had less scrutiny than the others.

---

## 4. Blocking step 8

| # | Item | Why |
|---|---|---|
| 1 | **A-1 / A-2** — border and focus contrast | Both are theme-level colour decisions. Drawing components against failing values bakes them into every component that follows. |
| 2 | **A-3** — destructive in dark | Determines whether `destructive-foreground` is one value or inverts by mode. |
| 3 | **R-1** — Button radius: pill or 8? | Cannot draw a button without it. |

Items 1 and 2 are token changes, not component work, so they can be fixed immediately. Item 3 is a
design decision.
