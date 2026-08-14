-- ═══════════════════════════════════════════════════════════════════════════════════
-- 021 — a third relation kind: `derives`.
--
-- Two rows in layout-sizing are neither an answer nor a risk. They are COMPUTED from
-- another row, literally, in the shipped code:
--
--     const FOOTER_MAX_HEIGHT = RAIL_BUTTON_SIZE * FOOTER_MAX_ICONS + FOOTER_GAP * (FOOTER_MAX_ICONS - 1)
--
-- F-7 (the footer's three-icon height cap) and F-9 (the rail item slot) both resolve from
-- F-2's `RAIL_BUTTON_SIZE = 38`. Forcing either into `answers` to make a link exist would
-- have asserted something false about the corpus — the same reasoning that kept forty
-- candidate references in `origin_record` from being bulk-imported at 020. No edge was
-- declared until the vocabulary could carry the truth.
--
-- This is structural rather than particular to this rail: any ported component with
-- computed constants produces the shape.
--
-- ── `derives` is a DEPENDENCY, not a satellite — do not nest it ───────────────────
-- The distinction matters more than the kind does. `answers` and `risks` are satellites of
-- ONE decision: Q1, A-9 and R-1 are three rows about a single thing, and collapsing them
-- into one card is the entire point of 020.
--
-- `derives` is a relation between two INDEPENDENT decisions. F-7 is its own divergence,
-- needing its own review, whose value happens to compute from F-2's. Nesting it under F-2
-- the way a question nests would hide a decision somebody still has to make. It should
-- render as "changes with F-2", never as part of F-2.
--
-- A kind the UI draws identically to `risks` would be worse than no kind at all: it asserts
-- a structure and then lies about it. If the card cannot express the difference yet, leave
-- these two edges undeclared rather than render them wrong — the vocabulary existing is not
-- an instruction to use it.
--
-- ── Where this is heading, so it is not rediscovered ──────────────────────────────
-- `derives` is `divergence_dependency` (migration 013) at row granularity. That table
-- records path → divergence so that landing a system change marks the right evidence stale.
-- This records row → row, and the same sweep logic applies one level in: if F-2's measured
-- value changes, F-7's and F-9's evidence is suspect for exactly the same reason. Not built
-- here — but that is the natural home for it, and it means `derives` may eventually earn
-- enforcement rather than only display.
--
-- ── Vocabulary is a constant, and item 26's rule governs it ──────────────────────
-- `CLAUDE.md` checklist item 26 says: before proposing any new constant — colour, size,
-- duration — grep `src/ui/` for an existing convention and reuse it; "that is what origin
-- used" is not a justification. A vocabulary term IS a constant. So three tests before any
-- enum here grows again:
--
--   1. Does an existing value already cover it? If the occupant merely uses a different
--      word, rename it in the declaration rather than extending. (This is what caught
--      `browsing`, which was the rail's word for `expanded`.)
--   2. Do bidezine's own primitives already name the concept? Checkable rather than
--      speculative — count the files.
--   3. Adding a value is a promise something renders or uses it DISTINCTLY. A value nothing
--      distinguishes is worse than none.
--
-- `derives` passes 1 and 3. Test 2 does not apply to relation kinds, which describe the
-- corpus rather than the rendered component — for those the bar is test 1 plus a real case
-- already in hand, and two were.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence_relation DROP CONSTRAINT ck_divergence_relation_kind;
GO

ALTER TABLE sandbox.divergence_relation ADD CONSTRAINT ck_divergence_relation_kind
    CHECK (kind IN ('answers','risks','derives'));
GO
