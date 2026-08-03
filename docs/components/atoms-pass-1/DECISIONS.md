---
pass: atoms-pass-1
components: Button, Input, Label
lifecycle: implemented
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

## Step 7 blockers — all resolved by the owner, 2026-08-03 ("fix all")

**A-D-024 · Three measured WCAG failures corrected at the token level.** *(Owner, 2026-08-03)*

| Token | Was | Now | Ratio |
| --- | --- | --- | --- |
| `input` (light) | `#e5e5e5` — 1.26:1 | `#959595` | **3.00:1** |
| `ring` / `focus-ring` (light) | `#a1a1a1` — 2.58:1 | `#898989` | **3.51:1** |
| `destructive-foreground` (dark) | near-white — 2.77:1 | near-black | **6.84:1** |

All inherited from shadcn's default palette, not caused by anything we changed — **except the third,
which was my error**: I redefined that token at step 5, verified light, and did not check dark.

Two principles fall out, worth more than the fixes:

- **`input` and `border` are now genuinely different tokens.** `input` is a **control affordance** and
  is therefore governed by WCAG 1.4.11's 3:1; `border` is decorative and may stay light. shadcn ships
  both at the same value, which is why the distinction was invisible.
- **`destructive-foreground` inverts by mode.** The dark destructive fill is a much *lighter* red than
  the light one, so the text on it must go the other way. A token that inverts is unusual and needs
  saying out loud, or someone will "correct" it.

**A-D-025 · Button adopts v1's pill radius (`radius-pill`, 99), not shadcn's 8.** *(Owner, 2026-08-03)*
Consistent with D-027, which took v1's look for the Dialog surface. This is the largest visual
divergence from shadcn in the system, and it is deliberate: **the pill is the v1 button's identity.**

## Step 9 — Iteration 1 (icons + icon-aware padding)

**A-D-026 · Icons are Fluent UI System Icons, always.** *(Owner, 2026-08-03)*
Same rule as v1: `docs/icon-protocol.md` already governs it — fill-based inline SVG, Regular + Filled
duality for interactive icons, fetched from `microsoft/fluentui-system-icons`. The placeholder squares
built at step 8 are **replaced**; the sample glyph is **Folder Multiple**
(`ic_fluent_folder_multiple_20_regular`).

**A-D-027 · Button gains icon slots and v1's per-side padding compensation.** *(Owner, 2026-08-03)*
An enhancement taken from v1, because **shadcn has no equivalent**.

shadcn's rule is `has-[>svg]:px-3` — it reduces padding **uniformly** whenever *any* svg is present.
That unbalances a button with only ONE icon: the bare-text side loses padding it still needs.

v1's rule (EX-BUTTON-001) is **per side**: a side WITH a container drops the +8px that a bare-text side
keeps, because the slot's own 6px already holds the label off the edge. Verified in the build:

| `icons` | padding-left | padding-right |
| --- | --- | --- |
| `none` | 16 | 16 |
| `start` | **8** | 16 |
| `end` | 16 | **8** |
| `both` | **8** | **8** |

Slots sit **flush** to the label (`itemSpacing: 0`), exactly as v1 does — the spacing is the slot's
internal padding, not a gap. Getting that wrong would double-count the space.

`icons` is a **variant axis** rather than a boolean property, because Figma cannot vary auto-layout
padding from a boolean. Crossed with variant and size per the instantiation test (A-D-023): a designer
will place a `secondary` `lg` button with a leading icon. 6 × 4 × 4 = **96**.

**Not yet built:** the **loading** state. v1 treats the spinner as its *own* 28px container — separate
from the icons, placed left or right, and it does **not** replace an icon, so a side can hold both. It
therefore needs the same per-side padding treatment and is the next iteration, not a variant of this one.

**A-D-028 · Text below an input is NOT a Label.** *(Raised by the owner, 2026-08-03)*

Three different things sit around a field, distinguished by what they do for assistive technology —
not by where they appear:

| | Position | ARIA | Announced as |
| --- | --- | --- | --- |
| **Label** | above / beside | `aria-labelledby` | the field's **name**, always |
| **Description / hint** | below | `aria-describedby` | supplementary, after a pause |
| **Error** | below | `aria-describedby` + `role="alert"` | interrupts |

Confusing them produces a field whose accessible name is *"Must be at least 8 characters"* and no
actual name. Both systems agree on the split, differently: shadcn ships three components
(`Label`, `FieldDescription`, `FieldError`); v1's `TextInput` takes them as three props
(`label`, `hint`, `error`).

**Neither Description nor Error exists in our system yet — both are Field's parts**, and Field is the
next pass. Carried there.

*(The question arose because the Atoms page had the Label set positioned directly below the Input set,
which read as composition. Layout corrected in Figma; component sets now sit side by side with
on-canvas headings, since a set's name is visible in Figma's UI but vanishes in a screenshot.)*

**A-D-029 · CORRECTION — my step 6 under-compared Input, and it cost two states.** *(Owner challenge, 2026-08-03)*

The owner asked whether the dissection had really pulled the relevant information, pointing at shadcn's
live Input docs. **Verified against the live page:** it matches our vendored copy exactly — the same 16
sections, the same three named states (disabled, invalid, required), no props table, and the word
"active" appears nowhere on it. The step-2 dissection was accurate: **shadcn's Input genuinely has four
visual states.**

**But step 6 was thin.** I compared Input to v1 *architecturally* — "v1 has no Input, `TextInput` bundles
label + hint + error" — and never enumerated `TextInput`'s **states**. It has six:

| | border | background |
| --- | --- | --- |
| default | `border` | surface |
| **hover** | `borderStrong` | surface |
| focus | `accent` | surface |
| **readOnly** | `border` | `bg` |
| disabled | `border` | `bgSubtle` |
| error | `statusRed` | surface |

**`hover` and `readOnly` are v1's and shadcn has neither.** `readOnly` I had never mentioned in any
step. Input rebuilt with all six.

**This also corrects A-D-004's contamination claim.** I declared Input heavily contaminated by v1's
`InputTrigger` six-state model (`empty` · `active` · `hasValue` · `activeHasValue` · `disabled` ·
`error`). But `InputTrigger` is a **closed-state trigger**, not a text field — Input's real counterpart
is `TextInput`, whose states are different and contain no `hasValue` at all. The contamination was
about the wrong component.

**The step-0 parking lot predicted exactly this** ("which of the three v1 input components is the true
counterpart… matters, because I am contaminated on InputTrigger but not on TextInput"). It was right,
and I did not act on it at step 6.

`hasValue` is therefore deliberately **not** a state of our Input.

## Step 3 — Observations

**A-D-017 · Step 2 signed off; the bare `radius` token removed as part of closing it.** *(Owner, 2026-08-03)*
Recorded system-wide in `docs/DECISION_LOG.md`.

**A-D-018 · Button contains a raw colour keyword.** *(Step 3, B-O-02)*
`variant=destructive` sets `text-white` — not `primary-foreground`, not any token. It is the **only
hard-coded colour across all three components**, and it means destructive button text cannot respond to
theming. Distinct from the ordinary "no token for this value" gap: this value bypasses the token system
entirely.

**A-D-019 · Every Button is `type="submit"` inside a form.** *(Step 3, B-O-09)*
The HTML default, which shadcn does not override. A Cancel button in a dialog form **submits that form**
unless the consumer remembers `type="button"`. shadcn's own dialog demo does remember — which is
evidence the trap is real, not theoretical. The failure is silent and the component gives no signal.

**A-D-020 · Input carries the only responsive value in the pass.** *(Step 3, I-O-02)*
`text-base md:text-sm` — 16px below `md`, 14px above, a deliberate iOS zoom defence. **Figma cannot
express a value that changes at a breakpoint within one variant**, so any Figma Input documents a single
viewport unless breakpoint variants are drawn. First case in this project where the two media genuinely
cannot hold the same truth.

**A-D-021 · Button's real Figma cost is 48 × states.** *(Step 3, B-O-01)*
The CVA has no state axis because CSS pseudo-classes are free in code. They are not free in Figma, where
each must be drawn. Four states over 48 combinations is **192 variants**. How many states we draw is a
design-system decision, not an extraction — raised for step 4.

**A-D-022 · Figma authoring rule — cross the axes that interact, sample the ones that don't.**
*(Owner, 2026-08-03 — resolves A-D-021 / B-O-01)*

Rather than authoring all 192 variant × size × state combinations, group them:

| Group | Axis crossed | Held at default | Count |
| --- | --- | --- | --- |
| States per variant | variant × state | size | 6 × 4 = 24 |
| Size showcase | size | variant, state | 8 |
| | | *(shared default counted once)* | **≈ 31** |

**The principle, stated so it is reusable on every future component:** cross two axes only when they
**interact** — when the appearance of one genuinely depends on the other. Sample the rest.

**Why variant × state must be crossed.** Step 3 found the exceptions that make "implicit" wrong:
`destructive` overrides the focus ring to `ring-destructive/20` (B-O-03); `outline` and `ghost` use a
structurally different hover treatment (`bg-accent` rather than a tint of their own fill); and three
variants carry dark-mode-only state rules. Hover on `secondary` cannot be inferred from hover on
`default`.

**Why size × state need not be.** Size changes geometry only. Hover at `lg` is hover at `sm`, larger —
drawing it eight times documents nothing new.

**This also mirrors the code more honestly than an exhaustive matrix would.** In CVA, variant and size
are the real axes and states are CSS rules applied orthogonally. A full 192-cell grid would assert in
Figma that every combination is a separately designed artefact, which is not what the code says.

**A-D-023 · Authoring shape: Option A — a full 48 component set plus a 24-frame states board.**
*(Owner, 2026-08-03)*

`variant × size` (48) is a **component set**, fully crossed and instantiable. `variant × state` (24, at
default size) is a **documentation board**, not instantiable. States cross with **variant, not size**.

This adds a **second test** alongside A-D-022's interaction test:

> **Cross when the axes interact, OR when a consumer needs to instantiate the combination.
> Sample only when neither applies.**

The two tests disagree about `variant × size` — those axes barely interact, but a designer will place a
`secondary` `lg` button in a mockup, and a sampled set would give them a missing-variant error. Nobody
places a *hover* button in a mockup: states are documentation for whoever implements.

Result: 72 drawn, 48 selectable, **no holes in the library**. Against 192 exhaustive.

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

**A-D-012 · Overflow behaviour is selected by a single `lines` prop.** *(Owner, 2026-08-03)*
`lines={1}` truncates to one line · `lines={n}` clamps to n lines and truncates the remainder ·
`lines="auto"` wraps unbounded. One axis rather than several booleans.

**A-D-013 · The tooltip appears on hover ONLY when the text is actually truncated.** *(Owner, 2026-08-03)*
Applies to any truncated state, single-line or clamped — not to unbounded wrap, where nothing is cut.
**Implementation note:** "only when truncated" cannot be expressed in CSS; it requires measuring
`scrollWidth > clientWidth` (or the clamped equivalent) at runtime and on resize.

**A-D-014 · Button does NOT compose Tooltip. The dependency is recorded, not built.** *(Owner, 2026-08-03)*
Tooltip is its own element and gets its own CDP pass in its turn. **Button therefore keeps its atom
status** (resolving the concern in A-D-011). Until Tooltip exists, the truncation tooltip is a
**documented, deferred dependency** — Button ships truncation without it, and the tooltip is wired when
Tooltip lands. This must not be silently dropped: it is the whole reason truncation is acceptable, since
truncating text with no way to read it is a content-loss bug.

**A-D-015 · Icon-only sizes are unaffected by A-D-011.** *(Owner, 2026-08-03)*
`icon` · `icon-xs` · `icon-sm` · `icon-lg` have no text to truncate or wrap.

**A-D-016 · Button carries the full 6 × 8 matrix through to step 8.** *(Owner, 2026-08-03)*
No reduced set proposed at step 5.

**A-D-010 · Two behaviours exist only in prose, with no counterpart in the source.** *(Step 2)*
(1) Tailwind v4 switched buttons from `cursor: pointer` to `cursor: default`, and shadcn does not
override it — pointer behaviour needs a consumer `@layer base` rule. (2) There is no `loading` prop; the
documented pattern is a `<Spinner />` child carrying `data-icon="inline-start|inline-end"` for spacing,
a convention that appears nowhere in `button.tsx`. Both are invisible to anyone reading only the code.
