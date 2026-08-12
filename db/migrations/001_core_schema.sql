-- ═══════════════════════════════════════════════════════════════════════════════════
-- 001 — Core schema
--
-- The Sandbox's operational store. See docs/SANDBOX-SPEC.md §5 for the domain model
-- this implements, and §3 for the invariants it exists to enforce.
--
-- Target: Fabric SQL Database (Azure SQL engine). Developed against SQL Server 2022
-- locally. Deliberately conservative T-SQL — no triggers, no computed columns, no
-- temporal tables, no JSON functions — so nothing here depends on a feature Fabric SQL
-- may not support.
--
-- Collation note: the target database is SQL_Latin1_General_CP1_CI_AS (case-INsensitive).
-- Every UNIQUE constraint below therefore treats 'L-34' and 'l-34' as the same value,
-- which is intended for ref codes, category names and hex hashes. Any column that ever
-- needs case-sensitive comparison must declare an explicit COLLATE — none do today.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA sandbox;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- machine — replaces HANDOFF.md's section-per-machine convention (spec M8).
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.machine (
    machine_id      INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_machine PRIMARY KEY,
    name            NVARCHAR(50)        NOT NULL CONSTRAINT uq_machine_name UNIQUE,
    owner_name      NVARCHAR(100)       NOT NULL,
    is_primary      BIT                 NOT NULL CONSTRAINT df_machine_primary DEFAULT 0,
    created_at      DATETIME2(3)        NOT NULL CONSTRAINT df_machine_created DEFAULT SYSUTCDATETIME()
);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- divergence_category — the retrieval key (spec §5.3).
--
-- A LOOKUP TABLE, not a CHECK constraint, deliberately: agents query this to discover
-- valid categories, and retrieval joins against it. Free-form categories would fragment
-- the corpus and destroy the "pre-fill a proposal from prior decisions in this category"
-- mechanism that the whole learning claim rests on. Adding a category is a migration.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.divergence_category (
    category        NVARCHAR(30)        NOT NULL CONSTRAINT pk_divergence_category PRIMARY KEY,
    description     NVARCHAR(300)       NOT NULL,
    sort_order      INT                 NOT NULL
);
GO

INSERT INTO sandbox.divergence_category (category, description, sort_order) VALUES
    ('icons',         'Icon choice, sourcing, filled/regular state behaviour',                10),
    ('color',         'Colour tokens, surfaces, state tints, contrast',                       20),
    ('typography',    'Font family, size, weight, line-height, truncation',                   30),
    ('layout-sizing', 'Widths, heights, row sizing, hit targets',                             40),
    ('spacing',       'Padding, margin, gaps, insets',                                        50),
    ('motion',        'Duration, easing, transitions, animation approach',                    60),
    ('elevation',     'Shadows, layering, depth',                                             70),
    ('z-index',       'Stacking order and overlay precedence',                                80),
    ('scroll',        'Scroll regions, scrollbar behaviour, overflow and gutters',            90),
    ('structure',     'Element order, slot position, composition arrangement',               100),
    ('content',       'Labels, copy, data fields present or missing',                        110),
    ('component-gap', 'A primitive bidezine lacks, or lacks a capability for',                120),
    ('naming-api',    'Prop names, exported names, API surface conflicts',                   130);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- system_change — spec §5.7.
--
-- A change whose blast radius exceeds the component that discovered it. First-class,
-- NEVER a divergence row: filing the move to Fluent icons under Rail Sidebar would
-- bury a system-level decision where nothing else can find it.
--
-- Declared before `component` because component.blocked_by references it.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.system_change (
    system_change_id    INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_system_change PRIMARY KEY,
    ref_code            NVARCHAR(20)        NOT NULL CONSTRAINT uq_system_change_ref UNIQUE,
    title               NVARCHAR(400)       NOT NULL,
    detail              NVARCHAR(MAX)       NULL,
    state               NVARCHAR(20)        NOT NULL CONSTRAINT df_system_change_state DEFAULT 'proposed',
    -- Which component's work surfaced it. Informational: the change does not belong to it.
    discovered_in       INT                 NULL,
    -- Required before approval. A system change is a multiplier; it never gets the fast lane.
    impact_assessment   NVARCHAR(MAX)       NULL,
    -- JSON array of path globs this change touches. Drives the staleness sweep.
    affected_paths      NVARCHAR(MAX)       NULL,
    landed_commit       CHAR(40)            NULL,
    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_system_change_created DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(3)        NOT NULL CONSTRAINT df_system_change_updated DEFAULT SYSUTCDATETIME(),

    CONSTRAINT ck_system_change_state CHECK (state IN
        ('proposed','assessing','approved','landed','rejected')),

    -- Cannot be approved without an impact assessment. Enforced here rather than in
    -- application code so no caller can route around it.
    CONSTRAINT ck_system_change_assessed CHECK (
        state NOT IN ('approved','landed') OR impact_assessment IS NOT NULL),

    -- Cannot be recorded as landed without the commit that landed it.
    CONSTRAINT ck_system_change_landed CHECK (
        state <> 'landed' OR landed_commit IS NOT NULL)
);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- component — a Sandbox occupant.
--
-- Owned by exactly one machine at a time (spec §5.1). Other machines are read-only
-- observers, which is why ownership is a single field and not a lock table.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.component (
    component_id        INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_component PRIMARY KEY,
    slug                NVARCHAR(100)       NOT NULL CONSTRAINT uq_component_slug UNIQUE,
    title               NVARCHAR(200)       NOT NULL,
    state               NVARCHAR(20)        NOT NULL CONSTRAINT df_component_state DEFAULT 'intake',
    owner_machine_id    INT                 NULL,
    -- Where the origin material came from: a URL, a screenshot, a design system name.
    origin_note         NVARCHAR(MAX)       NULL,
    blocked_by          INT                 NULL,
    promoted_commit     CHAR(40)            NULL,
    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_component_created DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(3)        NOT NULL CONSTRAINT df_component_updated DEFAULT SYSUTCDATETIME(),

    CONSTRAINT ck_component_state CHECK (state IN
        ('intake','analysis','decisions','build','audit','approved','promoted','blocked','reopened')),

    -- 'blocked' is not a mood. It names the system change responsible, so a component
    -- can never sit stalled with nobody able to say what it is waiting for.
    CONSTRAINT ck_component_blocked CHECK (
        (state = 'blocked' AND blocked_by IS NOT NULL) OR
        (state <> 'blocked' AND blocked_by IS NULL)),

    CONSTRAINT ck_component_promoted CHECK (
        state <> 'promoted' OR promoted_commit IS NOT NULL),

    CONSTRAINT fk_component_machine FOREIGN KEY (owner_machine_id)
        REFERENCES sandbox.machine (machine_id),
    CONSTRAINT fk_component_blocked_by FOREIGN KEY (blocked_by)
        REFERENCES sandbox.system_change (system_change_id)
);
GO

ALTER TABLE sandbox.system_change
    ADD CONSTRAINT fk_system_change_discovered_in FOREIGN KEY (discovered_in)
        REFERENCES sandbox.component (component_id);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- divergence — one difference between origin and the bidezine translation.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.divergence (
    divergence_id       INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_divergence PRIMARY KEY,
    component_id        INT                 NOT NULL,
    -- Human-facing code, unique per component: 'L-34', 'F-7'.
    ref_code            NVARCHAR(20)        NOT NULL,
    category            NVARCHAR(30)        NOT NULL,
    title               NVARCHAR(400)       NOT NULL,
    detail              NVARCHAR(MAX)       NULL,
    state               NVARCHAR(20)        NOT NULL CONSTRAINT df_divergence_state DEFAULT 'open',

    -- Scope is detected from the diff, never from judgment (spec §5.7): a fix touching
    -- tokens/ or src/ui/ is system-scoped. Recorded here; enforced by CI in M7.
    scope               NVARCHAR(10)        NOT NULL CONSTRAINT df_divergence_scope DEFAULT 'component',

    -- Tiering (spec §5.6). 'fast' requires a justification — either a cited precedent
    -- already resolved in the corpus, or human assent. An agent proposing 'fast' with
    -- no justification is the same self-graded claim as an agent declaring 'done'.
    tier                NVARCHAR(10)        NOT NULL CONSTRAINT df_divergence_tier DEFAULT 'full',
    tier_justification  NVARCHAR(MAX)       NULL,

    -- The data-divergence attribute value in the component's own markup (spec §5.5).
    -- The anchor lives in the code so it moves when the code moves; the DB only stores
    -- the id. anchor_file is the path CI checks for orphans and staleness.
    anchor_id           NVARCHAR(50)        NULL,
    anchor_file         NVARCHAR(400)       NULL,

    owner_machine_id    INT                 NULL,
    blocked_by          INT                 NULL,

    -- A deferral without a named owner is an abandonment. The gate accepts 'deferred'
    -- only because this column makes someone responsible for it.
    deferred_owner      NVARCHAR(100)       NULL,

    -- Set when a resolved row is reopened; the paired false_completion row carries why.
    reopened_count      INT                 NOT NULL CONSTRAINT df_divergence_reopened DEFAULT 0,

    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_divergence_created DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2(3)        NOT NULL CONSTRAINT df_divergence_updated DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_divergence_ref UNIQUE (component_id, ref_code),

    -- 'legacy_unverified' is the import state for rows migrated from an existing
    -- TypeScript divergence list (spec M4). It sits BEFORE 'verified' deliberately:
    -- imported reasoning is retained so retrieval has substance from day one, but
    -- nothing arrives pre-blessed. Each row still has to earn 'resolved'.
    CONSTRAINT ck_divergence_state CHECK (state IN
        ('open','proposed','decided','implemented','verified','resolved',
         'blocked','deferred','reopened','legacy_unverified')),

    CONSTRAINT ck_divergence_scope CHECK (scope IN ('component','system')),
    CONSTRAINT ck_divergence_tier  CHECK (tier  IN ('full','fast')),

    CONSTRAINT ck_divergence_tier_justified CHECK (
        tier <> 'fast' OR tier_justification IS NOT NULL),

    -- System-scoped work never gets the fast lane (spec §5.6).
    CONSTRAINT ck_divergence_system_not_fast CHECK (
        NOT (scope = 'system' AND tier = 'fast')),

    CONSTRAINT ck_divergence_deferred CHECK (
        state <> 'deferred' OR deferred_owner IS NOT NULL),

    CONSTRAINT ck_divergence_blocked CHECK (
        (state = 'blocked' AND blocked_by IS NOT NULL) OR
        (state <> 'blocked' AND blocked_by IS NULL)),

    CONSTRAINT fk_divergence_component FOREIGN KEY (component_id)
        REFERENCES sandbox.component (component_id),
    CONSTRAINT fk_divergence_category FOREIGN KEY (category)
        REFERENCES sandbox.divergence_category (category),
    CONSTRAINT fk_divergence_machine FOREIGN KEY (owner_machine_id)
        REFERENCES sandbox.machine (machine_id),
    CONSTRAINT fk_divergence_blocked_by FOREIGN KEY (blocked_by)
        REFERENCES sandbox.system_change (system_change_id)
);
GO

CREATE INDEX ix_divergence_component ON sandbox.divergence (component_id, state);
CREATE INDEX ix_divergence_category  ON sandbox.divergence (category, state);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- evidence — machine-produced, runner-written. THE core table of the whole system.
--
-- Spec §3.1/3.2: agents propose and implement but never attest. The `runner_evidence`
-- role is the only identity permitted to INSERT here; `agent_rw` is explicitly DENIED
-- (migration 002). That deny is the single most important statement in this schema —
-- everything else is bookkeeping around it.
--
-- raw_output holds the tool's ACTUAL output, not a summary. A summary is an assertion,
-- and assertions are what this table exists to replace.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.evidence (
    evidence_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_evidence PRIMARY KEY,
    divergence_id       INT                 NOT NULL,
    kind                NVARCHAR(20)        NOT NULL,

    -- The exact spec that produced this row. Re-running it must reproduce the numbers;
    -- that reproducibility is what makes bulk re-verification affordable (spec §5.7).
    check_spec          NVARCHAR(MAX)       NOT NULL,
    raw_output          NVARCHAR(MAX)       NOT NULL,
    passed              BIT                 NOT NULL,

    -- Provenance. verified_at_commit is compared against the last commit touching
    -- anchor_file: evidence older than the code it describes does not satisfy the gate.
    verified_at_commit  CHAR(40)            NOT NULL,
    run_id              UNIQUEIDENTIFIER    NOT NULL,
    -- sha256 of a screenshot or other artifact, so an agent cannot substitute an image.
    artifact_hash       CHAR(64)            NULL,

    -- Bulk-invalidated when a system change lands (spec §5.7).
    is_stale            BIT                 NOT NULL CONSTRAINT df_evidence_stale DEFAULT 0,
    stale_reason        NVARCHAR(400)       NULL,
    staled_by           INT                 NULL,

    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_evidence_created DEFAULT SYSUTCDATETIME(),
    -- Records the connecting principal automatically. An agent cannot forge this
    -- because an agent cannot insert into this table at all.
    created_by          NVARCHAR(128)       NOT NULL CONSTRAINT df_evidence_by DEFAULT SUSER_SNAME(),

    CONSTRAINT ck_evidence_kind CHECK (kind IN
        ('measurement','screenshot','computed-style','enforcement','build','grep')),

    CONSTRAINT ck_evidence_stale CHECK (
        is_stale = 0 OR stale_reason IS NOT NULL),

    CONSTRAINT fk_evidence_divergence FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id),
    CONSTRAINT fk_evidence_staled_by FOREIGN KEY (staled_by)
        REFERENCES sandbox.system_change (system_change_id)
);
GO

CREATE INDEX ix_evidence_divergence ON sandbox.evidence (divergence_id, is_stale, passed);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- review — an independent agent's verdict.
--
-- A verdict is still AI prose, so it is still fabricable. Two structural defences:
--   1. ck_review_independent — the reviewer cannot be the builder. Not a convention.
--   2. review_citation — a verdict must reference evidence by id, and the gate checks
--      that the cited rows actually support it. That constrains the reviewer to
--      reasoning over machine-produced facts rather than producing facts.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.review (
    review_id           INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_review PRIMARY KEY,
    divergence_id       INT                 NOT NULL,
    author_agent_id     NVARCHAR(100)       NOT NULL,
    builder_agent_id    NVARCHAR(100)       NOT NULL,
    verdict             NVARCHAR(10)        NOT NULL,
    claim               NVARCHAR(MAX)       NOT NULL,
    reviewed_at_commit  CHAR(40)            NOT NULL,
    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_review_created DEFAULT SYSUTCDATETIME(),

    CONSTRAINT ck_review_verdict CHECK (verdict IN ('pass','fail')),
    CONSTRAINT ck_review_independent CHECK (author_agent_id <> builder_agent_id),

    CONSTRAINT fk_review_divergence FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id)
);
GO

CREATE TABLE sandbox.review_citation (
    review_id           INT                 NOT NULL,
    evidence_id         BIGINT              NOT NULL,

    CONSTRAINT pk_review_citation PRIMARY KEY (review_id, evidence_id),
    CONSTRAINT fk_citation_review FOREIGN KEY (review_id)
        REFERENCES sandbox.review (review_id),
    CONSTRAINT fk_citation_evidence FOREIGN KEY (evidence_id)
        REFERENCES sandbox.evidence (evidence_id)
);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- approval — a human act. The only table a person writes to directly.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.approval (
    approval_id         INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_approval PRIMARY KEY,
    divergence_id       INT                 NOT NULL,
    approved_by         NVARCHAR(100)       NOT NULL,
    approved_at_commit  CHAR(40)            NOT NULL,
    note                NVARCHAR(MAX)       NULL,
    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_approval_created DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_approval_divergence FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id)
);
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- false_completion — the highest-signal data the system produces (spec §5.1).
--
-- Written whenever something previously marked resolved is reopened. Attached to the
-- REQUIREMENT TYPE that was falsely passed, not just to the divergence — because the
-- ranked list of which requirement types are falsified most often is exactly the work
-- queue for converting prose rules into executable enforcements (spec M9).
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.false_completion (
    false_completion_id INT IDENTITY(1,1)   NOT NULL CONSTRAINT pk_false_completion PRIMARY KEY,
    divergence_id       INT                 NOT NULL,
    requirement_type    NVARCHAR(50)        NOT NULL,
    reason              NVARCHAR(MAX)       NOT NULL,
    discovered_by       NVARCHAR(100)       NOT NULL,
    created_at          DATETIME2(3)        NOT NULL CONSTRAINT df_false_completion_created DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_false_completion_divergence FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id)
);
GO

CREATE INDEX ix_false_completion_type ON sandbox.false_completion (requirement_type);
GO
