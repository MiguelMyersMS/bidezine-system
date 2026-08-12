// ═══════════════════════════════════════════════════════════════════════════════════
// M9 step 1 — which requirements get falsely passed most often.
//
//   node scripts/rank-false-completions.mjs [--min N]
//
// §6's M9 calls this "the work queue": rank the requirement types that were marked done
// and turned out not to be, and convert the worst offenders from prose into executable
// checks. `sandbox.false_completion` is where that data lands — one row per reopen,
// carrying the requirement type that was falsely passed (migration 001, written by
// usp_reopen_divergence).
//
// ── It refuses to rank a sample too small to rank ──────────────────────────────────
// The corpus currently holds ONE row. A top-three printed from one incident is a number
// that looks like evidence and is not — and this project's whole premise is that a
// confident-looking output nobody can falsify is worse than no output. So below --min
// (default 10) this prints the rows it has, says plainly that they cannot be ranked, and
// exits 0. Nothing downstream should treat that as a queue.
//
// ── Why the table is nearly empty, which is not the same as "few false completions" ─
// There is a rich record of falsified requirements in this project — 27 checklist items in
// CLAUDE.md, the flaws log in SANDBOX-PROTOCOL-LOG.md. It lives in prose because the
// workflow that produced it predates this table. Backfilling it by hand-classifying those
// incidents was considered and DELIBERATELY REJECTED: those rows would be reconstructions,
// and every future ranking would be dominated by entries nobody measured, answering a
// question about one agent's classification judgement rather than about the system. This
// project has already been burned twice by reconstructed-but-plausible records — L-34's
// impossible screenshot claim, and SVG path data reasoned from memory that passed every
// automated check. The prose record is also better for those incidents: it keeps context a
// requirement_type enum would flatten.
//
// So this starts empty on purpose and earns its ranking. Reopens write rows now.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect } from "../verifier/lib/db.mjs"

const argMin = process.argv.indexOf("--min")
const MIN_TO_RANK = argMin > -1 ? Number(process.argv[argMin + 1]) : 10

// Every requirement the gate can emit, gathered from the migrations that THROW them
// (003/004/009 for the divergence gate, 013 for staleness, 012 for blocking). Listed in
// full so a type with zero incidents is visibly zero rather than absent — "never falsified"
// and "not a requirement" look identical in a list that only shows non-zero rows, and they
// mean opposite things.
const KNOWN_REQUIREMENTS = [
  "evidence.present",
  "evidence.current",
  "evidence.stale",
  "review.present",
  "review.cites_evidence",
  "review.citations_support",
  "divergence.blocked",
  "component.blocked",
  "other",
]

let pool
try {
  pool = await connect("APP")

  const rows = (
    await pool.request().query(`
      SELECT   fc.requirement_type,
               fc.reason,
               fc.discovered_by,
               fc.created_at,
               d.ref_code,
               c.slug AS component,
               d.reopened_count
      FROM     sandbox.false_completion fc
      JOIN     sandbox.divergence d ON d.divergence_id = fc.divergence_id
      JOIN     sandbox.component  c ON c.component_id  = d.component_id
      ORDER BY fc.created_at`)
  ).recordset

  const n = rows.length
  console.log(`\n${n} false completion${n === 1 ? "" : "s"} recorded.\n`)

  if (n === 0) {
    console.log("Nothing has been reopened yet. That is not evidence that nothing was falsely passed —")
    console.log("it is evidence that nothing has been CAUGHT and recorded here. See this file's header.")
    process.exit(0)
  }

  const counts = new Map(KNOWN_REQUIREMENTS.map((r) => [r, 0]))
  for (const r of rows) counts.set(r.requirement_type, (counts.get(r.requirement_type) ?? 0) + 1)

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  if (n < MIN_TO_RANK) {
    // The important branch. Everything it prints is a fact; nothing it prints is a ranking.
    console.log(`NOT ENOUGH DATA TO RANK (have ${n}, need ${MIN_TO_RANK}).`)
    console.log("A single incident would decide the top slot, so no order is reported.\n")
    console.log("What is actually recorded:\n")
    for (const r of rows) {
      console.log(`  ${r.created_at.toISOString().slice(0, 10)}  ${r.component}/${r.ref_code}  ${r.requirement_type}`)
      console.log(`      by ${r.discovered_by} · reopened ${r.reopened_count}×`)
      console.log(`      ${String(r.reason).replace(/\s+/g, " ").slice(0, 150)}`)
    }
    console.log("\nUse §6's five named rules as M9 step 2's work queue until this table can carry one.")
    console.log("Each of those is backed by a documented incident in CLAUDE.md, which is real evidence —")
    console.log("just evidence that lives in prose rather than in this table.")
    process.exit(0)
  }

  // ── the ranking proper ────────────────────────────────────────────────────────────
  console.log("Requirement types, most falsely passed first:\n")
  const width = Math.max(...ranked.map(([r]) => r.length))
  for (const [requirement, count] of ranked) {
    const share = ((count / n) * 100).toFixed(0)
    const bar = "█".repeat(Math.round((count / ranked[0][1]) * 24))
    console.log(`  ${requirement.padEnd(width)}  ${String(count).padStart(3)}  ${share.padStart(3)}%  ${bar}`)
  }

  const never = ranked.filter(([, c]) => c === 0).map(([r]) => r)
  if (never.length) {
    console.log(`\nNever falsified: ${never.join(", ")}`)
    console.log("Shown explicitly — a requirement absent from a list of non-zero rows is indistinguishable")
    console.log("from one that does not exist, and those mean opposite things.")
  }

  // Which components produce them matters as much as which requirements: a type that only
  // ever fails on one component is a component problem, not a rule worth making executable.
  const byComponent = new Map()
  for (const r of rows) byComponent.set(r.component, (byComponent.get(r.component) ?? 0) + 1)
  console.log(`\nAcross ${byComponent.size} component(s): ${[...byComponent].map(([c, k]) => `${c} (${k})`).join(", ")}`)
  if (byComponent.size === 1) {
    console.log("All from ONE component. Treat the top of this list as that component's problem until a")
    console.log("second one contributes — otherwise M9 hard-codes one occupant's habits into system-wide CI.")
  }

  console.log("\nThe top of this list is M9 step 2's work queue: convert those from prose into checks.")
} catch (error) {
  console.error(`\nCould not read false completions: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
