// Writes review_prompt for 11 confirm-register structure rows of rail-sidebar
// (M-1..M-10, R-4). Authoring only, per REVIEW-CARD-SPEC.md §3.10.
//
// node db/write-rail-structure-confirm-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const PROMPTS = {
  "M-1": "Origin styles everything inline with CSS-in-JS. We use Tailwind classes, keeping an inline style only for the dark-rail colours that change per state. Confirm this still holds.",
  "M-2": "Origin reads design tokens through a useTokens() hook. We have none and are not adding one \u2014 tokens are CSS variables consumed through Tailwind. Confirm that is still the right call.",
  "M-3": "The rail's overflow menu must look dark while every other menu stays light. Rather than a second dark menu, this one call site re-points the shared menu's colour variables. Confirm that beats a new variant.",
  "M-4": "Origin marks dark surfaces with a data attribute. We override colour variables at the one call site instead. Confirm we don't want the attribute \u2014 a second dark surface would make this a pattern.",
  "M-5": "Origin hand-rolls its tooltip; we use our real Tooltip. One behaviour doesn't carry over: origin hides it while a button is active or disabled, ours always shows. Confirm each call site suppresses it.",
  "M-6": "How many rail buttons fit before the rest move into the More menu \u2014 measured live, capped at twelve. The rail never scrolls; whatever doesn't fit is stashed. Confirm the cap and the stashing.",
  "M-7": "Drag-to-resize uses our real Resizable primitive, not a hand-written mouse handler. It clips anything outside the panel, so the shadow is inset on three sides and flush on the left. Confirm that trade.",
  "M-8": "This rail and the design system's own Sidebar are different organisms with similar names. They stay separate until this one is promoted, then Sidebar is revisited. Confirm the sequencing.",
  "M-9": "The logo slot falls back to BiDezine's own mark \u2014 our branding inside someone else's product. Confirm the rule: ask the consumer for their SVG, and choose a deliberate interim state until it arrives.",
  "M-10": "Origin opens its menus non-modally, so the page behind stays interactive. Our menu passes that through to Radix unchanged. Confirm non-modal is right for a rail beside live content.",
  "R-4": "At least seven of origin's visual decisions changed mid-development \u2014 button size, radius, panel typography, active-row background. Confirm which origin state this port must match.",
}

const EXPECTED_REFS = ["M-1","M-2","M-3","M-4","M-5","M-6","M-7","M-8","M-9","M-10","R-4"]

const HISTORY_VERBS = [
  "was approved","was revised","resolved as","originally","was decided",
  "resolved by","concurred","marked it decided","was fixed","was found",
  "found and fixed","was chosen","was picked","was changed","had been",
]

const pool = await connect("ADMIN")
try {
  const gotRefs = Object.keys(PROMPTS)
  const missing = EXPECTED_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !EXPECTED_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
    const lower = prompt.toLowerCase()
    for (const verb of HISTORY_VERBS) {
      if (lower.includes(verb)) throw new Error(`${ref} contains banned history phrase: "${verb}"`)
    }
  }

  const { recordset: existing } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})
      AND d.review_prompt IS NOT NULL`)
  if (existing.length) throw new Error(`rows already have a review_prompt: ${existing.map((r) => r.ref_code)}`)

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
