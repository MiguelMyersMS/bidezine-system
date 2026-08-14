// Cleans up rail-sidebar card content in three parts, all data-only. origin_record is never
// touched -- it holds every original verbatim; `title` is the rendered field (the doer's own
// ruling from the F-3/F-5/F-6 correction).
//
//   node db/write-rail-card-cleanup.mjs
//
// PART 1 (must run before part 3): three review_prompts gain information that currently
// lives only in their title, so the information survives part 3 stripping that title text.
//
// PART 2: nine review_prompts (B-1..B-9) drop a final sentence quoting a proposed token's
// light/dark values -- the Adjusted block now reads and renders both live from
// proposedDarkRailTokens, so a value typed into prose here is a pure duplicate that can only
// go stale. B-7 keeps its "~85%" sentence (that's a part-1 concern, not part 2) and drops only
// its own final "Proposed --sidebar-rail-foreground-hover: ..." sentence.
//
// PART 3: strips a trailing parenthetical from every title matching
// ^(.*?)\s*\(([^)]{3,40})\)$, trimming trailing whitespace and , ; -- - from what's left.
// Derived mechanically, not hand-picked -- see db/_derive-title-strip.mjs for the derivation
// this was checked against before writing.

import { connect, sql } from "../verifier/lib/db.mjs"

const pool = await connect("ADMIN")
try {
  async function idFor(ref) {
    const found = await pool
      .request()
      .input("ref", sql.NVarChar(20), ref)
      .query(`
        SELECT d.divergence_id FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id = d.component_id
        WHERE c.slug = 'rail-sidebar' AND d.ref_code = @ref`)
    if (!found.recordset.length) throw new Error(`${ref} not in the corpus`)
    return found.recordset[0].divergence_id
  }

  async function setPrompt(ref, prompt) {
    const id = await idFor(ref)
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("prompt", sql.NVarChar(sql.MAX), prompt)
      .query(`UPDATE sandbox.divergence SET review_prompt = @prompt WHERE divergence_id = @id`)
    console.log(`${ref}  review_prompt updated`)
  }

  async function setTitle(ref, title) {
    const id = await idFor(ref)
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar(400), title)
      .query(`UPDATE sandbox.divergence SET title = @title WHERE divergence_id = @id`)
    console.log(`${ref}  title -> ${JSON.stringify(title)}`)
  }

  // ── PART 1 ──────────────────────────────────────────────────────────────────────────
  console.log("\n-- part 1: folding title info into review_prompt --")
  await setPrompt(
    "C-5",
    "Disabled text on the panel — origin's faintest tier, about 30%. Our code uses muted-foreground at 50% opacity like 22 other primitives, while this row's record names a bespoke hex pair. Confirm the code is right.",
  )
  await setPrompt(
    "H-7",
    "The chevron's rotation on expand and collapse, from −90 to 0 degrees. A standard, already-proven pattern here, pending only the timing above it. Confirm the pattern itself.",
  )
  await setPrompt(
    "L-11",
    "The panel tree's missing hierarchy guide line, which the design system's own sidebar already has — the same guide line L-3 covers. Found and fixed during build. Nothing to decide — this needs a measurement and an independent review before it can close.",
  )

  // ── PART 2 ──────────────────────────────────────────────────────────────────────────
  console.log("\n-- part 2: dropping the duplicated Proposed-token sentence (B-1..B-9) --")
  const bRefs = await pool.request().query(`
    SELECT d.ref_code, d.divergence_id, d.review_prompt
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar' AND d.ref_code LIKE 'B-%'
    ORDER BY d.ref_code`)

  const TRAILING_PROPOSED = /\s*Proposed --sidebar-rail-[\s\S]*\.$/

  for (const row of bRefs.recordset) {
    const before = row.review_prompt
    if (!TRAILING_PROPOSED.test(before)) throw new Error(`${row.ref_code}: no trailing Proposed sentence found, refusing to guess`)
    const after = before.replace(TRAILING_PROPOSED, "")
    await pool
      .request()
      .input("id", sql.Int, row.divergence_id)
      .input("prompt", sql.NVarChar(sql.MAX), after)
      .query(`UPDATE sandbox.divergence SET review_prompt = @prompt WHERE divergence_id = @id`)
    console.log(`${row.ref_code}  dropped: "${before.slice(after.length)}"`)
  }

  // ── PART 3 ──────────────────────────────────────────────────────────────────────────
  console.log("\n-- part 3: stripping trailing parentheticals from titles --")
  const all = await pool.request().query(`
    SELECT d.ref_code, d.divergence_id, d.title
    FROM sandbox.divergence d
    JOIN sandbox.component c ON c.component_id = d.component_id
    WHERE c.slug = 'rail-sidebar'
    ORDER BY d.ref_code`)

  const STRIP = /^(.*?)\s*\(([^)]{3,40})\)$/
  let stripped = 0
  const finalTitles = new Map()
  for (const row of all.recordset) {
    const m = STRIP.exec(row.title)
    const finalTitle = m ? m[1].replace(/[\s,;\u2013\u2014-]+$/, "") : row.title
    finalTitles.set(row.ref_code, finalTitle)
  }
  // uniqueness guard, before writing anything
  const seen = new Map()
  for (const [ref, t] of finalTitles) {
    if (seen.has(t)) throw new Error(`title collision: ${ref} and ${seen.get(t)} would both be "${t}"`)
    seen.set(t, ref)
  }

  for (const row of all.recordset) {
    const finalTitle = finalTitles.get(row.ref_code)
    if (finalTitle === row.title) continue
    await pool
      .request()
      .input("id", sql.Int, row.divergence_id)
      .input("title", sql.NVarChar(400), finalTitle)
      .query(`UPDATE sandbox.divergence SET title = @title WHERE divergence_id = @id`)
    console.log(`${row.ref_code}  title: ${JSON.stringify(row.title)} -> ${JSON.stringify(finalTitle)}`)
    stripped++
  }
  console.log(`\n${stripped} titles stripped.`)
} finally {
  await pool.close()
}
