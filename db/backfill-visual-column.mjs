// One-off backfill: three blocking questions (Q1, Q3, Q4) carry a `visual` payload in
// their source object. The import script that added them (db/import-blocking-risks.mjs)
// omitted the `visual` column from its field mapping, so the payload landed only inside
// `origin_record` and the dedicated `visual` column stayed NULL — exactly the gap
// db/verify-import.mjs's "every row with a `visual` payload kept it in its own column"
// check exists to catch (64 source / 61 stored).
//
// This is an UPDATE of three rows from data already stored in origin_record. Nothing is
// invented or re-imported; the payload is already there, just in the wrong place.
import { connect, sql } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const REFS = ["Q1", "Q3", "Q4"]
const DRY_RUN = process.argv.includes("--dry-run")

let pool
try {
  pool = await connect("ADMIN")

  const { recordset } = await pool.request().query(`
    SELECT d.divergence_id, d.ref_code, d.visual, d.origin_record
    FROM   sandbox.divergence d
    JOIN   sandbox.component c ON c.component_id = d.component_id
    WHERE  c.slug = '${SLUG}' AND d.ref_code IN ('${REFS.join("','")}')`)

  if (recordset.length !== REFS.length) {
    throw new Error(`expected ${REFS.length} rows (${REFS.join(", ")}), found ${recordset.length}`)
  }

  for (const row of recordset) {
    if (row.visual !== null) {
      throw new Error(`${row.ref_code} already has a non-null visual column — refusing to overwrite`)
    }
    const record = JSON.parse(row.origin_record)
    if (record.visual === undefined) {
      throw new Error(`${row.ref_code}'s origin_record has no visual field — nothing to backfill`)
    }

    const visualJson = JSON.stringify(record.visual)
    console.log(`${row.ref_code}: ${visualJson.slice(0, 100)}${visualJson.length > 100 ? "…" : ""}`)

    if (DRY_RUN) continue

    await pool
      .request()
      .input("id", sql.Int, row.divergence_id)
      .input("visual", sql.NVarChar(sql.MAX), visualJson)
      .query(`
        UPDATE sandbox.divergence
           SET visual = @visual, updated_at = SYSUTCDATETIME()
         WHERE divergence_id = @id`)
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written.")
  } else {
    const check = await pool.request().query(`
      SELECT d.ref_code, d.visual
      FROM   sandbox.divergence d
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = '${SLUG}' AND d.ref_code IN ('${REFS.join("','")}')`)
    const stillNull = check.recordset.filter((r) => r.visual === null)
    if (stillNull.length) {
      throw new Error(`backfill did not take: still NULL for ${stillNull.map((r) => r.ref_code).join(", ")}`)
    }
    console.log(`\n${REFS.length} row(s) backfilled.`)
  }
} finally {
  await pool?.close()
}
