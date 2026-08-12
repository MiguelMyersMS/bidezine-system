// ═══════════════════════════════════════════════════════════════════════════════════
// git → sandbox.source_file
//
//   node sync-source-files.mjs
//
// The gate has to answer "is this evidence older than the code it describes?" — a git
// question the database cannot see. It could ask its caller, but a gate that trusts its
// caller is not a gate, so the fact is brought into the database and the gate compares
// timestamps itself.
//
// Runs as ADMIN, not as the runner. The runner's role is deliberately the narrowest in
// the system: it reads, and it appends evidence. Nothing else. Giving it write access to
// the table that decides whether its own evidence is current would hand it the ability
// to make stale measurements look fresh.
//
// Run this after any commit that touches an anchored file, or the gate will keep
// refusing on `evidence.current` — correctly, since as far as it knows the code moved
// after the measurement was taken.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process"
import { REPO_ROOT, connect, sql } from "./lib/db.mjs"

const git = (...args) => execFileSync("git", args, { cwd: REPO_ROOT }).toString().trim()

let pool
try {
  pool = await connect("ADMIN")

  const { recordset: paths } = await pool.request().query(
    `SELECT DISTINCT anchor_file FROM sandbox.divergence WHERE anchor_file IS NOT NULL`,
  )

  if (!paths.length) {
    console.log("No anchored files to sync.")
  }

  let synced = 0
  let missing = 0

  for (const { anchor_file } of paths) {
    let line
    try {
      line = git("log", "-1", "--format=%H|%cI", "--", anchor_file)
    } catch {
      line = ""
    }

    if (!line) {
      // A file with no commit history is either untracked or deleted. Either way the
      // gate should not silently treat evidence about it as current, so say so loudly
      // rather than writing a row that implies the file is fine.
      console.log(`  MISSING  ${anchor_file} — no git history; source_file left untouched`)
      missing++
      continue
    }

    const [sha, iso] = line.split("|")
    await pool
      .request()
      .input("path", sql.NVarChar(400), anchor_file)
      .input("sha", sql.Char(40), sha)
      .input("at", sql.DateTime2, new Date(iso))
      .query(`
        UPDATE sandbox.source_file
           SET last_commit = @sha, last_commit_at = @at, updated_at = SYSUTCDATETIME()
         WHERE path = @path;
        IF @@ROWCOUNT = 0
          INSERT INTO sandbox.source_file (path, last_commit, last_commit_at)
          VALUES (@path, @sha, @at);`)

    console.log(`  ok       ${anchor_file}  ${sha.slice(0, 8)}  ${iso}`)
    synced++
  }

  console.log(`\n${synced} synced, ${missing} without git history.`)
  if (missing) process.exitCode = 1
} catch (err) {
  console.error(`ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
