// L-34-group's check spec asserts font-weight (added after the second Independent Audit --
// see verifier/checks/rail-sidebar/L-34-group.json's own "_why_font_weight" note), but
// sandbox.divergence_property never declared it, so check-declarations has read 6/7 since
// that assertion landed: the assertion is real and passing, only the declaration was
// missing.
//
// property_type is derived from scripts/lib/property-type.mjs -- the same function
// check-declarations re-derives and compares against -- never hand-assigned.
//
// node db/write-rail-l34-declare-font-weight.mjs

import { connect, sql } from "../verifier/lib/db.mjs"
import { propertyType } from "../scripts/lib/property-type.mjs"

const pool = await connect("ADMIN")
try {
  const found = await pool
    .request()
    .input("slug", sql.NVarChar(100), "rail-sidebar")
    .input("ref", sql.NVarChar(20), "L-34")
    .query(`SELECT d.divergence_id FROM sandbox.divergence d
            JOIN sandbox.component c ON c.component_id = d.component_id
            WHERE c.slug = @slug AND d.ref_code = @ref`)
  if (!found.recordset.length) throw new Error("L-34 not in the corpus")
  const id = found.recordset[0].divergence_id

  const property = "font-weight"
  const type = propertyType(property)

  await pool
    .request()
    .input("id", sql.Int, id)
    .input("property", sql.NVarChar(60), property)
    .input("type", sql.NVarChar(20), type)
    .query(`
      MERGE sandbox.divergence_property AS target
      USING (SELECT @id AS divergence_id, @property AS property) AS src
      ON target.divergence_id = src.divergence_id AND target.property = src.property
      WHEN MATCHED THEN UPDATE SET property_type = @type
      WHEN NOT MATCHED THEN INSERT (divergence_id, property, property_type)
        VALUES (@id, @property, @type);
    `)
  console.log(`L-34  ADD  ${property} (${type})`)

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, p.property, p.property_type
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    LEFT JOIN sandbox.divergence_property p ON p.divergence_id = d.divergence_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code = 'L-34'
    ORDER BY p.property`)
  console.log("\nAfter:")
  console.table(recordset)
} finally {
  await pool.close()
}
