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
// T-NOSPEC deliberately has NO check spec on disk. It exists to prove --stale reports the
// rows it cannot reach rather than quietly counting them as done — see the batch section.
const REFS = [
  "T-1",
  "T-WRONG",
  "T-ANCHOR",
  "T-DUPLICATE",
  "T-EDGE",
  "T-NOSPEC",
  // The states migration 022 added to the subject_state vocabulary. Neither is simulated, so
  // each needs its own already-in-that-state fixture element — and T-NOTSELECTED proves the
  // runner refuses a spec that claims a state its subject is not in.
  "T-SELECTED",
  "T-EXPANDED",
  "T-SELECTED-CHILD",
  "T-NOTSELECTED",
]

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

  // ── the states migration 022 added ────────────────────────────────────────────────
  // A vocabulary the database accepts and the runner cannot execute is a promise the corpus
  // cannot keep: a spec declaring `selected` threw `unknown state` for as long as the two
  // were out of step, which is why two real rail rows could be declared and not run.
  console.log("\nselected and expanded — accepted, and refused when the subject is not in them\n")

  runner("checks/__verifier_test__/T-SELECTED.json")
  const selected = await rows("T-SELECTED")
  check(
    selected.length === 1 && selected[0].passed === true,
    "a `selected` check runs and measures the element the anchor names",
    selected[0] ? (selected[0].passed ? "" : selected[0].raw_output.slice(0, 200)) : "no row",
  )
  check(
    selected[0] ? /selected: confirmed on the subject itself/.test(selected[0].raw_output) : false,
    "the evidence records WHICH element carried the marker, rather than only that one did",
    selected[0]?.raw_output.match(/selected: confirmed on [^\n]*/)?.[0] ?? "no note in raw_output",
  )

  runner("checks/__verifier_test__/T-EXPANDED.json")
  const expanded = await rows("T-EXPANDED")
  check(
    expanded.length === 1 && expanded[0].passed === true,
    "an `expanded` check runs and measures the element the anchor names",
    expanded[0] ? (expanded[0].passed ? "" : expanded[0].raw_output.slice(0, 200)) : "no row",
  )

  runner("checks/__verifier_test__/T-SELECTED-CHILD.json")
  const child = await rows("T-SELECTED-CHILD")
  check(
    child.length === 1 && child[0].passed === true && /confirmed on an ancestor/.test(child[0].raw_output),
    "a subject INSIDE a selected element resolves through its ancestor — the shape B-7 takes",
    child[0]?.raw_output.match(/selected: confirmed on [^\n]*/)?.[0] ?? "no note in raw_output",
  )

  const notSelected = runner("checks/__verifier_test__/T-NOTSELECTED.json")
  const notSel = await rows("T-NOTSELECTED")
  check(
    notSel.length === 1 && notSel[0].passed === false && /STATE NOT ESTABLISHED/.test(notSel[0].raw_output),
    "declaring `selected` on an element that is NOT selected FAILS rather than measuring it at rest",
    notSel[0]
      ? notSel[0].passed
        ? "it passed — the no-op is unverified, and a spec pointing at the wrong element would be believed"
        : ""
      : "no row",
  )
  check(
    notSelected.status !== 0,
    "and the run exits non-zero, so an unrunnable state cannot pass CI quietly",
    `exit ${notSelected.status}`,
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

  // ── M7 step 5: re-verifying the affected set is one command ───────────────────────
  // The sweep (migration 013) marks evidence stale. This is the other half — and the
  // claim under test is not "it re-ran something", it is that a batch which CANNOT reach
  // part of its own work says so instead of exiting clean.
  console.log("\nthe stale set is re-verifiable in one command, and reports what it cannot reach\n")

  const idOf = async (ref) =>
    (
      await admin.request().query(`
        SELECT d.divergence_id FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id=d.component_id
        WHERE c.slug='${SLUG}' AND d.ref_code='${ref}'`)
    ).recordset[0].divergence_id

  const t1Id = await idOf("T-1")
  const noSpecId = await idOf("T-NOSPEC")

  // T-1 has a spec and is reachable. T-NOSPEC has stale evidence and no spec at all,
  // which is the real shape of the corpus: 154 rows, 8 specs.
  await admin.request().batch(`
    UPDATE sandbox.evidence SET is_stale = 1, stale_reason = 'Fixture: pretending a system change landed.'
      WHERE divergence_id = ${t1Id};
    INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
      verified_at_commit, verified_at_commit_at, run_id, is_stale, stale_reason)
    VALUES (${noSpecId}, 'measurement', '{}', 'measured before the change', 1, REPLICATE('d',40),
      SYSUTCDATETIME(), NEWID(), 1, 'Fixture: pretending a system change landed.');`)

  const staleBefore = async (id) =>
    (await admin.request().query(`SELECT COUNT(*) n FROM sandbox.evidence WHERE divergence_id=${id} AND is_stale=1`))
      .recordset[0].n

  check((await staleBefore(t1Id)) > 0, "the fixture starts with stale evidence to clear", `${await staleBefore(t1Id)} stale row(s) on T-1`)

  await admin.close()
  const batch = runner("--stale", `--component=${SLUG}`)
  admin = await connect("ADMIN")

  check(
    /1 re-runnable/.test(batch.stdout) && /1 with no check spec/.test(batch.stdout),
    "one command finds the whole stale set and splits it into re-runnable and not",
    batch.stdout.split("\n").find((l) => /carry stale evidence/.test(l)) ?? batch.stdout.slice(0, 200),
  )

  const fresh = (
    await admin.request().query(`
      SELECT COUNT(*) n FROM sandbox.evidence
      WHERE divergence_id = ${t1Id} AND is_stale = 0 AND passed = 1
        AND kind IN ('measurement','computed-style')`)
  ).recordset[0].n
  check(fresh > 0, "the re-run wrote fresh, non-stale, asserting evidence for the reachable row", `${fresh} row(s)`)

  check(
    /UNREACHABLE\s+__verifier_test__\/T-NOSPEC/.test(batch.stdout),
    "the row it could not re-run is named, not silently counted as done",
    batch.stdout.split("\n").find((l) => /UNREACHABLE/.test(l))?.trim() ?? "no UNREACHABLE line",
  )

  // The part that makes it usable in CI. A batch that left work behind must not look like
  // a batch that finished — that is exactly how a corpus stays stale while a pipeline
  // stays green.
  check(batch.status !== 0, "and the command exits non-zero while anything stale remains unreachable", `exit ${batch.status}`)

  // The concrete form of "not stale is not the same as satisfied": T-1's measurement is
  // now fresh and passing, and the gate still refuses it, because nobody has reviewed it.
  // A batch command that printed only its own pass count would read as finished here.
  const gateLines = batch.stdout.split("\n")
  const t1Line = gateLines.findIndex((l) => /^\s+(CLEAR|UNMET)\s+__verifier_test__\/T-1\s*$/.test(l))
  check(
    t1Line !== -1 && /UNMET/.test(gateLines[t1Line]) && /review\.present/.test(gateLines[t1Line + 1] ?? ""),
    "it re-reads the gate afterwards, so 'not stale' is not mistaken for 'satisfied'",
    t1Line === -1 ? "no gate line for T-1" : `${gateLines[t1Line].trim()} · ${(gateLines[t1Line + 1] ?? "").trim().slice(0, 70)}`,
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
