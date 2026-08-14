// Writes review_prompt for the final 16 color rows of rail-sidebar
// (C-1..C-14, Q2, R-2). Confirm register only. This FINISHES the color category.
// Authoring only, per REVIEW-CARD-SPEC.md SS3.10.
//
// node db/write-rail-color-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const PROMPTS = {
  "C-1": "The panel's own background surface. Origin ships its own value; we map it onto our card surface rather than introduce a second one. Confirm that is right for a panel floating over content.",
  "C-2": "Full-strength body text. Maps straight onto our foreground token with no new value invented. Confirm the direct mapping still holds once composed on the real panel.",
  "C-3": "Subordinate text, around 60% presence in origin. Maps onto our muted-foreground token. Confirm that one token covers this tier \u2014 the tier below maps onto it too.",
  "C-4": "Faint text, around 40% presence in origin. Also maps onto muted-foreground, collapsing two of origin's tiers into one token. Confirm losing that distinction is acceptable.",
  "C-5": "Disabled text on the panel. The code already uses our muted-foreground token at 50% opacity, like 22 other primitives \u2014 but this row's record names a bespoke hex pair instead. Confirm the code is right.",
  "C-6": "Hover on the panel menu's plain rows. Already native to our menu primitive \u2014 nothing had to be added. Confirm the primitive's own hover is what this should use.",
  "C-7": "The checked state of the menu's Search box toggle. Reuses the accent token at reduced opacity, matching what our nav link already does, rather than a new tint. Confirm that reuse.",
  "C-8": "The pressed instant on all three panel-menu rows, distinct from the hover above. Reuses the accent token the way our sidebar button already does. Confirm rather than a new pressed colour.",
  "C-9": "The ellipsis trigger's own pressed state, not the menu rows it opens. Reuses the ghost button's pressed treatment, applied system-wide. Confirm a shared rule beats a local value.",
  "C-10": "Keyboard focus. Origin fills the whole element; we take the colour from our ring token and keep our own focus mechanism. Confirm the mechanism matters more than matching the fill.",
  "C-11": "Half-pixel dividers. The colour maps onto our border token; the 0.5px weight is the half that must survive the port. Confirm both halves are intended.",
  "C-12": "The stronger inset ring on pressed light menu rows. Colour maps onto our border token, with the heavier treatment kept where the component needs it. Confirm where that actually is.",
  "C-13": "Danger rows in a menu. Maps straight onto our destructive token. Confirm the direct mapping, and that nothing else in the rail needs a danger tier.",
  "C-14": "Text sitting on a filled, dark, active row. Maps onto our primary-foreground token. Confirm it stays legible against the real active background rather than against a swatch.",
  "Q2": "The rail needs roughly eight dark-surface tokens our system has no equivalent for, and inline values would break the tokens-only rule. Confirm a token family is the answer here.",
  "R-2": "The risk behind that family: the rail's whole colour system is missing, and the tempting shortcut is ad-hoc inline values. Confirm the proposed tokens close it with nothing left inline.",
}

const EXPECTED_REFS = ["C-1","C-2","C-3","C-4","C-5","C-6","C-7","C-8","C-9","C-10","C-11","C-12","C-13","C-14","Q2","R-2"]

const RELATIONS = [
  { from: "Q2", to: "B-1", kind: "answers" },
  { from: "Q2", to: "B-2", kind: "answers" },
  { from: "Q2", to: "B-3", kind: "answers" },
  { from: "Q2", to: "B-4", kind: "answers" },
  { from: "Q2", to: "B-5", kind: "answers" },
  { from: "Q2", to: "B-6", kind: "answers" },
  { from: "Q2", to: "B-7", kind: "answers" },
  { from: "Q2", to: "B-8", kind: "answers" },
  { from: "Q2", to: "B-9", kind: "answers" },
  { from: "R-2", to: "Q2", kind: "risks" },
]

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
    if (/#[0-9a-fA-F]{3,8}\b/.test(prompt)) throw new Error(`${ref} contains a hex colour literal`)
    if (/oklch\(/i.test(prompt)) throw new Error(`${ref} contains an oklch() literal`)
  }

  const { recordset: existing } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})
      AND d.review_prompt IS NOT NULL`)
  if (existing.length) throw new Error(`rows already have a review_prompt: ${existing.map((r) => r.ref_code)}`)

  // Confirm category assignment matches expectation before writing anything.
  const { recordset: cats } = await pool.request().query(`
    SELECT d.ref_code, d.category
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code IN (${EXPECTED_REFS.map((r) => `'${r}'`).join(",")})`)
  for (const row of cats) {
    if (row.category !== "color") throw new Error(`${row.ref_code}: expected category color, got ${row.category}`)
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

console.log("\nRelations to declare via scripts/declare-relations.mjs:")
console.table(RELATIONS)
