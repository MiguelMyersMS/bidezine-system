// F-1 was reopened and re-registered to `decide` while its review_prompt still read
// "Confirm the wider rail is right" -- a `confirm`-register sentence surviving a `decide`
// re-registration, which is why it was the only register_source='explicit' row in the
// corpus (the human overrode the register by hand rather than the text following the
// automatic derivation from register_source='prompt').
//
// Rewritten to actually ask the decide question -- whether the wider rail earns the
// divergence at all, not whether the existing choice is "right" -- and register_source
// reset to 'prompt' so the corpus has no remaining hand-overrides.
//
// node db/write-rail-f1-decide-rewrite.mjs

import { connect, sql } from "../verifier/lib/db.mjs"

const NEW_PROMPT =
  "The rail's own width matches origin's, not our Sidebar primitive's collapsed rail. The record gives no reason beyond matching origin \u2014 the same justification F-3 was corrected for. Decide whether the wider rail earns the divergence."

const pool = await connect("ADMIN")
try {
  const before = await pool.request().query(`
    SELECT d.ref_code, d.review_prompt, d.register_source, LEN(d.review_prompt) AS len
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code = 'F-1'`)
  console.log("Before:")
  console.table(before.recordset)

  await pool
    .request()
    .input("prompt", sql.NVarChar(280), NEW_PROMPT)
    .query(`
      UPDATE d
      SET d.review_prompt = @prompt, d.register_source = 'prompt'
      FROM sandbox.divergence d
      JOIN sandbox.component c ON c.component_id = d.component_id
      WHERE c.slug = 'rail-sidebar' AND d.ref_code = 'F-1'`)

  const after = await pool.request().query(`
    SELECT d.ref_code, d.review_prompt, d.register_source, LEN(d.review_prompt) AS len
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code = 'F-1'`)
  console.log("\nAfter:")
  console.table(after.recordset)

  const remaining = await pool.request().query(`
    SELECT d.ref_code, d.register_source
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.register_source = 'explicit'`)
  console.log("\nremaining register_source='explicit' rows (should be none):")
  console.table(remaining.recordset)
} finally {
  await pool.close()
}
