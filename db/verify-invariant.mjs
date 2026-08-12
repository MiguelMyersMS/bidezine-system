// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 1's definition of done.
//
// Everything in docs/SANDBOX-SPEC.md rests on one claim: an agent cannot write evidence,
// and cannot move a row to "done" by asserting that it is. This script does not read the
// permissions and reason about them — it connects as each principal, tries the things
// that must fail, tries the things that must succeed, and reports what actually happened.
//
// That distinction is the whole project in miniature. A DENY you have read is a claim;
// a DENY you have watched refuse an INSERT is evidence.
//
//   node verify-invariant.mjs
//
// Creates a throwaway component/divergence, exercises the full gate loop against it, and
// removes it. Exits non-zero if any expectation is not met.
// ═══════════════════════════════════════════════════════════════════════════════════

import { randomUUID } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sql from "mssql"

const HERE = dirname(fileURLToPath(import.meta.url))
process.loadEnvFile(join(HERE, "..", ".env"))

const SLUG = "__invariant_test__"
const ANCHOR_FILE = "db/__invariant_test__.tsx"

const connect = (role) =>
  sql.connect({
    server: process.env.FABRIC_SQL_SERVER.split(",")[0],
    port: 1433,
    database: process.env.FABRIC_SQL_DATABASE,
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId: process.env[`FABRIC_${role}_CLIENT_ID`],
        clientSecret: process.env[`FABRIC_${role}_CLIENT_SECRET`],
        tenantId: process.env.FABRIC_TENANT_ID,
      },
    },
    options: { encrypt: true, trustServerCertificate: false },
    connectionTimeout: 60_000,
  })

const results = []
const record = (ok, label, note = "") => {
  results.push({ ok, label, note })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

// Asserts a statement is REFUSED. A statement that succeeds here is a broken invariant,
// not a passing test.
const mustFail = async (pool, label, query, expect) => {
  try {
    await pool.request().batch(query)
    record(false, label, "STATEMENT SUCCEEDED — it must not have.")
  } catch (err) {
    const matched = !expect || new RegExp(expect, "i").test(err.message)
    record(matched, label, matched ? err.message.split("\n")[0] : `unexpected error: ${err.message}`)
  }
}

const mustPass = async (pool, label, query) => {
  try {
    const r = await pool.request().batch(query)
    record(true, label)
    return r
  } catch (err) {
    record(false, label, err.message.split("\n")[0])
    return null
  }
}

let admin, agent, app, runner
try {
  admin = await connect("ADMIN")

  // ── fixture ──────────────────────────────────────────────────────────────────────
  await admin.request().batch(`
    DELETE fc FROM sandbox.false_completion fc JOIN sandbox.divergence d ON d.divergence_id = fc.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE a  FROM sandbox.approval a  JOIN sandbox.divergence d ON d.divergence_id = a.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE rc FROM sandbox.review_citation rc JOIN sandbox.review r ON r.review_id = rc.review_id JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE r  FROM sandbox.review r    JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE e  FROM sandbox.evidence e  JOIN sandbox.divergence d ON d.divergence_id = e.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
    DELETE FROM sandbox.component WHERE slug = '${SLUG}';
    DELETE FROM sandbox.source_file WHERE path = '${ANCHOR_FILE}';

    INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'Invariant test fixture', 'build');
    INSERT INTO sandbox.source_file (path, last_commit, last_commit_at)
      VALUES ('${ANCHOR_FILE}', REPLICATE('a', 40), DATEADD(day, -1, SYSUTCDATETIME()));
    INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, anchor_id, anchor_file)
      SELECT component_id, 'T-1', 'layout-sizing', 'Fixture divergence', 'implemented', 'T-1', '${ANCHOR_FILE}'
      FROM sandbox.component WHERE slug = '${SLUG}';`)

  const divergenceId = (
    await admin.request().query(
      `SELECT d.divergence_id FROM sandbox.divergence d
       JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}'`,
    )
  ).recordset[0].divergence_id
  await admin.close()

  // ── the invariant ────────────────────────────────────────────────────────────────
  console.log("\nagent_rw — the things an agent must not be able to do\n")
  agent = await connect("AGENT")

  await mustFail(
    agent,
    "agent CANNOT insert evidence",
    `INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
       verified_at_commit, verified_at_commit_at, run_id)
     VALUES (${divergenceId}, 'measurement', '{}', 'fabricated', 1,
       REPLICATE('b',40), SYSUTCDATETIME(), NEWID());`,
    "permission",
  )

  await mustFail(
    agent,
    "agent CANNOT set divergence state directly",
    `UPDATE sandbox.divergence SET state = 'resolved' WHERE divergence_id = ${divergenceId};`,
    "permission|denied",
  )

  await mustFail(
    agent,
    "agent CANNOT approve",
    `INSERT INTO sandbox.approval (divergence_id, approved_by, approved_at_commit)
     VALUES (${divergenceId}, 'not-a-human', REPLICATE('c',40));`,
    "permission|denied",
  )

  await mustPass(
    agent,
    "agent CAN read the corpus",
    "SELECT COUNT(*) AS n FROM sandbox.divergence_category;",
  )

  await mustPass(
    agent,
    "agent CAN ask the gate what is missing",
    `EXEC sandbox.usp_divergence_gate_status ${divergenceId};`,
  )
  await agent.close()

  // ── the gate refuses, then relents as requirements are genuinely met ──────────────
  console.log("\napp_rw — the gate, exercised end to end\n")
  app = await connect("APP")

  await mustFail(
    app,
    "gate REFUSES resolution with no evidence",
    `EXEC sandbox.usp_resolve_divergence ${divergenceId}, 'Miguel', '${"d".repeat(40)}';`,
    "evidence.present",
  )
  await app.close()

  runner = await connect("RUNNER")
  await mustPass(
    runner,
    "runner CAN insert evidence",
    `INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
       verified_at_commit, verified_at_commit_at, run_id)
     VALUES (${divergenceId}, 'measurement', '{"prop":"height"}', 'height: 36px', 1,
       REPLICATE('e',40), SYSUTCDATETIME(), '${randomUUID()}');`,
  )
  await mustFail(
    runner,
    "runner CANNOT edit evidence after the fact",
    `UPDATE sandbox.evidence SET raw_output = 'revised' WHERE divergence_id = ${divergenceId};`,
    "permission|denied",
  )
  await runner.close()

  app = await connect("APP")
  await mustFail(
    app,
    "gate STILL refuses — evidence alone is not enough",
    `EXEC sandbox.usp_resolve_divergence ${divergenceId}, 'Miguel', '${"d".repeat(40)}';`,
    "review.present",
  )
  await app.close()

  agent = await connect("AGENT")
  await mustFail(
    agent,
    "a reviewer CANNOT review its own build",
    `INSERT INTO sandbox.review (divergence_id, author_agent_id, builder_agent_id, verdict, claim, reviewed_at_commit)
     VALUES (${divergenceId}, 'same-agent', 'same-agent', 'pass', 'looks fine', REPLICATE('f',40));`,
    "ck_review_independent|constraint",
  )

  await mustPass(
    agent,
    "an independent reviewer CAN pass, citing evidence",
    `DECLARE @rid INT, @eid BIGINT;
     INSERT INTO sandbox.review (divergence_id, author_agent_id, builder_agent_id, verdict, claim, reviewed_at_commit)
     VALUES (${divergenceId}, 'reviewer-agent', 'builder-agent', 'pass', 'Measured 36px, matches.', REPLICATE('f',40));
     SET @rid = SCOPE_IDENTITY();
     SELECT TOP 1 @eid = evidence_id FROM sandbox.evidence WHERE divergence_id = ${divergenceId} ORDER BY evidence_id DESC;
     INSERT INTO sandbox.review_citation (review_id, evidence_id) VALUES (@rid, @eid);`,
  )
  await agent.close()

  app = await connect("APP")
  await mustPass(
    app,
    "gate ALLOWS resolution once every requirement is genuinely met",
    `EXEC sandbox.usp_resolve_divergence ${divergenceId}, 'Miguel', '${"d".repeat(40)}';`,
  )

  const state = (
    await app.request().query(`SELECT state FROM sandbox.divergence WHERE divergence_id = ${divergenceId}`)
  ).recordset[0].state
  record(state === "resolved", "divergence is now resolved", `state = ${state}`)
  await app.close()

  // ── reopening writes the false-completion record ──────────────────────────────────
  console.log("\nreopen — a false green, recorded rather than quietly fixed\n")
  agent = await connect("AGENT")
  await mustPass(
    agent,
    "agent CAN reopen a resolved divergence",
    `EXEC sandbox.usp_reopen_divergence ${divergenceId}, 'evidence.present',
       'Measurement was taken against the wrong element.', 'auditor-agent';`,
  )
  const after = (
    await agent
      .request()
      .query(`SELECT d.state, (SELECT COUNT(*) FROM sandbox.false_completion fc
              WHERE fc.divergence_id = d.divergence_id) AS fc
              FROM sandbox.divergence d WHERE d.divergence_id = ${divergenceId}`)
  ).recordset[0]
  record(
    after.state === "reopened" && after.fc === 1,
    "reopen recorded a false_completion row",
    `state = ${after.state}, false_completion rows = ${after.fc}`,
  )
  await agent.close()
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  // ── teardown ─────────────────────────────────────────────────────────────────────
  try {
    const cleanup = await connect("ADMIN")
    await cleanup.request().batch(`
      DELETE fc FROM sandbox.false_completion fc JOIN sandbox.divergence d ON d.divergence_id = fc.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE a  FROM sandbox.approval a  JOIN sandbox.divergence d ON d.divergence_id = a.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE rc FROM sandbox.review_citation rc JOIN sandbox.review r ON r.review_id = rc.review_id JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE r  FROM sandbox.review r    JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE e  FROM sandbox.evidence e  JOIN sandbox.divergence d ON d.divergence_id = e.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
      DELETE FROM sandbox.component WHERE slug = '${SLUG}';
      DELETE FROM sandbox.source_file WHERE path = '${ANCHOR_FILE}';`)
    await cleanup.close()
  } catch (err) {
    console.error(`\nCLEANUP FAILED — fixture rows may remain: ${err.message}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nThe invariant is NOT intact. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
