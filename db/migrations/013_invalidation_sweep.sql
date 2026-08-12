-- ═══════════════════════════════════════════════════════════════════════════════════
-- 013 — Landing a system change marks the evidence it invalidates.
--
-- P5, in the spec's own words: "The font change and the Fluent migration both came out of
-- one component and silently invalidated everything already verified." Nothing noticed,
-- because nothing was looking.
--
-- M7's first "done when" is that landing a token or primitive change marks affected
-- evidence stale and drops affected components out of 'promoted', AUTOMATICALLY. So the
-- sweep lives inside `usp_land_system_change` rather than in a script someone remembers to
-- run — the whole failure being fixed is that the remembering did not happen.
--
-- ── How the sweep knows what a change reaches ──────────────────────────────────────
-- `divergence_dependency` holds, per divergence, which design-system paths its anchored
-- code actually depends on — resolved through the real import graph by
-- scripts/scan-dependencies.mjs, not guessed. That is what lets a change to
-- `src/ui/button.tsx` invalidate F-2, whose own anchor lives three directories away in
-- `sandbox/` and names no `src/ui` path anywhere.
--
-- Matching on `anchor_file` alone was considered and rejected for exactly that reason: it
-- misses the case M7 exists for.
--
-- ── When unsure, mark it stale ─────────────────────────────────────────────────────
-- A false "stale" costs one batch re-run. A false "current" is a false green. Everything
-- ambiguous therefore resolves toward marking more: a divergence with NO recorded
-- dependencies is swept too, because "we have not scanned it" and "it is unaffected" are
-- very different claims and only one of them is safe to act on.
-- ═══════════════════════════════════════════════════════════════════════════════════


CREATE TABLE sandbox.divergence_dependency (
    divergence_id   INT             NOT NULL,
    -- A repo-relative path, or a directory marker ending in '/' where the dependency is
    -- an area rather than a file (tokens arrive through CSS custom properties, so there
    -- is no module edge to point at — see scripts/lib/dependencies.mjs).
    path            NVARCHAR(400)   NOT NULL,
    scanned_at      DATETIME2(3)    NOT NULL CONSTRAINT df_divergence_dependency_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_divergence_dependency PRIMARY KEY (divergence_id, path),
    CONSTRAINT fk_divergence_dependency FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id)
);
GO

CREATE INDEX ix_divergence_dependency_path ON sandbox.divergence_dependency (path);
GO

-- The scan is run by tooling, not by a person editing rows.
GRANT INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence_dependency TO app_rw;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_system_change_blast_radius — what WOULD be invalidated, without invalidating it.
--
-- Separate from the sweep on purpose. An impact assessment is required before approval
-- (011), and asking someone to assess blast radius without being able to see it is how
-- assessments become a formality. This is the same query the sweep uses, so the number in
-- the assessment and the number actually swept cannot disagree.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE FUNCTION sandbox.fn_system_change_blast_radius (@system_change_id INT)
RETURNS TABLE
AS
RETURN
    SELECT  d.divergence_id, d.ref_code, c.slug AS component,
            evidence_rows = (SELECT COUNT(*) FROM sandbox.evidence e
                             WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0),
            reason = CASE WHEN dep.divergence_id IS NULL
                          THEN 'no recorded dependencies — swept because unscanned is not the same as unaffected'
                          ELSE 'depends on a path this change touches' END
    FROM    sandbox.divergence d
    JOIN    sandbox.component c ON c.component_id = d.component_id
    CROSS   APPLY (SELECT TOP 1 dd.divergence_id
                   FROM   sandbox.divergence_dependency dd
                   CROSS  APPLY OPENJSON(
                            (SELECT CASE WHEN ISJSON(sc.affected_paths) = 1 THEN sc.affected_paths ELSE '[]' END
                             FROM sandbox.system_change sc WHERE sc.system_change_id = @system_change_id)) ap
                   WHERE  dd.divergence_id = d.divergence_id
                     -- '**' is the glob the scope detector emits; '%' is what LIKE wants.
                     AND  dd.path LIKE REPLACE(ap.value, '**', '%')) AS matched(divergence_id)
    LEFT    JOIN sandbox.divergence_dependency dep ON dep.divergence_id = d.divergence_id AND 1 = 0

    UNION

    -- Unscanned divergences. Swept for the reason in the header: not knowing is not the
    -- same as knowing it is fine.
    SELECT  d.divergence_id, d.ref_code, c.slug,
            (SELECT COUNT(*) FROM sandbox.evidence e WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0),
            'no recorded dependencies — swept because unscanned is not the same as unaffected'
    FROM    sandbox.divergence d
    JOIN    sandbox.component c ON c.component_id = d.component_id
    WHERE   NOT EXISTS (SELECT 1 FROM sandbox.divergence_dependency dd WHERE dd.divergence_id = d.divergence_id)
      AND   EXISTS (SELECT 1 FROM sandbox.evidence e WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0);
GO

GRANT SELECT ON OBJECT::sandbox.fn_system_change_blast_radius TO app_rw, agent_rw, runner_evidence;
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- usp_land_system_change — now sweeps.
--
-- Replaces 011's version, which recorded the transition and nothing else.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE sandbox.usp_land_system_change
    @system_change_id   INT,
    @landed_commit      CHAR(40)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM sandbox.system_change
                   WHERE system_change_id = @system_change_id AND state = 'approved')
        THROW 51016, 'Only an approved system change can land.', 1;

    DECLARE @ref NVARCHAR(20) = (SELECT ref_code FROM sandbox.system_change WHERE system_change_id = @system_change_id);

    BEGIN TRANSACTION;

        UPDATE sandbox.system_change
        SET    state = 'landed', landed_commit = @landed_commit, updated_at = SYSUTCDATETIME()
        WHERE  system_change_id = @system_change_id;

        -- Every non-stale evidence row belonging to an affected divergence. The reason is
        -- not optional: ck_evidence_stale (001) requires one, so a staleness can never be
        -- unexplainable after the fact.
        UPDATE  e
        SET     e.is_stale = 1,
                e.stale_reason = LEFT(CONCAT('Invalidated by system change ', @ref,
                                             ' landing at ', LEFT(@landed_commit, 8),
                                             '. Re-run its check spec to clear this.'), 400)
        FROM    sandbox.evidence e
        JOIN    sandbox.fn_system_change_blast_radius(@system_change_id) b
                ON b.divergence_id = e.divergence_id
        WHERE   e.is_stale = 0;

        -- The component-level consequence. fn_component_unmet already refuses to promote
        -- anything carrying stale evidence, but a component that is ALREADY promoted has
        -- to be pulled back out — otherwise it keeps a green badge earned against code
        -- that has since moved.
        UPDATE  c
        SET     c.state = 'reopened', c.promoted_commit = NULL, c.updated_at = SYSUTCDATETIME()
        FROM    sandbox.component c
        WHERE   c.state = 'promoted'
          AND   EXISTS (SELECT 1
                        FROM   sandbox.divergence d
                        JOIN   sandbox.evidence e ON e.divergence_id = d.divergence_id
                        WHERE  d.component_id = c.component_id AND e.is_stale = 1);

    COMMIT TRANSACTION;

    -- The caller is told what it just did. A sweep that silently touched 40 rows and one
    -- that silently touched none look identical otherwise.
    SELECT  swept_divergences = (SELECT COUNT(*) FROM sandbox.fn_system_change_blast_radius(@system_change_id)),
            stale_evidence    = (SELECT COUNT(*) FROM sandbox.evidence e
                                 JOIN sandbox.fn_system_change_blast_radius(@system_change_id) b
                                   ON b.divergence_id = e.divergence_id
                                 WHERE e.is_stale = 1);
END
GO
