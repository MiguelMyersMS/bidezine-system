// Writes review_prompt for all 12 typography rows of rail-sidebar
// (D-1..D-12). Eleven confirm-register, D-11 alone close-register.
// This FINISHES the typography category.
// Authoring only, per REVIEW-CARD-SPEC.md SS3.10.
//
// node db/write-rail-typography-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const CLOSE_TAIL =
  ". Found and fixed during build. Nothing to decide \u2014 this needs a measurement and an independent review before it can close."

const CLOSE_REFS = new Set(["D-11"])

const PROMPTS = {
  "D-1": "The typeface for everything. Origin ships Inter; our own font token is already Inter-first with system fallbacks, so nothing had to change. Confirm the fallback chain is acceptable.",
  "D-2": "The page and header title. Origin sets it at medium weight; our mapping keeps the size and renders it one step bolder. Confirm the heavier title is wanted rather than origin's weight.",
  "D-3": "Panel and card titles. Maps exactly onto our base size at medium weight \u2014 same size, same weight as origin. Confirm it holds once composed in the real panel header.",
  "D-4": "The main option rows in the panel. Maps exactly onto our small size. Confirm this is the row text, and that the compact size below is not being used here by mistake.",
  "D-5": "Compact secondary and menu text. Our scale has no step at origin's size, so this lands one pixel smaller. Confirm the shrink is acceptable, and that main rows never use it.",
  "D-6": "Medium labels, subtitles and checked rows. Same one-pixel shrink as the compact size, at medium weight. Confirm the weight carries the emphasis the lost pixel used to.",
  "D-7": "Selected and active option rows. Maps exactly onto our small size at medium weight. Confirm weight alone is enough to mark a row active, with no size change.",
  "D-8": "Caption text. Maps exactly onto our smallest size. Confirm captions and compact menu text sharing one size is intended \u2014 two different roles landing on one value.",
  "D-9": "Dense badges and compact emphatic labels. Same size as a caption, two weights heavier. Confirm the weight is doing the work, since the size cannot.",
  "D-10": "Large metrics. Our scale's nearest step is larger than origin's, so this renders slightly bigger, with tabular figures. Confirm the larger step and that tabular alignment is wanted.",
  "D-11": "The panel header when its text is long: the title truncates on one line, and the subtitle is capped at three rather than wrapping freely as origin does" + CLOSE_TAIL,
  "D-12": "Menu row text renders one step larger than the compact size approved for this content. That larger size is our shared menu convention, used by every menu-family primitive. Confirm the shared scale wins.",
}

const EXPECTED_REFS = ["D-1","D-2","D-3","D-4","D-5","D-6","D-7","D-8","D-9","D-10","D-11","D-12"]

const FORBIDDEN_PATTERNS = [
  { re: /\bpx\b/i, label: "px" },
  { re: /\brem\b/i, label: "rem" },
  { re: /\btext-(xs|sm|base|lg|3xl)\b/i, label: "tailwind type class" },
  { re: /\bfont-(medium|semibold)\b/i, label: "tailwind font-weight class" },
]

const pool = await connect("ADMIN")
try {
  const gotRefs = Object.keys(PROMPTS)
  const missing = EXPECTED_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !EXPECTED_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    const isClose = CLOSE_REFS.has(ref)
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (!isClose && prompt.length > 220) throw new Error(`${ref} is confirm register and ${prompt.length} chars, over the ~220 budget`)
    if (new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
    for (const { re, label } of FORBIDDEN_PATTERNS) {
      if (re.test(prompt)) throw new Error(`${ref} contains a forbidden ${label}`)
    }
    const hasTail = prompt.includes("Found and fixed during build")
    if (isClose && !hasTail) throw new Error(`${ref} is close-register but is missing the constant tail`)
    if (!isClose && hasTail) throw new Error(`${ref} is not close-register but carries the constant tail`)
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
    if (row.category !== "typography") throw new Error(`${row.ref_code}: expected category typography, got ${row.category}`)
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
