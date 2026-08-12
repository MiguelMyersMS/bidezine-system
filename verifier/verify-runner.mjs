// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 2's definition of done.
//
//   node verify-runner.mjs
//
// M1 proved an agent cannot WRITE evidence. This proves the thing that writes it is
// worth trusting — which is a different claim and needs its own demonstration.
//
// A runner that reported "pass" for everything would satisfy M1 perfectly and be
// completely useless. So most of what follows checks that it FAILS when it should: a
// wrong expectation, a missing anchor, an ambiguous anchor, a check that asserts
// nothing. A verifier is only as good as the things it refuses.
//
// Creates a throwaway component and divergences against verifier/fixtures/fixture.html,
// runs the real runner as a subprocess, inspects what actually landed in the database,
// and removes everything. Exits non-zero if any expectation is not met.
// ═══════════════════════════════════════════════════════════════════════════════════

import { spawnSync } from "node:child_process"
import { join } from "node:path"
import { REPO_ROOT, connect, sql } from "./lib/db.mjs"

const HERE = join(REPO_ROOT, "verifier")
const SLUG = "__verifier_test__"
const ANCHOR_FILE = "verifier/fixtures/fixture.html"
const REFS = ["T-1", "T-WRONG", "T-ANCHOR", "T-DUPLICATE", "T-EDGE"]

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const runner = (...args) =>
  spawnSync(process.execPath, [join(HERE, "run-checks.mjs"), ...args], {
    cwd: HERE,
    encoding: "utf8",
  })

const cleanupSql = `
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
  await admin.request().batch(cleanupSql)
  await admin.request().batch(`
    INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'Verifier self-test', 'build');
    ${REFS.map(
      (r) => `INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, anchor_id, anchor_file)
              SELECT component_id, '${r}', 'layout-sizing', 'Runner self-test ${r}', 'implemented', '${r}', '${ANCHOR_FILE}'
              FROM sandbox.component WHERE slug='${SLUG}';`,
    ).join("\n")}`)
  await admin.close()

  // ── the runner measures reality ───────────────────────────────────────────────────
  console.log("\nthe runner measures what is actually rendered\n")

  const first = runner("checks/__verifier_test__/T-1.json")
  check(
    first.status === 0,
    "runner completes and every fixture expectation holds",
    first.status === 0 ? "" : first.stdout.split("\n").slice(-12).join("\n          "),
  )

  admin = await connect("ADMIN")
  const rows = async (ref) =>
    (
      await admin.request().query(`
        SELECT e.kind, e.passed, e.raw_output, e.created_by, e.artifact_hash, e.check_spec, e.run_id
        FROM sandbox.evidence e
        JOIN sandbox.divergence d ON d.divergence_id = e.divergence_id
        JOIN sandbox.component c  ON c.component_id  = d.component_id
        WHERE c.slug='${SLUG}' AND d.ref_code='${ref}' ORDER BY e.evidence_id`)
    ).recordset

  const t1 = await rows("T-1")
  check(t1.length === 6, "one evidence row written per check", `${t1.length} rows`)
  // SUSER_SNAME() on Fabric returns `<clientId>@<tenantId>`, not the display name the
  // user was created under. Compare against the client ID, which is the identity that
  // actually authenticated — and is stricter than a name match would have been.
  const runnerId = process.env.FABRIC_RUNNER_CLIENT_ID.toLowerCase()
  check(
    t1.every((r) => r.created_by.toLowerCase().startsWith(runnerId)),
    "every row records the runner principal as its author",
    t1[0] ? `created_by = ${t1[0].created_by}` : "",
  )
  check(
    t1.filter((r) => r.kind === "screenshot").every((r) => r.artifact_hash?.length === 64),
    "screenshot evidence carries a sha256 of the image",
  )
  check(
    t1.some((r) => /outline-width/.test(r.raw_output) && r.passed),
    "focus-visible was produced for real — the ring was measured, not assumed",
  )

  // ── reproducibility ───────────────────────────────────────────────────────────────
  console.log("\nre-running the same spec reproduces the same numbers\n")
  const measuredOf = (list) =>
    list
      .filter((r) => r.kind !== "screenshot")
      .map((r) => r.raw_output.slice(r.raw_output.indexOf("measured:")))
      .join("\n")

  const before = measuredOf(t1)
  runner("checks/__verifier_test__/T-1.json")
  const after = measuredOf((await rows("T-1")).slice(6))
  check(before === after && before.length > 0, "identical measurements on a second run")

  // ── the things it must refuse ─────────────────────────────────────────────────────
  console.log("\nwhat the runner must refuse — a verifier is only as good as these\n")

  runner("checks/__verifier_test__/T-WRONG.json")
  const wrong = await rows("T-WRONG")
  check(
    wrong.length === 1 && wrong[0].passed === false,
    "a deliberately wrong expectation produces a FAILING row",
    wrong[0] ? `expected 99, ${wrong[0].raw_output.match(/height: expected.*/)?.[0] ?? ""}` : "no row",
  )

  const anchorRun = runner("checks/__verifier_test__/T-ANCHOR.json")
  const anchor = await rows("T-ANCHOR")
  check(
    anchor.length === 1 && anchor[0].passed === false && /ANCHOR NOT FOUND/.test(anchor[0].raw_output),
    "a missing anchor FAILS and is recorded, rather than crashing",
    anchorRun.status !== 0 && anchor.length === 1 ? "" : `exit ${anchorRun.status}, ${anchor.length} rows`,
  )

  runner("checks/__verifier_test__/T-DUPLICATE.json")
  const dupe = await rows("T-DUPLICATE")
  check(
    dupe.length === 1 && dupe[0].passed === false && /AMBIGUOUS/.test(dupe[0].raw_output),
    "an ambiguous anchor FAILS rather than measuring whichever matched first",
  )

  runner("checks/__verifier_test__/T-EDGE.json")
  const edge = await rows("T-EDGE")
  check(
    edge.length === 1 && edge[0].passed === false && /NO EXPECTATIONS/.test(edge[0].raw_output),
    "a check that asserts nothing FAILS",
  )

  // ── a screenshot is not verification ──────────────────────────────────────────────
  console.log("\na screenshot cannot stand in for an assertion (migration 005)\n")

  const shotOnly = (
    await admin.request().query(`
      SELECT d.divergence_id FROM sandbox.divergence d
      JOIN sandbox.component c ON c.component_id=d.component_id
      WHERE c.slug='${SLUG}' AND d.ref_code='T-DUPLICATE'`)
  ).recordset[0].divergence_id

  await admin.request().batch(`
    DELETE FROM sandbox.evidence WHERE divergence_id = ${shotOnly};
    INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
      verified_at_commit, verified_at_commit_at, run_id, artifact_hash)
    VALUES (${shotOnly}, 'screenshot', '{}', 'looked fine', 1, REPLICATE('a',40),
      SYSUTCDATETIME(), NEWID(), REPLICATE('b',64));`)

  const gate = (
    await admin.request().query(`SELECT requirement FROM sandbox.fn_divergence_unmet(${shotOnly})`)
  ).recordset.map((r) => r.requirement)

  check(
    gate.includes("evidence.present"),
    "the gate still reports evidence.present with only a passing screenshot",
    `unmet: ${gate.join(", ")}`,
  )

  // ── and the M1 invariant still holds through all of this ──────────────────────────
  console.log("\nthe M1 invariant, re-asserted\n")
  await admin.close()
  const agent = await connect("AGENT")
  try {
    await agent.request().batch(`
      INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
        verified_at_commit, verified_at_commit_at, run_id)
      VALUES (${shotOnly}, 'measurement', '{}', 'fabricated', 1, REPLICATE('c',40),
        SYSUTCDATETIME(), NEWID());`)
    check(false, "agent still cannot write evidence", "THE INSERT SUCCEEDED")
  } catch (err) {
    check(/denied/i.test(err.message), "agent still cannot write evidence", err.message.split("\n")[0])
  }
  await agent.close()
  admin = await connect("ADMIN")
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  try {
    const c = admin?.connected ? admin : await connect("ADMIN")
    await c.request().batch(cleanupSql)
    await c.close()
  } catch (err) {
    console.error(`\nCLEANUP FAILED — fixture rows may remain: ${err.message}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nThe runner is NOT trustworthy. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
