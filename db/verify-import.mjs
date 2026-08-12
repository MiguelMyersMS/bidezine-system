// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 4's definition of done.
//
//   node verify-import.mjs
//
// M4's claim is "every existing row is represented with no field lost — the migration is
// the schema's proof". That claim is only worth anything if something checks it, so this
// re-reads the TypeScript source and diffs it against the database field by field.
//
// It deliberately does NOT trust the import script's own success message. An importer
// reporting "154 inserted" is an assertion by the thing that did the work — precisely
// the shape of claim this whole project exists to stop accepting. The check has to come
// from re-reading the source, not from the writer's own account of what it wrote.
//
// Checklist item 12 is the reason this is field-by-field rather than a count: six group
// nodes once silently lost an `icon` field, invisible because nothing errors when a
// field is simply absent.
// ═══════════════════════════════════════════════════════════════════════════════════

import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import esbuild from "esbuild"
import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"

const SOURCE = join(REPO_ROOT, "limbo-factory", "src", "data", "rail-sidebar.ts")
const SLUG = "rail-sidebar"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const dir = await mkdtemp(join(tmpdir(), "verify-import-"))
const out = join(dir, "data.mjs")
await esbuild.build({
  entryPoints: [SOURCE],
  outfile: out,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
})
const { divergenceCategories } = await import(pathToFileURL(out).href)
await rm(dir, { recursive: true, force: true })

const source = new Map()
for (const cat of divergenceCategories) {
  for (const row of cat.rows) source.set(row.id, { row, cat })
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

  // Nothing may arrive pre-blessed. The source calls 152 of these resolved; the corpus
  // must not, because none has ever been through the gate — the gate did not exist when
  // they were written.
  const states = recordset.reduce((a, r) => ((a[r.state] = (a[r.state] ?? 0) + 1), a), {})
  check(
    Object.keys(states).length === 1 && states.legacy_unverified === source.size,
    "nothing arrived pre-blessed — every row sits at legacy_unverified",
    JSON.stringify(states),
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
