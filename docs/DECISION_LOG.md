# Decision Log

> **Single source of truth** for decisions taken and pending across bidezine-system. Entries are not
> deleted — they are archived (moved to `## Archived`) when their cleanup condition is met.
>
> _Fresh for bidezine-system (2026-08-02). Legacy design-system decisions live in `../design-system` and
> in `docs/decisions/ADR-*`._

## How to Use This File

- **Decision** — a choice made, with rationale. Permanent record even after resolved.
- **Pending** — a work item not yet completed. Lives here until resolved or deprecated.

**Tiers (Pending):** T1 = blocks the next phase · T2 = next few cycles · T3 = deferred.
**Status:** `active` · `pending` · `in-progress` · `resolved` · `archived`.

## Decisions

- **2026-08-02 — Founding: build v2 on the shadcn foundation** (`active`). See
  `docs/decisions/ADR-006-shadcn-foundation.md`. Radix behaviour + Tailwind/CVA styling + CSS-variable
  theming (DTCG source) + package distribution; **build step required**; **dual source of truth** (Figma =
  look, code = behaviour, Code Connect binds). Legacy `@miguel/design-system` frozen as reference.
- **2026-08-02 — Three machines share `main` directly** (`active`). No PR-branch model in this fresh repo:
  pull in the morning, push at night, work room-by-room. (Differs from the legacy repo's Laptop-A-owns-master rule.)
- **2026-08-02 — Golden path = the modal-form slice** (`active`). Dialog + Field/Input/Label + Button first,
  then Combobox, then the outliers (Chart, Data Table, Calendar/Date Picker, Carousel, Sidebar).

## Pending

- _(none yet)_

## Archived

- _(none)_
