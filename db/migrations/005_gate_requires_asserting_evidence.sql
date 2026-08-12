-- ═══════════════════════════════════════════════════════════════════════════════════
-- 005 — The gate requires ASSERTING evidence, not merely evidence
--
-- Found while building the verifier (Milestone 2), before it could ever be exploited.
--
-- Migration 003's gate asks for "a passing, non-stale evidence row". A screenshot is an
-- evidence row, and a screenshot that captured successfully is a passing one — but it
-- asserts nothing. It records what something looked like; it does not claim that
-- anything is correct. Under the original rule, capturing one image would have satisfied
-- the requirement that the work be verified.
--
-- That is the same defect class the whole project exists to catch, one level up: an
-- artifact standing in for a check. Evidence must now be of a kind that can FAIL on its
-- own terms — a measurement compared against an expectation, a lint rule, a build, a
-- grep. Screenshots remain valuable and are still recorded; they are supporting
-- material for a human's eye, not a substitute for an assertion.
--
-- Only fn_divergence_unmet changes. Everything else in 003/004 stands.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR ALTER FUNCTION sandbox.fn_divergence_unmet (@divergence_id INT)
RETURNS TABLE
AS
RETURN

    -- Nothing has been measured. The most common false green: work described as done
    -- with no machine-produced evidence that it is.
    --
    -- 'screenshot' is deliberately excluded from this list. See the header.
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

    -- Evidence exists but predates the code it describes. A measurement taken before the
    -- last edit to the anchored file proves nothing about the file as it stands now.
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

    SELECT  'review.present',
            CAST('No passing review by an agent other than the builder.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id
                  AND  r.verdict = 'pass')

    UNION ALL

    SELECT  'review.cites_evidence',
            CAST('The passing review cites no evidence.' AS NVARCHAR(400))
    WHERE   EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass')
      AND   NOT EXISTS (
                SELECT 1
                FROM   sandbox.review r
                JOIN   sandbox.review_citation rc ON rc.review_id = r.review_id
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass')

    UNION ALL

    -- A 'pass' that cites a failing or stale measurement is refuted by its own evidence.
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
      AND   (e.passed = 0 OR e.is_stale = 1)

    UNION ALL

    SELECT  'divergence.blocked',
            CAST(CONCAT('Blocked on system change ', sc.ref_code, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.system_change sc ON sc.system_change_id = d.blocked_by
    WHERE   d.divergence_id = @divergence_id;
GO
