// ═══════════════════════════════════════════════════════════════════════════════════
// The corpus still matches its frozen snapshot.
//
//   node verify-import.mjs
//
// ── What this checked before, and what it checks now ────────────────────────────────
// Originally this was Milestone 4's definition of done: it re-read the hand-written
// `divergenceCategories` array out of sandbox/src/data/rail-sidebar.ts and diffed it
// against the database field by field, proving the import lost nothing. That claim is
// now permanently settled — it passed 8/8 against the real file — and at M5 step 4 that
// array was deleted, because the app reads the corpus and a second hand-maintained copy
// would only guarantee drift.
//
// So this is RE-POINTED, not retired, and its meaning has changed honestly: it now diffs
// the live corpus against `db/snapshots/rail-sidebar.json`, the frozen snapshot committed
// in git (SANDBOX-SPEC §4.1 — "immutable and versioned in the other, generated from a
// single source so they can never disagree").
//
// **The snapshot must stay frozen for this to mean anything.** It is regenerated only by
// deliberately running `scripts/emit-corpus-snapshot.mjs`, never automatically. That is
// what keeps this a real check rather than the database being compared with itself: an
// unexplained change in Fabric fails here, while an intended one appears as a visible
// commit regenerating the snapshot. If you ever find yourself regenerating the snapshot to
// make this pass, stop — that is the check working, and the question is why the corpus
// changed.
//
// It still deliberately does NOT trust any writer's own success message. An importer
// reporting "154 inserted" is an assertion by the thing that did the work, which is the
// shape of claim this whole project exists to stop accepting.
//
// Checklist item 12 is the reason this is field-by-field rather than a count: six group
// nodes once silently lost an `icon` field, invisible because nothing errors when a
// field is simply absent.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const SNAPSHOT = join(REPO_ROOT, "db", "snapshots", `${SLUG}.json`)

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

let snapshot
try {
  snapshot = JSON.parse(await readFile(SNAPSHOT, "utf8"))
} catch (error) {
  console.error(`Cannot read the frozen snapshot at ${SNAPSHOT}\n  ${error.message}`)
  console.error(`Generate it with: node scripts/emit-corpus-snapshot.mjs ${SLUG}`)
  process.exit(1)
}

// Rebuilt into the same {row, cat} shape the checks below already expect, so the
// comparisons themselves are unchanged — only where the expected values come from.
const source = new Map()
for (const r of snapshot.rows) {
  const record = r.originRecord ?? {}
  source.set(record.id ?? r.ref, {
    row: {
      id: record.id ?? r.ref,
      what: record.what ?? r.title,
      status: record.status,
      detail: record.detail ?? r.detail,
      visual: record.visual ?? r.visual ?? undefined,
    },
    cat: { id: (r.originCategory ?? r.category).split("—")[0].trim() },
  })
}

let pool
try {
  pool = await connect("ADMIN")
  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, d.category, d.title, d.detail, d.state,
           d.origin_record, d.origin_category, d.visual
    FROM   sandbox.divergence d
    JOIN   sandbox.component c ON c.component_id = d.component_id
    WHERE  c.slug = '${SLUG}'`)

  const db = new Map(recordset.map((r) => [r.ref_code, r]))

  console.log(`\nsource: ${source.size} rows  ·  database: ${db.size} rows\n`)

  check(db.size === source.size, "row counts match")

  const missing = [...source.keys()].filter((id) => !db.has(id))
  check(missing.length === 0, "no source row is missing from the corpus", missing.join(", "))

  const extra = [...db.keys()].filter((id) => !source.has(id))
  check(extra.length === 0, "the corpus invented nothing the source lacks", extra.join(", "))

  // The real test: every field of every source object, byte-identical after the round
  // trip through JSON and the database.
  const drifted = []
  for (const [id, { row }] of source) {
    const rec = db.get(id)
    if (!rec) continue
    let parsed
    try {
      parsed = JSON.parse(rec.origin_record)
    } catch {
      drifted.push(`${id}: origin_record is not valid JSON`)
      continue
    }
    for (const [key, value] of Object.entries(row)) {
      const a = JSON.stringify(value)
      const b = JSON.stringify(parsed[key])
      if (a !== b) drifted.push(`${id}.${key}: source ${a?.slice(0, 60)} vs stored ${b?.slice(0, 60)}`)
    }
    const extraKeys = Object.keys(parsed).filter((k) => !(k in row))
    if (extraKeys.length) drifted.push(`${id}: stored extra keys ${extraKeys.join(",")}`)
  }
  check(
    drifted.length === 0,
    "every field of every row survived the round trip byte-identical",
    drifted.slice(0, 5).join("\n          "),
  )

  // `visual` was the field with no home before migration 006. Confirm the rows that
  // carry one actually kept it, rather than it merely surviving inside origin_record.
  const srcVisual = [...source.values()].filter(({ row }) => row.visual).length
  const dbVisual = recordset.filter((r) => r.visual).length
  check(srcVisual === dbVisual, "every row with a `visual` payload kept it in its own column", `${srcVisual} source / ${dbVisual} stored`)

  const noOrigin = recordset.filter((r) => !r.origin_category).length
  check(noOrigin === 0, "every row records the source category it came from")

  // ── Nothing may be blessed except through the gate ────────────────────────────────
  //
  // This check used to assert that EVERY row sat at 'legacy_unverified'. That was right
  // for M4, when nothing had ever moved — and it became wrong the moment M6 shipped,
  // because a row legitimately reaching 'resolved' through the gate then failed it. A
  // check that goes red the first time the system is used as designed is not protecting
  // the invariant, it is protecting the corpus from being used.
  //
  // The INTENT survives intact, and is actually stronger stated this way: a row may sit at
  // 'legacy_unverified' (never gated), or have moved — but a 'resolved' row must carry the
  // human approval that only the gate procedure can write, and the gate refuses to write
  // one until evidence and an independent review exist. So "pre-blessed" is now defined by
  // what a state is BACKED BY rather than by nothing having happened yet.
  const states = recordset.reduce((a, r) => ((a[r.state] = (a[r.state] ?? 0) + 1), a), {})
  const LEGITIMATE = new Set(["legacy_unverified", "open", "proposed", "decided", "implemented", "verified", "resolved", "reopened", "deferred", "blocked"])
  const bogus = Object.keys(states).filter((s) => !LEGITIMATE.has(s))
  check(bogus.length === 0, "every row is in a real lifecycle state", `${JSON.stringify(states)}${bogus.length ? ` — unknown: ${bogus.join(", ")}` : ""}`)

  const resolvedRefs = recordset.filter((r) => r.state === "resolved").map((r) => r.ref_code)
  const approvedRefs = new Set(
    (
      await pool.request().query(`
        SELECT DISTINCT d.ref_code
        FROM   sandbox.approval a
        JOIN   sandbox.divergence d ON d.divergence_id = a.divergence_id
        JOIN   sandbox.component c  ON c.component_id = d.component_id
        WHERE  c.slug = '${SLUG}'`)
    ).recordset.map((r) => r.ref_code),
  )
  const unbacked = resolvedRefs.filter((ref) => !approvedRefs.has(ref))
  check(
    unbacked.length === 0,
    "no row is 'resolved' without the human approval only the gate can write",
    resolvedRefs.length === 0
      ? "no rows are resolved yet"
      : `${resolvedRefs.length} resolved, ${approvedRefs.size} approved${unbacked.length ? ` — unbacked: ${unbacked.join(", ")}` : ""}`,
  )

  const cats = recordset.reduce((a, r) => ((a[r.category] = (a[r.category] ?? 0) + 1), a), {})
  console.log(`\ncategory distribution: ${JSON.stringify(cats, null, 0)}`)

  const unmapped = recordset.filter((r) => !r.category).length
  check(unmapped === 0, "every row landed in a real category")
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nThe corpus does not faithfully represent the source. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
