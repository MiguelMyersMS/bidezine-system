-- ═══════════════════════════════════════════════════════════════════════════════════
-- 004 — Redefine the gate's write procedures without EXECUTE AS
--
-- WHY THIS EXISTS
--
-- Migration 003 made the gate unbypassable using WITH EXECUTE AS OWNER: the state
-- columns are denied to every connecting role, and the procedures ran as the owner so
-- they alone could write them.
--
-- Fabric SQL does not support EXECUTE AS. The procedures CREATE without complaint and
-- then fail at call time with:
--
--     'EXECUTE AS' statement is not supported on the 'Microsoft Fabric' platform.
--
-- Worth noting how that was found. Migration 003 applied cleanly, the permissions read
-- exactly as designed, and nothing in the schema hinted at a problem — the defect only
-- appeared when db/verify-invariant.mjs actually called the procedure as a real
-- principal. A gate that has been reasoned about is a claim; a gate that has been
-- watched refuse an INSERT is evidence. That is the project's own rule, applied to its
-- own foundation, and it caught this on day one.
--
-- THE FIX: OWNERSHIP CHAINING
--
-- Every object in the sandbox schema shares one owner (bidezine-sandbox-admin, inherited
-- from the schema). When a procedure and the tables it touches have the same owner, the
-- ownership chain is unbroken and SQL Server does not check the caller's permissions on
-- those tables at all — the check is skipped, not merely satisfied. So a caller denied
-- UPDATE on divergence.state can still reach it THROUGH this procedure, and only through
-- it, which is exactly the property the gate needs.
--
-- This is strictly better than EXECUTE AS: no impersonation, no elevated execution
-- context, and the same guarantee. The procedure bodies are unchanged from 003.
--
-- Two conditions keep it working, and both are worth guarding when extending the gate:
--   1. No dynamic SQL. EXEC / sp_executesql inside a procedure BREAKS the chain, and the
--      caller's own permissions are checked again. There is none here; do not add any.
--   2. One owner for the whole schema. Creating a sandbox object as a different
--      principal silently breaks the chain for anything that touches it.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR ALTER PROCEDURE sandbox.usp_resolve_divergence
    @divergence_id  INT,
    @approved_by    NVARCHAR(100),
    @commit_sha     CHAR(40),
    @note           NVARCHAR(MAX) = NULL
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


CREATE OR ALTER PROCEDURE sandbox.usp_promote_component
    @component_id   INT,
    @commit_sha     CHAR(40)
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

    COMMIT TRANSACTION;
END
GO
