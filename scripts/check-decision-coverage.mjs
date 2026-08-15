// ═══════════════════════════════════════════════════════════════════════════════════
// How much of the corpus has a recorded decision, and what the rest is missing.
//
//   node scripts/check-decision-coverage.mjs
//
// Step 3 of the owner's protocol exists to accumulate PRECEDENT: a component arriving next
// month should find what this one already decided instead of inventing an answer. That only
// works if the decisions are recorded, and most of this component's are not.
//
// This reports the gap as a NUMBER rather than as "most rows lack decisions", which is the
// difference between a known debt and a vague unease. It also asserts the invariants that must
// hold whatever the counts are — a reporting script that cannot fail is a dashboard, not a
// check.
//
// ── What it refuses to infer ──────────────────────────────────────────────────────
// It does not guess which unrecorded rows COULD be recorded. That question was answered once,
// by measuring what structured source each row has (migration 030), and the answer for 69 of
// them is "prose only". Re-deriving it here from keyword matching would be the same technique
// that produced the register mis-backfill and the F-1/G-1 inversion.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect } from "../verifier/lib/db.mjs"

const SLUG = process.argv[2] ?? "rail-sidebar"
const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

let pool
try {
  pool = await connect("ADMIN")
  const q = async (s) => (await pool.request().query(s)).recordset
  const W = `FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id WHERE c.slug = '${SLUG}'`
  const HAS = `EXISTS (SELECT 1 FROM sandbox.divergence_decision dd WHERE dd.divergence_id = d.divergence_id)`

  const coverage = await q(`
    SELECT register, rows_ = COUNT(*), recorded = SUM(has_dec)
    FROM (SELECT d.register, has_dec = CASE WHEN ${HAS} THEN 1 ELSE 0 END ${W}) x
    GROUP BY register ORDER BY register`)

  console.log(`\ndecision coverage — ${SLUG}\n`)
  let total = 0
  let recorded = 0
  for (const r of coverage) {
    total += r.rows_
    recorded += r.recorded
    console.log(`  ${r.register.padEnd(8)} ${String(r.rows_).padStart(3)} rows   ${String(r.recorded).padStart(2)} recorded   ${String(r.rows_ - r.recorded).padStart(3)} without`)
  }
  console.log(`  ${"total".padEnd(8)} ${String(total).padStart(3)} rows   ${String(recorded).padStart(2)} recorded   ${String(total - recorded).padStart(3)} without`)

  // The figure worth stating on its own. It is not "rows we have not got to yet" — it is rows
  // whose own record says a decision was made and does not say what it was made against.
  const APPROVED = `(d.detail LIKE '%Approved%' OR d.detail LIKE '%Decided%' OR d.detail LIKE '%confirmed as final%')`
  const AGAINST = `(d.detail LIKE '%instead of%' OR d.detail LIKE '%rather than%' OR d.detail LIKE '%rejected%'
                    OR d.detail LIKE '%settling for%' OR d.detail LIKE '%falls between%'
                    OR d.detail LIKE '%discarded%')`
  // Two figures, scoped separately on purpose — they measure different things, and reporting
  // one number for both is the conflation that has caused every mis-backfill here.
  const NO_STRUCTURE = `d.visual IS NULL OR (
       JSON_VALUE(d.visual,'$.afterVar')      IS NULL
   AND JSON_VALUE(d.visual,'$.afterHexLight') IS NULL
   AND JSON_VALUE(d.visual,'$.afterValue')    IS NULL
   AND JSON_VALUE(d.visual,'$.after')         IS NULL)`

  const [{ n: proseOnly }] = await q(`
    SELECT n = COUNT(*) ${W} AND d.register = 'confirm' AND NOT ${HAS} AND (${NO_STRUCTURE})`)
  const [{ n: proseAsserted }] = await q(`
    SELECT n = COUNT(*) ${W} AND d.register = 'confirm' AND NOT ${HAS} AND (${NO_STRUCTURE})
      AND ${APPROVED} AND NOT ${AGAINST}`)
  const [{ n: allAsserted }] = await q(`
    SELECT n = COUNT(*) ${W} AND NOT ${HAS} AND ${APPROVED} AND NOT ${AGAINST}`)

  console.log(`\n  ${proseAsserted} of the ${proseOnly} prose-only \`confirm\` rows assert that a decision happened`)
  console.log(`  without recording what it was against. These are the ones that CANNOT be backfilled: no`)
  console.log(`  structured after-value to read, and 028 would have to be satisfied with an invented`)
  console.log(`  rejection. It is how much of this component was approved with no reason on file.`)
  console.log(`  Matched on: approved / decided / confirmed as final — minus rows that also say`)
  console.log(`  instead of / rather than / rejected / settling for / falls between / discarded.`)
  console.log(`  The terms are printed because the figure moves with them: a narrower rejection list`)
  console.log(`  reports MORE undefended rows, and a number nobody can reproduce is not a measurement.`)
  console.log(`\n  ${allAsserted} across every register, for comparison — a wider set including \`close\` rows`)
  console.log(`  and rows that do carry a structured value. Both are keyword-matched, so they are figures`)
  console.log(`  to act on rather than sets to backfill from.\n`)

  // ── invariants, which hold whatever the counts are ──────────────────────────────
  const reusedUnresolved = await q(`
    SELECT dd.decision_id, dd.chosen_token
    FROM   sandbox.divergence_decision dd
    WHERE  dd.disposition = 'reused' AND dd.chosen_token IS NOT NULL
      AND  NOT EXISTS (SELECT 1 FROM sandbox.design_token t WHERE t.name = dd.chosen_token)`)
  check(
    reusedUnresolved.length === 0,
    "every `reused` decision names a token that really resolves — reuse is provable or it is not reuse",
    reusedUnresolved.map((r) => `#${r.decision_id} ${r.chosen_token}`).join(", "),
  )

  const closeWithDecision = await q(`SELECT d.ref_code ${W} AND d.register = 'close' AND ${HAS}`)
  check(
    closeWithDecision.length === 0,
    "no `close` row carries a decision — its own text says \"Nothing to decide\", and a decision there would contradict it",
    closeWithDecision.map((r) => r.ref_code).join(", "),
  )

  const orphanTokens = await q(`
    SELECT dd.decision_id FROM sandbox.divergence_decision dd
    WHERE dd.chosen_token IS NOT NULL AND dd.chosen_token NOT LIKE '--%'`)
  check(
    orphanTokens.length === 0,
    "every chosen_token is a CSS custom property — the form design_token also stores, so token.authored can match",
    orphanTokens.map((r) => `#${r.decision_id}`).join(", "),
  )

  const noRationale = await q(`
    SELECT decision_id FROM sandbox.divergence_decision WHERE LEN(LTRIM(RTRIM(rationale))) < 20`)
  check(
    noRationale.length === 0,
    "no decision carries a rationale too short to teach anything — the field exists to be read by the next component",
    noRationale.map((r) => `#${r.decision_id}`).join(", "),
  )
} finally {
  await pool?.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) process.exitCode = 1
