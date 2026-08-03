# Atoms Pass 1 — Step 8: Build & Review

**Date:** 2026-08-03 · **Figma:** page `Atoms` (component sets) · page `Atoms · States` (documentation)

> The first step in this project that authors production components.

## What was built

| Artifact | Node | Contents |
|---|---|---|
| **Button** component set | `58:99` | 6 variants × 8 sizes = **48**, plus a `label` TEXT property |
| **Input** component set | `60:10` | 4 states — default · focus · disabled · invalid |
| **Label** component set | `60:15` | 2 states — default · disabled |
| **Button states** board | `61:3` | variant × state = **30 cells**, drawn not componentised |

**Totals: 3 component sets, 54 variants, 1 documentation board.** Asserted zero `COMPONENT` nodes on
the states board — it is documentation by construction, not by intent.

## Decisions visible in the build

- **Button is a pill** (`radius-pill`, 99) — A-D-025, following v1 rather than shadcn's 8. This is the
  most visible divergence in the system.
- **`pressed` exists**, which shadcn has no equivalent for at all. Taken from v1 at step 6.
- **48 selectable, 30 documented** — A-D-023's split. `variant × size` is a real component set because
  a designer will place a `secondary` `lg` button; `variant × state` is a board because nobody places a
  hover button.
- **Input carries a "KNOWN INCOMPLETE" note** in its description: the real type size is 16px below `md`
  and 14px above, and Figma cannot express a value that changes at a breakpoint. The component
  documents the ≥`md` rendering only (Q4).
- **Label's description records that Radix was dropped** (C-A03) and that it has no state of its own.

## Verified during the build

- Every colour, radius, spacing, stroke and font size is **bound to a variable**, not a literal.
- The focus treatment uses the named `focus-ring` token (Q8) as a bound effect, so it follows the theme.
- Row layout checked programmatically: the Button set wraps to **6 rows of 8**, one variant per row.

## Not built, and why

| | |
|---|---|
| Truncation / `lines` prop (C-A05) | A behavioural contract. Figma cannot express `scrollWidth > clientWidth`; it belongs to the code step. |
| The truncation tooltip | Step 6 showed v1 does this inline with a portal, so it is no longer blocked — but it is code, not a Figma variant. |
| `loading` state | Raised at step 6 as worth adopting from v1; not ratified, so not drawn. |
| Icon-only labels | Icon sizes render a placeholder glyph — real icons need an icon system, which does not exist yet. |

## Open

- **`loading` ≠ `disabled`** (step 6) — a considered v1 distinction we would otherwise lose.
- **`selected`** — v1 has it; not drawn, because it implies a toggle contract we have not defined.
