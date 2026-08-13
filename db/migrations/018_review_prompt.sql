-- ═══════════════════════════════════════════════════════════════════════════════════
-- 018 — Two scalars the review card needs and the schema does not yet supply.
--
-- A UI redesign of the divergence review card needs two facts nothing on this table can
-- give it: a short human headline, and a concise statement of WHY a human is needed at
-- all. Neither `title` nor `detail` can stand in for either, and a read-only audit of all
-- 154 rail-sidebar rows is why:
--
--   1. A HEADLINE. `title` is NVARCHAR(400), and the audit measured AVG=120, P95=400,
--      MAX=400 — titles are hitting the column cap. A field whose values pile up against
--      its own ceiling is not a name; it is a truncated sentence, and truncated sentences
--      make bad headlines.
--
--   2. THE ASK. The table already carries title, detail, category, scope, tier,
--      tier_justification, anchor_id/file and state — and none of them says why a
--      decision cannot be made mechanically. `detail` looks like a candidate but is not:
--      it is the RATIONALE (what the divergence is, why it exists), not a statement of
--      what a reviewer is being asked to judge. The same audit measured AVG=1358,
--      MAX=5773, with 104 of 154 rows over 280 characters — an essay, not an ask.
--
-- The lengths below are the point, not an afterthought: 80 characters physically cannot
-- hold a paragraph, and 280 physically cannot hold an essay. Concision is enforced by the
-- schema, the same way §5.5's data-divergence attribute enforces locate-by-attribute
-- rather than locate-by-selector — a rule a style guide could ask for and a column cannot
-- be talked out of.
--
-- NULLABLE, and staying NULL on all 154 rows for now. 147 of those have no anchor, no
-- declaration, no evidence and no review — a headline for a row nobody has looked at yet
-- is debt, not a fact. The consuming UI falls back to `title` when these are null.
-- Backfilling the 7 live rows is a separate, human-reviewed step, not this migration's.
--
-- No grants change. Migration 002 already grants INSERT/UPDATE/DELETE on
-- OBJECT::sandbox.divergence to app_rw and INSERT/UPDATE to agent_rw at the TABLE level,
-- with column-level DENY scoped only to `state` and `owner_machine_id` — an ADD covers
-- these two columns under that same table grant without touching either DENY.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence ADD
    -- The short human headline `title` cannot serve as, per the audit above.
    review_label    NVARCHAR(80)    NULL,

    -- The concise statement of why a human, not a machine, has to decide this one.
    review_prompt   NVARCHAR(280)   NULL;
GO
