# Atoms Pass 1 — Step 6: Three-Way Comparison

**Components:** `Button` · `Input` · `Label` · **Date:** 2026-08-03
**🔓 The v1 fence OPENS for this pass.**

**Sources:** `../design-system/src/gallery/Button.tsx` (422 lines) · `TextInput.tsx` (142) ·
`docs/atomic/atom/button.spec.md` · confirmed **no Label component or spec exists in v1**.

---

## 1. The headline finding

**v1 already implements the Button truncation model the owner specified at A-D-011 — including the
exact technique.**

```js
const measure = () => setTruncated(el.scrollWidth > el.clientWidth + 1)
const ro = new ResizeObserver(measure)
const canTruncTip = truncated && typeof children === "string" && !disabled
```

- `scrollWidth > clientWidth` — the runtime measurement I flagged as unavoidable (A-D-013)
- **`+ 1` tolerance** for sub-pixel rounding — a detail I would not have thought of
- `ResizeObserver` re-measures on layout change
- Tooltip only when **actually truncated**, after a **delay**, and **never when disabled**
- Rendered through `createPortal` with `role="tooltip"`

**This overturns A-D-014.** We deferred the tooltip until a Tooltip component exists, on the grounds
that Button composing Tooltip would end its atom status. **v1 does neither** — Button owns a small
portalled bubble of its own. So the tooltip does **not** have to wait, and Button stays an atom.

---

## 2. Button — the two systems disagree about almost everything

| | v1 | shadcn |
|---|---|---|
| **Radius** | `RADIUS.pill` (**99**) at every size | `rounded-md` (**8**) |
| Variants | 3 — `solid` · `outline` · `ghost`, plus a `tone` (`accent`/`ink`) on solid | 6 — default · secondary · outline · ghost · destructive · link |
| Sizes | 3 — 28 / 36 / 44 | 8 — 24 / 32 / 36 / 40 + four icon-only |
| **States** | **explicit `state` prop**: default · hover · **pressed** · **selected** · focus · disabled · **disabledSelected** | CSS pseudo-classes only; **no pressed, no selected** |
| Loading | `loading` blocks interaction but **keeps its own visual** — only explicit `disabled` paints faded | none (a `<Spinner/>` child by convention) |
| Truncation | full, with tooltip (§1) | none at all |
| Typography per state | `selected` → `labelL` (500), all others `bodyM` (400) | constant `font-medium` |
| Icon per state | Regular in default/disabled, **Filled** in hover/pressed/selected/focus | constant |

**v1 is a pill; shadcn is a rounded rectangle.** Only one size (36) is shared. This is the largest
visual divergence found anywhere in the project so far — larger than the Dialog's 10px-vs-18px corner.

**v1's `loading` ≠ `disabled` distinction is a real design decision** shadcn never made: a loading
button keeps its selected/default appearance and shows a spinner, rather than greying out.

---

## 3. Input — v1 does not have one

**v1 has no Input atom. It has `TextInput`, which bundles label + input + hint + error + required.**

```
TextInput = <label> + <input> + hint text + error text + required asterisk
            + aria-describedby wiring (errorId / hintId)
```

shadcn splits the same surface into **three** components — `Label`, `Input`, `Field` — and makes the
consumer compose them.

**This is an architectural fork, not a styling difference.** Neither is wrong:

- **v1's bundle** guarantees the label is present, the ids are wired, and `required` is shown. The
  failure mode shadcn has (`aria-labelledby` wired only if you remember a Label — Dialog's O-26, and
  L-O-05's missing required affordance) **cannot occur** in v1, because the component owns it.
- **shadcn's split** lets you build layouts v1 cannot — label beside input, no label, two inputs to one
  label, a badge next to the label.

---

## 4. Label — v1 has none, confirmed

No `Label` component, no spec. The only `<label>` elements are inside `TextInput` and in stories.

**A-D-005 holds, and the absence is the finding:** v1 never needed a standalone label because its
inputs own theirs. Our Label comparison is genuinely **two-way** — shadcn versus us.

**And v1 answers Q7 by construction:** `required` lives on the field component and renders as a red
asterisk (`tokens.statusRedText`) appended to the label text.

---

## 5. Revised positions

| Item | Step-5 position | After v1 |
|---|---|---|
| Truncation tooltip | Deferred until Tooltip exists (A-D-014) | **Not deferred.** v1 owns a portalled bubble inside Button; copy that shape. Add the `+1` sub-pixel tolerance. |
| Pressed state | Not proposed — shadcn has none | **Propose it.** v1 has `pressed` *and* `selected`; a button with no pressed feedback is a real gap. |
| Loading | Out of scope | **Raise it.** v1's loading-≠-disabled distinction is considered design we would otherwise lose. |
| Button radius | `radius-md` (8, shadcn) | **Owner decision.** v1 is a pill at 99. D-027 said "follow v1's look" for Dialog — whether that extends to Button is not something I should assume. |
| Variants / sizes | shadcn's 6 × 8 | **Keep shadcn's**, which is a superset in kind (v1 has no destructive/link). But v1's sizes are 28/36/44 against shadcn's 24/32/36/40 — only 36 agrees. |
| Required / optional | Deferred to Field | **Confirmed** as a field concern, and v1 shows the treatment: a red asterisk after the label. |

---

## 6. What this step proves

Running steps 2–5 fenced produced a Button proposal that **converged with v1 on the hardest part** —
truncate, measure at runtime, tooltip only when clipped, never when disabled — without having seen it.
That is genuine convergence: the fence makes it evidence rather than an echo.

It also caught two things the fence could not: **v1's `+1` sub-pixel tolerance**, and the fact that
**a portalled tooltip inside Button was possible all along**, which we had wrongly deferred.
