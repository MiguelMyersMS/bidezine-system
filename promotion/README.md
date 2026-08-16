# Rail sidebar promotion — work in progress

**Not compiled.** This directory is outside `src/`, so `tsc` and `npm run build` stay green while the
promotion is unfinished. Finish it here, then move both files into `src/ui/` and `src/hooks/` in one go.

## What is done

`rail-sidebar.wip.tsx` is `sandbox/src/components/FunctionalRailSidebar.tsx` with the retired Sandbox
instrumentation removed:

- the `@/lib/divergence-anchors` and `@/lib/preconditions` imports
- `useDivergenceAnchor()` / `anchorAttrs()` / `DivergenceAnchorProvider`
- the `anchors` and `forcedState` props, on both the component and `RailIconButton`, including the
  multi-line JSX pass-through
- `@bidezine/system` rewritten to a relative `../index` import

`use-overflow-fit.ts` is the sandbox-local hook it depends on, copied verbatim, destined for `src/hooks/`.

## What is left — 8 TypeScript errors, three kinds

Run `npx tsc --noEmit` after moving it back into `src/ui/` to see them. They are all mechanical except
the first.

**1. `@/data/rail-sidebar` (1 error) — the only real decision.**
The component imports `BIDEZINE_LOGO_PATH`, `BIDEZINE_LOGO_VIEWBOX`, `FULL_PREVIEW_ICONS` and the
`ProposedToken` type from sandbox demo data. A shipped primitive must not depend on that. Suggested split,
but it is a judgement call for the owner:

- `BIDEZINE_LOGO_PATH` / `BIDEZINE_LOGO_VIEWBOX` — brand assets. Inline them, or take a `logoIcon` prop
  (the component already has one).
- `FULL_PREVIEW_ICONS` — demo content. Belongs in the site page, not the component.
- `ProposedToken` — a Sandbox concept. Delete it and the `export type { ProposedToken }` at the bottom.

**2. `Spread types may only be created from object types` (6 errors).**
Self-inflicted, and the fix is quick. The strip replaced `anchorAttrs(...)` with `{}` using a regex that
could not match nested parentheses, so a few call sites became malformed spreads. Find each `{...{}` and
delete the whole spread — with the provider gone it contributes nothing.

**3. `'ref' is declared but never read` (1 error).**
A `forwardRef` whose ref existed only so an anchor could reach the DOM node. Either drop the `forwardRef`
wrapper or prefix the parameter with `_`.

## Estimated remaining

**2–4 hours**, of which the render review in light and dark is the part worth spending time on. The
component already compiled clean before the strip and imports only `@bidezine/system`, so nothing here is
open-ended.

## The one rule for finishing this

**Do not re-open approved values.** The 26 distinct `px` values and the single `#1c2024` hex in this file
are already-approved decisions — 54px, 122px, 256px, 38px, 12px, 10px, 22px all have records. Tokenising
them is a legitimate follow-up; re-deciding them is how a two-hour job becomes another week.
