// ═══════════════════════════════════════════════════════════════════════════════════
// Record which divergences are ABOUT which other divergences.
//
//   node scripts/declare-relations.mjs [--dry-run]
//
// Migration 020's table; this is what fills it. Runs as ADMIN, like the original import
// and `declare-divergences.mjs`, because asserting that one row is about another is a
// reading of meaning rather than a measurement.
//
// ── Every edge is hand-authored and cites what establishes it ─────────────────────
// `origin_record` DOES carry these links — `R-1`'s action items literally cite
// `["Q1","A-9"]`, and ten other risk rows carry similar references. This file does not
// read them, and that is deliberate: that column's contract is verbatim fidelity to the
// source, so mining structure out of it would take meaning from a field promising only
// preservation, and the next occupant's source may carry no references at all.
//
// What each edge cites instead is a sentence a human wrote and reviewed: the first line of
// the row's own `review_prompt` (migration 018), which names the related row in prose. That
// is a claim someone made on purpose, which is the standard for asserting a relation.
//
// ── Scope: four edges, not forty ──────────────────────────────────────────────────
// Only four rows currently carry a `review_prompt` that names a related row — Q1, Q3, Q4
// and R-1. Those are recorded here.
//
// The other Q/R rows have candidate references sitting in `origin_record` (R-3 cites ten,
// R-6 cites six, and so on). They are NOT recorded, and the omission is the point: nobody
// has yet read those rows and written down what the relationship IS. "R-3 mentions H-1" and
// "R-3 is a risk against H-1" are different claims, and only the second belongs in a table
// the queue will nest rows by. Recording forty edges I inferred from a fidelity field would
// be exactly the fabrication this project keeps catching — plausible, structurally valid,
// and unverified.
//
// The named next step is not "import the rest": it is that as each row's `review_prompt`
// gets written, its relation gets declared here alongside, by the same person, in the same
// pass. The backfill is scoped to live rows for the same reason `review_prompt`'s is.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect, sql } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const DRY = process.argv.includes("--dry-run")

/**
 * from → to, with the kind and the sentence that establishes it.
 *
 * `answers` — a decision row resolving the question a divergence raises.
 * `risks`   — a follow-through the divergence's resolution must not lose.
 *
 * R-1 is a `risks` edge rather than an `answers` one even though it concerns the same
 * subject as Q1: the question decided WHAT the mechanism is, the risk constrains where it
 * may reach. Collapsing them would lose exactly the distinction that made these three rows
 * worth keeping separate.
 */
const RELATIONS = [
  {
    from: "Q1",
    to: "A-9",
    kind: "answers",
    note: "Q1's review_prompt opens 'The decision behind the filled-icon mechanism (A-9)'.",
  },
  {
    from: "Q3",
    to: "A-3",
    kind: "answers",
    note: "Q3's review_prompt opens 'The decision behind the rail's default logo (A-3)'.",
  },
  {
    from: "Q4",
    to: "A-7",
    kind: "answers",
    note: "Q4's review_prompt opens 'The decision behind the panel collapse icon (A-7)'.",
  },
  {
    from: "R-1",
    to: "A-9",
    kind: "risks",
    note: "R-1's review_prompt opens 'The follow-through on the filled-icon mechanism (A-9)' — filled must reach only actionable states.",
  },
  {
    from: "R-3",
    to: "M-1",
    kind: "risks",
    note: "R-3's review_prompt opens 'The risk behind the styling decision (M-1)'.",
  },
  {
    from: "R-7",
    to: "M-1",
    kind: "risks",
    note: "R-7's review_prompt opens 'A second risk against that same decision (M-1)'.",
  },
  {
    from: "R-10",
    to: "M-18",
    kind: "risks",
    note: "R-10's review_prompt opens 'The risk behind the two sizing bugs (M-18, M-19)'.",
  },
  {
    from: "R-10",
    to: "M-19",
    kind: "risks",
    note: "R-10's review_prompt opens 'The risk behind the two sizing bugs (M-18, M-19)'.",
  },
  {
    from: "R-5",
    to: "M-8",
    kind: "risks",
    note: "R-5's review_prompt opens 'The risk behind keeping both sidebars (M-8)'.",
  },
  {
    from: "Q2",
    to: "B-1",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-2",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-3",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-4",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-5",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-6",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-7",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-8",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "Q2",
    to: "B-9",
    kind: "answers",
    note: "Q2's review_prompt names the eight-ish dark-surface tokens B-1..B-9 propose.",
  },
  {
    from: "R-2",
    to: "Q2",
    kind: "risks",
    note: "R-2's review_prompt opens 'The risk behind that family' \u2014 the token family Q2 proposes.",
  },
]

let pool
try {
  pool = await connect("ADMIN")

  const rows = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query(`
      SELECT d.divergence_id, d.ref_code
      FROM   sandbox.divergence d
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = @slug`)
  ).recordset
  const byRef = new Map(rows.map((r) => [r.ref_code, r.divergence_id]))

  console.log(`\ndeclaring ${RELATIONS.length} relation(s) for ${SLUG}\n`)

  const plan = []
  for (const r of RELATIONS) {
    const from = byRef.get(r.from)
    const to = byRef.get(r.to)
    // Both ends must exist IN THE SAME COMPONENT. A relation spanning two components is not
    // a divergence relation — that is what system_change is for — and a missing ref is a
    // typo that would otherwise fail later as a confusing foreign-key error.
    if (!from || !to) {
      console.log(`  SKIP  ${r.from} -> ${r.to}: ${!from ? r.from : r.to} is not a ${SLUG} row`)
      continue
    }
    plan.push({ ...r, fromId: from, toId: to })
    console.log(`  ${r.from.padEnd(5)} --${r.kind}--> ${r.to}`)
    console.log(`         ${r.note}`)
  }

  if (DRY) {
    console.log("\n--dry-run: nothing written.")
    process.exit(0)
  }

  // Replace this component's relations wholesale rather than merging: an edge removed from
  // the map above must disappear from the table too, or a retracted claim quietly survives.
  await pool.request().input("slug", sql.NVarChar(100), SLUG).query(`
    DELETE r FROM sandbox.divergence_relation r
    JOIN   sandbox.divergence d ON d.divergence_id = r.from_divergence_id
    JOIN   sandbox.component c  ON c.component_id  = d.component_id
    WHERE  c.slug = @slug`)

  for (const r of plan) {
    await pool
      .request()
      .input("from", sql.Int, r.fromId)
      .input("to", sql.Int, r.toId)
      .input("kind", sql.NVarChar(20), r.kind)
      .input("note", sql.NVarChar(400), r.note)
      .query(`INSERT INTO sandbox.divergence_relation (from_divergence_id, to_divergence_id, kind, note)
              VALUES (@from, @to, @kind, @note)`)
  }

  console.log(`\n${plan.length} relation(s) recorded.`)

  // Read it back through the function the UI will use, not through the table — if those
  // two disagree, the disagreement should surface here rather than on screen.
  const subject = byRef.get("A-9")
  const back = (
    await pool.request().input("id", sql.Int, subject).query(`
      SELECT direction, kind, other_ref FROM sandbox.fn_divergence_relations(@id) ORDER BY other_ref`)
  ).recordset
  console.log(`\nA-9 now nests: ${back.map((b) => `${b.other_ref} (${b.kind}, ${b.direction})`).join(", ") || "nothing"}`)
} finally {
  await pool?.close()
}
