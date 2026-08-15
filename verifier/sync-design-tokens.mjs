// ═══════════════════════════════════════════════════════════════════════════════════
// tokens/ → sandbox.design_token
//
//   node sync-design-tokens.mjs
//
// The gate has to answer "does this token actually exist?" — a question about files on
// disk, which the database cannot see. It could ask its caller, but a gate that trusts its
// caller is not a gate, so the fact is brought into the database and the gate checks it
// itself. Exactly the reasoning, and exactly the shape, of `sync-source-files.mjs`.
//
// Runs as ADMIN, not as the app or the runner, for the same reason that one does: whoever
// can write this table can make an unauthored token look authored, which is the single
// thing `token.authored` (migration 026) exists to prevent.
//
// Run this after any commit that touches `tokens/`. Until it runs, a token that was just
// authored still reads as missing and the gate keeps refusing — correctly, since as far as
// the database knows the file never changed.
//
// ── Names are derived the way the emitter derives them, not guessed ────────────────
// `scripts/build-tokens.mjs` emits `--${name}` for a flat token and joins nested group keys
// with `-`. The walk below reproduces that, and the typography expansion too: one typography
// token becomes five CSS variables (`-font-family`, `-font-size`, `-line-height`,
// `-font-weight`, `-letter-spacing`), so a divergence naming `--label-l-font-size` resolves
// against the token that really produces it rather than being reported missing.
// ═══════════════════════════════════════════════════════════════════════════════════

import { execFileSync } from "node:child_process"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { REPO_ROOT, connect } from "./lib/db.mjs"

const git = (...args) => execFileSync("git", args, { cwd: REPO_ROOT }).toString().trim()
const TOKENS_DIR = join(REPO_ROOT, "tokens")

// One typography token expands into these five variables. Kept beside the walk rather than
// inlined so the coupling to build-tokens.mjs is visible to whoever changes either one.
const TYPOGRAPHY_SUFFIXES = ["font-family", "font-size", "line-height", "font-weight", "letter-spacing"]

/** Every token name a file defines, with the value it carries, keyed as the emitter keys it. */
function collect(json, file, into) {
  const walk = (obj, prefix = []) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("$")) continue
      if (!value || typeof value !== "object") continue
      if ("$value" in value) {
        // Stored as the CSS CUSTOM PROPERTY, `--name`, not the bare token key.
        //
        // This is the one canonical form every consumer already uses: `divergence.visual`'s
        // `afterVar` is `--card`, `divergence_decision.chosen_token` is
        // `--sidebar-rail-surface`, and the emitted stylesheet declares `--card`. Storing the
        // bare key here made `token.authored`'s `t.name = latest.chosen_token` compare
        // `sidebar-rail-surface` against `--sidebar-rail-surface` — never equal, for any
        // token, ever. The requirement was therefore UNSATISFIABLE: authoring the token in
        // tokens/ would not have released the row, and the nine B rows would have stayed
        // blocked with nothing left to do about it.
        //
        // It survived its own test because that test INSERTED a probe row spelled
        // `--sidebar-rail-surface` and watched the gate clear — data in a shape this sync
        // never produces. `db/verify-decision.mjs` now takes its token from this table
        // instead, so the check and the pipeline cannot disagree about the format again.
        const name = `--${[...prefix, key].join("-")}`
        const entry = into.get(name) ?? { files: new Set(), light: null, dark: null }
        // The value is stored for readability in the table, not for comparison: the gate
        // asserts existence only. A token authored with the WRONG value is a different
        // failure, already caught by the check specs measuring the rendered component.
        const rendered = JSON.stringify(value.$value)
        if (file.includes("dark")) entry.dark = rendered
        else entry.light = rendered
        entry.files.add(file)
        into.set(name, entry)

        if (value.$type === "typography") {
          for (const suffix of TYPOGRAPHY_SUFFIXES) {
            const expanded = `${name}-${suffix}`
            const e = into.get(expanded) ?? { files: new Set(), light: null, dark: null }
            e.files.add(file)
            if (file.includes("dark")) e.dark = e.dark ?? "(from typography token)"
            else e.light = e.light ?? "(from typography token)"
            into.set(expanded, e)
          }
        }
      } else {
        walk(value, [...prefix, key])
      }
    }
  }
  walk(json)
}

async function readTokenFiles(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await readTokenFiles(path, found)
    else if (entry.name.endsWith(".tokens.json")) found.push(path)
  }
  return found
}

const files = await readTokenFiles(TOKENS_DIR)
const tokens = new Map()
for (const path of files) {
  const rel = path.slice(REPO_ROOT.length + 1).replace(/\\/g, "/")
  collect(JSON.parse(await readFile(path, "utf8")), rel, tokens)
}

const headSha = git("rev-parse", "HEAD")
console.log(`${files.length} token file(s) → ${tokens.size} token name(s), at ${headSha.slice(0, 8)}`)

let pool
try {
  pool = await connect("ADMIN")

  // Replaced wholesale rather than merged: a token DELETED from tokens/ must disappear here
  // too, or the gate would keep believing in it and keep passing a row whose token no longer
  // resolves. A merge that only ever adds is how a stale registry silently under-gates.
  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request().query(`DELETE FROM sandbox.design_token`)
    for (const [name, entry] of tokens) {
      const req = tx.request()
      req.input("name", name)
      req.input("light", entry.light?.slice(0, 200) ?? null)
      req.input("dark", entry.dark?.slice(0, 200) ?? null)
      req.input("files", [...entry.files].join(", ").slice(0, 400))
      req.input("sha", headSha)
      await req.query(`
        INSERT INTO sandbox.design_token (name, value_light, value_dark, source_files, synced_commit)
        VALUES (@name, @light, @dark, @files, @sha)`)
    }
    await tx.commit()
  } catch (err) {
    await tx.rollback()
    throw err
  }

  const { recordset } = await pool.request().query(`
    SELECT total     = (SELECT COUNT(*) FROM sandbox.design_token),
           lightOnly = (SELECT COUNT(*) FROM sandbox.design_token WHERE value_dark IS NULL),
           blocked   = (SELECT COUNT(DISTINCT dd.divergence_id)
                        FROM   sandbox.divergence_decision dd
                        WHERE  dd.disposition = 'authored'
                          AND  dd.chosen_token IS NOT NULL
                          AND  NOT EXISTS (SELECT 1 FROM sandbox.design_token t
                                           WHERE t.name = dd.chosen_token))`)
  const { total, lightOnly, blocked } = recordset[0]
  console.log(`  ${total} token(s) recorded`)
  console.log(`  ${lightOnly} defined in a light/base file only`)
  console.log(`  ${blocked} divergence(s) currently blocked on token.authored`)
} finally {
  await pool?.close()
}
