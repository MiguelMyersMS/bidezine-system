// ═══════════════════════════════════════════════════════════════════════════════════
// The declaration must agree with the evidence.
//
//   node scripts/check-declarations.mjs
//
// Migration 010 records what each divergence is ABOUT — subjects, properties, state,
// relation. That record has exactly one job: to let a machine and a human point at the
// same thing. A declaration that drifts from what the checks actually measure is worse
// than no declaration at all, because it looks authoritative while pointing somewhere
// else — the widget would highlight one property while the evidence proves another, and
// M7's sweep would invalidate the wrong rows.
//
// So nothing here is taken on trust:
//
//   · every stored `property_type` is RE-DERIVED and compared. The type is stored because
//     SQL must group by it, but it is produced by scripts/lib/property-type.mjs and this
//     is what stops a hand-edited row from disagreeing with the rule that made it.
//   · declared properties and asserted properties must be the same set, in both
//     directions. A property declared but never measured is a claim with no evidence; a
//     property measured but never declared is evidence nobody can find.
//   · a `relation` claim must concern two subjects or none. Exactly one is incoherent —
//     there is no gap between an element and nothing.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"
import { PROPERTY_TYPES, propertyType } from "./lib/property-type.mjs"

const SLUG = "rail-sidebar"
const CHECKS_DIR = join(REPO_ROOT, "verifier", "checks", SLUG)

const results = []
const check = (ok, label, note = "") => {
  results.push(ok)
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

// ── what the committed check specs actually assert ──────────────────────────────────
const asserted = new Map()
for (const file of await readdir(CHECKS_DIR)) {
  if (!file.endsWith(".json")) continue
  const spec = JSON.parse(await readFile(join(CHECKS_DIR, file), "utf8"))
  const set = asserted.get(spec.divergence) ?? new Set()
  for (const c of spec.checks) for (const k of Object.keys(c.expect ?? {})) set.add(k)
  asserted.set(spec.divergence, set)
}

let pool
try {
  pool = await connect("APP")

  const rows = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query(`
      SELECT d.ref_code, d.subject_state, d.relation,
             p.property, p.property_type,
             (SELECT COUNT(*) FROM sandbox.divergence_subject s WHERE s.divergence_id = d.divergence_id) AS subject_count
      FROM   sandbox.divergence d
      LEFT   JOIN sandbox.divergence_property p ON p.divergence_id = d.divergence_id
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = @slug AND (p.property IS NOT NULL OR d.relation IS NOT NULL)`)
  ).recordset

  const declared = new Map()
  for (const r of rows) {
    const entry = declared.get(r.ref_code) ?? {
      properties: new Map(),
      relation: r.relation,
      subjectCount: r.subject_count,
      state: r.subject_state,
    }
    if (r.property) entry.properties.set(r.property, r.property_type)
    declared.set(r.ref_code, entry)
  }

  console.log(`\n${declared.size} divergence(s) carry a declaration\n`)
  check(declared.size > 0, "at least one divergence declares what it is about")

  // ── property_type has not drifted from the function that derives it ──────────────
  const drifted = []
  for (const [ref, d] of declared) {
    for (const [property, storedType] of d.properties) {
      const expected = propertyType(property)
      if (storedType !== expected) drifted.push(`${ref}.${property}: stored ${storedType}, derived ${expected}`)
      if (!PROPERTY_TYPES.includes(storedType)) drifted.push(`${ref}.${property}: ${storedType} is not a known type`)
    }
  }
  check(drifted.length === 0, "every stored property_type still equals the derived one", drifted.slice(0, 6).join("\n          "))

  // ── declaration and evidence describe the same properties ────────────────────────
  const mismatched = []
  for (const [ref, props] of asserted) {
    const d = declared.get(ref)
    if (!d) {
      mismatched.push(`${ref}: has check specs but no declaration`)
      continue
    }
    for (const p of props) if (!d.properties.has(p)) mismatched.push(`${ref}: asserts ${p} but does not declare it`)
    for (const p of d.properties.keys()) if (!props.has(p)) mismatched.push(`${ref}: declares ${p} but no check asserts it`)
  }
  check(
    mismatched.length === 0,
    "declared properties and asserted properties are the same set, both directions",
    mismatched.slice(0, 8).join("\n          "),
  )

  // ── a relation needs two subjects, or none yet ───────────────────────────────────
  const incoherent = []
  for (const [ref, d] of declared) {
    if (d.relation && d.subjectCount === 1) {
      incoherent.push(`${ref}: relation '${d.relation}' with exactly one subject`)
    }
  }
  check(
    incoherent.length === 0,
    "no relation claim concerns exactly one subject",
    incoherent.join("\n          ") ||
      `${[...declared.values()].filter((d) => d.relation).length} relation row(s), each with 0 or 2+ subjects`,
  )

  // ── every anchored subject points at an anchor some spec actually uses ────────────
  const specAnchors = new Set()
  for (const file of await readdir(CHECKS_DIR)) {
    if (!file.endsWith(".json")) continue
    specAnchors.add(JSON.parse(await readFile(join(CHECKS_DIR, file), "utf8")).anchor)
  }
  const orphans = (
    await pool.request().input("slug", sql.NVarChar(100), SLUG).query(`
      SELECT d.ref_code, s.anchor_id
      FROM   sandbox.divergence_subject s
      JOIN   sandbox.divergence d ON d.divergence_id = s.divergence_id
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = @slug AND s.side = 'bidezine'`)
  ).recordset.filter((r) => !specAnchors.has(r.anchor_id))
  check(
    orphans.length === 0,
    "every bidezine subject names an anchor a real check spec measures",
    orphans.map((o) => `${o.ref_code} -> ${o.anchor_id}`).join(", "),
  )

  const relationRows = [...declared.entries()].filter(([, d]) => d.relation)
  if (relationRows.length) {
    console.log(
      `\nrelation claims awaiting runner support: ${relationRows.map(([ref, d]) => `${ref}(${d.relation})`).join(", ")}`,
    )
  }
} finally {
  await pool?.close()
}

const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} checks passed.`)
process.exit(failed ? 1 : 0)
