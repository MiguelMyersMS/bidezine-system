# Handoff — current state

Read `CLAUDE.md` first; it is 190 lines and it is the contract. This file is the live snapshot of
where things stand. It is overwritten in place, never appended to.

## Where the project is

**61 components in `src/ui/`** — the 60 shadcn primitives, ported in batches, plus `rail-sidebar`.
All exported from `src/index.ts`, all in `dist/`.

**The Sandbox is retired** (2026-08-15). `docs/PIVOT-2026-08-15.md` records why, what it cost, and
what was kept. **Do not rebuild it, and do not re-derive it from the git history.** The short version:
it priced one composition at four days when the target is ~200 components in three weeks.

**Next: ~140 compositions**, built from the verified primitives. Not ports — there is no foreign
source to reconcile against, and treating them as ports is what produced the four days.

## The contract, in full

1. Build from real primitives and real tokens. No hand-rolled markup, no raw hex, no magic numbers.
2. `npm run check-shipped` passes, plus `npx tsc --noEmit` and `node scripts/check-rules.mjs`.
3. **One human look at the rendered result, light and dark.** This is the gate.
4. Ship it.

No corpus, no divergence rows, no anchors, no per-claim evidence, no independent-review step. A design
decision gets asked in one sentence and recorded as a comment at the value.

## Running it

```
npm run build                     # the package -> dist/
npm run check-shipped             # builds, then verifies dist/system.css against every var() used
npm --prefix site run dev         # showcase on 4188
```

**After changing the package, RESTART 4188.** Vite dev inlines CSS through JS and does not notice that
a dependency's built stylesheet changed. This cost an hour: the rail rendered white on 4188 while the
production build was correct, because the dev server had cached `@bidezine/system/styles.css` from
before the tokens existed. `npm run check-shipped` catches the underlying class statically, in seconds,
with no server at all — prefer it over a browser for that question.

`npm --prefix site run preview` serves the production build, but it is pinned to 4188 too, so it and
the dev server cannot run together.

## rail-sidebar — what is done and what is not

**Done.** `src/ui/rail-sidebar.tsx`, exported, on the site at `/components/rail-sidebar` under
Navigation. Package and site build clean, `check-rules` 0 violations, `check-shipped` passes. Colours
default to `RAIL_SIDEBAR_COLORS`, which resolves all twelve values from real tokens — the ten
`--sidebar-rail-*` plus `--card`/`--border` from decisions C-1 and C-11. `colors` is still a prop, so a
consumer can override.

The raw-path icon factory was removed on the way in. It built icons from `d` strings and relied on a
runtime `.name` check that minification does not preserve, so every icon it produced silently stopped
filling on hover in production builds. Ten demo icons now use real generated Fluent components.

**Not done — the gate.** Nobody has reviewed it properly in both themes. Two things to look at first,
because they are what changed:

- **The overflow "More" menu.** It rendered inline and overlapping instead of as a floating popover on
  the stale dev server. That was probably the same missing stylesheet, but it has NOT been verified
  since the restart.
- **The panel tree icons**, ten of which were swapped. Check they read sensibly against their labels,
  and check hover-fill **in a production build** — that is the exact failure mode the old mechanism had.

**One open question that is a judgement call, not a bug.** The selected tree row ("Monthly") renders
solid black. It does that in the production build too, so it is not a staleness artifact — it looks
like the row using `--primary`, which is near-black in the light theme. Whether that is the intended
selected treatment is yours to decide.

## Parked, read-only — do not extend

`sandbox/`, the Fabric database, `origin/`, and the sandbox-era specs (`docs/SANDBOX-SPEC.md`,
`sandbox/REVIEW-CARD-SPEC.md`, `sandbox/LAYOUT.md`). They are the record of how the rail was ported.
Each carries a retirement banner. Nothing new should be written to any of them.

Known-inaccurate and deliberately not repaired: 12 corpus rows are marked `resolved` with no anchor,
so the staleness re-run can never reach them. Recorded in `docs/PIVOT-2026-08-15.md`; repairing them
fixes a display inside a system that is switched off.

## Kept because it earns its place

The `tokens/` pipeline and its light/dark parity gate · `scripts/check-rules.mjs` (CI, blocking) ·
`scripts/check-shipped-tokens.mjs` · `scripts/check-quarantine.mjs` · the 61 components.
