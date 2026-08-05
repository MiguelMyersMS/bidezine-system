# ADR-003: RailNav Panel Density and Item Contrast

**Status:** Accepted
**Date:** 2026-05-24
**Decision maker:** miguelmyers

## Context

After Round 2 visual QA comparing Storybook, docs app, and bloodwork golden
reference, the panel items were noticeably tighter than bloodwork and nested
children were too faint. Three refinements were approved:

1. Panel item row height felt cramped (~36px) vs bloodwork (~40-44px)
2. Nested children (Daily, Weekly, Monthly) used `tokens.textSubtle` which was
   barely readable at 13px
3. Gap between panel title and first item (8px) was too tight vs bloodwork (~16px)

## Decision

### Row height: `LAYOUT.hitTargetSm` (36) → `LAYOUT.hitTarget` (40)

Applied to both `PanelItem` and `PanelGroup` header `minHeight`. Matches the
rail button size (40×40) and provides comfortable scan density. Uses existing
layout token — no magic numbers.

### Item contrast: `tokens.textSubtle` → `tokens.textMuted` (all panel items)

The approved scope was nested children only. However, changing only nested items
would create an inverted hierarchy (children more visible than parents). Per the
token binding rule ("elements sharing the same visual role MUST share the same
token"), both top-level and nested non-selected items use `textMuted`.

`textMuted` (slate11 / ~60% contrast) provides readable but subordinate text.
`textSubtle` (slate9 / ~40%) was too faint for interactive navigation items.

### Header spacing: `marginBottom SPACE[2]` (8px) → `SPACE[4]` (16px)

Creates clear visual separation between the section title and first item,
matching bloodwork's breathing room.

### Alignment preservation: LogoSlot `marginBottom SPACE[1]` → `SPACE[3]`

Adding 8px to the header margin required adding 8px between logo and first rail
icon to maintain first-item alignment. Pixel math:

| Element | Before | After |
|---|---|---|
| Rail: first icon center | 12 + 40 + 4 + 4 + 20 = 80px | 12 + 40 + 12 + 4 + 20 = 88px |
| Panel: first item center | 12 + 40 + 8 + 18 = 78px | 12 + 40 + 16 + 20 = 88px |
| Logo center | 32px | 32px (unchanged) |
| Header center | 32px | 32px (unchanged) |

## Token usage (no magic numbers)

| Property | Token | Value |
|---|---|---|
| Row minHeight | `LAYOUT.hitTarget` | 40px |
| Header marginBottom | `SPACE[4]` | 16px |
| Logo marginBottom | `SPACE[3]` | 12px |
| Item text color | `tokens.textMuted` | Radix slate11 |

## Consequences

- Panel items are taller → fewer items visible without scrolling (acceptable trade-off)
- All non-selected items share the same contrast level → indent provides hierarchy
- First rail icon and first panel item remain pixel-aligned at all breakpoints
- These values become part of the regression checklist (§5a in QA doc)
- Applies to all consumers of `@miguel/design-system` RailNav
