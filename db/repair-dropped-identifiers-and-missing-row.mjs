// Repair for two defects found by comparing the corpus against the REAL source
// (sandbox/src/data/rail-sidebar.ts), not just against the snapshot -- verify-import.mjs
// and check-corpus-equivalence.mjs cannot see either defect, because both diff the corpus
// against artifacts that descend from the same lossy import.
//
// Defect 1 (Q3, Q4): `visual.beforeSvgPath` was an identifier reference to a constant
// declared elsewhere in the source (BIDEZINE_LOGO_PATH, PANEL_LEFT_CONTRACT_PATH), not an
// inline string literal. The import script resolved literals fine (Q1's beforeSvgPath is
// a literal and survived) but silently dropped the two identifier-referenced values with
// no error. Values below were read directly from the constant declarations in
// rail-sidebar.ts (lines 53-54 and 76-77) via `view`, never retyped from memory --
// CLAUDE.md checklist item 18.
//
// Defect 2 (R-11): the real source's notableRisks array has 11 entries, not 10 --
// db/import-blocking-risks.mjs's own RISK_CATEGORY map and hard "expect 14 rows" gate
// were both written against a miscount, so R-11 was never inserted at all. This is a
// missing row, not a missing field -- CLAUDE.md checklist item 12 exactly ("porting a
// data structure from an origin source requires an exhaustive field-by-field diff").
//
// Both values/objects below were confirmed by a scripted diff (db/_audit_qr.mjs) between
// the real, bundled TS source and both the import script's transcription and the live
// database -- not by manual re-reading.

import { connect, sql } from "../verifier/lib/db.mjs"

const DRY = process.argv.includes("--dry-run")
const SLUG = "rail-sidebar"

const BIDEZINE_LOGO_PATH =
  "M 15.099 2.069 C 21.154 2.069 26.063 6.979 26.063 13.034 C 26.063 19.09 21.154 23.999 15.099 23.999 L 14.087 23.999 C 14.082 23.999 14.076 24 14.07 24 L 9.306 24 C 8.77 24 8.297 23.65 8.141 23.139 L 4.984 12.835 C 4.744 12.052 5.33 11.26 6.149 11.26 L 10.998 11.26 C 11.537 11.26 12.012 11.614 12.166 12.13 L 13.499 16.602 L 15.103 16.602 C 17.073 16.602 18.671 15.004 18.671 13.033 C 18.671 11.063 17.073 9.465 15.103 9.465 C 14.349 9.465 13.685 8.97 13.47 8.248 L 11.985 3.262 C 11.825 2.723 12.182 2.069 12.744 2.069 L 15.099 2.069 Z M 8.441 0 C 8.982 -0.002 9.459 0.352 9.613 0.87 L 10.084 2.446 C 10.201 2.838 10.013 3.256 9.644 3.431 L 9.12 3.678 L 9.12 3.68 L 9.119 3.681 L 8.805 3.832 C 8.366 4.043 8.452 4.692 8.931 4.781 L 10.311 5.038 C 10.666 5.104 10.954 5.363 11.058 5.709 L 11.779 8.129 C 12.012 8.91 11.428 9.695 10.612 9.695 L 3.429 9.695 C 2.893 9.695 2.42 9.345 2.264 8.833 L 0.055 1.602 C -0.184 0.82 0.398 0.029 1.215 0.026 L 8.441 0 Z"
const PANEL_LEFT_CONTRACT_PATH =
  "M10.82 10.5h3.68a.5.5 0 0 0 0-1h-3.68l1-.87a.5.5 0 1 0-.66-.76l-2 1.75a.5.5 0 0 0 0 .76l2 1.75a.5.5 0 1 0 .66-.76l-1-.87ZM4 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4ZM3 6a1 1 0 0 1 1-1h3v10H4a1 1 0 0 1-1-1V6Zm5 9V5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8Z"

const R11 = {
  id: "R-11",
  title: "Verification was reactive for the entire transformation — the formal Independent Audit gate never ran even once",
  detail:
    "Prompted by \u201cwe have detected many divergences even though we suppose to respect the fact that we can only use native primitives/components... we need to refine the protocol for this sandbox factory line to reduce this to zero.\u201d Retrospective across the whole transformation (M-11 through L-13, ~20 findings): every single one was caught because a human looked at the rendered component and noticed something off, never by an AI-initiated systematic check running before work was presented as finished — and the protocol's own Independent Audit agent role was never actually invoked. Added a new, mandatory \u201cPrimitive Fidelity Checklist\u201d to CLAUDE.md (className-merge verification via tailwind-merge run directly, full box-model parity via getComputedStyle, every interactive state simulated live, alignment claims measured via getBoundingClientRect, and a full sweep after every fix) that the Build agent must run continuously, not defer to a possibly-never-invoked later Audit phase. Immediately ran this checklist exhaustively against the whole component as proof: found one real dead-code issue in seconds (L-14) that 18 prior turns of reactive, one-at-a-time fixing had not surfaced.",
  actionItems: [
    {
      id: "R-11a",
      text: "New \u201cPrimitive Fidelity Checklist\u201d added to CLAUDE.md; Agent Roster table in LIMBO-PROTOCOL-LOG.md updated so Build is explicitly required to run it, and Audit is explicitly a second, independent check rather than the only one",
      done: true,
    },
    {
      id: "R-11b",
      text: "First exhaustive, AI-initiated sweep of FunctionalRailSidebar.tsx run against the new checklist — found and fixed L-14 (dead hover:bg-transparent on a disabled button); every className merge and interactive state otherwise confirmed clean",
      done: true,
      refs: ["L-14"],
    },
    {
      id: "R-11c",
      text: "A genuine, separately-invoked Independent Audit agent (per the Agent Roster's segregation-of-duties requirement, not a self-check by the same Build context) still needs to run before promotion — the sweep above was thorough but was not that independent second pass",
      done: false,
      refs: ["R-10b"],
    },
  ],
}

let pool
try {
  pool = await connect("ADMIN")

  const componentId = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query("SELECT component_id FROM sandbox.component WHERE slug = @slug")
  ).recordset[0]?.component_id
  if (!componentId) throw new Error(`component '${SLUG}' not found`)

  // --- Defect 1: Q3, Q4 missing visual.beforeSvgPath ---
  const targets = [
    { ref: "Q3", value: BIDEZINE_LOGO_PATH },
    { ref: "Q4", value: PANEL_LEFT_CONTRACT_PATH },
  ]

  for (const { ref, value } of targets) {
    const row = (
      await pool
        .request()
        .input("component_id", sql.Int, componentId)
        .input("ref", sql.NVarChar(20), ref)
        .query("SELECT origin_record, visual FROM sandbox.divergence WHERE component_id = @component_id AND ref_code = @ref")
    ).recordset[0]
    if (!row) throw new Error(`${ref}: row not found -- abort, nothing written`)

    const originRecord = JSON.parse(row.origin_record)
    if (!originRecord.visual) throw new Error(`${ref}: origin_record has no visual object at all -- abort, shape changed unexpectedly`)
    if (originRecord.visual.beforeSvgPath !== undefined) {
      throw new Error(`${ref}: origin_record.visual.beforeSvgPath is already set (${JSON.stringify(originRecord.visual.beforeSvgPath).slice(0, 60)}...) -- abort, this repair is not needed or already applied`)
    }
    const visualCol = row.visual ? JSON.parse(row.visual) : null
    if (!visualCol) throw new Error(`${ref}: visual column is null -- abort, expected Fix B to have already populated it`)
    if (visualCol.beforeSvgPath !== undefined) {
      throw new Error(`${ref}: visual column already has beforeSvgPath set -- abort, this repair is not needed or already applied`)
    }

    // Insert beforeSvgPath right after beforeLabel to match the real source's own key
    // order (cosmetic only -- canon() in verify-import.mjs is key-order-insensitive --
    // but keeping it matches what a real re-import would have produced).
    const newVisualRecord = {}
    for (const [k, v] of Object.entries(originRecord.visual)) {
      newVisualRecord[k] = v
      if (k === "beforeLabel") newVisualRecord.beforeSvgPath = value
    }
    if (!("beforeSvgPath" in newVisualRecord)) newVisualRecord.beforeSvgPath = value // beforeLabel missing (shouldn't happen) -- fall back to appending

    const newOriginRecord = { ...originRecord, visual: newVisualRecord }

    console.log(`${ref}: will set visual.beforeSvgPath (${value.length} chars) in both origin_record and visual column`)

    if (!DRY) {
      await pool
        .request()
        .input("component_id", sql.Int, componentId)
        .input("ref", sql.NVarChar(20), ref)
        .input("origin_record", sql.NVarChar(sql.MAX), JSON.stringify(newOriginRecord))
        .input("visual", sql.NVarChar(sql.MAX), JSON.stringify(newVisualRecord))
        .query(
          `UPDATE sandbox.divergence SET origin_record = @origin_record, visual = @visual, updated_at = SYSUTCDATETIME()
           WHERE component_id = @component_id AND ref_code = @ref`
        )
    }
  }

  // --- Defect 2: R-11 missing entirely ---
  const r11Existing = (
    await pool
      .request()
      .input("component_id", sql.Int, componentId)
      .query("SELECT ref_code FROM sandbox.divergence WHERE component_id = @component_id AND ref_code = 'R-11'")
  ).recordset[0]
  if (r11Existing) {
    console.log("R-11: already present -- skipping insert")
  } else {
    console.log(`R-11: will insert (category=structure, matching the R-3/R-4/R-7/R-10 catch-all bucket)`)
    if (!DRY) {
      await pool
        .request()
        .input("component_id", sql.Int, componentId)
        .input("ref", sql.NVarChar(20), "R-11")
        .input("category", sql.NVarChar(30), "structure")
        .input("title", sql.NVarChar(400), R11.title.slice(0, 400))
        .input("detail", sql.NVarChar(sql.MAX), R11.detail)
        .input("origin_record", sql.NVarChar(sql.MAX), JSON.stringify(R11))
        .input("origin_category", sql.NVarChar(80), "R \u2014 Notable risks")
        .query(
          `INSERT INTO sandbox.divergence
             (component_id, ref_code, category, title, detail, state, origin_record, origin_category, anchor_id, anchor_file)
           VALUES
             (@component_id, @ref, @category, @title, @detail, 'legacy_unverified', @origin_record, @origin_category, NULL, NULL)`
        )
    }
  }

  if (DRY) {
    console.log("\n--dry-run: nothing written.")
  } else {
    const dbCount = (
      await pool.request().input("component_id", sql.Int, componentId).query("SELECT COUNT(*) AS n FROM sandbox.divergence WHERE component_id = @component_id")
    ).recordset[0].n
    console.log(`\nrepair applied. total rail-sidebar rows in database: ${dbCount}`)
  }
} finally {
  if (pool) await pool.close()
}
