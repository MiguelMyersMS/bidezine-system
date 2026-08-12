// ═══════════════════════════════════════════════════════════════════════════════════
// Who is working on what — the thing you used to read HANDOFF.md for.
//
//   node scripts/machines.mjs
//
// M8's third done-when is "nothing depends on hand-maintained markdown for cross-machine
// state." The Sandbox app's Machines tab shows this too, but a session recovering in a
// fresh chat should not have to boot Vite to find out who owns what — and a fact that is
// only reachable through a UI is a fact an agent will go on guessing.
//
// Read-only by construction: it connects as `app_rw`, which is DENIED `UPDATE` on
// `component.owner_machine_id` (migration 015). There is deliberately no `--claim` or
// `--transfer` flag here. Moving a component between machines is a decision about who is
// responsible for work, and a decision belongs in a place where someone has to state a
// reason — `sandbox.usp_transfer_component` requires one. A convenience flag on a status
// command is exactly how that reason turns into an empty string.
// ═══════════════════════════════════════════════════════════════════════════════════

import { connect } from "../verifier/lib/db.mjs"

let pool
try {
  pool = await connect("APP")

  const machines = (await pool.request().query(`SELECT name, is_primary FROM sandbox.machine ORDER BY is_primary DESC, name`)).recordset

  const components = (
    await pool.request().query(`
      SELECT   c.slug, c.state, owner = m.name,
               total    = COUNT(d.divergence_id),
               resolved = SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END),
               blocked  = SUM(CASE WHEN d.state = 'blocked'  THEN 1 ELSE 0 END),
               stale    = (SELECT COUNT(*) FROM sandbox.evidence e
                           JOIN sandbox.divergence dd ON dd.divergence_id = e.divergence_id
                           WHERE dd.component_id = c.component_id AND e.is_stale = 1)
      FROM     sandbox.component c
      LEFT     JOIN sandbox.machine m    ON m.machine_id   = c.owner_machine_id
      LEFT     JOIN sandbox.divergence d ON d.component_id = c.component_id
      GROUP BY c.component_id, c.slug, c.state, m.name
      ORDER BY c.slug`)
  ).recordset

  const here = process.env.MACHINE_NAME?.trim() || null
  console.log(`\nthis machine: ${here ?? "(MACHINE_NAME unset — this Sandbox cannot write anywhere)"}\n`)

  const describe = (c) => {
    const bits = [`${c.resolved}/${c.total} resolved`]
    if (c.blocked) bits.push(`${c.blocked} blocked`)
    if (c.stale) bits.push(`${c.stale} stale evidence`)
    return `${c.slug.padEnd(16)} ${c.state.padEnd(11)} ${bits.join(" · ")}`
  }

  for (const m of machines) {
    const owned = components.filter((c) => c.owner === m.name)
    const tags = [m.is_primary ? "primary" : null, here && m.name === here ? "this machine" : null].filter(Boolean)
    console.log(`${m.name}${tags.length ? `  (${tags.join(", ")})` : ""}`)
    if (!owned.length) console.log("    owns nothing")
    for (const c of owned) console.log(`    ${describe(c)}`)
    console.log("")
  }

  const unowned = components.filter((c) => !c.owner)
  if (unowned.length) {
    console.log("unclaimed  (writable by any identified machine)")
    for (const c of unowned) console.log(`    ${describe(c)}`)
    console.log("")
  }

  const transfers = (
    await pool.request().query(`
      SELECT TOP 10 c.slug, f.name AS from_name, t.name AS to_name, ot.note, ot.transferred_at
      FROM   sandbox.ownership_transfer ot
      JOIN   sandbox.component c ON c.component_id = ot.component_id
      LEFT   JOIN sandbox.machine f ON f.machine_id = ot.from_machine_id
      LEFT   JOIN sandbox.machine t ON t.machine_id = ot.to_machine_id
      ORDER  BY ot.transfer_id DESC`)
  ).recordset

  if (transfers.length) {
    console.log("recent ownership changes")
    for (const t of transfers) {
      console.log(`    ${t.transferred_at.toISOString().slice(0, 16).replace("T", " ")}  ${t.slug}: ${t.from_name ?? "(unowned)"} -> ${t.to_name ?? "(unowned)"}`)
      console.log(`        ${t.note}`)
    }
    console.log("")
  }
} catch (error) {
  console.error(`\nCould not read machine state: ${error.message}`)
  console.error("HANDOFF.md still carries each machine's own notes as a fallback.")
  process.exitCode = 1
} finally {
  await pool?.close()
}
