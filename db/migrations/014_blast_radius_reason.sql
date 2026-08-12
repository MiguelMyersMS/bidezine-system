-- ═══════════════════════════════════════════════════════════════════════════════════
-- 014 — fn_system_change_blast_radius reported the right rows for the wrong reason.
--
-- 013's version selected correctly: landing a change touching `src/ui/**` swept exactly
-- the 7 divergences that genuinely depend on a primitive, and marked their 40 evidence
-- rows stale. But every row came back labelled
--
--     "no recorded dependencies — swept because unscanned is not the same as unaffected"
--
-- when in fact all 7 were matched BY their recorded dependencies. The cause was a leftover
-- `LEFT JOIN sandbox.divergence_dependency dep ON ... AND 1 = 0` — a join that can never
-- match, so `dep.divergence_id` was always NULL and the CASE always chose the second
-- branch.
--
-- Worth a migration rather than a shrug. The reason is not decoration: it is what tells a
-- human whether a sweep touched their work because it genuinely depends on the change, or
-- merely because nobody has scanned it yet. Those call for completely different responses
-- — re-verify, versus go and add an anchor — and a sweep that always says the second
-- would train people to ignore it.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR ALTER FUNCTION sandbox.fn_system_change_blast_radius (@system_change_id INT)
RETURNS TABLE
AS
RETURN
    -- Matched by a real, scanned dependency.
    SELECT  d.divergence_id, d.ref_code, c.slug AS component,
            evidence_rows = (SELECT COUNT(*) FROM sandbox.evidence e
                             WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0),
            reason = CAST('depends on a path this change touches' AS NVARCHAR(200))
    FROM    sandbox.divergence d
    JOIN    sandbox.component c ON c.component_id = d.component_id
    WHERE   EXISTS (
                SELECT 1
                FROM   sandbox.divergence_dependency dd
                CROSS  APPLY OPENJSON(
                         (SELECT CASE WHEN ISJSON(sc.affected_paths) = 1 THEN sc.affected_paths ELSE '[]' END
                          FROM sandbox.system_change sc WHERE sc.system_change_id = @system_change_id)) ap
                WHERE  dd.divergence_id = d.divergence_id
                  -- '**' is the glob scripts/detect-scope.mjs emits; '%' is what LIKE wants.
                  AND  dd.path LIKE REPLACE(ap.value, '**', '%'))

    UNION

    -- Never scanned, and carrying evidence that would otherwise stay green. Swept because
    -- "we have not looked" and "it is unaffected" are different claims, and only one of
    -- them is safe to act on. Rows with no evidence are excluded: there is nothing to
    -- invalidate, and listing them would inflate every blast radius with noise.
    SELECT  d.divergence_id, d.ref_code, c.slug,
            (SELECT COUNT(*) FROM sandbox.evidence e WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0),
            CAST('no recorded dependencies — swept because unscanned is not the same as unaffected' AS NVARCHAR(200))
    FROM    sandbox.divergence d
    JOIN    sandbox.component c ON c.component_id = d.component_id
    WHERE   NOT EXISTS (SELECT 1 FROM sandbox.divergence_dependency dd WHERE dd.divergence_id = d.divergence_id)
      AND   EXISTS (SELECT 1 FROM sandbox.evidence e WHERE e.divergence_id = d.divergence_id AND e.is_stale = 0);
GO
