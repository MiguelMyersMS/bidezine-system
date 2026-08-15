// ═══════════════════════════════════════════════════════════════════════════════════
// The stored register still means what the prompt says — migration 029.
//
//   node scripts/check-register.mjs
//
// 023 backfilled `divergence.register` from a structural proxy: whether the row's `visual`
// proposed an after-value. §3.10 defines the register by what a HUMAN IS ASKED FOR. Those are
// independent questions — most colour rows propose a value AND are already settled — and the
// backfill was wrong on 100 of 169 rows, including all 11 the owner's decision queue is made
// of. It was found by wiring the card to the column and measuring, not by reading the code.
//
// So the column is no longer trusted on its own. This asserts it still equals what
// `sandbox/src/lib/register.ts` derives from each row's own prompt — the convention the 169
// descriptions were actually authored in.
//
// ── It IMPORTS the derivation; it does not restate it ──────────────────────────────
// Restating that rule here would recreate the exact defect being fixed: two definitions of one
// thing, free to drift, with nothing noticing. The module is bundled with esbuild and called,
// so there is one rule and this checks its result.
//
// ── `explicit` rows are exempt, and that is the point of recording the source ──────
// A human may set a register against what the prompt says — F-1 was reopened as `decide` while
// its prompt still reads "Confirm the wider rail is right". `register_source = 'explicit'`
// marks those, so the exemption is a fact in the table rather than a list of refs in this file
// that nobody would maintain. They are REPORTED, never silently skipped: a deviation you
// cannot see is how the last one survived.
// ═══════════════════════════════════════════════════════════════════════════════════

import { build } from "esbuild"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { connect, REPO_ROOT } from "../verifier/lib/db.mjs"

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const tmp = await mkdtemp(join(tmpdir(), "register-"))
const outfile = join(tmp, "register.mjs")
let registerOf
try {
  await build({
    entryPoints: [join(REPO_ROOT, "sandbox", "src", "lib", "register.ts")],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    logLevel: "silent",
  })
  ;({ registerOf } = await import(pathToFileURL(outfile).href))
} finally {
  await rm(tmp, { recursive: true, force: true })
}

let pool
try {
  pool = await connect("ADMIN")
  const { recordset } = await pool.request().query(`
    SELECT c.slug, d.ref_code, d.register, d.register_source, d.review_prompt
    FROM   sandbox.divergence d JOIN sandbox.component c ON c.component_id = d.component_id`)

  console.log(`\n${recordset.length} divergence row(s)\n`)

  const derived = new Map()
  const noPrompt = []
  for (const r of recordset) {
    // No `register` key on purpose: registerOf prefers the stored column, and passing it would
    // make this check compare the column against itself and pass on any data at all.
    const want = registerOf({ reviewPrompt: r.review_prompt })
    if (want === null) { noPrompt.push(r); continue }
    derived.set(r, want)
  }

  const fromPrompt = [...derived].filter(([r]) => r.register_source === "prompt")
  const explicit = [...derived].filter(([r]) => r.register_source === "explicit")
  const drifted = fromPrompt.filter(([r, want]) => r.register !== want)

  check(
    fromPrompt.length > 0,
    "there are prompt-derived rows to check at all",
    `${fromPrompt.length} prompt-derived, ${explicit.length} explicit, ${noPrompt.length} with no prompt`,
  )
  check(
    drifted.length === 0,
    "every prompt-derived row's stored register still equals what its prompt says",
    drifted.length
      ? drifted.slice(0, 12).map(([r, want]) => `${r.slug}/${r.ref_code}: stored ${r.register}, prompt says ${want}`).join("\n          ") +
        (drifted.length > 12 ? `\n          … and ${drifted.length - 12} more` : "")
      : "",
  )

  // All three registers must be REACHABLE in real data. `close` was absent from the column
  // entirely while 61 rows said "Nothing to decide" in a fixed literal sentence, and nothing
  // noticed, because a register nothing holds looks identical to a register nothing needs.
  const counts = {}
  for (const [, want] of derived) counts[want] = (counts[want] ?? 0) + 1
  check(
    ["decide", "confirm", "close"].every((r) => (counts[r] ?? 0) > 0),
    "all three of §3.10's registers are present in the corpus, not just the two a proxy produced",
    JSON.stringify(counts),
  )

  // Fixture components (`__dbg__`, `__verifier_test__`, `__mcp_test__`, `__decision_test__`)
  // are created by test harnesses and carry no authored description, so the convention has
  // nothing to say about them. They are named rather than filtered away silently — the whole
  // lesson here is that things nobody looks at are where the disagreement lives.
  const isFixture = (slug) => /^__.*__$/.test(slug)
  const realNoPrompt = noPrompt.filter((r) => !isFixture(r.slug))
  check(
    realNoPrompt.length === 0,
    "no authored row is left without a register — an undescribed row cannot be filed under any of them",
    realNoPrompt.length
      ? realNoPrompt.map((r) => `${r.slug}/${r.ref_code}`).join(", ")
      : `${noPrompt.length} fixture row(s) skipped: ${noPrompt.map((r) => `${r.slug}/${r.ref_code}`).join(", ") || "none"}`,
  )

  if (explicit.length) {
    console.log("\ndeviating deliberately (register_source = 'explicit'):\n")
    for (const [r, want] of explicit) {
      const note = r.register === want ? "agrees with its prompt anyway" : `prompt says ${want}`
      console.log(`  ${r.slug}/${r.ref_code}: ${r.register} — ${note}`)
    }
  }
} finally {
  await pool?.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) {
  console.log("\nThe stored register and the authored prompt disagree. The column is what the card")
  console.log("reads, so this is the owner's decision queue being wrong, not a cosmetic mismatch.")
  process.exitCode = 1
}
