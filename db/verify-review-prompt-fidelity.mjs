// A check that each rail-sidebar color divergence prompt's final sentence still matches
// the real source token it quotes -- closing the risk REVIEW-CARD-SPEC.md §3.10 names
// explicitly: "nothing currently notices" when a proposed value changes after its prompt
// was written.
//
//   node db/verify-review-prompt-fidelity.mjs
//
// Reads proposedDarkRailTokens directly out of sandbox/src/data/rail-sidebar.ts by
// bundling the real module with esbuild and importing it -- never retyping the oklch
// values by hand (CLAUDE.md checklist item 18: a fabricated-but-plausible value passes
// every check except reading the real source).
//
// The mapping from ref_code (B-1..B-9) to a token's own originName is fixed by which
// entry of proposedDarkRailTokens each prompt was written against -- not by array
// position or by re-deriving it from the prompt text, which would make this check
// trivially circular.

import { build } from "esbuild"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { connect, REPO_ROOT } from "../verifier/lib/db.mjs"

const SLUG = "rail-sidebar"
const SOURCE = join(REPO_ROOT, "sandbox", "src", "data", "rail-sidebar.ts")

// Fixed at authoring time: which proposedDarkRailTokens entry (by its own originName)
// each B-ref's prompt was written against. Order matches the user's own B-1..B-9 list.
const REF_TO_ORIGIN_NAME = {
  "B-1": "darkSurface",
  "B-2": "darkHoverBg",
  "B-3": "darkActiveBg",
  "B-4": "darkPressedBg",
  "B-5": "darkBorderStrong",
  "B-6": "onDark",
  "B-7": "onDarkHover",
  "B-8": "onDarkSubtle",
  "B-9": "onDarkDisabled",
}

const results = []
const check = (ok, label, note = "") => {
  results.push({ ok, label })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${note ? `\n          ${note}` : ""}`)
}

const tmp = await mkdtemp(join(tmpdir(), "rail-sidebar-bundle-"))
const outfile = join(tmp, "rail-sidebar.mjs")
try {
  await build({ entryPoints: [SOURCE], outfile, bundle: true, platform: "node", format: "esm", logLevel: "silent" })
  const mod = await import(pathToFileURL(outfile).href)
  const { proposedDarkRailTokens } = mod

  const tokensByName = new Map(proposedDarkRailTokens.map((t) => [t.originName, t]))

  let pool
  try {
    pool = await connect("ADMIN")
    const { recordset } = await pool.request().query(`
      SELECT d.ref_code, d.review_prompt
      FROM   sandbox.divergence d
      JOIN   sandbox.component c ON c.component_id = d.component_id
      WHERE  c.slug = '${SLUG}' AND d.ref_code LIKE 'B-%'`)

    console.log(`\n${recordset.length} B-ref rows with a review_prompt to check\n`)

    for (const { ref_code: ref, review_prompt: prompt } of recordset.sort((a, b) => a.ref_code.localeCompare(b.ref_code))) {
      const originName = REF_TO_ORIGIN_NAME[ref]
      if (!originName) {
        check(false, `${ref}: no known mapping to a proposedDarkRailTokens entry -- add one to REF_TO_ORIGIN_NAME`)
        continue
      }
      const token = tokensByName.get(originName)
      if (!token) {
        check(false, `${ref}: originName "${originName}" no longer exists in proposedDarkRailTokens`)
        continue
      }
      if (!prompt) {
        check(false, `${ref}: review_prompt is empty, nothing to check`)
        continue
      }

      // Only the FINAL sentence is the contract per §3.10 -- an earlier sentence may
      // legitimately mention a different var (this is the mistake the spec's own first
      // checker made).
      const sentences = prompt.split(/(?<=[.])\s+/)
      const last = sentences[sentences.length - 1]

      const varMatch = last.match(/--[a-z0-9-]+/)
      if (!varMatch || varMatch[0] !== token.proposedVar) {
        check(false, `${ref}: final sentence's var is ${varMatch?.[0] ?? "(none)"}, expected ${token.proposedVar}`)
        continue
      }

      const oklchValues = [...last.matchAll(/oklch\([^)]*\)/g)].map((m) => m[0])
      const missing = []
      if (!oklchValues.includes(token.proposedLight)) missing.push(`light ${token.proposedLight}`)
      if (token.proposedLight !== token.proposedDark && !oklchValues.includes(token.proposedDark)) missing.push(`dark ${token.proposedDark}`)

      check(missing.length === 0, `${ref} (${originName} / ${token.proposedVar}) still matches its source token`, missing.length ? `missing ${missing.join(", ")} -- found ${JSON.stringify(oklchValues)}` : "")
    }
  } finally {
    await pool?.close()
  }
} finally {
  await rm(tmp, { recursive: true, force: true })
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
if (failed.length) {
  console.log("\nA review_prompt no longer matches the token it quotes. Failing checks:")
  failed.forEach((r) => console.log(`  - ${r.label}`))
  process.exitCode = 1
}
