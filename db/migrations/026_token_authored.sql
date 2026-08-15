-- ═══════════════════════════════════════════════════════════════════════════════════
-- 026 — `token.authored`: the requirement that turns the owner's step 2 into a refusal.
--
-- The owner's protocol, step 2: reuse an existing token and proceed; DIVERGE and the value
-- must be adopted into `tokens/` as a real token, with the row staying blocked until it is.
-- Every piece of that has existed as discipline. Discipline produced eleven approved tokens
-- that resolve in no file — `--sidebar-rail-surface`, `--sidebar-rail-hover`,
-- `--sidebar-rail-pressed`, `--sidebar-rail-active`, `--sidebar-rail-active-hover`,
-- `--sidebar-rail-border-strong`, `--sidebar-rail-divider`, `--sidebar-rail-foreground` and
-- its `-hover`/`-subtle`/`-disabled` siblings — while eight of the rows proposing them sat
-- approvable. This makes it mechanical.
--
-- ── The database cannot read tokens/, so the fact is brought to it ─────────────────
-- Same reasoning, and the same shape, as `sandbox.source_file` (001): the gate has to answer
-- a question about files, it could ask its caller, and a gate that trusts its caller is not a
-- gate. `sandbox.design_token` holds one row per token that really resolves, synced from the
-- real `tokens/*.tokens.json` by `verifier/sync-design-tokens.mjs` — which runs as ADMIN, not
-- as the app, for exactly the reason the source-file sync does: whoever can write this table
-- can make an unauthored token look authored.
--
-- ── Only the LATEST decision counts ────────────────────────────────────────────────
-- `divergence_decision` is append-only, so a row can carry several. A decision that is
-- revisited — authored, then reconsidered as a reuse — must not stay blocked by the
-- superseded one, and `EXISTS` over all of them would do exactly that. The clause below takes
-- the newest by `decided_at`, tie-broken by `decision_id` so two decisions recorded in the
-- same instant still have a defined order rather than an arbitrary one.
--
-- ── What it deliberately does not check ────────────────────────────────────────────
-- Only `disposition = 'authored'` rows with a named token are gated. A `reused` decision
-- names a token that already resolves by definition, and a decision about something that is
-- not a token at all — an element order, a structure, a behaviour — has no token to author
-- and must not be blocked waiting for one. The requirement fires on the case it can prove.
--
-- The VALUE is not compared, only the token's existence. A token authored with the wrong
-- value is a different failure, and it is already covered by the check specs the runner
-- executes against the rendered component — which measure what actually resolves, and would
-- fail loudly. Duplicating that comparison here would put the same claim in two places with
-- two ways to drift.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE sandbox.design_token (
    name         NVARCHAR(100) NOT NULL CONSTRAINT pk_design_token PRIMARY KEY,
    -- Both modes, because this project's light/dark parity gate refuses a token defined in
    -- one mode only: a token present in `light.tokens.json` alone is not authored, it is
    -- half-authored, and it renders correctly in one theme while silently inheriting in the
    -- other. `value_dark` being NULL is therefore a real state worth being able to see.
    value_light  NVARCHAR(200) NULL,
    value_dark   NVARCHAR(200) NULL,
    source_files NVARCHAR(400) NOT NULL,
    synced_commit CHAR(40)     NOT NULL,
    updated_at   DATETIME2(3)  NOT NULL CONSTRAINT df_design_token_updated DEFAULT SYSUTCDATETIME()
);
GO

GRANT SELECT ON OBJECT::sandbox.design_token TO app_rw;
GRANT SELECT ON OBJECT::sandbox.design_token TO agent_rw;
GRANT SELECT ON OBJECT::sandbox.design_token TO runner_evidence;
DENY  INSERT, UPDATE, DELETE ON OBJECT::sandbox.design_token TO app_rw;
DENY  INSERT, UPDATE, DELETE ON OBJECT::sandbox.design_token TO agent_rw;
DENY  INSERT, UPDATE, DELETE ON OBJECT::sandbox.design_token TO runner_evidence;
GO

CREATE OR ALTER FUNCTION sandbox.fn_divergence_unmet (@divergence_id INT)
RETURNS TABLE
AS
RETURN

    -- From 005: 'screenshot' is deliberately absent from the kind list. Evidence must be
    -- able to fail on its own terms.
    SELECT  requirement = CAST('evidence.present' AS NVARCHAR(50)),
            detail      = CAST('No passing, non-stale evidence row that asserts anything. '
                             + 'A screenshot records what something looked like; it does not '
                             + 'claim anything is correct.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0
                  AND  e.kind IN ('measurement','computed-style','enforcement','build','grep'))

    UNION ALL

    SELECT  'evidence.current',
            CAST(CONCAT('Newest passing evidence predates the last commit touching ',
                        d.anchor_file, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.source_file sf ON sf.path = d.anchor_file
    WHERE   d.divergence_id = @divergence_id
      AND   NOT EXISTS (
                SELECT 1 FROM sandbox.evidence e
                WHERE  e.divergence_id = @divergence_id
                  AND  e.passed = 1
                  AND  e.is_stale = 0
                  AND  e.kind IN ('measurement','computed-style','enforcement','build','grep')
                  AND  e.verified_at_commit_at >= sf.last_commit_at)

    UNION ALL

    -- From 007: a review invalidated by a reopen is not a passing review any more.
    SELECT  'review.present',
            CAST('No passing review by an agent other than the builder.' AS NVARCHAR(400))
    WHERE   NOT EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id
                  AND  r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)

    UNION ALL

    SELECT  'review.cites_evidence',
            CAST('The passing review cites no evidence.' AS NVARCHAR(400))
    WHERE   EXISTS (
                SELECT 1 FROM sandbox.review r
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)
      AND   NOT EXISTS (
                SELECT 1
                FROM   sandbox.review r
                JOIN   sandbox.review_citation rc ON rc.review_id = r.review_id
                WHERE  r.divergence_id = @divergence_id AND r.verdict = 'pass'
                  AND  r.invalidated_at IS NULL)

    UNION ALL

    SELECT  'review.citations_support',
            CAST(CONCAT('A passing review cites evidence #', CAST(e.evidence_id AS NVARCHAR(20)),
                        ' which is ',
                        CASE WHEN e.passed = 0 THEN 'failing' ELSE 'stale' END,
                        '.') AS NVARCHAR(400))
    FROM    sandbox.review r
    JOIN    sandbox.review_citation rc ON rc.review_id = r.review_id
    JOIN    sandbox.evidence e         ON e.evidence_id = rc.evidence_id
    WHERE   r.divergence_id = @divergence_id
      AND   r.verdict = 'pass'
      AND   r.invalidated_at IS NULL
      AND   (e.passed = 0 OR e.is_stale = 1)

    UNION ALL

    SELECT  'divergence.blocked',
            CAST(CONCAT('Blocked on system change ', sc.ref_code, '.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    JOIN    sandbox.system_change sc ON sc.system_change_id = d.blocked_by
    WHERE   d.divergence_id = @divergence_id

    UNION ALL

    -- Migration 025. Fires only for rows registered `decide` (023) — a row that proposes a
    -- value the design system does not yet have. `confirm` rows are untouched: the existing
    -- evidence-and-review path is exactly right for something already built.
    SELECT  'decision.present',
            CAST('This row proposes a value that is not yet the design system''s, and no decision has been recorded. Record the choice — reused or authored, with the rationale — before approving. A decision nobody wrote down cannot be required of the next component, which is how eleven tokens came to be approved and authored into no file.' AS NVARCHAR(400))
    FROM    sandbox.divergence d
    WHERE   d.divergence_id = @divergence_id
      AND   d.register = 'decide'
      AND   NOT EXISTS (SELECT 1 FROM sandbox.divergence_decision dd
                        WHERE  dd.divergence_id = @divergence_id)

    UNION ALL

    -- Migration 026. The owner's step 2, enforced: a decision that AUTHORED a new token
    -- keeps the row blocked until that token really resolves in tokens/.
    SELECT  'token.authored',
            CAST(CONCAT('The decision on this row authored a new token, ', latest.chosen_token,
                        ', and it resolves in no file under tokens/. Add it to the token source and run the emitter; the row stays blocked until it exists. Reuse of an existing token would not need this.') AS NVARCHAR(400))
    FROM    sandbox.divergence d
    CROSS APPLY (
                SELECT  TOP 1 dd.disposition, dd.chosen_token
                FROM    sandbox.divergence_decision dd
                WHERE   dd.divergence_id = d.divergence_id
                -- Append-only: the newest decision is the one in force. decision_id breaks a
                -- same-instant tie so the order is defined rather than whatever comes back.
                ORDER BY dd.decided_at DESC, dd.decision_id DESC) AS latest
    WHERE   d.divergence_id = @divergence_id
      AND   latest.disposition = 'authored'
      AND   latest.chosen_token IS NOT NULL
      AND   NOT EXISTS (SELECT 1 FROM sandbox.design_token t
                        WHERE  t.name = latest.chosen_token);
GO
