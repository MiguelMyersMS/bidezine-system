// ═══════════════════════════════════════════════════════════════════════════════════
// Rebuild Rail Sidebar's divergence rows in the corpus from the frozen snapshot.
//
//   node import-rail-sidebar.mjs [--dry-run]
//
// Originally Milestone 4's one-off importer, reading the hand-written
// `divergenceCategories` out of sandbox/src/data/rail-sidebar.ts. That array was deleted
// at M5 step 4 once the database path was proven equivalent, so this now reads
// db/snapshots/rail-sidebar.json — the frozen snapshot committed in git — and only ever
// reads it; nothing here writes to the snapshot.
//
// The re-pointing changes what this script IS. It was a migration tool with one job,
// already done; it is now the RESTORE PATH. The corpus is authoritative while a component
// is in the Sandbox, which means the corpus is also the thing that can be lost — and this
// is what rebuilds it from git. Idempotent, so running it against a healthy corpus is a
// no-op update rather than a duplication.
//
// EVERY IMPORTED ROW LANDS AT 'legacy_unverified', including the 152 the source calls
// resolved. That state sits deliberately BEFORE 'verified' in the divergence lifecycle:
// the reasoning comes across so retrieval has real substance from day one, but nothing
// arrives pre-blessed. Each row still has to earn 'resolved' through the actual gate,
// with machine-produced evidence and an independent review.
//
// That is not scepticism about the work. It is this project's own rule — a resolved
// record is only as trustworthy as its last verification against the real, current code
// — applied to the moment the records change hands. A row marked resolved in a
// TypeScript file has never been through the gate, because the gate did not exist when
// it was written.
//
// Runs as ADMIN: it writes state, which every other principal is denied.
// Idempotent — re-running updates in place rather than duplicating.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"

const SNAPSHOT = join(REPO_ROOT, "db", "snapshots", "rail-sidebar.json")
const SLUG = "rail-sidebar"
const DRY = process.argv.includes("--dry-run")

// Source category → the fixed enum. Where a source category covers more than one enum
// concept, the dominant one wins and origin_category preserves the original label, so a
// later pass can refine per-row without having lost anything.
const CATEGORY_MAP = {
  A: "icons",
  B: "color",
  C: "color",
  D: "typography",
  E: "spacing",
  F: "layout-sizing",
  G: "radius",
  H: "motion",
  I: "elevation",
  J: "z-index",
  K: "interaction-state", // K-3 is scroll; the other three are interaction state
  L: "component-gap",
  M: "structure", // also covers naming-api and component gaps — see origin_category
}

// K-3 is the one row in its category that is genuinely about scroll rather than
// interaction state. Called out explicitly rather than left to a blanket mapping,
// because "the scrollbar collides with content" is the single most-referenced decision
// in this component's history and must be findable under 'scroll'.
const ROW_OVERRIDES = { "K-3": "scroll" }

/**
 * Rebuilds the category array from the frozen snapshot.
 *
 * This used to bundle `sandbox/src/data/rail-sidebar.ts` with esbuild and read its
 * hand-written `divergenceCategories`. That array was deleted at M5 step 4, once the
 * database path was proven to render exactly the same thing — so this is RE-POINTED at
 * `db/snapshots/rail-sidebar.json` rather than retired, and in the process it stops being
 * a one-off migration tool and becomes a real RESTORE PATH: if the corpus were ever lost
 * or corrupted, this rebuilds it from the copy in git.
 *
 * Each snapshot row carries `originRecord`, the entire source object stored verbatim at
 * the original import, so what is rebuilt here is the hand-written data itself and not a
 * lossy re-derivation of it.
 */
async function loadSource() {
  const snapshot = JSON.parse(await readFile(SNAPSHOT, "utf8"))
  const byCategory = new Map()
  for (const r of snapshot.rows) {
    const label = r.originCategory ?? r.category
    const [rawId, ...rest] = label.split("—")
    const id = rawId.trim()
    if (!byCategory.has(id)) byCategory.set(id, { id, name: rest.join("—").trim() || id, rows: [] })
    // The verbatim record IS the source row. Falling back to the normalised columns keeps
    // a row that somehow arrived without one from being dropped silently.
    byCategory.get(id).rows.push(
      r.originRecord ?? {
        id: r.ref,
        what: r.title,
        status: "note",
        detail: r.detail ?? "",
        ...(r.visual ? { visual: r.visual } : {}),
      },
    )
  }
  return { divergenceCategories: [...byCategory.values()].sort((a, b) => a.id.localeCompare(b.id)) }
}

const { divergenceCategories } = await loadSource()
if (!Array.isArray(divergenceCategories)) throw new Error("divergenceCategories not found in the snapshot")

// ── field-coverage audit, before anything is written ────────────────────────────────
// Checklist item 12: porting a data structure requires an exhaustive field-by-field
// diff, not a visual read. Six group nodes once silently lost an `icon` field because
// nothing errors when a field is simply absent.
const seenFields = new Set()
const rows = []
for (const cat of divergenceCategories) {
  for (const row of cat.rows) {
    for (const k of Object.keys(row)) seenFields.add(k)
    rows.push({ cat, row })
  }
}

const HANDLED = new Set(["id", "what", "status", "detail", "visual"])
const unhandled = [...seenFields].filter((f) => !HANDLED.has(f))

console.log(`source: ${divergenceCategories.length} categories, ${rows.length} rows`)
console.log(`fields present on rows: ${[...seenFields].sort().join(", ")}`)
if (unhandled.length) {
  console.log(`\nUNMAPPED FIELDS: ${unhandled.join(", ")}`)
  console.log("Every one is still preserved verbatim in origin_record, but none has a queryable column.")
}

const statusTally = rows.reduce((acc, { row }) => ((acc[row.status] = (acc[row.status] ?? 0) + 1), acc), {})
console.log(`source statuses: ${JSON.stringify(statusTally)}`)

const unmappedCats = divergenceCategories.filter((c) => !CATEGORY_MAP[c.id])
if (unmappedCats.length) throw new Error(`No enum mapping for categories: ${unmappedCats.map((c) => c.id).join(", ")}`)

if (DRY) {
  console.log("\n--dry-run: nothing written.")
  process.exit(0)
}

// ── write ───────────────────────────────────────────────────────────────────────────
let pool
try {
  pool = await connect("ADMIN")

  await pool.request().input("slug", sql.NVarChar(100), SLUG).query(`
    IF NOT EXISTS (SELECT 1 FROM sandbox.component WHERE slug = @slug)
      INSERT INTO sandbox.component (slug, title, state, origin_note)
      VALUES (@slug, 'Rail Sidebar', 'build',
        'Ported from a foreign design system''s RailNav. Divergence rows imported at Sandbox Milestone 4; the frozen copy in git is db/snapshots/rail-sidebar.json.');`)

  const componentId = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG)
      .query("SELECT component_id FROM sandbox.component WHERE slug = @slug")
  ).recordset[0].component_id

  let inserted = 0
  let updated = 0

  for (const { cat, row } of rows) {
    const category = ROW_OVERRIDES[row.id] ?? CATEGORY_MAP[cat.id]
    const r = await pool
      .request()
      .input("component_id", sql.Int, componentId)
      .input("ref", sql.NVarChar(20), row.id)
      .input("category", sql.NVarChar(30), category)
      .input("title", sql.NVarChar(400), (row.what ?? "").slice(0, 400))
      .input("detail", sql.NVarChar(sql.MAX), row.detail ?? null)
      .input("origin_record", sql.NVarChar(sql.MAX), JSON.stringify(row))
      .input("origin_category", sql.NVarChar(80), `${cat.id} — ${cat.name}`)
      .input("visual", sql.NVarChar(sql.MAX), row.visual ? JSON.stringify(row.visual) : null)
      .query(`
        UPDATE sandbox.divergence
           SET category = @category, title = @title, detail = @detail,
               origin_record = @origin_record, origin_category = @origin_category,
               visual = @visual, updated_at = SYSUTCDATETIME()
         WHERE component_id = @component_id AND ref_code = @ref;

        IF @@ROWCOUNT = 0
        BEGIN
          INSERT INTO sandbox.divergence
            (component_id, ref_code, category, title, detail, state,
             origin_record, origin_category, visual)
          VALUES
            (@component_id, @ref, @category, @title, @detail, 'legacy_unverified',
             @origin_record, @origin_category, @visual);
          SELECT 'inserted' AS action;
        END
        ELSE SELECT 'updated' AS action;`)

    if (r.recordset[0].action === "inserted") inserted++
    else updated++
  }

  const dbCount = (
    await pool.request().query(
      `SELECT COUNT(*) AS n FROM sandbox.divergence WHERE component_id = ${componentId}`,
    )
  ).recordset[0].n

  console.log(`\n${inserted} inserted, ${updated} updated.`)
  console.log(`source rows: ${rows.length}  ·  rows in database: ${dbCount}`)

  if (dbCount !== rows.length) {
    console.log(`\nCOUNT MISMATCH — the corpus does not match the source. Investigate before relying on it.`)
    process.exitCode = 1
  }
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
