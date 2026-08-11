# Copilot instructions for @bidezine/system

This repo has an extensive, actively-maintained `CLAUDE.md` at the repo root — **read it first**. It is
the authoritative source for conventions, protocols, and a long list of hard-won failure classes
("Primitive Fidelity Checklist") found while porting components. This file is a short orientation map;
`CLAUDE.md` takes precedence if anything here seems to conflict with it.

## The one rule

`reference/shadcn-ui/` (vendored, read-only, MIT-licensed) is the **only** design source this project may
consult. Never import, edit, or ship anything from `reference/`. Never introduce a component look-alike
from any other design/icon system — see "Iconography" below for the equivalent icon rule.

## Build / typecheck (no test or lint scripts exist)

Run from repo root unless noted:

- `npm run tokens` — regenerate `src/styles/tokens.css` + `src/tokens.ts` from `tokens/*.tokens.json` (DTCG source).
- `npm run icons` — regenerate `src/icons/generated.tsx` from `icons/manifest.json`. Fails loudly if a manifest slug doesn't resolve against `@fluentui/svg-icons`.
- `npm run build` — `vite build` (runs `tokens`+`icons` first via `prebuild`). Emits `dist/` (JS + `.d.ts` + CSS) — this is what consumers (including `site/`) actually import.
- `npm run typecheck` — `tsc --noEmit` (also runs `tokens`+`icons` first via `pretypecheck`).
- `npm run site:dev` / `npm run site:build` — builds the library, then installs/runs/builds `site/` (a separate npm project with its own `package.json`, imports `@bidezine/system` like any real consumer — never reaches into `src/`/`reference/` directly).

There is no unit test suite and no lint script configured. Verification for this project is primarily
**visual/behavioral**: build the library and site, then check rendered output against
`reference/shadcn-ui/`'s own source/behavior (see "Verify by render, not by number" in `CLAUDE.md`).

CI (`.github/workflows/deploy-site.yml`) builds the library (`npm install && npm run build`) then the
site (`npm install && npm run build` in `site/`) and deploys `site/dist` to GitHub Pages on push to `main`.

## Architecture

- `tokens/*.tokens.json` → `scripts/build-tokens.mjs` → gitignored `src/styles/tokens.css` + `src/tokens.ts`. Tokens are **only** authored in `tokens/`; never hand-edit the generated CSS/TS.
- `icons/manifest.json` (symbol name → Fluent slug, or a `custom` derived SVG) → `scripts/build-icons.mjs` → gitignored `src/icons/generated.tsx` (one inline `<svg>` React component per icon, re-exported from `src/index.ts`). Icons are rendered as inline SVG (never `<img>`/CSS `background`) so `currentColor`/`fill` respond to theme and hover/press state.
- `src/ui/` — ported shadcn components, added one at a time. `src/index.ts` is the single export surface (tokens, `cn`, generated icons, then components) — nothing is usable downstream until it's exported there.
- `src/lib/action-icons.tsx` — shared hover/press/selected icon-fill wiring (`useActionIconFill`, `fillActionIcons`) driven by a primitive's `aria-pressed`/`isActive`-style prop. Generated icons carry an `isActionIcon = true` marker so this works reliably in production/minified builds (name-based fallback detection is unsafe under minification).
- `src/ui/scroll-area.tsx` — real port of shadcn's `ScrollArea`; its scrollbar is an absolutely-positioned overlay, not a layout-reserving sibling. `Command`, `DropdownMenu`, `ContextMenu`, `Combobox` deliberately compose it (a documented divergence from shadcn's own native-`overflow` source) with a conditional content gutter driven by the `useScrollAreaOverflow()` React Context hook — never a `group-data-*` Tailwind selector, which cannot express "nearest ancestor" and breaks when the same primitive nests.
- `dist/` — build output; the only thing real consumers (`site/`, downstream apps) import. Runtime deps (Radix, etc.) are externalized, not bundled, to avoid shipping duplicate React contexts.
- `site/` — separate Vite app (own `package.json`) that showcases/verifies components against shadcn's own rendering, deployed to bs.bidezine.systems.
- `limbo/` and `limbo-factory/` — holding area + dedicated dev environment (port 4199) for components mid-transformation from a foreign source, gated by the "Limbo protocol" documented in `LIMBO-PROTOCOL-LOG.md`. `limbo-factory/` is never merged into `dist/` or shipped.

## Key conventions

- **No hand-rolled components.** If a real `@bidezine/system` primitive exists (`Button`, `Badge`, `ScrollArea`, etc.), use it — never approximate its look with raw styled `<div>`/`<span>`/`<button>`, even in sandbox/tooling code (`limbo-factory/` included). This also applies to raw `overflow-y-auto` standing in for `ScrollArea`.
- **Icons: Fluent UI System Icons only** (`@fluentui/svg-icons`, regular style, 20px viewBox), authored via `icons/manifest.json`. Never import Lucide/Heroicons/FontAwesome/etc. Icon path data (`d`/`filledD`) must be copied verbatim from the real `.svg` file under `node_modules/@fluentui/svg-icons/icons/` — never reconstructed from memory/reasoning.
- **Tailwind must never scan `reference/`** — `src/styles/system.css` pins `source(none)` plus one explicit `@source`. Don't remove either.
- Light/dark parity is enforced at build time: a token defined in only one theme mode fails the tokens build rather than silently inheriting.
- `HANDOFF.md` (repo root) is a **live snapshot, never a log** — one section per machine (Laptop A, Laptop B, PC), each machine only ever edits its own section, always overwritten in place to describe current state (not appended to). Read it before starting work spanning multiple sessions/machines; update it in the same commit as the work it describes.
- `LIMBO-PROTOCOL-LOG.md` and other divergence logs are the opposite: **append-only** historical records — never delete or rewrite old entries there.
- See `CLAUDE.md`'s "Primitive Fidelity Checklist" before calling any change to a real primitive "done" — it documents specific, recurring failure classes (className merge conflicts, clipped focus rings, unverified interactive states, etc.) that passed casual review in the past.

## Licensing

shadcn/ui and Radix are MIT-licensed; `THIRD-PARTY-LICENSES.md` must stay. This project's own original work may be licensed separately.
