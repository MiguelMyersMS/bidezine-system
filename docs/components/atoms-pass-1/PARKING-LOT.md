# Atoms Pass 1 — Parking Lot

> Noticed, not acted on. Nothing here is picked up until the owner says so. **An observation is not a
> task** (CDP §1.2).
>
> Format: `- [step N] observation — why it is parked`

## Open

- [step 6] v1 has **three** input-ish components — `TextInput`, `InputTrigger`, `InputTriggerCompact` —
  where shadcn has one `Input`. Which is the true counterpart is a step-6 question, and the answer
  matters: I am contaminated on `InputTrigger` but not on `TextInput`, so if `TextInput` is the real
  counterpart, Input's comparison may be less compromised than A-D-004 assumes.

- [step 6] v1 has `ButtonField` in the gallery alongside `Button`. Whether that is a molecule wrapping
  Button, or something else entirely, is unknown and fenced until step 6.

- [step 5] **`Tooltip` does not exist in our system**, and A-D-011 requires one for truncated buttons.
  shadcn has a Tooltip component (Radix-backed). Whether Button composes it — which would end Button's
  status as an atom — or uses the native `title` attribute, or defers the tooltip until Tooltip has had
  its own CDP pass, is a step-5 decision. Parked, not assumed.

- [step 5] **A shared truncation behaviour probably belongs above Button.** A-D-011's
  truncate / wrap / clamp-to-N-lines model is not Button-specific — Label has the same problem
  (A-D-009), and so will any text-bearing part. Whether this becomes a shared primitive or is
  re-specified per component is a step-5 question.

- [adopting Input Group / Sonner] **Those two shadcn components reference the bare `--radius` we just
  removed**, and would silently break: `input-group.tsx` uses `rounded-[calc(var(--radius)-5px)]` in
  three places, and `sonner.tsx` sets `"--border-radius": "var(--radius)"`. An undefined var inside
  `calc()` invalidates the whole declaration, so the corner would fall back to square with no error.
  Both are the arbitrary-value escape hatch **R-06 already decided not to adopt**, so they need
  re-expressing as tokens regardless. Worth noting the calc resolves to **5px** — a value in neither our
  scale (4, 6) nor shadcn's own steps.

## Picked up

- None yet.
