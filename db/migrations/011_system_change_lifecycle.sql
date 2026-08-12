-- ═══════════════════════════════════════════════════════════════════════════════════
-- 011 — The system_change lifecycle, with entry requirements.
--
-- The table has existed since migration 001, with `state`, `impact_assessment`,
-- `affected_paths` and `landed_commit`. What it never had was anything stopping those
-- fields being set in any order, by anyone, to anything.
--
-- ── A real hole this closes ────────────────────────────────────────────────────────
-- Migration 002 denies UPDATE on `divergence.state` to every role that connects, so a
-- divergence can only move through the gate procedure. There is no equivalent DENY on
-- `system_change.state`, and 002 grants agent_rw INSERT and UPDATE on the table. So today
-- an agent can run
--
--     UPDATE sandbox.system_change SET state = 'approved' WHERE ...
--
-- and approve its own proposal. That is invariant 1 — "agents propose and implement,
-- agents never attest" — with nothing behind it, on the one entity the spec calls a
-- multiplier. Found by reading the grants while building the lifecycle, not by it being
-- exploited.
--
-- ── Why the ceremony is higher here than for a divergence ──────────────────────────
-- §5.6: "System-scope changes never get the fast lane." A divergence is wrong about one
-- component; a system change is wrong about all of them at once. So approval requires an
-- impact assessment AND a statement of what it touches — and, as with the divergence
-- gate, the refusal returns the full list of what is missing rather than a bare "no",
-- because a gate that only says no teaches the caller nothing.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────────
-- No role that connects may set the state directly. The procedures below are the only
-- path, exactly as they are for divergence.state.
-- ───────────────────────────────────────────────────────────────────────────────────
DENY UPDATE ON sandbox.system_change (state)         TO agent_rw;
DENY UPDATE ON sandbox.system_change (state)         TO app_rw;
GO

-- landed_commit is written by the landing procedure alongside the transition it belongs
-- to. Letting a caller set it independently would let a change claim it landed in a commit
-- it never touched — the same reasoning as component.promoted_commit in 002.
DENY UPDATE ON sandbox.system_change (landed_commit) TO agent_rw;
DENY UPDATE ON sandbox.system_change (landed_commit) TO app_rw;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_system_change_unmet — what stands between this change and approval.
--
-- Same shape as fn_divergence_unmet, and deliberately so: the refusal IS the to-do list,
-- and the requirement slugs are stable machine-readable strings so they can be counted
-- the same way false_completion.requirement_type is.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION sandbox.fn_system_change_unmet (@system_change_id INT)
RETURNS TABLE
AS
RETURN

    -- An assessment is required before approval (001's own column comment). Whitespace
    -- does not count: an empty assessment recorded to satisfy a check is the same shape of
    -- false green as a screenshot that asserts nothing (migration 005).
    SELECT  requirement = CAST('assessment.present' AS NVARCHAR(50)),
            detail      = CAST('No impact assessment. A system change is a multiplier; it never gets the fast lane.' AS NVARCHAR(400))
    FROM    sandbox.system_change sc
    WHERE   sc.system_change_id = @system_change_id
      AND   (sc.impact_assessment IS NULL OR LEN(LTRIM(RTRIM(sc.impact_assessment))) = 0)

    UNION ALL

    -- Without affected_paths the staleness sweep has nothing to match on, so the change
    -- could land and invalidate nothing. The column's own comment in 001 reads "JSON array
    -- of path globs this change touches. Drives the staleness sweep."
    SELECT  'scope.declared',
            CAST('No affected_paths. Run scripts/detect-scope.mjs --json and record what it touches.' AS NVARCHAR(400))
    FROM    sandbox.system_change sc
    WHERE   sc.system_change_id = @system_change_id
      AND   (sc.affected_paths IS NULL OR LEN(LTRIM(RTRIM(sc.affected_paths))) < 3)

    UNION ALL

    -- Approval follows assessment. Approving straight from 'proposed' would mean the
    -- assessment was written after the decision it was supposed to inform.
    SELECT  'state.assessed',
            CAST(CONCAT('State is ', sc.state, '; approval follows assessment.') AS NVARCHAR(400))
    FROM    sandbox.system_change sc
    WHERE   sc.system_change_id = @system_change_id
      AND   sc.state <> 'assessing';
GO

GRANT SELECT ON OBJECT::sandbox.fn_system_change_unmet TO app_rw, agent_rw, runner_evidence;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_propose_system_change — an agent MAY do this. It is a proposal, not a decision.
--
-- The whole point of the entity (§5.1) is that a system-level decision must not be filed
-- as a divergence row: "filing the move to Fluent icons under Rail Sidebar would bury a
-- system-level decision where nothing else can find it."
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_propose_system_change
    @title              NVARCHAR(400),
    @detail             NVARCHAR(MAX)   = NULL,
    @affected_paths     NVARCHAR(MAX)   = NULL,
    @discovered_in      INT             = NULL,
    @ref_code           NVARCHAR(20)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @title IS NULL OR LEN(LTRIM(RTRIM(@title))) = 0
        THROW 51010, 'A system change needs a title.', 1;

    -- Generated when not supplied, so a proposer does not have to know what already
    -- exists. No dynamic SQL: it would break the ownership chain the whole gate rests on
    -- (see 004's header).
    IF @ref_code IS NULL
        SET @ref_code = CONCAT('SC-', (SELECT ISNULL(MAX(system_change_id), 0) + 1 FROM sandbox.system_change));

    INSERT INTO sandbox.system_change (ref_code, title, detail, state, discovered_in, affected_paths)
    VALUES (@ref_code, @title, @detail, 'proposed', @discovered_in, @affected_paths);

    SELECT system_change_id, ref_code, state
    FROM   sandbox.system_change
    WHERE  system_change_id = SCOPE_IDENTITY();
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_assess_system_change — record the assessment, moving it to 'assessing'.
--
-- An agent may write this. Assessing is analysis, not attestation: it describes what the
-- change would reach, and a human still decides whether that is acceptable.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_assess_system_change
    @system_change_id   INT,
    @impact_assessment  NVARCHAR(MAX),
    @affected_paths     NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.system_change WHERE system_change_id = @system_change_id)
        THROW 51011, 'No such system change.', 1;

    IF @impact_assessment IS NULL OR LEN(LTRIM(RTRIM(@impact_assessment))) = 0
        THROW 51012, 'An impact assessment cannot be empty. State what this change reaches.', 1;

    IF EXISTS (SELECT 1 FROM sandbox.system_change
               WHERE system_change_id = @system_change_id AND state IN ('landed','rejected'))
        THROW 51013, 'This system change is already closed; assessing it now would change nothing.', 1;

    UPDATE sandbox.system_change
    SET    impact_assessment = @impact_assessment,
           affected_paths    = ISNULL(@affected_paths, affected_paths),
           state             = 'assessing',
           updated_at        = SYSUTCDATETIME()
    WHERE  system_change_id  = @system_change_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_approve_system_change — a human act, gated.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_approve_system_change
    @system_change_id   INT,
    @approved_by        NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.system_change WHERE system_change_id = @system_change_id)
        THROW 51014, 'No such system change.', 1;

    DECLARE @unmet NVARCHAR(MAX) =
        (SELECT STRING_AGG(CONCAT(requirement, ': ', detail), '  |  ')
         FROM   sandbox.fn_system_change_unmet(@system_change_id));

    IF @unmet IS NOT NULL
    BEGIN
        DECLARE @msg NVARCHAR(2048) = CONCAT('Gate refused. Unmet requirements — ', LEFT(@unmet, 1800));
        THROW 51015, @msg, 1;
    END

    UPDATE sandbox.system_change
    SET    state = 'approved',
           -- Recorded in the assessment trail rather than a column of its own: 001 gave
           -- this table no approver field, and adding one belongs with M8's ownership work
           -- rather than being smuggled in here.
           impact_assessment = CONCAT(impact_assessment, CHAR(13), CHAR(10),
                                      '— approved by ', @approved_by, ' at ',
                                      CONVERT(NVARCHAR(30), SYSUTCDATETIME(), 126)),
           updated_at = SYSUTCDATETIME()
    WHERE  system_change_id = @system_change_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_land_system_change — the change is in the code.
--
-- This is the hook M7's staleness sweep attaches to: landing is the moment every evidence
-- row measured against the old world becomes suspect. The sweep itself is step 4; this
-- procedure records the transition and the commit it happened in.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_land_system_change
    @system_change_id   INT,
    @landed_commit      CHAR(40)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.system_change
                   WHERE system_change_id = @system_change_id AND state = 'approved')
        THROW 51016, 'Only an approved system change can land.', 1;

    UPDATE sandbox.system_change
    SET    state = 'landed', landed_commit = @landed_commit, updated_at = SYSUTCDATETIME()
    WHERE  system_change_id = @system_change_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_reject_system_change — closing it without landing it.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_reject_system_change
    @system_change_id   INT,
    @reason             NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @reason IS NULL OR LEN(LTRIM(RTRIM(@reason))) = 0
        THROW 51017, 'Rejecting needs a reason — it is the only record of why this was not done.', 1;

    IF NOT EXISTS (SELECT 1 FROM sandbox.system_change
                   WHERE system_change_id = @system_change_id AND state <> 'landed')
        THROW 51018, 'A landed system change cannot be rejected; it is already in the code.', 1;

    UPDATE sandbox.system_change
    SET    state = 'rejected',
           detail = CONCAT(ISNULL(detail, ''), CHAR(13), CHAR(10), '— rejected: ', @reason),
           updated_at = SYSUTCDATETIME()
    WHERE  system_change_id = @system_change_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_block_divergence — park a divergence visibly, rather than losing the thread.
--
-- §6 M7: "a component parks visibly in 'blocked on SC-3' rather than a session wandering
-- off and losing the thread." fn_divergence_unmet already reports 'divergence.blocked'
-- from this column; what was missing was a way to set it that cannot point at nonsense.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE PROCEDURE sandbox.usp_block_divergence
    @divergence_id      INT,
    @system_change_id   INT = NULL   -- NULL unblocks
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.divergence WHERE divergence_id = @divergence_id)
        THROW 51019, 'No such divergence.', 1;

    IF @system_change_id IS NOT NULL
    BEGIN
        -- Blocking on something already closed would park the divergence behind a door
        -- that will never open again.
        IF NOT EXISTS (SELECT 1 FROM sandbox.system_change
                       WHERE system_change_id = @system_change_id
                         AND state NOT IN ('landed','rejected'))
            THROW 51020, 'Cannot block on a system change that has already landed or been rejected.', 1;
    END

    UPDATE sandbox.divergence
    SET    blocked_by = @system_change_id, updated_at = SYSUTCDATETIME()
    WHERE  divergence_id = @divergence_id;
END
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- Who may call what.
--
-- Agents propose and assess — both are analysis. Approving, landing and rejecting are
-- decisions, and belong to the role a human acts through. This mirrors the divergence
-- split exactly: agent_rw can reopen (raising a problem) but only app_rw can resolve.
-- ───────────────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON OBJECT::sandbox.usp_propose_system_change TO agent_rw, app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_assess_system_change  TO agent_rw, app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_block_divergence      TO agent_rw, app_rw;

GRANT EXECUTE ON OBJECT::sandbox.usp_approve_system_change TO app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_land_system_change    TO app_rw;
GRANT EXECUTE ON OBJECT::sandbox.usp_reject_system_change  TO app_rw;
GO
