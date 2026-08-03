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

- **2026-08-03 — Component work is governed by the CDP** (`active`). See
  `docs/process/COMPONENT-DEVELOPMENT-PROTOCOL.md`. Every step stops for owner review; the v1 design
  system is fenced until step 6; step 2 documents and step 8 builds. Supersedes the per-component
  sequence in `SHADCN-V2-FOUNDATION-HANDOFF.md` §12 Step 4.
- **2026-08-03 — Atomic taxonomy gains a `provider` tier** (`active`). Surfaced by Dialog: `Dialog`
  (Radix Root) and `DialogPortal` render **no DOM at all**. Atomic Design describes _visual_
  composition and has no category for a part that carries only behaviour or structure — such parts
  cannot be drawn in Figma or classified as atom/molecule/organism, yet they hold real API
  (`open`, `onOpenChange`, `modal`, `container`). The alternative — hiding them as implementation
  detail — would leave that API undocumented. `provider` parts are **code-only**: documented, excluded
  from the Figma library, never given a visual spec. This recurs on every Radix root, portal and
  context provider, so it is a system decision, not a Dialog one. Origin:
  `docs/components/dialog/03-observations.md` O-19, `04-review.md` Q4.
- **2026-08-03 — Radius scale extends down to 2px and 4px** (`active`). `radius-xxs` (2) and
  `radius-xs` (4) join `sm` (6) · `md` (8) · `lg` (10) · `xl` (14), completing the ×0.2 … ×1.0 run off
  the 10px base. Discovered because shadcn's own `@theme` defines `--radius-sm` … `--radius-4xl` but
  **no `--radius-xs`**, so `rounded-xs` on the Dialog close control was falling through to Tailwind's
  raw `0.125rem` default — a value shadcn never chose. Origin: `docs/components/dialog/04-review.md` §2.
- **2026-08-03 — Tokenisation is value-preserving; changing a value is a separate decision** (`active`).
  If naming and changing happen in one move, a visual regression cannot be attributed to either. The
  tokenisation diff must be reviewable by inspection: same pixels, new names.

## Pending

- **T2 — Foundation scales beyond colour and radius are unbuilt.** Spacing, typography, shadow, stroke
  width, motion, z-index, breakpoint and opacity have no tokens. Surfaced by Dialog (6 of ~27 values
  covered). Being proposed at `docs/components/dialog/05-adjustments.md`; will be built at CDP step 8.
- **T3 — Figma cannot hold shadow or easing as variables.** Figma Variables support only
  FLOAT / COLOR / STRING / BOOLEAN. Shadows must ship as Figma **effect styles** and easing curves have
  no Figma representation at all, so those two parts of the token system cannot round-trip the way
  colour and dimension do. Needs a decision on how they stay in sync.

## Archived

- _(none)_
