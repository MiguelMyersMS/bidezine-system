// Writes review_prompt for the final 18 rail-sidebar rows across two categories:
// - structure: M-11..M-22 (close), R-3/R-7/R-10 (confirm), R-11 (decide)
// - naming-api: R-5, R-8 (decide)
// This FINISHES both categories. Authoring only, per REVIEW-CARD-SPEC.md SS3.10.
//
// node db/write-rail-final-structure-naming-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const TAIL =
  ". Found and fixed during build. Nothing to decide \u2014 this needs a measurement and an independent review before it can close."

// close register (M-11..M-22): subject + constant tail
const CLOSE_SUBJECTS = {
  "M-11": "A group-toggle row in the panel tree built as a raw button with hand-copied styling, not the real one",
  "M-12": "Rail buttons with no hover or press feedback at all, despite being built on the real Button",
  "M-13": "The active-state ring on the rail, nearly invisible against the dark surface once rendered",
  "M-14": "The rail's divider lines, brightened as a side effect of fixing that ring \u2014 both read one token",
  "M-15": "The rail's dark-mode surface, indistinguishable from the page background behind it",
  "M-16": "The panel-header menu, whose rows stopped aligning once some had icons and others did not",
  "M-17": "The search box, checked against its real primitive after a report that it felt buggy",
  "M-18": "The search icon overlapping typed text, from a hand-positioned icon rather than the real composition",
  "M-19": "Rail icon buttons rendering 36px instead of 38px, making the right gap wider than the left",
  "M-20": "The adjacent content panel, vanishing entirely whenever the browsing panel closed",
  "M-21": "Two follow-ons from that \u2014 a sliver-width content panel, and a resize handle left floating",
  "M-22": "The collapsed rail-to-widget gap measuring 24px instead of 8px, from a placeholder's own padding",
}

// confirm register (structure): hand-written, must fit whole (<=~220)
// decide register (structure + naming-api): hand-written, genuinely open, must fit whole (<=~220)
const HAND_WRITTEN = {
  "R-3": "The risk behind the styling decision (M-1): translating origin's inline CSS-in-JS to Tailwind is mechanical and trap-prone, and some values need arbitrary-value syntax. Confirm the rail carries no leftovers.",
  "R-7": "A second risk against that same decision (M-1): origin injects style tags at runtime, which our build-time CSS cannot see. Confirm nothing carried it over.",
  "R-10": "The risk behind the two sizing bugs (M-18, M-19): a class meant to override a primitive's own shorthand silently loses in the compiled stylesheet. Confirm the checklist catches it now.",
  "R-11": "The Independent Audit gate never ran during this transformation \u2014 around twenty defects surfaced reactively instead. Decide whether it runs before promotion, and who runs it.",
  "R-5": "The risk behind keeping both sidebars (M-8): two organisms called the same thing, with tokens that could collide. Decide when that collision check runs \u2014 it is deferred to promotion today.",
  "R-8": "Origin exports its rail button so consumers can compose their own items with it. Ours is not exported yet. Decide whether that is part of promotion or a deliberate omission.",
}

const PROMPTS = { ...HAND_WRITTEN }
for (const [ref, subject] of Object.entries(CLOSE_SUBJECTS)) {
  PROMPTS[ref] = subject + TAIL
}

const STRUCTURE_REFS = [
  "M-11","M-12","M-13","M-14","M-15","M-16","M-17","M-18","M-19","M-20","M-21","M-22",
  "R-3","R-7","R-10","R-11",
]
const NAMING_API_REFS = ["R-5", "R-8"]
const ALL_REFS = [...STRUCTURE_REFS, ...NAMING_API_REFS]

const RELATIONS = [
  { from: "R-3", to: "M-1", kind: "risks" },
  { from: "R-7", to: "M-1", kind: "risks" },
  { from: "R-10", to: "M-18", kind: "risks" },
  { from: "R-10", to: "M-19", kind: "risks" },
  { from: "R-5", to: "M-8", kind: "risks" },
]

const pool = await connect("ADMIN")
try {
  const gotRefs = Object.keys(PROMPTS)
  const missing = ALL_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !ALL_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
    const isClose = Object.prototype.hasOwnProperty.call(CLOSE_SUBJECTS, ref)
    const hasCloseMarker = prompt.includes("Found and fixed during build")
    if (isClose && !hasCloseMarker) throw new Error(`${ref} is a close row but missing the close marker`)
    if (!isClose && hasCloseMarker) throw new Error(`${ref} is not a close row but contains the close marker`)
    if (!isClose && prompt.length > 220) throw new Error(`${ref} is confirm/decide register and ${prompt.length} chars, over the ~220 budget`)
  }

  const { recordset: existing } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${ALL_REFS.map((r) => `'${r}'`).join(",")})
      AND d.review_prompt IS NOT NULL`)
  if (existing.length) throw new Error(`rows already have a review_prompt: ${existing.map((r) => r.ref_code)}`)

  // Confirm category assignment matches what this script expects, before writing anything.
  const { recordset: cats } = await pool.request().query(`
    SELECT d.ref_code, d.category
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${ALL_REFS.map((r) => `'${r}'`).join(",")})`)
  for (const row of cats) {
    const expected = NAMING_API_REFS.includes(row.ref_code) ? "naming-api" : "structure"
    if (row.category !== expected) throw new Error(`${row.ref_code}: expected category ${expected}, got ${row.category}`)
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
    SELECT d.ref_code, d.category, LEN(d.review_prompt) AS len
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${ALL_REFS.map((r) => `'${r}'`).join(",")})
    ORDER BY d.category, d.ref_code`)
  console.log(`Written ${recordset.length} rows.`)
  console.log("min len:", Math.min(...recordset.map((r) => r.len)), "max len:", Math.max(...recordset.map((r) => r.len)))
  console.table(recordset)
} finally {
  await pool.close()
}

console.log("\nRelations to declare via scripts/declare-relations.mjs:")
console.table(RELATIONS)
