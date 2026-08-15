-- ═══════════════════════════════════════════════════════════════════════════════════
-- 028 — "what did you reject, and why" becomes a column, not a hope.
--
-- The open question this answers: must a deliberate divergence from a bidezine value be
-- adopted as a token even when it stays component-local and nothing else uses it?
--
-- No. The reason to tokenise is retrievability by the next component, and `divergence_decision`
-- now provides that — queryable, pairing what was rejected with what was chosen, searchable
-- through `sandbox_decisions`. Forcing a single-use token asserts a reuse that does not exist,
-- which is the same defect as an enum value nothing distinguishes: a structure that lies.
-- A component-local divergence already has a home here: `disposition = 'authored'` with
-- `chosen_token` NULL, a case `db/verify-decision.mjs` proves does not trip `token.authored`.
--
-- What a component-local divergence must NOT be is undefended. And the defence has to be
-- structural, because the alternative — "the rationale should mention what it was measured
-- against" — is prose-matching, which failed twice in one day on this corpus: `afterNote`
-- carries three unrelated meanings across the rows, and a grep for inherited/no-divergence
-- language returned a set nobody could act on.
--
-- ── The case that proved it, and how the merits inverted ───────────────────────────
-- F-1 (rail width 54px) and G-1 (radius 12px) are structurally identical: a deliberate
-- divergence from a bidezine value, kept as a raw inline number, neither system-scope by the
-- classifier. Judged by their review_prompt summaries, F-1 looked defended and G-1 looked
-- like a bare fact. Read against the DETAIL the records actually hold, it is the other way
-- round:
--
--   G-1  "radius-lg is 10px, radius-xl is 14px, so the containers keep the exact raw 12px
--         rather than settling for a slightly-off token"  — a comparison AND a rejection.
--   F-1  "match the origin Rail Sidebar rail width at 54px instead of using the Sidebar
--         primitive's 48px"  — a comparison and no reason but origin.
--
-- F-1's justification is the F-3 mistake, recorded in F-3's own row as "purely because that's
-- what origin used", and CLAUDE.md checklist item 26's core case. It was resolved and in the
-- ready queue; it has been reopened against `decision.present`, re-registered `decide`, with
-- the evidence left standing — the 54px measurement is correct and beside the point.
--
-- ── Applies to NEW decisions only, and that is deliberate ──────────────────────────
-- The CHECK is scoped to `provenance = 'recorded'`. The eleven rows migrated by 024 are
-- reconstructions, and most of their records do not state which bidezine value was weighed
-- and set aside. Inventing one to satisfy a constraint would be exactly the fabrication this
-- table exists to prevent — a plausible value that passes every check and is simply untrue.
-- Two of the eleven CAN be filled honestly, because the source array says so itself
-- (`noOriginEquivalent: true`), and only those two are.
--
-- ── Why a new column rather than `origin_value` ────────────────────────────────────
-- `origin_value` holds what the ORIGIN system used — foreign material being ported. The value
-- being rejected here is bidezine's OWN, and folding the two into one field would conflate the
-- thing we are copying from with the thing we are choosing against. They are different
-- questions and a reader would have no way to tell which one a row meant.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence_decision
    ADD rejected_value NVARCHAR(200) NULL,
        no_equivalent  BIT NOT NULL CONSTRAINT df_decision_no_equivalent DEFAULT 0;
GO

-- The two the source array itself marks as having nothing to reject. Read from
-- `noOriginEquivalent: true` in proposedDarkRailTokens, not inferred from their prose.
UPDATE sandbox.divergence_decision
SET    no_equivalent = 1
WHERE  concept IN ('darkDividerSubtle', 'darkActiveHoverBg');
GO

ALTER TABLE sandbox.divergence_decision
    ADD CONSTRAINT ck_decision_authored_defends
        CHECK (
            provenance <> 'recorded'
            OR disposition <> 'authored'
            OR rejected_value IS NOT NULL
            OR no_equivalent = 1);
GO
CREATE OR ALTER PROCEDURE sandbox.usp_record_decision
    @divergence_id     INT,
    @concept           NVARCHAR(100),
    @chosen_value      NVARCHAR(100),
    @disposition       NVARCHAR(10),
    @rationale         NVARCHAR(MAX),
    @decided_by        NVARCHAR(100),
    @machine           NVARCHAR(50),
    @chosen_value_dark NVARCHAR(100) = NULL,
    @chosen_token      NVARCHAR(100) = NULL,
    @origin_value      NVARCHAR(100) = NULL,
    @origin_value_dark NVARCHAR(100) = NULL,
    @usage_note        NVARCHAR(300) = NULL,
    -- 028: which bidezine value was weighed and set aside, or an explicit 'nothing existed'.
    @rejected_value    NVARCHAR(200) = NULL,
    @no_equivalent     BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @component_id INT =
        (SELECT component_id FROM sandbox.divergence WHERE divergence_id = @divergence_id);
    IF @component_id IS NULL
        THROW 51020, 'No such divergence.', 1;

    -- Checked before ownership on purpose: a caller that forgot the rationale should be told
    -- that, not sent away with an ownership error it will fix and then hit this anyway.
    IF @rationale IS NULL OR LEN(LTRIM(RTRIM(@rationale))) = 0
        THROW 51021, 'A rationale is required. A decision without one is not retrievable as precedent, which is the only reason this table exists.', 1;

    IF @decided_by IS NULL OR LEN(LTRIM(RTRIM(@decided_by))) = 0
        THROW 51022, 'decided_by is required: the record must name who made the call.', 1;

    IF @disposition NOT IN ('reused','authored')
        THROW 51023, 'disposition must be ''reused'' (an existing design-system value) or ''authored'' (a new one, which must then be adopted into tokens/).', 1;

    -- An authored token is the case that has to reach tokens/. Refusing an authored decision
    -- with no token name would leave `token.authored` (026) nothing to check, and the row
    -- would look decided while being unenforceable.
    IF @disposition = 'authored' AND @chosen_token IS NOT NULL
       AND LEFT(@chosen_token, 2) <> '--'
        THROW 51024, 'chosen_token must be a CSS custom property name beginning with ''--''.', 1;

    -- An authored value must say what it is authored INSTEAD OF. Without it a decision reads
    -- as defended while recording only that a number was picked -- the exact shape of the F-1
    -- record, whose whole justification was that origin used 54px. no_equivalent = 1 is the
    -- honest escape for a genuinely new concept, and it must be STATED rather than inferred
    -- from a NULL, which would make silence indistinguishable from an answer.
    IF @disposition = 'authored' AND @no_equivalent = 0
       AND (@rejected_value IS NULL OR LEN(LTRIM(RTRIM(@rejected_value))) = 0)
        THROW 51026, 'An authored value must name the design-system value it was chosen instead of (@rejected_value), or state that none existed (@no_equivalent = 1). That origin used a number is not a reason to reject bidezine''s own.', 1;

    DECLARE @refusal NVARCHAR(400) =
        (SELECT TOP 1 reason FROM sandbox.fn_component_write_refusal(@component_id, @machine));
    IF @refusal IS NOT NULL
        THROW 51025, @refusal, 1;

    INSERT INTO sandbox.divergence_decision
        (component_id, divergence_id, concept, usage_note,
         origin_value, origin_value_dark, chosen_value, chosen_value_dark,
         chosen_token, disposition, rationale, decided_by, provenance,
         rejected_value, no_equivalent)
    VALUES
        (@component_id, @divergence_id, @concept, @usage_note,
         @origin_value, @origin_value_dark, @chosen_value, @chosen_value_dark,
         @chosen_token, @disposition, @rationale, @decided_by, 'recorded',
         @rejected_value, @no_equivalent);
END
GO

GRANT EXECUTE ON OBJECT::sandbox.usp_record_decision TO app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_record_decision TO agent_rw;
GO
