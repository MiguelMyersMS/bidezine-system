-- ═══════════════════════════════════════════════════════════════════════════════════
-- 020 — a divergence can be ABOUT another divergence.
--
-- Rail Sidebar's icon-fill mechanism is three rows: `Q1` (the decision, carrying options
-- with one chosen), `A-9` (the divergence it answers), `R-1` (the risk that filled reaches
-- only actionable states). They are peers in the table because M4's import folded three
-- source arrays into one — which was correct, and this is its cost.
--
-- They are NOT duplicates and this table must never be used to merge them. They ask
-- different questions, and a risk can carry an open action item the divergence it concerns
-- does not cover. Nothing here lets one row's resolution close another.
--
-- ── Why this is not the case I refused for question/risk entity schemas ────────────
-- Refusing to model `options`/`actionItems` from one occupant was refusing to invent an
-- entity SHAPE from a single sample. This is not that. These rows already share one table,
-- already carry a gate — `Q1`, `A-9` and `R-1` each report two unmet requirements right
-- now — and are already treated identically by everything downstream. The edge describes
-- the TABLE's semantics, not this occupant's content, so it generalises by construction
-- rather than by hoping the second occupant looks like the first.
--
-- ── The cost of not having it, which is not cosmetic ──────────────────────────────
-- One decision currently counts as three pieces of work: three rows, six unmet
-- requirements, three cards in the queue. Every count M9's false-completion ranking
-- eventually reads is inflated by that fan-out, and a ranking built on inflated counts is
-- the kind of confident-looking number this project exists to refuse.
--
-- ── What this table does NOT do ───────────────────────────────────────────────────
-- It is not `blocked_by` (which points at a `system_change`) and it is not `relation` on
-- `divergence` itself (which is subject geometry — gap, pitch, containment — from
-- migration 010). Those already exist and mean other things.
--
-- ── Typed and directional, deliberately ───────────────────────────────────────────
-- `kind` is constrained to a named set. An untyped "related to" becomes a junk drawer
-- within a milestone, and a drawer cannot answer "nest this row under that one" — the
-- thing the queue needs. Direction matters for the same reason: `Q1 answers A-9` and
-- `A-9 answers Q1` are not the same claim, and only one is true.
--
-- ── Hand-authored, never inferred ─────────────────────────────────────────────────
-- `origin_record` DOES carry the answer — `R-1`'s own action items literally cite
-- `["Q1","A-9"]`, and ten other risk rows carry similar references. It is still not the
-- source. That column's contract is verbatim fidelity to the source, so reading structure
-- out of it would mine meaning from a field promising only preservation, and the next
-- occupant's source may carry no references at all. Same split `declare-divergences.mjs`
-- already makes: properties are DERIVED from check specs, labels are HAND-AUTHORED,
-- because "what this asserts" is mechanical and "what this means" is a reading.
--
-- `note` is therefore NOT NULL and non-empty: every edge states what establishes it. An
-- unexplained relation is the audit-trail problem `ownership_transfer` already solved once.
-- ═══════════════════════════════════════════════════════════════════════════════════

IF OBJECT_ID('sandbox.divergence_relation', 'U') IS NULL
BEGIN
    CREATE TABLE sandbox.divergence_relation (
        relation_id         INT IDENTITY(1,1) NOT NULL
            CONSTRAINT pk_divergence_relation PRIMARY KEY,
        -- The satellite: the question, or the risk.
        from_divergence_id  INT           NOT NULL,
        -- The subject it is about.
        to_divergence_id    INT           NOT NULL,
        kind                NVARCHAR(20)  NOT NULL,
        note                NVARCHAR(400) NOT NULL,
        created_at          DATETIME2(3)  NOT NULL
            CONSTRAINT df_divergence_relation_created DEFAULT SYSUTCDATETIME(),
        created_by          NVARCHAR(200) NOT NULL
            CONSTRAINT df_divergence_relation_by DEFAULT SUSER_SNAME(),

        -- 'answers' — a decision row resolving the question a divergence raises (Q1 -> A-9).
        -- 'risks'   — a follow-through a divergence's resolution must not lose (R-1 -> A-9).
        -- Add a value only with a real case in front of you; each one is a promise the UI
        -- has to render distinctly, and a kind nothing renders is a kind that means nothing.
        CONSTRAINT ck_divergence_relation_kind CHECK (kind IN ('answers','risks')),

        -- A row about itself is a data-entry slip, never a claim worth storing.
        CONSTRAINT ck_divergence_relation_self CHECK (from_divergence_id <> to_divergence_id),

        CONSTRAINT ck_divergence_relation_note CHECK (LEN(LTRIM(RTRIM(note))) > 0),

        CONSTRAINT uq_divergence_relation UNIQUE (from_divergence_id, to_divergence_id, kind),

        CONSTRAINT fk_divergence_relation_from FOREIGN KEY (from_divergence_id)
            REFERENCES sandbox.divergence (divergence_id),
        CONSTRAINT fk_divergence_relation_to FOREIGN KEY (to_divergence_id)
            REFERENCES sandbox.divergence (divergence_id)
    );

    CREATE INDEX ix_divergence_relation_to   ON sandbox.divergence_relation (to_divergence_id, kind);
    CREATE INDEX ix_divergence_relation_from ON sandbox.divergence_relation (from_divergence_id, kind);
END
GO

-- Read by the app and by agents. WRITTEN by neither: population is a deliberate act run as
-- ADMIN, exactly like the original import and `declare-divergences.mjs`, because asserting
-- that one row is about another is a reading of meaning rather than a measurement.
GRANT SELECT ON OBJECT::sandbox.divergence_relation TO app_rw;
GRANT SELECT ON OBJECT::sandbox.divergence_relation TO agent_rw;
GRANT SELECT ON OBJECT::sandbox.divergence_relation TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence_relation TO app_rw;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence_relation TO agent_rw;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence_relation TO runner_evidence;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- fn_divergence_relations — both directions, in one call, with the other row's ref_code
-- already resolved.
--
-- One function rather than two queries, and rather than the UI joining this itself: the
-- queue needs "what hangs off this row" AND "what is this row about", and two independent
-- readings of one relation is how the icon-fill and text-weight halves of a selected row
-- drifted apart in the Rail Sidebar work (checklist item 20).
--
-- `direction` is from the perspective of @divergence_id: 'satellite' means the other row
-- points AT this one (this row is the subject); 'subject' means this row points at it.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER FUNCTION sandbox.fn_divergence_relations (@divergence_id INT)
RETURNS TABLE
AS
RETURN
    SELECT  direction      = CAST('satellite' AS NVARCHAR(10)),
            r.kind,
            other_id       = d.divergence_id,
            other_ref      = d.ref_code,
            other_title    = d.title,
            other_state    = d.state,
            r.note
    FROM    sandbox.divergence_relation r
    JOIN    sandbox.divergence d ON d.divergence_id = r.from_divergence_id
    WHERE   r.to_divergence_id = @divergence_id

    UNION ALL

    SELECT  CAST('subject' AS NVARCHAR(10)),
            r.kind,
            d.divergence_id,
            d.ref_code,
            d.title,
            d.state,
            r.note
    FROM    sandbox.divergence_relation r
    JOIN    sandbox.divergence d ON d.divergence_id = r.to_divergence_id
    WHERE   r.from_divergence_id = @divergence_id;
GO

GRANT SELECT ON OBJECT::sandbox.fn_divergence_relations TO app_rw;
GRANT SELECT ON OBJECT::sandbox.fn_divergence_relations TO agent_rw;
GRANT SELECT ON OBJECT::sandbox.fn_divergence_relations TO runner_evidence;
GO
