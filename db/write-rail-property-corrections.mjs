// Reconciles sandbox.divergence_property for B-9, F-1, F-2 with what their real check specs
// now assert, so check-declarations' "declared properties and asserted properties are the
// same set, both directions" passes.
//
//   B-9  ADD     opacity           -- Independent Audit (CLAUDE.md item 29): the check
//                                     certified the DECLARATION (color), not the actual
//                                     defect -- disabled:opacity-50 was double-applying the
//                                     already-disabled-looking token. Suppressed for this
//                                     element; the check now asserts opacity: 1 alongside color.
//   F-2  ADD     background-color  -- the hover check used to assert a 38x38 box, which is
//                                     identical at rest and hover and so passed whether or not
//                                     hover worked (the exact M-12 regression class). Replaced
//                                     with background-color, which hover actually moves.
//   F-1  REMOVE  box-sizing        -- border-box is Tailwind preflight on all 4,642 elements
//                                     on the page; the assertion could never fail and is gone.
//
// Types are derived from scripts/lib/property-type.mjs -- the same function check-declarations
// re-derives and compares against -- never hand-assigned.
//
// node db/write-rail-property-corrections.mjs

import { connect, sql } from "../verifier/lib/db.mjs"
import { propertyType } from "../scripts/lib/property-type.mjs"

const pool = await connect("ADMIN")
try {
  async function idFor(ref) {
    const found = await pool
      .request()
      .input("slug", sql.NVarChar(100), "rail-sidebar")
      .input("ref", sql.NVarChar(20), ref)
      .query(`SELECT d.divergence_id FROM sandbox.divergence d
              JOIN sandbox.component c ON c.component_id = d.component_id
              WHERE c.slug = @slug AND d.ref_code = @ref`)
    if (!found.recordset.length) throw new Error(`${ref} not in the corpus`)
    return found.recordset[0].divergence_id
  }

  async function addProperty(ref, property) {
    const id = await idFor(ref)
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
    console.log(`${ref}  ADD     ${property} (${type})`)
  }

  async function removeProperty(ref, property) {
    const id = await idFor(ref)
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("property", sql.NVarChar(60), property)
      .query(`DELETE FROM sandbox.divergence_property WHERE divergence_id = @id AND property = @property`)
    console.log(`${ref}  REMOVE  ${property}`)
  }

  await addProperty("B-9", "opacity")
  await addProperty("F-2", "background-color")
  await removeProperty("F-1", "box-sizing")

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, p.property, p.property_type
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    LEFT JOIN sandbox.divergence_property p ON p.divergence_id = d.divergence_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN ('B-9','F-1','F-2')
    ORDER BY d.ref_code, p.property`)
  console.log("\nAfter:")
  console.table(recordset)
} finally {
  await pool.close()
}
