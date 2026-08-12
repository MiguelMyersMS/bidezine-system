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

// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 6 — the evidence bundle, the gate, and the two human acts.
// ═══════════════════════════════════════════════════════════════════════════════════

/**
 * The commit an approval is recorded against, read SERVER-SIDE and never accepted from
 * the client. `approval.approved_at_commit` is the whole reason an approval means
 * anything later: it says which code was approved. A client-supplied value would let the
 * one field that pins an approval to reality be whatever the caller typed.
 */
async function headCommit() {
  const { execFileSync } = await import("node:child_process")
  const root = join(HERE, "..", "..")
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root }).toString().trim()
}

/** Who is acting. The Sandbox is a local, per-machine tool, so the machine identity in
 * .env IS the person. Prefixed `human:` because `approval` is the one table a person
 * writes to directly — worth being able to tell that apart from any agent id at a glance. */
async function actor() {
  const { loadEnv } = await db()
  loadEnv()
  return `human:${process.env.MACHINE_NAME ?? "unknown-machine"}`
}

/**
 * Which machine this Sandbox is running on — the bare name, matching a row in
 * `sandbox.machine`.
 *
 * Separate from `actor()` rather than parsed back out of it: `actor()` is a display/audit
 * string whose `human:` prefix is deliberate, and the ownership guard compares against
 * `machine.name` exactly. Deriving one from the other by stripping a prefix would couple
 * two things that are allowed to change independently.
 *
 * Returns null rather than a placeholder when MACHINE_NAME is unset. Migration 016's guard
 * refuses a nameless write on purpose, and inventing "unknown-machine" here would turn a
 * clear refusal ("this write must name the machine making it") into a confusing one about
 * a machine that does not exist.
 */
async function machineName() {
  const { loadEnv } = await db()
  loadEnv()
  const name = process.env.MACHINE_NAME?.trim()
  return name || null
}

/**
 * Pulls `expected` and `measured` back out of an evidence row so the widget can show them
 * side by side rather than as a wall of text.
 *
 * M6 asks for deliverables "rendered as what they actually are — measured numbers as
 * expected-vs-actual side by side". The runner already writes both into `raw_output` in a
 * fixed shape; parsing happens here rather than in the browser so the raw text stays the
 * record of truth and the widget cannot quietly reformat it into something friendlier than
 * it is. `raw` is returned alongside, always, for exactly that reason.
 */
function parseEvidence(raw, checkSpec) {
  const expectedFromSpec = checkSpec?.expect ?? null
  const measuredMatch = raw?.match(/measured:\s*(\{[\s\S]*?\})\s*(?:\n\n|$)/)
  let measured = null
  if (measuredMatch) {
    try {
      measured = JSON.parse(measuredMatch[1])
    } catch {
      measured = null
    }
  }
  const artifactMatch = raw?.match(/file:\s*(verifier\/artifacts\/\S+\.png)/)
  return {
    expected: expectedFromSpec,
    measured,
    // The failure lines the runner emits, if any — the reason, not a restatement.
    failures: raw?.includes("FAILURES:") ? raw.split("FAILURES:")[1].trim() : null,
    artifactPath: artifactMatch?.[1] ?? null,
  }
}

/**
 * Every machine, what it owns, and how that work is going — M8's "watch another machine's
 * component progress" (spec §6).
 *
 * Read as `app_rw`, which is a SELECT and nothing more. That is the honest shape of
 * observation: the same connection that renders this view is DENIED the writes it would
 * need to act on it (migration 015's `owner_machine_id` DENY, migration 016's guard), so
 * the read-only-ness is a property of the credential rather than of the component that
 * happens to be rendering.
 *
 * `isThisMachine` is computed HERE, against `.env`, rather than in the browser. The client
 * has no way to know which machine it is running on — it would have to be told, and a
 * value the client is told is a value the client can be wrong about.
 */
export async function getMachines() {
  const { connect } = await db()
  const here = await machineName()
  let pool
  try {
    pool = await connect("APP")
    const machines = (
      await pool.request().query(`
        SELECT m.machine_id, m.name, m.is_primary
        FROM   sandbox.machine m
        ORDER  BY m.is_primary DESC, m.name`)
    ).recordset

    // Components with their progress, joined to their owner. Unowned components are
    // included with a NULL owner rather than dropped: "nobody has claimed this" is a real
    // state a human needs to see, and hiding it would make the switcher's totals disagree
    // with the corpus everyone else is reading.
    const components = (
      await pool.request().query(`
        SELECT   c.slug, c.title, c.state, c.promoted_commit,
                 owner = m.name,
                 total    = COUNT(d.divergence_id),
                 resolved = SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END),
                 blocked  = SUM(CASE WHEN d.state = 'blocked'  THEN 1 ELSE 0 END),
                 stale    = (SELECT COUNT(*) FROM sandbox.evidence e
                             JOIN sandbox.divergence dd ON dd.divergence_id = e.divergence_id
                             WHERE dd.component_id = c.component_id AND e.is_stale = 1)
        FROM     sandbox.component c
        LEFT     JOIN sandbox.machine m    ON m.machine_id   = c.owner_machine_id
        LEFT     JOIN sandbox.divergence d ON d.component_id = c.component_id
        GROUP BY c.component_id, c.slug, c.title, c.state, c.promoted_commit, m.name
        ORDER BY c.slug`)
    ).recordset

    // The audit trail, most recent first. This is what makes "transferring is an audited
    // event" visible to a person rather than only true in a table.
    const transfers = (
      await pool.request().query(`
        SELECT TOP 20 c.slug, f.name AS from_name, t.name AS to_name,
               ot.note, ot.transferred_at, ot.transferred_by
        FROM   sandbox.ownership_transfer ot
        JOIN   sandbox.component c ON c.component_id = ot.component_id
        LEFT   JOIN sandbox.machine f ON f.machine_id = ot.from_machine_id
        LEFT   JOIN sandbox.machine t ON t.machine_id = ot.to_machine_id
        ORDER  BY ot.transfer_id DESC`)
    ).recordset

    return {
      thisMachine: here,
      // Said explicitly rather than inferred from a missing name. A Sandbox with no
      // MACHINE_NAME cannot write anything (migration 016 refuses a nameless write), and
      // that is worth stating in the UI instead of looking like an ordinary observer.
      unidentified: !here,
      machines: machines.map((m) => ({
        name: m.name,
        isPrimary: !!m.is_primary,
        isThisMachine: !!here && m.name === here,
        components: components.filter((c) => c.owner === m.name).map(toComponentSummary),
      })),
      unowned: components.filter((c) => !c.owner).map(toComponentSummary),
      transfers: transfers.map((t) => ({
        slug: t.slug,
        from: t.from_name,
        to: t.to_name,
        note: t.note,
        at: t.transferred_at,
        by: t.transferred_by,
      })),
    }
  } catch (error) {
    return { error: error.message }
  } finally {
    await pool?.close()
  }
}

const toComponentSummary = (c) => ({
  slug: c.slug,
  title: c.title,
  state: c.state,
  promotedCommit: c.promoted_commit,
  total: c.total,
  resolved: c.resolved,
  blocked: c.blocked,
  stale: c.stale,
})

/** Everything needed to decide one divergence, in one round trip. */
export async function getDivergenceBundle(slug, ref) {
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const idRow = (
      await pool
        .request()
        .input("slug", sql.NVarChar(100), slug)
        .input("ref", sql.NVarChar(20), ref)
        .query(`SELECT d.divergence_id, d.state, d.anchor_id, d.anchor_file, d.reopened_count,
                       d.subject_state, d.relation,
                       d.title, d.detail, d.category, d.origin_category, d.origin_record, d.visual
                FROM sandbox.divergence d
                JOIN sandbox.component c ON c.component_id = d.component_id
                WHERE c.slug = @slug AND d.ref_code = @ref`)
    ).recordset[0]
    if (!idRow) return { error: `No divergence ${slug}/${ref}` }
    const id = idRow.divergence_id

    const evidence = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT evidence_id, kind, check_spec, raw_output, passed, is_stale,
                verified_at_commit, verified_at_commit_at, run_id, artifact_hash, created_at
         FROM sandbox.evidence WHERE divergence_id = @id ORDER BY evidence_id DESC`,
      )
    ).recordset

    const reviews = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT r.review_id, r.author_agent_id, r.builder_agent_id, r.verdict, r.claim,
                r.reviewed_at_commit, r.created_at,
                (SELECT STRING_AGG(CAST(rc.evidence_id AS NVARCHAR(20)), ',')
                 FROM sandbox.review_citation rc WHERE rc.review_id = r.review_id) AS cites
         FROM sandbox.review r WHERE r.divergence_id = @id ORDER BY r.review_id DESC`,
      )
    ).recordset

    const approvals = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT approval_id, approved_by, approved_at_commit, note, created_at
         FROM sandbox.approval WHERE divergence_id = @id ORDER BY approval_id DESC`,
      )
    ).recordset

    const falseCompletions = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT false_completion_id, requirement_type, reason, discovered_by, created_at
         FROM sandbox.false_completion WHERE divergence_id = @id ORDER BY false_completion_id DESC`,
      )
    ).recordset

    // ── What this divergence is ABOUT (migration 010) ──────────────────────────────
    // Subjects and properties are what let the widget stop saying "here is a paragraph"
    // and start saying "this element, this property, this state". Read alongside the
    // bundle rather than on demand: the whole point is that they arrive with the thing a
    // person is trying to decide, not one interaction later.
    const subjects = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT ordinal, side, anchor_id, selector, label
         FROM sandbox.divergence_subject WHERE divergence_id = @id ORDER BY ordinal`,
      )
    ).recordset

    const properties = (
      await pool.request().input("id", sql.Int, id).query(
        `SELECT property, property_type
         FROM sandbox.divergence_property WHERE divergence_id = @id ORDER BY property`,
      )
    ).recordset

    // The gate is COMPUTED, never stored and never inferred here. Asking the database what
    // is unmet — rather than reimplementing its rules in JavaScript — is what keeps the UI
    // incapable of disagreeing with the thing that actually enforces the transition.
    // The parameter name must match the procedure's own (@divergence_id) — `.execute()`
    // binds by name, not by position, so a differently-named input is simply not supplied.
    const unmet = (
      await pool.request().input("divergence_id", sql.Int, id).execute("sandbox.usp_divergence_gate_status")
    ).recordset

    const here = await machineName()
    const ownerRow = (
      await pool.request().input("slug", sql.NVarChar(100), slug).query(`
        SELECT o.owner_name, o.is_owned
        FROM   sandbox.component c
        CROSS  APPLY sandbox.fn_component_owner(c.component_id) o
        WHERE  c.slug = @slug`)
    ).recordset[0]

    const ownership = {
      thisMachine: here,
      owner: ownerRow?.owner_name ?? null,
      // Mirrors migration 016's fn_component_write_refusal exactly: a nameless caller may
      // not write, an unowned component is writable by anyone, otherwise it must be yours.
      // This is a courtesy copy for the UI — the database refuses independently, and the
      // suite drives that path rather than this one.
      mayWrite: !!here && (!ownerRow?.is_owned || ownerRow.owner_name === here),
    }

    return {
      divergence: {
        ref,
        id,
        state: idRow.state,
        title: idRow.title,
        detail: idRow.detail,
        category: idRow.category,
        originCategory: idRow.origin_category,
        anchorId: idRow.anchor_id,
        anchorFile: idRow.anchor_file,
        reopenedCount: idRow.reopened_count,
        visual: parseJson(idRow.visual),
        originRecord: parseJson(idRow.origin_record),
      },
      declaration: {
        subjects: subjects.map((s) => ({
          ordinal: s.ordinal,
          side: s.side,
          anchorId: s.anchor_id,
          selector: s.selector,
          label: s.label,
        })),
        properties: properties.map((p) => ({ property: p.property, type: p.property_type })),
        state: idRow.subject_state,
        relation: idRow.relation,
      },
      gate: { ready: unmet.length === 0, unmet },
      // Ownership travels with the bundle so the widget can say WHY it will not let you
      // approve, in the same round trip that told it the gate is clean. Fetching it
      // separately would leave a window where the gate reads ready and ownership has not
      // arrived — and an Approve button that is briefly enabled for a component you do not
      // own is exactly the "every control stays live" failure the bundle-clearing comment
      // above already records once.
      //
      // `mayWrite` is computed on the server, from `.env`, for the same reason
      // `isThisMachine` is: the browser cannot know which machine it is.
      ownership,
      evidence: evidence.map((e) => {
        const spec = parseJson(e.check_spec)
        return {
          id: Number(e.evidence_id),
          kind: e.kind,
          passed: !!e.passed,
          stale: !!e.is_stale,
          commit: e.verified_at_commit,
          commitAt: e.verified_at_commit_at,
          runId: e.run_id,
          artifactHash: e.artifact_hash,
          createdAt: e.created_at,
          spec,
          raw: e.raw_output,
          ...parseEvidence(e.raw_output, spec),
        }
      }),
      reviews: reviews.map((r) => ({
        id: r.review_id,
        author: r.author_agent_id,
        builder: r.builder_agent_id,
        verdict: r.verdict,
        claim: r.claim,
        commit: r.reviewed_at_commit,
        createdAt: r.created_at,
        cites: (r.cites ?? "").split(",").filter(Boolean).map(Number),
      })),
      approvals,
      falseCompletions,
      headCommit: await headCommit(),
    }
  } finally {
    await pool?.close()
  }
}

/**
 * The toggle. Calls the gate procedure and nothing else.
 *
 * `app_rw` is DENIED `UPDATE` on `divergence.state` (migration 002), so this procedure is
 * the only path that exists — the button is not "disabled in the UI", it is incapable of
 * succeeding until the gate is clean. A refusal comes back with the full unmet list,
 * because a gate that says only "no" teaches the caller nothing.
 */
export async function approve(slug, ref, note) {
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const row = (
      await pool
        .request()
        .input("slug", sql.NVarChar(100), slug)
        .input("ref", sql.NVarChar(20), ref)
        .query(`SELECT d.divergence_id FROM sandbox.divergence d
                JOIN sandbox.component c ON c.component_id = d.component_id
                WHERE c.slug = @slug AND d.ref_code = @ref`)
    ).recordset[0]
    if (!row) return { error: `No divergence ${slug}/${ref}` }

    const by = await actor()
    const commit = await headCommit()
    await pool
      .request()
      .input("divergence_id", sql.Int, row.divergence_id)
      .input("approved_by", sql.NVarChar(100), by)
      .input("commit_sha", sql.Char(40), commit)
      .input("machine", sql.NVarChar(50), await machineName())
      .input("note", sql.NVarChar(sql.MAX), note || null)
      .execute("sandbox.usp_resolve_divergence")
    return { ok: true, approvedBy: by, commit }
  } catch (error) {
    // The gate's own refusal text, passed through verbatim rather than summarised. Two
    // distinct refusals can arrive here now — the evidence gate and migration 016's
    // ownership guard — and they are flagged separately because they call for completely
    // different responses: go and produce evidence, versus this is not your component.
    return {
      error: error.message,
      refusedByGate: /Gate refused/.test(error.message),
      refusedByOwnership: /Refused:|must name the machine|No machine named/.test(error.message),
    }
  } finally {
    await pool?.close()
  }
}

/**
 * Reopen. Requires a reason, and writes the false_completion row.
 *
 * That record is the highest-signal data the system produces (spec §5.1): it attaches to
 * the REQUIREMENT TYPE that was falsely passed, so M9's ranked list of which requirements
 * get falsified most often is the work queue for turning prose rules into executable ones.
 * Reopening without a reason would produce a row that cannot feed that list, which is why
 * the reason is required here and NOT NULL in the schema.
 */
export async function reopen(slug, ref, requirementType, reason) {
  if (!reason?.trim()) return { error: "A reason is required to reopen." }
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const row = (
      await pool
        .request()
        .input("slug", sql.NVarChar(100), slug)
        .input("ref", sql.NVarChar(20), ref)
        .query(`SELECT d.divergence_id FROM sandbox.divergence d
                JOIN sandbox.component c ON c.component_id = d.component_id
                WHERE c.slug = @slug AND d.ref_code = @ref`)
    ).recordset[0]
    if (!row) return { error: `No divergence ${slug}/${ref}` }

    const by = await actor()
    await pool
      .request()
      .input("divergence_id", sql.Int, row.divergence_id)
      .input("requirement_type", sql.NVarChar(50), requirementType || "unspecified")
      .input("reason", sql.NVarChar(sql.MAX), reason.trim())
      .input("discovered_by", sql.NVarChar(100), by)
      .execute("sandbox.usp_reopen_divergence")
    return { ok: true, discoveredBy: by }
  } catch (error) {
    return { error: error.message }
  } finally {
    await pool?.close()
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ""
    req.on("data", (c) => (data += c))
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"))
      } catch {
        resolve({})
      }
    })
  })
}

/** Vite middleware. Mounted on both the dev and the preview server. */
export function corpusApiMiddleware() {
  return async (req, res, next) => {
    const url = req.url ?? ""
    if (!url.startsWith("/api/")) return next()

    const json = (payload, status = 200) => {
      res.setHeader("Content-Type", "application/json")
      // No caching: the point of reading live is that it is live. Staleness is expressed in
      // the payload's own `stale` flag, never by a browser silently serving an old body.
      res.setHeader("Cache-Control", "no-store")
      res.statusCode = status
      res.end(JSON.stringify(payload))
    }

    try {
      if (url.startsWith("/api/corpus")) {
        const payload = await getCorpus()
        return json(payload, payload.error ? 503 : 200)
      }

      if (url.startsWith("/api/machines")) {
        const payload = await getMachines()
        return json(payload, payload.error ? 503 : 200)
      }

      // Screenshot artifacts, served adjacent to their evidence rather than linked away.
      const artifact = url.match(/^\/api\/artifact\/([\w.\-]+\.png)$/)
      if (artifact) {
        const { readFile } = await import("node:fs/promises")
        const file = join(HERE, "..", "..", "verifier", "artifacts", artifact[1])
        try {
          const png = await readFile(file)
          res.setHeader("Content-Type", "image/png")
          res.setHeader("Cache-Control", "no-store")
          res.statusCode = 200
          return res.end(png)
        } catch {
          return json({ error: "artifact not found" }, 404)
        }
      }

      const bundle = url.match(/^\/api\/divergence\/([\w-]+)\/([\w.-]+)$/)
      if (bundle && req.method === "GET") {
        const payload = await getDivergenceBundle(bundle[1], decodeURIComponent(bundle[2]))
        return json(payload, payload.error ? 404 : 200)
      }

      const act = url.match(/^\/api\/divergence\/([\w-]+)\/([\w.-]+)\/(approve|reopen)$/)
      if (act && req.method === "POST") {
        const body = await readBody(req)
        const [, slug, ref, verb] = act
        const payload =
          verb === "approve"
            ? await approve(slug, decodeURIComponent(ref), body.note)
            : await reopen(slug, decodeURIComponent(ref), body.requirementType, body.reason)
        // A gate refusal is 409, not 500: the request was well-formed and the system
        // deliberately declined it. Conflating the two would make a working invariant look
        // like a bug.
        //
        // An ownership refusal is 403, and separately from 409 on purpose: 409 means "come
        // back when the evidence is there", 403 means "this is not yours and no amount of
        // evidence changes that". A UI that showed both as the same refusal would invite
        // someone to go and produce evidence for a component they cannot write to.
        const status = payload.error ? (payload.refusedByOwnership ? 403 : payload.refusedByGate ? 409 : 400) : 200
        return json(payload, status)
      }

      return json({ error: "unknown endpoint" }, 404)
    } catch (error) {
      return json({ error: error.message }, 500)
    }
  }
}
