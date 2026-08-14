// Writes review_prompt for all 11 layout-sizing rows of rail-sidebar
// (F-1..F-11). All confirm-register. This FINISHES the layout-sizing
// category. No relations declared this batch.
// Authoring only, per REVIEW-CARD-SPEC.md SS3.10.
//
// node db/write-rail-layout-sizing-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const PROMPTS = {
  "F-1": "The rail's own width. Origin sets it wider than our Sidebar primitive's collapsed rail, and we match origin here. Confirm the wider rail is right, given our own primitive disagrees.",
  "F-2": "The rail button's box and the glyph inside it. Both match origin exactly. Confirm the button against our own icon-button scale, not only against origin's number.",
  "F-3": "The panel's default width. This row's title still carries origin's number, but the shipped value is our own Sidebar primitive's native default. Confirm the code, and that the title is stale.",
  "F-4": "The gap between the rail and the panel. Matches origin, and separately matches our own spacing step, so no divergence exists here. Confirm both readings still agree.",
  "F-5": "Row hit target. This row's title carries origin's number, which was never adopted \u2014 every tree row ships at one uniform height at every depth. Confirm uniform beats a per-depth scale.",
  "F-6": "The compact row height for nested levels. Origin's number was never adopted either, and nesting does not shrink a row here. Confirm rows staying legible at depth beats matching origin.",
  "F-7": "The footer's height cap, sized to hold three icons. The number is derived from our own button size and gap rather than copied from origin. Confirm three is the right cap.",
  "F-8": "The panel's minimum drag width. It matches our own minimum-width step, so origin landing on the same number is a coincidence rather than a divergence. Confirm the floor is right.",
  "F-9": "The vertical slot each rail item occupies \u2014 the button size plus one spacing step. Derived, not chosen. Confirm the derivation rather than the number it happens to produce.",
  "F-10": "The rail fills its container's height instead of sizing to its own contents, so a consumer supplies that height. Confirm the contract, and that no consumer is expected to hard-code it.",
  "F-11": "The footer sits at the bottom because the nav above it grows, not by reversing DOM order or positioning it absolutely. Confirm the mechanism \u2014 it decides keyboard tab order too.",
}

const EXPECTED_REFS = ["F-1","F-2","F-3","F-4","F-5","F-6","F-7","F-8","F-9","F-10","F-11"]

const pool = await connect("ADMIN")
try {
  const gotRefs = Object.keys(PROMPTS)
  const missing = EXPECTED_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !EXPECTED_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (prompt.length > 220) throw new Error(`${ref} is confirm register and ${prompt.length} chars, over the ~220 budget`)
    if (new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
    if (/\bpx\b/i.test(prompt)) throw new Error(`${ref} contains a forbidden px`)
    if (/\brem\b/i.test(prompt)) throw new Error(`${ref} contains a forbidden rem`)
    if (/\d{2,}/.test(prompt)) throw new Error(`${ref} contains a forbidden 2+ digit number`)
    if (prompt.includes("Found and fixed during build")) throw new Error(`${ref} is confirm register but carries the close-register tail`)
  }

  const { recordset: existing } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})
      AND d.review_prompt IS NOT NULL`)
  if (existing.length) throw new Error(`rows already have a review_prompt: ${existing.map((r) => r.ref_code)}`)

  const { recordset: cats } = await pool.request().query(`
    SELECT d.ref_code, d.category
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})`)
  for (const row of cats) {
    if (row.category !== "layout-sizing") throw new Error(`${row.ref_code}: expected category layout-sizing, got ${row.category}`)
  }

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    const result = await pool
      .request()
      .input("ref_code", ref)
      .input("prompt", prompt)
      .query(`
        UPDATE d SET d.review_prompt = @prompt
        FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id = d.component_id
        WHERE c.slug = 'rail-sidebar' AND d.ref_code = @ref_code
      `)
    if (result.rowsAffected[0] !== 1) throw new Error(`${ref}: expected 1 row updated, got ${result.rowsAffected[0]}`)
  }

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, LEN(d.review_prompt) AS len
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})
    ORDER BY d.ref_code`)
  console.log(`Written ${recordset.length} rows.`)
  console.log("min len:", Math.min(...recordset.map((r) => r.len)), "max len:", Math.max(...recordset.map((r) => r.len)))
  console.table(recordset)
} finally {
  await pool.close()
}
