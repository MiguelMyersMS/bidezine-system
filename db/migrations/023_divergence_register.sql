-- ═══════════════════════════════════════════════════════════════════════════════════
-- 023 — `register`: what act closes this row.
--
-- A full-corpus audit against the system-change protocol found that every one of the 169
-- rail-sidebar rows carries `scope = 'component'`, and `sandbox.system_change` has never
-- held a single row — while 39 of those rows concern `tokens/` or `src/ui/`, and eleven
-- `--sidebar-rail-*` tokens are proposed by the corpus and resolve in no file under
-- `tokens/`. `sandbox_propose_system_change`'s own description states the rule those rows
-- broke: "a system-level decision buried under one component is exactly how the font change
-- and the Fluent icon migration silently invalidated everything already verified."
--
-- The protocol the owner reconstructed from that has five steps: the AI proposes from the
-- design system and says what it searched; the OWNER decides; the decision is RECORDED,
-- structured and retrievable as precedent; evidence; approval. Steps 1, 2, 4 and 5 are
-- existing rules with existing machinery. Step 3 is the gap — every other human act here
-- has an audit table (approval, review, false_completion, ownership_transfer) and DECIDING
-- has none.
--
-- This migration is the first of four that close it, and it only asks one question: what
-- does a given row OWE a human? Three answers, and the gate can then require different
-- things of each:
--
--   decide   The row proposes a value or behaviour that is not yet the design system's.
--            A human must CHOOSE — reuse an existing token, or author a new one — and that
--            choice must be recorded before the row can be approved (migration 025).
--   confirm  The row asserts something about what is already built. The existing gate is
--            exactly right for it: evidence, then a review by someone other than the
--            builder. This is the default, and the bulk of the corpus.
--   close    The row owes neither. Nothing was chosen and nothing needs proving — an
--            inherited origin behaviour bidezine is deliberately not changing, say. The
--            owner sets this deliberately through `usp_set_register`; it is never inferred,
--            because "nobody needs to look at this" is not a judgement a backfill can make.
--
-- ── The default is 'confirm', and that would be unsafe on its own ──────────────────
-- Under-gating is the failure this whole build exists to fix: a row that proposes a value,
-- registered as `confirm`, would sail through on evidence alone with no decision ever
-- recorded — which is precisely how eleven tokens came to be proposed, approved and never
-- authored. Defaulting to `decide` instead would trade that for over-ceremony, and §9 names
-- that risk directly: a gate that fires on everything teaches people to bypass it.
--
-- So the default stays `confirm` and a CHECK constraint makes the dangerous combination
-- impossible rather than merely discouraged: a row whose `visual` proposes an after-value
-- CANNOT be registered `confirm` or `close`. Verified before writing it that a CHECK can
-- read `JSON_VALUE` here — probed against this database, refused the bad row, accepted both
-- good ones. The mis-filing is now a constraint violation, not a convention someone has to
-- remember.
--
-- ── What the backfill can and cannot see, stated rather than glossed ───────────────
-- 21 rows are set to `decide` because their own `visual` names an after-value: a proposed
-- token (`afterVar`), a proposed hex, or a literal (`afterValue`/`after`). 13 of those name
-- a token that ALREADY resolves in `tokens/` — reuse is a decision too, and recording it is
-- what makes it precedent for the next component.
--
-- Six rows that plainly need a decision are NOT among them: B-2, B-3, B-4, B-7, B-8 and B-9
-- carry `afterVar = null` and, in its place, the prose `afterNote: "Resolved by Q2 and the
-- approved Color token lab candidate."` — an IOU pointing at a decision this database has
-- never held. Their proposed token exists only as `proposedVar` in `proposedDarkRailTokens`,
-- a TypeScript array in `sandbox/src/data/rail-sidebar.ts`. The corpus cannot answer "what
-- token does B-2 propose", which is exactly why they cannot be found here. Migration 024
-- migrates that array and promotes these six with real data rather than parsed prose.
--
-- `afterNote` is deliberately NOT used as a signal, in the CHECK or the backfill: it carries
-- at least three unrelated meanings across the corpus — that IOU on the B rows, "Implemented
-- as ..." on C-6..C-9, and plain fact on Q1/Q3/Q4. A backfill keyed on it would be guessing.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence
    ADD register NVARCHAR(10) NOT NULL
        CONSTRAINT df_divergence_register DEFAULT 'confirm';
GO

ALTER TABLE sandbox.divergence
    ADD CONSTRAINT ck_divergence_register
        CHECK (register IN ('decide','confirm','close'));
GO

-- The backfill runs BEFORE the proposal CHECK below, and the order is load-bearing: every
-- row takes the `confirm` default the moment the column is added, so creating that
-- constraint first would fail against the 21 rows this statement is about to correct.
UPDATE sandbox.divergence
SET    register   = 'decide',
       updated_at = SYSUTCDATETIME()
WHERE  visual IS NOT NULL
  AND (   JSON_VALUE(visual,'$.afterVar')      IS NOT NULL
       OR JSON_VALUE(visual,'$.afterHexLight') IS NOT NULL
       OR JSON_VALUE(visual,'$.afterHexDark')  IS NOT NULL
       OR JSON_VALUE(visual,'$.afterValue')    IS NOT NULL
       OR JSON_VALUE(visual,'$.after')         IS NOT NULL);
GO

-- A row that proposes a value owes a decision. Making this a CHECK rather than a rule in a
-- procedure means it holds for every write path that exists now or later, including the
-- import scripts and any future one that forgets.
ALTER TABLE sandbox.divergence
    ADD CONSTRAINT ck_divergence_register_proposal
        CHECK (
            register = 'decide'
            OR (    JSON_VALUE(visual,'$.afterVar')      IS NULL
                AND JSON_VALUE(visual,'$.afterHexLight') IS NULL
                AND JSON_VALUE(visual,'$.afterHexDark')  IS NULL
                AND JSON_VALUE(visual,'$.afterValue')    IS NULL
                AND JSON_VALUE(visual,'$.after')         IS NULL));
GO

-- ── reaching `close` ──────────────────────────────────────────────────────────────
-- A vocabulary value nothing can ever set is worse than no value at all: it asserts a
-- structure and then lies about it. `close` is the one register the backfill deliberately
-- leaves empty, so it needs a way in — and, being a human act, the same ownership rule the
-- rest of them follow (migration 016): a machine may not re-register a component it does
-- not own, and the caller names itself.
CREATE OR ALTER PROCEDURE sandbox.usp_set_register
    @divergence_id INT,
    @register      NVARCHAR(10),
    @machine       NVARCHAR(50),
    @reason        NVARCHAR(400)
AS
BEGIN
    SET NOCOUNT ON;

    IF @register NOT IN ('decide','confirm','close')
        THROW 51010, 'register must be decide, confirm or close.', 1;

    IF @reason IS NULL OR LEN(LTRIM(RTRIM(@reason))) = 0
        THROW 51011, 'A reason is required: re-registering a row changes what a human is asked to do with it.', 1;

    DECLARE @component_id INT =
        (SELECT component_id FROM sandbox.divergence WHERE divergence_id = @divergence_id);
    IF @component_id IS NULL THROW 51013, 'No such divergence.', 1;

    -- Table-valued, not scalar: TOP 1 so the caller sees the refusal that actually applies
    -- rather than a concatenation of every reason it might have been refused.
    DECLARE @refusal NVARCHAR(400) =
        (SELECT TOP 1 reason FROM sandbox.fn_component_write_refusal(@component_id, @machine));
    IF @refusal IS NOT NULL THROW 51012, @refusal, 1;

    -- The proposal CHECK still applies; a row proposing a value cannot be registered away
    -- from `decide`, and the constraint says so rather than this procedure duplicating it.
    UPDATE sandbox.divergence
    SET    register   = @register,
           updated_at = SYSUTCDATETIME()
    WHERE  divergence_id = @divergence_id;
END
GO

GRANT EXECUTE ON OBJECT::sandbox.usp_set_register TO app_rw;
GO
