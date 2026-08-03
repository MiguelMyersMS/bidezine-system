# Dialog — Step 6: Three-Way Comparison

**Protocol:** CDP step 6 (Phase A) · **Date:** 2026-08-03
**🔓 The v1 fence OPENS here.** First step permitted to read `../design-system/`.

## Sources read

`../design-system/src/layout.ts` (SPACE · BP · LAYOUT · RADIUS) · `src/tokens.ts` (TYPE · shadows) ·
`src/status.ts` (Z · MOTION · elevation) · `src/gallery/Dialog.tsx`.

**v1 has no dialog spec** under `docs/atomic/` — the component exists in code only, so there is no
Figma-verified contract to compare against, just the implementation.

---

## 1. The headline

**v1 is not a worse version of shadcn's Dialog. It is a more finished product built on a worse
foundation.** It solves three problems shadcn leaves open — and two of them are things I proposed as
*changes* in step 5, without knowing v1 had already fixed them.

Meanwhile shadcn's composition API is genuinely more capable than v1's fixed-prop shape.

The honest verdict is a merge, not a winner.

---

## 2. Scale-by-scale

### 2.1 Spacing

| | v1 `SPACE` | Our step-5 proposal |
|---|---|---|
| Values | 0 · **2** · 4 · 8 · 12 · 16 · **24** · **32** · 40 · 48 · **64** | 2 · 4 · 8 · 12 · **16** · **20** · 24 · 32 · 40 · 48 |
| Naming | index — `SPACE[5]` = 24 | Tailwind multiplier — `space-6` = 24 |
| Basis | Radix 9-step, 4px grid | Tailwind's `calc(base × N)` |

**Agreement:** both are 4px grids and share 2/4/8/12/16/24/32/40/48.

**⚠️ The dangerous part is the naming, not the values.**

| Value | v1 name | Our name |
|---|---|---|
| 20 | *(absent)* | `space-5` |
| 24 | `SPACE[5]` | `space-6` |
| 32 | `SPACE[6]` | `space-8` |
| 64 | `SPACE[9]` | *(absent)* |

**`SPACE[5]` is 24px in v1 and `space-5` is 20px in ours.** Anyone reading a v1 spec and translating
by index will silently land on the wrong value. This is the single highest-risk finding in this step.

**Verdict:** keep the Tailwind-aligned values — they are what the class names actually produce, and
omitting 20 would leave `gap-5` untokenised. **Add 64** (v1 needed it in a real app; we simply have not
hit it yet). **Publish an explicit v1→v2 mapping table** so no one translates by index.

### 2.2 Breakpoints

| | v1 `BP` | Ours (Tailwind) |
|---|---|---|
| | xs 520 · **sm 768** · md 1024 · lg 1280 · xl 1640 | sm 640 · **md 768** · lg 1024 · xl 1280 · 2xl 1536 |

**The scales are the same numbers under shifted names.** v1's `sm` (768) is our `md`. v1's `md` is our
`lg`. v1's `lg` is our `xl`. A second index-translation trap, identical in shape to the spacing one.

v1's values are **product-derived** (520 and 1640 came from the real app); Tailwind's are generic.

**Verdict:** open question for the owner. Tailwind's names are what `sm:` in a class string means, so
diverging from them would make every class string lie. Recommend keeping Tailwind's, and recording
v1's 520/1640 as candidate additions when a layout needs them.

### 2.3 Radius

| | v1 `RADIUS` | Our step-5 proposal |
|---|---|---|
| Model | **semantic** — `pill` 99 · `container` 18 · `containerLg` 20 · `containerSm` 16 · `rounded` 12 · `soft` 8 · `tooltip` 6 · `xs` 4 | **scale** — `xxs` 2 · `xs` 4 · `sm` 6 · `md` 8 · `lg` 10 · `xl` 14 |

Overlaps: 4 (`xs` both) · 6 (`tooltip` ≡ `sm`) · 8 (`soft` ≡ `md`).
v1 lacks 2, 10, 14. We lack 12, 16, 18, 20, 99.

**Note what this means for the component:** v1's dialog uses `RADIUS.container` = **18px**. shadcn's uses
`rounded-lg` = **10px**. Nearly a 2× difference on the most visible corner in the product.

**Verdict:** the two models answer different questions — v1's says *what kind of thing is this*, ours
says *how round is it*. A semantic layer can sit **on top of** a numeric scale, but not the reverse.
Recommend: keep the numeric scale as the primitive, extend it with the container tiers we are missing,
and consider semantic aliases later. **v1's `pill` 99 is a real gap in our scale.**

### 2.4 Typography — the genuine fork

| | v1 `TYPE` | Our step-5 proposal |
|---|---|---|
| Model | **semantic roles**, each bundling family + size + weight + line-height + letter-spacing | **raw scale**, size and line-height separately addressable |
| Sizes | 48 · 28 · 22 · 18 · 16 · 14 · **13** · 12 | 20 · 18 · 16 · 14 · 12 |
| Families | **three** — Inter (UI), DM Sans (display), Raleway (displayL) | one |
| Extras | `tabular-nums`, negative letter-spacing per role | none |

**🔬 Contamination check — this is why the fence mattered.**
My typography proposal was labelled `[possibly v1-influenced]` because I had read v1's `TYPE`. The
comparison shows it **did not converge**: different values (we have no 13, 22, 28 or 48), a different
model (unbundled vs bundled), and a different family strategy (one vs three). **The contamination did
not materially bias the proposal.** Had they matched, we could not have known whether that was
agreement or contamination — that uncertainty is exactly what the fence exists to remove.

**Where each is better:**
- **v1 is better** at expressing intent (`TYPE.headingS` says what it is), and it carries real design
  decisions — three families, tabular numerals, per-role letter-spacing — that a raw scale cannot hold.
- **Ours is better** at the case that broke in step 5: `DialogTitle` is `text-lg` **plus**
  `leading-none`. A bundled role token cannot express "this size with a different leading" without a
  new role for every combination.

**Verdict: needs the owner.** Recommend **both layers** — a raw scale as the primitive (what Tailwind
utilities compile against) with semantic roles composed from it. This is the one place v1 is clearly
carrying more design thinking than we are, and dropping it would be a real loss.

### 2.5 Z-index — v1 wins outright

| v1 `Z` | Ours |
|---|---|
| base 1 · sticky 20 · rail 30 · dropdown 40 · **overlay 50** · **modal 100** · toast 200 | *(not proposed — R-01 refused to build a scale from one component)* |

Step 5 declined to design a z-scale because Dialog uses `z-50` twice and nothing else. **v1 already has
the scale, designed against a whole application.**

It also **already implements C-04**: overlay 50 and modal 100 are separate, so stacking does not depend
on DOM order — the exact defect O-07 recorded in shadcn.

**Verdict: adopt v1's z-scale wholesale.** It resolves both R-01's objection and C-04.

### 2.6 Motion

| v1 `MOTION` | Our step-5 proposal |
|---|---|
| fast 120 · base 150 · **medium 200** · slow 350 · reveal 700 | fast 150 · base 200 · slow 300 |
| **Easings**: `ease`, `easeOut`, `expressive` `cubic-bezier(0.22,1,0.36,1)` | none — "Figma cannot hold easing" |

v1's `medium` (200) is the value shadcn's dialog uses, so both are value-compatible there.

**v1 carries easing; we dropped it** because Figma has no representation for it. That was the wrong
call — Figma's limitation is a reason to note that easing cannot round-trip, **not** a reason to leave
it out of the token system.

**Verdict: adopt v1's durations and easings**, including the `expressive` curve.

### 2.7 Shadow / elevation — v1 wins

v1's `elevation(tokens)` is a **function of the theme**: `flat` / `low` / `mid` / `high` / `overlay`,
each built from `shadowSubtle`…`shadowStrong`, which have **different values in light and dark**
(light uses slate-tinted alpha; dark uses heavier pure black).

shadcn's `shadow-lg` is a **fixed** black alpha, identical in both themes.

**Verdict: adopt v1's theme-aware model.** Shadows that don't respond to theme are a real defect in dark
mode, and we would have shipped it.

---

## 3. The components themselves

### 3.1 Where v1 is better — harvest these

| # | v1 does | shadcn does | Impact |
|---|---|---|---|
| **H-1** | `title` is a **required prop** | Title is optional; `aria-labelledby` wires only if present | **Solves C-03.** v1 makes the unnamed-dialog failure structurally impossible. |
| **H-2** | Separate `Z.overlay` / `Z.modal` | Both `z-50` | **Solves C-04.** |
| **H-3** | `@media (prefers-reduced-motion: reduce)` collapses animation to 1ms | **Nothing** | Accessibility gap in shadcn we did not observe in step 3. |
| **H-4** | `size` prop — sm 420 / md 560 / lg 720 | No size axis (O-17) | v1 answers what step 5 refused to invent. |
| **H-5** | Scrollable body with `ResizeObserver`, and right padding grows by 8px when a scrollbar appears | Leaves scrolling to the consumer | Detail work shadcn never did. |
| **H-6** | Close button 32×32, `RADIUS.soft`, `aria-label="Close dialog"` | Inline anonymous control | **Supports C-06** — v1 already treats it as a real control. |
| **H-7** | Footer has a `borderTop` hairline | No separator | Composition decision, but a considered one. |
| **H-8** | `maxHeight: calc(100vh - 96px)` | No height ceiling | v1's dialog cannot exceed the viewport. |

### 3.2 Where shadcn is better

| # | shadcn does | v1 does | Impact |
|---|---|---|---|
| **S-1** | Composition API — Header/Footer/Title/Description as separate exports | Fixed props (`title`, `description`, `footer`) | shadcn composes anything; v1 constrains you to its shape. **The bigger architectural win.** |
| **S-2** | `asChild` polymorphism | Not available | Any element can be a trigger. |
| **S-3** | `data-slot` on every part | None | Stable targeting without exposing class names. |
| **S-4** | Full Radix dismissal surface (`onInteractOutside`, `onFocusOutside`, …) | Two booleans (`closeOnEsc`, `closeOnBackdrop`) | More capable, less discoverable. |
| **S-5** | Focus state via CSS `:focus-visible` | React state — `useState` + `onFocus`/`onBlur` reading `.matches(":focus-visible")` | v1's is a **workaround forced by inline styles** — precisely the limitation ADR-006 exists to escape. |
| **S-6** | Animation via `data-state` + CSS | Injects a `<style>` element with `@keyframes` on every render | Same root cause as S-5. |

**S-5 and S-6 are the strongest vindication of ADR-006 in this comparison.** They are not design
failures — they are what a talented author has to do when the styling layer cannot express states.

---

## 4. Revised position after comparison

| Item | Step-5 position | After seeing v1 |
|---|---|---|
| Spacing values | Tailwind steps | **Keep**, add 64. Publish a v1→v2 mapping table. |
| Spacing naming | `space-N` | **Keep** — but the `SPACE[5]`≠`space-5` collision must be documented loudly. |
| Breakpoints | Tailwind | **Keep** names; record v1's 520/1640 as candidates. Owner to confirm. |
| Radius | numeric scale | **Extend** with v1's container tiers + `pill` 99. |
| Typography | raw scale | **Add a semantic layer on top.** Owner decision — this is the real fork. |
| Z-index | refused to propose | **Adopt v1's 7-step scale.** Resolves C-04. |
| Motion | durations only | **Adopt v1's durations + easings.** Dropping easing was my error. |
| Shadow | Tailwind fixed alpha | **Adopt v1's theme-aware elevation.** |
| C-03 accessible name | proposed 3 options | **v1 already solved it** — required title. |
| C-06 close atom | proposed | **Confirmed** — v1 treats it as a real control. |

---

## 5. What this step proves about the process

The fence paid for itself twice:

1. **Typography did not converge.** Because the proposal was formed before I re-read v1, we know the
   divergence is real and not an artefact of my contamination.
2. **Four things I would have shipped as "fine" are defects** — no reduced-motion handling,
   theme-blind shadows, an overlay/content z-collision, and a dialog that can silently ship with no
   accessible name. Three of those v1 had already solved. Had we run 1–5 with v1 open, I would very
   likely have copied its answers without ever forming an independent view of the alternatives.
