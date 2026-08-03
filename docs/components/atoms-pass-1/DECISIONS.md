---
pass: atoms-pass-1
components: Button, Input, Label
lifecycle: dissecting
figma-analysis-board: "Atoms 1 · Step 2 — Dissection" (node 40:3)
sync: pushed
owner-machine: —
last-updated: 2026-08-03
---

# Atoms Pass 1 — Decision Log

> `sync` records where the work physically lives and is set in the commit carrying it. It reads
> `pushed` only once that commit reaches `origin/main`, at which point the pass **leaves the hand-off
> queue** and `owner-machine` is released to `—`. If a session ends without pushing, `sync` must be
> corrected to `working` or `committed`, because unpushed work does not travel between the three
> machines.

Entries record **what was decided, why, and at which step**.

---

## Step 0 — Scope & Fence

**A-D-001 · Button, Input and Label share one pass; Field does not.** *(Owner, 2026-08-03)*
Per the CDP batching rule: components may share a pass only if none composes another. These three are
mutually independent. Field composes Label and Input, so batching it here would mean reviewing a
composition alongside its own parts — the failure the bottom-up order exists to prevent (D-001).

**A-D-002 · The batching rule and the per-pass fence clarification enter the CDP.** *(Owner, 2026-08-03)*
Both recorded in `docs/process/COMPONENT-DEVELOPMENT-PROTOCOL.md` §2 rather than left as a one-off
arrangement, since they will govern every future pass.

**A-D-003 · The fence resets per pass, but excludes adopted system architecture.** *(CDP, 2026-08-03)*
v1 being open for Dialog does not open it here. However, v1 scales already migrated into our token
source (radius tiers, z-index, motion, elevation) are **ours** now, and pretending not to know them
would be theatre rather than independence. The fence protects analysis of *a component* from v1's
answer for *that component* — it was never meant to un-decide settled system architecture.

**A-D-004 · Input's state model cannot be independent, and will be labelled as such.** *(Step 0)*
I have read v1's `inputtrigger.spec.md` including its complete six-state model, and the pre-protocol
Input I built was directly derived from it. Any resembling state model will carry
**`[contaminated — derived from v1 InputTrigger]`** rather than being presented as convergence. Step 6
must treat Input's state comparison as already decided.

Not contaminated for Input: v1's `TextInput.tsx`, unread, and possibly the truer counterpart to
shadcn's `Input` than `InputTrigger` is.

**A-D-005 · Label may have no v1 counterpart at all.** *(Step 0, provisional)*
Nothing matching in `src/gallery/` or `docs/atomic/`. If it holds at step 6, Label's comparison is
**two-way** rather than three-way — and the absence is itself a finding: a component the old system
never needed as a distinct part.

**A-D-006 · Button's sections carry more detail than the others, deliberately.** *(Step 0)*
It is a 6 × 8 CVA matrix against a single class string each. The known cost of batching is glossing the
largest component; this is the mitigation.

**A-D-007 · Truncation and wrapping is a required lens on text elements.** *(Owner, 2026-08-03)*
v1 specifies truncate-vs-wrap behaviour on text elements, so every text-bearing part is dissected for
it. Applied at step 2 §4.1, with visual evidence on the Figma board.

## Step 2 — Dissect

**A-D-008 · Correction: Radix Label does almost nothing.** *(Step 2)*
In the reverted pre-protocol `src/ui/label.tsx` I wrote that Radix Label *"wires the label→control
association and forwards clicks to the control."* **Wrong.** That is the native `<label htmlFor>`; the
browser does it. Radix Label's entire implementation is one `onMouseDown` handler that calls
`preventDefault()` when `detail > 1` — it stops a double-click selecting the label text. shadcn also
applies `select-none`, which already prevents selection by CSS.

**A-D-009 · Neither Button nor Label has any truncation strategy.** *(Step 2, per A-D-007)*
Measured on the board: a "Save all changes and close" button is **213px inside a 200px container — 23px
of overflow.** `whitespace-nowrap` (never wraps) + no `overflow-hidden`/`text-ellipsis` (never
truncates) + `shrink-0` (cannot be squeezed) leaves overflow as the only possible outcome. Label wraps
freely but at `leading-none`, so wrapped lines have **zero leading** — the line box equals the font size.
**Input is the only one of the three carrying `min-w-0`,** and so the only one able to shrink in a flex
parent.

**A-D-011 · OWNER REQUIREMENT — Button overflow behaviour.** *(Owner, 2026-08-03)*
Answers step 2's close-out question on truncation. shadcn has **none** of this; it is a net-new
capability, so it becomes a step-5 change proposal rather than a step-2 fact.

As specified:

1. **The button never overflows its container.** At most it fills the available area, and it must not
   encroach on the container's inner padding.
2. **Text truncates inside the button's own padding** — the padding is preserved, the text is cut.
3. **Hovering a truncated button shows a tooltip with the full text.**
4. **Some buttons wrap instead.** Line count is either unlimited or capped by the button's
   specification, with the remainder truncated.
5. **Wrapping grows the button's height**, and likely the container's too, since containers hug on the
   y-axis.
6. **Which behaviour applies is part of the button's specification**, in relation to its content and
   its container.

**Three consequences, recorded now so they are not discovered mid-build:**

- **`shrink-0` must go.** It is the class that currently makes overflow inevitable (A-D-009). Removing
  it is necessary but not sufficient — the text child also needs `min-w-0`, or a flex item still refuses
  to shrink below its content.
- **Fixed heights must become minimum heights.** Every size today is a fixed `h-6/8/9/10` with
  `items-center` doing the vertical centring. Text that wraps **cannot** live in a fixed height, so
  wrapping forces `min-h-*` plus real vertical padding — a change to how the whole size scale is
  implemented, not a per-variant tweak.
- **The tooltip may cost Button its atom status.** A Button that composes a Tooltip is no longer a leaf,
  and `Tooltip` does not exist in our system yet. The alternative is the native `title` attribute, which
  has no dependency but poor control over timing, styling and touch behaviour.

**A-D-010 · Two behaviours exist only in prose, with no counterpart in the source.** *(Step 2)*
(1) Tailwind v4 switched buttons from `cursor: pointer` to `cursor: default`, and shadcn does not
override it — pointer behaviour needs a consumer `@layer base` rule. (2) There is no `loading` prop; the
documented pattern is a `<Spinner />` child carrying `data-icon="inline-start|inline-end"` for spacing,
a convention that appears nowhere in `button.tsx`. Both are invisible to anyone reading only the code.
