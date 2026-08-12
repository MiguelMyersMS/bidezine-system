-- ═══════════════════════════════════════════════════════════════════════════════════
-- 015 — machine ownership stops being a column nobody fills in.
--
-- Milestone 8 closes P6: "cross-machine state is a hand-maintained markdown file whose
-- only concurrency control is a `---` divider that helps git auto-merge." `sandbox.machine`
-- and `component.owner_machine_id` have existed since 001 and have never held a single
-- row — the same shape `affected_paths` was in before M7 used it. This migration makes
-- them load-bearing.
--
-- ── What this can and cannot enforce, said plainly ─────────────────────────────────
-- All three machines authenticate as the SAME `app_rw` service principal. There are four
-- principals in this system and they are divided by ROLE (admin / app / agent / runner),
-- not by machine — see `.env.example`. So `SUSER_SNAME()` returns an identical value on
-- Laptop A, Laptop B and the PC, and the database structurally CANNOT tell them apart.
--
-- Ownership is therefore enforced on a value the caller supplies. A machine that lies
-- about which machine it is can write to another machine's component. That is a real
-- limit and it is written here rather than left for someone to discover: it is the same
-- class of gap already logged for `sandbox_submit_review`'s `author_agent_id`, which is
-- structural on the values (they must differ) and self-declared on the reality.
--
-- What it does buy, which is not nothing:
--   · an honest machine cannot write to another machine's component BY ACCIDENT, which
--     is the actual failure mode `HANDOFF.md`'s "only ever edit your own section" rule
--     exists to prevent — a session mid-task, reading a stale file, helpfully tidying
--   · every transfer is an audited event with a from, a to, a time and a reason
--   · ownership becomes queryable, so "what is Laptop B doing" stops being a question you
--     answer by reading markdown someone remembered to update
--
-- Closing it structurally means one service principal PER MACHINE plus per-machine
-- database roles, and re-granting everything against them. That is real work in the
-- Fabric portal that cannot be done from a migration, so it is recorded as a deferred
-- decision rather than half-built here.
--
-- ── owner_name is dropped ──────────────────────────────────────────────────────────
-- 001 gave `machine` a NOT NULL `owner_name`. Commit 277ecf9 then decided this project
-- identifies machines by machine, not by person, and removed owner names from
-- `.env.example`, `CLAUDE.md` and the SessionStart hook. A NOT NULL column would force
-- every insert to supply the exact thing that decision removed, so it goes. Nothing reads
-- it — `mcp/server.mjs` is the only code that touches this table at all and it selects
-- `m.name`.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.machine DROP COLUMN owner_name;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- The three machines. Reference data the schema is meaningless without, so it is seeded
-- here rather than left to a script someone has to remember to run.
--
-- These names are the SAME strings `.env`'s MACHINE_NAME already carries and the same
-- headings `HANDOFF.md` uses, deliberately: M8 replaces that file, and a rename during
-- the replacement would mean debugging two changes at once. Renaming (Alpha/Beta/Gamma or
-- similar) is a separate deferred decision — §8 of the spec — and is now a one-row UPDATE
-- plus each machine's own `.env`, rather than a rewrite of a markdown file's headings.
-- ───────────────────────────────────────────────────────────────────────────────────
MERGE sandbox.machine AS target
USING (VALUES ('Laptop A', 1), ('Laptop B', 0), ('PC', 0)) AS source (name, is_primary)
    ON target.name = source.name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (name, is_primary) VALUES (source.name, source.is_primary);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- ownership_transfer — "transferring a component between machines is an audited event"
-- (spec §6, M8's second done-when).
--
-- from_machine_id is NULLABLE on purpose: the first claim of an unowned component is a
-- transfer from nobody, and recording that as a row keeps one table answering the whole
-- question "how did this component come to be here" rather than two.
-- ───────────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('sandbox.ownership_transfer', 'U') IS NULL
BEGIN
    CREATE TABLE sandbox.ownership_transfer (
        transfer_id       INT IDENTITY(1,1) NOT NULL
            CONSTRAINT pk_ownership_transfer PRIMARY KEY,
        component_id      INT           NOT NULL,
        from_machine_id   INT           NULL,
        to_machine_id     INT           NULL,
        -- Free text, and required. A transfer with no stated reason is the audit-trail
        -- equivalent of a divergence row reading "fixed it" — technically a record,
        -- practically useless to the next person.
        note              NVARCHAR(400) NOT NULL,
        transferred_at    DATETIME2(3)  NOT NULL
            CONSTRAINT df_ownership_transfer_at DEFAULT SYSUTCDATETIME(),
        transferred_by    NVARCHAR(200) NOT NULL
            CONSTRAINT df_ownership_transfer_by DEFAULT SUSER_SNAME(),

        -- A transfer that moves nothing is a bug in the caller, not an event worth
        -- storing. Claim (NULL -> X) and release (X -> NULL) are both real moves.
        CONSTRAINT ck_ownership_transfer_moves CHECK (
            from_machine_id IS NULL OR to_machine_id IS NULL
            OR from_machine_id <> to_machine_id),

        CONSTRAINT ck_ownership_transfer_note CHECK (LEN(LTRIM(RTRIM(note))) > 0),

        CONSTRAINT fk_ownership_transfer_component FOREIGN KEY (component_id)
            REFERENCES sandbox.component (component_id),
        CONSTRAINT fk_ownership_transfer_from FOREIGN KEY (from_machine_id)
            REFERENCES sandbox.machine (machine_id),
        CONSTRAINT fk_ownership_transfer_to FOREIGN KEY (to_machine_id)
            REFERENCES sandbox.machine (machine_id)
    );

    CREATE INDEX ix_ownership_transfer_component
        ON sandbox.ownership_transfer (component_id, transferred_at DESC);
END
GO

GRANT SELECT ON OBJECT::sandbox.ownership_transfer TO app_rw;
GRANT SELECT ON OBJECT::sandbox.ownership_transfer TO agent_rw;
GRANT SELECT ON OBJECT::sandbox.ownership_transfer TO runner_evidence;
GO

-- The same lock 011 put on `system_change.state` and 002 put on `component.state`: the
-- column may only move through a procedure, so the audit row and the ownership change
-- cannot come apart. Without this, `UPDATE sandbox.component SET owner_machine_id = ...`
-- silently takes a component with no record that it happened — and an audit trail with a
-- documented way around it is decoration.
DENY UPDATE ON sandbox.component  (owner_machine_id) TO app_rw;
DENY UPDATE ON sandbox.component  (owner_machine_id) TO agent_rw;
DENY UPDATE ON sandbox.divergence (owner_machine_id) TO app_rw;
DENY UPDATE ON sandbox.divergence (owner_machine_id) TO agent_rw;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_component_owner — one place that answers "who owns this, by name".
--
-- Exists so the guard in 016 and the app read ownership the same way. Two independent
-- readings of the same state is how checklist item 20's bug happened: text weight and
-- icon fill tracked the same boolean through two separate implementations and drifted.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER FUNCTION sandbox.fn_component_owner (@component_id INT)
RETURNS TABLE
AS
RETURN
    SELECT  c.component_id,
            c.slug,
            owner_machine_id = c.owner_machine_id,
            owner_name       = m.name,
            is_owned         = CAST(CASE WHEN c.owner_machine_id IS NULL THEN 0 ELSE 1 END AS BIT)
    FROM    sandbox.component c
    LEFT    JOIN sandbox.machine m ON m.machine_id = c.owner_machine_id
    WHERE   c.component_id = @component_id;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_transfer_component — the ONLY way ownership moves.
--
-- Handles all three real moves: claim (@from NULL), hand-over (@from and @to both set),
-- and release (@to NULL).
--
-- @from_machine is REQUIRED to match the current owner, and that is the important part
-- rather than a formality. It makes this a compare-and-swap: a session that believes it
-- owns a component, and is wrong because another machine took it an hour ago, is REFUSED
-- instead of quietly overwriting. That specific failure — acting on a stale reading of
-- who owns what — is exactly what `HANDOFF.md` has no defence against today, since a file
-- read at the start of a session says nothing about what changed during it.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sandbox.usp_transfer_component
    @component_id   INT,
    @from_machine   NVARCHAR(50) = NULL,   -- NULL = claiming something unowned
    @to_machine     NVARCHAR(50) = NULL,   -- NULL = releasing it
    @note           NVARCHAR(400)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.component WHERE component_id = @component_id)
        THROW 51000, 'No such component.', 1;

    IF @note IS NULL OR LEN(LTRIM(RTRIM(@note))) = 0
        THROW 51002, 'A transfer needs a stated reason. An unexplained hand-over is not an audit trail.', 1;

    DECLARE @from_id INT = (SELECT machine_id FROM sandbox.machine WHERE name = @from_machine);
    DECLARE @to_id   INT = (SELECT machine_id FROM sandbox.machine WHERE name = @to_machine);

    -- A name that resolves to nothing must fail loudly. Left to fall through it would
    -- become NULL, which this procedure reads as "unowned" — so a typo in a machine name
    -- would silently release a component instead of transferring it.
    IF @from_machine IS NOT NULL AND @from_id IS NULL
        THROW 51003, 'No machine by that name (from). Machine names are the values in sandbox.machine.', 1;
    IF @to_machine IS NOT NULL AND @to_id IS NULL
        THROW 51003, 'No machine by that name (to). Machine names are the values in sandbox.machine.', 1;

    IF @from_machine IS NULL AND @to_machine IS NULL
        THROW 51004, 'A transfer must name a from, a to, or both.', 1;

    DECLARE @current_id INT = (SELECT owner_machine_id FROM sandbox.component WHERE component_id = @component_id);

    -- Compare-and-swap. Stated as what the caller believed vs what is true, because
    -- "transfer refused" without both halves leaves the caller unable to tell whether
    -- they were stale or simply wrong.
    IF (@current_id IS NULL AND @from_id IS NOT NULL) OR (@current_id IS NOT NULL AND @current_id <> ISNULL(@from_id, -1))
    BEGIN
        DECLARE @actual NVARCHAR(50) = ISNULL((SELECT name FROM sandbox.machine WHERE machine_id = @current_id), '(unowned)');
        DECLARE @claimed NVARCHAR(50) = ISNULL(@from_machine, '(unowned)');
        DECLARE @msg NVARCHAR(400) = CONCAT(
            'Transfer refused. You transferred from ', @claimed, ', but this component is owned by ', @actual,
            '. Re-read the current owner before transferring — this is the stale-reading case the compare-and-swap exists to catch.');
        THROW 51005, @msg, 1;
    END

    BEGIN TRANSACTION;

        UPDATE sandbox.component
        SET    owner_machine_id = @to_id, updated_at = SYSUTCDATETIME()
        WHERE  component_id = @component_id;

        INSERT INTO sandbox.ownership_transfer (component_id, from_machine_id, to_machine_id, note)
        VALUES (@component_id, @from_id, @to_id, @note);

    COMMIT TRANSACTION;

    SELECT component_id = @component_id,
           owner        = ISNULL(@to_machine, '(unowned)'),
           previous     = ISNULL(@from_machine, '(unowned)');
END
GO

GRANT EXECUTE ON OBJECT::sandbox.usp_transfer_component TO app_rw;
GO

-- Deliberately NOT granted to agent_rw. Moving a component between machines is a decision
-- about who is responsible for work, which is the same category as approving or landing —
-- and §3's split is that agents analyse while humans decide. An agent that could reassign
-- ownership could route around every ownership check 016 adds by first making itself the
-- owner.
DENY EXECUTE ON OBJECT::sandbox.usp_transfer_component TO agent_rw;
GO
