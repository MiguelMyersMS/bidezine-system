// Declares anchoring for the 8 dark-rail colour rows (B-1, B-2, B-3, B-4, B-6, B-7, B-8, B-9):
// anchor_id + anchor_file + subject_state on sandbox.divergence, one divergence_subject row and
// one divergence_property row (property_type='color', its first-ever use) each.
//
// Data only -- anchor_id, subjects and properties are not part of the frozen snapshot, so this
// intentionally does not touch db/snapshots/rail-sidebar.json.
//
// B-1's anchor_id is 'F-1', not 'B-1': an anchor names an ELEMENT (the rail column), not a
// divergence, and F-1 already names that same column for its width. Anchors are free strings,
// shared deliberately -- see the "anchor names an element" comment in
// FunctionalRailSidebar.tsx (~line 1546).
//
// B-2/B-4/B-6/B-7/B-8/B-9 previously shared the coarse 'F-2' anchor (written by
// write-rail-subject-states.mjs / write-rail-b4-subject-state.mjs, now superseded). The
// component has since grown per-item anchors (RailIconButton's anchorRef prop, `rail-item-<id>`
// / `rail-item-<id>-icon`) that are more precise, and this script corrects the anchoring to use
// them.
//
// B-4's state is 'active', meaning CSS :active (transient press) -- NOT the persistent
// "selected" look, which is B-3 at 'rest' (the demo renders one section pre-selected already).
// FunctionalRailSidebar has its own comment warning about exactly this collision.
//
// B-5 (darkBorderStrong) is deliberately NOT written here: its ring needs a 'browsing' state
// that subject_state's CHECK-constrained vocabulary does not have. Blocked on a ruling.
//
// node db/write-rail-dark-colour-anchors.mjs

import { connect, sql } from "../verifier/lib/db.mjs"

const ANCHOR_FILE = "sandbox/src/components/FunctionalRailSidebar.tsx"

const ROWS = [
  {
    ref: "B-1",
    anchorId: "F-1",
    label: "the rail column behind the buttons",
    state: "rest",
    property: "background-color",
  },
  {
    ref: "B-2",
    anchorId: "rail-item-data",
    label: "the Data rail button, hovered",
    state: "hover",
    property: "background-color",
  },
  {
    ref: "B-3",
    anchorId: "rail-item-slides",
    label: "the Slides rail button, selected",
    state: "rest",
    property: "background-color",
  },
  {
    ref: "B-4",
    anchorId: "rail-item-overview",
    label: "the Overview rail button, pressed",
    state: "active",
    property: "background-color",
  },
  {
    ref: "B-6",
    anchorId: "rail-item-slides-icon",
    label: "the Slides rail button's icon",
    state: "rest",
    property: "color",
  },
  {
    ref: "B-7",
    anchorId: "rail-item-savings-icon",
    label: "the Savings rail button's icon, hovered",
    state: "hover",
    property: "color",
  },
  {
    ref: "B-8",
    anchorId: "rail-item-data-icon",
    label: "the Data rail button's icon",
    state: "rest",
    property: "color",
  },
  {
    ref: "B-9",
    anchorId: "rail-profile-disabled",
    label: "the disabled profile entry",
    state: "rest",
    property: "color",
  },
]

const pool = await connect("ADMIN")
try {
  let written = 0

  for (const row of ROWS) {
    const found = await pool
      .request()
      .input("slug", sql.NVarChar(100), "rail-sidebar")
      .input("ref", sql.NVarChar(20), row.ref)
      .query(`SELECT d.divergence_id FROM sandbox.divergence d
              JOIN sandbox.component c ON c.component_id = d.component_id
              WHERE c.slug = @slug AND d.ref_code = @ref`)
    if (!found.recordset.length) {
      console.log(`SKIP ${row.ref} -- not in the corpus`)
      continue
    }
    const id = found.recordset[0].divergence_id

    // Idempotent: replace this divergence's subject/property declaration wholesale, so a
    // stale F-2-anchored row cannot linger alongside its corrected replacement.
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM sandbox.divergence_subject  WHERE divergence_id = @id;
      DELETE FROM sandbox.divergence_property WHERE divergence_id = @id;`)

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("side", sql.NVarChar(10), "bidezine")
      .input("anchor", sql.NVarChar(50), row.anchorId)
      .input("label", sql.NVarChar(120), row.label)
      .query(`INSERT INTO sandbox.divergence_subject (divergence_id, ordinal, side, anchor_id, label)
              VALUES (@id, 1, @side, @anchor, @label)`)

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("property", sql.NVarChar(60), row.property)
      .input("type", sql.NVarChar(20), "color")
      .query(`INSERT INTO sandbox.divergence_property (divergence_id, property, property_type)
              VALUES (@id, @property, @type)`)

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("state", sql.NVarChar(20), row.state)
      .input("anchor_id", sql.NVarChar(50), row.anchorId)
      .input("anchor_file", sql.NVarChar(400), ANCHOR_FILE)
      .query(`UPDATE sandbox.divergence
              SET subject_state = @state, anchor_id = @anchor_id, anchor_file = @anchor_file,
                  updated_at = SYSUTCDATETIME()
              WHERE divergence_id = @id`)

    written++
  }

  console.log(`\n${written}/${ROWS.length} row(s) written. B-5 deliberately untouched.\n`)

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, d.subject_state, d.anchor_id, d.anchor_file,
           s.anchor_id AS subject_anchor_id, s.label,
           p.property, p.property_type
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    LEFT JOIN sandbox.divergence_subject s ON s.divergence_id = d.divergence_id AND s.ordinal = 1
    LEFT JOIN sandbox.divergence_property p ON p.divergence_id = d.divergence_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN ('B-1','B-2','B-3','B-4','B-5','B-6','B-7','B-8','B-9')
    ORDER BY d.ref_code`)
  console.table(recordset)
} finally {
  await pool.close()
}
