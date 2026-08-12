// ═══════════════════════════════════════════════════════════════════════════════════
// Populate what each divergence is about — subjects, properties, state, relation.
//
//   node scripts/declare-divergences.mjs [--dry-run]
//
// Properties and state are DERIVED from the committed check specs rather than typed in
// here. A divergence's properties are, by definition, what its checks assert — deriving
// them means the declaration cannot disagree with the evidence, and `verify-approval.mjs`
// re-checks that agreement so it stays true.
//
// Two things are genuinely hand-authored, and both are marked as such below:
//
//   · LABELS. "the first pinned rail button" is prose for a human mid-decision. Nothing
//     can derive it, and a selector shown in its place would be exactly the unreadable
//     output this whole piece exists to replace.
//   · RELATIONS. Whether a claim is about a gap, a pitch or containment is a reading of
//     what the divergence means. It is recorded for the three rows whose meaning is not
//     in doubt (F-4, F-9, F-11 — the three the runner structurally cannot yet measure).
//
// Runs as ADMIN: population is a deliberate act, like the original import. No role that
// connects from the app or an agent can write these tables.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"
import { propertyType } from "./lib/property-type.mjs"

const SLUG = "rail-sidebar"
const CHECKS_DIR = join(REPO_ROOT, "verifier", "checks", SLUG)
const DRY = process.argv.includes("--dry-run")

// ── hand-authored: what to call each anchored element when the widget says what it
// highlighted. Keyed by the anchor id actually present in the markup.
const LABELS = {
  "F-1": "the rail column",
  "F-2": "the first pinned rail button",
  "F-2-icon": "the icon inside that rail button",
  "F-3": "the panel card",
  "F-5": "a top-level panel-tree group row",
  "F-6": "its child row, one level deeper",
  "F-7": "the rail footer column",
  "L-34": "the selected leaf's label",
}

// ── hand-authored: claims about a RELATIONSHIP between two elements rather than a
// property of one. These are precisely the three the runner cannot express today, which
// is why declaring them is what unblocks building that support.
const RELATIONS = {
  "F-4": { relation: "gap", properties: ["gap"] },
  "F-9": { relation: "pitch", properties: ["row-gap", "height"] },
  "F-11": { relation: "containment", properties: ["bottom"] },
}

const specs = []
for (const file of await readdir(CHECKS_DIR)) {
  if (!file.endsWith(".json")) continue
  specs.push(JSON.parse(await readFile(join(CHECKS_DIR, file), "utf8")))
}

/** ref → { anchors:Set, properties:Set, states:Set } */
const derived = new Map()
for (const spec of specs) {
  const entry = derived.get(spec.divergence) ?? { anchors: new Set(), properties: new Set(), states: new Set() }
  entry.anchors.add(spec.anchor)
  for (const check of spec.checks) {
    for (const key of Object.keys(check.expect ?? {})) entry.properties.add(key)
    // A screenshot asserts nothing (migration 005) and so contributes no property, but the
    // state it was captured in is still the state the claim concerns.
    entry.states.add(check.state ?? "rest")
  }
  derived.set(spec.divergence, entry)
}

const plan = []
for (const [ref, entry] of derived) {
  const rel = RELATIONS[ref]
  plan.push({
    ref,
    subjects: [...entry.anchors].sort().map((anchor, i) => ({
      ordinal: i + 1,
      side: "bidezine",
      anchorId: anchor,
      label: LABELS[anchor] ?? anchor,
    })),
    properties: [...entry.properties].sort().map((p) => ({ property: p, type: propertyType(p) })),
    // Only when every check agrees. A claim measured in two different states has no single
    // state, and guessing one would misdescribe it.
    state: entry.states.size === 1 ? [...entry.states][0] : null,
    relation: rel?.relation ?? null,
  })
}

// Rows declared for their RELATION alone. They have no anchors yet — the runner cannot
// measure a two-element claim, so none was written — and inventing anchor ids that do not
// exist in the markup would put a falsehood in the table. Properties and relation are
// true now and are what the runner work needs.
for (const [ref, rel] of Object.entries(RELATIONS)) {
  if (derived.has(ref)) continue
  plan.push({
    ref,
    subjects: [],
    properties: rel.properties.map((p) => ({ property: p, type: propertyType(p) })),
    state: "rest",
    relation: rel.relation,
  })
}

plan.sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }))

console.log(`declaring ${plan.length} divergence(s) for ${SLUG}\n`)
for (const d of plan) {
  const subj = d.subjects.length ? d.subjects.map((s) => s.anchorId).join(" + ") : "(none yet)"
  console.log(`  ${d.ref.padEnd(9)} ${d.relation ? `[${d.relation}] ` : ""}${subj}`)
  console.log(`            ${d.properties.map((p) => `${p.property}:${p.type}`).join("  ")}  @${d.state ?? "(mixed)"}`)
}

if (DRY) {
  console.log("\n--dry-run: nothing written.")
  process.exit(0)
}

let pool
try {
  pool = await connect("ADMIN")
  let subjects = 0
  let properties = 0

  for (const d of plan) {
    const found = await pool
      .request()
      .input("slug", sql.NVarChar(100), SLUG)
      .input("ref", sql.NVarChar(20), d.ref)
      .query(`SELECT d.divergence_id FROM sandbox.divergence d
              JOIN sandbox.component c ON c.component_id = d.component_id
              WHERE c.slug = @slug AND d.ref_code = @ref`)
    if (!found.recordset.length) {
      console.log(`\n  SKIP ${d.ref} — not in the corpus`)
      continue
    }
    const id = found.recordset[0].divergence_id

    // Idempotent: replace this divergence's declaration wholesale rather than merging, so
    // a property removed from a check spec disappears here too instead of lingering.
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM sandbox.divergence_subject  WHERE divergence_id = @id;
      DELETE FROM sandbox.divergence_property WHERE divergence_id = @id;`)

    for (const s of d.subjects) {
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("ordinal", sql.Int, s.ordinal)
        .input("side", sql.NVarChar(10), s.side)
        .input("anchor", sql.NVarChar(50), s.anchorId)
        .input("label", sql.NVarChar(120), s.label)
        .query(`INSERT INTO sandbox.divergence_subject (divergence_id, ordinal, side, anchor_id, label)
                VALUES (@id, @ordinal, @side, @anchor, @label)`)
      subjects++
    }

    for (const p of d.properties) {
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("property", sql.NVarChar(60), p.property)
        .input("type", sql.NVarChar(20), p.type)
        .query(`INSERT INTO sandbox.divergence_property (divergence_id, property, property_type)
                VALUES (@id, @property, @type)`)
      properties++
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("state", sql.NVarChar(20), d.state)
      .input("relation", sql.NVarChar(20), d.relation)
      .query(`UPDATE sandbox.divergence
              SET subject_state = @state, relation = @relation, updated_at = SYSUTCDATETIME()
              WHERE divergence_id = @id`)
  }

  console.log(`\n${subjects} subject(s), ${properties} propert(ies) written across ${plan.length} divergence(s).`)
} finally {
  await pool?.close()
}
