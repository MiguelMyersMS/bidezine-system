# @bidezine/system — AI Context

## The one rule

> **`reference/shadcn-ui/` is the ONLY design source this project may consult.**

No other design system exists for this project. If a task, skill, or agent wants to compare against,
harvest from, or reference any other component library, the answer is no.

## What this project is, and what changed on 2026-08-15

**60 primitives are ported and verified in `src/ui/`.** They came out of `reference/shadcn-ui/` in
batches — 24 in one commit, 10 in another. That is the proven rate and it works.

**The next ~140 are COMPOSITIONS** — screens and patterns assembled from those primitives. They are not
ports. There is nothing to reconcile against a foreign source, and they must not be treated as if there
were.

**The Sandbox is retired.** It priced one composition (`rail-sidebar`) at four days and 169 adjudicated
rows, because it enforced a contract — *reproduce a foreign design faithfully and justify every
deviation* — that only makes sense when porting foreign material. Applied to a composition built from
already-verified primitives it is pure cost. `docs/PIVOT-2026-08-15.md` records the decision, what it
cost, and what was kept. Do not rebuild it. Do not re-derive it from the git history.

**Verification lives at the primitive layer, paid once, inherited by everything.** A composition that
uses only real primitives and real tokens is correct by construction in every way the primitives are.
What remains for a composition is what no machine can check: does it look right.

### The composition contract — all of it

1. **Build from real primitives and real tokens.** No hand-rolled markup, no raw hex, no magic numbers.
2. **`npm run check-all` passes** — it builds once, then runs `check-shipped`, `check-type-slots`,
   `npx tsc --noEmit` and `node scripts/check-rules.mjs` in sequence. The build-dependent checks now
   read `dist/` from a prior build instead of each embedding their own `vite build` (two concurrent
   embedded builds raced over one `dist/`, so a check could read a half-written stylesheet); run
   `npm run build` first if you invoke `check-shipped`/`check-type-slots` on their own — they refuse
   honestly rather than build. `check-shipped` verifies the BUILT stylesheet: every `var(--token)` a component
   references must exist in `dist/system.css`. An undefined custom property renders nothing, silently,
   and this shipped once -- the rail was a transparent box while three other checks reported success,
   because each was measuring the source or the database rather than the artifact a consumer installs.
3. **One human look at the rendered result, light and dark.** This is the gate. It has caught every real
   defect in this project's history; nothing automated has caught more.
4. **Ship it.**

There is no corpus, no divergence row, no anchor, no per-claim evidence and no independent-review step.
If a composition needs a design decision, ask the owner in one sentence and record the answer where the
component lives — a comment at the value, not a database.

## Layout

| Path | What |
|---|---|
| `reference/shadcn-ui/` | The vendored shadcn repo (MIT). **Read-only.** Never imported, never shipped. |
| `tokens/*.tokens.json` | DTCG token source. **The only place tokens are authored.** |
| `scripts/build-tokens.mjs` | Emits `src/styles/tokens.css` + `src/tokens.ts`. Generated, gitignored. |
| `src/ui/` | The 60 verified primitives, and where compositions land. |
| `dist/` | Build output. Consumers import this. |
| `site/` | Showcase site (port 4188), a real consumer — never reaches into `src/` directly. |
| `icons/manifest.json` | Icon authoring source. `scripts/build-icons.mjs` emits `src/icons/generated.tsx`. |
| `scripts/check-rules.mjs` | The machine-checked rules below. Blocking in CI. |
| `scripts/check-quarantine.mjs` | Enforces the `origin/` boundary. Keep. |
| `origin/` | Quarantined foreign source material. Never imported, never compiled into any app. |
| `sandbox/` | **RETIRED.** Kept read-only as the record of the rail-sidebar port. Do not extend it. |

## Rules that matter

**No hand-rolled components, ever.** If a real `@bidezine/system` component exists for what you are
building, import it. Never approximate one with a styled `<div>`/`<span>`/`<button>`. A hand-rolled
approximation drifts from the real recipe — missing focus rings, disabled handling, flex/centering — in
ways invisible in review and obvious the moment a human looks. **A plain CSS mechanism standing in for a
component is the same violation**: a raw `overflow-y-auto` instead of `ScrollArea` is as much a breach as
a raw `<button>`, just harder to see.
→ **ENFORCED** (`scroll.no-raw-overflow`).

**Tokens are authored in `tokens/`, nowhere else.** `src/styles/tokens.css` and `src/tokens.ts` carry a
generated banner and are overwritten by `npm run tokens`. Never hand-write a CSS variable.

**The light/dark parity gate is not optional.** A token defined in one mode silently inherits in the
other, so it looks right in one theme and subtly wrong in the other. The emitter fails the build instead.

**Never invent a value.** Before introducing any constant — colour, size, spacing, radius, duration —
grep `src/ui/` for an existing convention covering that concept and reuse it. "That is what the origin
used" is not a justification; it is the single most common source of unforced divergence here. If nothing
covers it, ask the owner rather than picking something plausible.

**Tailwind must never scan `reference/`.** It is committed, and Tailwind v4 only skips git-ignored paths.
`src/styles/system.css` pins `source(none)` plus one explicit `@source`. Do not remove either.

**Runtime dependencies are externalised.** Bundling Radix ships a second copy of its React context into
any consumer that also uses Radix, silently breaking portals and focus traps.

**SVG icons must be inline `<svg>`, never `<img>` or `background: url()`.** An SVG behind `<img>` is
opaque to CSS — `currentColor` and `fill` do nothing, so it ignores theme switches.

## Iconography protocol

> **Fluent UI System Icons — regular style, fill-based inline SVG, `viewBox="0 0 20 20"` — and nothing
> else.** Source: `@fluentui/svg-icons`. No Lucide, Heroicons, Material, Tabler — not even "just to check".

`icons/manifest.json` (symbol name → Fluent slug, or a `custom` derived SVG) → `scripts/build-icons.mjs`
→ gitignored `src/icons/generated.tsx`. **Never hand-edit `generated.tsx`.**

1. **Any non-Fluent icon must be announced, never silently adopted.** Name the file, the icon and its
   source, and let the owner decide.
2. **Use the semantically right icon**, not a near-enough shape.
3. **When no Fluent icon is a confident match, stop and ask**, offering: (a) describe the concept and let
   the owner pick, (b) the owner names the exact slug, (c) a custom icon derived from a named Fluent base.
   Never invent a glyph unrelated to any Fluent source.
4. **Verify a new manifest entry resolves** under `node_modules/@fluentui/svg-icons/icons/` before wiring
   it up.
5. **Icon path data is copied verbatim from the real `.svg`, never reconstructed from memory.** A
   fabricated-but-plausible path passes typecheck, build and a smoke test, and fails only under close
   visual inspection. This happened.

## Scroll regions — the two-layer pattern

`ScrollArea`'s `ScrollBar` is an **absolutely-positioned overlay**, not a flex sibling reserving layout
space the way a native scrollbar does. Left unaccounted for it sits against, or over, whatever is at that
edge. Whenever `ScrollArea` is composed inside a padded container:

1. **Outer** — owns the container's uniform padding, plus `min-h-0` and a non-`visible` overflow so the
   region shrinks to available space instead of growing to fit content. `overflow-hidden` satisfies both.
   `ScrollArea`'s own `Root` sets no overflow, so this must come from the chain.
2. **Inner** — the content wrapper inside `ScrollArea` reserves an extra gutter on the scrollbar's side so
   content never sits under the thumb. LTR-only; use `pe-*` if RTL is ever needed.
3. **Conditional, never unconditional** — an always-on gutter leaves dead space whenever content fits.
   Use **`useScrollAreaOverflow()`**, the React Context hook, and apply the class in JS.

**Use the Context hook, never a `group-data-[…]/name:` variant.** That Tailwind variant compiles to a
plain descendant combinator matching **any** matching ancestor, not the nearest — so nesting two
`ScrollArea`s leaks the outer one's state into the inner one. This shipped, system-wide, and passed every
isolated check (`site/src/components/Layout.tsx` wraps every page in its own `ScrollArea`). `useContext`
resolves to the nearest provider, which is the actual semantic needed. If the gutter-bearing element is a
sibling rather than a child of `ScrollArea`, split out a small child component so the hook is called from
inside — see `CommandListInner` / `ComboboxListInner`.

**Every `ScrollArea` here assumes vertical-only overflow.** Radix's Viewport renders an internal child with
inline `display: table`, which sizes to max-content and defeats flexbox's automatic-minimum-size rule that
makes `truncate` work. `scroll-area.tsx` forces `[&>div]:!block` to fix it. **This is only safe because no
consumer mounts a horizontal `ScrollBar`.** A consumer genuinely needing horizontal scroll must build a
dedicated variant, not remove the override.

**Composed with `ScrollArea` deliberately** (a documented divergence from shadcn, which uses native
overflow): `Command`, `DropdownMenu`, `ContextMenu`, `Combobox`.
**Deliberately NOT**: `Select` (owns its own Viewport + scroll buttons), `MessageScroller` (own primitive),
`Attachment` (hidden scrollbar by design), `Table` (byte-identical to shadcn, wraps a raw `<table>`).

**`scrollbar-gutter: stable` is not a substitute** — it reserves space for the native scrollbar, which
Radix hides.

## Verify by render, not by number

A value can compute correctly and still not appear. Check the rendered result, not just the property.
This has caught more real defects here than every automated check combined — and it is now the gate.

## The build checklist — short on purpose

The previous version of this file carried 29 items. At composition speed that is not a checklist, it is a
reason to skip checklists. These are the ones that repeatedly caught real, shipped defects. The rest are
in git history (`git show 79de69a:CLAUDE.md`) if a specific situation ever calls for one.

1. **A className override is not verified by writing it.** Tailwind and `tailwind-merge` resolve conflicts
   by *conflict group*, not string order — a later class does not reliably win. `pl-7` never overrode
   `Input`'s `px-3`; `h-[38px] w-[38px]` never overrode `Button`'s `size-9`. **Override with the same
   utility family the primitive uses** (`size-[38px]` to beat `size-9`, never split into `h-`/`w-`), and
   confirm with `getComputedStyle` on the live DOM.

2. **Removing a primitive's built-in interactive state requires wiring its replacement in the same
   change.** A `hover:bg-transparent` with no substitute shipped and killed hover feedback silently.

3. **Measure, do not eyeball.** Any claim that two things align, match, or share a recipe gets
   `getBoundingClientRect` / `getComputedStyle` and a numeric diff. A few pixels hides in a screenshot and
   a human eventually sees it.

4. **Measure only after motion stops.** A colour caught mid-transition reads as a WRONG value, not a
   missing one, so it looks like a broken component. Wait on `el.getAnimations()` — and collect
   **ancestors too**, since an icon usually inherits its transition from the button around it.

5. **Anything name-dependent must be verified against a production build.** Dev mode preserves function
   names; minification does not. An icon relying on a `.name` check silently stopped filling on hover in
   production while passing every dev-server check.

6. **`overflow-hidden` with zero slack clips more than scrollbars** — focus rings, badges, carets. Before
   adding it, enumerate everything allowed to render outside the child's box at rest, hover and focus.

7. **When two instances of a primitive exist on a page, scope the query.** A bare `querySelector` "proving"
   the rail scrolled was measuring the page's own unrelated `ScrollArea`. And assert what the thing is
   NOT: a positive marker generic enough to be worth asserting is generic enough for a substitute to
   satisfy.

8. **A check must take its input FROM the pipeline it checks, never construct its own.** Four separate
   checks were found green while the thing they covered was broken, and every one had built its own input
   — a probe row spelled the way the real sync never produces, a fraction from a join the display never
   used, a fixture-ref collision, a probe measuring the element class that was never failing. Read the
   value from the real source; pick the row by querying for one in the state you need; exercise the case
   that actually failed.

## Attribution

shadcn/ui and Radix are MIT-licensed. `THIRD-PARTY-LICENSES.md` stays. We license our own work as we
choose; the third-party notice covers their portions.
