// Writes divergence_subject + subject_state for the six B-1..B-9 rail-sidebar colour rows
// whose declared state is unambiguously supported by both the DB's CHECK constraint
// (migration 010: rest/hover/active/focus/focus-visible/disabled) and the Sandbox preview's
// forcedState mechanism (FunctionalRailSidebar's RailIconButton only branches on the literal
// strings "hover"/"browsing"/"pressed" -- "rest" needs no branch since it IS the default look).
//
// B-3 (active/"current"), B-4 (pressed) and B-5 (browsing) are deliberately EXCLUDED here --
// see the accompanying report. Writing them would satisfy or fail the CHECK constraint for
// unrelated reasons and, in every case, render nothing or the wrong thing.
//
// node db/write-rail-subject-states.mjs

import { connect } from "../verifier/lib/db.mjs"

const ROWS = [
  { ref: "B-1", divergence_id: 32, anchor_id: "F-1", subject_state: "rest", label: "the rail column behind the buttons" },
  { ref: "B-2", divergence_id: 33, anchor_id: "F-2", subject_state: "hover", label: "the first pinned rail button, hovered" },
  { ref: "B-6", divergence_id: 37, anchor_id: "F-2", subject_state: "rest", label: "text and icon on the first pinned rail button" },
  { ref: "B-7", divergence_id: 38, anchor_id: "F-2", subject_state: "hover", label: "text and icon on the first pinned rail button, hovered" },
  { ref: "B-8", divergence_id: 39, anchor_id: "F-2", subject_state: "rest", label: "subordinate text on the rail" },
  { ref: "B-9", divergence_id: 40, anchor_id: "F-2", subject_state: "rest", label: "disabled text and icon on the rail" },
]

const pool = await connect("ADMIN")
try {
  for (const row of ROWS) {
    await pool
      .request()
      .input("divergence_id", row.divergence_id)
      .input("anchor_id", row.anchor_id)
      .input("label", row.label)
      .query(`
        MERGE sandbox.divergence_subject AS target
        USING (SELECT @divergence_id AS divergence_id, 1 AS ordinal) AS src
        ON target.divergence_id = src.divergence_id AND target.ordinal = src.ordinal
        WHEN MATCHED THEN UPDATE SET side = 'bidezine', anchor_id = @anchor_id, selector = NULL, label = @label
        WHEN NOT MATCHED THEN INSERT (divergence_id, ordinal, side, anchor_id, selector, label)
          VALUES (@divergence_id, 1, 'bidezine', @anchor_id, NULL, @label);
      `)

    await pool
      .request()
      .input("divergence_id", row.divergence_id)
      .input("subject_state", row.subject_state)
      .query(`UPDATE sandbox.divergence SET subject_state = @subject_state WHERE divergence_id = @divergence_id`)

    console.log(`${row.ref} (divergence_id=${row.divergence_id}): subject -> ${row.anchor_id}, state -> ${row.subject_state}`)
  }

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, d.subject_state, s.anchor_id, s.label
    FROM sandbox.divergence d
    JOIN sandbox.divergence_subject s ON s.divergence_id = d.divergence_id AND s.ordinal = 1
    WHERE d.ref_code IN ('B-1','B-2','B-6','B-7','B-8','B-9')
    ORDER BY d.ref_code`)
  console.log("\nWritten:")
  console.table(recordset)
} finally {
  await pool.close()
}
