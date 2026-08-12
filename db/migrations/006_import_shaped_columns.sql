-- ═══════════════════════════════════════════════════════════════════════════════════
-- 006 — What importing real data demanded
--
-- Milestone 4's stated purpose is that the migration IS the schema's proof: any row that
-- does not fit tells us something. Importing Rail Sidebar's 154 real divergence rows
-- produced three findings, none of which were visible when the schema was designed
-- against an imagined corpus.
--
-- 1. TWO CATEGORIES THE ENUM LACKED.
--
--    'radius' — origin category G is four rows about border-radius values (12px rail and
--    panel, 8px rows, 4px, pill). Folding those into 'layout-sizing' would have made them
--    unfindable by the one query anybody would actually run: "what has this project
--    already decided about corner radius". The category enum is the retrieval key for the
--    whole corpus, so a category that blurs a real concept costs precedent lookups later.
--
--    'interaction-state' — origin category K is focus rings, a disabled cursor, and
--    scrollbar CSS. Three of its four rows are about how an element behaves under
--    interaction, which no existing category covers. ('scroll' already exists and takes
--    the fourth.)
--
-- 2. NOWHERE TO PUT `visual`. Origin rows carry a rich `visual` object — SVG path data,
--    before/after hex values per theme, icon names — used to render side-by-side
--    comparisons. The schema had no column for it. Dropping it would have quietly lost
--    the most concrete part of several rows.
--
-- 3. LOSSLESSNESS NEEDS TO BE STRUCTURAL, NOT DILIGENT. The honest guarantee for "every
--    existing row represented with no field lost" cannot be a careful field-by-field
--    mapping, because that only preserves the fields somebody remembered to look for.
--    `origin_record` stores the ENTIRE source object verbatim as JSON, so a field nobody
--    noticed survives anyway and can be recovered later. The mapped columns exist for
--    querying; origin_record exists so the mapping is never the only copy.
-- ═══════════════════════════════════════════════════════════════════════════════════

INSERT INTO sandbox.divergence_category (category, description, sort_order) VALUES
    ('radius',
     'Border radius — corner rounding values and where each applies',
     75),
    ('interaction-state',
     'How an element behaves under interaction: focus rings, hover/press affordances, disabled treatment',
     85);
GO

ALTER TABLE sandbox.divergence ADD
    -- The complete source object, verbatim. Not a mapping — a copy, so the mapping is
    -- never the only record of what was imported.
    origin_record   NVARCHAR(MAX)   NULL,
    -- The source's own category label, e.g. 'K — Focus Ring / Scrollbar CSS'. Kept
    -- because several source categories map to one enum value (M covers structure,
    -- naming and component gaps at once), and a later pass may want to re-categorise
    -- per-row. Re-categorising during import would be re-authoring, not importing.
    origin_category NVARCHAR(80)    NULL,
    -- Side-by-side comparison payload: SVG path data, per-theme hex values, icon names.
    -- Read by the Sandbox app in M5 to render origin against translation.
    visual          NVARCHAR(MAX)   NULL;
GO
