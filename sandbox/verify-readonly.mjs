// ═══════════════════════════════════════════════════════════════════════════════════
// Milestone 8's first "done when", proven at the layer that decides it.
//
//   npm --prefix sandbox run verify-readonly
//
// The claim is "you can watch another machine's component progress and CANNOT write to
// it." A disabled Approve button is not that claim — it is a courtesy on top of it. So
// this drives the REAL HTTP endpoint the button calls, with no UI anywhere in the
// request, and asserts the refusal.
//
// ── Why this file exists at all ────────────────────────────────────────────────────
// It did not, for a while. M8 was reported with this check run from a one-off script in a
// session scratchpad, which made the strongest evidence in the milestone an unrepeatable
// claim by the agent that made the change. That is invariant 1 — the thing this whole
// system exists to prevent — reproduced at the level of the system's own construction.
// An independent review caught it. The lesson generalises past this file: a proof that
// only ever ran in a transcript is a story about a test, not a test.
//
// ── It mounts the middleware rather than requiring a dev server ────────────────────
// `corpusApiMiddleware()` is the exact same function `vite.config.ts` mounts, so the
// routes, the status codes and the refusal plumbing under test are the ones the app
// serves. Running it on a bare `node:http` server instead of Vite costs nothing here and
// buys a check that runs in CI, on a fresh clone, with no port already listening and no
// browser installed.
//
// What that trade DOES give up, stated rather than glossed: it does not prove Vite mounts
// the middleware. `verify-machines-ui.mjs` covers that, against the running app.
//
// ── It restores what it moves ──────────────────────────────────────────────────────
// The fixture is a REAL component, because the refusal depends on real ownership. So the
// script hands it away, proves the refusal, and hands it back — and fails loudly if the
// restore did not happen, rather than leaving the corpus quietly reassigned. A suite that
// mutates production data and passes is worse than no suite; this project already shipped
// that once (verify-system-change, M7 step 4).
// ═══════════════════════════════════════════════════════════════════════════════════

import { createServer } from "node:http"
import { connect, sql } from "../verifier/lib/db.mjs"
import { corpusApiMiddleware } from "./server/corpus-api.mjs"

const SLUG = "rail-sidebar"
const REF = "F-1"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

async function as(role, body) {
  const pool = await connect(role)
  try {
    return await body(pool)
  } finally {
    await pool.close().catch(() => {})
  }
}

// ── the app's own middleware, on a real socket ──────────────────────────────────────
const middleware = corpusApiMiddleware()
const server = createServer((req, res) => {
  middleware(req, res, () => {
    res.statusCode = 404
    res.end("not an /api route")
  })
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
const base = `http://127.0.0.1:${server.address().port}`

const bundle = async () => (await fetch(`${base}/api/divergence/${SLUG}/${REF}`)).json()
const postApprove = async () => {
  const res = await fetch(`${base}/api/divergence/${SLUG}/${REF}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  return { status: res.status, body: await res.json() }
}

let componentId
let originalOwner
let handedAway = false

try {
  const owner = await as("APP", async (p) =>
    (
      await p.request().input("slug", sql.NVarChar(100), SLUG).query(`
        SELECT c.component_id, o.owner_name
        FROM   sandbox.component c
        CROSS  APPLY sandbox.fn_component_owner(c.component_id) o
        WHERE  c.slug = @slug`)
    ).recordset[0],
  )
  if (!owner) throw new Error(`No component '${SLUG}' in the corpus.`)
  componentId = owner.component_id
  originalOwner = owner.owner_name

  const here = process.env.MACHINE_NAME?.trim() || null
  // The whole check turns on this machine NOT being the owner for part of it. If this
  // machine has no identity at all, every write is refused for a different reason and the
  // result would look like a pass while proving something else entirely.
  if (!here) throw new Error("MACHINE_NAME is unset, so this check cannot distinguish 'not the owner' from 'no identity'.")
  if (originalOwner !== here) {
    throw new Error(`${SLUG} is owned by ${originalOwner ?? "(nobody)"}, not by this machine (${here}). Run this on the owning machine.`)
  }

  const other = await as("APP", async (p) =>
    (
      await p.request().input("me", sql.NVarChar(50), here).query(`
        SELECT TOP 1 name FROM sandbox.machine WHERE name <> @me ORDER BY machine_id`)
    ).recordset[0]?.name,
  )
  if (!other) throw new Error("Only one machine is registered; there is no second machine to hand the component to.")

  console.log(`\nwhile ${here} owns ${SLUG}\n`)
  const mine = await bundle()
  check(mine.ownership?.mayWrite === true, "the bundle reports this machine may write", JSON.stringify(mine.ownership))

  // ── hand it away ──────────────────────────────────────────────────────────────────
  await as("APP", async (p) =>
    p
      .request()
      .input("component_id", sql.Int, componentId)
      .input("from_machine", sql.NVarChar(50), here)
      .input("to_machine", sql.NVarChar(50), other)
      .input("note", sql.NVarChar(400), "verify-readonly.mjs: proving a foreign write is refused. Handed straight back.")
      .execute("sandbox.usp_transfer_component"),
  )
  handedAway = true

  console.log(`\nafter handing it to ${other}\n`)

  const theirs = await bundle()
  check(theirs.ownership?.mayWrite === false, "the bundle now reports this machine may NOT write", JSON.stringify(theirs.ownership))
  check(
    Array.isArray(theirs.gate?.unmet) && !!theirs.divergence,
    "and the component is still fully readable — observation is unaffected by ownership",
    `gate.unmet = ${theirs.gate?.unmet?.length}, divergence = ${theirs.divergence?.ref}`,
  )

  // The one that matters. No button, no React, no disabled attribute — the request the
  // button would have made, made directly.
  const attempt = await postApprove()
  check(attempt.status === 403, "POSTing approve straight at the endpoint is REFUSED", `HTTP ${attempt.status}`)
  check(
    new RegExp(`owned by ${other}`).test(attempt.body?.error ?? ""),
    "and the refusal names the actual owner rather than saying only no",
    (attempt.body?.error ?? "(no error text)").slice(0, 160),
  )
  // 403 and 409 mean different things to a human: "this is not yours" versus "come back
  // when the evidence is there". Conflating them would send someone off to produce
  // evidence for a component they cannot write to no matter what they produce.
  check(
    attempt.body?.refusedByOwnership === true && attempt.body?.refusedByGate !== true,
    "classified as an ownership refusal, not a gate refusal",
    JSON.stringify({ ownership: attempt.body?.refusedByOwnership, gate: attempt.body?.refusedByGate }),
  )

  // Observation is not the only thing an observer keeps. Reopen is deliberately ungated
  // (migration 016), and a regression there would turn "read-only observer" into "silent
  // bystander" without failing anything else in this suite.
  const reopenRes = await fetch(`${base}/api/divergence/${SLUG}/${REF}/reopen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirementType: "", reason: "" }),
  })
  const reopenBody = await reopenRes.json()
  check(
    reopenRes.status !== 403 && !/owned by/.test(reopenBody?.error ?? ""),
    "reopen is NOT refused on ownership grounds — an observer can still raise a concern",
    `HTTP ${reopenRes.status} · ${(reopenBody?.error ?? "accepted").slice(0, 90)}`,
  )
} catch (err) {
  console.error(`\nHARNESS ERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  if (handedAway) {
    console.log("\nhanding it back\n")
    const here = process.env.MACHINE_NAME?.trim()
    try {
      await as("APP", async (p) => {
        const current = (
          await p.request().input("id", sql.Int, componentId).query(`SELECT owner_name FROM sandbox.fn_component_owner(@id)`)
        ).recordset[0].owner_name
        await p
          .request()
          .input("component_id", sql.Int, componentId)
          .input("from_machine", sql.NVarChar(50), current)
          .input("to_machine", sql.NVarChar(50), originalOwner)
          .input("note", sql.NVarChar(400), "verify-readonly.mjs: restoring ownership after the read-only proof.")
          .execute("sandbox.usp_transfer_component")
      })
      const restored = await as(
        "APP",
        async (p) => (await p.request().input("id", sql.Int, componentId).query(`SELECT owner_name FROM sandbox.fn_component_owner(@id)`)).recordset[0].owner_name,
      )
      check(restored === originalOwner, "ownership restored to where it started", `owner = ${restored} (was ${originalOwner}, this machine is ${here})`)
    } catch (err) {
      check(false, "ownership restored to where it started", `RESTORE FAILED — ${SLUG} may still be assigned elsewhere: ${err.message}`)
    }
  }

  await new Promise((resolve) => server.close(resolve))

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length) {
    console.log("\nThe read-only claim does NOT hold. Failing checks:")
    for (const f of failed) console.log(`  · ${f.label}`)
    process.exitCode = 1
  }
}
