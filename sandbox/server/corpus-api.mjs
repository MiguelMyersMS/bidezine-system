// ═══════════════════════════════════════════════════════════════════════════════════
// The Sandbox app's read path into the corpus — Milestone 5, step 2.
//
// A browser cannot open a TCP connection to Fabric SQL, so the app reads through this
// thin API instead. It runs inside the Vite process (see vite.config.ts) rather than as
// a second server, so `npm --prefix sandbox run dev` stays one command and one process.
// The same handler is mounted on the preview server too, because a dev-only data path
// would mean the production build was never exercised — the exact verification gap
// CLAUDE.md checklist item 15 exists to close.
//
// ── Which credential, and why it matters ────────────────────────────────────────────
// `app_rw`, and nothing else. It is the only principal this file may ever hold. The
// separation is the whole point of the store: `agent_rw` is DENIED on evidence and
// `runner_evidence` may only insert it, so an app that quietly used a stronger identity
// to "just get the data" would dissolve the invariant every other part of the system is
// built on. If a query here is refused, that refusal is the system working — fix the
// grant deliberately in a migration, never by reaching for ADMIN.
//
// ── Offline behaviour (SANDBOX-SPEC §4.2's deferred decision, settled here) ──────────
// Every successful read writes a snapshot to `.corpus-cache.json` (gitignored). When
// Fabric is unreachable the API serves that snapshot, flagged `stale: true` with the
// timestamp it was taken, and the app shows a banner. Degrading to read-only against a
// cached snapshot is what the spec asks for; the banner is the part that matters, since
// a stale read silently presented as live is worse than an outage — it is the same
// false-green failure the whole project exists to prevent.
// ═══════════════════════════════════════════════════════════════════════════════════

import { readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = join(HERE, "..", ".corpus-cache.json")

// Imported lazily: `mssql` and the .env load are Node-only and comparatively slow, and
// a `vite build` that never serves a request should not pay for either.
async function db() {
  const mod = await import("../../verifier/lib/db.mjs")
  return mod
}

/** Components, with their divergence counts. Mirrors what `sandbox_components` returns
 * for agents, so the human surface and the agent surface cannot describe the corpus
 * differently. `[open]` stays bracketed — it is a T-SQL keyword. */
const COMPONENTS_SQL = `
  SELECT c.slug, c.title, c.state,
         COUNT(d.divergence_id)                                        AS divergences,
         SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END)         AS resolved,
         SUM(CASE WHEN d.state <> 'resolved' THEN 1 ELSE 0 END)        AS [open]
  FROM sandbox.component c
  LEFT JOIN sandbox.divergence d ON d.component_id = c.component_id
  GROUP BY c.slug, c.title, c.state
  -- Real occupants first, internal fixtures last. A leading double underscore is already
  -- this codebase's convention for a test fixture (the mcp and verifier suites each create
  -- one, plus the leftover dbg row), and without this ordering the app defaults to
  -- whichever sorts first alphabetically -- a debug row, not the component being worked on.
  -- They are still listed rather than filtered out: the app's view of the corpus should
  -- match the corpus, including the parts that are untidy.
  -- NOTE: no backticks in this comment. It lives inside a JS template literal, where a
  -- backtick would terminate the string and produce a confusing parse error far from here.
  ORDER BY CASE WHEN c.slug LIKE '\\_\\_%' ESCAPE '\\' THEN 1 ELSE 0 END, c.slug`

/**
 * Divergences for one component.
 *
 * `origin_record` is selected deliberately: it holds the entire source object verbatim,
 * so the app can render exactly what the hand-written data file rendered — including
 * fields nobody thought to map into a column. That is also what makes step 4's
 * equivalence check possible: the DB path can be diffed against the TypeScript source
 * field by field, rather than someone eyeballing that the two "look the same".
 */
const DIVERGENCES_SQL = `
  SELECT d.ref_code, d.category, d.origin_category, d.title, d.detail, d.state,
         d.visual, d.origin_record, d.anchor_id, d.anchor_file
  FROM sandbox.divergence d
  JOIN sandbox.component c ON c.component_id = d.component_id
  WHERE c.slug = @slug
  ORDER BY d.divergence_id`

async function readCorpus() {
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const components = (await pool.request().query(COMPONENTS_SQL)).recordset

    const byComponent = {}
    for (const c of components) {
      const rows = (
        await pool.request().input("slug", sql.NVarChar(100), c.slug).query(DIVERGENCES_SQL)
      ).recordset
      byComponent[c.slug] = rows.map((r) => ({
        ref: r.ref_code,
        category: r.category,
        originCategory: r.origin_category,
        title: r.title,
        detail: r.detail,
        state: r.state,
        anchorId: r.anchor_id,
        anchorFile: r.anchor_file,
        // Stored as JSON text; parsed here so the client never has to know that.
        visual: parseJson(r.visual),
        originRecord: parseJson(r.origin_record),
      }))
    }
    return { components, divergences: byComponent, fetchedAt: new Date().toISOString() }
  } finally {
    await pool?.close()
  }
}

function parseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    // A malformed payload is surfaced, not silently dropped — losing `visual` quietly is
    // how a row renders as "complete" while missing the part a human was going to look at.
    return { __unparseable: String(text).slice(0, 200) }
  }
}

/**
 * Reads the corpus, caching on success and falling back to the cache on failure.
 * Never throws for a connection problem: the app is meant to degrade, not disappear.
 */
export async function getCorpus() {
  try {
    const fresh = await readCorpus()
    await writeFile(CACHE_FILE, JSON.stringify(fresh), "utf8").catch(() => {})
    return { ...fresh, stale: false }
  } catch (error) {
    try {
      const cached = JSON.parse(await readFile(CACHE_FILE, "utf8"))
      return { ...cached, stale: true, staleReason: error.message }
    } catch {
      // No connection AND no cache. This one does surface as an error — there is nothing
      // to show, and pretending otherwise would be an empty corpus indistinguishable from
      // a real one with no rows.
      return { error: `Fabric unreachable and no cached snapshot exists: ${error.message}` }
    }
  }
}

/** Vite middleware. Mounted on both the dev and the preview server. */
export function corpusApiMiddleware() {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/corpus")) return next()
    const payload = await getCorpus()
    res.setHeader("Content-Type", "application/json")
    // No caching: the point of reading live is that it is live. Staleness is expressed in
    // the payload's own `stale` flag, never by a browser silently serving an old body.
    res.setHeader("Cache-Control", "no-store")
    res.statusCode = payload.error ? 503 : 200
    res.end(JSON.stringify(payload))
  }
}
