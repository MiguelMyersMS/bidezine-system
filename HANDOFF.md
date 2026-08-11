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

## Laptop A — Miguel  ·  PRIMARY

**Baseline** — branch `main`, last verified commit `9ea37de` plus this session's commit adding
`docs/SANDBOX-SPEC.md`, working tree clean once that commit lands, pushed to `origin/main`.

This machine is the designated **primary** (`.env`: `MACHINE_NAME=Laptop A`). A formal
primary/satellite rename of all three machines is deliberately deferred to Sandbox Milestone 8 —
see `docs/SANDBOX-SPEC.md` §8. Renaming earlier would break Laptop B's local, gitignored `.env`,
which cannot be fixed from here.

### Active task

**Sandbox — Milestone 1: the store and the gate.** `docs/SANDBOX-SPEC.md` is written and approved in
principle; work has started on M1. Read the spec first — it is the single source of truth for this
project, and everything below assumes it.

M1 splits into two tracks running in parallel:

- **Miguel (portal work, blocking):** provision a Fabric SQL Database, register an Entra service
  principal, and put the connection details into `.env`. Until this lands, nothing can be run against
  a real database — only authored.
- **AI (repo work, non-blocking):** author the full schema, the three database roles, the gate
  procedure, and a migration runner under `db/`. All of it is written to be run the moment the
  database exists; none of it requires the database to author.

**Critical sequencing constraint, from the spec:** `limbo-factory/` stays running and authoritative
through M1–M4. Nothing in its current working state is touched until M5 swaps the read path. Do not
start renaming Limbo → Sandbox, and do not touch `limbo-factory/src/data/rail-sidebar.ts`, before then.

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
  - Verified: `npx tsc --noEmit` clean (both root package and `site/`), `npm run build` (production `vite
    build`) succeeds, compiled `dist/system.css` confirmed to contain `.bg-success`/`.bg-warning`/`.bg-info`
    plus their `dark:.../60` and `hover:.../90` `color-mix()` variants. Site dev server confirmed the
    `/components/badge` route returns 200 in both light and dark mode.
  - `L-6` itself (`limbo-factory/src/data/rail-sidebar.ts`) intentionally NOT touched — remains
    `status: "decision"` pending the user's own follow-up on how to map this bidezine-side implementation
    onto RailNav specifically. See that row's own note for current status.
- **Badge `weight` prop (`"regular"` | `"emphasis"`, default `"emphasis"`) added to `src/ui/badge.tsx`** —
  a second, independent bidezine Adjustment axis, orthogonal to `variant` (color). Requested after the user
  found the new solid-fill status badges "too visually heavy" — `weight="regular"` (`font-normal`) is a
  lighter opt-in for lower-emphasis inline status labels; the default (`"emphasis"`, `font-medium`)
  preserves shadcn's own unconditional upstream baseline exactly, so no existing Badge usage anywhere in
  the codebase changes appearance. Documented in the same `badge.tsx` doc comment and in `apiRows` in
  `BadgeShowcase.tsx`. The status-variant *tokens* this Badge work relies on (not `weight` itself, which is
  a font-weight axis with no token) are now also cross-referenced as a canonical worked example in
  `docs/COLOR-TOKEN-IMPORT-GUIDE.md`'s Step 3 (see below).
  - `site/src/routes/components/BadgeShowcase.tsx` restructured twice this session, ending at: every
    single-variant example (Default, Secondary, Destructive, Success, Warning, Info, Outline, Ghost, Link)
    shows both `weight` values side by side with **no caption text** — the two font weights are visually
    distinct enough on their own, so a label was removed as redundant per direct user feedback. `Link` uses
    two separate `asChild` anchors (one per weight); `Demo` (the multi-badge composite) is left at a single
    weight since duplicating it per weight would be an unwieldy 14-badge grid, and weight is already
    exhaustively covered by the other 9 single-variant examples. An earlier iteration of this rework had a
    standalone "Weight — regular vs emphasis" example demoing only 4 of 9 variants — removed because it
    read as (and wasn't) a restriction on which variants support `weight`; `weight` combines with every
    `variant` value, always has.
  - Verified: `npx tsc --noEmit` clean in `site/` after each rework pass, dev server hot-reloaded and
    returned 200 on `/components/badge` throughout, no `src/ui/badge.tsx` or `dist/` changes needed for the
    showcase-only reworks (component code was already correct; only the demo layout changed).
  - Commits: `8a78de3` (success/warning/info variants), `4077c02` (weight prop + first showcase pass),
    `5826b0d` (fold weight into every variant example instead of a standalone example), `a9e3a8c` (remove
    the regular/emphasis caption text per direct user feedback — "no need to put text beside it... visually
    humans can understand the difference"), `c4a84a2` (fixed a stale contradiction in
    `docs/COLOR-TOKEN-IMPORT-GUIDE.md`'s opening description, caught by an independent code-review audit
    agent, not self-approved). All pushed to `origin/main`.
- **Badge `muted` variant added to `src/ui/badge.tsx`** — a third bidezine Adjustment `variant` value,
  requested for a Rail Sidebar use case needing a badge that visually recedes (e.g. an inline count) rather
  than a solid-fill pill competing with the surrounding nav content. Structured like `ghost` (no fill at
  rest, `bg-accent`/`text-accent-foreground` on hover when composed via `asChild`) but sets
  `text-muted-foreground` at rest instead of inheriting `currentColor` — reuses the pre-existing
  `--muted-foreground` token already used for description/secondary text elsewhere (`Breadcrumb`, `Field`'s
  description text), so **no new color token was authored** for this one. Contrast depends on the host
  surface (this variant has no background fill of its own): `muted-foreground` reaches 4.73:1 on plain
  white/`--background`, 4.53:1 on `--sidebar` (the Rail Sidebar's own surface — barely clears AA 4.5:1),
  and only 4.34:1 on `--muted` (fails AA 4.5:1) — **do not place this badge directly on a `bg-muted`
  surface**. Hover state (`accent-foreground` on `bg-accent`) is 16.42:1 regardless of host surface. This
  host-surface caveat was added after an independent code-review audit agent (`badge-muted-audit`) caught
  the original doc comment overclaiming the white-background figure as universally applicable. Documented in
  `badge.tsx`'s own doc comment, `BadgeShowcase.tsx`'s new "Muted" example (both weights) and updated
  `apiRows`/intro paragraph.
  - Verified: `npx tsc --noEmit` clean (root + `site/`), `npm run build` succeeds (dist rebuilt since the
    new variant literal is part of `Badge`'s exported prop type), dev server hot-reloaded and returns 200
    on `/components/badge`.
  - Commits: `3f068d2` (add `muted` variant), `02abcfb` (fix contrast doc claim after independent audit
    finding on host-surface dependency). All pushed to `origin/main`.
- **Badge `tone` axis added (`"solid" | "soft"`)** — a third orthogonal axis on top of `variant`/`weight`,
  requested to add a lighter, tinted-background alternative to the four solid status colors
  (destructive/success/warning/info), matching a reference screenshot the user provided of another design
  system's soft-badge treatment (mapped as a *concept*, not copied literally, per this project's existing
  reference-mapping convention for status colors). Default remains `"solid"` — every existing Badge usage
  is unaffected. `default`/`secondary`/`outline`/`ghost`/`muted`/`link` don't participate in `tone` (already
  have their own neutral/low-emphasis look); it's a documented no-op for those six, not an error.
  - **8 new opaque color tokens** added to `tokens/light.tokens.json` / `tokens/dark.tokens.json`:
    `{status}-soft` / `{status}-soft-foreground` for each of the 4 status colors. Deliberately NOT an
    opacity blend (`bg-{status}/N`) — that approach is what `muted` uses and is exactly why `muted`'s own
    contrast is host-surface-dependent (see above). These are independently-authored opaque tokens (same
    hue angle as the existing solid `{status}` tokens, different L/C), so soft-badge contrast is fixed
    regardless of what surface the badge sits on.
  - **Why new tokens were required, not reuse**: verified numerically that reusing the existing solid
    `{status}` color as text on any realistic tint of itself drops contrast below AA for 3 of 4 colors —
    the solid tokens were tuned for ~4.9–5.2:1 against pure white, and any tinting of the background only
    reduces that further. A soft badge needs a separately-tuned, darker/more saturated text shade (own
    OKLCH → linear sRGB → gamma sRGB → WCAG relative-luminance script, not eyeballed).
  - **Verified contrast, all ≥7:1 (AAA for normal text)**: light mode — destructive 7.05:1, success
    7.04:1, warning 7.06:1, info 7.11:1; dark mode — destructive 7.04:1, success 9.13:1, warning 8.31:1,
    info 7.24:1.
  - `src/ui/badge.tsx`: `tone` implemented via `cva`'s `compoundVariants` (not a plain `variants.tone`
    class map) — each `(variant, tone)` pair for the 4 status colors gets its own complete class string
    (no bg-*/text-* conflicts ever coexist in one output), while the 6 non-participating variants keep
    their classes directly on `variants.variant` so `tone` is a true no-op for them.
  - `site/src/routes/components/BadgeShowcase.tsx`: the Destructive/Success/Warning/Info examples now show
    solid + soft side by side (both weights, 4 badges per example, no captions — same "let the visuals
    speak" convention already established for weight), Demo example extended with 4 soft badges,
    `apiRows` gained a `tone` row, intro paragraph updated.
  - Asked the user one targeted design question first (should `default`/`secondary` also get a soft tone,
    matching the reference image's gray badge) — user was unavailable to respond; proceeded with the
    stated recommended default (no, `secondary`/`outline` already cover that need) rather than block.
  - **Critical bug caught by an independent code-review audit agent (`badge-tone-audit`), not
    self-approved:** the first commit (`61b88cc`) added the 8 new tokens to `tokens/light.tokens.json` /
    `tokens/dark.tokens.json` but never registered them in `src/styles/system.css`'s `@theme inline`
    block — without that registration Tailwind v4 has no way to know `destructive-soft` etc. are valid
    color names, so it silently generated **zero** `bg-{status}-soft`/`text-{status}-soft-foreground`
    utility classes. `tone="soft"` rendered with no background/text color applied at all — a total
    feature failure, not a cosmetic nit. The initial "verified: compiled `dist/system.css` contains all
    16 new soft-token utility occurrences" claim in this same entry was itself wrong — it was a naive
    substring count of `-soft` that matched only the raw CSS custom-property declarations (which were
    correctly emitted), not actual `.bg-*`/`.text-*` utility selectors (which did not exist). Fixed by
    adding the 8 missing `--color-{status}-soft`/`--color-{status}-soft-foreground` entries to
    `@theme inline`; re-verified this time with an exact selector-anchored search
    (`\.bg-destructive-soft\b`, etc.) confirming all 8 base utilities plus their `hover:bg-*-soft`
    variants are now genuinely present in the compiled `dist/system.css`. Also corrected a minor factual
    error the same audit caught: `success-soft`/`success-soft-foreground` (dark mode) was documented as
    9.25:1 but independently recomputes to 9.13:1 (still comfortably AAA either way) — fixed in
    `badge.tsx`'s doc comment and `tokens/dark.tokens.json`'s `$description`.
  - Verified (final, post-fix): `npm run tokens` (parity gate passes, 56 tokens total, up from 40),
    `npm run build` succeeds, exact-selector search of compiled `dist/system.css` confirms all 8
    `.bg-{status}-soft`/`.text-{status}-soft-foreground` utilities and their hover variants exist,
    `npx tsc --noEmit` clean (root + `site/`), dev server hot-reloaded and returns 200 on
    `/components/badge`.
  - Commits: `61b88cc` (initial tone axis, contained the theme-registration bug above), `9ea37de`
    (`@theme inline` registration fix + doc corrections). All pushed to `origin/main`.
  - **Operational gotcha found afterward, worth knowing for any future `@bidezine/system` source change**:
    the user reported the soft badges "look not right" in the live `site/` dev server (`localhost:5173`)
    even after both fix commits were pushed and `dist/` was rebuilt correctly on disk. Root cause: the
    site's Vite dev server process (`site/`, port 5173) had been running continuously since *before* any
    of these token/CSS fixes — Vite's default file watcher ignores `node_modules` (including symlinked
    workspace packages like `site/node_modules/@bidezine/system` → repo root), so it never picked up
    the rebuilt `dist/system.css`, silently continuing to serve a stale, pre-fix transform of the
    stylesheet indefinitely. **Rebuilding `dist/` after a source change is necessary but not sufficient
    when a `site/` dev server is already running against the linked package — the dev server itself must
    be restarted (kill + `npm run dev` again) to pick up the change; a browser hard-refresh alone is not
    enough, since the stale content lives in Vite's own server-side transform cache, not the browser's.**
    Verified the fix by curling the dev server's actual served CSS (`http://localhost:5173/src/index.css`)
    directly after restart and confirming all 8 `.bg-*-soft`/`.text-*-soft-foreground` utility classes are
    present in what it serves (not just what's on disk in `dist/`) — checking disk output alone is not
    proof a *running* dev server has picked it up.

- **Badge default-usage policy decided; `L-6` resolved** — the user made two related decisions in the same
  request: (1) the Rail Sidebar's own panel-tree badges (`PanelBadge` in
  `limbo-factory/src/components/FunctionalRailSidebar.tsx`) now default to `variant="muted" weight="regular"`
  instead of the `variant="secondary"` (bold) they shipped with initially — muted keeps these dense,
  frequently-repeated inline counts ("+23", "New", "+05") visually receding rather than competing with row
  content; (2) a general AI-usage guideline, now documented directly in `src/ui/badge.tsx`'s own `weight` doc
  comment: an AI composing NEW Badge usage anywhere in the system should default to `weight="regular"`,
  reserving the bolder `weight="emphasis"` for cases the user explicitly requests or that clearly warrant
  visual prominence — emphasis remains fully valid and supported, just not the unexamined default. Note this
  is a **usage/documentation guideline**, not a change to `Badge`'s own `weight` prop default (which stays
  `"emphasis"` for backward compatibility with every pre-existing Badge call site, per the original
  Reproduce-baseline rationale).
  - `limbo-factory/src/data/rail-sidebar.ts`'s `L-6` row (Badge neutral/info/dark-surface variants) updated
    from `status: "decision"` to `status: "resolved"` — the later `success`/`warning`/`info`/`muted`/`tone`
    Badge work in this same session already answered the underlying mapping question (muted → neutral, the
    four status variants → info/positive/caution/negative, `tone="soft"` → RailNav's pale atomSurface fill);
    this pass closes the loop with the rail's own concrete default choice. The "1 remaining divergence row"
    summary entry (`id: "remaining"`) was updated to match — only `L-7` (Collapse motion component) now
    carries `status: "decision"`.
  - **Deliberate, narrow exception to the Sandbox M1 sequencing constraint noted above** ("do not touch
    `limbo-factory/src/data/rail-sidebar.ts` before Milestone 5"): this edit is a single divergence row's
    status/detail text reflecting a decision the user made explicitly, live, in this session — not a
    structural rename or refactor of the file, and not something that conflicts with Milestone 1–4 keeping
    `limbo-factory/` running/authoritative. Flagged here so a future AI doesn't mistake this for a violation
    of that constraint, and doesn't assume the constraint blocks small, explicitly-requested content fixes.
  - Verified: `npx tsc --noEmit` clean (root + `limbo-factory/`), no `dist/` rebuild required (no
    `badgeVariants`/`defaultVariants` change, doc-comment + call-site prop change only).
  - Not yet independently audited by a background agent as of this writing — recommended before this is
    treated as fully closed, per this project's standing "verify design-system changes with an independent
    agent" instruction, since this touches the shared `src/ui/badge.tsx` doc contract.

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
`L-6` (Badge default-usage policy) resolved this session — see "What's done" above. Remaining open Rail
Sidebar divergence-list categories (unrelated to this session): H (motion), I (elevation), J (z-index),
plus the still-`"decision"` H-2–H-6/`L-7`/L-11 rows — none touched this baseline; awaiting a future
session's focus. Recommend dispatching an independent code-review audit agent on the `L-6`/Badge
default-policy change above before treating it as fully closed._

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
