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

import { readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))

// ── the gate's refusal codes, as numbers rather than as prose ───────────────────────
// These are the literal error numbers the procedures THROW: 51001 from
// usp_resolve_divergence when the evidence gate refuses (migration 004), 51006 when
// migration 016's ownership guard refuses. They are the contract between the database and
// this layer — a message is written for a human and may be reworded at any time, a number
// is not. Changing either value means changing the migration that throws it.
const GATE_REFUSED = 51001
const OWNERSHIP_REFUSED = 51006
const STALE_OWNER_REFUSED = 51005
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
         owner = m.name,
         COUNT(d.divergence_id)                                        AS divergences,
         SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END)         AS resolved,
         SUM(CASE WHEN d.state <> 'resolved' THEN 1 ELSE 0 END)        AS [open]
  FROM sandbox.component c
  LEFT JOIN sandbox.machine m ON m.machine_id = c.owner_machine_id
  LEFT JOIN sandbox.divergence d ON d.component_id = c.component_id
  GROUP BY c.slug, c.title, c.state, m.name
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
         d.visual, d.origin_record, d.anchor_id, d.anchor_file,
         -- Migration 018. Both NULL on every row today; the card falls back to
         -- title/detail, which is the normal path rather than a transitional one.
         d.review_label, d.review_prompt, d.relation, d.subject_state,
         blocked_ref = sc.ref_code,
         evidence_total = (SELECT COUNT(*) FROM sandbox.evidence e
                           WHERE e.divergence_id = d.divergence_id),
         evidence_stale = (SELECT COUNT(*) FROM sandbox.evidence e
                           WHERE e.divergence_id = d.divergence_id AND e.is_stale = 1)
  FROM sandbox.divergence d
  JOIN sandbox.component c ON c.component_id = d.component_id
  LEFT JOIN sandbox.system_change sc ON sc.system_change_id = d.blocked_by
  WHERE c.slug = @slug
  ORDER BY d.divergence_id`

/**
 * Every unmet gate requirement, for every divergence of one component, in one round trip.
 *
 * `OUTER APPLY` over the gate's OWN `fn_divergence_unmet` rather than re-deriving the
 * conditions in this file. That choice is the whole point: the card's checklist and the
 * database's refusal have to be the same reading of the same state, and two independent
 * implementations of one rule is the exact defect migration 015's own header cites
 * (`fn_component_owner` exists for the same reason). If the gate changes, this changes
 * with it and nobody has to remember.
 *
 * OUTER, not CROSS: a divergence with nothing unmet must still come back — its absence
 * from the result is what "the gate is open" looks like, and an inner join would silently
 * drop exactly the rows a human is looking for.
 */
const UNMET_SQL = `
  SELECT d.ref_code, u.requirement, u.detail
  FROM   sandbox.divergence d
  JOIN   sandbox.component c ON c.component_id = d.component_id
  OUTER  APPLY sandbox.fn_divergence_unmet(d.divergence_id) u
  WHERE  c.slug = @slug
  ORDER  BY d.divergence_id`

/**
 * The declaration — migration 010's "which elements, which properties, in which state".
 *
 * Read for the whole component at once because the highlight needs it at SELECTION time,
 * and fetching a bundle per card to learn what a row is about would put a Fabric round
 * trip between clicking a card and seeing anything happen. Seven of rail-sidebar's 154
 * rows have one, so this is a small result set that mostly returns nothing.
 */
const SUBJECTS_SQL = `
  SELECT d.ref_code, s.ordinal, s.side, s.anchor_id, s.selector, s.label
  FROM   sandbox.divergence d
  JOIN   sandbox.component c ON c.component_id = d.component_id
  JOIN   sandbox.divergence_subject s ON s.divergence_id = d.divergence_id
  WHERE  c.slug = @slug
  ORDER  BY d.divergence_id, s.ordinal`

/**
 * Migration 020's edges, for the whole component in one round trip.
 *
 * `OUTER APPLY` over the database's OWN `fn_divergence_relations` rather than joining the
 * table directly — the function already returns both directions with the other row's ref,
 * title and state, and re-deriving that here would be a second reading of one rule.
 *
 * A subject and its satellites are not duplicates: `Q1` is the decision, `A-9` the
 * divergence it answers, `R-1` the risk that it be applied correctly, and a risk can carry
 * an open item its divergence does not. The edge is what lets a card say so instead of
 * three cards looking unrelated.
 */
const RELATIONS_SQL = `
  SELECT d.ref_code, rel.direction, rel.kind, rel.other_ref, rel.other_title, rel.other_state, rel.note
  FROM   sandbox.divergence d
  JOIN   sandbox.component c ON c.component_id = d.component_id
  OUTER  APPLY sandbox.fn_divergence_relations(d.divergence_id) rel
  WHERE  c.slug = @slug
  ORDER  BY d.divergence_id`

const PROPERTIES_SQL = `
  SELECT d.ref_code, p.property, p.property_type
  FROM   sandbox.divergence d
  JOIN   sandbox.component c ON c.component_id = d.component_id
  JOIN   sandbox.divergence_property p ON p.divergence_id = d.divergence_id
  WHERE  c.slug = @slug
  ORDER  BY d.divergence_id, p.property`

/**
 * Which refs of a component have a check spec on disk.
 *
 * This is a FILESYSTEM fact, not a database one — the specs live in `verifier/checks/`
 * and are committed to git precisely so a weak one shows up in a diff. It is read here
 * because it is the single most common reason a row cannot move: 147 of rail-sidebar's
 * 154 divergences have no spec, so "nobody wrote a check" and "nobody ran it" are
 * different states with different owners, and a checklist that could not tell them apart
 * would send a human to the wrong place 95% of the time.
 *
 * A ref owns `<ref>.json` and any `<ref>-*.json` variant (`F-2.json`, `F-2-icon.json`).
 * The trailing hyphen in the prefix test is load-bearing: without it `F-2` would claim
 * `F-21.json`.
 *
 * A missing directory is a normal answer (a component nobody has written checks for),
 * not an error — hence the empty set rather than a throw.
 */
async function checkSpecRefs(slug) {
  try {
    const files = await readdir(join(HERE, "..", "..", "verifier", "checks", slug))
    return new Set(
      files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length)),
    )
  } catch {
    return new Set()
  }
}

const hasSpec = (specs, ref) => specs.has(ref) || [...specs].some((s) => s.startsWith(`${ref}-`))

async function readCorpus() {
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const componentRows = (await pool.request().query(COMPONENTS_SQL)).recordset

    // Ownership rides along with the corpus because it is a COMPONENT fact, not a
    // per-divergence one, and every card on screen needs it to decide whether its own
    // approve control can do anything. Fetching a bundle per card to learn one boolean
    // about their shared parent would be 154 round trips for one answer.
    //
    // `mayWrite` mirrors migration 016's fn_component_write_refusal: a nameless caller may
    // not write, an unowned component is writable by anyone, otherwise it must be yours.
    // A courtesy copy — the database refuses independently, and verify-readonly drives
    // that path rather than this one.
    const here = await machineName()
    const components = componentRows.map((c) => ({
      ...c,
      mayWrite: !!here && (!c.owner || c.owner === here),
    }))

    const byComponent = {}
    for (const c of components) {
      const rows = (
        await pool.request().input("slug", sql.NVarChar(100), c.slug).query(DIVERGENCES_SQL)
      ).recordset

      // The gate's own verdict for every row, grouped by ref. A row with no entry here has
      // nothing unmet — see UNMET_SQL on why that must come back as absence, not a gap.
      const unmetRows = (
        await pool.request().input("slug", sql.NVarChar(100), c.slug).query(UNMET_SQL)
      ).recordset
      const unmetByRef = new Map()
      for (const u of unmetRows) {
        if (!u.requirement) continue
        if (!unmetByRef.has(u.ref_code)) unmetByRef.set(u.ref_code, [])
        unmetByRef.get(u.ref_code).push({ requirement: u.requirement, detail: u.detail })
      }

      const groupByRef = (recordset, shape) => {
        const map = new Map()
        for (const r of recordset) {
          if (!map.has(r.ref_code)) map.set(r.ref_code, [])
          map.get(r.ref_code).push(shape(r))
        }
        return map
      }
      const subjectsByRef = groupByRef(
        (await pool.request().input("slug", sql.NVarChar(100), c.slug).query(SUBJECTS_SQL)).recordset,
        (r) => ({ ordinal: r.ordinal, side: r.side, anchorId: r.anchor_id, selector: r.selector, label: r.label }),
      )
      const relationsByRef = groupByRef(
        (await pool.request().input("slug", sql.NVarChar(100), c.slug).query(RELATIONS_SQL)).recordset.filter((r) => r.direction),
        (r) => ({ direction: r.direction, kind: r.kind, ref: r.other_ref, title: r.other_title, state: r.other_state, note: r.note }),
      )
      const propertiesByRef = groupByRef(
        (await pool.request().input("slug", sql.NVarChar(100), c.slug).query(PROPERTIES_SQL)).recordset,
        (r) => ({ property: r.property, type: r.property_type }),
      )

      const specs = await checkSpecRefs(c.slug)

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

        // ── everything below drives the review card (sandbox/REVIEW-CARD-SPEC.md) ──
        reviewLabel: r.review_label,
        reviewPrompt: r.review_prompt,
        blockedRef: r.blocked_ref,
        evidenceTotal: r.evidence_total,
        evidenceStale: r.evidence_stale,
        hasCheckSpec: hasSpec(specs, r.ref_code),
        unmet: unmetByRef.get(r.ref_code) ?? [],
        // Migration 010's declaration. `relation` and `subject_state` complete the
        // sentence the subjects and properties start: these elements, in this state,
        // differ on these properties.
        subjects: subjectsByRef.get(r.ref_code) ?? [],
        properties: propertiesByRef.get(r.ref_code) ?? [],
        relation: r.relation,
        subjectState: r.subject_state,
        // Migration 020. Empty for almost every row: four edges exist, deliberately, and
        // the ten other candidate links sitting in origin_record were NOT imported —
        // "R-3 mentions H-1" and "R-3 is a risk against H-1" are different claims.
        relations: relationsByRef.get(r.ref_code) ?? [],
      }))
    }
    return { components, divergences: byComponent, thisMachine: here, fetchedAt: new Date().toISOString() }
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
    //
    // The aggregate itself lives in `sandbox.fn_component_progress` (migration 017), not
    // here. It used to be written out in this file AND again in `scripts/machines.mjs` —
    // both correct, but correct SEPARATELY, so the next change to what "progress" means
    // would have landed in whichever file was open and left the CLI and the app
    // disagreeing about the same component with nothing failing.
    const components = (await pool.request().query(`SELECT * FROM sandbox.fn_component_progress() ORDER BY slug`)).recordset

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

/**
 * Move a component between machines — the only caller of `usp_transfer_component` outside
 * its own test.
 *
 * ── Why this is here and not an MCP tool ───────────────────────────────────────────
 * Migration 015 DENIES `agent_rw` execute on that procedure, deliberately: an agent that
 * could reassign ownership could bypass every ownership check in migration 016 in two
 * calls, by first making itself the owner. So the transfer surface is `app_rw` only, which
 * means the app, which means here. The absence of an agent-facing tool is the design, not
 * an omission.
 *
 * ── `expectedOwner` is passed through from the caller, never read here ─────────────
 * The procedure's compare-and-swap exists to refuse a caller acting on a STALE reading of
 * who owns this. Looking the current owner up in this function and passing it as
 * `@from_machine` would satisfy the check with a value read microseconds earlier and
 * quietly disable the whole mechanism. So the client sends what it believed — what it had
 * on screen — and the database decides whether that is still true.
 */
export async function transferComponent(slug, expectedOwner, toMachine, note) {
  if (!note?.trim()) return { error: "A transfer needs a stated reason." }
  const { connect, sql } = await db()
  let pool
  try {
    pool = await connect("APP")
    const row = (
      await pool.request().input("slug", sql.NVarChar(100), slug).query(`SELECT component_id FROM sandbox.component WHERE slug = @slug`)
    ).recordset[0]
    if (!row) return { error: `No component ${slug}` }

    const out = (
      await pool
        .request()
        .input("component_id", sql.Int, row.component_id)
        .input("from_machine", sql.NVarChar(50), expectedOwner || null)
        .input("to_machine", sql.NVarChar(50), toMachine || null)
        .input("note", sql.NVarChar(400), note.trim())
        .execute("sandbox.usp_transfer_component")
    ).recordset?.[0]
    return { ok: true, owner: out?.owner, previous: out?.previous }
  } catch (error) {
    // 51005 is the compare-and-swap refusal: the caller's idea of the owner is out of
    // date. Distinguished so the UI can say "re-read and try again" rather than treating
    // it as a malformed request — matched on the number, not the wording, for the same
    // reason `approve` does.
    return { error: error.message, refusedByStaleOwner: error.number === STALE_OWNER_REFUSED }
  } finally {
    await pool?.close()
  }
}

const toComponentSummary = (c) => ({
  slug: c.slug,
  // Sent so the transfer control can pass it straight back as `from`, which is what makes
  // the procedure's compare-and-swap mean anything: the value the database checks against
  // is the one this screen actually displayed, not one re-read at submit time. Omitted at
  // first, which silently labelled every owned component "Claim…" and would have sent
  // `from: undefined` — read by the procedure as "unowned" and refused. Caught by looking
  // at the rendered button, not by the typecheck, which was clean throughout.
  owner: c.owner ?? null,
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
    // The refusal text is passed through verbatim rather than summarised, but the
    // CLASSIFICATION comes from the THROW's error number, never from its wording.
    //
    // An earlier version matched `/Refused:|must name the machine|No machine named/`
    // against the message — i.e. it coupled a real behavioural distinction to migration
    // 016's exact prose, with no test over the coupling. Rewording a message would have
    // silently demoted every ownership refusal to a generic 400, and the argument for why
    // 403 and 409 must stay distinguishable would have quietly stopped being true.
    // Raised by an independent review; `verify-readonly.mjs` now asserts the
    // classification so a reworded message fails a check instead.
    return {
      error: error.message,
      refusedByGate: error.number === GATE_REFUSED,
      refusedByOwnership: error.number === OWNERSHIP_REFUSED,
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

      // The only reachable path to an ownership change. 409 for the compare-and-swap
      // refusal, because that one IS a conflict in the ordinary HTTP sense — someone else
      // moved it — and is retryable after re-reading. A missing note is a 400: the request
      // itself is incomplete.
      const transfer = url.match(/^\/api\/component\/([\w-]+)\/transfer$/)
      if (transfer && req.method === "POST") {
        const body = await readBody(req)
        const payload = await transferComponent(transfer[1], body.from, body.to, body.note)
        return json(payload, payload.error ? (payload.refusedByStaleOwner ? 409 : 400) : 200)
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
