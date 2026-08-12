// ═══════════════════════════════════════════════════════════════════════════════════
// Sandbox MCP server — Milestone 3.
//
// What agents use to reach the corpus. Standard MCP over stdio, so it works identically
// in Claude Code (.mcp.json) and GitHub Copilot (.vscode/mcp.json) — one server, both
// clients. Nothing here is Claude-specific.
//
// The problem it solves (SANDBOX-SPEC.md P4): institutional knowledge currently lives in
// a ~15,000-word CLAUDE.md that every session pays for in full, most of it irrelevant to
// the task at hand. Storing decisions was never the hard part. Getting the RIGHT three
// into context at the moment they matter is. `sandbox_decisions` is that: ask what this
// project has already decided about scroll gutters and get three rows, not fifteen
// thousand words.
//
// CONNECTS AS agent_rw, ALWAYS. That role cannot insert evidence, cannot set state, and
// cannot approve — enforced by database permissions, not by this file's good intentions
// (db/migrations/002, proven live by db/verify-invariant.mjs). If a tool here ever needs
// more power than agent_rw has, that is a signal the design is wrong, not a reason to
// hand the server a stronger credential.
// ═══════════════════════════════════════════════════════════════════════════════════

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import mssql from "mssql"
import { z } from "zod"

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
process.loadEnvFile(join(REPO_ROOT, ".env"))

let pool
async function db() {
  if (pool?.connected) return pool
  pool = await mssql.connect({
    server: process.env.FABRIC_SQL_SERVER.split(",")[0],
    port: 1433,
    database: process.env.FABRIC_SQL_DATABASE,
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId: process.env.FABRIC_AGENT_CLIENT_ID,
        clientSecret: process.env.FABRIC_AGENT_CLIENT_SECRET,
        tenantId: process.env.FABRIC_TENANT_ID,
      },
    },
    options: { encrypt: true, trustServerCertificate: false },
    connectionTimeout: 60_000,
  })
  return pool
}

const text = (s) => ({ content: [{ type: "text", text: s }] })
const json = (v) => text(JSON.stringify(v, null, 2))

// A refusal is information, not an accident. Return the database's own words so the
// agent learns what it may not do, rather than seeing a generic failure.
const guard = (fn) => async (args) => {
  try {
    return await fn(args)
  } catch (err) {
    return text(`REFUSED OR FAILED\n\n${err.message}\n\nIf this is a permission error, it is the system working as designed. Do not look for another credential; change what you are attempting.`)
  }
}

const server = new McpServer({ name: "bidezine-sandbox", version: "0.1.0" })

// ── retrieval — the reason this server exists ───────────────────────────────────────

server.registerTool(
  "sandbox_decisions",
  {
    title: "Search resolved decisions",
    description:
      "Search what this project has ALREADY DECIDED, so you reuse a precedent instead of inventing an answer. " +
      "Call this BEFORE proposing any value — a colour, a size, a spacing, a duration, an icon, a token. " +
      "bidezine's rule is that an origin's number or an invented-but-plausible value is as much an unforced " +
      "divergence as a hand-rolled component; the first check is always whether a precedent exists. " +
      "Filter by category for the tightest results, or pass a keyword to search titles and rationale.",
    inputSchema: {
      category: z
        .string()
        .optional()
        .describe("One of the fixed categories — call sandbox_categories for the list."),
      keyword: z.string().optional().describe("Substring matched against title and rationale."),
      limit: z.number().int().min(1).max(50).optional().describe("Default 10."),
    },
  },
  guard(async ({ category, keyword, limit = 10 }) => {
    const p = await db()
    // TRUNCATED ON PURPOSE. Rationale on a real row runs to thousands of words — the
    // Rail Sidebar corpus has single entries longer than most source files. Returning
    // full detail for ten hits costs more context than the CLAUDE.md section this tool
    // exists to replace, which would defeat the entire point of it. Found by using it:
    // three rows for "scrollbar" flooded a live session.
    //
    // So this is a SEARCH INDEX. Scan the excerpts, pick the one that matters, then call
    // sandbox_divergence for its full reasoning. One deep read beats ten shallow ones.
    const r = await p
      .request()
      .input("category", mssql.NVarChar(30), category ?? null)
      .input("keyword", mssql.NVarChar(200), keyword ? `%${keyword}%` : null)
      .input("limit", mssql.Int, limit)
      .query(`
        SELECT TOP (@limit)
               c.slug AS component, d.ref_code, d.category, d.state,
               LEFT(d.title, 180)  AS title,
               LEFT(d.detail, 320) AS detail_excerpt,
               LEN(d.detail)       AS detail_length,
               d.origin_category, d.updated_at
        FROM   sandbox.divergence d
        JOIN   sandbox.component c ON c.component_id = d.component_id
        WHERE  d.state IN ('resolved','deferred','legacy_unverified')
          AND  (@category IS NULL OR d.category = @category)
          AND  (@keyword  IS NULL OR d.title LIKE @keyword OR d.detail LIKE @keyword)
        ORDER BY CASE d.state WHEN 'resolved' THEN 0 WHEN 'deferred' THEN 1 ELSE 2 END,
                 d.updated_at DESC`)

    if (!r.recordset.length) {
      return text(
        `No prior decisions match${category ? ` in category "${category}"` : ""}${keyword ? ` for "${keyword}"` : ""}.\n\n` +
          `That means there is no precedent to reuse. Say so explicitly when you propose a value, and expect to justify it — ` +
          `an absence of precedent is a reason to ask, not a licence to invent.`,
      )
    }
    return json({
      matches: r.recordset,
      next: "These are EXCERPTS. Call sandbox_divergence with a component + ref_code for the full rationale of whichever one is actually relevant — do not assume the excerpt is the whole decision.",
    })
  }),
)

server.registerTool(
  "sandbox_categories",
  {
    title: "List divergence categories",
    description:
      "The fixed category enum. Categories are the retrieval key for the whole corpus — free-form values " +
      "would fragment it and break precedent lookup, so adding one is a database migration, not a choice " +
      "made at call time. Use an existing category even if the fit is imperfect.",
    inputSchema: {},
  },
  guard(async () => {
    const p = await db()
    const r = await p
      .request()
      .query("SELECT category, description FROM sandbox.divergence_category ORDER BY sort_order")
    return json(r.recordset)
  }),
)

// ── state ───────────────────────────────────────────────────────────────────────────

server.registerTool(
  "sandbox_components",
  {
    title: "List Sandbox components",
    description:
      "Every component in the Sandbox with its pipeline state, owning machine and divergence counts. " +
      "One component belongs to exactly one machine at a time; other machines are read-only observers. " +
      "Do not work on a component owned by another machine.",
    inputSchema: {},
  },
  guard(async () => {
    const p = await db()
    const r = await p.request().query(`
      SELECT c.slug, c.title, c.state, m.name AS owner_machine,
             COUNT(d.divergence_id) AS divergences,
             SUM(CASE WHEN d.state = 'resolved' THEN 1 ELSE 0 END) AS resolved,
             -- [open] must be bracketed: OPEN is T-SQL's cursor keyword and an
             -- unquoted alias is a syntax error.
             SUM(CASE WHEN d.state NOT IN ('resolved','deferred') THEN 1 ELSE 0 END) AS [open]
      FROM   sandbox.component c
      LEFT JOIN sandbox.machine m   ON m.machine_id = c.owner_machine_id
      LEFT JOIN sandbox.divergence d ON d.component_id = c.component_id
      GROUP BY c.slug, c.title, c.state, m.name
      ORDER BY c.slug`)
    return json(r.recordset)
  }),
)

server.registerTool(
  "sandbox_divergence",
  {
    title: "Read one divergence in full",
    description:
      "Everything known about a divergence: its rationale, every evidence row with the raw measured output, " +
      "every review and what it cited, and the gate's current unmet requirements. Read this before claiming " +
      "anything about the divergence's status — the gate's list is the authority, not the state field.",
    inputSchema: {
      component: z.string().describe("Component slug, e.g. rail-sidebar"),
      ref_code: z.string().describe("Divergence ref, e.g. L-34"),
    },
  },
  guard(async ({ component, ref_code }) => {
    const p = await db()
    const base = await p
      .request()
      .input("slug", mssql.NVarChar(100), component)
      .input("ref", mssql.NVarChar(20), ref_code)
      .query(`
        SELECT d.divergence_id, c.slug AS component, d.ref_code, d.category, d.title, d.detail,
               d.state, d.scope, d.tier, d.tier_justification, d.anchor_id, d.anchor_file,
               d.deferred_owner, d.reopened_count
        FROM   sandbox.divergence d
        JOIN   sandbox.component c ON c.component_id = d.component_id
        WHERE  c.slug = @slug AND d.ref_code = @ref`)

    if (!base.recordset.length) return text(`No divergence ${component}/${ref_code}.`)
    const d = base.recordset[0]
    const id = d.divergence_id

    const [evidence, reviews, unmet] = await Promise.all([
      p.request().query(`
        SELECT evidence_id, kind, passed, is_stale, verified_at_commit, created_by, created_at,
               LEFT(raw_output, 1200) AS raw_output
        FROM sandbox.evidence WHERE divergence_id = ${id} ORDER BY evidence_id DESC`),
      p.request().query(`
        SELECT r.review_id, r.author_agent_id, r.builder_agent_id, r.verdict, r.claim,
               (SELECT STRING_AGG(CAST(rc.evidence_id AS NVARCHAR(20)), ',')
                FROM sandbox.review_citation rc WHERE rc.review_id = r.review_id) AS cites
        FROM sandbox.review r WHERE r.divergence_id = ${id} ORDER BY r.review_id DESC`),
      p.request().query(`SELECT requirement, detail FROM sandbox.fn_divergence_unmet(${id})`),
    ])

    return json({
      divergence: d,
      gate: unmet.recordset.length
        ? { ready: false, unmet: unmet.recordset }
        : { ready: true, note: "All requirements met. A human still has to approve it." },
      evidence: evidence.recordset,
      reviews: reviews.recordset,
    })
  }),
)

server.registerTool(
  "sandbox_gate",
  {
    title: "Ask the gate what is missing",
    description:
      "The list of unmet requirements standing between this divergence and 'resolved'. Empty means ready. " +
      "TREAT THE LIST AS YOUR TO-DO LIST — it is generated by the thing that will refuse you, so it is the " +
      "only reliable answer to 'what is left'. Never conclude work is done without checking this.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string(),
    },
  },
  guard(async ({ component, ref_code }) => {
    const p = await db()
    const r = await p
      .request()
      .input("slug", mssql.NVarChar(100), component)
      .input("ref", mssql.NVarChar(20), ref_code)
      .query(`
        SELECT u.requirement, u.detail
        FROM   sandbox.divergence d
        JOIN   sandbox.component c ON c.component_id = d.component_id
        CROSS APPLY sandbox.fn_divergence_unmet(d.divergence_id) u
        WHERE  c.slug = @slug AND d.ref_code = @ref`)
    return r.recordset.length
      ? json({ ready: false, unmet: r.recordset })
      : text("Ready. Every requirement is met. A human still has to approve it — you cannot.")
  }),
)

// ── proposals — what an agent may actually write ────────────────────────────────────

server.registerTool(
  "sandbox_propose_divergence",
  {
    title: "Propose a divergence",
    description:
      "File a new divergence. Search sandbox_decisions FIRST and cite any precedent in the detail. " +
      "SCOPE IS NOT YOUR JUDGEMENT CALL: if the fix touches tokens/ or src/ui/ it is system-scoped and must " +
      "be filed as a system change instead — those never take the fast lane, because their blast radius " +
      "exceeds the component that found them. anchor_id is the data-divergence attribute in the markup; " +
      "without it the verifier has nothing to measure.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string().describe("Unique within the component, e.g. L-52"),
      category: z.string(),
      title: z.string(),
      detail: z.string().describe("Rationale, and any precedent you found, cited by ref_code."),
      anchor_id: z.string().optional(),
      anchor_file: z.string().optional().describe("Repo-relative path holding the anchor."),
    },
  },
  guard(async ({ component, ref_code, category, title, detail, anchor_id, anchor_file }) => {
    const p = await db()
    const r = await p
      .request()
      .input("slug", mssql.NVarChar(100), component)
      .input("ref", mssql.NVarChar(20), ref_code)
      .input("category", mssql.NVarChar(30), category)
      .input("title", mssql.NVarChar(400), title)
      .input("detail", mssql.NVarChar(mssql.MAX), detail)
      .input("anchor_id", mssql.NVarChar(50), anchor_id ?? null)
      .input("anchor_file", mssql.NVarChar(400), anchor_file ?? null)
      .query(`
        INSERT INTO sandbox.divergence
          (component_id, ref_code, category, title, detail, state, anchor_id, anchor_file)
        SELECT component_id, @ref, @category, @title, @detail, 'proposed', @anchor_id, @anchor_file
        FROM   sandbox.component WHERE slug = @slug;
        SELECT @@ROWCOUNT AS inserted;`)
    return r.recordset[0]?.inserted
      ? text(`Filed ${component}/${ref_code} as 'proposed'. Next: implement it, then have the verifier measure it — you cannot write evidence yourself.`)
      : text(`No component "${component}". Nothing was filed.`)
  }),
)

server.registerTool(
  "sandbox_update_divergence",
  {
    title: "Revise a divergence",
    description:
      "Update the rationale, category or anchor of an existing divergence. You CANNOT change its state — " +
      "state moves only through the gate, which is a database permission and not a rule you can talk your " +
      "way around. Use this to record what you learned, not to declare progress.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string(),
      title: z.string().optional(),
      detail: z.string().optional(),
      category: z.string().optional(),
      anchor_id: z.string().optional(),
      anchor_file: z.string().optional(),
    },
  },
  guard(async (a) => {
    const p = await db()
    const r = await p
      .request()
      .input("slug", mssql.NVarChar(100), a.component)
      .input("ref", mssql.NVarChar(20), a.ref_code)
      .input("title", mssql.NVarChar(400), a.title ?? null)
      .input("detail", mssql.NVarChar(mssql.MAX), a.detail ?? null)
      .input("category", mssql.NVarChar(30), a.category ?? null)
      .input("anchor_id", mssql.NVarChar(50), a.anchor_id ?? null)
      .input("anchor_file", mssql.NVarChar(400), a.anchor_file ?? null)
      .query(`
        UPDATE d SET
          title       = COALESCE(@title, d.title),
          detail      = COALESCE(@detail, d.detail),
          category    = COALESCE(@category, d.category),
          anchor_id   = COALESCE(@anchor_id, d.anchor_id),
          anchor_file = COALESCE(@anchor_file, d.anchor_file),
          updated_at  = SYSUTCDATETIME()
        FROM sandbox.divergence d
        JOIN sandbox.component c ON c.component_id = d.component_id
        WHERE c.slug = @slug AND d.ref_code = @ref;
        SELECT @@ROWCOUNT AS updated;`)
    return text(r.recordset[0]?.updated ? "Updated." : "No such divergence; nothing changed.")
  }),
)

server.registerTool(
  "sandbox_submit_review",
  {
    title: "Submit an independent review",
    description:
      "Record a verdict on someone else's work. Two things are enforced by the database, not by convention: " +
      "you cannot review your own build (author and builder must differ), and a 'pass' must CITE EVIDENCE by " +
      "id — a verdict citing a failing or stale row is refused by its own citations. " +
      "Review by trying to REFUTE the work, not to confirm it. Default to 'fail' when uncertain: a wrong " +
      "'fail' costs one more round trip, a wrong 'pass' ships a defect wearing a green tick.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string(),
      author_agent_id: z.string().describe("You. Must differ from builder_agent_id."),
      builder_agent_id: z.string().describe("Whoever did the work."),
      verdict: z.enum(["pass", "fail"]),
      claim: z.string().describe("The specific thing you checked and what you found."),
      reviewed_at_commit: z.string().length(40),
      // evidence_id is a BIGINT, which the driver hands back as a STRING. An agent that
      // reads ids from sandbox_divergence and cites them back would be rejected outright
      // if this only accepted numbers — the server must accept what it itself emits.
      cites: z
        .array(z.union([z.number().int(), z.string().regex(/^\d+$/)]))
        .describe("evidence_id values supporting the verdict. Numbers or numeric strings."),
    },
  },
  guard(async (a) => {
    if (a.verdict === "pass" && !a.cites?.length) {
      return text("A passing review must cite at least one evidence row. Read them with sandbox_divergence first.")
    }
    const p = await db()
    const r = await p
      .request()
      .input("slug", mssql.NVarChar(100), a.component)
      .input("ref", mssql.NVarChar(20), a.ref_code)
      .input("author", mssql.NVarChar(100), a.author_agent_id)
      .input("builder", mssql.NVarChar(100), a.builder_agent_id)
      .input("verdict", mssql.NVarChar(10), a.verdict)
      .input("claim", mssql.NVarChar(mssql.MAX), a.claim)
      .input("commit", mssql.Char(40), a.reviewed_at_commit)
      .query(`
        DECLARE @did INT = (SELECT d.divergence_id FROM sandbox.divergence d
                            JOIN sandbox.component c ON c.component_id = d.component_id
                            WHERE c.slug = @slug AND d.ref_code = @ref);
        IF @did IS NULL THROW 52000, 'No such divergence.', 1;
        INSERT INTO sandbox.review
          (divergence_id, author_agent_id, builder_agent_id, verdict, claim, reviewed_at_commit)
        VALUES (@did, @author, @builder, @verdict, @claim, @commit);
        SELECT SCOPE_IDENTITY() AS review_id;`)

    const reviewId = r.recordset[0].review_id
    for (const evidenceId of a.cites ?? []) {
      await p
        .request()
        .input("r", mssql.Int, reviewId)
        .input("e", mssql.BigInt, String(evidenceId))
        .query("INSERT INTO sandbox.review_citation (review_id, evidence_id) VALUES (@r, @e)")
    }
    return text(`Review ${reviewId} recorded (${a.verdict}), citing ${a.cites?.length ?? 0} evidence row(s).`)
  }),
)

server.registerTool(
  "sandbox_reopen",
  {
    title: "Reopen work that was not actually done",
    description:
      "Use this the moment you find that something marked resolved was never really finished. You do not " +
      "need permission and you should not wait — a discovery that earlier work was falsely green is the most " +
      "valuable thing you can produce here, and quietly fixing it instead destroys that signal. " +
      "requirement_type names WHICH requirement was falsely passed (e.g. evidence.present, review.present); " +
      "the ranked list of most-falsified requirements is what decides which prose rules become executable " +
      "checks. Reopening cascades: the component drops out of 'promoted' too.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string(),
      requirement_type: z.string(),
      reason: z.string(),
      discovered_by: z.string(),
    },
  },
  guard(async (a) => {
    const p = await db()
    await p
      .request()
      .input("slug", mssql.NVarChar(100), a.component)
      .input("ref", mssql.NVarChar(20), a.ref_code)
      .input("rt", mssql.NVarChar(50), a.requirement_type)
      .input("reason", mssql.NVarChar(mssql.MAX), a.reason)
      .input("by", mssql.NVarChar(100), a.discovered_by)
      .query(`
        DECLARE @did INT = (SELECT d.divergence_id FROM sandbox.divergence d
                            JOIN sandbox.component c ON c.component_id = d.component_id
                            WHERE c.slug = @slug AND d.ref_code = @ref);
        IF @did IS NULL THROW 52001, 'No such divergence.', 1;
        EXEC sandbox.usp_reopen_divergence @did, @rt, @reason, @by;`)
    return text(`Reopened ${a.component}/${a.ref_code} and recorded a false_completion against "${a.requirement_type}".`)
  }),
)

server.registerTool(
  "sandbox_how_to_verify",
  {
    title: "How to get something verified",
    description:
      "Read this before trying to record that something works. Explains why you cannot write evidence and " +
      "what to do instead.",
    inputSchema: {},
  },
  guard(async () =>
    text(
      [
        "You cannot write evidence. The database denies it to your credential, and that denial is the single",
        "control this whole system rests on. Do not look for another way in.",
        "",
        "To get something verified:",
        "",
        "1. Put a `data-divergence=\"<ref_code>\"` attribute on the element in question, in the component's own",
        "   markup. The anchor lives in the code so it moves when the code moves.",
        "2. Write a check spec at verifier/checks/<component>/<ref_code>.json. See verifier/README.md for the",
        "   format. Declare what the values SHOULD be — a check with no expectations fails, on purpose.",
        "3. Run: npm --prefix verifier run check -- checks/<component>/<ref_code>.json",
        "   The runner drives a real browser, measures, and writes the result under its own credential.",
        "4. Re-check sandbox_gate. If evidence.current is still unmet, run:",
        "   npm --prefix verifier run sync-source",
        "",
        "Write honest specs. The runner cannot tell a meaningful expectation from one you already knew would",
        "hold, and specs are committed to git precisely so a human can see a weak one in the diff.",
      ].join("\n"),
    ),
  ),
)

// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 7 — system changes.
//
// The whole point of the entity (spec §5.1) is that a system-level decision must NOT be
// filed as a divergence row: "filing the move to Fluent icons under Rail Sidebar would
// bury a system-level decision where nothing else can find it." These tools are how an
// agent files it in the right place instead.
//
// An agent may propose and assess — both are analysis. It may not approve, land or
// reject; those are decisions, and the database refuses them to this credential no matter
// what any tool here offers.
// ═══════════════════════════════════════════════════════════════════════════════════

server.registerTool(
  "sandbox_propose_system_change",
  {
    title: "File a change whose blast radius exceeds one component",
    description:
      "Use this the moment a fix you are making would touch tokens/ or src/ui/ — or anything else every " +
      "component depends on. Do NOT file it as a divergence row: a system-level decision buried under one " +
      "component is exactly how the font change and the Fluent icon migration silently invalidated " +
      "everything already verified. Run scripts/detect-scope.mjs --json first and pass its affectedPaths " +
      "verbatim; the staleness sweep has nothing to match on without them. This creates a PROPOSAL — you " +
      "cannot approve it, and the database will refuse you if you try.",
    inputSchema: {
      title: z.string(),
      detail: z.string().optional(),
      affected_paths: z.array(z.string()).optional(),
      discovered_in_component: z.string().optional(),
    },
  },
  guard(async (a) => {
    const p = await db()
    const r = await p
      .request()
      .input("title", mssql.NVarChar(400), a.title)
      .input("detail", mssql.NVarChar(mssql.MAX), a.detail ?? null)
      .input("paths", mssql.NVarChar(mssql.MAX), a.affected_paths ? JSON.stringify(a.affected_paths) : null)
      .input("slug", mssql.NVarChar(100), a.discovered_in_component ?? null)
      .query(
        "DECLARE @cid INT = (SELECT component_id FROM sandbox.component WHERE slug = @slug);" +
          " EXEC sandbox.usp_propose_system_change @title, @detail, @paths, @cid, NULL;",
      )
    const row = r.recordset?.[0]
    return text(
      [
        `Proposed ${row?.ref_code ?? "(unknown)"} at state '${row?.state ?? "proposed"}'.`,
        "",
        "Next: record an impact assessment with sandbox_assess_system_change. Approval is refused until",
        "there is one AND affected_paths are declared — a system change never gets the fast lane.",
      ].join("\n"),
    )
  }),
)

server.registerTool(
  "sandbox_assess_system_change",
  {
    title: "Record what a system change would actually reach",
    description:
      "Assessing is analysis, so you may do it. State what breaks, what needs re-verifying, and roughly how " +
      "much — a human decides whether that is acceptable, and cannot decide it from a title alone. An empty " +
      "assessment is refused. Passing affected_paths here updates them if you learned more since proposing.",
    inputSchema: {
      ref_code: z.string(),
      impact_assessment: z.string(),
      affected_paths: z.array(z.string()).optional(),
    },
  },
  guard(async (a) => {
    const p = await db()
    await p
      .request()
      .input("ref", mssql.NVarChar(20), a.ref_code)
      .input("assessment", mssql.NVarChar(mssql.MAX), a.impact_assessment)
      .input("paths", mssql.NVarChar(mssql.MAX), a.affected_paths ? JSON.stringify(a.affected_paths) : null)
      .query(
        "DECLARE @id INT = (SELECT system_change_id FROM sandbox.system_change WHERE ref_code = @ref);" +
          " IF @id IS NULL THROW 52010, 'No such system change.', 1;" +
          " EXEC sandbox.usp_assess_system_change @id, @assessment, @paths;",
      )
    return text(`Assessment recorded for ${a.ref_code}; it is now at 'assessing'. A human approves from here.`)
  }),
)

server.registerTool(
  "sandbox_system_changes",
  {
    title: "What system changes exist, and what each still needs",
    description:
      "Check this BEFORE proposing — the change you are about to file may already exist — and before starting " +
      "component work, because anything blocked on an open system change will not pass its gate. Each row " +
      "carries what is still unmet before it could be approved.",
    inputSchema: {},
  },
  guard(async () => {
    const p = await db()
    const r = await p.request().query(
      "SELECT sc.ref_code, sc.title, sc.state, sc.affected_paths, sc.landed_commit," +
        " (SELECT COUNT(*) FROM sandbox.divergence d WHERE d.blocked_by = sc.system_change_id) AS blocking," +
        " (SELECT STRING_AGG(u.requirement, ', ') FROM sandbox.fn_system_change_unmet(sc.system_change_id) u) AS unmet" +
        " FROM sandbox.system_change sc ORDER BY sc.system_change_id DESC",
    )
    if (!r.recordset.length) return text("No system changes recorded.")
    return json(r.recordset)
  }),
)

server.registerTool(
  "sandbox_block_divergence",
  {
    title: "Park a divergence on an open system change",
    description:
      "Use this instead of working around a system change that has not landed. Resolving underneath one bakes " +
      "in an answer it is about to invalidate. The divergence moves to 'blocked' and its gate says which " +
      "change is responsible, so the thread stays visible rather than being lost. Omit system_change_ref to " +
      "UNBLOCK — the divergence returns to the state it was blocked from.",
    inputSchema: {
      component: z.string(),
      ref_code: z.string(),
      system_change_ref: z.string().optional(),
    },
  },
  guard(async (a) => {
    const p = await db()
    await p
      .request()
      .input("slug", mssql.NVarChar(100), a.component)
      .input("ref", mssql.NVarChar(20), a.ref_code)
      .input("scref", mssql.NVarChar(20), a.system_change_ref ?? null)
      .query(
        "DECLARE @did INT = (SELECT d.divergence_id FROM sandbox.divergence d" +
          " JOIN sandbox.component c ON c.component_id = d.component_id" +
          " WHERE c.slug = @slug AND d.ref_code = @ref);" +
          " IF @did IS NULL THROW 52011, 'No such divergence.', 1;" +
          " DECLARE @scid INT = (SELECT system_change_id FROM sandbox.system_change WHERE ref_code = @scref);" +
          " IF @scref IS NOT NULL AND @scid IS NULL THROW 52012, 'No such system change.', 1;" +
          " EXEC sandbox.usp_block_divergence @did, @scid;",
      )
    return text(
      a.system_change_ref
        ? `${a.component}/${a.ref_code} is now blocked on ${a.system_change_ref}.`
        : `${a.component}/${a.ref_code} is unblocked and back at its previous state.`,
    )
  }),
)

await server.connect(new StdioServerTransport())
