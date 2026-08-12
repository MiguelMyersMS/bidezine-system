-- ═══════════════════════════════════════════════════════════════════════════════════
-- 003 — The gate
--
-- Spec §3.3 and §5.4: "done" is a state transition with entry requirements, not a field
-- an actor sets.
--
-- The shape that matters: an agent does not assert completion, it ATTEMPTS a transition.
-- The database either performs it or returns the list of what is missing — and that list
-- becomes the agent's to-do list. The system is self-correcting rather than
-- self-congratulating. This is the difference between reminding an AI to document its
-- work and making the absence of documentation a failed statement.
--
-- Every requirement is expressed once, in a function, and used twice: by the read-only
-- status procedures the UI polls to decide whether a toggle is enabled, and by the write
-- procedures that perform transitions. There is deliberately no second implementation
-- of the rules that could drift from the first.
--
-- WITH EXECUTE AS OWNER on the write procedures is what makes the gate unbypassable.
-- Migration 002 denies UPDATE on the state columns to both app_rw and agent_rw, so no
-- caller can move a row between states directly; these procedures can, because they run
-- as the owner. There is no code path to 'promoted' that skips the checks below.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_divergence_unmet — what stands between this divergence and 'resolved'.
-- Returns zero rows when the divergence is ready. Each row names one unmet requirement.
--
-- The `requirement` value is deliberately a stable, machine-readable slug: it is the
-- same vocabulary false_completion.requirement_type uses, so the ranked list of "which
-- requirement gets falsely passed most often" (spec M9) lines up with the gate's own
-- checks rather than being a separate taxonomy someone has to keep in sync.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION sandbox.fn_divergence_unmet (@divergence_id INT)
RETURNS TABLE
AS
RETURN

    -- Nothing has been measured. The most common false green: work is described as done
    -- with no machine-produced evidence that it is.
    SELECT  requirement = CAST('evidence.present' AS NVARCHAR(50)),
            detail      = CAST('No passing, non-stale evidence row exists.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0)

    UNION ALL

    -- Evidence exists but predates the code it describes. A measurement taken before the
    -- last edit to the anchored file proves nothing about the file as it stands now —
    -- this is the corpus-rot failure (spec §9), caught rather than assumed.
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

    -- No independent reviewer has passed it. ck_review_independent (001) already makes
    -- reviewer-equals-builder impossible to record, so any row found here is genuinely
    -- someone else's verdict.
    SELECT  'review.present',
            CAST('No passing review by an agent other than the builder.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id
                  AND  r.verdict = 'pass')

    UNION ALL

    -- A review that cites nothing is an opinion. Requiring citations constrains the
    -- reviewer to reasoning over machine-produced facts instead of producing facts.
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

    -- The citations must actually support the verdict. A 'pass' that cites a failing or
    -- stale measurement is refuted by its own evidence — and this check is what stops a
    -- fabricated verdict from surviving, since the reviewer does not control the rows it
    -- has to point at.
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

    -- Blocked on a system change. Resolving underneath an open one would bake in an
    -- answer the system change is about to invalidate.
    SELECT  'divergence.blocked',
            CAST(CONCAT('Blocked on system change ', sc.ref_code, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.system_change sc ON sc.system_change_id = d.blocked_by
    WHERE   d.divergence_id = @divergence_id;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_component_unmet — what stands between this component and 'promoted'.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION sandbox.fn_component_unmet (@component_id INT)
RETURNS TABLE
AS
RETURN

    -- Every divergence must be resolved, or deferred to a named owner. ck_divergence_
    -- deferred (001) guarantees the owner exists, so a deferral is a decision rather
    -- than an abandonment.
    SELECT  requirement = CAST('divergences.open' AS NVARCHAR(50)),
            detail      = CAST(CONCAT(d.ref_code, ' is ', d.state, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    WHERE   d.component_id = @component_id
      AND   d.state NOT IN ('resolved','deferred')

    UNION ALL

    -- No resolved divergence may rest on stale evidence. This is the check that makes a
    -- landed system change (spec §5.7) automatically pull components back out of
    -- 'promoted' rather than leaving them quietly wrong.
    SELECT  'evidence.stale',
            CAST(CONCAT(d.ref_code, ' has stale evidence: ', e.stale_reason) AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.evidence e ON e.divergence_id = d.divergence_id
    WHERE   d.component_id = @component_id
      AND   d.state = 'resolved'
      AND   e.is_stale = 1

    UNION ALL

    -- Every resolved divergence carries a human approval. The gate unlocks the toggle;
    -- a person still has to flip it.
    SELECT  'approval.missing',
            CAST(CONCAT(d.ref_code, ' is resolved but has no recorded approval.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    WHERE   d.component_id = @component_id
      AND   d.state = 'resolved'
      AND   NOT EXISTS (
                SELECT 1 FROM sandbox.approval a
                WHERE  a.divergence_id = d.divergence_id)

    UNION ALL

    SELECT  'component.blocked',
            CAST(CONCAT('Blocked on system change ', sc.ref_code, '.') AS NVARCHAR(400))
    FROM    sandbox.component c
    JOIN    sandbox.system_change sc ON sc.system_change_id = c.blocked_by
    WHERE   c.component_id = @component_id;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- Read-only status. What the UI polls to decide whether the toggle is enabled.
-- Zero rows returned means ready.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_divergence_gate_status @divergence_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT requirement, detail FROM sandbox.fn_divergence_unmet(@divergence_id);
END
GO

CREATE PROCEDURE sandbox.usp_component_gate_status @component_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT requirement, detail FROM sandbox.fn_component_unmet(@component_id);
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_resolve_divergence — the toggle.
--
-- Records the human approval and moves the divergence to 'resolved', but only if the
-- gate is clean. The caller cannot do this any other way: migration 002 denies UPDATE on
-- divergence.state to every role that connects.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_resolve_divergence
    @divergence_id  INT,
    @approved_by    NVARCHAR(100),
    @commit_sha     CHAR(40),
    @note           NVARCHAR(MAX) = NULL
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.divergence WHERE divergence_id = @divergence_id)
        THROW 51000, 'No such divergence.', 1;

    DECLARE @unmet NVARCHAR(MAX) =
        (SELECT STRING_AGG(CONCAT(requirement, ': ', detail), '  |  ')
         FROM   sandbox.fn_divergence_unmet(@divergence_id));

    IF @unmet IS NOT NULL
    BEGIN
        -- The rejection is the to-do list. Returned in full rather than as a bare
        -- "not ready", because a gate that says only no teaches the caller nothing.
        DECLARE @msg NVARCHAR(2048) =
            CONCAT('Gate refused. Unmet requirements — ', LEFT(@unmet, 1800));
        THROW 51001, @msg, 1;
    END

    BEGIN TRANSACTION;

        INSERT INTO sandbox.approval (divergence_id, approved_by, approved_at_commit, note)
        VALUES (@divergence_id, @approved_by, @commit_sha, @note);

        UPDATE sandbox.divergence
        SET    state = 'resolved', updated_at = SYSUTCDATETIME()
        WHERE  divergence_id = @divergence_id;

    COMMIT TRANSACTION;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_promote_component — the component leaves the Sandbox.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_promote_component
    @component_id   INT,
    @commit_sha     CHAR(40)
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.component WHERE component_id = @component_id)
        THROW 51002, 'No such component.', 1;

    DECLARE @unmet NVARCHAR(MAX) =
        (SELECT STRING_AGG(CONCAT(requirement, ': ', detail), '  |  ')
         FROM   sandbox.fn_component_unmet(@component_id));

    IF @unmet IS NOT NULL
    BEGIN
        DECLARE @msg NVARCHAR(2048) =
            CONCAT('Gate refused. Unmet requirements — ', LEFT(@unmet, 1800));
        THROW 51003, @msg, 1;
    END

    UPDATE sandbox.component
    SET    state = 'promoted', promoted_commit = @commit_sha, updated_at = SYSUTCDATETIME()
    WHERE  component_id = @component_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_reopen_divergence — undoing a false green, and recording that it happened.
--
-- Spec M6: reopening cascades. The divergence returns to 'reopened', and the component
-- drops out of 'promoted' with it — otherwise a promoted component could sit above an
-- open divergence, which is the same false green one level up.
--
-- @requirement_type is mandatory and is the whole point. It names WHICH requirement was
-- falsely passed, which is what makes the ranked "most-falsified requirement" list
-- possible (spec M9) — and that list, not intuition, decides which prose rules get
-- converted into executable enforcements.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_reopen_divergence
    @divergence_id      INT,
    @requirement_type   NVARCHAR(50),
    @reason             NVARCHAR(MAX),
    @discovered_by      NVARCHAR(100)
WITH EXECUTE AS OWNER
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

        -- The cascade.
        UPDATE sandbox.component
        SET    state = 'reopened', promoted_commit = NULL, updated_at = SYSUTCDATETIME()
        WHERE  component_id = @component_id
          AND  state = 'promoted';

    COMMIT TRANSACTION;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- Execute permissions.
--
-- Agents may ASK the gate anything and TELL it nothing. They can read their own
-- unmet-requirement list — that is how the rejection becomes their to-do list — but
-- resolution requires a human approval, so only the application may call it.
-- ───────────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON OBJECT::sandbox.usp_divergence_gate_status TO agent_rw, app_rw, runner_evidence;
GRANT EXECUTE ON OBJECT::sandbox.usp_component_gate_status  TO agent_rw, app_rw, runner_evidence;

GRANT EXECUTE ON OBJECT::sandbox.usp_resolve_divergence TO app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_promote_component  TO app_rw;

-- Reopening is available to agents deliberately. An agent that discovers earlier work
-- was never actually done must be able to say so immediately — that discovery is the
-- most valuable thing it can produce, and putting a human in front of it would mean the
-- finding waits, or worse, gets quietly fixed and forgotten (spec §5.1).
GRANT EXECUTE ON OBJECT::sandbox.usp_reopen_divergence TO app_rw, agent_rw;
GO
