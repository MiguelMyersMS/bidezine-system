# Dialog — Parking Lot

> Things noticed that belong to a **later step**, or to no step at all. Nothing here is acted on until
> the owner picks it up. **An observation is not a task** — that conversion is the failure mode this
> file exists to prevent (CDP §1.2).
>
> Format: `- [step N] observation — why it is parked`

## Open

- [step 5/6] The v1 `TYPE` typography system (9 tokens; Inter / DM Sans / Raleway) exists and was
  deliberately **not** carried into v2 tokens. Typography currently has no tokens at all beyond the two
  font families. Parked until a component's step-5 token-impact analysis actually demands it, with the
  v1 comparison landing at step 6.

- [step 4] shadcn ships **three primitive backends** for Dialog (`aria/` React Aria, `base/` Base UI,
  `radix/`). We adopted the Radix one per ADR-006. The other two were not dissected. Whether the choice
  of backend is still open, or settled by ADR-006, is a step-4 feasibility question — not a step-2 fact.

- [step 3] `DialogContent` and `DialogFooter` both expose a prop named `showCloseButton`, with
  different defaults (`true` / `false`) and different renderings (icon control / text Button). Recorded
  as structure in `02-anatomy.md`; whether it is a problem is a step-3 observation.

## Picked up

- None yet.
