// ═══════════════════════════════════════════════════════════════════════════════════
// Emit a frozen divergence snapshot from the corpus — SANDBOX-SPEC §4.1.
//
//   node scripts/emit-corpus-snapshot.mjs [slug]
//
// "Divergence rows are the one overlap, and the rule is: the DB is authoritative while
// the component is in the Sandbox; at promotion the DB emits a frozen snapshot committed
// alongside the component. Live and mutable in one place, immutable and versioned in the
// other, generated from a single source so they can never disagree."
//
// This runs that mechanism EARLY, before promotion, and deliberately. M5 step 4 deletes
// the hand-written `divergenceCategories` from sandbox/src/data/rail-sidebar.ts now that
// the database path is proven equivalent — but Rail Sidebar is in `build` with 0 of 154
// rows resolved, so promotion (the moment the spec expects a snapshot) is a long way off.
// Deleting the source without one would leave 154 hand-written decision records living in
// exactly one Fabric database, with nothing in git to compare against.
//
// ── The snapshot is FROZEN, and that is what makes it worth having ──────────────────
// It is regenerated only by running this script deliberately, never automatically. That
// is the whole point: `db/verify-import.mjs` diffs the live corpus against this committed
// file, so an unexplained change in the database shows up as a failing check, and an
// INTENDED change shows up as a visible commit re-running this script. A snapshot
// regenerated on every read would make that comparison self-referential — the database
// compared to itself, a check that cannot fail and therefore proves nothing.
// ═══════════════════════════════════════════════════════════════════════════════════

import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { getCorpus } from "../sandbox/server/corpus-api.mjs"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const slug = process.argv[2] ?? "rail-sidebar"
const OUT = join(REPO_ROOT, "db", "snapshots", `${slug}.json`)

const corpus = await getCorpus()
if (corpus.error) {
  console.error(`Cannot read the corpus: ${corpus.error}`)
  process.exit(1)
}
if (corpus.stale) {
  // Freezing a cached snapshot would commit whatever the database looked like at some
  // earlier, unknown moment, under a filename that claims to be current.
  console.error("Refusing to freeze a STALE snapshot — Fabric was unreachable and this came from cache.")
  process.exit(1)
}

const rows = corpus.divergences[slug]
if (!rows?.length) {
  console.error(`No divergences found for component "${slug}".`)
  process.exit(1)
}

const component = corpus.components.find((c) => c.slug === slug)

// `originRecord` is the payload that matters: the entire source object as it was written
// by hand, stored verbatim at import. Everything the deleted TypeScript file rendered can
// be rebuilt from it, which is what makes deleting that file safe.
const snapshot = {
  _what: `Frozen divergence snapshot for "${slug}", generated from the Fabric corpus by scripts/emit-corpus-snapshot.mjs.`,
  _why: "SANDBOX-SPEC §4.1. The database is authoritative while the component is in the Sandbox; this is the immutable, versioned copy in git. Regenerate ONLY by re-running that script deliberately — db/verify-import.mjs diffs the live corpus against this file, so an automatic regeneration would turn that check into a comparison of the database with itself.",
  _generatedFrom: { slug, componentState: component?.state ?? null, rowCount: rows.length },
  // No generation timestamp on purpose: it would change on every regeneration and make the
  // file's diff noisy, hiding the row-level changes that are the reason to look at it.
  rows: rows
    .map((r) => ({
      ref: r.ref,
      category: r.category,
      originCategory: r.originCategory,
      title: r.title,
      detail: r.detail,
      state: r.state,
      visual: r.visual,
      originRecord: r.originRecord,
    }))
    .sort((a, b) => a.ref.localeCompare(b.ref)),
}

await mkdir(dirname(OUT), { recursive: true })
// Stable 2-space JSON so a future regeneration produces a readable, row-level diff rather
// than one enormous changed line.
await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n", "utf8")

console.log(`wrote ${OUT.replace(REPO_ROOT, ".")}`)
console.log(`  component: ${slug} (state: ${component?.state})`)
console.log(`  rows: ${snapshot.rows.length}`)
console.log(`  with a verbatim origin record: ${snapshot.rows.filter((r) => r.originRecord).length}`)
console.log(`  with a visual payload: ${snapshot.rows.filter((r) => r.visual).length}`)
