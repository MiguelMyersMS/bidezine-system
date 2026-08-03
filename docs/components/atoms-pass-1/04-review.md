# Atoms Pass 1 — Step 4: Review & Plan

**Components:** `Button` · `Input` · `Label`
**Protocol:** CDP step 4 · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> Reviews step 3's observations, answers the questions it raised, and plans steps 5–8.
> **Recommendations are for ratification, not execution.** Step 5 proposes; step 8 builds.

**Step 3 signed off by the owner, 2026-08-03.**

---

## 1. Twenty-five observations, five themes

| Theme | Observations | The question underneath |
|---|---|---|
| **A · Values that escape the token system** | B-O-02 | Is a raw colour keyword ever acceptable? |
| **B · Silent failure modes** | B-O-09, L-O-05, X-O-02, X-O-07 | Which failures should be structurally impossible rather than documented? |
| **C · Inconsistency between siblings** | X-O-01, X-O-03, X-O-05, B-O-03, I-O-01 | Which differences are meaningful, and which are just drift? |
| **D · Things hiding inside components** | I-O-04, L-O-04, B-O-13 | What belongs to this component and what is squatting in it? |
| **E · What Figma cannot hold** | I-O-02, B-O-01 | Where do the two media stop being able to agree? |

Themes **B** and **C** are the ones that will change the components. **A** is one line. **E** is a
limitation to be documented, not solved.

---

## 2. The eight questions

### Q1 — How many Button states do we draw? — **resolved**

Four: `default` · `hover` · `focus-visible` · `disabled`, crossed with variant (A-D-022/A-D-023).

Two notes:

- **shadcn has no pressed/active state** (B-O-07). Adding one is a **change**, not an extraction, so it
  belongs in step 5 and not in the drawn set unless ratified there.
- **`aria-invalid` is deliberately excluded from Button's state set.** Per B-O-13 its presence on a
  Button is questionable; drawing it would legitimise it before we have decided it belongs. Input keeps
  `invalid` — validity is genuinely an input's business.

### Q2 — Should `link` keep button geometry? — **recommend YES, reversing the obvious read**

`link` at `size=lg` is 40px tall with 24px side padding (B-O-04), which *looks* wrong: an underline
floating in a large empty box.

But that geometry is a **hit target**, and WCAG 2.2 AA 2.5.8 wants at least 24 × 24. Stripping the
padding to make it "look like a link" would shrink the target — trading a real accessibility property
for a cosmetic one. The same reasoning that made us enlarge the Dialog close control (D-029) applies
here in reverse.

**Recommendation:** keep the geometry, and record *why*, so nobody "fixes" it later.

### Q3 — Is `type="submit"` by default acceptable? — **recommend NO; default to `type="button"`**

A Cancel button inside a dialog form submits it (B-O-09). shadcn's own demo remembers `type="button"` —
which is the evidence: if the authors must remember it in their own example, every consumer must too.

This diverges from both shadcn and the HTML default, and that is the cost. But the failure is silent,
data-destroying, and invisible in review. Most design systems make this same divergence.

**Recommendation:** default `type="button"`; submitting requires saying so.

### Q4 — Does Input need breakpoint variants in Figma? — **recommend NO, and document the hole**

`text-base md:text-sm` is 16px below `md`, 14px above — an iOS zoom defence (I-O-02).

Drawing breakpoint variants doubles every text-bearing component and Figma has no real responsive
model. **Recommendation:** Figma documents the `md`-and-up rendering (14px), and the mobile 16px is
recorded as a behavioural note in the spec.

**This is the first knowing incompleteness in the Figma library**, and it should be labelled as such on
the component rather than left for someone to discover.

### Q5 — Is the `file:` styling part of Input? — **recommend removing it**

Six `file:` rules styling the file-picker button, with a 28px height matching nothing else in the
system, invisible unless `type="file"` (I-O-04).

We have no file-input requirement. Under `TOKEN-PIPELINE.md`'s demand-driven rule, this is styling for a
component nobody has asked for, carried in a class string where it cannot be found.

**Recommendation:** remove it from our Input. When a file input is needed, it gets its own pass.

### Q6 — Does Label need Radix? — **recommend NO**

Radix Label's entire contribution is preventing double-click text selection, and `select-none` in the
class list already prevents selection outright (L-O-03, A-D-008).

ADR-006 says borrow behaviour from Radix. Here **there is no behaviour to borrow** — the association is
the native `<label htmlFor>`. Keeping the dependency for a redundant handler is cost without benefit.

**Recommendation:** a native `<label>`. Verified against the primitive's source, not assumed.
**Risk:** a divergence from shadcn that must be documented, or it reads as an oversight.

### Q7 — Where does required/optional live? — **recommend deferring to Field**

Required-ness is a property of the **control**, surfaced by the **label** (L-O-05, X-O-07). Deciding it
inside the atoms pass would be deciding a Field concern without Field in front of us.

**Recommendation:** defer to Field's pass; record that Label may need an affordance slot for it, which
L-O-04's unexplained `gap-2` flex row may already be intended to serve.

### Q8 — Should the shared focus treatment be named? — **recommend YES**

`border-ring` + `ring-[3px] ring-ring/50` appears verbatim in Button and Input (X-O-03) and will recur
in every focusable control.

**Recommendation:** name it in step 5's token work — a ring colour, ring width and offset — so the next
component inherits it rather than copying it. It is the single strongest candidate in this pass for
something that should exist once.

---

## 3. Feasibility — shadcn ideas in this pass

| Idea | Assessment |
|---|---|
| CVA variant structure | **Adopt.** It is the real extraction here, and it maps cleanly onto Figma variant properties. |
| `data-slot` / `asChild` | **Adopt** — already ratified (R-06). |
| Embedding a sub-component's styling in a class string (`file:`) | **Reject** (Q5). It hides a component inside another. |
| Radix Label | **Reject** (Q6). No behaviour to borrow. |
| HTML `type` default | **Reject** (Q3). Silent failure. |
| Responsive type size | **Adopt the behaviour**, accept it cannot live in Figma (Q4). |
| Variant-specific focus rings (`destructive`) | **Keep, but review at step 5** — B-O-03 makes it the only variant with its own focus colour, which may be intentional (danger) or drift. |

---

## 4. Plan for steps 5–8

| Step | Scope |
|---|---|
| **5 · Adjustments** | The named focus treatment (Q8) and its tokens. Change proposals for Q3, Q5, Q6, plus whether to add a pressed state (Q1). Full token impact for all three components. Rendered proposal board per D-016. |
| **6 · Compare to v1** | v1's `Button.tsx` + `button.spec.md` + `button-dark.spec.md`; `TextInput.tsx` vs `InputTrigger.tsx` — **which is Input's real counterpart is an open question** (parking lot), and it determines how contaminated Input's comparison is (A-D-004). Label likely a two-way comparison (A-D-005). |
| **7 · Risks** | Accessibility lens: focus-ring contrast at 3:1, target sizes across all eight Button sizes, the `xs` size at 24px height against 2.5.8, disabled contrast. Divergence risk from Q3/Q6. |
| **8 · Build** | Foundation scales as variables + effect styles, then the 48-variant Button set + 24-frame states board, Input, Label. |

---

## 5. Deliberately not decided here

- No concrete token values — step 5.
- No decision on `destructive`'s literal `text-white` beyond "it is theme A" — the fix is step 5.
- Nothing about Field, despite Q7 pointing at it.
- No v1 comparison of any kind.
