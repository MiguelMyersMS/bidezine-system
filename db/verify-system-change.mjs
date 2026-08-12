// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 7, step 3's definition of done.
//
//   node verify-system-change.mjs
//
// A system change is the one entity the spec calls a multiplier: a divergence can be
// wrong about one component, a system change is wrong about all of them at once. So the
// ceremony is higher, and this drives every part of it against the real database — as the
// real principals, watching things be refused rather than reading the grants and reasoning
// about them.
//
// The claims under test:
//   · an agent may PROPOSE and ASSESS, because both are analysis
//   · an agent may NOT approve, land or reject — those are decisions
//   · approval is refused until there is an assessment AND a declared scope
//   · the refusal is the to-do list, not a bare no
//   · a divergence can be parked visibly on a system change, and the gate says so
//   · nothing may be blocked on a change that has already closed
//
// ── One role at a time, deliberately ────────────────────────────────────────────────
// `connect()` wraps `mssql.connect()`, which returns the PROCESS-GLOBAL pool. Holding an
// agent pool and an app pool at once does not give you two identities — the second call
// replaces the first, and the handle you are still holding fails in ways that look like a
// permissions bug rather than a connection bug. So every section below opens its role,
// uses it, and closes it. This is the same pattern verify-invariant.mjs follows, for the
// same reason.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect, sql } from "../verifier/lib/db.mjs"

const REF = "__SCT__"
const SLUG = "__sc_test__"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

/** Runs something expected to be refused; returns the refusal message, or null if it
 * unexpectedly succeeded. */
async function refused(fn) {
  try {
    await fn()
    return null
  } catch (error) {
    return error.message
  }
}

/** Opens one role, runs the body, and always closes it again. */
async function as(role, body) {
  const pool = await connect(role)
  try {
    return await body(pool)
  } finally {
    await pool.close().catch(() => {})
  }
}

// Unblocking has to move `state` alongside `blocked_by` — ck_divergence_blocked binds
// them together, and clearing one without the other is refused. This cleanup learned that
// the same way usp_block_divergence did.
const CLEANUP = `
  UPDATE sandbox.divergence
    SET blocked_by = NULL, state = ISNULL(blocked_from_state, 'open'), blocked_from_state = NULL
    WHERE blocked_by IN (SELECT system_change_id FROM sandbox.system_change WHERE LEFT(ref_code, 7) = '__SCT__');
  DELETE dd FROM sandbox.divergence_dependency dd JOIN sandbox.divergence d ON d.divergence_id = dd.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE e FROM sandbox.evidence e JOIN sandbox.divergence d ON d.divergence_id = e.divergence_id JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE d FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}';
  DELETE FROM sandbox.component WHERE slug = '${SLUG}';
  DELETE FROM sandbox.system_change WHERE LEFT(ref_code, 7) = '__SCT__';`

let divergenceId
let scId
// A second system change, used for the sweep section: the first one lands mid-suite to
// prove the lifecycle, and a landed change cannot be landed twice.
let scId2

try {
  divergenceId = await as("ADMIN", async (admin) => {
    await admin.request().batch(CLEANUP)
    await admin.request().batch(`
      INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'System change fixture', 'build');
      INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state)
        SELECT component_id, 'SC-T1', 'layout-sizing', 'Fixture row', 'open'
        FROM sandbox.component WHERE slug = '${SLUG}';`)
    return (
      await admin.request().query(`SELECT d.divergence_id FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}'`)
    ).recordset[0].divergence_id
  })

  // ── an agent proposes ────────────────────────────────────────────────────────────
  console.log("\nan agent proposes; it does not decide\n")

  await as("AGENT", async (agent) => {
    const proposed = (
      await agent
        .request()
        .input("title", sql.NVarChar(400), "Fixture: move every icon to a new set")
        .input("detail", sql.NVarChar(sql.MAX), "Stand-in for the kind of change that invalidated everything last time.")
        .input("ref_code", sql.NVarChar(20), REF)
        .execute("sandbox.usp_propose_system_change")
    ).recordset[0]
    scId = proposed.system_change_id
    check(proposed?.state === "proposed", "an agent CAN propose a system change", `${proposed?.ref_code} = ${proposed?.state}`)

    // The hole migration 011 closed. Without the DENY this succeeds, and an agent
    // approves its own proposal — invariant 1 with nothing behind it, on the entity the
    // spec calls a multiplier.
    const directWrite = await refused(() =>
      agent.request().input("id", sql.Int, scId).query(`UPDATE sandbox.system_change SET state = 'approved' WHERE system_change_id = @id`),
    )
    check(!!directWrite, "an agent CANNOT set the state directly", (directWrite ?? "IT SUCCEEDED — the DENY is missing").slice(0, 130))

    const agentApprove = await refused(() =>
      agent
        .request()
        .input("system_change_id", sql.Int, scId)
        .input("approved_by", sql.NVarChar(100), "agent")
        .execute("sandbox.usp_approve_system_change"),
    )
    check(!!agentApprove, "an agent CANNOT execute the approval procedure either", (agentApprove ?? "IT SUCCEEDED").slice(0, 130))
  })

  // ── the gate refuses an unassessed change ────────────────────────────────────────
  console.log("\napproval is gated on the assessment, not on asking nicely\n")

  await as("APP", async (app) => {
    const early = await refused(() =>
      app
        .request()
        .input("system_change_id", sql.Int, scId)
        .input("approved_by", sql.NVarChar(100), "human:test")
        .execute("sandbox.usp_approve_system_change"),
    )
    check(!!early && /Gate refused/.test(early), "approving an unassessed change is refused", (early ?? "").slice(0, 150))
    check(
      !!early && /assessment\.present/.test(early) && /scope\.declared/.test(early) && /state\.assessed/.test(early),
      "and the refusal names EVERY unmet requirement, not just the first",
      (early ?? "").slice(0, 240),
    )
  })

  // ── assessing is analysis, so an agent may do it ─────────────────────────────────
  await as("AGENT", async (agent) => {
    const empty = await refused(() =>
      agent
        .request()
        .input("system_change_id", sql.Int, scId)
        .input("impact_assessment", sql.NVarChar(sql.MAX), "   ")
        .execute("sandbox.usp_assess_system_change"),
    )
    check(!!empty, "an empty impact assessment is refused", (empty ?? "IT SUCCEEDED").slice(0, 120))

    await agent
      .request()
      .input("system_change_id", sql.Int, scId)
      .input("impact_assessment", sql.NVarChar(sql.MAX), "Reaches every icon consumer; ~40 evidence rows would need re-verification.")
      // FICTIONAL paths, and this matters. This change LANDS later in the suite, and
      // landing runs the sweep. Realistic values here (`src/lib/**`, `icons/manifest.json`)
      // match what real divergences genuinely depend on, so the suite marked 40 real
      // evidence rows stale while reporting 17/17 — a fixture quietly invalidating the
      // corpus it was meant to be testing beside.
      .input("affected_paths", sql.NVarChar(sql.MAX), JSON.stringify(["__fixture__/icons.json", "__fixture__/lib/**"]))
      .execute("sandbox.usp_assess_system_change")
  })

  // ── the human approves, lands, and can park work behind it ───────────────────────
  console.log("\na human approves, lands, and can park work behind it\n")

  await as("APP", async (app) => {
    const assessed = (
      await app.request().input("id", sql.Int, scId).query(`SELECT state FROM sandbox.system_change WHERE system_change_id = @id`)
    ).recordset[0]
    check(assessed.state === "assessing", "an agent CAN record the assessment — analysis, not attestation", `state = ${assessed.state}`)

    await app
      .request()
      .input("system_change_id", sql.Int, scId)
      .input("approved_by", sql.NVarChar(100), "human:test")
      .execute("sandbox.usp_approve_system_change")
    const approved = (
      await app.request().input("id", sql.Int, scId).query(`SELECT state, impact_assessment FROM sandbox.system_change WHERE system_change_id = @id`)
    ).recordset[0]
    check(approved.state === "approved", "an assessed change with declared scope CAN be approved", `state = ${approved.state}`)
    check(/approved by human:test/.test(approved.impact_assessment), "and the approval is recorded in the trail, with who")
  })

  await as("AGENT", async (agent) => {
    await agent
      .request()
      .input("divergence_id", sql.Int, divergenceId)
      .input("system_change_id", sql.Int, scId)
      .execute("sandbox.usp_block_divergence")
  })

  await as("APP", async (app) => {
    const unmet = (
      await app.request().input("divergence_id", sql.Int, divergenceId).execute("sandbox.usp_divergence_gate_status")
    ).recordset
    check(
      unmet.some((u) => u.requirement === "divergence.blocked"),
      "a blocked divergence says so at the gate, naming the change",
      unmet.find((u) => u.requirement === "divergence.blocked")?.detail,
    )

    await app
      .request()
      .input("system_change_id", sql.Int, scId)
      .input("landed_commit", sql.Char(40), "b".repeat(40))
      .execute("sandbox.usp_land_system_change")
    const landed = (
      await app.request().input("id", sql.Int, scId).query(`SELECT state, landed_commit FROM sandbox.system_change WHERE system_change_id = @id`)
    ).recordset[0]
    check(
      landed.state === "landed" && landed.landed_commit?.length === 40,
      "an approved change can land, pinned to a commit",
      `${landed.state} @ ${landed.landed_commit?.slice(0, 8)}`,
    )

    const rejectLanded = await refused(() =>
      app
        .request()
        .input("system_change_id", sql.Int, scId)
        .input("reason", sql.NVarChar(sql.MAX), "changed my mind")
        .execute("sandbox.usp_reject_system_change"),
    )
    check(!!rejectLanded, "a landed change cannot be rejected — it is already in the code", (rejectLanded ?? "IT SUCCEEDED").slice(0, 110))
  })

  await as("AGENT", async (agent) => {
    const blockOnClosed = await refused(() =>
      agent
        .request()
        .input("divergence_id", sql.Int, divergenceId)
        .input("system_change_id", sql.Int, scId)
        .execute("sandbox.usp_block_divergence"),
    )
    check(
      !!blockOnClosed,
      "nothing new may be blocked on a change that already closed",
      (blockOnClosed ?? "IT SUCCEEDED — work could be parked behind a door that never opens").slice(0, 120),
    )
  })

  // ── the invalidation sweep (M7 step 4) ───────────────────────────────────────────
  //
  // P5, in one test: a change lands in a primitive, and the evidence measured against the
  // old version of that primitive stops being green. The case that matters is the one
  // path-matching misses — the fixture's evidence is anchored nowhere near `src/ui/`, and
  // is invalidated because its recorded DEPENDENCIES say it relies on Button.
  console.log("\nlanding a system change invalidates the evidence that depended on it\n")

  await as("ADMIN", async (admin) => {
    // A dependency the fixture has and NOTHING REAL DOES.
    //
    // The first version of this used 'src/ui/button.tsx' with affected_paths
    // '["src/ui/**"]', which is realistic and was exactly the problem: real rail-sidebar
    // divergences genuinely depend on that path, so landing the fixture's change swept
    // 40 real evidence rows and left them stale. A test fixture that mutates production
    // data is worse than no test — it passed 17/17 while quietly invalidating the corpus.
    //
    // A fictional path proves the same mechanism (does dependency matching select the
    // right rows?) while being structurally incapable of matching anything real.
    await admin.request().input("id", sql.Int, divergenceId).query(`
      INSERT INTO sandbox.divergence_dependency (divergence_id, path)
      VALUES (@id, '__fixture__/only-this.tsx');
      INSERT INTO sandbox.evidence
        (divergence_id, kind, check_spec, raw_output, passed, verified_at_commit, verified_at_commit_at, run_id)
      VALUES (@id, 'measurement', '{"expect":{"height":32}}', 'measured: {"height":32}', 1,
              REPLICATE('a', 40), SYSUTCDATETIME(), NEWID());`)
  })

  // A change somewhere the fixture does NOT depend on must sweep nothing. Without this,
  // a sweep that simply marked everything would pass the positive test and be useless.
  const unrelatedId = await as("ADMIN", async (admin) => {
    const r = (
      await admin.request().query(`
        INSERT INTO sandbox.system_change (ref_code, title, state, impact_assessment, affected_paths)
        OUTPUT INSERTED.system_change_id
        VALUES ('${REF}_UNRELATED', 'Fixture: a change elsewhere', 'assessing', 'Probe.', '["site/**"]')`)
    ).recordset[0].system_change_id
    scId2 = (
      await admin.request().query(`
        INSERT INTO sandbox.system_change (ref_code, title, state, impact_assessment, affected_paths)
        OUTPUT INSERTED.system_change_id
        VALUES ('${REF}_SWEEP', 'Fixture: a change only the fixture depends on', 'assessing', 'Probe.', '["__fixture__/**"]')`)
    ).recordset[0].system_change_id
    return r
  })

  await as("APP", async (app) => {
    const radius = (
      await app.request().input("id", sql.Int, unrelatedId).query(
        `SELECT ref_code FROM sandbox.fn_system_change_blast_radius(@id) WHERE ref_code = 'SC-T1'`,
      )
    ).recordset
    check(radius.length === 0, "a change touching an unrelated path sweeps nothing", `${radius.length} row(s) matched`)

    const hit = (
      await app.request().input("id", sql.Int, scId2).query(
        `SELECT ref_code, reason FROM sandbox.fn_system_change_blast_radius(@id) WHERE ref_code = 'SC-T1'`,
      )
    ).recordset
    check(
      hit.length === 1 && /depends on a path/.test(hit[0].reason),
      "a change touching a path it DOES depend on is in the blast radius, for the stated reason",
      hit[0]?.reason,
    )

    await app
      .request()
      .input("system_change_id", sql.Int, scId2)
      .input("approved_by", sql.NVarChar(100), "human:test")
      .execute("sandbox.usp_approve_system_change")
    const result = (
      await app
        .request()
        .input("system_change_id", sql.Int, scId2)
        .input("landed_commit", sql.Char(40), "c".repeat(40))
        .execute("sandbox.usp_land_system_change")
    ).recordset[0]
    check(result.stale_evidence >= 1, "landing it marks the dependent evidence stale", JSON.stringify(result))

    const ev = (
      await app.request().input("id", sql.Int, divergenceId).query(
        `SELECT is_stale, stale_reason FROM sandbox.evidence WHERE divergence_id = @id`,
      )
    ).recordset
    check(
      ev.every((e) => e.is_stale) && ev.every((e) => !!e.stale_reason),
      "and every stale row carries a reason — ck_evidence_stale forbids an unexplained one",
      ev[0]?.stale_reason?.slice(0, 90),
    )
  })
} finally {
  try {
    await as("ADMIN", (cleanup) => cleanup.request().batch(CLEANUP))
  } catch (error) {
    console.error(`cleanup failed: ${error.message}`)
  }
}

const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed.`)
process.exit(failed ? 1 : 0)
