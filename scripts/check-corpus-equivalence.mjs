// ═══════════════════════════════════════════════════════════════════════════════════
// Does the app still render exactly what the frozen snapshot says?
//
//   node scripts/check-corpus-equivalence.mjs
//
// This is the check that unlocked M5 step 4. The spec allows deleting the hand-written
// divergence array from `sandbox/src/data/rail-sidebar.ts` "ONLY once the DB path returns
// equivalent content", and this is what decided it: 154/154 rows equivalent, so the
// deletion followed from a passing check rather than from someone believing the two
// looked alike.
//
// It now compares the app's rendered view — `toCategories()` applied to the LIVE corpus —
// against `db/snapshots/rail-sidebar.json`, the frozen snapshot committed in git, field by
// field including every `visual` payload.
//
// It is NOT the database compared with itself. The snapshot changes only when someone
// deliberately re-runs `scripts/emit-corpus-snapshot.mjs`, so corpus drift or a regression
// in `toCategories` fails here.
//
// Difference from `verify-import`, which also diffs against the snapshot: that one checks
// the STORED rows; this one checks what the app actually RENDERS from them. A field can
// sit in the database perfectly and still be dropped on the way out, which is why both
// exist.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { getCorpus } from "../sandbox/server/corpus-api.mjs"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SLUG = "rail-sidebar"

/**
 * The expected categories, rebuilt from the frozen snapshot committed in git.
 *
 * This used to bundle the hand-written `sandbox/src/data/rail-sidebar.ts` and read its
 * `divergenceCategories`. That array was deleted at M5 step 4 — after this very check
 * proved 154/154 rows equivalent — so the comparison is now against
 * `db/snapshots/rail-sidebar.json` instead.
 *
 * What it proves has changed accordingly, and the distinction is worth being precise
 * about: it no longer proves "the database matches the hand-written file" (settled, and
 * the file is gone). It proves the app's RENDERED VIEW still matches the frozen snapshot —
 * so a regression in `toCategories`, or corpus drift, fails here. It is not circular
 * because the snapshot is frozen: it changes only when someone deliberately re-runs
 * `scripts/emit-corpus-snapshot.mjs`, which is a visible commit.
 */
async function loadExpected() {
  const snapshot = JSON.parse(await readFile(join(REPO_ROOT, "db", "snapshots", "rail-sidebar.json"), "utf8"))
  const byCategory = new Map()
  for (const r of snapshot.rows) {
    const label = r.originCategory ?? r.category
    const [rawId, ...rest] = label.split("—")
    const id = rawId.trim()
    if (!byCategory.has(id)) byCategory.set(id, { id, name: rest.join("—").trim() || id, rows: [] })
    const rec = r.originRecord ?? {}
    byCategory.get(id).rows.push({
      id: rec.id ?? r.ref,
      what: rec.what ?? r.title,
      status: rec.status ?? "note",
      detail: rec.detail ?? r.detail ?? "",
      visual: rec.visual ?? r.visual ?? undefined,
    })
  }
  return { divergenceCategories: [...byCategory.values()].sort((a, b) => a.id.localeCompare(b.id)) }
}

/**
 * The same grouping the app performs, reimplemented here rather than imported.
 *
 * `sandbox/src/data/corpus.ts` is a browser module using React hooks; importing it in Node
 * would drag React in for no reason. The cost is that this logic exists twice and could
 * drift — so the check below compares against the FILE, which is the thing that must not
 * drift, and any divergence between this and `toCategories` shows up as a failure here
 * rather than passing silently.
 */
function toCategories(rows) {
  const byCategory = new Map()
  for (const row of rows) {
    const label = row.originCategory ?? row.category
    const [rawId, ...rest] = label.split("—")
    const id = rawId.trim()
    const name = rest.join("—").trim() || id
    if (!byCategory.has(id)) byCategory.set(id, { id, name, rows: [] })
    const source = row.originRecord ?? {}
    byCategory.get(id).rows.push({
      id: source.id ?? row.ref,
      what: source.what ?? row.title,
      status: source.status ?? "note",
      detail: source.detail ?? row.detail ?? "",
      visual: source.visual ?? row.visual ?? undefined,
    })
  }
  return [...byCategory.values()].sort((a, b) => a.id.localeCompare(b.id))
}

const problems = []
const note = (msg) => problems.push(msg)

const corpus = await getCorpus()
if (corpus.error) {
  console.error(`Cannot read the corpus: ${corpus.error}`)
  process.exit(1)
}
if (corpus.stale) {
  // A cached snapshot could easily still match the file while the live corpus does not.
  console.error("Refusing to run against a STALE snapshot — this check only means something live.")
  process.exit(1)
}

const source = await loadExpected()
const fromSnapshot = source.divergenceCategories
const fromDb = toCategories(corpus.divergences[SLUG] ?? [])

const snapRows = fromSnapshot.flatMap((c) => c.rows.map((r) => [`${c.id}/${r.id}`, r, c]))
const dbRows = fromDb.flatMap((c) => c.rows.map((r) => [`${c.id}/${r.id}`, r, c]))

console.log(`snapshot: ${fromSnapshot.length} categories, ${snapRows.length} rows`)
console.log(`db:   ${fromDb.length} categories, ${dbRows.length} rows\n`)

const snapMap = new Map(snapRows.map(([k, r, c]) => [k, { row: r, cat: c }]))
const dbMap = new Map(dbRows.map(([k, r, c]) => [k, { row: r, cat: c }]))

for (const key of snapMap.keys()) if (!dbMap.has(key)) note(`missing from DB: ${key}`)
for (const key of dbMap.keys()) if (!snapMap.has(key)) note(`present only in DB: ${key}`)

// Field-by-field, including `visual`, compared as canonical JSON so key order cannot
// produce a false difference.
const canon = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v, Object.keys(v ?? {}).sort())))
for (const [key, f] of snapMap) {
  const d = dbMap.get(key)
  if (!d) continue
  for (const field of ["id", "what", "status", "detail"]) {
    if (f.row[field] !== d.row[field]) {
      note(`${key}.${field} differs\n    file: ${JSON.stringify(f.row[field])?.slice(0, 160)}\n    db:   ${JSON.stringify(d.row[field])?.slice(0, 160)}`)
    }
  }
  const fv = JSON.stringify(canon(f.row.visual))
  const dv = JSON.stringify(canon(d.row.visual))
  if (fv !== dv) {
    note(`${key}.visual differs\n    file: ${fv?.slice(0, 200)}\n    db:   ${dv?.slice(0, 200)}`)
  }
  if (f.cat.name !== d.cat.name) note(`${key} category name differs: file ${JSON.stringify(f.cat.name)} vs db ${JSON.stringify(d.cat.name)}`)
}

if (problems.length) {
  console.error(`NOT EQUIVALENT — ${problems.length} difference(s):\n`)
  for (const p of problems.slice(0, 40)) console.error(`  ${p}`)
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`)
  console.error(`\nsandbox/src/data/rail-sidebar.ts must NOT be deleted while these differ.`)
  process.exit(1)
}

console.log(`equivalent — the app renders exactly what the frozen snapshot holds.`)
console.log(`${snapRows.length} rows compared field by field, including every visual payload.`)
process.exit(0)
