// ═══════════════════════════════════════════════════════════════════════════════════
// The decision record, proved against a fixture — migrations 023–026.
//
//   node db/verify-decision.mjs
//
// Everything here runs against a throwaway `__decision_test__` component that is created and
// torn down by this script, never against the real corpus. That is not tidiness: several of
// these checks need a decision to EXIST in order to prove the gate reacts to it, and writing
// a decision onto a real row would be asserting that the owner made a choice they never made
// — the precise fabrication this table was built to stop. A decision on a fixture claims
// nothing about the design system.
//
// The `reused` half of `token.authored` is the reason this file exists at all. Every real
// decision in the corpus today is `authored`, so that clause could only ever be observed
// failing; a requirement that has never been seen NOT firing is a requirement nobody has
// tested. Same for the superseded case: `divergence_decision` is append-only, so a row can
// carry an authored decision and a later reused one, and only the newest may count.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect } from "../verifier/lib/db.mjs"

const SLUG = "__decision_test__"
const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const cleanupSql = `
  DELETE dd FROM sandbox.divergence_decision dd JOIN sandbox.component c ON c.component_id=dd.component_id WHERE c.slug='${SLUG}';
  DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE FROM sandbox.component WHERE slug='${SLUG}';`

let pool
try {
  pool = await connect("ADMIN")
  const q = async (s) => (await pool.request().query(s)).recordset
  const run = (s) => pool.request().batch(s)
  await run(cleanupSql)

  // A real token name, read from the registry rather than hard-coded: hard-coding one would
  // silently stop testing anything the day it was renamed.
  const realToken = (await q(`SELECT TOP 1 name FROM sandbox.design_token ORDER BY name`))[0]?.name
  if (!realToken) throw new Error("sandbox.design_token is empty — run verifier/sync-design-tokens.mjs first")

  await run(`
    INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'Decision self-test', 'build');`)
  const componentId = (await q(`SELECT component_id FROM sandbox.component WHERE slug='${SLUG}'`))[0].component_id

  const addRow = async (ref, { visual = null, register = null } = {}) => {
    const req = pool.request()
    req.input("visual", visual)
    req.input("register", register)
    await req.query(`
      INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, visual, register)
      VALUES (${componentId}, '${ref}', 'color', 'Decision self-test ${ref}', 'implemented', @visual,
              COALESCE(@register, 'confirm'))`)
    return (await q(`SELECT divergence_id FROM sandbox.divergence WHERE component_id=${componentId} AND ref_code='${ref}'`))[0].divergence_id
  }

  // ── 023: the register, and the constraint that makes it mean something ───────────
  console.log("\nregister — a proposal cannot hide as something already built\n")

  let refused = false
  try {
    await addRow("D-BAD", { visual: JSON.stringify({ kind: "color", afterVar: "--nope" }) })
  } catch (err) {
    refused = /ck_divergence_register_proposal/.test(err.message)
  }
  check(refused, "a row proposing a token CANNOT be inserted as `confirm`, whatever the caller intended")

  const plain = await addRow("D-PLAIN")
  check(
    (await q(`SELECT register FROM sandbox.divergence WHERE divergence_id=${plain}`))[0].register === "confirm",
    "a row proposing nothing takes the `confirm` default",
  )

  const proposal = await addRow("D-PROPOSAL", {
    visual: JSON.stringify({ kind: "color", afterVar: "--decision-test-missing" }),
    register: "decide",
  })
  check(
    (await q(`SELECT register FROM sandbox.divergence WHERE divergence_id=${proposal}`))[0].register === "decide",
    "a row proposing a token inserts as `decide`",
  )

  await run(`EXEC sandbox.usp_set_register @divergence_id=${plain}, @register='close', @machine='Laptop A', @reason='fixture: close is reachable'`)
  check(
    (await q(`SELECT register FROM sandbox.divergence WHERE divergence_id=${plain}`))[0].register === "close",
    "`close` is reachable — a register value nothing can set would be a structure that lies",
  )

  // ── 025: decision.present ────────────────────────────────────────────────────────
  console.log("\ndecision.present — a `decide` row owes a recorded choice\n")

  const unmetOf = async (id, req) =>
    (await q(`SELECT COUNT(*) n FROM sandbox.fn_divergence_unmet(${id}) WHERE requirement='${req}'`))[0].n

  check(await unmetOf(proposal, "decision.present") === 1, "it fires for a `decide` row with no decision")
  check(await unmetOf(plain, "decision.present") === 0, "it does NOT fire for a row that is not `decide`")

  const record = (id, o) => {
    const r = pool.request()
    r.input("concept", o.concept ?? "fixture")
    r.input("chosen", o.chosen ?? "oklch(0.5 0 0)")
    r.input("disposition", o.disposition)
    r.input("rationale", o.rationale ?? "fixture decision, recorded by db/verify-decision.mjs")
    r.input("by", o.by ?? "fixture-owner")
    r.input("machine", o.machine ?? "Laptop A")
    r.input("token", o.token ?? null)
    return r.query(`
      EXEC sandbox.usp_record_decision
        @divergence_id=${id}, @concept=@concept, @chosen_value=@chosen,
        @disposition=@disposition, @rationale=@rationale, @decided_by=@by,
        @machine=@machine, @chosen_token=@token`)
  }

  await record(proposal, { disposition: "authored", token: "--decision-test-missing" })
  check(await unmetOf(proposal, "decision.present") === 0, "recording one clears it")

  // ── 026: token.authored, in every direction it has ───────────────────────────────
  console.log("\ntoken.authored — and the three cases where it must stay quiet\n")

  check(
    await unmetOf(proposal, "token.authored") === 1,
    "an AUTHORED token that resolves nowhere blocks the row",
  )

  const reusedRow = await addRow("D-REUSED", {
    visual: JSON.stringify({ kind: "color", afterVar: realToken }),
    register: "decide",
  })
  await record(reusedRow, { disposition: "reused", token: realToken })
  check(
    await unmetOf(reusedRow, "token.authored") === 0,
    `a REUSED token does not block — the half of the rule the real corpus cannot exercise (${realToken})`,
  )

  const noTokenRow = await addRow("D-NOTOKEN", { register: "decide" })
  await record(noTokenRow, { disposition: "authored", token: null })
  check(
    await unmetOf(noTokenRow, "token.authored") === 0,
    "an authored decision about something that is not a token at all does not block",
  )

  // Append-only: the newest decision is the one in force.
  await record(proposal, { disposition: "reused", token: realToken, rationale: "fixture: reconsidered as a reuse" })
  check(
    await unmetOf(proposal, "token.authored") === 0,
    "a later REUSED decision supersedes an earlier authored one — EXISTS over all decisions would have stayed blocked",
  )
  check(
    (await q(`SELECT COUNT(*) n FROM sandbox.divergence_decision WHERE divergence_id=${proposal}`))[0].n === 2,
    "and the superseded decision is still on record — append-only, not overwritten",
  )

  // ── the refusals ─────────────────────────────────────────────────────────────────
  console.log("\nwhat usp_record_decision refuses\n")

  for (const [label, opts, pattern] of [
    ["an empty rationale", { disposition: "reused", rationale: "   " }, /rationale is required/i],
    ["an empty decider", { disposition: "reused", by: "" }, /decided_by is required/i],
    ["a disposition outside the two", { disposition: "chosen" }, /disposition must be/i],
    ["a token name that is not a custom property", { disposition: "authored", token: "sidebar-x" }, /custom property/i],
    ["an unknown machine", { disposition: "reused", machine: "Laptop Z" }, /No machine named/i],
  ]) {
    let msg = null
    try { await record(plain, opts) } catch (err) { msg = err.message }
    check(msg !== null && pattern.test(msg), `${label} is refused`, msg?.split("\n")[0].slice(0, 92) ?? "IT WAS ACCEPTED")
  }

  const written = (await q(`SELECT COUNT(*) n FROM sandbox.divergence_decision dd JOIN sandbox.component c ON c.component_id=dd.component_id WHERE c.slug='${SLUG}'`))[0].n
  check(written === 4, "no refused call reached the INSERT", `${written} decision rows on the fixture`)

  // ── the app cannot write around the procedure ────────────────────────────────────
  console.log("\nthe procedure is the only door\n")
  await pool.close()
  pool = await connect("APP")
  let denied = null
  try {
    await pool.request().batch(`
      INSERT INTO sandbox.divergence_decision
        (component_id, concept, chosen_value, disposition, rationale, decided_by, provenance)
      VALUES (${componentId}, 'direct', 'x', 'reused', 'bypassing the procedure', 'nobody', 'recorded')`)
  } catch (err) { denied = err.message }
  check(
    denied !== null && /permission|denied/i.test(denied),
    "app_rw cannot INSERT directly — the mandatory rationale and the ownership check cannot be walked around",
    denied?.split("\n")[0].slice(0, 100) ?? "THE INSERT SUCCEEDED",
  )
} finally {
  try {
    await pool?.close()
    const admin = await connect("ADMIN")
    await admin.request().batch(cleanupSql)
    await admin.close()
  } catch (err) {
    console.error(`\ncleanup failed — ${SLUG} may still exist: ${err.message}`)
  }
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) {
  failed.forEach((r) => console.log(`  - ${r.label}`))
  process.exitCode = 1
}
