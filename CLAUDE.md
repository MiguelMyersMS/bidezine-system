# @bidezine/system — AI Context

## The one rule

> **`reference/shadcn-ui/` is the ONLY design source this project may consult.**

No other design system exists for this project. If a task, skill, or agent wants to compare against,
harvest from, or reference any other component library, the answer is no. There is nothing else to look
at, and nothing outside this repo to go and find.

## What this project is

Take shadcn/ui's components from the vendored source, ship them, and **deploy them to a site that
verifies the deployment faithfully reproduces the source.** Once that baseline is proven, adjustments
are made from there.

So the order is deliberate:

1. **Reproduce** — pull components in unchanged; tokens hold shadcn's own values.
2. **Verify** — deploy the site, compare it against shadcn's own rendering.
3. **Adjust** — only after the baseline is trustworthy.

Adjusting before verifying makes it impossible to tell a deliberate change from a porting mistake.

## Layout

| Path | What |
|---|---|
| `reference/shadcn-ui/` | The vendored shadcn repo (MIT). **Read-only.** Never imported, never edited, never shipped. |
| `tokens/*.tokens.json` | DTCG token source — shadcn's values, unmodified. **The only place tokens are authored.** |
| `scripts/build-tokens.mjs` | Emits `src/styles/tokens.css` + `src/tokens.ts`. Both are generated and gitignored. |
| `scripts/figma-variables.mjs` | Emits a Figma payload from the same source, so Figma and code cannot drift. |
| `src/ui/` | Components, as they are pulled in. Ported one at a time; see `site/` for the rollout order. |
| `dist/` | Build output — JS + `.d.ts` + CSS. Consumers import this. |
| `site/` | Showcase site (separate consumer app) deployed to bs.bidezine.systems. Imports `@bidezine/system` like any real consumer — never reaches into `src/` or `reference/` directly. |
| `icons/manifest.json` | Icon authoring source — every symbol name mapped to a Fluent slug (or a `custom` derived SVG). **The only place icon mappings are authored.** |
| `scripts/build-icons.mjs` | Emits `src/icons/generated.tsx` from the manifest. Generated and gitignored. Fails loudly if a manifest entry doesn't resolve. |
| `limbo/` | Holding area for components being ported from a foreign design system. Each occupant lives here until it passes the full Limbo protocol and is promoted into `src/ui/`. See `LIMBO-PROTOCOL-LOG.md` for the gate sequence. |
| `limbo-factory/` | Dedicated local dev environment (port 4199) for the active Limbo transformation. Built entirely from real `@bidezine/system` components. Never merged into `dist/` or shipped to consumers. |

## Rules that matter

**No hand-rolled components, ever.** If a real `@bidezine/system` component exists for what you're
building — a badge, a button, a checkbox, a card, anything — import and use it. Never approximate its
look with a raw `<span>`/`<div>`/`<button>` styled with matching Tailwind classes. A hand-rolled
approximation *will* drift from the real component's actual recipe (missing flex/centering rules, missing
focus/aria states, missing disabled handling) in ways that are invisible in code review and only become
obvious once a human looks at the rendered result. This applies everywhere in this repo, including
tooling/dev apps like `limbo-factory/` — not just `site/` and `src/ui/` consumers. This is the direct,
load-bearing extension of the one design-source rule above: if the one true source is `reference/shadcn-ui/`,
then every rendered instance of that source must be the real ported component, never a hand re-derivation
of its styling.

**Tokens are authored in `tokens/`, nowhere else.** `src/styles/tokens.css` and `src/tokens.ts` carry a
generated banner and are overwritten by `npm run tokens`. Never hand-write a CSS variable.

**The light/dark parity gate is not optional.** A token defined in one mode only does not error — it
silently inherits, so the component looks right in one theme and subtly wrong in the other. The emitter
fails the build instead.

**Tailwind must never scan `reference/`.** It is committed, and Tailwind v4's auto-detection only skips
git-ignored paths — so left alone it would compile the entire vendored site's utilities into our
stylesheet. `src/styles/system.css` pins `source(none)` plus one explicit `@source`. Do not remove either.

**A build step is required.** Tailwind and CSS variables cannot exist without one. `npm run build`
compiles source → `dist/`; consumers import the built output, not raw TS.

**Runtime dependencies are externalised.** Bundling Radix would ship a second copy of its React context
into any consumer that also uses Radix — which silently breaks portals and focus traps, the exact
behaviour we adopted it for.

**SVG icons must be rendered as inline `<svg>`, never as `<img>`.** An SVG file embedded via `<img src>`,
`<img src="data:image/svg+xml,...">`, or `background: url(...)` is opaque to CSS — `currentColor` and
`fill` have no effect on it, so the icon silently ignores theme switches. Only an `<svg>` element in
the DOM responds to those properties. This is why the icon pipeline emits React components (inline SVG)
rather than static asset references.

## Iconography protocol

> **This design system uses Fluent UI System Icons — regular style, fill-based inline SVG,
> `viewBox="0 0 20 20"` — and nothing else.**

Source: [microsoft/fluentui-system-icons](https://github.com/microsoft/fluentui-system-icons), consumed
via the `@fluentui/svg-icons` package. No Lucide, Heroicons, FontAwesome, Material Symbols, Tabler, or any
other icon set is ever imported, copied, or referenced — not even "just to check," not even in `site/`
demo content. This is the icon equivalent of the one design-source rule above.

**Pipeline (mirrors the tokens pipeline exactly):**
`icons/manifest.json` (hand-authored: symbol name → Fluent slug, or `custom` derived SVG) →
`scripts/build-icons.mjs` (resolves each slug against the installed package, fails loudly on any miss) →
gitignored `src/icons/generated.tsx` (one React component per icon) → re-exported from `src/index.ts`
alongside components and tokens. **Never hand-edit `generated.tsx`.** Add or change an icon in the
manifest and run `npm run icons`.

**Enforcement — this is the part that needs active AI judgment, not just pipeline plumbing:**

1. **Any icon that is not an official Fluent System Icon must be announced, never silently adopted.**
   If a task, a dependency, a pasted snippet, or existing code introduces (or already contains) an icon
   from any other source, stop and surface it explicitly — name the file, the icon, and where it came
   from — before writing code. Don't fix it quietly and move on; don't leave it in either. The user
   decides whether it's approved as a one-off exception or denied and replaced.
2. **Every icon used for a component or option must be the right icon for that content** — not just
   "a Fluent icon," but a semantically correct one for what it represents. Don't default to a
   near-enough shape to keep moving.
3. **When no Fluent icon is a confident, correct match** — the concept doesn't map cleanly to anything in
   the set, or the surrounding UI has been customized enough that no stock icon reads correctly — **stop
   and ask the user**, offering exactly these three options:
   - **(a) Concept** — describe what the icon needs to communicate and let the user pick or suggest a
     direction, rather than the AI guessing a specific icon.
   - **(b) Exact icon** — the user names the precise Fluent icon/slug to use.
   - **(c) Customized icon** — a derived icon built by modifying an existing Fluent icon as the base
     (same approach used for `AudioLinesIcon`: started from `sound_wave_circle_20_regular`, iterated with
     the user over several rounds to match native 20px stroke weight before being locked into the
     manifest as `custom`). Never invent a from-scratch glyph unrelated to any Fluent source.
4. **New manifest entries must be verified before use** — confirm the target `.svg` file actually exists
   under `node_modules/@fluentui/svg-icons/icons/` (or that a `custom` entry's markup was deliberately
   derived from a named Fluent source) before wiring it into a component. This caught two icons
   (`AlertTriangleIcon`, `ArchiveIcon`) that were missing from the original migration inventory.

## Scroll region protocol — the two-layer pattern

`ScrollArea` (`src/ui/scroll-area.tsx`) is a real, faithful port of shadcn's own component — its
`ScrollBar` is an **absolutely-positioned overlay** (`position: absolute`, anchored to `Root`'s own edge),
not a flex sibling that reserves layout space the way a native `overflow-y-auto` scrollbar automatically
does. Left unaccounted for, this overlay can end up flush against — or overlapping — whatever content or
container edge sits at that same side. This was discovered and fixed the hard way in the Rail Sidebar Limbo
transformation (`limbo-factory/`, divergence rows K-3/L-18/L-21/L-22): a scrollbar that "works" (scrolls
correctly) is not the same as one that doesn't collide with anything next to it.

**Whenever `ScrollArea` is composed inside a padded container, use two layers, not one:**

1. **Outer** — an element that owns the container's own uniform padding (all four sides, not an
   asymmetric subset) and enough of the flex chain to make the region actually shrink to the available
   space instead of growing to fit its content: give it `min-h-0` (overriding the flex item's default
   automatic minimum size) and a non-`visible` `overflow` so the excess is genuinely clipped rather than
   just spilling past the box — `overflow-hidden` conveniently satisfies both at once, since a flex item's
   automatic minimum size is *also* deemed `0` once its own overflow is non-`visible`, but the two are
   distinct requirements (shrink vs. clip) worth knowing separately if you're composing this differently.
   `ScrollArea`'s own `Root` sets no `overflow` of its own, so this has to come from somewhere in the chain.
2. **Inner** — the content wrapper rendered inside `ScrollArea` reserves an *extra* gutter specifically on
   the scrollbar's own side (wider than the padding on the other sides) so real content never sits flush
   against, or under, the scrollbar thumb. **This assumes LTR** (Radix positions a vertical scrollbar on the
   right in LTR, left in RTL) — use a logical end-side padding utility (`pe-*`) if this ever needs to support
   RTL, not a fixed physical side.
3. **Conditional, not unconditional** — that inner gutter must be applied ONLY when the content actually
   overflows, never as a bare always-on utility class. A gutter reserved unconditionally leaves dead empty
   space on the scrollbar's side any time content happens to fit without scrolling — this is easy to miss in
   a screenshot glance (it just looks like "a bit of extra padding"), but is exactly the same defect class the
   origin design system this pattern is ported from explicitly names and guards against
   (`SC.UNCONDITIONAL-SCROLLBAR-GAP`, in `RailNav.tsx`'s own real source), gating its own equivalent gutter on
   a live `el.scrollHeight > el.clientHeight` measurement (`navScrollable`, re-checked via `ResizeObserver`).
   `ScrollArea`'s own `Root` (`src/ui/scroll-area.tsx`) reproduces that exact measurement itself and exposes
   it two ways: as `data-scrollable-y`/`data-scrollable-x` DOM attributes on `Root` (for tests/debugging/
   introspection only), and — the mechanism to actually USE — via **`useScrollAreaOverflow()`**, a React
   Context hook. Call it inside a consumer's own inner content wrapper and apply the gutter conditionally in
   JS: `className={cn(scrollableY && "pe-2")}`.

   **Use the Context hook, never a CSS `group`/`data-*` attribute selector, for this.** An earlier version of
   this exact protocol recommended `group-data-[scrollable-y=true]/scroll-area:pe-2`, which was a real,
   shipped, system-wide bug (logged as **L-26**): that Tailwind variant compiles to a plain CSS descendant
   combinator (`:is(:where(.group\/scroll-area)[data-scrollable-y=true] *)`) that matches **any** ancestor
   sharing that class + attribute — not specifically the *nearest* one. Every `ScrollArea` instance shares the
   same `group/scroll-area` class name, so nesting one `ScrollArea` inside another silently leaks the OUTER
   instance's overflow state into the INNER one's conditional class, even though they're functionally
   unrelated. This is not a hypothetical edge case here: `site/src/components/Layout.tsx` wraps every single
   page's `<main>` content in its own page-level `ScrollArea` (almost always scrollable), so every migrated
   component's demo on the showcase site inherited that outer instance's `true` state regardless of its own
   actual overflow — meaning the "conditional gutter" fix was **silently always-on almost everywhere on the
   real site**, while appearing to work in isolated/unit-style checks that didn't nest `ScrollArea`s. React
   Context does not have this problem: a `useContext` call always resolves to the *nearest* enclosing
   `Provider`, which is exactly the semantics this needs. If you're extending a component that renders its
   gutter-bearing element as a *sibling* of `ScrollArea` rather than a *child* of it (i.e. `ScrollArea` doesn't
   directly wrap the element needing the hook), split out a small child component so `useScrollAreaOverflow()`
   is called from something that actually renders inside `ScrollArea`'s own children — see `CommandListInner`/
   `ComboboxListInner` in `src/ui/command.tsx`/`combobox.tsx`, or `PanelTreeScrollGutter`/`QuadrantScrollGutter`
   in `limbo-factory/` for worked examples of this split.

**Both relationships need their own explicit measurement** (`getBoundingClientRect` on the real, rendered
DOM, scrollbar actually visible via a genuine scroll interaction — not assumed from a screenshot): the gap
between the *outer container's own edge* and the scrollbar, and the gap between the *scrollbar* and the
*inner content*, are independent relationships. Fixing one does not verify the other — this exact mistake
shipped once in this same transformation (L-21 fixed the outer gap, then immediately broke the inner one
against a sibling above it, corrected in L-22). Additionally, verify the CONDITIONAL behavior itself in both
directions — force content to shrink below the overflow threshold and confirm the gutter actually disappears,
not just that it appears when content is long — a passing "does it show when scrollable" check alone does not
prove the "does it hide when not scrollable" half of the same contract.

**`scrollbar-gutter: stable` is not a substitute for this pattern** — it reserves space for the browser's
own *native* scrollbar; Radix's `ScrollArea` hides the native one and draws its own independent, absolutely-
positioned track, which that CSS property has no reliable effect on.

**Deliberate shadcn divergence, migrated system-wide:** `Command`, `DropdownMenu`, `ContextMenu`, and
`Combobox` (`src/ui/command.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, `combobox.tsx`) now compose the
real `ScrollArea` primitive per this pattern, on explicit, repeated user instruction. Verified first: shadcn's
own real reference source (`reference/shadcn-ui/apps/v4/registry/new-york-v4/ui/`) uses plain native
`overflow-y-auto`/`overflow-x-auto` in every one of these components, and never composes `ScrollArea` into
any of them — this migration is a deliberate, documented **Adjustment**, not a "Reproduce" fidelity fix; it
should never be presented as matching shadcn's own pattern.

**NOT migrated, for real architectural reasons** (each documented at its own component):
- **`Select`** (`src/ui/select.tsx`) — `SelectContent` uses Radix's own dedicated `SelectPrimitive.Viewport`
  plus `SelectScrollUpButton`/`SelectScrollDownButton`, deeply tied to Select's "item-aligned" positioning
  (aligning the selected item under the trigger). This is a separate, complete scroll system Select owns
  itself; composing `ScrollArea` in would conflict with or discard that behavior.
- **`MessageScroller`** (`src/ui/message-scroller.tsx`) — built entirely on its own dedicated primitive
  (`@shadcn/react/message-scroller`) with its own `Viewport`/hooks that measure that exact DOM node directly
  for auto-scroll-to-bottom and visibility tracking. A second, competing scroll system would very likely
  break that logic.
- **`Attachment`** (`src/ui/attachment.tsx`) — `AttachmentGroup` deliberately uses `scrollbar-none` (fully
  hidden scrollbar) for a horizontal snap-scroll gallery; there is no visible scrollbar to have a collision
  problem with.
- **`Table`** (`src/ui/table.tsx`) — byte-identical to shadcn's own source; wraps a raw `<table>` element,
  which is architecturally atypical to nest inside `ScrollArea`'s `Viewport`. Left on native
  `overflow-x-auto` rather than risk it without dedicated testing.

**API-contract notes for the four migrated components** (surfaced by rubber-duck review, worth knowing if
extending these components further):
- `DropdownMenuContent`/`ContextMenuContent` never exposed Radix's own `asChild` prop to begin with (Radix's
  underlying `Menu.Content` doesn't accept one — verified against `@radix-ui/react-menu`'s own types), so
  nesting `ScrollArea` inside them does not remove a capability that existed before.
- `CommandList`'s and `ComboboxList`'s consumer-facing `className` prop lands on the outer `ScrollArea` (the
  element that actually owns the height cap and clipping) — an independent code-review pass on this
  migration caught an earlier version that merged `className` onto the *inner* scrolling element instead,
  which would have silently swallowed any consumer override of the max-height/overflow behavior (no
  in-repo consumer was relying on the broken behavior, so it was fixed before it mattered).
- `Combobox` does not support Base UI's opt-in `virtualized` mode in composition with `ScrollArea`, since the
  actual scrolling element becomes Radix's private `Viewport`, which `ComboboxList` exposes no ref/props for
  — already noted in `combobox.tsx`'s own comment; restated here since it's a real, not just theoretical, gap.

**Critical primitive-level fix found while migrating (now baked into `ScrollArea` itself, benefits every
consumer):** `ScrollArea`'s `Viewport` used to size itself via `size-full` (a CSS percentage height). This
silently fails whenever `Root` is capped with `max-height` rather than given a fixed `height` — exactly the
case for a Radix popper/menu content element, whose available height is a dynamic `max-height` CSS var. A
CSS percentage height only reliably resolves against an ancestor with a genuinely *definite* height per
spec, and a `max-height`-clamped auto-sizing box does not reliably count as definite even when its rendered
pixel value is concrete. Verified empirically: nesting `ScrollArea` inside a `max-h-(--some-var)` ancestor
left `Viewport` at its full unclipped content height — the surrounding box visually clipped the overflow via
`overflow-hidden`, but `Viewport` itself never became internally scrollable (`scrollTop` was inert, no
scrollbar ever appeared). Fixed by making `Root` a flex column and `Viewport` `w-full flex-1 min-h-0` instead
— flex-based sizing sidesteps the percentage-resolution question entirely by letting the flex algorithm
distribute the already-constrained space directly (an explicit `w-full` on `Viewport` keeps its old
implicit full-width guarantee, since that previously came from `size-full`'s own width percentage, not from
flex's default `align-items: stretch`, which a consumer could override). Re-verified against the pre-existing
fixed-height `ScrollArea` demo (`h-72`) to confirm no regression there.

## Verify by render, not by number

A value can compute correctly and still not appear. Check the rendered result, not just the property.
This has caught more real defects here than any amount of reading.

## Sandbox/Limbo fidelity — preventing contamination before promotion

A component built in a sandbox (`limbo-factory/`, or any future Limbo occupant) can look completely correct
through an entire review pass and still silently diverge from the real primitives, tokens, and behavior it
claims to use — the Rail Sidebar transformation hit the same handful of failure classes repeatedly, each one
invisible to a normal code read or a quick visual glance. Treat every check below as mandatory for **any**
sandbox component before it's considered ready to promote — not a one-off list for Rail Sidebar specifically:

- **A className override is not verified by writing it — verify it against the live DOM.** Tailwind (and
  `tailwind-merge`) resolve conflicting classes by *conflict group*, not by string position: a class
  appearing later in a `className` does not guarantee it wins the compiled stylesheet's cascade. Two real
  bugs shipped this exact way in one session: `pl-7` never actually overrode `Input`'s own `px-3` (the
  search icon overlapped typed text), and `h-[38px] w-[38px]` never actually overrode `Button`'s `size-9`
  icon variant (rail buttons rendered 2px too small, producing asymmetric padding). Rule: when overriding a
  primitive's own built-in sizing/spacing utility, use the *same utility family/shorthand* it already uses
  (`size-[38px]` to override `size-9`, never split into `h-*`/`w-*`) — and confirm the override actually
  took effect with `getComputedStyle`/`getBoundingClientRect` on the live DOM, not by reading the className
  string. If genuinely unsure whether two classes will merge correctly, test `twMerge()` directly first.

- **Removing or suppressing a primitive's built-in interactive state requires wiring its replacement in the
  same change, never after.** A rail button shipped with `hover:bg-transparent` silently killing `Button`'s
  own hover feedback, with no substitute background ever wired in its place — the approved hover/press color
  tokens existed but weren't referenced anywhere in the component. A suppressed state with no successor is a
  regression waiting for a human to discover, not something a review should let through.

- **Never approximate a primitive with hand-rolled markup, in ANY context — including sandbox chrome.** A
  raw `<button>` (or a `<div role="button">`) styled to look like the real `Button` drifts from its actual
  recipe (missing focus-visible ring, missing disabled handling, missing flex/centering rules a reviewer
  won't notice from a screenshot) in ways only a DOM inspection catches. This is the same "no hand-rolled
  components" rule already stated above for `site/`/`src/ui/` — sandbox tooling is not exempt from it.

- **A decision approved as an isolated swatch/value is not yet verified — only composing it into the real,
  full component and re-checking it next to its actual neighbors is.** Multiple color tokens were approved
  as clean-looking isolated values, then had to be revised once actually rendered against their real
  neighboring surfaces exposed contrast/legibility problems no swatch-level review could have caught.
  Re-verify every "resolved" value once the component is fully composed, not only when first proposed.

- **A "resolved" record is only as trustworthy as its last verification against the real, current code —
  spot-check it, don't just trust it.** A written divergence record (a radius value, a doc claiming a
  behavior is implemented) can drift from what the code actually does without anyone noticing, until a
  fresh read catches the gap. Any doc, QA note, or prior record — including this project's own — must be
  checked against the real, current source before being relied on, the same way an *origin* project's docs
  must never be trusted over that origin's own live source file.

- **Faithfully reproducing an origin behavior is not the same as it being correct — flag it, don't silently
  absorb it.** If a ported component reproduces a real bug or awkward interaction that exists identically in
  the origin's own current source, that is not a bidezine-introduced divergence and must not be "fixed"
  unilaterally — but it must be called out explicitly as inherited, with the origin evidence attached, so a
  human can decide whether to diverge from origin to improve it.

- **Overflow, truncation, and wrap rules must be tested with content long enough to actually trigger them.**
  Demo/placeholder text is almost always too short to exercise a `truncate`/`line-clamp`/wrap rule — a
  component can look completely correct through an entire review cycle simply because nothing in the demo
  data was ever long enough to expose a real divergence. Temporarily substitute long test strings and check
  computed style/screenshots before signing off on any text-bearing element's overflow behavior.

Whenever a new failure class like these is found, add it here directly (not only to a component's own
temporary working log) so it protects every future Limbo occupant, not just the one that exposed it.

## Primitive Fidelity Checklist — mandatory, run proactively, not on request

Every failure class documented above was caught the same way: a human looked at the rendered result and
noticed something was off, then an AI investigation traced it back afterward. Not one was caught by the AI
running its own systematic check *before* presenting work as finished — including the formal "Independent
Audit" gate the Limbo protocol itself defines, which sat un-run for the component's entire Build phase while
over a dozen of these bugs accumulated underneath it. Reactive verification (checking only what a human
happens to ask about) cannot reach zero; only an exhaustive, repeatable procedure run on every primitive
usage can. This checklist exists to make that procedure concrete instead of aspirational.

**Run every item below for every real primitive usage you touch, before calling any change "done" — not
just the property the current task happens to mention:**

*(Items 1–10 cover CSS/style mechanics — className merges, box-model, interactive states, primitive-swap
behavior. Items 11–14 were added after a second, separate wave of findings — element-order/positional
conventions, data-completeness, primitive-default assumptions, and overlay geometry — none of which are CSS
merge problems, and none of which the first ten items would have caught even if followed perfectly. Treat
this as confirmation that the checklist itself must keep widening in *kind*, not just in item count, whenever
a genuinely new failure category is found — not evidence the list is now complete.)*

1. **className-vs-base-recipe merge check.** For any `className` override on a real primitive, find that
   primitive's own base recipe (its `cva`/`buttonVariants`-style source) and run `tailwind-merge` against
   `(baseRecipe, override)` directly — in a scratch `node -e` script, not by inspection — and confirm the
   result contains no leftover conflicting base classes (same property, different value). Do this for every
   variant/size combination actually used, since a conditional variant like `has-[>svg]:px-3` is a *different*
   conflict group than a plain `px-2` and both can silently survive together.

2. **Full box-model parity check**, whenever two elements are claimed (by a divergence row, a design intent,
   or a "should look the same" requirement) to share a visual recipe: pull `getComputedStyle` for **all** of
   height, border-radius, padding (all four sides — don't assume a shorthand covers them identically),
   gap, font-size, font-weight, and line-height on both elements and diff them programmatically. A screenshot
   comparison is a confirmation step *after* this, never a substitute for it — a difference under a few
   pixels or a single mismatched side is usually invisible in a screenshot at normal size.

3. **Every interactive state, simulated live, not read from the className.** For each state a component is
   supposed to support — rest, hover, pressed/active, focus-visible, disabled, selected/checked/expanded —
   trigger it for real (`hover()`, `mouse.down()`/`mouse.up()`, keyboard focus, toggling the relevant prop)
   and read `getComputedStyle` afterward. Never conclude a state "works" because the class exists in the
   source; an inline `style` value, a competing class, or an unreachable state (e.g. `disabled` combined with
   `pointer-events-none` making `hover:` permanently dead) can silently neutralize it.

4. **Alignment claims are measured, not eyeballed.** Any claim that one element "lines up with" or "hangs
   from" another (an icon and a guide line, a label and its indicator) must be checked with
   `getBoundingClientRect` and a numeric diff, not a screenshot glance — a few pixels of drift is exactly the
   kind of thing a static image hides and a real user's eye eventually catches.

5. **When copying an established pattern from elsewhere in bidezine** (another real component, an origin
   source), measure that reference's own actual computed values *first*, before building — target those
   numbers directly, rather than building something "in the spirit of" the reference and discovering the
   mismatch only after comparing it side-by-side afterward.

6. **A single fixed instance is not a swept file.** When any of the above catches a bug, immediately grep
   every other usage of the same primitive/pattern in the file (or component) and run the same check against
   each one — the same conflict-group gap recurring three separate times in one component (a `px-3`-family
   override, a `size-9` override, a second `px-3`-family override on a different element) before a truly
   exhaustive sweep ever ran is exactly the failure this checklist exists to end.

7. **This checklist itself *is* the Independent Audit gate, run continuously.** Don't treat "Independent
   Audit" as a single deferred phase at the very end of Build — run this checklist after every meaningful
   primitive-touching change, in miniature, so issues surface within the same turn they're introduced, not
   dozens of turns later when a human happens to notice.

8. **A plain CSS mechanism standing in for a component is the same violation as hand-rolled markup — check
   for it explicitly, don't wait to be asked.** A raw `overflow-y-auto`/`overflow-x-auto` (rendering the
   browser/OS's own native scrollbar instead of the real `ScrollArea` primitive) is exactly as much a "no
   hand-rolled components" violation as a raw `<button>` standing in for `Button` — it's just easier to miss
   because there's no visibly wrong markup to spot, only a native browser affordance quietly substituting for
   a themeable one. When auditing a component, explicitly enumerate every raw `overflow-*`/scroll-bearing
   element and confirm there's a deliberate, recorded decision for each one (real `ScrollArea` vs. browser
   default vs. something else) — don't only catch it when a human notices the scrollbar itself looks wrong.

9. **Swapping to a real primitive can silently change the CSS mechanics an existing behavior depended on —
   re-verify the behavior itself, not just that the primitive rendered.** Replacing a plain `overflow-y-auto`
   div with the real `ScrollArea` broke scrolling entirely: unlike the div, `ScrollArea`'s own Root never sets
   its own `overflow` (it defaults to `visible`), so it never got CSS flexbox's "automatic minimum size: 0"
   treatment the old div relied on to shrink to the parent's available height — it just grew to fit its
   content instead, leaving nothing to scroll. A primitive swap is not "done" once it renders; re-check the
   specific *behavior* (does it actually scroll, resize, focus-trap, etc.) the old code provided.

10. **When multiple instances of the same primitive exist on a page, a verification query must be
    disambiguated — never trust whichever one a bare selector happens to match first.** A `querySelector` or
    `.first()` check that "confirmed" the rail's own scrolling was actually silently testing the surrounding
    page's own, unrelated `ScrollArea` instance, which happened to appear earlier in the DOM — so a real
    regression shipped underneath a verification step that looked successful. Scope every check to the exact
    element in question (an index, a containing selector, a `data-*` attribute unique to that instance), not
    "the first thing on the page matching this primitive."

11. **A ported UI pattern's structural arrangement (element order, slot position) must be cross-checked
    against bidezine's OWN other real implementations of the same semantic pattern — never inherited from
    origin's layout by default.** A group-toggle row's chevron sat on the LEFT, copied verbatim from origin's
    own source layout, and passed an entire review pass ("does this look plausible") without ever being
    checked against bidezine's own two real "expand/collapse with a chevron" primitives — `AccordionTrigger`
    (chevron last, `justify-between`) and `DropdownMenuSubTrigger`/`ContextMenuSubTrigger`/`MenubarSubTrigger`
    (chevron last, `ml-auto`) — both of which put it at the far right. Before finalizing any element
    order/position for a ported interactive pattern, grep every other real usage of that same semantic
    pattern in `src/ui/*.tsx` and match its convention, treating origin's own arrangement as informative but
    never authoritative over bidezine's own established one.

12. **Porting a data structure from an origin source requires an exhaustive field-by-field diff, not a visual
    read.** Six group nodes silently lost the `icon` field origin's own source data gave every one of them
    (`IconCubeTree`, `IconCalendarClock`, `IconGrid`, `IconCart`, `IconMoney`, `IconPeople`) — the ported
    `GroupNode` type didn't even have an `icon` property, and this was invisible to a normal read because
    nothing errors when a field is simply absent; the row still renders, just without that one piece of
    content. Two of the four *icon components this needed* were already imported into the file, unused —
    itself a sign the port was left mid-way. When porting any tree/list/config data from an origin source,
    literally enumerate every field name present on the origin's own object literals and confirm each one has
    a corresponding field in the ported type and every ported instance — don't rely on the rendered result
    looking complete.

13. **A shared primitive's own base recipe must be checked for the SPECIFIC named concern at hand — never
    assumed to already cover it.** The real `DropdownMenuItem` primitive has no `truncate`/`whitespace-nowrap`
    anywhere in its own base className — a long enough item label would wrap onto a second line, not
    ellipsis-truncate, and this went unnoticed because every label used against it so far happened to be
    short enough to fit. Whenever a requirement names a specific behavior (truncation, disabled handling, a
    focus ring, an ARIA attribute), open the actual primitive's source and confirm that exact behavior is
    present in its base recipe — don't assume a "real, already-shipped" component automatically covers every
    reasonable expectation for it.

14. **A decorative or overlay element's actual geometric footprint must be measured against its neighboring
    content under real interaction — a mechanism "working" is not the same as it not colliding with anything.**
    Radix `ScrollArea`'s scrollbar thumb is an absolutely-positioned overlay, not a flex sibling that reserves
    layout space — confirming that scrolling itself worked (K-3) never established whether the visible thumb
    then overlapped the content sitting at that same edge. A live measurement (scrollbar actually visible via
    a real scroll interaction, `getBoundingClientRect` on both the content edge and the scrollbar track) found
    a literal *negative* gap, i.e. genuine overlap. Any decorative element that overlays content (scrollbars,
    floating badges, absolutely-positioned indicators) needs this same explicit geometric check, not just a
    functional one.

15. **Anything that relies on a component's runtime identity (`.name`, `.displayName`, or a name-based string
    match) must be verified against an actual production/minified build, not just the Vite dev server — dev
    mode preserves function names; a real build routinely does not.** `src/lib/action-icons.tsx`'s own
    `isIconElement()` check has two paths: an explicit `isActionIcon === true` marker set on every real
    generated icon (`scripts/build-icons.mjs`), and a fallback that checks whether `.name`/`.displayName` ends
    in `"Icon"` — with its own code comment already warning the fallback is unsafe under minification. A
    hand-rolled icon factory in a sandbox component (returning a function literally named `SpecIcon`) relied
    solely on that unsafe fallback. It passed every check across many turns of this session because every one
    of those checks ran against the dev server, where the name survives — then a real `npm run build` +
    `npm run preview` test proved every one of those icons had **silently stopped filling on hover/select
    entirely**, with zero errors, the moment the code was minified, while real generated icons (immune via
    their `isActionIcon` marker) kept working in the exact same bundle. This is why a class of "icon doesn't
    fill" bug kept recurring across the whole session despite repeated fixes: every fix was re-verified the
    same insufficient way. Fix: any hand-rolled component that needs to participate in the action-icon-fill
    system must set `ComponentName.isActionIcon = true` explicitly, exactly like the generated pipeline does —
    and after any icon-fill fix, build for production and test the actual built output before calling it done,
    not only the dev server. **Two known limits of the marker approach, caught by an independent review, not
    yet hit in practice:** the marker is read off `child.type` directly, so it does **not** survive being
    wrapped in `React.memo`/`React.forwardRef`/another HOC afterward — mark the *outermost* wrapper, not just
    the inner function, if one is ever added; and the check is `displayName ?? name` (an *or*, not both), so a
    `displayName` that doesn't end in `"Icon"` silently overrides an otherwise-fine `.name` — the marker is the
    only fully reliable contract, treat the name-suffix fallback as a convenience for simple cases only, never
    as something to depend on for anything wrapped or renamed.

16. **A CSS `group`/`data-*` attribute selector cannot express "nearest ancestor" — if a mechanism needs that
    semantic, it must be React Context, not a Tailwind `group-data-[...]/name:` variant.** A conditional
    scrollbar gutter (checklist item 3 in the Scroll region protocol above) was implemented via
    `group-data-[scrollable-y=true]/scroll-area:pe-2`, which appeared correct in isolated checks but was a
    real, shipped, system-wide bug (**L-26**): that Tailwind variant compiles to a plain CSS descendant
    combinator matching **any** ancestor sharing the group name + attribute, not the nearest one. The instant
    two instances of the same primitive nest (which happens whenever a page-level layout wraps its own content
    in the same primitive a component demo also uses internally — exactly `site/src/components/Layout.tsx`'s
    structure), the outer instance's state silently overrides the inner one's, and every check that doesn't
    specifically construct a nested scenario will pass while the real, deployed site is broken almost
    everywhere. Before reaching for `group-data-*`/`peer-data-*` to read a primitive's own internal state from
    one of its descendants, ask: could two instances of this primitive ever nest on a real page? If yes (and
    for a widely-reused primitive like `ScrollArea`, assume yes), expose the state via a React Context +
    exported hook instead — `useContext` always resolves to the nearest `Provider`, which is the actual
    semantic needed, and a CSS selector of this shape structurally cannot replicate that.

17. **Any fix explicitly described as system-wide, cross-cutting, or "apply this everywhere" must be verified
    by dispatching multiple independent background agents whose findings are then personally re-checked — not
    self-approved by the same agent/pass that made the change.** This was a standing, repeatedly-stated user
    requirement this session ("I thought I was specific on using multiple agents to not rely on one approving
    things for the sake of approving"), and it caught a real gap: a dispatched independent scroll-audit agent's
    own findings needed correction too (it used the same kind of unscoped `document.querySelector` that
    checklist item 10 already warns against, producing at least one unreliable "Defect A" measurement it
    admitted was a proxy). The correct workflow is therefore three-layered, not two: (1) make the fix, (2)
    dispatch independent agents to audit it fresh, (3) personally re-verify the agents' own specific claims
    with fresh, properly-scoped `getBoundingClientRect`/computed-style measurements before reporting anything
    as confirmed — an agent's report is a lead to re-check, not a verdict to relay verbatim.

18. **Icon path data (`d`/`filledD`) must always be copied verbatim from the real Fluent `.svg` source file —
    never reconstructed from memory, reasoning, or "what this icon probably looks like."** While restoring a
    previously-exempted icon's filled variant (**L-27**), a first attempt at `videoSettings`'s `filledD`
    was written by reasoning about the icon's likely filled shape rather than reading
    `node_modules/@fluentui/svg-icons/icons/video_settings_20_filled.svg` directly — it looked plausible (valid
    SVG path syntax, roughly the right silhouette) but did not match Microsoft's real glyph at all. This is a
    uniquely dangerous class of error: a fabricated-but-plausible path passes every automated check (typecheck,
    build, even a live "does it render *something* different on hover" smoke test) and only reveals itself on
    close visual inspection against the real icon — exactly the kind of bug that ships silently. Any time icon
    path data is added or changed, the actual `.svg` file under `node_modules/@fluentui/svg-icons/icons/` must
    be opened and compared character-for-character (or copy-pasted directly) — reasoning about an icon's shape
    is never a substitute for reading its real source.

19. **A provisional, user-facing "decision pending" exemption left unresolved across sessions eventually gets
    reported back as a bug, not a feature — track these to closure, don't let them go stale.** L-20 provisionally
    exempted two icons from hover-fill "pending explicit sign-off" when the user was unavailable to answer a
    three-option question. That exemption then sat for multiple sessions with status `"decision"`, not
    `"resolved"` — and was eventually reported back by the user as exactly the bug it was meant to provisionally
    avoid ("many icons are not filling... this is the fifth time"), because two icons behaving differently from
    every other actionable icon in the same component reads as broken regardless of the underlying rationale.
    When a provisional default is applied because a decision-maker is unavailable, treat it as a tracked,
    time-bound placeholder, not a permanent resolution — the next time the same component/behavior is touched
    for any reason, revisit any open "decision" status items in its own divergence log and resolve them
    conclusively (picking the least-invasive of the already-documented options) rather than leaving them to
    accumulate and resurface as fresh-seeming bug reports.

20. **"Selected/active" emphasis on a row (bold text, filled icon, whatever else marks it as current) must be
    driven from ONE reused state-detection mechanism, never two separate implementations for text vs. icon that
    can silently drift out of sync.** The Rail Sidebar's panel tree (L-28/L-29) bolded a selected leaf's AND its
    ancestor groups' text first, in its own pass — then, in a separate follow-up, needed a second pass to also
    fill their icons, because the leaf row's icon-fill already worked (it reused `Button`'s own built-in
    `aria-pressed` → `useActionIconFill` → `fillActionIcons` wiring) but the newly-added group-row ancestor logic
    was wired up for the text (`className`) only, not also passed through to the icon. The safe pattern, applied
    once found: compute the "is this row on the active path" boolean ONCE, then feed it into the SAME primitive
    mechanism that already drives both text weight and icon fill together (here, that mechanism is `Button`'s own
    `aria-pressed` prop) rather than writing one conditional for the `className` and a second, independent
    conditional for a `filled` prop. Whenever a row/element has multiple visual properties that are all supposed
    to track the same underlying state (selected, active, expanded, on-path, etc.), route all of them through the
    same boolean and the same primitive-level hook, so a future edit to how that state is computed can't update
    one visual property while silently leaving another stale — exactly what happened here across two separate
    commits before the icon half was caught.



## Three machines, one branch

Laptop A, Laptop B, and a PC all work `main` directly. `origin` is the only source of truth — unpushed
work does not travel.

**Pull when you sit down · push when you get up · commit small and often.**
Work room-by-room: one person per file.

## Attribution

shadcn/ui and Radix are MIT-licensed. `THIRD-PARTY-LICENSES.md` stays. We may license our own work as we
choose; the third-party notice covers their portions.
