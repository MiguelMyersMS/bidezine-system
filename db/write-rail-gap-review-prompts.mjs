// Writes review_prompt for the 51 component-gap rows of rail-sidebar (L-1..L-51).
// Authoring only, per REVIEW-CARD-SPEC.md §3.10's "close" register.
//
// L-1 is the sole "confirm"-register exception (a live behavioural requirement).
// L-2..L-51 are SUBJECT + the constant close-register tail, verbatim per the user's draft.
//
// node db/write-rail-gap-review-prompts.mjs

import { connect } from "../verifier/lib/db.mjs"

const TAIL =
  ". Found and fixed during build. Nothing to decide \u2014 this needs a measurement and an independent review before it can close."

const SUBJECTS = {
  "L-2": "The rail's nav buttons, which have no dark-surface variant in the design system and instead drive their colours through the real Button",
  "L-3": "The vertical guide line showing nesting depth in the panel tree, which had no equivalent here",
  "L-4": "The panel's collapse button, which needed both a Fluent icon decision and a real Button underneath it",
  "L-5": "The clear button inside the search field, now built from the real icon-button scale rather than a bespoke one",
  "L-6": "The badge used on rail rows, which needed tone and weight variants the design system did not yet have",
  "L-7": "The panel's open and close animation, which origin hand-rolls with its own timer rather than a shared primitive",
  "L-8": "The rail's More button, and the dot marking a section hidden inside its menu",
  "L-9": "Group rows in the panel tree, which read as a different kind of element from the leaf rows beside them",
  "L-10": "Leaf rows in the panel tree, which gave no hover feedback at all while group rows did",
  "L-11": "The panel tree's missing hierarchy guide line, which the design system's own sidebar already has",
  "L-12": "The panel tree's guide line, which sat off-centre from the parent row's icon",
  "L-13": "The full box model of every panel-tree row \u2014 height, radius, padding, gap and type",
  "L-14": "The first exhaustive sweep of the whole component, rather than a fix prompted by something visibly wrong",
  "L-15": "The panel's missing border, despite it behaving exactly like a menu that floats over content",
  "L-16": "The rest of the panel's menu recipe \u2014 its elevation, and its open and close animation",
  "L-17": "Group rows in the panel tree, whose chevron sat on the left with no content icon at all",
  "L-18": "The panel's scroll region, which left no gap between its content and the scrollbar",
  "L-19": "Long labels in a dropdown menu item, which wrapped to a second line instead of truncating",
  "L-20": "Two Fluent icons whose filled shapes differ so much from their outlines that the swap reads as a different icon",
  "L-21": "The scroll region's gap, fixed once and still wrong on the container's own outer edge",
  "L-22": "The scroll region's new wrapper, which padded three sides and left the top bare",
  "L-23": "The root cause behind five separate reports of icons not filling on hover or select",
  "L-24": "The rail's nav buttons, whose icons filled when selected but never on hover alone",
  "L-25": "The scrollbar gutter, reserved on every migrated component whether or not the content actually scrolled",
  "L-26": "The mechanism behind that conditional gutter, which leaked one scroll region's state into another",
  "L-27": "Rail icons not filling on hover, press or select \u2014 the fifth time this was reported",
  "L-28": "Selected rows in the panel tree, which carried the same text weight as unselected ones",
  "L-29": "The icons on those same selected rows, which stayed unfilled after the text weight was fixed",
  "L-30": "Whether that text-and-icon emphasis was durably enforced, or only written down",
  "L-31": "Every rail button's keyboard focus ring, clipped on all four sides by a wrapper with no room for it",
  "L-32": "The rail's overflow menu \u2014 its icon colour, and its missing indicator for the current section",
  "L-33": "The panel's tree area, inset noticeably deeper on the left than the search box above it",
  "L-34": "Tree row labels, whose descenders were clipped along the bottom edge",
  "L-35": "The panel's drag-to-resize, and the elevation shadow that its new wrapper clipped",
  "L-36": "The panel's height, silently shrunk by the padding added to protect its shadow",
  "L-37": "The panel's right edge, where removing that padding clipped the shadow's rounded corner",
  "L-38": "The rail in this preview stage, almost entirely clipped out of view by a centred layout",
  "L-39": "The search field's clear button, following the icon decision it depended on",
  "L-40": "Where the four panel-menu colours actually apply, documented while resolving them",
  "L-41": "The panel's default width, following the decision to use the design system's own value",
  "L-42": "The height of every nav row, following the decision to make them uniform at any depth",
  "L-43": "That same row height, revised a second time against the design system's own sidebar",
  "L-44": "The gap between the rail and the panel, following the decision on its value",
  "L-45": "The footer's three-icon height cap, following the decision that set it",
  "L-46": "The panel's minimum width, its derived item slot, and the footer anchored to the bottom",
  "L-47": "The rail filling its container's height rather than sizing itself to its contents",
  "L-48": "The gap between rail and panel, silently doubled to 16px by the shadow inset",
  "L-49": "The shared background token between the rail and its overflow menu, applied in only one direction",
  "L-50": "Panel tree rows, which overflowed and clipped with no ellipsis to show it",
  "L-51": "The rail's logo slot, which had no hover or press feedback and used the wrong resting colour",
}

const PROMPTS = {
  "L-1": "The logo at the top of the rail. There is no primitive for it, so we compose a plain button with our Tooltip. Confirm the tooltip must show on hover even when the logo is not a link \u2014 a decorative mark that stays silent reads as broken.",
}
for (const [ref, subject] of Object.entries(SUBJECTS)) {
  PROMPTS[ref] = subject + TAIL
}

const EXPECTED_REFS = Array.from({ length: 51 }, (_, i) => `L-${i + 1}`)

const pool = await connect("ADMIN")
try {
  // Verify shape before writing anything.
  const gotRefs = Object.keys(PROMPTS).sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))
  const missing = EXPECTED_REFS.filter((r) => !gotRefs.includes(r))
  const extra = gotRefs.filter((r) => !EXPECTED_REFS.includes(r))
  if (missing.length || extra.length) throw new Error(`ref mismatch: missing=${missing} extra=${extra}`)

  for (const [ref, prompt] of Object.entries(PROMPTS)) {
    if (prompt.length >= 280) throw new Error(`${ref} is ${prompt.length} chars, over the 280 cap`)
    if (ref !== "L-1" && new RegExp(`\\b${ref}\\b`).test(prompt)) throw new Error(`${ref} restates its own ref`)
  }

  const { recordset: existing } = await pool.request().query(`
    SELECT d.ref_code
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.category = 'component-gap' AND d.review_prompt IS NOT NULL`)
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
    WHERE c.slug = 'rail-sidebar' AND d.category = 'component-gap'
    ORDER BY TRY_CAST(SUBSTRING(d.ref_code, 3, 10) AS INT)`)
  console.log(`Written ${recordset.length} rows.`)
  console.log("min len:", Math.min(...recordset.map((r) => r.len)), "max len:", Math.max(...recordset.map((r) => r.len)))
  console.table(recordset)
} finally {
  await pool.close()
}
