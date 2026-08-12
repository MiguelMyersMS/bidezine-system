// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 6's definition of done.
//
//   node verify-approval.mjs
//
// M6's claim is that approval stops being an act of trust: the toggle is enabled by
// COMPUTATION rather than by an actor, and reopening a false green is recorded rather than
// quietly fixed. This drives the real gate procedures against the real database, through
// the same functions the widget calls, on a fixture it creates and removes.
//
// The central check is deliberately an ATTEMPT, not an inspection. "The toggle cannot be
// enabled until requirements are genuinely met — verified by attempting it" is M6's own
// wording, and it is the only formulation that means anything: a greyed-out button proves
// the UI's opinion, while a POST that the database refuses proves the invariant. Every
// approve below is really executed; the ones that must fail, fail at Fabric.
//
// ── What this suite found the first time it ran ─────────────────────────────────────
// Reopening a resolved divergence wrote the false_completion row and moved the state
// correctly — and left the gate reporting ZERO unmet requirements. A row reopened
// precisely BECAUSE something had been falsely passed was immediately re-approvable, on
// the strength of the very review that had wrongly passed it. M6's own spec text requires
// "the review based on the old state is invalidated"; the procedure did not do it.
// Migrations 007 and 008 close that, and the check at the end of section 3 is what would
// notice if it ever reopened.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect, sql } from "../verifier/lib/db.mjs"
import { approve, getDivergenceBundle, reopen } from "./server/corpus-api.mjs"

const SLUG = "__m6_test__"
const REF = "T-1"
const ANCHOR_FILE = "sandbox/__m6_test__.tsx"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const CLEANUP = `
  DELETE fc FROM sandbox.false_completion fc JOIN sandbox.divergence d ON d.divergence_id=fc.divergence_id JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE a  FROM sandbox.approval a  JOIN sandbox.divergence d ON d.divergence_id=a.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE rc FROM sandbox.review_citation rc JOIN sandbox.review r ON r.review_id=rc.review_id JOIN sandbox.divergence d ON d.divergence_id=r.divergence_id JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE r  FROM sandbox.review r    JOIN sandbox.divergence d ON d.divergence_id=r.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE e  FROM sandbox.evidence e  JOIN sandbox.divergence d ON d.divergence_id=e.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE FROM sandbox.component WHERE slug='${SLUG}';`

let admin
try {
  admin = await connect("ADMIN")
  await admin.request().batch(CLEANUP)
  await admin.request().batch(`
    INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'M6 approval fixture', 'build');
    INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, anchor_id, anchor_file)
      SELECT component_id, '${REF}', 'layout-sizing', 'Fixture row for M6', 'open', '${REF}', '${ANCHOR_FILE}'
      FROM sandbox.component WHERE slug='${SLUG}';`)

  const divergenceId = (
    await admin.request().query(`SELECT d.divergence_id FROM sandbox.divergence d
      JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}'`)
  ).recordset[0].divergence_id

  // ── 1. nothing measured yet ────────────────────────────────────────────────────
  console.log("\nthe gate refuses what has not been shown\n")

  let bundle = await getDivergenceBundle(SLUG, REF)
  check(!bundle.gate.ready && bundle.gate.unmet.some((u) => u.requirement === "evidence.present"),
    "a divergence with no evidence is refused",
    bundle.gate.unmet.map((u) => u.requirement).join(", "))

  let attempt = await approve(SLUG, REF)
  check(attempt.error && attempt.refusedByGate,
    "ATTEMPTING to approve it is refused by the database, not by the UI",
    (attempt.error ?? "").slice(0, 130))

  bundle = await getDivergenceBundle(SLUG, REF)
  check(bundle.divergence.state === "open" && bundle.approvals.length === 0,
    "the refused attempt changed nothing",
    `state ${bundle.divergence.state}, approvals ${bundle.approvals.length}`)

  // ── 2. evidence alone is not enough ────────────────────────────────────────────
  console.log("\nevidence alone is not enough\n")

  const runner = await connect("RUNNER")
  await runner
    .request()
    .input("id", sql.Int, divergenceId)
    .query(`INSERT INTO sandbox.evidence
              (divergence_id, kind, check_spec, raw_output, passed, verified_at_commit, verified_at_commit_at, run_id)
            VALUES (@id, 'measurement', '{"expect":{"height":32}}',
                    'expected: {"height":32}' + CHAR(10) + 'measured: {"height":32}', 1,
                    REPLICATE('a', 40), SYSUTCDATETIME(), NEWID())`)
  await runner.close()

  bundle = await getDivergenceBundle(SLUG, REF)
  check(bundle.evidence.length === 1 && bundle.evidence[0].passed,
    "the runner's evidence is visible to the widget",
    `expected ${JSON.stringify(bundle.evidence[0]?.expected)} / measured ${JSON.stringify(bundle.evidence[0]?.measured)}`)
  check(!bundle.gate.ready && bundle.gate.unmet.some((u) => u.requirement === "review.present"),
    "with evidence but no independent review, the gate STILL refuses",
    bundle.gate.unmet.map((u) => u.requirement).join(", "))

  attempt = await approve(SLUG, REF)
  check(attempt.error && attempt.refusedByGate, "and attempting it still fails at the database")

  // ── 3. an independent review opens the gate ────────────────────────────────────
  console.log("\nan independent review opens it; a human closes it\n")

  const agent = await connect("AGENT")
  const reviewId = (
    await agent
      .request()
      .input("id", sql.Int, divergenceId)
      .query(`INSERT INTO sandbox.review (divergence_id, author_agent_id, builder_agent_id, verdict, claim, reviewed_at_commit)
              OUTPUT INSERTED.review_id
              VALUES (@id, 'm6-fixture-reviewer', 'm6-fixture-builder', 'pass', 'Fixture review.', REPLICATE('a', 40))`)
  ).recordset[0].review_id
  await agent
    .request()
    .input("r", sql.Int, reviewId)
    .input("e", sql.BigInt, bundle.evidence[0].id)
    .query(`INSERT INTO sandbox.review_citation (review_id, evidence_id) VALUES (@r, @e)`)
  await agent.close()

  bundle = await getDivergenceBundle(SLUG, REF)
  check(bundle.gate.ready, "with passing evidence AND an independent review citing it, the gate opens",
    bundle.gate.unmet.map((u) => u.requirement).join(", ") || "(nothing unmet)")

  const approved = await approve(SLUG, REF, "fixture approval")
  check(approved.ok, "the approval succeeds", JSON.stringify(approved).slice(0, 120))

  bundle = await getDivergenceBundle(SLUG, REF)
  check(bundle.divergence.state === "resolved", "the divergence is resolved", `state ${bundle.divergence.state}`)
  check(
    bundle.approvals.length === 1 &&
      bundle.approvals[0].approved_at_commit?.length === 40 &&
      !!bundle.approvals[0].approved_by &&
      !!bundle.approvals[0].created_at,
    "the approval records who, when, and against which commit",
    bundle.approvals[0]
      ? `${bundle.approvals[0].approved_by} @ ${bundle.approvals[0].approved_at_commit.slice(0, 8)}`
      : "none")

  // ── 4. reopen ──────────────────────────────────────────────────────────────────
  console.log("\nreopening a false green is recorded, and does not quietly reopen the gate\n")

  const noReason = await reopen(SLUG, REF, "review.present", "   ")
  check(!!noReason.error && !noReason.ok, "reopening without a reason is refused", noReason.error)

  const done = await reopen(SLUG, REF, "review.citations_support", "Fixture reopen: the cited evidence did not support the verdict.")
  check(done.ok, "reopening with a reason succeeds")

  bundle = await getDivergenceBundle(SLUG, REF)
  check(bundle.divergence.state === "reopened", "the divergence leaves resolved", `state ${bundle.divergence.state}`)
  check(bundle.divergence.reopenedCount === 1, "the reopen is counted", `${bundle.divergence.reopenedCount}×`)
  check(
    bundle.falseCompletions.length === 1 &&
      bundle.falseCompletions[0].requirement_type === "review.citations_support",
    "a false_completion is written against the requirement type that was falsely passed",
    bundle.falseCompletions[0]?.requirement_type)

  // THE CHECK THAT CAUGHT THE REAL HOLE. Before migration 007 this reported the gate as
  // fully open: the row was immediately re-approvable on the same review the reopen had
  // just contradicted.
  check(!bundle.gate.ready && bundle.gate.unmet.some((u) => u.requirement === "review.present"),
    "the review that passed the old state is invalidated, so the row is NOT re-approvable",
    bundle.gate.unmet.map((u) => u.requirement).join(", ") || "(nothing unmet — the 007 hole is back)")

  attempt = await approve(SLUG, REF)
  check(attempt.error && attempt.refusedByGate, "and attempting to re-approve it fails at the database")

  check(bundle.reviews.length === 1,
    "the invalidated review is marked, not deleted — who passed what is M9's raw material",
    `${bundle.reviews.length} review(s) still recorded`)
} finally {
  // Always RECONNECT here rather than reusing the `admin` pool above. `mssql.connect()`
  // returns the process-global pool, so the `runner.close()` / `agent.close()` calls
  // mid-run close the very handle `admin` refers to — reusing it fails with "Connection is
  // closed" and, worse, leaves the fixture behind in the real database. Found exactly that
  // way on this suite's first green run: 18/18 passed and the cleanup silently did not.
  try {
    const cleanup = await connect("ADMIN")
    await cleanup.request().batch(CLEANUP)
    await cleanup.close()
  } catch (error) {
    console.error(`cleanup failed: ${error.message}`)
  }
}

const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed.`)
process.exit(failed ? 1 : 0)
