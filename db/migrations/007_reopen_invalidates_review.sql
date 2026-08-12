-- ═══════════════════════════════════════════════════════════════════════════════════
-- Reopening invalidates the review that passed the old state.
--
-- Milestone 6 requires, in its own words: "Cascade on reopen: the component leaves
-- promoted, its frozen snapshot is marked stale, and the review based on the old state is
-- invalidated." The first part was implemented in 004. The last part was not, and the
-- omission was a real hole rather than a cosmetic gap.
--
-- FOUND BY TESTING, NOT BY READING. Driving M6's own acceptance criteria against the live
-- database: approve a genuinely ready divergence, then reopen it with a reason. The
-- false_completion row was written and the state moved to 'reopened' correctly — and the
-- gate then reported ZERO unmet requirements. A divergence reopened precisely BECAUSE
-- something had been falsely passed was immediately re-approvable, on the strength of the
-- same passing review that had wrongly passed it, with no new evidence and no new review.
--
-- That is the exact shape of false green this whole system exists to refuse, sitting
-- inside the gate itself. `fn_divergence_unmet` asked "does a passing review exist?" and a
-- reopen did nothing to the answer.
--
-- The fix is deliberately narrow:
--   · reviews gain `invalidated_at`, set when a reopen supersedes them. Nothing is
--     deleted — a review is a historical act, and the record of who passed what and when
--     is the raw material for M9's false-completion ranking. It is marked, not erased.
--   · the gate's three review checks ignore invalidated reviews.
--
-- EVIDENCE IS DELIBERATELY LEFT ALONE. A measurement is a fact about the code at a commit;
-- reopening does not make it untrue. What reopening invalidates is the JUDGEMENT built on
-- top of it. Evidence has its own staleness mechanism (`is_stale`), driven by M7's
-- system-change sweep, and conflating the two would mean a reopen silently discarded
-- machine-produced facts that are still perfectly valid.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.review ADD invalidated_at DATETIME2(3) NULL;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_divergence_unmet — unchanged except that the three review checks now ignore any
-- review a reopen has superseded.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER FUNCTION sandbox.fn_divergence_unmet (@divergence_id INT)
RETURNS TABLE
AS
RETURN

    SELECT  requirement = CAST('evidence.present' AS NVARCHAR(50)),
            detail      = CAST('No passing, non-stale evidence row exists.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0)

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
                  AND  e.verified_at_commit_at >= sf.last_commit_at)

    UNION ALL

    -- A review invalidated by a reopen is not a passing review any more. Without the
    -- `invalidated_at IS NULL` clause here, reopening a divergence left it immediately
    -- re-approvable on the very verdict the reopen had just contradicted.
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
    WHERE   d.divergence_id = @divergence_id;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_reopen_divergence — now completes M6's stated cascade.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sandbox.usp_reopen_divergence
    @divergence_id      INT,
    @requirement_type   NVARCHAR(50),
    @reason             NVARCHAR(MAX),
    @discovered_by      NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @component_id INT =
        (SELECT component_id FROM sandbox.divergence WHERE divergence_id = @divergence_id);

    IF @component_id IS NULL
        THROW 51004, 'No such divergence.', 1;

    BEGIN TRANSACTION;

        INSERT INTO sandbox.false_completion
            (divergence_id, requirement_type, reason, discovered_by)
        VALUES (@divergence_id, @requirement_type, @reason, @discovered_by);

        UPDATE sandbox.divergence
        SET    state = 'reopened',
               reopened_count = reopened_count + 1,
               updated_at = SYSUTCDATETIME()
        WHERE  divergence_id = @divergence_id;

        -- The cascade: a promoted component sitting above a reopened divergence is the
        -- same false green one level up.
        UPDATE sandbox.component
        SET    state = 'reopened', promoted_commit = NULL, updated_at = SYSUTCDATETIME()
        WHERE  component_id = @component_id
          AND  state = 'promoted';

        -- The rest of that cascade, added in 007: the judgement built on the old state no
        -- longer stands. Marked rather than deleted — who passed what, and when, is the
        -- raw material for M9's ranking of which requirements get falsely passed most.
        UPDATE sandbox.review
        SET    invalidated_at = SYSUTCDATETIME()
        WHERE  divergence_id = @divergence_id
          AND  invalidated_at IS NULL;

    COMMIT TRANSACTION;
END
GO
