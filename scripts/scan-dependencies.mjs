// ═══════════════════════════════════════════════════════════════════════════════════
// Record which design-system paths each divergence actually depends on.
//
//   node scripts/scan-dependencies.mjs [--dry-run]
//
// Feeds M7's invalidation sweep. Without this, landing a change to `src/ui/button.tsx`
// cannot know that F-2's rail-button measurement is now suspect — F-2's anchor lives in
// `sandbox/` and names no `src/ui` path anywhere.
//
// Resolved through the REAL import graph (scripts/lib/dependencies.mjs), not declared by
// hand. A hand-maintained dependency list is a second copy of the imports, and the two
// would drift the first time someone added an import without remembering this file.
//
// Re-run it after any change to what a component imports. Nothing here is clever about
// staleness of its own: a scan is cheap, and the sweep treats an UNSCANNED divergence as
// affected anyway, so being out of date fails safe.
// ═══════════════════════════════════════════════════════════════════════════════════

import { REPO_ROOT, connect, sql } from "../verifier/lib/db.mjs"
import { buildExportMap, resolveDependencies } from "./lib/dependencies.mjs"

const DRY = process.argv.includes("--dry-run")

// Import aliases per anchored area, so `@/` resolves the way that project's own tooling
// resolves it. Keyed by path prefix of the anchor file.
const ALIASES = [
  { prefix: "sandbox/", aliases: { "@/": "sandbox/src/" } },
  { prefix: "site/", aliases: { "@/": "site/src/" } },
  { prefix: "src/", aliases: { "@/": "src/" } },
]

const exportMap = await buildExportMap(REPO_ROOT)
console.log(`export map: ${exportMap.byName.size} names across ${exportMap.wildcards.length} wildcard re-export(s)\n`)

let pool
try {
  pool = await connect("APP")

  const rows = (
    await pool.request().query(`
      SELECT d.divergence_id, d.ref_code, d.anchor_file, c.slug
      FROM   sandbox.divergence d
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  d.anchor_file IS NOT NULL
      ORDER  BY c.slug, d.ref_code`)
  ).recordset

  if (!rows.length) {
    console.log("No divergence carries an anchor_file yet, so nothing can be scanned.")
    console.log("That is not an error — but note the sweep treats unscanned rows as AFFECTED.")
    process.exit(0)
  }

  let totalPaths = 0
  for (const row of rows) {
    const anchorFile = row.anchor_file.replace(/\\/g, "/")
    const match = ALIASES.find((a) => anchorFile.startsWith(a.prefix))
    const deps = await resolveDependencies(REPO_ROOT, anchorFile, exportMap, match?.aliases ?? {})

    const primitives = deps.filter((d) => d.startsWith("src/ui/")).length
    console.log(`  ${row.ref_code.padEnd(9)} ${anchorFile}`)
    console.log(`            ${deps.length} path(s), ${primitives} primitive(s)`)
    totalPaths += deps.length

    if (DRY) continue

    // Replace wholesale rather than merging: an import REMOVED from the component must
    // disappear here too, or the sweep keeps invalidating on a dependency that is gone.
    await pool.request().input("id", sql.Int, row.divergence_id).query(`DELETE FROM sandbox.divergence_dependency WHERE divergence_id = @id`)
    for (const path of deps) {
      await pool
        .request()
        .input("id", sql.Int, row.divergence_id)
        .input("path", sql.NVarChar(400), path)
        .query(`INSERT INTO sandbox.divergence_dependency (divergence_id, path) VALUES (@id, @path)`)
    }
  }

  console.log(`\n${rows.length} divergence(s), ${totalPaths} dependency path(s)${DRY ? " — dry run, nothing written." : " recorded."}`)

  if (!DRY) {
    const unscanned = (
      await pool.request().query(`
        SELECT COUNT(*) AS n FROM sandbox.divergence d
        WHERE NOT EXISTS (SELECT 1 FROM sandbox.divergence_dependency dd WHERE dd.divergence_id = d.divergence_id)`)
    ).recordset[0].n
    // Said plainly rather than left implicit: these are not excluded from sweeps, they are
    // swept unconditionally, which is the safe direction but also the expensive one.
    console.log(`${unscanned} divergence(s) still have no anchor and no dependencies — every sweep treats them as affected.`)
  }
} finally {
  await pool?.close()
}
