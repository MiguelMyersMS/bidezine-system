// ═══════════════════════════════════════════════════════════════════════════════════
// M9 step 5 — which categories have earned the fast lane.
//
//   node scripts/tier-eligibility.mjs [--min-resolved N]
//
// §5.6 defers the criteria to M9 and states the intended rule: "categories that have never
// been falsely passed have earned the fast lane."
//
// ── That rule, applied literally today, is actively unsafe ─────────────────────────
// Nothing in the corpus is resolved. 155 divergences, zero resolutions, one false
// completion — and that one is M6's own acceptance-run artifact. So "never been falsely
// passed" is true of TWELVE of the thirteen categories, covering 144 of 155 rows. Taken at
// face value it would put almost the entire corpus in the fast lane on the strength of no
// evidence whatsoever.
//
// That is not a data gap. It is the same defect this project has already shipped once and
// spent a milestone finding: `evidence.current` was satisfied for every divergence from M1
// to M7 because its JOIN could never match — a requirement met by having nothing to compare
// against. "No category has been falsely passed" and "no category has been passed" are
// indistinguishable in the data and mean opposite things.
//
// ── So the rule carries a volume guard, and that guard is the whole point ──────────
// A category earns the fast lane when it has BOTH a real record of resolutions AND no false
// completions among them. Absence of failure only means something once there has been
// something to fail at.
//
// `--min-resolved` is NOT derived from data — there is no data to derive it from yet, and
// inventing a threshold and calling it evidence-based is the exact move this file exists to
// refuse. It is a placeholder with a deliberately conservative default, and it needs a human
// decision once real resolutions accumulate. What IS derived is the shape: §5.6's own rule,
// plus the guard without which that rule reads backwards.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect } from "../verifier/lib/db.mjs"

const argMin = process.argv.indexOf("--min-resolved")
const MIN_RESOLVED = argMin > -1 ? Number(process.argv[argMin + 1]) : 5

let pool
try {
  pool = await connect("APP")

  const rows = (
    await pool.request().query(`
      SELECT   d.category,
               total     = COUNT(*),
               resolved  = SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END),
               falsified = (SELECT COUNT(*) FROM sandbox.false_completion fc
                            JOIN sandbox.divergence dd ON dd.divergence_id = fc.divergence_id
                            WHERE dd.category = d.category)
      FROM     sandbox.divergence d
      GROUP BY d.category
      ORDER BY d.category`)
  ).recordset

  const totalResolved = rows.reduce((n, r) => n + r.resolved, 0)

  console.log(`\nfast-lane eligibility — a category qualifies with ≥${MIN_RESOLVED} resolved and 0 falsified\n`)

  const width = Math.max(...rows.map((r) => r.category.length))
  let eligible = 0
  for (const r of rows) {
    const ok = r.resolved >= MIN_RESOLVED && r.falsified === 0
    if (ok) eligible++
    const why = ok
      ? "FAST"
      : r.falsified > 0
        ? `full — ${r.falsified} false completion(s)`
        : `full — only ${r.resolved} resolved, needs ${MIN_RESOLVED}`
    console.log(`  ${r.category.padEnd(width)}  ${String(r.total).padStart(3)} rows  ${String(r.resolved).padStart(3)} resolved  ${why}`)
  }

  console.log(`\n${eligible}/${rows.length} categories qualify.`)

  if (totalResolved === 0) {
    console.log("\nNothing in the corpus is resolved, so nothing has earned anything — which is the correct")
    console.log("answer, not a failure to produce one.")
    console.log("\nWorth seeing plainly: WITHOUT the volume guard, §5.6's rule as literally written")
    const naive = rows.filter((r) => r.falsified === 0)
    const naiveRows = naive.reduce((n, r) => n + r.total, 0)
    console.log(`("never falsely passed → fast lane") would qualify ${naive.length}/${rows.length} categories`)
    console.log(`covering ${naiveRows}/${rows.reduce((n, r) => n + r.total, 0)} divergences, on zero evidence.`)
    console.log("That is `evidence.current` all over again: a requirement satisfied by having nothing to compare.")
  }

  console.log(`\n--min-resolved is a placeholder (${MIN_RESOLVED}), not a derived value. It needs a human decision`)
  console.log("once real resolutions exist. Until then the conservative default costs nothing: the full path")
  console.log("is the documented default in §5.6 anyway, and over-ceremony on a corpus with no throughput")
  console.log("is a cheaper mistake than fast-laning 144 rows nobody has ever verified.")
} catch (error) {
  console.error(`\nCould not compute tier eligibility: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
