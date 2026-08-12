-- ═══════════════════════════════════════════════════════════════════════════════════
-- 016 — "you can watch another machine's component and cannot write to it."
--
-- 015 made ownership real and auditable. This is the half that gives it teeth: the two
-- procedures that assert a component's work is FINISHED now require the calling machine
-- to say who it is, and refuse when that is not the owner.
--
-- ── Which writes are gated, and why not all of them ────────────────────────────────
-- GATED — these two assert something is done, which is where a foreign write does real
-- damage ("you resolved my divergence while I was mid-change"):
--     usp_resolve_divergence
--     usp_promote_component
--
-- NOT GATED, deliberately — these two RAISE a concern rather than settle one, and an
-- observer must be able to do that or "read-only observer" degrades into "silent
-- bystander":
--     usp_reopen_divergence — reporting a false completion is precisely the job of
--         someone who did not do the work. §3's split already says an agent may reopen
--         while only a human may resolve; gating reopen on ownership would mean the one
--         machine most likely to have missed a defect is the only one allowed to say so.
--     usp_block_divergence  — parking work behind a system change is usually driven by
--         whoever is landing that change, which is by nature cross-component and
--         cross-machine.
--
-- Also NOT gated: usp_transfer_component itself. A machine that has been offline for a
-- week would otherwise hold its components hostage, and a deadlock nobody can clear from
-- the outside is worse than a taking that leaves a record. The compare-and-swap still
-- refuses a caller working from a stale reading, and the required `note` plus the audit
-- row are what make an unusual hand-over visible after the fact. That is the deliberate
-- trade: recoverable and recorded, rather than locked and unrecoverable.
--
-- ── The parameter is required. That is the point. ──────────────────────────────────
-- @machine has NO default. A default of NULL meaning "skip the check" is a gate whose
-- documented bypass is to omit an argument, which teaches every caller to omit it. Every
-- existing caller is updated in the same commit as this migration.
--
-- What this does NOT do is re-litigate 015's honesty note: all three machines still
-- authenticate as the same `app_rw` principal, so @machine is asserted by the caller, not
-- proven by the connection. This stops the ACCIDENT — a session on Laptop B, reading a
-- stale HANDOFF.md, helpfully finishing Laptop A's work — which is the failure P6 is
-- actually about. It does not stop a caller that lies.
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_component_write_refusal — zero rows means allowed; one row says why not.
--
-- Shaped like fn_divergence_unmet on purpose: same idiom, same "the refusal is the
-- to-do list" contract, and one implementation both gated procedures share so they
-- cannot drift into disagreeing about who may write.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER FUNCTION sandbox.fn_component_write_refusal (@component_id INT, @machine NVARCHAR(50))
RETURNS TABLE
AS
RETURN
    -- A caller that does not say who it is. Checked FIRST and separately from "unknown
    -- name", because the two are different mistakes: one is a caller that was never
    -- wired up, the other is a typo.
    SELECT  reason = CAST('This write must name the machine making it. Ownership cannot be checked against nothing.' AS NVARCHAR(400))
    WHERE   @machine IS NULL OR LEN(LTRIM(RTRIM(@machine))) = 0

    UNION ALL

    SELECT  CAST(CONCAT('No machine named ''', @machine, '''. Known machines: ',
                        (SELECT STRING_AGG(name, ', ') FROM sandbox.machine), '.') AS NVARCHAR(400))
    WHERE   @machine IS NOT NULL AND LEN(LTRIM(RTRIM(@machine))) > 0
      AND   NOT EXISTS (SELECT 1 FROM sandbox.machine WHERE name = @machine)

    UNION ALL

    -- The real one. An unowned component is writable by anyone — claiming is a separate
    -- deliberate act (015), and refusing every write until someone claims would stall new
    -- work behind a ceremony that protects nothing yet.
    SELECT  CAST(CONCAT('Refused: ', c.slug, ' is owned by ', m.name, ', and you are ', @machine,
                        '. Watch it, or take it deliberately with sandbox.usp_transfer_component.') AS NVARCHAR(400))
    FROM    sandbox.component c
    JOIN    sandbox.machine m ON m.machine_id = c.owner_machine_id
    WHERE   c.component_id = @component_id
      AND   m.name <> @machine;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_resolve_divergence — body restated from 004, with the ownership check added.
--
-- CREATE OR ALTER replaces the ENTIRE object, so this is copied from 004, the migration
-- that currently DEFINES it — not from an earlier one. Getting that wrong is not
-- hypothetical here: M6's own work reverted migration 005 exactly this way, by copying a
-- body from 003 while writing 007, and the gate silently accepted a screenshot again
-- until verify-runner caught it.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sandbox.usp_resolve_divergence
    @divergence_id  INT,
    @approved_by    NVARCHAR(100),
    @commit_sha     CHAR(40),
    @machine        NVARCHAR(50),
    @note           NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.divergence WHERE divergence_id = @divergence_id)
        THROW 51000, 'No such divergence.', 1;

    DECLARE @component_id INT =
        (SELECT component_id FROM sandbox.divergence WHERE divergence_id = @divergence_id);

    -- Ownership is checked BEFORE the gate. A machine that may not write here should be
    -- told that, not handed a list of evidence requirements it has no business
    -- satisfying — the first refusal a caller sees should be the one that actually
    -- applies to it.
    DECLARE @refusal NVARCHAR(400) =
        (SELECT TOP 1 reason FROM sandbox.fn_component_write_refusal(@component_id, @machine));

    IF @refusal IS NOT NULL
        THROW 51006, @refusal, 1;

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
-- usp_promote_component — body restated from 004, with the same check.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sandbox.usp_promote_component
    @component_id   INT,
    @commit_sha     CHAR(40),
    @machine        NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.component WHERE component_id = @component_id)
        THROW 51002, 'No such component.', 1;

    DECLARE @refusal NVARCHAR(400) =
        (SELECT TOP 1 reason FROM sandbox.fn_component_write_refusal(@component_id, @machine));

    IF @refusal IS NOT NULL
        THROW 51006, @refusal, 1;

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
