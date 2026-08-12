-- ═══════════════════════════════════════════════════════════════════════════════════
-- 017 — one reading of a component's progress, not two.
--
-- M8 shipped the same correlated stale-count subquery twice, verbatim: once in
-- `scripts/machines.mjs` and once in `getMachines()` in `sandbox/server/corpus-api.mjs`.
-- Two independent implementations of one piece of state is exactly the failure
-- `CLAUDE.md`'s checklist item 20 records — and migration 015's own header cites that item
-- as the reason `fn_component_owner` exists, so this was done while quoting the rule
-- against doing it. Caught by an independent review, not by the pass that wrote it.
--
-- Worth being precise about why this is a defect rather than harmless duplication. Both
-- copies are correct today. The problem is that they are correct SEPARATELY: the next
-- change to what "progress" means — counting `deferred` alongside `resolved`, say, or
-- excluding blocked rows from the total — lands in whichever file the author had open,
-- and the CLI and the app then disagree about the same component while both look right in
-- isolation. Nothing fails. Someone eventually notices the two numbers differ and has to
-- work out which one lied.
--
-- This is NOT the case `scripts/check-quarantine.mjs` handles. That guards two copies of a
-- contract which MUST stay duplicated, because the whole point is that the origin embed
-- and the Sandbox cannot import from each other. Here there is no such constraint: both
-- callers already connect to this database, so they can simply ask it the same question.
-- Drift detection is the fallback for when you cannot remove a duplicate; removing it is
-- better.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR ALTER FUNCTION sandbox.fn_component_progress ()
RETURNS TABLE
AS
RETURN
    SELECT   c.component_id,
             c.slug,
             c.title,
             c.state,
             c.promoted_commit,
             owner    = m.name,
             total    = COUNT(d.divergence_id),
             resolved = SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END),
             blocked  = SUM(CASE WHEN d.state = 'blocked'  THEN 1 ELSE 0 END),
             -- Correlated rather than joined: joining evidence into the same aggregate
             -- multiplies the divergence rows by their evidence rows, which silently
             -- inflates `total` and `resolved`. Both original copies got this right; it is
             -- restated here because this is now the only place it is written down.
             stale    = (SELECT COUNT(*)
                         FROM   sandbox.evidence e
                         JOIN   sandbox.divergence dd ON dd.divergence_id = e.divergence_id
                         WHERE  dd.component_id = c.component_id AND e.is_stale = 1)
    FROM     sandbox.component c
    LEFT     JOIN sandbox.machine m    ON m.machine_id   = c.owner_machine_id
    LEFT     JOIN sandbox.divergence d ON d.component_id = c.component_id
    GROUP BY c.component_id, c.slug, c.title, c.state, c.promoted_commit, m.name;
GO

-- Read by the app, by agents, and by the runner's own tooling. No writer needs it.
GRANT SELECT ON OBJECT::sandbox.fn_component_progress TO app_rw;
GRANT SELECT ON OBJECT::sandbox.fn_component_progress TO agent_rw;
GRANT SELECT ON OBJECT::sandbox.fn_component_progress TO runner_evidence;
GO
