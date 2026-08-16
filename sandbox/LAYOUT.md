> # RETIRED — 2026-08-15
>
> **This document describes the Sandbox verification system, which is no longer in use.** It is kept
> as the record of how `rail-sidebar` was ported, not as instructions. Nothing here should be built,
> extended, or treated as current.
>
> The reason, the measured cost and what replaced it are in `docs/PIVOT-2026-08-15.md`. The current
> contract is `CLAUDE.md` — 190 lines, four steps.
>
> If you are an AI reading this to decide what to do next: you are in the wrong file. Read
> `CLAUDE.md` and `HANDOFF.md`.

# Sandbox - Current Layout Contract

> **Status: current working contract, not frozen.** This document is the source of truth for the
> reusable Sandbox UI in `sandbox/` (dev server: `localhost:4199`). The content and
> examples will change per occupant, but the main shell, phase structure, spacing model, and process
> affordances should stay consistent unless they are deliberately changed here and in code together.
>
> When the layout changes, update this file in the same change. Remove or rewrite old behavior instead
> of leaving conflicting historical instructions behind.

## Purpose

The factory line is a reusable transformation tracker for components moving out of the Sandbox and into
`bidezine/system`.

For each occupant, the UI should preserve:

- a stable phase rail on the left,
- a stable phase header on the right,
- a stable per-phase content shell,
- a two-segment working area when the phase needs "decide on the left, preview on the right",
- neutral card surfaces with status shown by badges, not colored card backgrounds.
- standing review labs for cross-system tokens before Build authors them into the design system.

The current occupant is Rail Sidebar. Rail-specific labels, data, and examples are replaceable; the
layout contract below is reusable.

## 1. Top-Level Shell

`App.tsx` renders one viewport-sized application:

```tsx
<div className="flex h-screen w-screen overflow-hidden">
  <aside className="w-[320px] shrink-0 border-r bg-card">
    <PhaseRail />
  </aside>

  <main className="flex min-w-0 flex-1 flex-col">
    <header className="flex items-start justify-between gap-4 border-b px-6 py-4" />
    <div className="min-h-0 flex-1 overflow-hidden" />
  </main>
</div>
```

### Phase Rail

- Fixed width: `w-[320px]`.
- Reuses `components/PhaseRail.tsx`.
- Shows the factory phases and their status.
- The shape does not change per occupant; only the `Phase[]` data changes.

### Main Header

- Padding: `px-6 py-4` (`24px` left/right, `16px` top/bottom).
- Contains the occupant eyebrow, active phase title, and active phase description.
- The header is descriptive only. Phase-specific controls belong in the filter row below, not here.

### Body Wrapper

For the active Human Decisions phase:

```tsx
<div className="h-full p-[10px]">
  <HumanDecisionsPhase />
</div>
```

- Padding: `10px` on all sides.
- No outer scrolling. Each phase owns its internal scroll regions.

For placeholder phases:

```tsx
<ScrollArea className="h-full">
  <div className="p-6 pr-8">
    <PlaceholderPhase />
  </div>
</ScrollArea>
```

Placeholder spacing is intentionally separate because it is plain text content, not the two-segment
working surface.

## 2. Human Decisions Content Shell

`HumanDecisionsPhase` is a grid, not a loose flex stack:

```tsx
<Tabs
  defaultValue="blocking"
  className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden"
>
  <FilterRow />
  <TabsContent className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
    <QuadrantLayout />
  </TabsContent>
</Tabs>
```

This gives the filter row an `auto` height and forces the working area below it to take exactly the
remaining space.

### Filter Row

```tsx
<div className="-mx-[10px] -mt-[10px] mb-[10px] flex items-center justify-between gap-4 border-b px-6 py-4">
```

- Uses the same padding rhythm as the main header: `px-6 py-4`.
- Cancels the body wrapper's top and horizontal `10px` padding with `-mt-[10px] -mx-[10px]`, so the
  row spans to the same edge as the header divider.
- Leaves `10px` below itself with `mb-[10px]`.
- Left side contains the tab list.
- Right side contains phase-local controls, currently `RailSourceToggle` and `ThemeToggle`.
- Current Human Decisions tabs: Blocking questions, Color token lab, Typography lab, Full divergence
  list, and Notable risks.

## 3. Working Area Composition

The area below the filter row is made of these layers:

```txt
Body Wrapper
└─ Human Decisions Tabs
   ├─ Filter Row
   └─ Tab Content Area
      └─ Two-Column Grid
         ├─ Left Segment
         └─ Right Segment Wrapper
            └─ Right Example Card / Preview Surface
               └─ FillHeight Measurement Box
                  └─ Live Example
```

### Tab Content Area

```tsx
<TabsContent className="row-start-2 box-border min-h-0 min-w-0 w-full overflow-hidden p-[6px]">
```

- Shared inset around both segments: `6px` on all sides.
- Uses `box-border`, `min-h-0`, and `min-w-0` so padding is respected inside the available space.

### Two-Column Grid

```tsx
<div className="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-0 overflow-hidden">
```

- Two equal columns.
- Column track sizing is `minmax(0, 1fr)` so wide children cannot force the grid past the body padding.
- Segment gap is `0px`.
- Any visible breathing room between segment content comes from each segment's own wrapper padding, not
  the grid gap.

## 4. Left Segment

```tsx
<div className="h-full min-h-0 min-w-0 w-full overflow-hidden">
  <ScrollArea className="h-full">
    <div className="flex flex-col gap-4 px-[8px]">{children}</div>
  </ScrollArea>
</div>
```

- Owns the scroll for decision content.
- Segment horizontal inset: `px-[8px]`.
- Vertical spacing between cards: `gap-4` (`16px`).
- The visible left/right alignment math is:

```txt
10px body wrapper
+ 6px tab content inset
+ 8px segment inset
= 24px, matching the header's px-6
```

## 5. Right Segment

```tsx
<div className="box-border h-full min-h-0 min-w-0 w-full px-[8px]">
  <div className="box-border flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-lg p-6">
    <FillHeight render={right} />
  </div>
</div>
```

### Right Segment Wrapper

- Horizontal inset: `px-[8px]`.
- Uses `box-border`, `min-h-0`, and `min-w-0`.
- Matches the left segment's horizontal alignment math:

```txt
10px body wrapper
+ 6px tab content inset
+ 8px segment wrapper
= 24px, matching the header's px-6
```

### Right Example Card / Preview Surface

- Padding: `p-6` (`24px` on all sides).
- Background: transparent; the live example owns its own surface color.
- Radius: `rounded-lg`.
- Overflow: `overflow-hidden`.
- Uses `box-border`, so `h-full` includes its padding instead of pushing past its container.
- Contains only the live example. No labels, captions, or extra explanatory chrome live in this surface.

## 6. FillHeight Contract

The right preview surface renders:

```tsx
<FillHeight render={right} />
```

`FillHeight` measures the available content box with `ResizeObserver` and passes that height into the
live example:

```tsx
const renderRailNav = (height: number) => (
  <RailNavStatusPreview source={railSource} tokens={proposedDarkRailTokens} height={height} />
)
```

Any future right-side example component must accept and honor a `height` prop. This keeps the example
inside the preview surface padding instead of overflowing through it or floating with arbitrary gaps.

## 7. Card Padding And Status Rules

The blocking-question card spacing is the reference for card-like content across tabs.

### Outer Cards

Use the system `Card` rhythm:

- `Card` shell: system default `py-6`.
- `CardContent`: `px-6`; use `py-6` explicitly when there is no `CardHeader`.
- Non-`Card` row surfaces that visually act like cards use `p-6`.

Current examples:

- Blocking questions: `Card` + `CardHeader` + `CardContent`.
- Color token cards: `CardContent className="... px-6 py-6 ..."`.
- Color lab summary row: `rounded-md border bg-card p-6 shadow-sm`.
- Typography lab cards: `CardContent className="... px-6 py-6 ..."`.
- Typography lab summary row: `rounded-md border bg-card p-6 shadow-sm`.
- Divergence row cards: `rounded-md border bg-card p-6 shadow-sm`.
- Risks: `Card` + `CardHeader` + `CardContent`.
- Right example card: `rounded-lg p-6` with no explicit background color.

### Icon State Rule

Generated Fluent icons expose `filled?: boolean`. Actionable icons render regular at rest and filled on
hover, selected, or active states. Non-interactive icon usage remains regular. This is a design-system
rule, not a Rail-only exception.

### Inner Sub-Boxes

Small comparison/resolution boxes inside a card may remain denser, currently `p-3`, because they are
nested content, not peer cards in the tab's main list.

### Status Styling

- Card surfaces remain neutral.
- Status color appears in badges only.
- Do not reintroduce colored full-card washes, colored left borders, or status-tinted row backgrounds.

## 8. Scrolling Rules

- Use the design system `ScrollArea` for internal scroll regions.
- Do not add browser-native page scrolling.
- Keep scroll ownership local:
  - phase rail scrolls inside `PhaseRail`,
  - left decision segment scrolls inside its own `ScrollArea`,
  - right preview surface does not scroll the page.

The older dedicated `pr-3` scrollbar gutter in the left segment was removed. Current right/left
alignment is controlled by shared tab-content padding plus segment wrapper padding.

## 9. Current Values Summary

```txt
Main header padding:            px-6 py-4  = 24px x / 16px y
Human Decisions body wrapper:   p-[10px]   = 10px all sides
Filter row padding:             px-6 py-4  = 24px x / 16px y
Filter row bleed:               -mx-[10px] -mt-[10px]
Filter-to-content spacing:      mb-[10px]
Tab content inset:              p-[6px]
Two-column grid gap:            gap-0      = 0px
Left segment horizontal inset:  px-[8px]
Right segment horizontal inset: px-[8px]
Right example card padding:     p-6        = 24px all sides
Main card padding rhythm:       p-6 / px-6 py-6
Nested sub-box padding:         p-3
```

## 10. Superseded Behavior

These older rules are no longer current and should not be copied into new factory-line work:

- Body wrapper `p-6`.
- Filter row `-mx-6 -mt-6 mb-6`.
- Two-column grid `gap-6` or `gap-3`.
- Left segment scrollbar gutter `pr-3`.
- Right stage padding `p-4` or `p-[6px]`.
- Divergence row cards using compact `p-2`.
- Color lab summary cards using compact `p-3`.
- Documentation language that treats the layout as permanently frozen.
- Typography notes that describe `--font-sans` as system-ui only. Inter is now first in the
  design-system sans token.

## 11. What Changes Per Occupant

- Occupant label in the header eyebrow.
- `Phase[]` data.
- Tab labels and counts.
- Left-segment content components.
- Right-side live example component.
- Whether a source toggle is needed.
- Review lab categories, such as Color token lab or Typography lab, as required by the occupant.

## 12. What Should Stay Reusable

- Top-level `aside` / `main` shell.
- Header structure and padding rhythm.
- Body wrapper + filter row + tab content layout.
- `QuadrantLayout` for decide-left / preview-right phases.
- Segment alignment math.
- Card padding rhythm.
- Badge-only status color.
- `FillHeight` height prop contract for right-side examples.
