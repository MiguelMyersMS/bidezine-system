-- ═══════════════════════════════════════════════════════════════════════════════════
-- 002 — Roles, grants and the deny that the whole system rests on
--
-- Spec §3 invariants 1, 2 and 4:
--   · agents propose and implement, but never attest
--   · evidence is machine-produced; judgment is human-produced
--   · the approval gate is computed, never written
--
-- Everything here is a database permission, not an application convention. That is the
-- entire point. An application rule is a thing someone can forget, route around, or
-- "temporarily" bypass at 2am; a DENY is a wall that returns an error. The project's own
-- history is the argument: the light/dark token parity gate is the only rule in this
-- codebase that is executable rather than prose, and it is the only one that has never
-- silently regressed.
--
-- Role membership is NOT assigned here. Principal names differ between local SQL Server
-- (SQL logins) and Fabric SQL (Entra service principals), so mapping lives in
-- db/bootstrap/, keeping these migrations portable across both.
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE ROLE app_rw;             -- the Sandbox UI application
CREATE ROLE agent_rw;           -- AI agents
CREATE ROLE runner_evidence;    -- the verification runner
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- Baseline: everyone reads everything.
--
-- Read access is deliberately wide. The corpus only compounds if agents can query the
-- whole of it — "what has this project already decided about scroll gutters" has to be
-- answerable without loading CLAUDE.md in full (spec P4). Nothing here is secret; the
-- controls that matter are all on WRITE.
-- ───────────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON SCHEMA::sandbox TO app_rw;
GRANT SELECT ON SCHEMA::sandbox TO agent_rw;
GRANT SELECT ON SCHEMA::sandbox TO runner_evidence;
GO

-- ═══════════════════════════════════════════════════════════════════════════════════
-- app_rw — the UI
-- ═══════════════════════════════════════════════════════════════════════════════════
GRANT INSERT, UPDATE, DELETE ON OBJECT::sandbox.component        TO app_rw;
GRANT INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence       TO app_rw;
GRANT INSERT, UPDATE, DELETE ON OBJECT::sandbox.system_change    TO app_rw;
GRANT INSERT, UPDATE, DELETE ON OBJECT::sandbox.machine          TO app_rw;

-- Approval is a human act performed through the UI. This is the only role that may
-- record one.
GRANT INSERT ON OBJECT::sandbox.approval          TO app_rw;
GRANT INSERT ON OBJECT::sandbox.false_completion  TO app_rw;
GO

-- ═══════════════════════════════════════════════════════════════════════════════════
-- agent_rw — AI agents
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Agents file and revise proposals, and may propose a system change.
GRANT INSERT, UPDATE ON OBJECT::sandbox.divergence      TO agent_rw;
GRANT INSERT, UPDATE ON OBJECT::sandbox.system_change   TO agent_rw;

-- A reviewing agent writes its verdict and the evidence it cites. ck_review_independent
-- (migration 001) already prevents a builder reviewing its own work; review_citation is
-- what forces the verdict to reason over machine-produced facts rather than invent them.
GRANT INSERT ON OBJECT::sandbox.review           TO agent_rw;
GRANT INSERT ON OBJECT::sandbox.review_citation  TO agent_rw;

-- An agent that discovers a false completion must be able to record it. This is the
-- single most valuable row the system produces and there is no reason to make it hard
-- to write — the cost of a spurious one is trivial next to the cost of a missing one.
GRANT INSERT ON OBJECT::sandbox.false_completion TO agent_rw;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- THE INVARIANT.
--
-- An agent cannot write evidence. Not "should not" — cannot.
--
-- Spec P2: an AI once produced SVG path data by reasoning about what the icon probably
-- looked like. It was syntactically valid, visually plausible, and completely wrong, and
-- it passed typecheck, build, and a live smoke test. A fabricated getBoundingClientRect
-- result is the same trick and strictly easier, because numbers look like numbers.
--
-- The defence cannot be "instruct the agent not to." It has to be that the statement
-- fails. Only `runner_evidence` — a separate identity held by the verifier runner, never
-- by an agent session — may insert here.
--
-- DENY beats GRANT in SQL Server, including via any future role membership. If someone
-- later grants agent_rw broader rights by accident, this still holds.
-- ───────────────────────────────────────────────────────────────────────────────────
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.evidence TO agent_rw;
GO

-- Agents never approve their own work, or anyone's.
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.approval TO agent_rw;
GO

-- Agents never edit a review after the fact, including their own.
DENY UPDATE, DELETE ON OBJECT::sandbox.review          TO agent_rw;
DENY UPDATE, DELETE ON OBJECT::sandbox.review_citation TO agent_rw;
GO

-- ───────────────────────────────────────────────────────────────────────────────────
-- State is not a field anyone sets.
--
-- Column-level DENY on `state` for both writing roles. Every transition goes through
-- the gate procedure (migration 003), which runs EXECUTE AS OWNER and therefore may
-- update the column its callers cannot. That is what makes "the gate is computed, never
-- written" (spec §3.4) structural rather than aspirational: there is no code path that
-- moves a component to 'promoted' without the entry requirements being evaluated first.
--
-- The rest of each row stays writable. Only the state column is off limits.
-- ───────────────────────────────────────────────────────────────────────────────────
DENY UPDATE ON sandbox.component  (state) TO agent_rw;
DENY UPDATE ON sandbox.component  (state) TO app_rw;
DENY UPDATE ON sandbox.divergence (state) TO agent_rw;
DENY UPDATE ON sandbox.divergence (state) TO app_rw;
GO

-- promoted_commit is written by the gate alongside the transition it belongs to. Letting
-- a caller set it independently would allow a component to carry a promotion commit it
-- never earned.
DENY UPDATE ON sandbox.component (promoted_commit) TO agent_rw;
DENY UPDATE ON sandbox.component (promoted_commit) TO app_rw;
GO

-- ═══════════════════════════════════════════════════════════════════════════════════
-- runner_evidence — the verifier runner
--
-- Deliberately the narrowest role in the system: it reads, and it appends evidence.
-- Nothing else. It cannot resolve a divergence, cannot approve, cannot review. It
-- measures and records what it measured.
--
-- No UPDATE grant: evidence is append-only. A measurement that turns out to be wrong is
-- superseded by a newer row, never edited — the history of what was believed and when is
-- part of what makes re-verification trustworthy. Bulk staleness marking (spec §5.7)
-- runs as the migration/admin principal, not as the runner.
-- ═══════════════════════════════════════════════════════════════════════════════════
GRANT INSERT ON OBJECT::sandbox.evidence TO runner_evidence;
GO

DENY UPDATE, DELETE ON OBJECT::sandbox.evidence     TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.approval        TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.review          TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.divergence      TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.component       TO runner_evidence;
DENY INSERT, UPDATE, DELETE ON OBJECT::sandbox.system_change   TO runner_evidence;
GO
