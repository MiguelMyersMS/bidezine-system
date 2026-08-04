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

## Rules that matter

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
