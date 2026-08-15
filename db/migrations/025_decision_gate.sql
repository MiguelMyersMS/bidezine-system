-- ═══════════════════════════════════════════════════════════════════════════════════
-- 025 — deciding becomes a requirement, and gets the one door it can be written through.
--
-- 024 gave the act a table and moved eleven existing decisions into it. Neither of those
-- makes deciding REQUIRED: a row can still be approved having recorded nothing, which is the
-- state the whole corpus has been in. This migration adds `decision.present` to the gate and
-- `usp_record_decision` as the only way to satisfy it.
--
-- ── Why the gate function is reproduced in full ────────────────────────────────────
-- `CREATE OR ALTER` replaces the ENTIRE object. The body below is the LIVE definition read
-- back out of the database with `OBJECT_DEFINITION` — not reconstructed from whichever
-- migration file looked most recent. Three separate migrations (005, 007, 009) define this
-- function, and picking the wrong one silently reverts two of them; reading the deployed
-- object is the only source that cannot be stale.
--
-- ── What `decision.present` deliberately does NOT do ───────────────────────────────
-- It fires on `register = 'decide'` alone, never on a guess about the row's content. 023's
-- CHECK already guarantees a value-proposing row cannot be registered anything else, so the
-- two hold each other up: the constraint stops a proposal from escaping the register, and the
-- gate stops a `decide` row from escaping the requirement.
--
-- It also survives a reopen, unlike `review`. Migration 007 invalidates a review when a row is
-- reopened, because a review asserts that what was BUILT is correct and the build has changed.
-- A decision asserts which VALUE was chosen, and reopening a row usually means the
-- implementation was wrong rather than the choice. A decision that genuinely needs revisiting
-- is recorded as a new row — the table is append-only, so the history stays — and a reader
-- wanting the current one takes the latest `decided_at`.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR ALTER FUNCTION sandbox.fn_divergence_unmet (@divergence_id INT)
RETURNS TABLE
AS
RETURN

    -- From 005: 'screenshot' is deliberately absent from the kind list. Evidence must be
    -- able to fail on its own terms.
    SELECT  requirement = CAST('evidence.present' AS NVARCHAR(50)),
            detail      = CAST('No passing, non-stale evidence row that asserts anything. '
                             + 'A screenshot records what something looked like; it does not '
                             + 'claim anything is correct.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0
                  AND  e.kind IN ('measurement','computed-style','enforcement','build','grep'))

    UNION ALL

    SELECT  'evidence.current',
            CAST(CONCAT('Newest passing evidence predates the last commit touching ',
                        d.anchor_file, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.source_file sf ON sf.path = d.anchor_file
    WHERE   d.divergence_id = @divergence_id
      AND   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0
                  AND  e.kind IN ('measurement','computed-style','enforcement','build','grep')
                  AND  e.verified_at_commit_at >= sf.last_commit_at)

    UNION ALL

    -- From 007: a review invalidated by a reopen is not a passing review any more.
    SELECT  'review.present',
            CAST('No passing review by an agent other than the builder.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id
                  AND  r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)

    UNION ALL

    SELECT  'review.cites_evidence',
            CAST('The passing review cites no evidence.' AS NVARCHAR(400))
    WHERE   EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)
      AND   NOT EXISTS (
                SELECT 1
                FROM   sandbox.review r
                JOIN   sandbox.review_citation rc ON rc.review_id = r.review_id
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)

    UNION ALL

    SELECT  'review.citations_support',
            CAST(CONCAT('A passing review cites evidence #', CAST(e.evidence_id AS NVARCHAR(20)),
                        ' which is ',
                        CASE WHEN e.passed = 0 THEN 'failing' ELSE 'stale' END,
                        '.') AS NVARCHAR(400))
    FROM    sandbox.review r
    JOIN    sandbox.review_citation rc ON rc.review_id = r.review_id
    JOIN    sandbox.evidence e         ON e.evidence_id = rc.evidence_id
    WHERE   r.divergence_id = @divergence_id
      AND   r.verdict = 'pass'
      AND   r.invalidated_at IS NULL
      AND   (e.passed = 0 OR e.is_stale = 1)

    UNION ALL

    SELECT  'divergence.blocked',
            CAST(CONCAT('Blocked on system change ', sc.ref_code, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.system_change sc ON sc.system_change_id = d.blocked_by
    WHERE   d.divergence_id = @divergence_id

    UNION ALL

    -- Migration 025. Fires only for rows registered `decide` (023) — a row that proposes a
    -- value the design system does not yet have. `confirm` rows are untouched: the existing
    -- evidence-and-review path is exactly right for something already built.
    SELECT  'decision.present',
            CAST('This row proposes a value that is not yet the design system''s, and no decision has been recorded. Record the choice — reused or authored, with the rationale — before approving. A decision nobody wrote down cannot be required of the next component, which is how eleven tokens came to be approved and authored into no file.' AS NVARCHAR(400))
    FROM    sandbox.divergence d
    WHERE   d.divergence_id = @divergence_id
      AND   d.register = 'decide'
      AND   NOT EXISTS (SELECT 1 FROM sandbox.divergence_decision dd
                        WHERE  dd.divergence_id = @divergence_id);
GO

-- ── the only door ─────────────────────────────────────────────────────────────────
-- Mandatory rationale, mandatory decider, and the same ownership rule every other write in
-- this schema follows (016): a machine cannot record a decision against a component it does
-- not own, and it has to name itself to be checked at all.
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
    @usage_note        NVARCHAR(300) = NULL
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

    DECLARE @refusal NVARCHAR(400) =
        (SELECT TOP 1 reason FROM sandbox.fn_component_write_refusal(@component_id, @machine));
    IF @refusal IS NOT NULL
        THROW 51025, @refusal, 1;

    INSERT INTO sandbox.divergence_decision
        (component_id, divergence_id, concept, usage_note,
         origin_value, origin_value_dark, chosen_value, chosen_value_dark,
         chosen_token, disposition, rationale, decided_by, provenance)
    VALUES
        (@component_id, @divergence_id, @concept, @usage_note,
         @origin_value, @origin_value_dark, @chosen_value, @chosen_value_dark,
         @chosen_token, @disposition, @rationale, @decided_by, 'recorded');
END
GO

GRANT EXECUTE ON OBJECT::sandbox.usp_record_decision TO app_rw;
GO
