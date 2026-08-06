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

## Verify by render, not by number

A value can compute correctly and still not appear. Check the rendered result, not just the property.
This has caught more real defects here than any amount of reading.

## Three machines, one branch

Laptop A, Laptop B, and a PC all work `main` directly. `origin` is the only source of truth — unpushed
work does not travel.

**Pull when you sit down · push when you get up · commit small and often.**
Work room-by-room: one person per file.

## Attribution

shadcn/ui and Radix are MIT-licensed. `THIRD-PARTY-LICENSES.md` stays. We may license our own work as we
choose; the third-party notice covers their portions.
