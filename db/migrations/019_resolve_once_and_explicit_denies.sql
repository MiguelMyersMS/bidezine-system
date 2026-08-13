-- ═══════════════════════════════════════════════════════════════════════════════════
-- 019 — two protections that existed only by absence, made explicit.
--
-- Different symptoms, one defect class: in both cases the system behaved correctly, and
-- in neither case was that behaviour *declared*. A rule nothing states is a rule the next
-- change can remove without anyone noticing it was ever there.
--
-- ── 1. Resolving an already-resolved divergence was accepted ───────────────────────
-- F-3 carries two approval rows four seconds apart, both `human:Laptop A`, both at commit
-- 58d1c8a. A UI race let a second click through; the UI race has been fixed. The database
-- accepting it had nothing to do with the UI.
--
-- It happened because the gate was still satisfied the second time. `usp_resolve_divergence`
-- checks ownership, then checks `fn_divergence_unmet`, then writes — and a resolved row
-- still has its passing evidence and its passing review, so the gate said yes again. The
-- guard that was missing is not about evidence at all: it is that `resolved -> resolved` is
-- not a transition.
--
-- ── Why this is a procedure check and NOT a UNIQUE constraint ──────────────────────
-- `UNIQUE (divergence_id)` on `sandbox.approval` would look like the obvious fix and would
-- be wrong. Reopen -> fix -> re-resolve produces a second approval LEGITIMATELY, and that
-- loop is the one M9's false-completion data is built on: `usp_reopen_divergence` moves the
-- row to 'reopened' and invalidates its review, and earning approval again afterwards is
-- the system working. The defect is not "two approvals"; it is "two approvals with no
-- intervening reopen". Only the state check expresses that.
--
-- The shape matches the guards already in this schema: `usp_land_system_change` refuses a
-- change that has already landed, `usp_block_divergence` refuses one blocked on a closed
-- change. This is the same sentence for divergences.
--
-- ── The duplicate row is NOT deleted ───────────────────────────────────────────────
-- It is a true record of something that genuinely happened, in an audit table. Removing it
-- would destroy the only evidence of this defect and set the precedent that audit rows get
-- tidied. `app_rw` holds INSERT and nothing else on `sandbox.approval`, so deleting it
-- would require ADMIN — which is the argument, not an obstacle to route around. It stays,
-- and it is explained in SANDBOX-PROTOCOL-LOG.md's flaws log instead.
--
-- ── 2. app_rw could not write evidence or reviews, but nothing said so ─────────────
-- `agent_rw` carries an explicit `DENY INSERT, UPDATE, DELETE` on `sandbox.evidence` (002,
-- line 90) — the single most important permission in this system. `app_rw` carries no such
-- DENY on either `evidence` or `review`. It cannot write them today only because no GRANT
-- was ever issued.
--
-- Functionally identical right now. Not identical in durability: this project's stated
-- reason for trusting Fabric is that its item RBAC "gates connection only — it maps into no
-- SQL role and cannot override a DENY" (CLAUDE.md). That guarantee protects a DENY. It does
-- not protect an absence, which any later GRANT or role membership silently undoes.
-- Invariant 1 deserves to be an invariant for the app the same way it is for agents.
--
-- ── The risk this carries, checked rather than assumed ─────────────────────────────
-- `usp_reopen_divergence` (007) runs as `app_rw` and does `UPDATE sandbox.review SET
-- invalidated_at`. If a DENY on `app_rw` were evaluated there, reopen would break — and
-- reopen is the one act a read-only observer keeps (016).
--
-- It is not evaluated: the gate procedures rely on ownership chaining (one schema owner, no
-- dynamic SQL — 004), and an unbroken chain skips permission checks on referenced objects
-- entirely, DENY included. That is the documented behaviour, but this project does not ship
-- on documented behaviour: `db/verify-invariant.mjs` and `sandbox/verify-approval.mjs` both
-- drive a real reopen as `app_rw`, and both must still pass after this migration. If they
-- do not, this half is wrong and comes out — the answer is in the suites, not in this
-- comment.
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────────
-- Body restated from 016, the migration that currently DEFINES this procedure — not from
-- 004. CREATE OR ALTER replaces the entire object, and copying a stale body is how M6's
-- own work silently reverted migration 005's asserting-evidence rule while every M6 check
-- kept passing.
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

    DECLARE @state NVARCHAR(20) =
        (SELECT state FROM sandbox.divergence WHERE divergence_id = @divergence_id);

    IF @state IS NULL
        THROW 51000, 'No such divergence.', 1;

    -- 019: resolved -> resolved is not a transition. Checked FIRST, before ownership and
    -- before the gate: a caller re-approving something already done should be told it is
    -- already done, not handed an ownership refusal or an evidence to-do list that both
    -- describe a decision nobody needs to make again.
    IF @state = 'resolved'
        THROW 51007, 'Already resolved. Reopen it first if the resolution turned out to be wrong — a second approval with no intervening reopen records a decision that was never made.', 1;

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
-- The app produces neither evidence nor reviews. Said out loud, so it stays true.
--
-- Deliberately NOT denied: sandbox.approval (app_rw's own act, granted at 002) and
-- sandbox.false_completion (granted at 002 — an app that could not record a false
-- completion could not reopen anything).
-- ───────────────────────────────────────────────────────────────────────────────────
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.evidence        TO app_rw;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.review          TO app_rw;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.review_citation TO app_rw;
GO
