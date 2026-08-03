# Atoms Pass 1 — Step 0: Scope & Fence

**Components:** `Button` · `Input` · `Label`
**Protocol:** CDP step 0 (Phase A) · **Date:** 2026-08-03 · **Owner machine:** Laptop A

---

## 1. Why these three share one pass

Per the CDP batching rule (added 2026-08-03): **components may share a pass only if none composes
another.** Button, Input and Label are mutually independent — no one of them contains any other.

`Field` is deliberately **excluded**: it composes Label and Input, so batching it here would mean
reviewing a composition alongside its own parts, which is the failure the bottom-up order exists to
prevent (D-001). Field runs its own pass afterwards.

**Dialog is paused at step 7** (D-031) and resumes at its step 8 once these atoms and Field exist, so
the assembled modal form is real rather than a shell with a placeholder.

**Known imbalance.** Button is substantially larger than the other two — a 6 × 8 CVA variant matrix
against a single class string each. Per the batching rule its sections carry proportionally more detail,
deliberately, so the batch does not gloss over the component most likely to be short-changed.

---

## 2. Source fence

### Permitted for steps 2–5

`reference/shadcn-ui/` — the vendored source, its docs (tagged `[prose]`), and the Radix primitives
these components wrap (`@radix-ui/react-slot` for Button's `asChild`, `@radix-ui/react-label`).
Carried forward from D-006 / D-007.

### Fenced until step 6

**The fence resets for this pass.** v1 being open for Dialog does not open it here.

| Fenced | |
|---|---|
| `../design-system/src/gallery/Button.tsx` · `TextInput.tsx` · `InputTrigger.tsx` · `InputTriggerCompact.tsx` | + their stories |
| `../design-system/docs/atomic/atom/button.spec.md` · `button-dark.spec.md` · `molecule/inputtrigger*.spec.md` | |
| `docs/reference/REFERENCE-MAP.md` | summarises v1 by name |

### NOT fenced — already-adopted system decisions

Per the CDP clarification added 2026-08-03: the fence covers **v1's components and their specs**, not
system architecture we have already adopted from v1 in an earlier pass. Those are now **ours**:

- the radius scale including v1's container tiers and `pill` (D-013, R-11)
- v1's z-index scale (R-07), motion durations and easings (R-08), theme-aware elevation (R-09)
- the decision that typography gets a semantic layer over a raw scale (R-13)

Pretending not to know settled system architecture would be theatre, not independence.

---

## 3. Contamination declaration

**This pass is more contaminated than Dialog's was.** Stated per component so step 6 can weigh each
separately.

### 3.1 `Input` — heavily contaminated ⚠️

I have read `../design-system/docs/atomic/molecule/inputtrigger.spec.md` in this session, including its
**complete six-state model** (`empty` · `active` · `hasValue` · `activeHasValue` · `disabled` · `error`),
the state-by-state fill/border/text notes, and its layer anatomy.

**The state model is precisely what Input's analysis is about.** Worse: in the pre-protocol work I
built an Input state set *directly derived from that spec*, extending it with `disabledHasValue`.

**Consequence, stated plainly:** Input's steps 2–5 **cannot produce an independent state model.**
Anything resembling those six states will be labelled **`[contaminated — derived from v1 InputTrigger]`**
rather than presented as convergence. Step 6 must treat Input's state comparison as already decided,
not as two systems arriving at the same answer.

*Not* contaminated for Input: v1's `TextInput.tsx`, which I have never read and which may well be the
truer counterpart to shadcn's `Input` than `InputTrigger` is.

### 3.2 `Button` — second-look only

v1's `Button.tsx` and both button specs: **not read.**

But I built a 96-variant Button set in Figma and ported `src/ui/button.tsx` before the protocol existed
(since reverted, `12b997d`). So this is a **second look, not a fresh one** — including a variant × size ×
state matrix I chose myself. Step 2 is written from the source read again in full, not from recall.

### 3.3 `Label` — clean

v1 appears to have **no Label component or spec** (nothing matching in `src/gallery/` or
`docs/atomic/`). Nothing to be contaminated by, beyond the same pre-protocol second-look.

**Implication for step 6:** Label's comparison will be **two-way** (shadcn vs ours), not three-way. If
that holds, it is itself a finding — a component the old system never needed.

### 3.4 System-level, affecting all three

At Dialog's step 6 I read v1's `tokens.ts` (PALETTE, TOKENS_LIGHT/DARK, **TYPE**), `layout.ts`
(SPACE, BP, RADIUS, LAYOUT), `status.ts` (Z, MOTION, elevation) and `Dialog.tsx`.

Most of that is now adopted system architecture (§2) and therefore not fenced. **The exception is
`TYPE`:** R-13 ratified that a semantic type layer *will* exist, but it has not been designed. So I know
v1's type roles and values while our equivalent is still open — any typography proposal in this pass
carries the same `[possibly v1-influenced]` label used at Dialog step 5.

---

## 4. Working state

- **lifecycle:** `scoped` · **owner-machine:** Laptop A · **sync:** see `DECISIONS.md`

## 5. Workspace

```text
docs/components/atoms-pass-1/
  00-scope.md · 02-anatomy.md · 03-observations.md · 04-review.md
  05-adjustments.md · 06-comparison.md · 07-risks.md · 08-build-review.md
  10-retro.md · DECISIONS.md · PARKING-LOT.md
```

Every artifact carries a separate section per component. Per-component folders
(`docs/components/button/` …) are created at step 8, when each becomes a real component, each pointing
back here for its analysis history.
