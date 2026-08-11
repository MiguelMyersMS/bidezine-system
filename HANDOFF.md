# Handoff — current state only

> **This file is a live snapshot, not a log.** It is overwritten in place, never appended to. If you are
> an AI picking up work in a new/replacement chat, read this file first, then verify every claim in it
> against the real repo state (git log, git status, live code) before acting — never trust this file (or
> any prior chat transcript) blindly. See `CLAUDE.md`'s "Handoff protocol" section for the full rules
> this file follows.

> **One section per machine — only ever edit YOUR OWN.** Laptop A, Laptop B and the PC each own exactly
> one section below. Never edit, summarise, tidy or "fix" another machine's section, even when it looks
> stale — you cannot verify another machine's working tree from here, and overwriting it destroys the
> only record that machine has. If you need something from another machine, message its operator. Read
> every section (they tell you what the others are touching, so you can stay out of the same files), but
> write to one.
>
> **Keep the `---` dividers.** They are not decoration: they hold each machine's block far enough apart
> in the file that git merges concurrent edits automatically instead of raising a conflict on the one
> file every session is required to touch.

---

## Laptop A — Miguel

**Baseline** — branch `main`, last verified commit `718834c` (L-3/L-4/L-11 resolution), working tree
currently has uncommitted changes for the Badge status-variant work below — not yet committed/pushed.

### Active task

_Badge status variants (L-6 groundwork) — implementation complete, verified, awaiting final commit._
See the new "What's done" entry below for full detail. Not yet committed to `main`.

### What's done (current state — not a history)

- **Badge status variants (`success`/`warning`/`info`) added to the real `src/ui/badge.tsx`** — a
  bidezine Adjustment (not a shadcn port; shadcn's own upstream `badge.tsx` has no status-badge concept),
  requested by the user ahead of resolving Rail Sidebar's own `L-6` row (which maps this onto RailNav
  specifically — deferred separately, not touched here).
  - New tokens `success`/`success-foreground`, `warning`/`warning-foreground`, `info`/`info-foreground`
    authored fresh in OKLCH in `tokens/light.tokens.json` + `tokens/dark.tokens.json` (light/dark parity
    verified via `npm run tokens`), wired into `src/styles/system.css`'s `@theme inline` block. Colors are
    NOT copied from `limbo-factory/src/reference/origin-design-system/tokens.ts` (deliberately, per
    "no contamination") — only the *concept* (positive/caution/informational semantic pill) was mapped;
    hue/lightness/chroma were authored independently and verified for WCAG AA contrast against white text
    in light mode (success 4.94:1, warning 4.91:1, info 5.17:1 — all above the 4.5:1 threshold, matching
    `destructive`'s own 4.76:1).
  - `badge.tsx`'s `cva` recipe mirrors the existing `destructive` variant exactly (solid `bg-{status}` +
    hardcoded `text-white`, `dark:bg-{status}/60` opacity blend) for consistency with bidezine's own
    solid-fill badge convention — deliberately NOT origin's subtle/pastel-fill convention. No `neutral`
    variant added; `secondary`/`outline` already cover that need.
  - Also added `text-ellipsis` to the base recipe (alongside the pre-existing `overflow-hidden
    whitespace-nowrap`) so long badge text truncates gracefully instead of hard-clipping.
  - Full rationale, accessibility contract (color-not-alone guidance, focus-visible/tab-order behavior,
    truncation, minimum-size), and explicit non-adoption notes are documented directly in `src/ui/badge.tsx`'s
    own doc comment above `badgeVariants`.
  - `site/src/routes/components/BadgeShowcase.tsx` updated with Success/Warning/Info demo entries, updated
    API table, and a note explaining this is an Adjustment.
  - Verified: `npx tsc --noEmit` clean (both root package and `site/`), `npm run build` (production `vite
    build`) succeeds, compiled `dist/system.css` confirmed to contain `.bg-success`/`.bg-warning`/`.bg-info`
    plus their `dark:.../60` and `hover:.../90` `color-mix()` variants. Site dev server confirmed the
    `/components/badge` route returns 200. **Not yet visually reviewed by the user in a live browser** —
    recommend a quick look at `/components/badge` in both light and dark mode before treating the exact
    hue/lightness choices as final (same "Color Token Lab" sign-off precedent used for the Rail dark-token
    work).
  - `L-6` itself (`limbo-factory/src/data/rail-sidebar.ts`) intentionally NOT touched — user said they'll
    decide how to approach it only after reviewing this bidezine-side implementation.

- Rail Sidebar panel resize (`react-resizable-panels`) ships with correct shadow clearance on all four
  sides and no height regression (L-35/L-36/L-37, see `limbo-factory/src/data/rail-sidebar.ts` and
  `LIMBO-PROTOCOL-LOG.md` Update 9/10).
- Factory-line preview stage (`limbo-factory/src/App.tsx`) anchors the Rail+Panel composite
  (`justify-start`) instead of centering it, fixing the Rail being almost entirely clipped (L-38, see
  `limbo-factory/src/data/rail-sidebar.ts` and `LIMBO-PROTOCOL-LOG.md` Update 11). User-confirmed live.
- **M-6/M-7/M-8 approved and shipped, plus three follow-on bugs (M-20/M-21/M-22) found and fixed while
  trying M-7 live — all six `status: "resolved"` in `limbo-factory/src/data/rail-sidebar.ts`.**
  - **M-6** (rail overflow budget): new `limbo-factory/src/hooks/useOverflowFit.ts` — an explicit,
    ResizeObserver-driven contract (author-provided row selector, hard `maxVisible` ceiling, currently
    `RAIL_MAX_VISIBLE_SECTIONS = 12`, raised from an initial `7` per direct user follow-up). Overflow
    items go to the "More" menu, never truncate/scroll on the rail track itself (icon-only, `sr-only`
    labels); the overflow menu's own scrolling is already free via `DropdownMenuContent`'s composed
    `ScrollArea`.
  - **M-7** (panel resize): real bidezine `Resizable` primitive (`src/ui/resizable.tsx`) replaces the
    hand-rolled mousedown/mousemove drag — directly fixes the user's concern that the old approach was
    "only visible for sandbox, useless in production." The invisible filler panel is replaced by a real,
    visible `adjacentContent` panel prop (with a placeholder fallback). The `PANEL_SHADOW_INSET` padding
    workaround that doubled as the visual rail-to-panel gap is reversed — restored to an honest
    `RAIL_PANEL_GAP = 8` flex gap, per explicit user request.
  - **M-8**: no Sidebar-naming conflict to resolve now — deferred by design; `Sidebar` gets revamped to
    borrow Rail Sidebar's proven patterns only AFTER Rail Sidebar promotes out of Limbo.
  - **M-20**: `adjacentContent` was disappearing entirely (not just shrinking) whenever the browsing
    panel closed — a `Presence` wrapping the whole `ResizablePanelGroup` instead of just the browsing
    panel's own animated surface. Fixed with `Presence` scoped inward + `react-resizable-panels`' real
    `collapsible`/`collapsedSize={0}`.
  - **M-21**: live Playwright measurement (real `getBoundingClientRect`, not a screenshot) found M-20's
    fix was correct but nearly invisible, because a separate pre-existing bug broke the outer `w-full`
    width chain in the preview harness (`FunctionalRailSidebar`'s outer row + both `FullRailPreview.tsx`
    mount wrappers had no width class). Also fixed: the resize handle now hides once the browsing panel
    is genuinely collapsed (`isBrowsingPanelCollapsed`, driven by the panel's own `onResize`, not the
    instantly-flipping `openPanel` flag).
  - **M-22**: user reported the collapsed-state gap still looked too large. Live measurement disproved
    the user's own "leftover resize handle" hypothesis (M-21 held, handle genuinely gone) — real cause
    was `AdjacentContentPlaceholder`'s unconditional `p-4` (16px) stacking on the real 8px
    `RAIL_PANEL_GAP` (24px total). Fixed via a `collapseLeftInset` prop zeroing `paddingLeft` with an
    inline `style` (not a `pl-0` class — per the established M-18/M-19 cascade-tie lesson). `8` was then
    explicitly clarified by the user as this sandbox's own stand-in value, not a universal design-system
    constant — restated directly in `RAIL_PANEL_GAP`'s own doc comment.
  - Full rationale + live-measured before/after numbers for all six: `limbo-factory/src/data/rail-sidebar.ts`
    and `LIMBO-PROTOCOL-LOG.md` Update 19 (append-only). `npx tsc --noEmit` and `npm run build`
    (production `vite build`) both verified clean in `limbo-factory` after every change.
  - Rollback point if any of this needs reverting: git tag `checkpoint-pre-m6-m7-primitives`.

### What's next

_Nothing queued. M-6/M-7/M-8/M-20/M-21/M-22 are fully resolved and merged to `main`. M-8's own
follow-through action (revamping the existing `Sidebar` primitive to borrow Rail Sidebar's patterns) is
explicitly deferred until AFTER Rail Sidebar itself finishes promotion out of Limbo — not queued yet.
Remaining open Rail Sidebar divergence-list categories (unrelated to this session): H (motion), I
(elevation), J (z-index), L (one open item), plus the still-`"decision"` H-2–H-6/L-6/L-7/L-11 rows — none
touched this baseline; awaiting a future session's focus._

### Open questions / blockers

_None._

---

## Laptop B — Blair

**Baseline** — branch `main`, last verified commit `a984c7b`, working tree clean and pushed to `origin/main`.

### Active task

_None. Nothing in progress._

### What's done (current state — not a history)

- **A-6 clear (X) button** shipped in two places: `CommandInput` (`src/ui/command.tsx`) gains a trailing
  clear button (reserved 24×24 `icon-xs` slot, hidden via `aria-hidden`/`tabIndex={-1}`/`invisible` so
  there's no layout shift, clears via the native `<input>` value setter + dispatched `input` event, `Escape`
  clears first and `stopPropagation()`s so it doesn't bubble into a parent `CommandDialog`); and a new
  general-purpose `SearchInput` primitive (`src/ui/search-input.tsx`, exported from `src/index.ts`, built
  from `InputGroup`/`InputGroupAddon`/`InputGroupInput`/`InputGroupButton`, showcased at
  `site/src/routes/components/SearchInputShowcase.tsx`). `SearchInput`'s `className` prop sizes the outer
  `InputGroup` (the actual visible box); `inputClassName` targets the inner `<input>` only. Verified:
  root+`site/` typecheck/build clean, hover→filled icon swap confirmed live via Playwright against both dev
  server and a real production/minified `vite preview` build, disabled-state propagation confirmed live.
- **Rail Sidebar Limbo transformation (`limbo-factory/`) — category F ("Layout / Sizing") fully closed.**
  All 11 rows (F-1 through F-11) are `status: "resolved"`, the first category in the divergence list to
  reach a full, uniform resolved state. Key resolutions: F-3 (`panelW` default 256px/min 240px,
  cross-checked against `min-w-60`), F-4 (`panelGap` 8px, cross-checked against `SidebarInset`'s own
  `m-2`), F-5/F-6 (unified ALL nav row heights — rail buttons, panel-tree rows/groups at every nesting
  depth, footer icons — to a single `h-8`/32px, eliminating three previously-separate row-height numbers so
  the rail and panel read as one consistent system regardless of depth), F-7 (footer 3-icon cap: the
  `122px` `FOOTER_MAX_HEIGHT` was genuinely NOT wired into code before this work — now implemented via
  `overflow-hidden` + inline `maxHeight` on the footer's flex column, derived from bidezine's own real
  `size-[38px]` rail buttons + `gap-1` spacing, not copied from origin's literal), F-8/F-9/F-11 (panel
  min-width, derived item-slot sizing, footer bottom-anchoring — all confirmed live in code, no changes
  needed), F-10 (rail must fill its container's height — a documentation-only deployment note confirming
  the real Build should use `h-full`/CSS sizing rather than the preview-tool-specific measured-height prop
  `limbo-factory`'s own `App.tsx`/`FillHeight` uses; no code change needed in `limbo-factory` itself). Full
  rationale for every row: `limbo-factory/src/data/rail-sidebar.ts` (rows F-1–F-11) and
  `LIMBO-PROTOCOL-LOG.md` (Updates 12–18, append-only). `CLAUDE.md`'s Primitive Fidelity Checklist item 26
  gained a fourth verification axis: an approved divergence-row CONCEPT is not the same as it being wired
  into real code — always re-check the live component source when a row moves to `"resolved"` (this caught
  F-7's implementation gap). Remaining open categories in the Rail Sidebar divergence list: H (motion), I
  (elevation), J (z-index), L (component gaps, 1 open item), M (naming/API conflicts) — 12 rows total, none
  touched this baseline.
- **Machine-identity protocol added**: `.env.example` now documents `MACHINE_NAME`/`MACHINE_OWNER`; the
  `SessionStart` hook in `.claude/settings.json` prints this machine's `HANDOFF.md` identity automatically;
  `CLAUDE.md`'s Recovery workflow gained a step 0 covering it. This machine's `.env` is set to
  `MACHINE_NAME=Laptop B` / `MACHINE_OWNER=Blair`.

### What's next

_Nothing queued. Awaiting new instructions._

### Open questions / blockers

_None._

---

## PC — third machine

_Not connected yet. Leave this section as-is until the machine is set up._

Setup notes for whoever brings it online:

- Cloning the repo brings the shared machinery with it — `.claude/settings.json` (the start-of-day,
  checkpoint and end-of-day hooks), skills, agents and commands all travel through git.
- Two things do **not** travel and must be done by hand on that machine:
  1. **`.env`** — copy `.env.example` to `.env` and fill it in. Generate a **new** Cloudflare API token
     for this machine at `dash.cloudflare.com/profile/api-tokens` rather than copying an existing one, so
     it can be revoked alone and the audit log stays per-machine. `CLOUDFLARE_ACCOUNT_ID` is not a secret.
     `FIGMA_API_KEY` is a personal token — each person generates their own.
  2. **VS Code `git.autofetch`** — set it to `true` (Settings → search `git.autofetch`). Without it the
     status bar never shows the ↓ arrow when another machine has pushed.
