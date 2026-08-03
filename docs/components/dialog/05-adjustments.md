# Dialog — Step 5: Adjustments

**Protocol:** CDP step 5 (Phase A) · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed
**Companion artifact:** Figma proposal board — page `Dialog · Step 5 — Proposal`

> Two kinds of thing live here and they are kept strictly apart, per **R-02**:
>
> **Part 1 — Tokenisation.** Value-preserving. Same pixels, new names. Reviewable by inspection.
> **Part 2 — Changes.** Each one alters the rendered or behavioural result and is a separate decision.
>
> Nothing here is built. Step 8 builds.

## Provenance rule

Per **R-01**, no scale is invented from a single data point. Every value below is one of:

- **`[observed]`** — currently used by Dialog. Must be preserved exactly.
- **`[extracted]`** — a step of the Tailwind scale the component already sits on, brought in to make
  the scale usable rather than a list of one.

**Nothing is marked `[invented]`, because nothing is.** Where a scale would need invention to be
complete, it is deliberately left incomplete and flagged.

---

# Part 1 — Tokenisation (value-preserving)

## 1.1 Spacing

Tailwind v4 holds **one** `--spacing` base (4px) and computes every utility as `calc(base × N)`. Figma
has no `calc()`, so — exactly as with radius — the DTCG source carries the base **and** explicit steps.

Step names mirror the Tailwind multiplier, so `p-6` → `space-6` is a direct read with no translation.

| Token | px | Multiplier | Provenance |
|---|---|---|---|
| `space-0-5` | 2 | ×0.5 | `[extracted]` |
| `space-1` | 4 | ×1 | `[extracted]` |
| `space-2` | 8 | ×2 | `[observed]` — `gap-2` on Header and Footer |
| `space-3` | 12 | ×3 | `[extracted]` |
| `space-4` | 16 | ×4 | `[observed]` — `gap-4`, `top-4`, `right-4` |
| `space-5` | 20 | ×5 | `[extracted]` |
| `space-6` | 24 | ×6 | `[observed]` — `p-6` |
| `space-8` | 32 | ×8 | `[observed]` — the `calc(100%-2rem)` mobile inset |
| `space-10` | 40 | ×10 | `[extracted]` |
| `space-12` | 48 | ×12 | `[extracted]` |

## 1.2 Typography

| Token | Value | Provenance |
|---|---|---|
| `font-size-xs` / `line-height-xs` | 12 / 16 | `[extracted]` |
| `font-size-sm` / `line-height-sm` | 14 / 20 | `[observed]` — `DialogDescription` |
| `font-size-base` / `line-height-base` | 16 / 24 | `[extracted]` |
| `font-size-lg` / `line-height-lg` | 18 / 28 | `[observed]` — `DialogTitle` |
| `font-size-xl` / `line-height-xl` | 20 / 28 | `[extracted]` |
| `line-height-none` | 1 | `[observed]` — `DialogTitle` overrides its paired leading |
| `font-weight-normal` | 400 | `[observed]` |
| `font-weight-medium` | 500 | `[extracted]` |
| `font-weight-semibold` | 600 | `[observed]` — `DialogTitle` |
| `font-weight-bold` | 700 | `[extracted]` |

> **Note.** `DialogTitle` is `text-lg` **plus** `leading-none` — 18px type on an 18px line box, not the
> paired 28. Any type token that bundles size and leading together would render this wrong. Size and
> line-height must stay separately addressable.

## 1.3 Radius — ratified 2026-08-03 (D-013)

`radius-xxs` 2 · `radius-xs` 4 · `radius-sm` 6 · `radius-md` 8 · `radius-lg` 10 · `radius-xl` 14.
`[observed]`: `rounded-lg` (10) and `rounded-xs` (2). Remainder `[extracted]`.

## 1.4 Stroke width

| Token | px | Provenance |
|---|---|---|
| `stroke-1` | 1 | `[observed]` — the dialog border |
| `stroke-2` | 2 | `[observed]` — `ring-2`, `ring-offset-2` |
| `stroke-3` | 3 | `[extracted]` — `ring-[3px]`, used by sibling components |

## 1.5 Shadow

Tailwind's elevation ramp. `[observed]`: `shadow-lg`. Remainder `[extracted]`.

`shadow-xs` · `shadow-sm` · `shadow-md` · **`shadow-lg`** · `shadow-xl`

> ⚠️ **Figma cannot hold these as Variables.** Figma Variables support only FLOAT / COLOR / STRING /
> BOOLEAN. Shadows must ship as Figma **effect styles**, which do not round-trip through the DTCG
> emitter the way colour and dimension do. Logged as pending item **T3** in `docs/DECISION_LOG.md`.

## 1.6 Motion

| Token | Value | Provenance |
|---|---|---|
| `duration-fast` | 150ms | `[extracted]` |
| `duration-base` | 200ms | `[observed]` — the dialog enter/exit |
| `duration-slow` | 300ms | `[extracted]` |

> Easing has **no Figma representation at all** — also part of T3. The `zoom-95` enter scale is treated
> as component-local per R-01, not a motion token.

## 1.7 Breakpoints

Tailwind's set. `[observed]`: `sm`, which alone drives four layout changes in Dialog.

**`sm` 640** · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536 — remainder `[extracted]`.

## 1.8 Opacity

`opacity-50` `[extracted]` · `opacity-70` `[observed]` · `opacity-100` `[observed]`.

## 1.9 Deliberately NOT proposed

Per R-01, these would be scales built from one data point:

| Value | Why not |
|---|---|
| z-index | Dialog uses `z-50` **twice** and nothing else. A layering system needs more than one component to be designed against — see change **C-04**. |
| Icon sizing | Only `size-4` (16) observed. A 12/16/20/24 ramp would be anticipatory. |
| Content width | `sm:max-w-lg` (512) is a Dialog composition decision, not a system scale. |

---

# Part 2 — Proposed changes (each a separate decision)

Every item below **alters** the current result. None is bundled with Part 1.

### C-01 · Remove `showCloseButton` from `DialogFooter` — *theme C, resolves O-14*

Two props share one name with opposite defaults and different output. `DialogFooter`'s version renders
`<DialogClose asChild><Button variant="outline">Close</Button></DialogClose>` — which is exactly what a
consumer writes by hand, and what shadcn's own demo *does* write by hand rather than using the prop.

**Proposal:** drop it. Keep `showCloseButton` on `DialogContent` only, where it controls the icon
control that consumers genuinely cannot easily replicate.
**Risk:** breaking change for anyone using it. Given v2 has no consumers yet, the cost is now or never.

### C-02 · Give the disabled close control a visual — *resolves O-22*

`disabled:pointer-events-none` with no visual change: a disabled close control looks identical to an
enabled one and simply stops responding.

**Proposal:** add a disabled visual (opacity step). **Accessibility-relevant** — a control that looks
interactive but is not is a genuine usability failure, not a polish item. Carried to step 7.

### C-03 · Make an accessible name unavoidable — *resolves O-26*

`aria-labelledby` is wired only if a `DialogTitle` happens to be present. Omit it and you ship a dialog
with no accessible name; nothing in the types or at runtime says so.

**Proposal options** (not yet chosen — needs step 7's a11y lens):
(a) require a title by type, (b) dev-time warning, (c) require an explicit `aria-label` when no title.

### C-04 · Separate overlay and content layers — *resolves O-07*

Both sit at `z-50`, so their stacking depends purely on DOM order.

**Proposal:** give them distinct layers. **Deferred** — per R-01, the right fix is a layering scale,
and that needs more than one component. Recorded so it is not lost.

### C-06 · Extract the close control as a first-class atom — *owner, 2026-08-03*

**Owner's observation, and it corrects a step-2 misclassification of mine.** The close control — the
`X` — was documented as part of `DialogContent`'s internal composition. It is not: it is an
**anonymous atom embedded inline**. It has its own radius, its own icon size, its own offset, and the
only full interaction state set in the entire component (rest / hover / focus / disabled / open) — which
is exactly why O-20 read as an anomaly rather than as evidence that a distinct atom was hiding there.

**Proposal:** extract it as a named atom (an icon button) with a proper variant and state matrix, and
have `DialogContent` compose an instance of it rather than redrawing it inline.

**Consequences to weigh:**

- It becomes a Figma component in its own right, with states as variants — unlike `DialogTrigger` /
  `DialogClose`, which stay code-only under R-03 because they have *no* visual definition. This one
  has a very specific one.
- It is almost certainly not Dialog-only. Any dismissible surface (sheet, drawer, popover, toast, tag)
  wants the same atom. That makes it a **system** component surfaced by Dialog, like the token scales.
- Sizes are currently a sample of one (`size-4` icon, 16px offset), so a size ramp would be invention
  under R-01 — the atom can be extracted now and sized properly when a second consumer appears.

### C-05 · Document the modal-only contract — *R-05*

`modal={false}` removes the focus trap, scroll lock and outside-pointer blocking. Documentation change
only; the prop keeps working.

---

# Part 3 — Token impact summary

| Scale | New tokens | CSS | Figma |
|---|---|---|---|
| Spacing | 1 base + 10 steps | base only | 10 FLOAT |
| Typography | 5 sizes + 5 leadings + `none` + 4 weights | all | 15 FLOAT |
| Radius | +2 (`xxs`, `xs`) | all | 2 FLOAT |
| Stroke | 3 | all | 3 FLOAT |
| Shadow | 5 | all | ⚠️ effect **styles**, not variables |
| Motion | 3 durations | all | 3 FLOAT (easing: none) |
| Breakpoints | 5 | all | 5 FLOAT (documentation only) |
| Opacity | 3 | all | 3 FLOAT |

**Net: ~46 new tokens**, taking the system from 26 to roughly 72. Every one is `[observed]` or
`[extracted]`; none invented.

**Coverage effect on Dialog:** 6 of ~27 values → **~26 of 27**. The remaining gap is the content
max-width (512), which R-01 keeps as a component decision rather than a scale.

---

# Part 4 — Contamination labelling

Per `00-scope.md` §3, proposals plausibly downstream of my v1 exposure are labelled so step 6 does not
mistake contaminated agreement for independent convergence.

| Item | Status |
|---|---|
| Typography scale (§1.2) | **`[possibly v1-influenced]`** — I have read v1's `TYPE` system. The proposal here is Tailwind-derived and its values (12/14/16/18/20) do **not** match what I recall of v1's ramp, but I cannot claim the framing is uncontaminated. |
| Spacing, shadow, stroke, motion, breakpoints, opacity | Clean — derived from Tailwind values present in `dialog.tsx`; I have not read v1's `layout.ts`. |
| All Part 2 changes | Clean — derived from step 3 observations only. |
