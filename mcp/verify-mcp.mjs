// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 3's definition of done.
//
//   node verify-mcp.mjs
//
// Talks to the real server over stdio, exactly as Claude Code and Copilot do, and drives
// the tools against the live database. It does not import the server's functions — that
// would test the code while skipping the protocol, the transport and the credential,
// which is where things actually break.
//
// The claims under test:
//   · an agent can RETRIEVE prior decisions and cite them, which is the whole point
//   · an agent can PROPOSE, and what it proposes lands as a proposal, not as done
//   · the server's credential cannot promote itself past the gate, no matter the tool
//   · a review is constrained by the evidence it cites, not by its own confidence
// ═══════════════════════════════════════════════════════════════════════════════════

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import mssql from "mssql"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, "..")
process.loadEnvFile(join(REPO_ROOT, ".env"))

const SLUG = "__mcp_test__"
const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const adminPool = () =>
  mssql.connect({
    server: process.env.FABRIC_SQL_SERVER.split(",")[0],
    port: 1433,
    database: process.env.FABRIC_SQL_DATABASE,
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: {
        clientId: process.env.FABRIC_ADMIN_CLIENT_ID,
        clientSecret: process.env.FABRIC_ADMIN_CLIENT_SECRET,
        tenantId: process.env.FABRIC_TENANT_ID,
      },
    },
    options: { encrypt: true, trustServerCertificate: false },
    connectionTimeout: 60_000,
  })

const cleanupSql = `
  DELETE dd FROM sandbox.divergence_decision dd JOIN sandbox.component c ON c.component_id=dd.component_id WHERE c.slug='${SLUG}';
  DELETE fc FROM sandbox.false_completion fc JOIN sandbox.divergence d ON d.divergence_id=fc.divergence_id JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE a  FROM sandbox.approval a  JOIN sandbox.divergence d ON d.divergence_id=a.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE rc FROM sandbox.review_citation rc JOIN sandbox.review r ON r.review_id=rc.review_id JOIN sandbox.divergence d ON d.divergence_id=r.divergence_id JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE r  FROM sandbox.review r    JOIN sandbox.divergence d ON d.divergence_id=r.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE e  FROM sandbox.evidence e  JOIN sandbox.divergence d ON d.divergence_id=e.divergence_id  JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE d  FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id=d.component_id WHERE c.slug='${SLUG}';
  DELETE FROM sandbox.component WHERE slug='${SLUG}';`

const say = (r) => r.content.map((c) => c.text).join("\n")

let admin, client
try {
  admin = await adminPool()
  await admin.request().batch(cleanupSql)

  // A resolved decision for retrieval to find, and a divergence carrying deliberately
  // FAILING evidence so a citation can be tested against it.
  await admin.request().batch(`
    INSERT INTO sandbox.component (slug, title, state) VALUES ('${SLUG}', 'MCP self-test', 'build');
    INSERT INTO sandbox.divergence (component_id, ref_code, category, title, detail, state)
      SELECT component_id, 'P-1', 'spacing',
             'Rail-to-panel gap uses the flex gap, not padding',
             'Precedent: reuse an existing bidezine value rather than origin''s literal. Marker token zzqqxx.',
             'resolved' FROM sandbox.component WHERE slug='${SLUG}';
    INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state)
      SELECT component_id, 'P-2', 'layout-sizing', 'Fixture with failing evidence', 'implemented'
      FROM sandbox.component WHERE slug='${SLUG}';
    INSERT INTO sandbox.divergence (component_id, ref_code, category, title, state, register)
      SELECT component_id, 'P-4', 'color', 'Fixture awaiting a human decision', 'implemented', 'decide'
      FROM sandbox.component WHERE slug='${SLUG}';`)

  const p2 = (
    await admin.request().query(`
      SELECT d.divergence_id FROM sandbox.divergence d
      JOIN sandbox.component c ON c.component_id=d.component_id
      WHERE c.slug='${SLUG}' AND d.ref_code='P-2'`)
  ).recordset[0].divergence_id

  await admin.request().batch(`
    INSERT INTO sandbox.evidence (divergence_id, kind, check_spec, raw_output, passed,
      verified_at_commit, verified_at_commit_at, run_id)
    VALUES (${p2}, 'measurement', '{}', 'expected 36, got 40', 0, REPLICATE('a',40),
      SYSUTCDATETIME(), NEWID());`)

  const failingEvidenceId = (
    await admin.request().query(`SELECT MAX(evidence_id) AS id FROM sandbox.evidence WHERE divergence_id=${p2}`)
  ).recordset[0].id

  // ── connect over the real protocol ────────────────────────────────────────────────
  client = new Client({ name: "verify-mcp", version: "0.0.0" })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [join(HERE, "server.mjs")],
      cwd: REPO_ROOT,
    }),
  )

  console.log("\nthe server speaks MCP\n")
  const { tools } = await client.listTools()
  check(tools.length >= 9, "server exposes its toolset over stdio", `${tools.length} tools`)
  check(
    tools.some((t) => t.name === "sandbox_record_decision"),
    "an agent can reach the decision record — before this, a human's answer had nowhere to go but the chat log",
  )
  check(
    tools.every((t) => t.description && t.description.length > 80),
    "every tool carries a description that teaches the protocol, not just a label",
  )

  const cats = JSON.parse(say(await client.callTool({ name: "sandbox_categories", arguments: {} })))
  // 15 since migration 006: importing real data demanded 'radius' and
  // 'interaction-state', neither of which existed when the enum was designed.
  check(cats.length === 15, "the fixed category enum is reachable", `${cats.length} categories`)

  // ── retrieval — the reason M3 exists ──────────────────────────────────────────────
  console.log("\nretrieval: precedent instead of invention\n")

  const found = JSON.parse(
    say(await client.callTool({ name: "sandbox_decisions", arguments: { keyword: "zzqqxx" } })),
  ).matches
  check(
    found.length === 1 && found[0].ref_code === "P-1",
    "an agent can find a prior decision by keyword and cite it by ref",
    found[0] ? `${found[0].component}/${found[0].ref_code}` : "not found",
  )

  const byCategory = JSON.parse(
    say(await client.callTool({ name: "sandbox_decisions", arguments: { category: "spacing" } })),
  ).matches
  check(byCategory.some((d) => d.ref_code === "P-1"), "category is a working retrieval key")

  const none = say(
    await client.callTool({ name: "sandbox_decisions", arguments: { keyword: "no-such-precedent-xyz" } }),
  )
  check(
    /no precedent to reuse/i.test(none) && /licence to invent/i.test(none),
    "an empty result says so explicitly rather than returning nothing",
  )

  // ── proposing, and the limits of it ───────────────────────────────────────────────
  console.log("\nan agent proposes; it does not decide\n")

  await client.callTool({
    name: "sandbox_propose_divergence",
    arguments: {
      component: SLUG,
      ref_code: "P-3",
      category: "color",
      title: "Proposed via MCP",
      detail: "Cites precedent P-1.",
    },
  })
  const p3 = (
    await admin.request().query(`
      SELECT d.state FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id=d.component_id
      WHERE c.slug='${SLUG}' AND d.ref_code='P-3'`)
  ).recordset[0]
  check(p3?.state === "proposed", "a proposal lands as 'proposed', never as done", `state = ${p3?.state}`)

  const gate = say(await client.callTool({ name: "sandbox_gate", arguments: { component: SLUG, ref_code: "P-3" } }))
  check(
    /evidence\.present/.test(gate) && /review\.present/.test(gate),
    "the gate hands the agent its to-do list",
  )

  // ── reviews are bounded by their citations ────────────────────────────────────────
  console.log("\na review is constrained by what it cites\n")

  const noCites = say(
    await client.callTool({
      name: "sandbox_submit_review",
      arguments: {
        component: SLUG, ref_code: "P-2",
        author_agent_id: "reviewer", builder_agent_id: "builder",
        verdict: "pass", claim: "Looks right to me.",
        reviewed_at_commit: "a".repeat(40), cites: [],
      },
    }),
  )
  check(/must cite at least one/i.test(noCites), "a passing review citing nothing is refused")

  const selfReview = say(
    await client.callTool({
      name: "sandbox_submit_review",
      arguments: {
        component: SLUG, ref_code: "P-2",
        author_agent_id: "same", builder_agent_id: "same",
        verdict: "pass", claim: "I checked my own work.",
        reviewed_at_commit: "a".repeat(40), cites: [failingEvidenceId],
      },
    }),
  )
  check(
    /ck_review_independent|REFUSED/i.test(selfReview),
    "reviewing your own build is refused by the database",
    selfReview.split("\n").filter(Boolean).slice(0, 2).join(" / "),
  )

  const cited = say(
    await client.callTool({
      name: "sandbox_submit_review",
      arguments: {
        component: SLUG, ref_code: "P-2",
        author_agent_id: "reviewer", builder_agent_id: "builder",
        verdict: "pass", claim: "Asserting this is fine while citing a failing measurement.",
        reviewed_at_commit: "a".repeat(40), cites: [failingEvidenceId],
      },
    }),
  )
  const refuted = say(await client.callTool({ name: "sandbox_gate", arguments: { component: SLUG, ref_code: "P-2" } }))
  check(
    /review\.citations_support/.test(refuted),
    "a confident 'pass' citing failing evidence is refuted by its own citation",
    `submit said: ${cited.split("\n")[0]}`,
  )

  // ── reopening ─────────────────────────────────────────────────────────────────────
  console.log("\nreopening a false green\n")

  await client.callTool({
    name: "sandbox_reopen",
    arguments: {
      component: SLUG, ref_code: "P-1",
      requirement_type: "evidence.present",
      reason: "Nothing was ever measured for this.",
      discovered_by: "auditor",
    },
  })
  const reopened = (
    await admin.request().query(`
      SELECT d.state, (SELECT COUNT(*) FROM sandbox.false_completion fc WHERE fc.divergence_id=d.divergence_id) AS fc
      FROM sandbox.divergence d JOIN sandbox.component c ON c.component_id=d.component_id
      WHERE c.slug='${SLUG}' AND d.ref_code='P-1'`)
  ).recordset[0]
  check(
    reopened.state === "reopened" && reopened.fc === 1,
    "an agent can reopen without permission, and it is recorded",
    `state = ${reopened.state}, false_completion = ${reopened.fc}`,
  )

  // ── relaying a decision, without becoming the decider ─────────────────────────────
  console.log("\nan agent may relay what a human decided, and is recorded AS a relay\n")

  const decide = async (args) =>
    say(
      await client.callTool({
        name: "sandbox_record_decision",
        arguments: {
          component: SLUG,
          ref_code: "P-4",
          concept: "fixture value",
          chosen_value: "oklch(0.5 0 0)",
          disposition: "reused",
          rationale: "fixture: reuses an existing value rather than inventing one",
          decided_by: "a real person",
          machine: "Laptop A",
          ...args,
        },
      }),
    )

  const gateBefore = say(await client.callTool({ name: "sandbox_gate", arguments: { component: SLUG, ref_code: "P-4" } }))
  check(/decision\.present/.test(gateBefore), "a `decide` row's gate names decision.present as unmet")

  for (const name of ["Claude", "copilot", "the agent", "AI"]) {
    const refused = await decide({ decided_by: name })
    check(
      /REFUSED/.test(refused) && /names an agent rather than a person/.test(refused),
      `decided_by '${name}' is refused before it reaches the database`,
    )
  }

  const recorded = await decide({})
  check(/^Recorded:/.test(recorded), "a decision naming a human is recorded", recorded.split("\n")[0].slice(0, 88))
  check(
    !/decision\.present/.test(
      say(await client.callTool({ name: "sandbox_gate", arguments: { component: SLUG, ref_code: "P-4" } })),
    ),
    "and the gate stops asking for one",
  )

  const principal = (
    await admin.request().query(`
      SELECT TOP 1 dd.decided_by, dd.recorded_by_principal
      FROM   sandbox.divergence_decision dd
      JOIN   sandbox.component c ON c.component_id = dd.component_id
      WHERE  c.slug='${SLUG}' ORDER BY dd.decision_id DESC`)
  ).recordset[0]
  check(
    principal.decided_by === "a real person" &&
      principal.recorded_by_principal?.toLowerCase().startsWith(process.env.FABRIC_AGENT_CLIENT_ID.toLowerCase()),
    "the row records the HUMAN as decider and the AGENT as the principal that wrote it — a claim and a fact, kept apart",
    `decided_by=${principal.decided_by} · recorded_by=${principal.recorded_by_principal?.slice(0, 38)}`,
  )

  const undefended = await decide({
    disposition: "authored",
    chosen_token: "--mcp-test-undefended",
    rationale: "origin uses this number",
  })
  check(
    /chosen instead of/.test(undefended),
    "an authored value naming nothing it rejected is refused through the tool, not just at the table",
    undefended.split("\n").slice(-1)[0].slice(0, 96),
  )

  const authored = await decide({
    disposition: "authored",
    chosen_token: "--mcp-test-token-that-does-not-exist",
    rejected_value: "--sidebar-accent (wrong surface)",
    rationale: "fixture: authors a token that resolves nowhere",
  })
  check(
    /stays blocked until that token really resolves/.test(authored) && /npm run tokens/.test(authored),
    "authoring a token tells the agent exactly what is now owed, rather than reporting success",
  )
  check(
    /token\.authored/.test(
      say(await client.callTool({ name: "sandbox_gate", arguments: { component: SLUG, ref_code: "P-4" } })),
    ),
    "and the gate blocks the row on it",
  )

  // ── the invariant, through the MCP surface this time ──────────────────────────────
  console.log("\nno tool on this server can write evidence\n")
  check(
    !tools.some((t) => /evidence/i.test(t.name) && /write|insert|record|add/i.test(t.name)),
    "no tool even offers to write evidence",
  )
  const howto = say(await client.callTool({ name: "sandbox_how_to_verify", arguments: {} }))
  check(
    /cannot write evidence/i.test(howto) && /verifier/i.test(howto),
    "the server tells agents what to do instead of writing evidence",
  )
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}\n${err.stack}`)
  process.exitCode = 1
} finally {
  try {
    await client?.close()
  } catch {}
  try {
    const c = admin?.connected ? admin : await adminPool()
    await c.request().batch(cleanupSql)
    await c.close()
  } catch (err) {
    console.error(`\nCLEANUP FAILED — fixture rows may remain: ${err.message}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nFailing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
