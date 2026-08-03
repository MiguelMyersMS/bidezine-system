# Dialog — Step 7: Risk Review

**Protocol:** CDP step 7 (Phase A) · **Date:** 2026-08-03
**Inputs:** steps 3–6, with R-07…R-13 ratified by the owner 2026-08-03.

> Risks, concerns, gaps, issues and problems in what we are about to build. Accessibility is a named
> lens here (CDP §2). Nothing is fixed in this step — problems are surfaced, not solved.

---

## 1. 🚨 The blocking finding: R-09 and R-11 are not value-preserving

**R-02 says tokenisation preserves the rendered result and changes are separate explicit decisions.
Two ratified recommendations quietly break that rule.**

| | Current (shadcn) | After adopting v1 | Effect |
|---|---|---|---|
| **R-09** elevation | `shadow-lg` — fixed black alpha, identical in both themes | v1's `elevation().overlay` — `0 8px 40px` + `0 2px 8px`, theme-aware | **The dialog's shadow visibly changes.** |
| **R-11** radius | `rounded-lg` = **10px** | v1's dialog uses `RADIUS.container` = **18px** | **Nearly 2× on the most visible corner in the product.** |

Neither was presented as a change at step 6 — I framed both as "adopt v1's answer", which hid a visual
consequence inside what looked like a naming decision. That is precisely the failure mode R-02 exists
to prevent, and I walked into it.

**This needs an explicit decision before step 8**, and there are two clean ways to take it:

- **(a)** Ship the tokens value-preserving (dialog stays 10px radius, shadcn's shadow) and treat the
  move to 18px / v1 elevation as a **separate, visible change** afterwards.
- **(b)** Decide now that the v2 dialog adopts v1's look, and record it as a deliberate visual change
  rather than a tokenisation side effect.

Either is defensible. Doing it by accident is not.

---

## 2. Accessibility

Measured against the current implementation, using our own token values.

### A-1 · 🚨 The close icon fails non-text contrast — **measured**

`muted-foreground` `#737373` at `opacity-70` over `background` `#ffffff` composites to `#9d9d9d`.

| | Ratio | WCAG 1.4.11 requires | Result |
|---|---|---|---|
| Close icon, rest | **2.71 : 1** | 3.0 : 1 | ❌ **FAIL** |
| Close icon, hover | 4.74 : 1 | 3.0 : 1 | ✅ pass |

The control only becomes conformant **on hover** — which keyboard and touch users never trigger. The
`opacity-70` rest state (O-09) is the direct cause.

### A-2 · 🚨 The close control is likely below minimum target size

`DialogPrimitive.Close` carries no width, height or padding classes — only positioning, radius and
opacity. Its hit area is therefore its content: a `size-4` (**16 × 16**) icon plus a visually-hidden
label.

WCAG 2.2 AA **2.5.8 Target Size (Minimum)** requires **24 × 24** CSS px. 16 × 16 does not meet it, and
there is no spacing exception that rescues it here.

**v1 already solves this** — its close button is **32 × 32** (H-6). Another case where v1's more
finished product is also the more accessible one.

### A-3 · The disabled close control has no visual (C-02)

`disabled:pointer-events-none` with no accompanying visual change. A control that looks interactive and
silently is not is a usability failure, not a polish item.

### A-4 · No reduced-motion handling (H-3)

shadcn has none at all. The dialog zooms and fades regardless of `prefers-reduced-motion`. Not a strict
AA failure for a short one-shot transition, but it is a real gap, and v1 handles it.

### A-5 · Accessible name can be silently absent (O-26)

`aria-labelledby` wires only if a Title is present. Omit it and the dialog has no accessible name —
**WCAG 4.1.2**. R-10 (required `title`) makes this structurally impossible, which is the right shape of
fix: prevention, not documentation.

### A-6 · Description text passes, but with almost no margin

`muted-foreground` on `background` is **4.74 : 1** against a 4.5 : 1 requirement. Any future darkening
of the surface or lightening of that token breaks conformance. Worth a contrast gate in the token
pipeline rather than trusting review.

---

## 3. Breaking-change and divergence risk

**B-1 · Adopting v1's answers moves us off shadcn's defaults.** R-07 (z-scale), R-08 (motion), R-09
(elevation) all redefine values that **borrowed shadcn components reference by name**. Redefining
`shadow-lg` does not only change Dialog — it changes every component we later pull in that uses it.
The blast radius of a token change grows with every component adopted, and it is smallest right now.

**B-2 · R-10 diverges from shadcn's public API.** Making `title` required is a real improvement and a
real divergence: any future upstream comparison gets harder, and the divergence must be documented or
it will read as a bug.

**B-3 · C-01 removes a prop.** Low cost today (no consumers), non-zero later.

**B-4 · The v1↔v2 naming traps (D-022) will bite.** `SPACE[5]`=24 vs `space-5`=20, and shifted
breakpoint names. The mapping table is a mitigation, not a fix — the only real fix would be renaming
one side, which we have decided against.

---

## 4. Generalisation risk

**G-1 · Scales derived from one component.** R-01 limited us to `[observed]` and `[extracted]` values,
which helps — but the *shape* of the spacing and type ramps is still being set by a single dialog. The
second and third components will test whether they hold.

**G-2 · The `provider` tier exists only in a decision log.** A new taxonomy tier that is not in
CLAUDE.md, the CDP, or any template will be ignored by the next session or the next machine.

**G-3 · We are bulk-adding tokens, which the token pipeline forbids.** `TOKEN-PIPELINE.md` says add a
token *when a shipping component needs one, never in bulk*. Step 5 proposes ~46 at once and step 6 adds
more. The justification is real — Dialog demonstrably needs all nine categories, and R-01 kept the steps
honest — but **the rule as written does not permit this**, and either the rule or the practice needs
adjusting. Leaving the contradiction unresolved means the rule stops meaning anything.

---

## 5. Tooling and pipeline risk

**P-1 · Shadows cannot be Figma Variables** (T3). They ship as effect styles and do not round-trip
through the emitter. Figma and code can drift with nothing to catch it.

**P-2 · Easing has no Figma representation at all** (T3). Same drift exposure, no mitigation available.

**P-3 · The DTCG emitter does not yet handle the new types.** `fontWeight` support was added and then
reverted with `12b997d`; `duration`, `shadow` and `z-index` types have never existed in it. The emitter
throws on an unknown `$type` — by design — so step 8 must extend it before any of these tokens can be
generated.

**P-4 · No automated check that Figma matches the DTCG source.** Everything so far has relied on my
pushing both from one payload. Nothing detects a hand-edit in Figma.

---

## 6. Risks accepted without mitigation

Stated plainly rather than buried:

- The typography semantic layer (R-13) will roughly double the type token surface. Accepted as the cost
  of keeping v1's design thinking.
- Contamination residue: my steps 2–5 were a second look at a component I had already built. Declared
  in `00-scope.md` §3.2; no mitigation beyond having re-read the sources in full.
- v1 has **no dialog spec** — the comparison was against implementation only, so any Figma-verified
  intent behind v1's dialog is unknown to us.

---

## 7. Must be resolved before step 8

| # | Item | Why blocking |
|---|---|---|
| 1 | **§1 — R-09 / R-11 value-preservation** | Determines what step 8 actually renders |
| 2 | **A-1 close icon contrast** | Measured WCAG failure; changes the rest-state design |
| 3 | **A-2 close target size** | Measured WCAG failure; changes the atom's dimensions (C-06) |
| 4 | **G-3 bulk-token contradiction** | The token rule and the plan currently disagree |
| 5 | **P-3 emitter extension** | Nothing can be generated until it handles the new types |

Everything else can proceed in parallel with step 8.
