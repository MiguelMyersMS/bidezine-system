# Limbo Factory Line — Official Layout (frozen baseline)

> **Status: FINAL for now.** This is the layout as it stands after the Rail Sidebar occupant's Human
> Decisions phase was iteratively refined into its current shape. It is the template every future Limbo
> occupant's factory-line UI must follow. Further visual iteration will continue on top of this baseline —
> this document exists so that iteration never quietly drifts away from what's already been agreed, and so
> a new occupant's phase content slots into the existing shell instead of reinventing it.
>
> Lives at `limbo-factory/` (dev server on port 4199), reusable shell described in
> `LIMBO-PROTOCOL-LOG.md`. This file documents the *visual/structural contract* of that shell in detail;
> the protocol log documents the *process* (phases, gates, agent roles) the shell is tracking.

## 1. Top-level shell (`App.tsx` → `App`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ <aside> Factory line          │ <main>                                  │
│  (PhaseRail, w-[320px])       │  <header> phase title + description     │
│                                │  ─────────────────────────────────────  │
│  Intake / Dissection    Done  │  <phase content, fills remaining space> │
│  Human Decisions   In progress│                                         │
│  Transformation / Build       │                                         │
│  Escalation / Divergence-check│                                         │
│  Independent Audit            │                                         │
│  Final Human Review           │                                         │
│  Promotion into bidezine sys. │                                         │
│  Close out protocol log       │                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

- Root: `<div className="flex h-screen w-screen overflow-hidden">` — the whole app is exactly one
  viewport, no page-level scroll. Every scroll region is deliberately scoped (see §3/§4).
- **Left rail (`<aside>`)**: fixed `w-[320px] shrink-0 border-r bg-card`. Renders `PhaseRail` — a flat,
  single-level list of every phase a component moves through (Intake → Human Decisions → Build →
  Escalation-check → Audit → Final Human Review → Promotion → Close-out), each with a status `Badge`
  (`done` / `in_progress` / `pending` / `blocked`). **Never changes shape per-occupant** — it's fed a
  different `Phase[]` array, but the component itself (`components/PhaseRail.tsx`) is reused verbatim.
- **Main column (`<main>`)**: `flex min-w-0 flex-1 flex-col`.
  - `<header>`: `border-b px-6 py-4`. Shows a small uppercase eyebrow label (today: "Rail Sidebar" — this
    is the one hardcoded string that must become the new occupant's name), the active phase's `title` as
    an `<h1>`, and its `description` as body text. This header is the same for every phase — only its
    text content changes when a different phase is selected.
  - Content region: `min-h-0 flex-1 overflow-hidden`. Two cases:
    - **A phase with real content wired up** (today: only `human-decisions`) renders inside
      `<div className="h-full p-6">` — no outer scroll; the phase component owns its own internal scroll
      regions (see §2).
    - **A phase with no content yet** (`PlaceholderPhase`) is wrapped in a `ScrollArea` with
      `p-6 pr-8` (the extra right padding is the scrollbar gutter, see §5) and just explains it isn't
      wired up yet.

**Rule for new occupants:** do not add a new top-level shape. A new occupant either (a) reuses
`HumanDecisionsPhase`'s tab+quadrant pattern verbatim for its own "human decides divergences" phase, with
its own tab labels/data, or (b) if a later phase (Build, Escalation, Audit, Final Review, Promotion,
Close-out) needs real content for the first time, it should follow the same header + `min-h-0 flex-1
overflow-hidden` content-region contract as `human-decisions` does today, and pick whichever of §2's
patterns (tabs+quadrant, or plain scrolling content) fits that phase's actual content shape.

## 2. A phase's own content shell (`HumanDecisionsPhase`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Blocking (4)] [Color lab (10)] [Full list (13)] [Risks (9)]  [Origin/Adjusted] [🌓] │
│ ──────────────────────────────────────────────────────────────────── │
│                     <QuadrantLayout — see §3>                        │
└──────────────────────────────────────────────────────────────────────┘
```

- Root: `Tabs` (`flex h-full w-full flex-col gap-0`) — the phase's own sub-views live as tabs, not
  separate phase entries. Rail Sidebar's Human Decisions phase has 4: Blocking questions, Color token
  lab, Full divergence list, Notable risks.
- **Control row** (`-mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 border-b px-6 py-4`): bleeds
  negative margin to span the full content width edge-to-edge (cancelling the parent's `p-6`), with its
  own border-bottom as a divider — same pattern as the outer `<header>`. Left side: `TabsList` with one
  `TabsTrigger` per sub-view, count in the label (e.g. `Blocking questions (4)`). Right side: any
  per-phase controls, today two: a source toggle (`RailSourceToggle` — see below) and `ThemeToggle`
  (whole-app light/dark). **This is where per-phase controls belong** — not in the outer app header,
  which is reserved for the phase title/description only.
- **`RailSourceToggle`** is Rail Sidebar–specific (Origin vs. Adjusted — which version renders in the
  right-hand stage, see §3) but the *pattern* generalizes: any occupant that has both (a) a live embed of
  its real, never-changing origin source and (b) a bidezine-purifying mock that evolves with every
  decision, should offer the same two-button toggle, styled identically (`rounded-md border p-0.5`
  wrapper, each button `rounded-sm px-2 py-1`, active state `bg-muted text-foreground`, inactive
  `text-muted-foreground hover:text-foreground`).
- Each `TabsContent` wraps its tab's content in one `QuadrantLayout` (§3), passing the SAME
  `renderRailNav` render-prop to every tab — the right-hand stage is identical across all 4 tabs; only
  the left-hand content changes.

## 3. The two-column stage (`QuadrantLayout`)

```
┌───────────────────────────────┬───────────────────────────────────┐
│  LEFT — scrollable content     │  RIGHT — "the stage"              │
│  (cards, per-tab)              │  bg-card, rounded-lg, p-4          │
│  own ScrollArea, gutter pr-3   │  FillHeight measures & fills y-axis│
│                                 │  RailNavStatusPreview (or eq.)     │
└───────────────────────────────┴───────────────────────────────────┘
```

```tsx
<div className="grid h-full grid-cols-2 gap-6">
  <div className="h-full min-h-0 overflow-hidden">
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 pr-3">{children}</div>
    </ScrollArea>
  </div>
  <div className="flex h-full items-center justify-center overflow-hidden rounded-lg bg-card p-4">
    <FillHeight render={right} />
  </div>
</div>
```

- Exactly two equal (`grid-cols-2`) columns, `gap-6` between them, both `h-full` — **neither column
  scrolls the other; neither column ever scrolls the page.**
- **Left column** — the phase's actual decision content (cards, accordions, lists — whatever that tab's
  content component renders). Its own independent `ScrollArea`, `gap-4` between items, `pr-3` gutter
  reserved on the *content* div (not the `ScrollArea` itself) so Radix's absolutely-positioned overlay
  scrollbar thumb never overlaps the last few pixels of content (see §5).
- **Right column, "the stage"** — where the live example/comparison for this phase lives.
  `bg-card rounded-lg p-4`, centered (`flex items-center justify-center`), `overflow-hidden` (clips any
  child that briefly exceeds the box during a resize). Uses `bg-card` specifically (not `bg-muted`) —
  see §6 for why.
  - **No text or extra chrome belongs inside the stage** — only the example component itself. Per an
    explicit prior instruction: "just the example components have to be visible."
  - **`FillHeight`** (defined in `App.tsx`) measures the stage's actual available height (post-padding)
    via `ResizeObserver`/`useLayoutEffect` and calls `render(height)` once it has a real, non-zero
    measurement. This makes whatever's inside **fill the stage's y-axis exactly**, regardless of
    viewport size — never fixed-height content overflowing through the padding, never floating with
    extra gaps. Any new occupant's live-example component must accept a `height` prop the same way
    `RailNavStatusPreview`/`FullRailMock`/`OriginRailNavLiveAuto` do, defaulting to their old fixed value
    so other (non-stage) callers are unaffected.

**Rule for new occupants:** if a new phase/tab needs a "decide on the left, see the live result on the
right" layout, reuse `QuadrantLayout` exactly as-is — don't rebuild the grid, scroll areas, or stage
styling per-occupant. If a phase's content genuinely doesn't fit the two-column shape (e.g. a phase that's
just a single linear checklist with nothing to preview), it may skip `QuadrantLayout` entirely — but it
must still respect §5 (ScrollArea + gutter) and §6 (card-only elevation, no extra scrollbar chrome) for
whatever scroll region it does have.

## 4. Card content conventions (left column)

- Every content component in the left column (`BlockingQuestionCard`, `ColorTokenLab`'s per-token `Card`,
  `DivergenceCategoriesAccordion`'s row `div`s, `RisksList`'s per-risk `Card`) uses **plain elevation
  only** — the design system's own default `Card` styling (`border` + `bg-card` + `shadow-sm`), or for
  non-`Card` rows, the equivalent `rounded-md border bg-card p-3 shadow-sm` / `p-2` treatment.
- **No colored left-border accent bars, no full-card/full-row background tints/washes.** An earlier
  revision gave "resolved/approved" items a colored (`emerald`) `border-l-4` + a matching low-opacity
  background wash across the whole card, and "needs decision" items the same treatment in
  destructive-red. This was explicitly rejected — it read as a distracting banner effect, not a status
  indicator.
- **Status is conveyed by a small `Badge` pill only** (`lib/status-colors.ts`'s `POSITIVE_BADGE` /
  `WARNING_BADGE` / `NEGATIVE_BADGE`, plus the system's own `secondary`/`destructive` badge variants),
  e.g. "Resolved", "Needs your decision", "Open — R-1", "approved". The badge is the only place status
  color appears; the card/row around it is always the same neutral, plain-elevated surface regardless of
  status.
- A "Decided: …" / "Awaiting your decision …" sub-box inside a card (see `BlockingQuestionCard`) is a
  plain `rounded-md border bg-card p-3 shadow-sm` div — same rule, no color coding on the box itself.

## 5. Scrolling conventions

- All scrolling uses the design system's own `ScrollArea` (Radix-based) — never a raw
  `overflow-y-auto` div, and never a browser-native scrollbar. This is a hard rule, not a style
  preference: it's the only scrollbar in the whole app that matches bidezine's tokens.
- Radix's `ScrollAreaScrollbar` is **absolutely positioned** (an overlay), so it always sits on top of
  content unless the consumer reserves space for it. **Always add a right-side gutter on the content div
  inside the `ScrollArea`** — `pr-3` for the quadrant's left column, `pr-8` for `PlaceholderPhase`'s wider
  padding context. Pick whatever value keeps the thumb clear of the last visible pixel of real content;
  don't rely on the default overlay behavior.

## 6. Color/token conventions

- **Stage background (`bg-card`)**: in dark mode, `--card`/`--popover`/`--sidebar` all resolve to
  `oklch(0.205 0 0)` ≈ `#171717` — the closest existing token to a "true dark UI surface" tone (deliberately chosen over `--muted`'s `oklch(0.269 0 0)` ≈ `#262626`, which read as too light/flat for
  this purpose). Always derive stage/surface backgrounds from a real token in
  `src/styles/tokens.css` — never an arbitrary hex, even to hit a specific look a screenshot or another
  tool uses. If a specific hex is requested, find the closest existing semantic token and use that.
- **Origin embeds must not carry their own opaque page background.** `OriginRailNavLive.tsx`'s iframe
  document sets `background: transparent` (not the vendored default), so a live-embedded origin
  component sits flush against the stage's own background in both themes, instead of showing a mismatched
  bright rectangle behind it. Any future "live embed of a real original component" should do the same —
  the embedding shim's own canvas background is chrome we control, not part of the vendored component,
  and should always be transparent.
- Toggle-button active/inactive states (`RailSourceToggle`, tab triggers) use `bg-muted`/
  `text-muted-foreground` — a genuinely different token from the stage's `bg-card`, used deliberately for
  small interactive chrome vs. the large stage surface.

## 7. What must never change per-occupant

- `PhaseRail` and the phase list shape (§1) — reused verbatim, only fed different `Phase[]` data.
- The outer app shell's `<aside>`/`<main>` split, and `<header>`'s title+description contract (§1).
- `QuadrantLayout`'s grid, `ScrollArea`+gutter pattern, and stage styling (§3, §5, §6) — reused verbatim
  by any phase that needs a "decide left / preview right" layout.
- The plain-elevation-only card rule and badge-only status coloring (§4) — applies to every card/row in
  every phase, not just Rail Sidebar's.
- The `height`-filling contract for whatever renders in the stage (§3's `FillHeight`) — any live-example
  component placed in the stage must accept and honor a `height` prop the same way.

## What's expected to change per-occupant

- The phase-rail's `Phase[]` data and the header's eyebrow label (currently "Rail Sidebar").
- The tab labels/count and the actual left-column content components for each tab — a new occupant will
  have its own blocking questions, its own divergence categories, its own risks, possibly its own
  Color-Token-Lab-equivalent if it has color divergences at all.
- The specific live-example component rendered in the stage (Rail Sidebar's `RailNavStatusPreview`) — a
  new occupant brings its own, but it must still accept `height` and render inside the same stage
  container unchanged.
- Whether a source-toggle (`RailSourceToggle`-equivalent) is even needed — only relevant for occupants
  that have both a live vendored-original embed and an evolving bidezine mock to compare.
