# Atoms Pass 1 — Step 5: Adjustments

**Components:** `Button` · `Input` · `Label`
**Protocol:** CDP step 5 · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> **Part 1 — tokenisation** (value-preserving, R-02). **Part 2 — changes** (each alters the result).
> Kept strictly apart. Nothing is built here; step 8 builds.

---

# Part 1 — Tokenisation

The nine foundation scales were built before this step (commits `24abef1`, `adc9796`), so these three
components now resolve almost entirely through tokens.

## 1.1 The named focus treatment — **the one genuinely new primitive**

`border-ring` + `ring-[3px] ring-ring/50` appears **verbatim** in Button and Input (X-O-03) and will
recur in every focusable control. Named rather than repeated:

| Part | Token |
|---|---|
| Border colour on focus | `ring` |
| Halo colour | **`focus-ring`** — new: `ring` at 50% |
| Halo width | `stroke-3` (3px) |
| Offset (where used) | `stroke-2` (2px) |

**Why a token and not just an opacity:** Figma cannot express "this variable at 50%". A halo drawn from
`ring` with a manual 50% opacity would be a literal that silently stops tracking `ring`. The composited
value has to exist as its own variable or the two media cannot agree.

## 1.2 Coverage after the foundation build

| | Button | Input | Label |
|---|---|---|---|
| Fill / text / border | ✅ tokens | ✅ | ✅ |
| Heights, padding, gap | ✅ `space-*` | ✅ | ✅ |
| Type size / weight / leading | ✅ | ✅ | ✅ |
| Radius | ✅ `radius-md` | ✅ | n/a |
| Focus | ✅ (§1.1) | ✅ | n/a |
| **Remaining literal** | icon sizes (16/12) | the `file:` 28px height | — |

**Icon sizing is deliberately still untokenised** — one component using `size-4` is a sample of one
(R-01). It gets a scale when a second consumer disagrees with it.

---

# Part 2 — Changes

### C-A01 · Button defaults to `type="button"` — *Q3, A-D-019*

Diverges from shadcn **and** from the HTML default. A Cancel button in a form currently submits it;
shadcn's own dialog demo has to remember `type="button"`, which is the evidence the trap is real.
Submitting becomes explicit.

### C-A02 · Remove the `file:` styling from Input — *Q5, I-O-04*

Six rules for a file-picker nobody has asked for, carrying a 28px height that matches nothing else,
invisible unless `type="file"`. When a file input is wanted it gets its own pass.

### C-A03 · Label drops Radix — *Q6, L-O-03, A-D-008*

Radix Label's whole contribution is preventing double-click selection; `select-none` already does that
in CSS. The label→control association is the native `htmlFor`. A native `<label>` is equivalent, minus
a dependency.

### C-A04 · Button's destructive text uses a token, and `destructive-foreground` is redefined — *A-D-018*

`variant=destructive` hard-codes `text-white` — the only raw colour keyword in the three components.

The reason it exists is now clear: **shadcn's `--destructive-foreground` dark value is a red**
(`oklch 0.58 0.22 27`), i.e. a colour for destructive text on a *neutral* surface. Using it on a red
fill would have produced red-on-red, so the author bypassed the token. **The literal is a symptom, not
the disease.**

Fixed at the source: `destructive-foreground` is now near-white in **both** modes — text *on* a
destructive fill, which stays red in both themes. Button then uses the token.

### C-A05 · Button overflow model — *A-D-011 … A-D-016*

`lines={1}` truncates · `lines={n}` clamps and truncates · `lines="auto"` wraps unbounded.

**Structural consequences**, all required for it to work at all:

- `shrink-0` is **removed**, and the text child gains `min-w-0` — without both, a flex item still
  refuses to shrink below its content.
- **Fixed heights become minimum heights.** `h-6/8/9/10` → `min-h-*` with real vertical padding.
  Wrapped text cannot live in a fixed height. This rewrites how all eight sizes are implemented.
- Truncated buttons want a tooltip (A-D-013), which **cannot be expressed in CSS** — it needs
  `scrollWidth > clientWidth` measured at runtime and on resize. **Deferred until Tooltip exists**
  (A-D-014), and flagged as must-not-be-dropped: truncating text with no way to read it is content loss.

### C-A06 · Not changed, and recorded so it is not "fixed" later

`link` **keeps** button geometry (Q2). It looks wrong — an underline in a 40px box — but that geometry
is the hit target, and WCAG 2.5.8 wants 24 × 24. Stripping it would trade an accessibility property for
a cosmetic one.

---

# Part 3 — Token impact

| Token | Change |
|---|---|
| `focus-ring` | **New.** `ring` at 50%, both modes. |
| `destructive-foreground` | **Redefined** — near-white in both modes (C-A04). Nothing consumes it yet, so the blast radius is zero *today*. |

Everything else these components need already exists after the foundation build.

---

# Part 4 — Contamination

All Part 2 changes derive from step 3 observations of shadcn's source alone. `focus-ring` is a
composite of an existing token. **Nothing here is `[possibly v1-influenced]`** — I have not read v1's
Button, TextInput or any Label.
