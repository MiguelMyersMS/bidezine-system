// Writes review_prompt for the FINAL 28 rows of rail-sidebar
// (spacing, radius, motion, elevation, z-index, interaction-state,
// scroll). Completes the corpus at 169/169.
// 20 confirm-register, 8 decide-register. No relations this batch.
// Authoring only, per REVIEW-CARD-SPEC.md SS3.10.
//
// node db/write-rail-final-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const DECIDE_REFS = new Set(["G-1", "H-2", "H-3", "H-4", "H-5", "H-6", "R-6", "R-9"])

const CATEGORY_BY_PREFIX = {
  "E-": "spacing",
  "G-": "radius",
  "H-": "motion",
  "I-": "elevation",
  "J-": "z-index",
  "K-": "interaction-state",
}
// K-3 is scroll, not interaction-state -- explicit override below.
const CATEGORY_OVERRIDE = { "K-3": "scroll", "R-6": "motion", "R-9": "motion" }

const PROMPTS = {
  "E-1": "The smallest spacing step, used between rail items. Maps exactly onto our own scale. Confirm the step, and that it is the one the rail's item slot derives from.",
  "E-2": "The standard spacing step \u2014 the rail-to-panel gap and most padding. Maps exactly onto our own scale. Confirm one step covering both roles is intended.",
  "E-3": "The next step up, for looser grouping. Maps exactly onto our own scale. Confirm anything in the rail actually uses it today, rather than it being carried over unused.",
  "E-4": "The rail's outer gap. Maps exactly onto our own scale \u2014 and origin itself once shipped the wrong step here, so confirm ours is the intended value rather than an inherited mistake.",
  "E-5": "The largest spacing step in use. Maps exactly onto our own scale. Confirm it is still needed, or whether the rail only ever reaches for the smaller steps.",
  "E-6": "A half step, for the tightest gaps between rows. Maps exactly onto our own scale. Confirm hairline spacing is wanted here rather than the smallest full step.",
  "E-7": "The subtitle's indent, which origin hard-codes. Ours lands on a real step of the same size, so it stops being a magic number. Confirm the alignment it produces is right.",
  "G-1": "The outer radius on the rail, panel and menus. Origin's value falls between two of our steps, so it ships as a raw inline number rather than a token. Decide which step it snaps to, or that it stays raw.",
  "G-2": "The radius on rows and overflow items. An exact match to one of our own steps, so no divergence exists. Confirm it once composed, not as an isolated shape.",
  "G-3": "The radius on rail icon buttons. This row's record was corrected to match what actually ships, after recording a smaller step than the code uses. Confirm the shipped value is right.",
  "G-4": "Fully rounded pills. An exact match to our own full-round utility. Confirm nothing in the rail needs a partial round instead.",
  "H-1": "Hover and press timing. No motion token exists in our system, so this ships as a literal duration and easing. Confirm the value, knowing it has nothing to anchor to yet.",
  "H-2": "The panel reveal's duration. Marked green to unblock the transformation, not solved \u2014 a working stand-in awaiting the planned system-wide motion upgrade. Decide whether it holds or folds into that.",
  "H-3": "The easing curve for fast transitions. Same deferral as the reveal duration: green to unblock, never decided. Decide whether it waits for the motion upgrade or gets settled now.",
  "H-4": "The panel reveal's easing. Deferred alongside the other motion values, with no token to anchor it. Decide whether it waits for the system-wide upgrade or is settled here.",
  "H-5": "The panel reveal itself \u2014 animating width and margin, entirely custom, with no primitive covering it. Deferred rather than decided. Decide whether a primitive should own this.",
  "H-6": "The collapse animation and its deterministic unmount. Deferred with the rest of the motion set. Decide whether it waits, given the unmount timing is also a correctness question.",
  "H-7": "The chevron's rotation on expand and collapse. A standard, already-proven pattern here, pending only the timing above it. Confirm the pattern itself.",
  "H-8": "Reduced-motion handling. Our own variant covers it system-wide, though what each element suppresses may differ. Confirm the coverage element by element rather than assuming it.",
  "R-6": "The collapse animation's exact timing and easing live only in origin's own constants and were never captured here. Decide whether to capture them, or let the motion upgrade supersede them.",
  "R-9": "Our collapsible primitive does not guarantee origin's deterministic unmount. Decide whether that timing is verified before promotion, or accepted as a documented difference.",
  "I-1": "The shadow on the panel and both menus. We have no elevation token, only a stock shadow scale, so this picks a step from that. Confirm the step, and whether a real token is wanted later.",
  "J-1": "The menus' stacking level. Maps onto the same level every one of our own overlay components already uses. Confirm consistency with those rather than with origin.",
  "J-2": "The rail's own stacking context, which origin flags as a sanctioned exception. Ours sits above sticky headers and below modals. Confirm that placement against a real app shell.",
  "K-1": "Focus rings. Origin injects a global stylesheet; every rail element here is a real Button already carrying our own focus treatment. Confirm no interactive element was missed.",
  "K-2": "The inline focus-ring object origin passes around. Nothing here uses one \u2014 the primitive covers it. Confirm that holds for the tooltip trigger and the footer buttons too.",
  "K-4": "The disabled cursor. An exact match to our own utility. Confirm it is actually reachable, since a disabled element also stops receiving pointer events.",
  "K-3": "The panel's scrollbar. Origin injects a stylesheet; we use our real scroll primitive instead. Confirm it scrolls in the rail specifically \u2014 an earlier check silently measured a different one.",
}

const EXPECTED_REFS = ["E-1","E-2","E-3","E-4","E-5","E-6","E-7","G-1","G-2","G-3","G-4",
  "H-1","H-2","H-3","H-4","H-5","H-6","H-7","H-8","R-6","R-9",
  "I-1","J-1","J-2","K-1","K-2","K-3","K-4"]

function expectedCategory(ref) {
  if (CATEGORY_OVERRIDE[ref]) return CATEGORY_OVERRIDE[ref]
  const prefix = ref.slice(0, 2)
  if (!CATEGORY_BY_PREFIX[prefix]) throw new Error(`no category mapping for prefix of ${ref}`)
  return CATEGORY_BY_PREFIX[prefix]
}

const pool = await connect("ADMIN")
try {
  const gotRefs = Object.keys(PROMPTS)
  const missing = EXPECTED_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !EXPECTED_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)
  if (EXPECTED_REFS.length !== 28) throw new Error(`expected 28 refs, got ${EXPECTED_REFS.length}`)
  if (DECIDE_REFS.size !== 8) throw new Error(`expected 8 decide refs, got ${DECIDE_REFS.size}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    const isDecide = DECIDE_REFS.has(ref)
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (prompt.length > 220) throw new Error(`${ref} is over the ~220 budget (${prompt.length})`)
    if (new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
    if (/\bpx\b/i.test(prompt)) throw new Error(`${ref} contains a forbidden px`)
    if (/\bms\b/.test(prompt)) throw new Error(`${ref} contains a forbidden ms`)
    if (/\brem\b/i.test(prompt)) throw new Error(`${ref} contains a forbidden rem`)
    if (/\d{2,}/.test(prompt)) throw new Error(`${ref} contains a forbidden 2+ digit number`)
    if (prompt.includes("Found and fixed during build")) throw new Error(`${ref} carries the close-register tail`)
    const hasDecide = /\bDecide\b/.test(prompt)
    if (isDecide && !hasDecide) throw new Error(`${ref} is decide-register but does not contain the word "Decide"`)
    if (!isDecide && hasDecide) throw new Error(`${ref} is confirm-register but contains the word "Decide"`)
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
    const expected = expectedCategory(row.ref_code)
    if (row.category !== expected) throw new Error(`${row.ref_code}: expected category ${expected}, got ${row.category}`)
  }

  // Confirm this really is the full remainder of the corpus.
  const { recordset: stillNull } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.review_prompt IS NULL`)
  const stillNullSet = new Set(stillNull.map((r) => r.ref_code))
  const notCovered = [...stillNullSet].filter((r) => !EXPECTED_REFS.includes(r))
  if (notCovered.length) throw new Error(`rows remain undescribed outside this batch: ${notCovered}`)

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

  const { recordset: totalNull } = await pool.request().query(`
    SELECT COUNT(*) AS n
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.review_prompt IS NULL`)
  console.log("rows still without a review_prompt across the whole corpus:", totalNull[0].n)
} finally {
  await pool.close()
}
