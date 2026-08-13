// Writes review_prompt for the 13 icons rows of rail-sidebar (A-1..A-9, Q1, Q3, Q4, R-1).
// Authoring only, per REVIEW-CARD-SPEC.md §3.10. Text copied verbatim from the user's draft.
//
// node db/write-rail-icons-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const PROMPTS = {
  "A-1": "The ellipsis that opens the rail\u2019s overflow menu, and the same glyph in the panel header. We propose Fluent\u2019s MoreHorizontal, switching to its filled variant on hover and when selected. Check the dot spacing still reads as the same affordance at 20px.",
  "A-2": "The chevron that expands a group in the panel tree. Same Fluent glyph as origin\u2019s, but origin draws it at 16px inside a 20px slot and we draw it at the full 20px. Check the larger chevron still reads as subordinate to the row label beside it.",
  "A-3": "The logo at the top of the rail. We propose the bidezine mark as inline SVG so it takes the rail\u2019s own foreground colour rather than carrying its own. Check it holds together at rail width against the dark surface.",
  "A-4": "The tick marking a checked row in the overflow menu. Fluent\u2019s CheckIcon is the same glyph as origin\u2019s. Check it stays legible against the checked row\u2019s own tinted background rather than competing with the label.",
  "A-5": "The magnifier leading the panel\u2019s search field. Fluent\u2019s SearchIcon is the same glyph, though it takes a className where origin took size and colour props. Check it sits at the right optical size next to the input text.",
  "A-6": "The clear button inside the search field, once something is typed. Fluent\u2019s XIcon is the same glyph as origin\u2019s dismiss. Check it reads as clearing the field rather than closing the panel at this size.",
  "A-7": "The collapse button in the panel header. A verified 1:1 Fluent match exists (panel_left_contract) but is not in our manifest yet. Check the glyph communicates collapsing toward the rail, not a generic panel toggle.",
  "A-8": "Section icons the consumer supplies rather than the component. We propose requiring actionable ones to offer a filled variant. Weigh whether that is fair to ask of a consumer, since a decorative icon then has to opt out explicitly.",
  "A-9": "How any Fluent icon renders filled. We propose filled being a decision the surrounding action makes by state, not a property the icon carries. Check that a non-interactive icon can never inherit it by sitting inside an actionable row.",
  "Q1": "The decision behind the filled-icon mechanism (A-9). Origin swaps every interactive icon between regular and filled; the choice made was to extend our own generator rather than drop the swap. Confirm it still holds now that it is built.",
  "Q3": "The decision behind the rail\u2019s default logo (A-3). The rule chosen is that a logo is always supplied rather than picked for you, with the bidezine mark as this component\u2019s own default. Confirm it holds for a consumer who supplies none.",
  "Q4": "The decision behind the panel collapse icon (A-7). panel_left_contract is the glyph origin\u2019s own ExpandButton imports, verified against Fluent. Confirm the match before it enters the manifest, which is harder to change afterwards.",
  "R-1": "The follow-through on the filled-icon mechanism (A-9). Filled must reach only actionable hover, selected and active states \u2014 a decorative icon inheriting it reads as interactive. Confirm the sweep that checked every actionable icon.",
}

const pool = await connect("ADMIN")
try {
  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
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
    console.log(`${ref}: ${prompt.length} chars`)
  }

  const { recordset } = await pool.request().query(`
    SELECT d.ref_code, LEN(d.review_prompt) AS len, d.review_prompt
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar'
      AND d.ref_code IN ('A-1','A-2','A-3','A-4','A-5','A-6','A-7','A-8','A-9','Q1','Q3','Q4','R-1')
    ORDER BY d.ref_code`)
  console.log("\nWritten:")
  console.table(recordset.map((r) => ({ ref_code: r.ref_code, len: r.len })))
} finally {
  await pool.close()
}
