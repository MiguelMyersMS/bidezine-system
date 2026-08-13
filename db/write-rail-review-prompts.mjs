// Authoring only: sets divergence.review_prompt for the nine Rail Sidebar color rows
// B-1..B-9, per sandbox/REVIEW-CARD-SPEC.md §3.10. Wording is copied verbatim from the
// user's own text -- no rephrasing, no improvement, em-dashes and all. Values are cross-
// checked programmatically against proposedDarkRailTokens (rail-sidebar.ts) before any
// write, matched by proposedVar per B-1..B-9's own mapping to originName.
//
// Does NOT touch review_label, detail, origin_record, any row outside B-1..B-9, or
// sandbox/src/data/rail-sidebar.ts (read-only).

import { connect, sql } from "../verifier/lib/db.mjs"

const DRY = process.argv.includes("--dry-run")
const SLUG = "rail-sidebar"

const PROMPTS = {
  "B-1":
    "The rail's resting background. Bounded on both sides: above --background or the rail vanishes into the page, below hover or hover has nowhere to go. Proposed --sidebar-rail-surface: oklch(0.205 0 0) light, oklch(0.18 0 0) dark.",
  "B-2":
    "What a rail row looks like on hover. Origin overlays white at 10%; bidezine has no equivalent, so this has to be a fixed colour rather than an overlay. Proposed --sidebar-rail-hover: oklch(0.301 0 0) light, oklch(0.191 0 0) dark.",
  "B-3":
    "What a rail row looks like when it is the current one. It has to read as clearly stronger than hover without competing with the icon on top of it. Proposed --sidebar-rail-active: oklch(0.39 0 0) light, oklch(0.252 0 0) dark.",
  "B-4":
    "What a rail row looks like while it is being pressed \u2014 the step between hover and active, and only visible for an instant. Proposed --sidebar-rail-pressed: oklch(0.348 0 0) light, oklch(0.222 0 0) dark.",
  "B-5":
    "The ring around a rail button while it is being browsed. Judge it composed against the real rail surface, not as an isolated swatch \u2014 at this lightness, visible and invisible are easy to confuse. Proposed --sidebar-rail-border-strong: oklch(0.708 0 0) in both modes.",
  "B-6":
    "Text and icons at full strength on the dark rail \u2014 the baseline the other three on-dark values step down from. Proposed --sidebar-rail-foreground: oklch(0.985 0 0) in both modes.",
  "B-7":
    "Text and icons on a rail row being hovered. Origin lifts them to roughly 85%, which is a real step up from rest rather than a subtle one. Proposed --sidebar-rail-foreground-hover: oklch(0.922 0 0) in both modes.",
  "B-8":
    "Subordinate text on the rail, around 50% strength. Note it carries two roles: the browsing ring reuses this same value, so a change here moves both. Proposed --sidebar-rail-foreground-subtle: oklch(0.708 0 0) in both modes.",
  "B-9":
    "Disabled text and icons on the rail, around 20%. It has to stay legible enough to read as disabled text rather than as a rendering artefact. Proposed --sidebar-rail-foreground-disabled: oklch(0.42 0 0) light, oklch(0.375 0 0) dark.",
}

// Real source values, read verbatim from proposedDarkRailTokens in rail-sidebar.ts
// (via `view`, not retyped), keyed by proposedVar -- this is what sentence 3 must equal.
const REAL_TOKENS = {
  "--sidebar-rail-surface": { light: "oklch(0.205 0 0)", dark: "oklch(0.18 0 0)" },
  "--sidebar-rail-hover": { light: "oklch(0.301 0 0)", dark: "oklch(0.191 0 0)" },
  "--sidebar-rail-pressed": { light: "oklch(0.348 0 0)", dark: "oklch(0.222 0 0)" },
  "--sidebar-rail-active": { light: "oklch(0.39 0 0)", dark: "oklch(0.252 0 0)" },
  "--sidebar-rail-border-strong": { light: "oklch(0.708 0 0)", dark: "oklch(0.708 0 0)" },
  "--sidebar-rail-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.985 0 0)" },
  "--sidebar-rail-foreground-hover": { light: "oklch(0.922 0 0)", dark: "oklch(0.922 0 0)" },
  "--sidebar-rail-foreground-subtle": { light: "oklch(0.708 0 0)", dark: "oklch(0.708 0 0)" },
  "--sidebar-rail-foreground-disabled": { light: "oklch(0.42 0 0)", dark: "oklch(0.375 0 0)" },
}

const HISTORY_VERBS = [/\bwas approved\b/i, /\bwas revised\b/i, /\bresolved as\b/i, /\boriginally\b/i]

function verify() {
  const problems = []
  for (const [ref, text] of Object.entries(PROMPTS)) {
    if (text.length >= 280) problems.push(`${ref}: length ${text.length} >= 280`)

    for (const re of HISTORY_VERBS) {
      if (re.test(text)) problems.push(`${ref}: history verb matched ${re}`)
    }

    // Sentence 3 must start with "Proposed" and be the last sentence.
    const sentences = text.split(/(?<=[.])\s+/)
    const last = sentences[sentences.length - 1]
    if (!/^Proposed\b/.test(last)) {
      problems.push(`${ref}: final sentence does not start with "Proposed": ${JSON.stringify(last)}`)
      continue
    }

    const varMatch = last.match(/--[a-z0-9-]+/)
    if (!varMatch) {
      problems.push(`${ref}: no --var found in final sentence`)
      continue
    }
    const proposedVar = varMatch[0]
    const real = REAL_TOKENS[proposedVar]
    if (!real) {
      problems.push(`${ref}: ${proposedVar} not found in proposedDarkRailTokens`)
      continue
    }

    const oklchValues = [...last.matchAll(/oklch\([^)]*\)/g)].map((m) => m[0])
    if (oklchValues.length === 0) {
      problems.push(`${ref}: no oklch value found in final sentence`)
      continue
    }
    if (!oklchValues.includes(real.light)) problems.push(`${ref}: light value ${real.light} not found among ${JSON.stringify(oklchValues)}`)
    if (real.light !== real.dark && !oklchValues.includes(real.dark)) {
      problems.push(`${ref}: dark value ${real.dark} not found among ${JSON.stringify(oklchValues)}`)
    }
  }
  return problems
}

const problems = verify()
console.log("Verification:")
if (problems.length === 0) {
  console.log("  all 9 prompts pass: length, history verbs, final-sentence value fidelity against proposedDarkRailTokens")
} else {
  problems.forEach((p) => console.log(`  FAIL ${p}`))
  throw new Error(`${problems.length} verification failure(s) -- stopping, nothing written`)
}

console.log("\nLengths:")
for (const [ref, text] of Object.entries(PROMPTS)) console.log(`  ${ref}: ${text.length} chars`)

if (DRY) {
  console.log("\n--dry-run: nothing written.")
  process.exit(0)
}

let pool
try {
  pool = await connect("ADMIN")

  const componentId = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query("SELECT component_id FROM sandbox.component WHERE slug = @slug")
  ).recordset[0]?.component_id
  if (!componentId) throw new Error(`component '${SLUG}' not found`)

  for (const [ref, text] of Object.entries(PROMPTS)) {
    const existing = (
      await pool
        .request()
        .input("component_id", sql.Int, componentId)
        .input("ref", sql.NVarChar(20), ref)
        .query("SELECT review_prompt FROM sandbox.divergence WHERE component_id = @component_id AND ref_code = @ref")
    ).recordset[0]
    if (!existing) throw new Error(`${ref}: row not found -- abort, nothing further written`)
    if (existing.review_prompt !== null) {
      throw new Error(`${ref}: review_prompt already set (${JSON.stringify(existing.review_prompt).slice(0, 60)}...) -- abort, not overwriting`)
    }

    await pool
      .request()
      .input("component_id", sql.Int, componentId)
      .input("ref", sql.NVarChar(20), ref)
      .input("review_prompt", sql.NVarChar(280), text)
      .query(
        `UPDATE sandbox.divergence SET review_prompt = @review_prompt, updated_at = SYSUTCDATETIME()
         WHERE component_id = @component_id AND ref_code = @ref`
      )
    console.log(`${ref}: written`)
  }

  console.log("\ndone.")
} finally {
  if (pool) await pool.close()
}
