// Writes divergence_subject + subject_state for B-4 only.
//
// subject_state='active' is correct here: the DB/runner vocabulary's 'active' means CSS
// :active (transient press), which is exactly what B-4 is about. FunctionalRailSidebar's
// RailIconButton now maps forcedState === "active" onto its own local `pressed` boolean
// (line ~787), so this renders correctly. The vocabulary wins; the component's local
// naming bends -- see the comment above that line for the full explanation.
//
// B-3 and B-5 are deliberately NOT written here: both are persistent component state
// ("this is the current section", "this button's menu is open"), not transient interaction
// state, and the runner vocabulary has no term for either by design (REVIEW-CARD-SPEC.md
// §5.3). Naming them needs a migration + applyState support -- the milestone owner's call.
//
// node db/write-rail-b4-subject-state.mjs

import { connect } from "../verifier/lib/db.mjs"

const pool = await connect("ADMIN")
try {
  await pool
    .request()
    .input("divergence_id", 35)
    .input("anchor_id", "F-2")
    .input("label", "the first pinned rail button, pressed")
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
    .input("divergence_id", 35)
    .query(`UPDATE sandbox.divergence SET subject_state = 'active' WHERE divergence_id = @divergence_id`)

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, d.subject_state, s.anchor_id, s.label
    FROM sandbox.divergence d
    JOIN sandbox.divergence_subject s ON s.divergence_id = d.divergence_id AND s.ordinal = 1
    WHERE d.ref_code = 'B-4'`)
  console.log("Written:")
  console.table(recordset)
} finally {
  await pool.close()
}
