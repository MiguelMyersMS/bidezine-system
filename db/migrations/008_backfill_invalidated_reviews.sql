-- ═══════════════════════════════════════════════════════════════════════════════════
-- Backfill: reviews on divergences that were already reopened.
--
-- 007 made a reopen invalidate the review it contradicts, but only for reopens that
-- happen from then on. Any divergence ALREADY sitting in 'reopened' when 007 applied
-- still carries an un-invalidated passing review — which is precisely the state 007
-- exists to make impossible, left behind by the fix for it.
--
-- Confirmed rather than assumed: immediately after 007 applied, rail-sidebar/F-2 (reopened
-- minutes earlier during M6's own acceptance run) still reported ZERO unmet requirements.
--
-- A migration that closes a hole going forward while leaving known-bad rows behind is the
-- same half-done shape as a documented-but-unimplemented decision — the gap is just
-- somewhere less visible. This closes it.
-- ═══════════════════════════════════════════════════════════════════════════════════

UPDATE  r
SET     r.invalidated_at = SYSUTCDATETIME()
FROM    sandbox.review r
JOIN    sandbox.divergence d ON d.divergence_id = r.divergence_id
WHERE   d.state = 'reopened'
  AND   r.invalidated_at IS NULL
  -- Only reviews that predate the reopen. A review recorded AFTER a reopen is a fresh
  -- judgement of the current state and is exactly what should let the row close again;
  -- invalidating it would make a reopened divergence permanently unapprovable.
  AND   r.created_at <= d.updated_at;
GO
