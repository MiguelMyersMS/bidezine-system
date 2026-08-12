// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 8's definition of done, for the parts that live in the database.
//
//   node verify-ownership.mjs
//
// M8 closes P6: cross-machine state is a hand-maintained markdown file whose only
// concurrency control is a `---` divider. The claims under test:
//
//   · a machine may finish work on the component it owns
//   · a machine may NOT finish work on a component another machine owns
//   · a write that does not say which machine it is gets refused, not defaulted
//   · a typo in a machine name is refused, rather than read as "unowned"
//   · ownership cannot be moved by an UPDATE, only by the audited procedure
//   · a transfer records from, to, when and WHY
//   · a transfer from a stale reading of the owner is refused
//   · an agent cannot reassign ownership at all
//   · an observer can still REOPEN — read-only must not mean voiceless
//
// ── The fixture's gate is deliberately fully satisfied ─────────────────────────────
// This is the part that makes the suite mean anything. If the fixture divergence were
// missing evidence or a review, every resolution attempt would be refused — and a refusal
// would prove nothing about ownership, because the gate would have refused a legitimate
// owner too. So the fixture is built all the way to "the gate would say yes", and then
// ownership is the ONLY thing left that can say no.
//
// That is the same trap M7 found in `evidence.current`, which passed for every row since
// M1 because its join could never match: a check that cannot fail, and a check that would
// have failed anyway, are both indistinguishable from a working check when you only look
// at the result.
//
// ── One role at a time ─────────────────────────────────────────────────────────────
// `connect()` returns the PROCESS-GLOBAL pool, so holding two roles at once silently
// gives you one identity twice. Every section opens its role, uses it, closes it.
// ═══════════════════════════════════════════════════════════════════════════════════

import { randomUUID } from "node:crypto"
import { connect, sql } from "../verifier/lib/db.mjs"

const SLUG = "__own_test__"
const ANCHOR_FILE = "db/__own_test__.tsx"

// The fixture is owned by whichever machine is NOT the one used to attempt the foreign
// write. Both are read from the table rather than typed, so the suite survives the machine
// rename that §8 of the spec still lists as an open decision.
let OWNER
let INTRUDER

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

async function refused(fn) {
  try {
    await fn()
    return null
  } catch (error) {
    return error.message
  }
}

async function as(role, body) {
  const pool = await connect(role)
  try {
    return await body(pool)
  } finally {
    await pool.close().catch(() => {})
  }
}

const CLEANUP = `
  DELETE ot FROM sandbox.ownership_transfer ot JOIN sandbox.component c ON c.component_id = ot.component_id WHERE c.slug = '${SLUG}';
  DELETE fc FROM sandbox.false_completion fc JOIN sandbox.divergence d ON d.divergence_id = fc.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE a  FROM sandbox.approval a  JOIN sandbox.divergence d ON d.divergence_id = a.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE rc FROM sandbox.review_citation rc JOIN sandbox.review r ON r.review_id = rc.review_id JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE r  FROM sandbox.review r    JOIN sandbox.divergence d ON d.divergence_id = r.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE e  FROM sandbox.evidence e  JOIN sandbox.divergence d ON d.divergence_id = e.divergence_id  JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE FROM sandbox.component WHERE slug = '${SLUG}';
  DELETE FROM sandbox.source_file WHERE path = '${ANCHOR_FILE}';`

let componentId
let divergenceId

try {
  // ── fixture: a component owned by one machine, with a gate that would otherwise pass ──
  const ids = await as("ADMIN", async (admin) => {
    const machines = (await admin.request().query(`SELECT name FROM sandbox.machine ORDER BY machine_id`)).recordset
    if (machines.length < 2) throw new Error("Fewer than two machines are registered; migration 015 seeds three.")
    OWNER = machines[0].name
    INTRUDER = machines[1].name

    await admin.request().batch(CLEANUP)
    await admin.request().batch(`
      INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'Ownership fixture', 'build');
      INSERT INTO sandbox.source_file (path, last_commit, last_commit_at)
        VALUES ('${ANCHOR_FILE}', REPLICATE('a', 40), DATEADD(day, -1, SYSUTCDATETIME()));
      INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, anchor_id, anchor_file)
        SELECT component_id, 'O-1', 'layout-sizing', 'Ownership fixture row', 'implemented', 'O-1', '${ANCHOR_FILE}'
        FROM sandbox.component WHERE slug = '${SLUG}';`)

    const row = (
      await admin.request().query(`
        SELECT c.component_id, d.divergence_id FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}'`)
    ).recordset[0]
    return row
  })
  componentId = ids.component_id
  divergenceId = ids.divergence_id

  // Evidence, written by the only identity permitted to write it.
  await as("RUNNER", async (runner) => {
    await runner.request().batch(`
      INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
        verified_at_commit, verified_at_commit_at, run_id)
      VALUES (${divergenceId}, 'measurement', '{"prop":"height"}', 'height: 36px', 1,
        REPLICATE('e',40), SYSUTCDATETIME(), '${randomUUID()}');`)
  })

  // An independent review citing it, so review.present and review.cites_evidence are met.
  await as("AGENT", async (agent) => {
    await agent.request().batch(`
      DECLARE @rid INT, @eid BIGINT;
      INSERT INTO sandbox.review (divergence_id, author_agent_id, builder_agent_id, verdict, claim, reviewed_at_commit)
      VALUES (${divergenceId}, 'reviewer-agent', 'builder-agent', 'pass', 'Measured 36px, matches.', REPLICATE('f',40));
      SET @rid = SCOPE_IDENTITY();
      SELECT TOP 1 @eid = evidence_id FROM sandbox.evidence WHERE divergence_id = ${divergenceId} ORDER BY evidence_id DESC;
      INSERT INTO sandbox.review_citation (review_id, evidence_id) VALUES (@rid, @eid);`)
  })

  // The claim, through the procedure — which is also the first half of the audit test.
  await as("APP", async (app) => {
    await app
      .request()
      .input("component_id", sql.Int, componentId)
      .input("to_machine", sql.NVarChar(50), OWNER)
      .input("note", sql.NVarChar(400), "Fixture: claiming so a foreign write has something to be refused by.")
      .execute("sandbox.usp_transfer_component")
  })

  // ── the gate would say yes; only ownership is left to say no ──────────────────────
  console.log(`\nthe fixture's gate is clean, so a refusal can only be about ownership\n`)

  await as("APP", async (app) => {
    const unmet = (
      await app.request().input("id", sql.Int, divergenceId).query(`
        SELECT requirement FROM sandbox.fn_divergence_unmet(@id)`)
    ).recordset.map((r) => r.requirement)
    check(
      unmet.length === 0,
      "every gate requirement is genuinely met before ownership is tested",
      unmet.length ? `STILL UNMET: ${unmet.join(", ")} — every refusal below would be meaningless` : "nothing unmet",
    )
  })

  // ── a foreign machine cannot finish someone else's work ───────────────────────────
  console.log(`\n${INTRUDER} may watch ${OWNER}'s component; it may not finish it\n`)

  await as("APP", async (app) => {
    const resolve = (machine) =>
      app
        .request()
        .input("divergence_id", sql.Int, divergenceId)
        .input("approved_by", sql.NVarChar(100), "human:test")
        .input("commit_sha", sql.Char(40), "d".repeat(40))
        .input("machine", sql.NVarChar(50), machine)
        .execute("sandbox.usp_resolve_divergence")

    const foreign = await refused(() => resolve(INTRUDER))
    check(
      !!foreign && new RegExp(`owned by ${OWNER}`).test(foreign),
      "a machine CANNOT resolve a divergence on a component another machine owns",
      (foreign ?? "IT SUCCEEDED — the guard is missing").slice(0, 170),
    )

    // The bypass that would make the whole guard decorative: leave the argument out.
    const nameless = await refused(() => resolve(null))
    check(
      !!nameless && /must name the machine/.test(nameless),
      "a write that does not say which machine it is gets REFUSED, not defaulted",
      (nameless ?? "IT SUCCEEDED").slice(0, 170),
    )

    // A typo must not fall through to NULL, which the guard reads as "unowned".
    const typo = await refused(() => resolve("Labtop A"))
    check(
      !!typo && /No machine named/.test(typo),
      "a typo'd machine name is refused, and the refusal lists the real ones",
      (typo ?? "IT SUCCEEDED").slice(0, 170),
    )

    // Read-only must not mean voiceless: the observer's one real power still works.
    const reopen = await refused(() =>
      app
        .request()
        .input("divergence_id", sql.Int, divergenceId)
        .input("requirement_type", sql.NVarChar(50), "evidence.present")
        .input("reason", sql.NVarChar(sql.MAX), "Observer reporting a false completion from another machine.")
        .input("discovered_by", sql.NVarChar(100), `human:${INTRUDER}`)
        .execute("sandbox.usp_reopen_divergence"),
    )
    check(!reopen, "but an observer CAN still reopen — raising a concern is not a foreign write", reopen ?? "reopened")
  })

  // Reopening moved the row to 'reopened' and invalidated the review, so the owner's own
  // resolution has to be re-earned rather than assumed. Rebuild exactly what reopen tore
  // down — this is the suite proving it understands its own cascade, not working around it.
  await as("ADMIN", async (admin) => {
    await admin.request().batch(`
      UPDATE sandbox.divergence SET state = 'implemented' WHERE divergence_id = ${divergenceId};
      UPDATE sandbox.review SET invalidated_at = NULL WHERE divergence_id = ${divergenceId};`)
  })

  console.log(`\n${OWNER} owns it, so ${OWNER} can finish it\n`)

  await as("APP", async (app) => {
    const owned = await refused(() =>
      app
        .request()
        .input("divergence_id", sql.Int, divergenceId)
        .input("approved_by", sql.NVarChar(100), "human:test")
        .input("commit_sha", sql.Char(40), "d".repeat(40))
        .input("machine", sql.NVarChar(50), OWNER)
        .execute("sandbox.usp_resolve_divergence"),
    )
    check(!owned, "the OWNER can resolve the very same divergence", owned ?? "resolved")

    const state = (
      await app.request().input("id", sql.Int, divergenceId).query(`SELECT state FROM sandbox.divergence WHERE divergence_id = @id`)
    ).recordset[0].state
    check(state === "resolved", "and the row actually moved", `state = ${state}`)
  })

  // ── ownership can only move one way ───────────────────────────────────────────────
  console.log("\nownership moves through the audited procedure, or not at all\n")

  await as("APP", async (app) => {
    const direct = await refused(() =>
      app.request().input("id", sql.Int, componentId).query(`
        UPDATE sandbox.component SET owner_machine_id = NULL WHERE component_id = @id`),
    )
    check(
      !!direct,
      "ownership CANNOT be taken with a direct UPDATE",
      (direct ?? "IT SUCCEEDED — the DENY is missing, and every audit row is optional").slice(0, 140),
    )

    // Compare-and-swap: acting on a stale reading of who owns this is the exact failure
    // HANDOFF.md cannot detect, since a file read at session start says nothing about
    // what changed during the session.
    const stale = await refused(() =>
      app
        .request()
        .input("component_id", sql.Int, componentId)
        .input("from_machine", sql.NVarChar(50), INTRUDER)
        .input("to_machine", sql.NVarChar(50), INTRUDER)
        .input("note", sql.NVarChar(400), "Acting on a stale reading of the owner.")
        .execute("sandbox.usp_transfer_component"),
    )
    check(
      !!stale && /owned by/.test(stale),
      "a transfer from a STALE reading of the owner is refused, and says what is actually true",
      (stale ?? "IT SUCCEEDED").slice(0, 190),
    )

    const noNote = await refused(() =>
      app
        .request()
        .input("component_id", sql.Int, componentId)
        .input("from_machine", sql.NVarChar(50), OWNER)
        .input("to_machine", sql.NVarChar(50), INTRUDER)
        .input("note", sql.NVarChar(400), "   ")
        .execute("sandbox.usp_transfer_component"),
    )
    check(!!noNote && /stated reason/.test(noNote), "an unexplained transfer is refused", (noNote ?? "IT SUCCEEDED").slice(0, 140))

    // A typo here is worse than elsewhere: read as NULL it would RELEASE the component
    // rather than transfer it, and the caller would see a success.
    const typoTransfer = await refused(() =>
      app
        .request()
        .input("component_id", sql.Int, componentId)
        .input("from_machine", sql.NVarChar(50), OWNER)
        .input("to_machine", sql.NVarChar(50), "PCC")
        .input("note", sql.NVarChar(400), "Typo in the destination.")
        .execute("sandbox.usp_transfer_component"),
    )
    check(!!typoTransfer && /No machine by that name/.test(typoTransfer), "a typo'd destination is refused, not read as a release", (typoTransfer ?? "IT SUCCEEDED").slice(0, 140))

    const stillOwner = (
      await app.request().input("id", sql.Int, componentId).query(`SELECT owner_name FROM sandbox.fn_component_owner(@id)`)
    ).recordset[0].owner_name
    check(stillOwner === OWNER, "and after three refused transfers the owner is unchanged", `owner = ${stillOwner}`)

    // The real thing.
    const moved = (
      await app
        .request()
        .input("component_id", sql.Int, componentId)
        .input("from_machine", sql.NVarChar(50), OWNER)
        .input("to_machine", sql.NVarChar(50), INTRUDER)
        .input("note", sql.NVarChar(400), "Handing over so the other machine can carry it.")
        .execute("sandbox.usp_transfer_component")
    ).recordset[0]
    check(moved?.owner === INTRUDER, "a real hand-over succeeds", `${moved?.previous} -> ${moved?.owner}`)

    const audit = (
      await app.request().input("id", sql.Int, componentId).query(`
        SELECT f.name AS from_name, t.name AS to_name, ot.note, ot.transferred_at, ot.transferred_by
        FROM   sandbox.ownership_transfer ot
        LEFT   JOIN sandbox.machine f ON f.machine_id = ot.from_machine_id
        LEFT   JOIN sandbox.machine t ON t.machine_id = ot.to_machine_id
        WHERE  ot.component_id = @id
        ORDER  BY ot.transfer_id`)
    ).recordset
    check(
      audit.length === 2 && audit[0].from_name === null && audit[0].to_name === OWNER && audit[1].from_name === OWNER && audit[1].to_name === INTRUDER,
      "every move is audited, including the original claim from nobody",
      audit.map((a) => `${a.from_name ?? "(none)"} -> ${a.to_name ?? "(none)"}`).join("  |  "),
    )
    check(
      audit.every((a) => a.note?.trim() && a.transferred_by?.length),
      "and each audit row carries a reason and the principal that made it",
      audit[1] ? `"${audit[1].note.slice(0, 60)}…" by ${audit[1].transferred_by.slice(0, 40)}` : "",
    )
  })

  // ── an agent cannot reassign responsibility ───────────────────────────────────────
  console.log("\nan agent analyses; it does not decide who is responsible for what\n")

  await as("AGENT", async (agent) => {
    const agentTransfer = await refused(() =>
      agent
        .request()
        .input("component_id", sql.Int, componentId)
        .input("from_machine", sql.NVarChar(50), INTRUDER)
        .input("to_machine", sql.NVarChar(50), OWNER)
        .input("note", sql.NVarChar(400), "An agent making itself the owner.")
        .execute("sandbox.usp_transfer_component"),
    )
    // Without this DENY, every ownership check above is bypassable in two steps: take the
    // component, then write to it as its legitimate owner.
    check(
      !!agentTransfer,
      "an agent CANNOT transfer ownership — otherwise the guard is two calls away from useless",
      (agentTransfer ?? "IT SUCCEEDED").slice(0, 140),
    )
  })
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  try {
    await as("ADMIN", async (admin) => admin.request().batch(CLEANUP))
  } catch (err) {
    console.error(`\nCLEANUP FAILED — fixture rows may remain: ${err.message}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nOwnership is NOT enforced as claimed. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
