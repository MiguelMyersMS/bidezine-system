-- ═══════════════════════════════════════════════════════════════════════════════════
-- 012 — Blocking a divergence moves its STATE, and unblocking puts it back.
--
-- 011's `usp_block_divergence` set `blocked_by` and nothing else, and the database
-- refused it:
--
--     The UPDATE statement conflicted with the CHECK constraint "ck_divergence_blocked"
--
-- That constraint (001) reads:
--
--     (state = 'blocked' AND blocked_by IS NOT NULL) OR
--     (state <> 'blocked' AND blocked_by IS NULL)
--
-- and the comment beside its component-level twin says why: "'blocked' is not a mood. It
-- names the system change responsible." A divergence carrying a `blocked_by` while still
-- reading `open` would be parked in fact and unparked in the only field anyone queries.
--
-- The schema was right and 011 was wrong. Worth recording rather than quietly fixing: the
-- constraint caught a design error in a procedure written to enforce design, which is the
-- schema doing exactly what it is for.
--
-- ── Why a new column ────────────────────────────────────────────────────────────────
-- Moving to 'blocked' overwrites whatever the divergence was. Unblocking then has nothing
-- to return it to, and the honest options were all bad: restoring everything to 'open'
-- silently discards real progress, and asking the caller to supply the previous state
-- invites a wrong value with no way to detect it. `blocked_from_state` remembers, so
-- blocking is lossless and reversible.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence ADD blocked_from_state NVARCHAR(20) NULL;
GO


CREATE OR ALTER PROCEDURE sandbox.usp_block_divergence
    @divergence_id      INT,
    @system_change_id   INT = NULL   -- NULL unblocks
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @current NVARCHAR(20) =
        (SELECT state FROM sandbox.divergence WHERE divergence_id = @divergence_id);

    IF @current IS NULL
        THROW 51019, 'No such divergence.', 1;

    IF @system_change_id IS NOT NULL
    BEGIN
        -- Blocking on something already closed would park the divergence behind a door
        -- that will never open again.
        IF NOT EXISTS (SELECT 1 FROM sandbox.system_change
                       WHERE system_change_id = @system_change_id
                         AND state NOT IN ('landed','rejected'))
            THROW 51020, 'Cannot block on a system change that has already landed or been rejected.', 1;

        -- Re-blocking an already-blocked row must not overwrite the remembered state with
        -- 'blocked' itself, which would make the block permanent.
        UPDATE sandbox.divergence
        SET    blocked_by          = @system_change_id,
               blocked_from_state  = CASE WHEN @current = 'blocked' THEN blocked_from_state ELSE @current END,
               state               = 'blocked',
               updated_at          = SYSUTCDATETIME()
        WHERE  divergence_id = @divergence_id;
    END
    ELSE
    BEGIN
        IF @current <> 'blocked'
            RETURN;  -- unblocking something that is not blocked is a no-op, not an error

        UPDATE sandbox.divergence
        SET    blocked_by         = NULL,
               -- ISNULL guards a row blocked before this column existed: 'open' is the
               -- only defensible fallback, and it is visibly wrong rather than silently
               -- wrong if it ever happens.
               state              = ISNULL(blocked_from_state, 'open'),
               blocked_from_state = NULL,
               updated_at         = SYSUTCDATETIME()
        WHERE  divergence_id = @divergence_id;
    END
END
GO
