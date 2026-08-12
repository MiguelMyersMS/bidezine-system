-- ═══════════════════════════════════════════════════════════════════════════════════
-- 010 — What a divergence is actually ABOUT, in machine-readable terms.
--
-- Until now a divergence carried a title, a paragraph of prose, sometimes a before/after
-- image, and — for 7 of 154 rows — an anchor pointing at one element. What it never
-- carried was a statement a machine could read: WHICH elements, WHICH properties, in
-- WHICH state.
--
-- That single absence starves three separate consumers, which is why it is worth a
-- migration of its own rather than being bolted onto whichever one needed it first:
--
--   1. THE HUMAN. Reported directly, and it is the reason this exists: "when I was going
--      through all these divergences it was really tough to understand what each card was
--      referring to... I end up always guessing if my decision was right because I never
--      had a proper visual indication of what exactly each item was about." The widget can
--      locate an anchored element today, but it cannot say WHICH PROPERTY of it is in
--      question, so it cannot call the thing out. Prose plus a detached before/after image
--      leaves the reader to map image onto element themselves.
--
--   2. THE RUNNER (M2). Its two structural gaps are exactly the two fields below that a
--      single anchor cannot express: `relation` (F-4 rail-to-panel gap, F-9 item pitch,
--      F-11 footer anchoring — each a claim about TWO elements) and a scripted `state`
--      (F-8, a drag clamp). Layout-sizing is the category most amenable to mechanical
--      measurement and the runner reaches roughly two thirds of it.
--
--   3. THE M7 SWEEP. "Mark stale every evidence row whose check touches the affected
--      property" needs an affected property to match against. Without this it must choose
--      between invalidating everything and missing the case it exists for.
--
-- The shape is deliberately uniform across every category. A colour row, a gap row and a
-- motion row all reduce to the same sentence — these subjects, in this state, differ on
-- these properties — and only the RENDERING varies, keyed by property type. That is what
-- keeps 154 rows from becoming 154 bespoke visualisations.
-- ═══════════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────────
-- divergence_subject — the element(s) a divergence is about.
--
-- A table rather than a column because a claim can concern MORE THAN ONE element, and
-- those are precisely the claims the current single-anchor model cannot express.
-- `ordinal` orders them: for a gap, subject 1 and subject 2 are the two sides.
--
-- ── Why `side` exists, and why origin gets a selector ──────────────────────────────
-- The two panes are located by different mechanisms, and that is forced rather than
-- chosen. SANDBOX-SPEC §5.5 prefers a `data-divergence` ATTRIBUTE over a stored selector,
-- because a selector rots silently when code is refactored while an attribute moves with
-- the code and its deletion shows up in a diff. That reasoning holds for the bidezine
-- side and is why `anchor_id` is used there.
--
-- It does NOT hold for origin. Origin is vendored reference material this project is
-- forbidden to edit, so no attribute can be added to it — and it is frozen by that same
-- rule, so a selector against it cannot rot. The exception is safe for exactly the reason
-- the rule exists.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.divergence_subject (
    divergence_id   INT             NOT NULL,
    ordinal         INT             NOT NULL,
    side            NVARCHAR(10)    NOT NULL,

    -- Bidezine side: the data-divergence attribute value in the component's own markup.
    anchor_id       NVARCHAR(50)    NULL,
    -- Origin side: a CSS selector resolved inside the quarantined iframe.
    selector        NVARCHAR(400)   NULL,

    -- What to call it when the widget says what it highlighted. "the rail button" reads
    -- better to a human mid-decision than a selector or an attribute value.
    label           NVARCHAR(120)   NOT NULL,

    CONSTRAINT pk_divergence_subject PRIMARY KEY (divergence_id, ordinal),
    CONSTRAINT fk_divergence_subject FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id),
    CONSTRAINT ck_divergence_subject_side CHECK (side IN ('bidezine','origin')),

    -- Each side must be located by its own mechanism, and only its own. A bidezine subject
    -- carrying a selector would quietly reintroduce the rot §5.5 rejected.
    CONSTRAINT ck_divergence_subject_locator CHECK (
        (side = 'bidezine' AND anchor_id IS NOT NULL AND selector IS NULL) OR
        (side = 'origin'   AND selector  IS NOT NULL AND anchor_id IS NULL))
);
GO

CREATE INDEX ix_divergence_subject_anchor ON sandbox.divergence_subject (anchor_id);
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- divergence_property — the propert(ies) the claim is about.
--
-- Normalised rather than a JSON array because this is a RETRIEVAL KEY, the same argument
-- §5.3 makes for the category enum: M7's sweep asks "which divergences involve this
-- property", and M9's ranking asks "which property types get falsely passed most often".
-- Both are cross-row queries, and both become awkward the moment the answer lives inside
-- a JSON blob.
-- ───────────────────────────────────────────────────────────────────────────────────
CREATE TABLE sandbox.divergence_property (
    divergence_id   INT             NOT NULL,
    property        NVARCHAR(60)    NOT NULL,

    -- Chooses the renderer, and is DERIVED from the property name rather than assigned by
    -- hand — see scripts/lib/property-type.mjs, which is the single source of that
    -- mapping. It is stored anyway because SQL needs to group by it, and
    -- sandbox/verify-approval.mjs re-derives and compares so a stored value cannot drift
    -- away from the function that produced it.
    property_type   NVARCHAR(20)    NOT NULL,

    CONSTRAINT pk_divergence_property PRIMARY KEY (divergence_id, property),
    CONSTRAINT fk_divergence_property FOREIGN KEY (divergence_id)
        REFERENCES sandbox.divergence (divergence_id),
    CONSTRAINT ck_divergence_property_type CHECK (property_type IN
        ('length','color','text','time','keyword','layer'))
);
GO

CREATE INDEX ix_divergence_property_type ON sandbox.divergence_property (property_type);
GO


-- ───────────────────────────────────────────────────────────────────────────────────
-- The two scalars that complete the sentence.
-- ───────────────────────────────────────────────────────────────────────────────────
ALTER TABLE sandbox.divergence ADD
    -- The interaction state the claim holds in. The vocabulary is the RUNNER'S OWN
    -- (verifier/run-checks.mjs `applyState`), deliberately and exactly: a declaration that
    -- named states the runner cannot drive would describe checks nobody can perform.
    -- 'transition' is absent for the same reason — motion needs a scripted sequence the
    -- runner does not yet support, and inventing the word here would imply it does.
    subject_state   NVARCHAR(20)    NULL,

    -- Set only when the claim concerns the RELATIONSHIP between two subjects rather than a
    -- property of one. NULL is the ordinary case.
    relation        NVARCHAR(20)    NULL;
GO

ALTER TABLE sandbox.divergence ADD CONSTRAINT ck_divergence_state_vocab CHECK (
    subject_state IS NULL OR subject_state IN
        ('rest','hover','active','focus','focus-visible','disabled'));
GO

ALTER TABLE sandbox.divergence ADD CONSTRAINT ck_divergence_relation CHECK (
    relation IS NULL OR relation IN ('gap','pitch','alignment','containment'));
GO
