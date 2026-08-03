# Atoms Pass 1 — Step 2: Dissection

**Components:** `Button` · `Input` · `Label`
**Protocol:** CDP step 2 · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> What these three **are**, exactly as-is. No judgements, no proposals, no v1.
> `[source]` observed in code · `[prose]` stated in shadcn's docs

**Sources:** `registry/new-york-v4/ui/{button,input,label}.tsx` ·
`content/docs/components/radix/{button,input,label}.mdx` · `@radix-ui/react-label` · `radix-ui` `Slot`.

---

## 0. A correction carried in from pre-protocol work

In the reverted `src/ui/label.tsx` I wrote that Radix Label *"wires the label→control association and
forwards clicks to the control."* **That is wrong.** The association is the native `htmlFor` attribute
on a native `<label>`; the browser does it. Radix adds one thing only — see §3.3.

---

# 1. Button

## 1.1 Structure

One element. `<button>` by default, or **any element** via `asChild` → Radix `Slot.Root`.
Emits `data-slot="button"`, `data-variant`, `data-size`.

**Base classes**, decomposed:

| Concern | Classes |
|---|---|
| Layout | `inline-flex items-center justify-center gap-2` |
| Flex behaviour | **`shrink-0`** — refuses to shrink in a flex row |
| Type | `text-sm font-medium` |
| Overflow | **`whitespace-nowrap`** |
| Shape | `rounded-md` |
| Motion | `transition-all` |
| Focus | `outline-none` then `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| Disabled | `disabled:pointer-events-none disabled:opacity-50` |
| Invalid | `aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` |
| Icons | `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4` |

## 1.2 The variant matrix — 6 × 8 = 48 combinations

| variant | Resting | Hover | Notes |
|---|---|---|---|
| `default` | `bg-primary text-primary-foreground` | `bg-primary/90` | |
| `destructive` | `bg-destructive text-white` | `bg-destructive/90` | text is **literal `white`**, not a token; own focus ring `ring-destructive/20`; `dark:bg-destructive/60` |
| `outline` | `border bg-background shadow-xs` | `bg-accent text-accent-foreground` | `dark:border-input dark:bg-input/30`, `dark:hover:bg-input/50` |
| `secondary` | `bg-secondary text-secondary-foreground` | `bg-secondary/80` | |
| `ghost` | *(no fill)* | `bg-accent text-accent-foreground` | `dark:hover:bg-accent/50` |
| `link` | `text-primary underline-offset-4` | `underline` | no fill, no padding change |

| size | Height | Padding-x | Gap | Type | Icon | With-icon padding |
|---|---|---|---|---|---|---|
| `xs` | 24 | 8 | 4 | `text-xs` 12 | **12** | `px-1.5` (6) |
| `sm` | 32 | 12 | 6 | 14 | 16 | `px-2.5` (10) |
| `default` | 36 | 16 | 8 | 14 | 16 | `px-3` (12) |
| `lg` | 40 | 24 | 8 | 14 | 16 | `px-4` (16) |
| `icon` | 36 × 36 | — | — | — | 16 | — |
| `icon-xs` | 24 × 24 | — | — | — | **12** | — |
| `icon-sm` | 32 × 32 | — | — | — | 16 | — |
| `icon-lg` | 40 × 40 | — | — | — | 16 | — |

**`has-[>svg]:px-*`** — padding shrinks when a direct SVG child is present, on the four text sizes only.

## 1.3 States

`hover` (per variant) · `focus-visible` (border + 3px ring) · `disabled` · `aria-invalid`.
There is **no** pressed/active state and **no** loading state in the CVA.

## 1.4 Behaviour

- `asChild` → Radix `Slot.Root` merges props and refs onto the child element.
- Otherwise a plain native `<button>`; no type default is set, so it is `type="submit"` inside a form.
- **`[prose]` Cursor:** Tailwind v4 switched buttons from `cursor: pointer` to `cursor: default`, and
  shadcn does not override it. Pointer behaviour requires the consumer to add a `@layer base` rule, or
  `npx shadcn init --pointer`. **Not visible in the component source at all.**
- **`[prose]` Loading:** there is no `loading` prop. The documented pattern is to render a `<Spinner />`
  *child* carrying `data-icon="inline-start"` or `"inline-end"` for spacing. That data-attribute
  convention appears nowhere in `button.tsx`.
- **`[prose]` Rounded:** `rounded-full` is applied by the consumer via `className`, not a variant.

---

# 2. Input

## 2.1 Structure

A native `<input>`. **No Radix primitive.** Emits `data-slot="input"`.

| Concern | Classes |
|---|---|
| Box | `h-9 w-full **min-w-0** rounded-md px-3 py-1` |
| Surface | `border border-input bg-transparent shadow-xs` · `dark:bg-input/30` |
| Type | `text-base md:text-sm` — **16 on mobile, 14 from `md` up** |
| Placeholder | `placeholder:text-muted-foreground` |
| Selection | `selection:bg-primary selection:text-primary-foreground` |
| File input | `file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground` |
| Motion | `transition-[color,box-shadow]` — deliberately *not* `transition-all` |
| Focus | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` |
| Disabled | `disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50` |
| Invalid | `aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` |

**The `text-base md:text-sm` pair is a deliberate iOS defence** — Safari zooms the viewport when a
focused input's type is under 16px.

## 2.2 States

`focus-visible` · `disabled` · `aria-invalid`. **No hover state.** No `hasValue` distinction — a filled
input is styled identically to an empty one; only the text colour differs, via the `placeholder:`
pseudo-element.

## 2.3 Behaviour

None beyond the native element. No Radix, no JavaScript, no controlled/uncontrolled logic —
`Input` is a styled pass-through of every native prop.

## 2.4 `[prose]` documented usages

Basic · Field · Field Group · Disabled · Invalid · **File** · Inline · Grid · **Required** · Badge ·
Input Group · Button Group · Form · RTL. All composition or native attributes; none is a component variant.

---

# 3. Label

## 3.1 Structure

Radix `Label.Root` → a native `<label>`. Emits `data-slot="label"`.

`flex items-center gap-2` · `text-sm leading-none font-medium` · `select-none`

## 3.2 States

Two, both **inherited from an ancestor or sibling**, never its own:

- `group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50` — reacts to a
  wrapper marked disabled.
- `peer-disabled:cursor-not-allowed peer-disabled:opacity-50` — reacts to a disabled sibling input.

Label has **no state of its own at all.**

## 3.3 Behaviour — smaller than it appears

Radix Label's **entire** implementation is one handler: `onMouseDown` → if `event.detail > 1`,
`preventDefault()`. That is it. It stops a double-click from selecting the label's text.

Everything else — clicking the label focusing the control, the accessible-name association — is the
**native `<label htmlFor>`**, not Radix.

Note `select-none` is *also* applied in the class list, which already prevents selection by CSS.

---

# 4. Cross-cutting

## 4.1 Text overflow — truncation and wrapping

*(Lens requested by the owner: v1 specifies truncate-vs-wrap behaviour on text elements.)*

| | Wraps? | Truncates? | Can shrink? | Result with a long string |
|---|---|---|---|---|
| **Button** | **No** — `whitespace-nowrap` | **No** — no `overflow-hidden`, no `text-ellipsis` | **No** — `shrink-0` | The button **grows**, and in a constrained row it **overflows** rather than clipping. |
| **Input** | n/a — single-line native | Native clipping, scrolls horizontally | **Yes** — `min-w-0` | Degrades gracefully. |
| **Label** | **Yes** — default, no `nowrap` | **No** | Yes | Wraps to multiple lines — **at `leading-none`, so line boxes are exactly the font size.** |

**Two facts follow, stated without judgement:**

1. **Button has no truncation strategy.** `whitespace-nowrap` + `shrink-0` + no overflow rule means the
   only outcome for a long label is overflow.
2. **Label wraps at `line-height: 1`.** A wrapped label's lines have no leading between them.

**Input is the only one of the three that carries `min-w-0`** — it is the only one able to shrink
inside a flex parent.

## 4.2 Shared conventions

| | Button | Input | Label |
|---|---|---|---|
| `data-slot` | ✅ + `data-variant`, `data-size` | ✅ | ✅ |
| Focus ring | `border-ring` + `ring-[3px] ring-ring/50` | identical | none |
| Disabled mechanism | own `:disabled` | own `:disabled` | **inherited** — `peer-`/`group-` |
| `aria-invalid` styling | ✅ | ✅ | ❌ |
| Radix | `Slot` (only for `asChild`) | none | `Label` |
| Transition | `transition-all` | `transition-[color,box-shadow]` | none |

**The focus-ring treatment is identical in Button and Input** — a 3px `ring-ring/50` plus a
`border-ring` swap. It is the one visual convention shared verbatim across these components.

## 4.3 Atomic classification

| Component | Level | Reason |
|---|---|---|
| `Button` | **Atom** | One element, no composition. Icons are consumer children, not parts. |
| `Input` | **Atom** | One native element. |
| `Label` | **Atom** | One native element. |

All three are leaves. None composes another component — which is what allowed them to share this pass.

## 4.4 Completeness check

Every class string in all three files is transcribed. Every `data-*` and `aria-*` is listed. Both
Radix primitives are described from their own source. Documented behaviour with no source counterpart
(cursor, spinner, rounded) is tagged `[prose]`.

**Not covered:** the `aria/` and `base/` backends; `button-group` and `input-group`, which are separate
components; `Spinner`, referenced by Button's loading pattern but not part of Button.
