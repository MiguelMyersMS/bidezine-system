-- ═══════════════════════════════════════════════════════════════════════════════════
-- 009 — Restore 005's asserting-evidence rule, which 007 silently reverted.
--
-- ── What happened, stated plainly ───────────────────────────────────────────────────
-- Migration 007 needed to add one clause to `fn_divergence_unmet` (ignore reviews a reopen
-- has invalidated). `CREATE OR ALTER FUNCTION` replaces the ENTIRE object, so 007 restated
-- the whole body — and it was written by copying the body out of migration 003, which is
-- the version BEFORE 005 amended it.
--
-- The result: 005's fix was reverted without a word. Its rule is that evidence must be of
-- a kind that can FAIL on its own terms — a screenshot is an evidence row, and a
-- screenshot that captured successfully is a passing one, but it asserts nothing. Under
-- 003's text, capturing one image satisfies the requirement that the work be verified.
-- That hole was live again between 007 and this migration.
--
-- Caught by `verifier/verify-runner.mjs`, whose check "the gate still reports
-- evidence.present with only a passing screenshot" went red — the suite that exists for
-- exactly this, doing exactly its job. Nothing else would have noticed: every M6 check
-- still passed, because M6's own fixture uses `measurement` evidence.
--
-- ── The lesson, which is about migrations rather than about this bug ────────────────
-- Amending a `CREATE OR ALTER` object means reproducing every prior amendment to it, and
-- a diff against the immediately-preceding migration cannot show what is missing — 007's
-- diff looked like a clean, well-reasoned one-clause addition. The only safe procedure is
-- to derive the new body from the LIVE object (or from the newest migration that touched
-- it), never from the one that happens to be most familiar. This file therefore states its
-- lineage explicitly: it is 005's body, plus 007's `invalidated_at IS NULL` clauses.
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
    WHERE   d.divergence_id = @divergence_id;
GO
