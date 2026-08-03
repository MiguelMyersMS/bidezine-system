# Dialog — Step 2: Dissection

**Protocol:** CDP step 2 (Phase A) · **Date:** 2026-08-03 · **Fence:** shadcn + Radix only; v1 closed

> **This document describes what shadcn's Dialog IS, exactly as-is. It contains no judgements,**
> **no proposals, and no comparisons.** Anything evaluative belongs to step 3 (observations) or later.
> Where the source and the prose disagree, both are recorded.

**Tagging:** `[source]` observed in code · `[prose]` stated in shadcn's documentation

## Sources read

| Source | Path |
|---|---|
| Component | `reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/dialog.tsx` |
| Docs | `reference/shadcn-ui/apps/v4/content/docs/components/radix/dialog.mdx` |
| Examples | `examples/radix/dialog-{demo,close-button,no-close-button,scrollable-content,sticky-footer,rtl}.tsx` |
| Primitive | `@radix-ui/react-dialog` — `index.d.ts` (API) and `index.mjs` (behaviour) |

**Backend note** `[source]` `[prose]` — shadcn now ships **three primitive backends** for Dialog:
`aria/` (React Aria), `base/` (Base UI), `radix/`. The vendored registry we adopted
(`new-york-v4/ui/dialog.tsx`) is the **Radix** one; its docs carry `base: radix` in frontmatter.

---

## 1. The part tree

### 1.1 What Dialog actually composes

```
Dialog                        (Radix Root — no DOM)
├── DialogTrigger             (Radix Trigger → <button>)
└── DialogContent             ← composes the next three itself
    ├── DialogPortal          (Radix Portal — no DOM)
    ├── DialogOverlay         (Radix Overlay → <div>)
    └── DialogPrimitive.Content → <div role="dialog">
        ├── {children}
        └── DialogPrimitive.Close   ← inline, not the exported DialogClose
            └── XIcon (lucide-react)  + <span class="sr-only">Close</span>

Exported but never placed by the consumer in the documented composition:
    DialogPortal · DialogOverlay · DialogClose

Layout wrappers (plain <div>, no Radix):
    DialogHeader · DialogFooter
Text parts (Radix, for the ARIA wiring):
    DialogTitle → <h2>   ·   DialogDescription → <p>

External dependency composed inside the component:
    Button   ← ONLY in DialogFooter, only when showCloseButton is true
    XIcon    ← lucide-react, inside DialogContent's close control
```

### 1.2 What Dialog is *used with* but does **not** compose

`[source]` The demo composes `Field`, `FieldGroup`, `Input`, `Label` and `Button` **as children passed
in by the consumer**. `dialog.tsx` imports **only** `Button`, `XIcon`, `cn`, and the Radix primitive.

This distinction is load-bearing for the atomic classification: a "modal form" is Dialog **used with**
a form, not Dialog **made of** one.

`[source]` The demo also places `<form>` *between* `<Dialog>` and `<DialogTrigger>/<DialogContent>` —
the form wraps the trigger and the portalled content, not the content alone.

### 1.3 Documented composition vs exported surface

`[prose]` The docs give this composition:

```
Dialog
├── DialogTrigger
└── DialogContent
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    └── DialogFooter
```

`[source]` The module exports **ten** symbols: `Dialog`, `DialogClose`, `DialogContent`,
`DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`,
`DialogTrigger`. Three of them (`DialogPortal`, `DialogOverlay`, `DialogClose`) do not appear in the
documented composition, because `DialogContent` renders Portal and Overlay internally.

### 1.4 First-pass atomic classification

| Part | Renders DOM? | Proposed level | Reason |
|---|---|---|---|
| `Dialog` (Root) | **No** | *(none — behavioural provider)* | Pure state/context. Renders nothing. |
| `DialogPortal` | **No** | *(none — structural)* | Relocates children in the DOM tree. No visual output. |
| `DialogTrigger` | Yes — `<button>` | **Atom** | Single element, no composition. **Carries no styling at all** in shadcn's wrapper. |
| `DialogClose` (exported) | Yes — `<button>` | **Atom** | Same: single element, **no styling** in the wrapper. |
| `DialogOverlay` | Yes — `<div>` | **Atom** | Single element, purely presentational + animated. |
| `DialogTitle` | Yes — `<h2>` | **Atom** | Single styled text element. |
| `DialogDescription` | Yes — `<p>` | **Atom** | Single styled text element. |
| `DialogHeader` | Yes — `<div>` | **Molecule** (layout) | Layout-only wrapper; exists to arrange Title + Description. |
| `DialogFooter` | Yes — `<div>` | **Molecule** (layout) | Layout-only wrapper; **may compose a Button**. |
| `DialogContent` | Yes — `<div>` | **Organism** | Composes Portal + Overlay + Content + a close control (icon + sr-only label). The only genuinely composite part. |

**Two classification facts to carry forward** (not judgements — structural observations):

1. `Dialog` and `DialogPortal` render **no DOM at all**. Atomic Design's atom/molecule/organism
   taxonomy describes *visual* composition and has no native category for a behavioural provider.
   They cannot be drawn in Figma, and they cannot be classified by the taxonomy as written.
2. `DialogHeader` and `DialogFooter` are **layout-only** — they hold no content of their own and their
   entire definition is flex classes. Whether a layout wrapper is a "molecule" is a taxonomy question,
   not an observation.

---

## 2. Structure inventory

Measurements are the Tailwind classes as written, with their computed values.

### `DialogOverlay`
`fixed inset-0 z-50` · fill `bg-black/50` (a literal, **not** a token) · animated in/out via
`data-[state]` + `fade-in-0`/`fade-out-0`.

### `DialogContent`
| Property | Class | Value |
|---|---|---|
| Position | `fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]` | centred |
| Stack | `z-50` | above overlay |
| Display | `grid gap-4` | 16px row gap |
| Width | `w-full max-w-[calc(100%-2rem)] sm:max-w-lg` | 32rem / 512px at ≥sm, else viewport − 32px |
| Padding | `p-6` | 24px |
| Surface | `bg-background`, `border`, `rounded-lg`, `shadow-lg` | |
| Motion | `duration-200`, `zoom-in-95`/`zoom-out-95` + fade | |
| Focus | `outline-none` | outline suppressed on the container |

**Close control** (inside `DialogContent`, rendered when `showCloseButton`, default **`true`**):
`absolute top-4 right-4` · `rounded-xs` · `opacity-70` → `hover:opacity-100` ·
`focus:ring-2 focus:ring-ring focus:ring-offset-2` · `ring-offset-background` ·
`data-[state=open]:bg-accent data-[state=open]:text-muted-foreground` ·
icon forced to `size-4` · `<span class="sr-only">Close</span>`.

### `DialogHeader`
`flex flex-col gap-2 text-center sm:text-left` — centred on mobile, left-aligned from `sm` up.

### `DialogFooter`
`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` — **reversed** column on mobile (primary
action ends up on top), row aligned right from `sm` up.
Prop `showCloseButton`, default **`false`**, renders `<DialogClose asChild><Button variant="outline">Close</Button></DialogClose>`.

### `DialogTitle`
`text-lg leading-none font-semibold` → 18px, line-height 1.

### `DialogDescription`
`text-sm text-muted-foreground` → 14px.

### `DialogTrigger` / `DialogClose` (exported)
**No classes.** Pure behavioural pass-throughs carrying only `data-slot`.

### Slot attributes `[source]`
Every part emits a `data-slot`: `dialog`, `dialog-trigger`, `dialog-portal`, `dialog-close`,
`dialog-overlay`, `dialog-content`, `dialog-header`, `dialog-footer`, `dialog-title`,
`dialog-description`. `DialogContent` passes `data-slot="dialog-portal"` to `DialogPortal`, which does
not forward it to any DOM node.

---

## 3. State inventory

| State | Where it appears | Visual difference |
|---|---|---|
| `data-state="open"` / `"closed"` | Overlay, Content, Trigger | Drives all enter/exit animation |
| open — Overlay | `fade-in-0` | Scrim fades in |
| closed — Overlay | `fade-out-0` | Scrim fades out |
| open — Content | `fade-in-0 zoom-in-95` | Scales from 95% |
| closed — Content | `fade-out-0 zoom-out-95` | Scales to 95% |
| Close control — rest | `opacity-70` | Dimmed |
| Close control — hover | `opacity-100` | Full |
| Close control — focus | `ring-2 ring-ring ring-offset-2` | Ring |
| Close control — disabled | `pointer-events-none` | No visual change |
| Close control — `data-[state=open]` | `bg-accent text-muted-foreground` | Tinted |
| Trigger — `aria-expanded` | `true` / `false` | **No visual difference defined** |

**Facts about this inventory:**
- The **only** part with hover/focus/disabled styling is the close control inside `DialogContent`.
- `DialogTrigger` and the exported `DialogClose` define **no states** — they inherit whatever element
  is slotted into them via `asChild`.
- Responsive breakpoint `sm` changes layout in three places: Content width, Header alignment, Footer
  direction and justification.
- There is **no** size variant, no CVA config, and no variant matrix anywhere in `dialog.tsx`.

---

## 4. Behaviour inventory

Figma cannot represent any of this. Documented from `@radix-ui/react-dialog`.

### 4.1 Root API `[source]`
`open` · `defaultOpen` · `onOpenChange(open)` · `modal` (default **`true`**) — supports both
controlled and uncontrolled use.

### 4.2 Focus
- **Trap:** `trapFocus` is set to the `modal` context value — trapped when modal, **not trapped when
  `modal={false}`**. Focus "cannot escape via keyboard, pointer, or programmatic focus."
- `onOpenAutoFocus` — fires on open; **preventable**.
- `onCloseAutoFocus` — fires on close; **preventable**. Focus returns to the trigger by default.
- Uses `useFocusGuards()` — sentinel nodes so tabbing cannot leave the layer.

### 4.3 Dismissal
Built on `DismissableLayer`, exposing:
`onEscapeKeyDown` · `onPointerDownOutside` · `onFocusOutside` · `onInteractOutside` — each preventable.
`disableOutsidePointerEvents` follows `modal`.

### 4.4 Layering and inertness
- **Portal** to `document.body` by default; `container` prop retargets it.
- **Scroll lock** via `react-remove-scroll` (`RemoveScroll`, with `allowPinchZoom`) — modal only.
- **Sibling inertness** via `hideOthers(content)` from the `aria-hidden` package, which applies
  `aria-hidden` to everything outside the content.

### 4.5 ARIA `[source]`
| Element | Attributes |
|---|---|
| Content | `role="dialog"`, `aria-labelledby` → title id **only if a Title is present**, `aria-describedby` → description id **only if a Description is present** |
| Trigger | `aria-haspopup="dialog"`, `aria-expanded={open}`, `aria-controls={contentId}` when open, `type="button"` |
| Close | `type="button"` |

> **`aria-modal` is never set.** Verified: zero occurrences in the primitive's source. Inertness is
> achieved by `aria-hidden` on siblings via `hideOthers`, not by the `aria-modal` attribute.

### 4.6 Mounting
`forceMount` on Portal, Overlay and Content keeps them mounted for external animation control.
`WarningProvider` is present but marked `@deprecated — Noop`.

---

## 5. Documented usage variations `[prose]`

| Variation | Mechanism |
|---|---|
| Custom close button | Consumer supplies their own `DialogClose` |
| No close button | `showCloseButton={false}` on `DialogContent` |
| Sticky footer | Consumer classes; footer stays while content scrolls |
| Scrollable content | Consumer classes; header stays in view |
| RTL | Handled by a global RTL configuration, not by the component |

None of these are variants in code — all are consumer composition or a single boolean.

---

## 6. Completeness check

Every exported symbol is accounted for (§1.3, all ten). Every class string in `dialog.tsx` is
transcribed (§2). Every `data-state`/`aria-*` in the wrapper and primitive is listed (§3, §4.5). The
one external component composed (`Button`) and the one icon (`XIcon`) are named (§1.1).

**Not covered, and deliberately so:** the `aria/` and `base/` backends were not dissected — the
adopted registry is the Radix one. Recorded in `PARKING-LOT.md`.
