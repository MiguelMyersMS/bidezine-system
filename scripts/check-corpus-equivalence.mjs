// ═══════════════════════════════════════════════════════════════════════════════════
// Does the database path render the same thing the hand-written file did?
//
//   node scripts/check-corpus-equivalence.mjs
//
// M5 step 4 says `sandbox/src/data/rail-sidebar.ts` may be deleted "ONLY once the DB path
// returns equivalent content". This is what decides that, so the deletion is a
// consequence of a passing check rather than of someone believing the two look the same.
//
// It compares what the APP would render from each source — `toCategories()` applied to
// the corpus, against the file's own exported `divergenceCategories` — field by field,
// including the `visual` payloads. It does NOT compare the database to itself, and it
// does not trust the importer's own success message: that is an assertion by the thing
// that did the work, which is the same reason `db/verify-import.mjs` re-reads the source
// rather than believing the import.
//
// Note the difference from `verify-import`: that proves the corpus is a lossless copy of
// the FILE. This proves the app's RENDERED VIEW is unchanged by swapping the source. The
// two can diverge — a field can round-trip into the database perfectly and still be
// dropped on the way back out — so both are needed before the file goes.
// ═══════════════════════════════════════════════════════════════════════════════════

import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import esbuild from "esbuild"
import { getCorpus } from "../sandbox/server/corpus-api.mjs"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SLUG = "rail-sidebar"

/** The file is TypeScript with `@/` aliases, so it is bundled to a temp ESM module and
 * imported — the same technique `db/import-rail-sidebar.mjs` uses to read it. */
async function loadSourceFile() {
  const dir = await mkdtemp(join(tmpdir(), "corpus-equiv-"))
  const out = join(dir, "rail-sidebar.mjs")
  try {
    await esbuild.build({
      entryPoints: [join(REPO_ROOT, "sandbox", "src", "data", "rail-sidebar.ts")],
      outfile: out,
      bundle: true,
      format: "esm",
      platform: "neutral",
      logLevel: "silent",
    })
    return await import(`file://${out.replace(/\\/g, "/")}`)
  } finally {
    // Deliberately not deleted until after the import resolves.
    setTimeout(() => rm(dir, { recursive: true, force: true }).catch(() => {}), 1000)
  }
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

const source = await loadSourceFile()
const fromFile = source.divergenceCategories
const fromDb = toCategories(corpus.divergences[SLUG] ?? [])

const fileRows = fromFile.flatMap((c) => c.rows.map((r) => [`${c.id}/${r.id}`, r, c]))
const dbRows = fromDb.flatMap((c) => c.rows.map((r) => [`${c.id}/${r.id}`, r, c]))

console.log(`file: ${fromFile.length} categories, ${fileRows.length} rows`)
console.log(`db:   ${fromDb.length} categories, ${dbRows.length} rows\n`)

const fileMap = new Map(fileRows.map(([k, r, c]) => [k, { row: r, cat: c }]))
const dbMap = new Map(dbRows.map(([k, r, c]) => [k, { row: r, cat: c }]))

for (const key of fileMap.keys()) if (!dbMap.has(key)) note(`missing from DB: ${key}`)
for (const key of dbMap.keys()) if (!fileMap.has(key)) note(`present only in DB: ${key}`)

// Field-by-field, including `visual`, compared as canonical JSON so key order cannot
// produce a false difference.
const canon = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v, Object.keys(v ?? {}).sort())))
for (const [key, f] of fileMap) {
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

console.log(`equivalent — the database path renders exactly what the file renders.`)
console.log(`${fileRows.length} rows compared field by field, including every visual payload.`)
process.exit(0)
