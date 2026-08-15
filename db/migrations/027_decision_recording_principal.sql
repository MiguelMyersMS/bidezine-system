-- ═══════════════════════════════════════════════════════════════════════════════════
-- 027 — an agent may RELAY a decision, and the record says that it did.
--
-- The MCP server connects as `agent_rw`, and 025 granted `usp_record_decision` to `app_rw`
-- alone — so an agent asking to record a decision is refused. That is not an oversight to
-- patch quietly; it is the M1 invariant asking a real question, and the answer belongs in
-- writing.
--
-- M1: agents propose and implement, and never attest. `agent_rw` is DENIED on `evidence`
-- (002) and that deny is the most important statement in the schema. Recording a decision
-- looks like attesting — it asserts that a human chose something.
--
-- But it is not the same act, and refusing it would not protect anything. The owner of this
-- project decides in conversation, not in a form: they answer a question an agent asked, and
-- the agent is the only thing present that can write it down. Refusing the agent does not
-- move the decision to a human-operated path — it moves it back to prose in a chat log,
-- which is precisely the state that produced eleven approved tokens nobody authored.
--
-- So the write is allowed and the AMBIGUITY is removed instead. Two separate columns:
--
--   decided_by             WHO CHOSE. Caller-supplied, and therefore asserted — the same
--                          disclosure `author_agent_id` and the machine name already carry.
--   recorded_by_principal  WHICH PRINCIPAL WROTE THE ROW. Not caller-supplied: it defaults
--                          to SUSER_SNAME() and cannot be passed in, so an agent relaying a
--                          decision is visible AS a relay, forever, without depending on the
--                          agent to be honest about it.
--
-- The first is a claim. The second is a fact. Keeping them in one column would have made the
-- claim unfalsifiable, which is the shape of every failure this build is here to end.
--
-- What this still does NOT do, said plainly: it cannot prove a human was ever asked. An
-- agent that fabricates `decided_by` produces a row that is wrong in exactly the way a
-- fabricated icon path is wrong — plausible, structurally valid, and only detectable by
-- someone who knows what really happened. The mandatory rationale is the practical defence,
-- since a rationale invented alongside a fabricated decider is a much larger lie to sustain,
-- and it is the field a reviewer actually reads.
-- ═══════════════════════════════════════════════════════════════════════════════════

ALTER TABLE sandbox.divergence_decision
    ADD recorded_by_principal NVARCHAR(200) NULL
        CONSTRAINT df_decision_principal DEFAULT SUSER_SNAME();
GO

-- The eleven rows migrated by 024 were written by the ADMIN principal running that
-- migration, which is accurate and worth recording rather than leaving NULL. `provenance`
-- already marks them as reconstructed; this says which identity did the reconstructing.
UPDATE sandbox.divergence_decision
SET    recorded_by_principal = CONCAT('(migration 024, applied by ', SUSER_SNAME(), ')')
WHERE  recorded_by_principal IS NULL;
GO

-- An agent may relay. It still may not attest: `agent_rw` remains DENIED on `evidence`, and
-- nothing here changes that.
GRANT EXECUTE ON OBJECT::sandbox.usp_record_decision TO agent_rw;
GO
